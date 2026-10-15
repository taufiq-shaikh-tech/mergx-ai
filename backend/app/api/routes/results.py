from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.models import AnalysisJob, Finding, Project
from app.db.session import get_db
from app.schemas.auth import UserIdentity
from app.core.response import ok

router = APIRouter(prefix="/results", tags=["Analysis Results"])


class FindingStatusUpdate(BaseModel):
    status: str  # open, resolved, ignored


@router.get(
    "",
    summary="List All User Findings",
    description="Retrieves findings across all user projects filtered by category or severity.",
)
async def list_all_findings(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    current_user: UserIdentity = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Finding).where(Finding.user_id == current_user.id)
    if category and category != "All":
        query = query.where(Finding.category == category)
    if severity and severity != "All":
        query = query.where(Finding.severity == severity)
    query = query.order_by(Finding.created_at.desc())
    
    res = await db.execute(query)
    findings = res.scalars().all()
    
    formatted = [
        {
            "id": f.id,
            "ruleId": f.rule_id,
            "title": f.title,
            "category": f.category,
            "severity": f.severity,
            "filePath": f.file_path,
            "lineNumber": f.line_number,
            "description": f.description,
            "recommendation": f.recommendation,
            "codeSnippet": f.code_snippet,
            "impact": f.impact,
            "confidence": f.confidence,
            "status": f.status,
            "jobId": f.job_id,
            "projectId": f.project_id,
        }
        for f in findings
    ]
    return ok(data=formatted)


@router.get(
    "/{job_id}",
    summary="Get Analysis Results & Findings",
    description="Retrieves granular findings (Integration, Security, Dependencies, Configuration) and metrics for a scan.",
)
async def get_results(
    job_id: str,
    current_user: UserIdentity = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AnalysisJob).where(AnalysisJob.id == job_id, AnalysisJob.user_id == current_user.id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis job '{job_id}' not found.",
        )

    p_stmt = select(Project).where(Project.id == job.project_id)
    p_res = await db.execute(p_stmt)
    project = p_res.scalar_one_or_none()
    project_name = project.name if project else "Project"

    # Fetch findings
    f_stmt = select(Finding).where(Finding.job_id == job.id).order_by(Finding.id)
    f_res = await db.execute(f_stmt)
    findings = f_res.scalars().all()

    formatted_findings = [
        {
            "id": f.id,
            "ruleId": f.rule_id,
            "title": f.title,
            "category": f.category,
            "severity": f.severity,
            "filePath": f.file_path,
            "lineNumber": f.line_number,
            "description": f.description,
            "recommendation": f.recommendation,
            "codeSnippet": f.code_snippet,
            "impact": f.impact,
            "confidence": f.confidence,
            "status": f.status,
        }
        for f in findings
    ]

    # Category summaries
    category_counts = {
        "Integration": sum(1 for f in findings if f.category == "Integration"),
        "Security": sum(1 for f in findings if f.category == "Security"),
        "Dependencies": sum(1 for f in findings if f.category == "Dependencies"),
        "Configuration": sum(1 for f in findings if f.category == "Configuration"),
    }

    severity_counts = {
        "Critical": sum(1 for f in findings if f.severity == "Critical"),
        "High": sum(1 for f in findings if f.severity == "High"),
        "Medium": sum(1 for f in findings if f.severity == "Medium"),
        "Low": sum(1 for f in findings if f.severity == "Low"),
    }

    return ok(data={
        "jobId": job.id,
        "projectId": job.project_id,
        "projectName": project_name,
        "status": job.status,
        "score": job.score,
        "duration": f"{round(job.duration_seconds, 1)}s" if job.duration_seconds else "1m",
        "date": job.created_at.strftime("%b %d, %Y - %H:%M") if job.created_at else "Recently",
        "findings": formatted_findings,
        "totalIssues": len(findings),
        "categoryCounts": category_counts,
        "severityCounts": severity_counts,
        "technologies": project.technology if project else [],
        "totalFiles": project.total_files if project else 0,
        "totalLines": project.total_lines if project else 0,
    })


@router.patch(
    "/findings/{finding_id}/status",
    summary="Update Finding Status",
    description="Updates a finding status (open, resolved, ignored).",
)
async def update_finding_status(
    finding_id: str,
    payload: FindingStatusUpdate,
    current_user: UserIdentity = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Finding).where(Finding.id == finding_id, Finding.user_id == current_user.id)
    res = await db.execute(stmt)
    finding = res.scalar_one_or_none()

    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Finding '{finding_id}' not found.",
        )

    finding.status = payload.status
    await db.commit()
    return ok(data={"id": finding.id, "status": finding.status}, message="Finding status updated.")
