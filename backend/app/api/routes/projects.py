import asyncio
from datetime import datetime
import os
from pathlib import Path
import tempfile
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.models import AnalysisJob, Dependency, Project
from app.db.session import get_db
from app.schemas.auth import UserIdentity
from app.schemas.projects import ProjectCreate, ProjectResponse
from app.core.response import ok
from app.services.analysis_service import safe_extract_zip, execute_analysis_pipeline

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get(
    "",
    summary="List User Projects",
    description="Lists all code analysis projects belonging to the authenticated user.",
)
async def list_projects(
    current_user: UserIdentity = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Project).where(Project.user_id == current_user.id).order_by(desc(Project.created_at))
    res = await db.execute(stmt)
    projects = res.scalars().all()

    formatted = []
    for p in projects:
        formatted.append({
            "id": p.id,
            "name": p.name,
            "description": p.description or "",
            "status": p.status,
            "date": p.created_at.strftime("%b %d, %Y") if p.created_at else "Recently",
            "issues": p.issues_count,
            "technology": p.technology or [],
            "repoUrl": p.repo_url,
            "totalFiles": p.total_files,
            "totalLines": p.total_lines,
            "healthScore": p.health_score,
        })
    return ok(data=formatted)


@router.post(
    "",
    summary="Create New Project",
    description="Registers a new project repository or upload target for code analysis.",
)
async def create_project(
    payload: ProjectCreate,
    current_user: UserIdentity = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = Project(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description or "",
        technology=payload.technology or [],
        repo_url=payload.repo_url,
        status="In Progress",
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    return ok(data={
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "date": project.created_at.strftime("%b %d, %Y") if project.created_at else "Today",
        "issues": project.issues_count,
        "technology": project.technology or [],
        "repoUrl": project.repo_url,
    }, message="Project created successfully.")


@router.get(
    "/dependencies/all",
    summary="Get All Dependencies Across User Projects",
)
async def get_all_user_dependencies(
    current_user: UserIdentity = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Dependency)
        .join(Project, Dependency.project_id == Project.id)
        .where(Project.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    deps = res.scalars().all()
    return ok(data=[
        {
            "id": d.id,
            "name": d.name,
            "version": d.version,
            "latest": d.latest,
            "type": d.type,
            "status": d.status,
            "cve": d.cve,
            "license": d.license,
            "manifestFile": d.manifest_file,
        }
        for d in deps
    ])


@router.get(
    "/{project_id}",
    summary="Get Project Details",
    description="Retrieves metadata, branch status, and summary metrics for a specific project.",
)
async def get_project(
    project_id: str,
    current_user: UserIdentity = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    res = await db.execute(stmt)
    project = res.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    # Fetch latest scans for this project
    s_stmt = select(AnalysisJob).where(AnalysisJob.project_id == project.id).order_by(desc(AnalysisJob.created_at)).limit(5)
    s_res = await db.execute(s_stmt)
    scans = s_res.scalars().all()

    return ok(data={
        "id": project.id,
        "name": project.name,
        "description": project.description or "",
        "status": project.status,
        "date": project.created_at.strftime("%b %d, %Y") if project.created_at else "Recently",
        "issues": project.issues_count,
        "technology": project.technology or [],
        "repoUrl": project.repo_url,
        "totalFiles": project.total_files,
        "totalLines": project.total_lines,
        "healthScore": project.health_score,
        "recentScans": [
            {
                "id": s.id,
                "status": s.status,
                "score": s.score,
                "date": s.created_at.strftime("%b %d, %H:%M") if s.created_at else "Recently",
                "duration": f"{int(s.duration_seconds)}s" if s.duration_seconds else "1m",
            }
            for s in scans
        ],
    })


@router.post(
    "/upload",
    summary="Upload Project ZIP Archive",
    description="Safely receives, validates, and extracts a ZIP archive, initiating an asynchronous multi-layer inspection.",
)
async def upload_project_zip(
    file: UploadFile = File(...),
    projectName: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user: UserIdentity = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate filename
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a .ZIP archive.",
        )

    # Read archive bytes
    zip_bytes = await file.read()
    if not zip_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file archive is empty.",
        )

    # Safe isolated temporary extraction directory
    temp_dir = Path(tempfile.mkdtemp(prefix="mergex_scan_"))

    try:
        file_count = safe_extract_zip(zip_bytes, temp_dir)
    except HTTPException:
        # Cleanup directory on validation failure
        if temp_dir.exists():
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise
    except Exception as e:
        if temp_dir.exists():
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract project ZIP archive: {str(e)}",
        )

    # Derive project name from form or ZIP file basename
    clean_name = projectName.strip() if projectName else Path(file.filename).stem.replace("_", " ").title()
    if not clean_name:
        clean_name = "Imported Project"

    # Create Project in DB
    project = Project(
        user_id=current_user.id,
        name=clean_name,
        description=description or f"Uploaded archive '{file.filename}' ({len(zip_bytes) // 1024} KB).",
        status="In Progress",
        total_files=file_count,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    # Create AnalysisJob in DB
    job = AnalysisJob(
        project_id=project.id,
        user_id=current_user.id,
        status="queued",
        progress=5,
        current_stage="Queueing for multi-layer inspection",
        scan_type="Full Architecture Audit",
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Launch asynchronous pipeline
    asyncio.create_task(
        execute_analysis_pipeline(
            job_id=job.id,
            project_id=project.id,
            user_id=current_user.id,
            extract_dir=temp_dir,
        )
    )

    return ok(data={
        "projectId": project.id,
        "jobId": job.id,
        "name": project.name,
        "status": "queued",
        "fileCount": file_count,
    }, message="Project archive uploaded successfully. Analysis job started.")


@router.get(
    "/{project_id}/dependencies",
    summary="Get Project Dependencies Inventory",
)
async def get_project_dependencies(
    project_id: str,
    current_user: UserIdentity = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify ownership
    p_stmt = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    p_res = await db.execute(p_stmt)
    project = p_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    d_stmt = select(Dependency).where(Dependency.project_id == project_id)
    d_res = await db.execute(d_stmt)
    deps = d_res.scalars().all()

    return ok(data=[
        {
            "id": d.id,
            "name": d.name,
            "version": d.version,
            "latest": d.latest,
            "type": d.type,
            "status": d.status,
            "cve": d.cve,
            "license": d.license,
            "manifestFile": d.manifest_file,
        }
        for d in deps
    ])
