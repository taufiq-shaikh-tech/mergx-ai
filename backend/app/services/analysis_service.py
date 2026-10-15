import asyncio
from datetime import datetime, timezone
import io
import logging
from pathlib import Path
import shutil
import tempfile
import time
from typing import Any, Dict, List
import uuid
import zipfile
from fastapi import HTTPException, status
from sqlalchemy import select

from app.analyzers.structure import analyze_structure
from app.analyzers.dependencies import analyze_dependencies
from app.analyzers.api_integration import analyze_api_integration
from app.analyzers.security_checks import analyze_security
from app.db.models import AnalysisJob, Dependency, Finding, Notification, Project, Report
from app.db.session import async_session_factory

logger = logging.getLogger(__name__)

MAX_ZIP_SIZE = 100 * 1024 * 1024  # 100 MB
MAX_FILES = 5000
MAX_UNCOMPRESSED_SIZE = 250 * 1024 * 1024  # 250 MB
MAX_SINGLE_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


def safe_extract_zip(zip_bytes: bytes, destination_dir: Path) -> int:
    """
    Safely validates and extracts a ZIP archive into destination_dir.
    Guards against:
    - Zip Slip / path traversal attacks (canonical path resolution)
    - Zip bombs (file count and total uncompressed size limits)
    - Symlinks and unsafe archive entries
    - Malformed or password-protected archives
    """
    if len(zip_bytes) > MAX_ZIP_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Archive exceeds maximum allowable size ({MAX_ZIP_SIZE // (1024 * 1024)} MB).",
        )

    # Validate ZIP magic bytes
    if not zip_bytes.startswith(b"PK\x03\x04"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid ZIP archive format.",
        )

    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            # Check for password encryption
            for info in zf.infolist():
                if info.flag_bits & 0x1:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Encrypted or password-protected ZIP archives are not supported.",
                    )

            entries = zf.infolist()
            if len(entries) > MAX_FILES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Archive contains too many files ({len(entries)} > {MAX_FILES}).",
                )

            total_uncompressed = sum(entry.file_size for entry in entries)
            if total_uncompressed > MAX_UNCOMPRESSED_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Total uncompressed size exceeds allowable security limits.",
                )

            dest_resolved = destination_dir.resolve()
            extracted_count = 0

            for entry in entries:
                # Disallow symlinks
                if (entry.external_attr >> 16) & 0o120000 == 0o120000:
                    continue

                if entry.file_size > MAX_SINGLE_FILE_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Archive contains file '{entry.filename}' exceeding size limit.",
                    )

                # Zip slip prevention
                target_path = (destination_dir / entry.filename).resolve()
                try:
                    target_path.relative_to(dest_resolved)
                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Archive contains illegal directory traversal entry (Zip Slip attempt).",
                    )

                zf.extract(entry, destination_dir)
                if not entry.is_dir():
                    extracted_count += 1

            return extracted_count

    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted or unreadable ZIP archive.",
        )


async def execute_analysis_pipeline(
    job_id: str,
    project_id: str,
    user_id: str,
    extract_dir: Path,
) -> None:
    """
    Executes the multi-stage analysis pipeline asynchronously.
    Updates stages, progress, and logs in the database.
    """
    start_time = time.time()
    logger.info("Starting analysis job %s for project %s...", job_id, project_id)

    stages = [
        {"id": "unpack", "name": "AST Parsing & File Tree Indexing", "status": "pending"},
        {"id": "deps", "name": "Dependency Health & Conflict Check", "status": "pending"},
        {"id": "routes", "name": "Frontend Route Contract Extraction", "status": "pending"},
        {"id": "security", "name": "OWASP Vulnerability & Secret Audit", "status": "pending"},
        {"id": "complete", "name": "Final Health Scoring & Report Generation", "status": "pending"},
    ]
    logs: List[str] = [
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Initializing MergeX multi-layer validation engine...",
    ]

    async def update_job(status_val: str, progress_val: int, stage_idx: int, log_msg: str):
        stages[stage_idx]["status"] = "running"
        logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] {log_msg}")

        async with async_session_factory() as session:
            stmt = select(AnalysisJob).where(AnalysisJob.id == job_id)
            res = await session.execute(stmt)
            job = res.scalar_one_or_none()
            if job:
                job.status = status_val
                job.progress = progress_val
                job.current_stage = stages[stage_idx]["name"]
                job.stages = stages
                job.logs = logs
                await session.commit()

    try:
        # Stage 0: Unpack & Structure
        await update_job("processing", 15, 0, "Inspecting project tree, file extensions, and entry points...")
        structure_results = analyze_structure(extract_dir)
        stages[0]["status"] = "completed"

        # Stage 1: Dependencies
        await update_job(
            "processing",
            35,
            1,
            f"Indexed {structure_results['total_files']} files ({structure_results['total_lines']} LOC). Parsing package manifests...",
        )
        deps_list, dep_findings, detected_techs = analyze_dependencies(extract_dir)
        stages[1]["status"] = "completed"

        # Stage 2: Route & Contract Matching
        await update_job(
            "processing",
            60,
            2,
            f"Extracted {len(deps_list)} dependencies. Matching frontend API calls with backend routes...",
        )
        integration_findings = analyze_api_integration(extract_dir)
        stages[2]["status"] = "completed"

        # Stage 3: Security & Secrets
        await update_job(
            "processing",
            85,
            3,
            f"Cross-referenced endpoints. Running rule-based static security checks...",
        )
        security_findings = analyze_security(extract_dir)
        stages[3]["status"] = "completed"

        # Stage 4: Scoring and Persistence
        await update_job(
            "processing",
            95,
            4,
            "Compiling findings and calculating overall architecture score...",
        )

        all_findings = dep_findings + integration_findings + security_findings

        # Calculate score
        score = 100
        for f in all_findings:
            sev = f.get("severity")
            if sev == "Critical":
                score -= 15
            elif sev == "High":
                score -= 8
            elif sev == "Medium":
                score -= 4
            elif sev == "Low":
                score -= 1
        score = max(15, min(100, score))

        # Merge technologies
        combined_tech = set(structure_results.get("technologies", [])) | detected_techs
        tech_list = sorted(list(combined_tech)) if combined_tech else ["Software Codebase"]

        duration = round(time.time() - start_time, 2)
        stages[4]["status"] = "completed"
        logs.append(
            f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Analysis completed in {duration}s. Score: {score}/100. Issues: {len(all_findings)}."
        )

        # Persist everything in DB
        async with async_session_factory() as session:
            # 1. Update Project
            p_stmt = select(Project).where(Project.id == project_id)
            p_res = await session.execute(p_stmt)
            project = p_res.scalar_one_or_none()
            if project:
                project.status = "Completed"
                project.technology = tech_list
                project.total_files = structure_results["total_files"]
                project.total_lines = structure_results["total_lines"]
                project.issues_count = len(all_findings)
                project.health_score = score

            # 2. Update Job
            j_stmt = select(AnalysisJob).where(AnalysisJob.id == job_id)
            j_res = await session.execute(j_stmt)
            job = j_res.scalar_one_or_none()
            if job:
                job.status = "completed"
                job.progress = 100
                job.current_stage = "Completed"
                job.stages = stages
                job.logs = logs
                job.score = score
                job.duration_seconds = duration
                job.completed_at = datetime.now(timezone.utc)

            # 3. Insert Findings
            for finding_data in all_findings:
                cat_prefix = finding_data["category"][:3].upper()
                finding_id = f"{cat_prefix}-{uuid.uuid4().hex[:8]}"
                f_model = Finding(
                    id=finding_id,
                    job_id=job_id,
                    project_id=project_id,
                    user_id=user_id,
                    rule_id=finding_data["rule_id"],
                    title=finding_data["title"],
                    category=finding_data["category"],
                    severity=finding_data["severity"],
                    file_path=finding_data["file_path"],
                    line_number=finding_data.get("line_number"),
                    description=finding_data["description"],
                    recommendation=finding_data["recommendation"],
                    code_snippet=finding_data.get("code_snippet"),
                    impact=finding_data.get("impact"),
                    confidence=finding_data.get("confidence", "High"),
                )
                session.add(f_model)

            # 4. Insert Dependencies
            for d in deps_list:
                dep_model = Dependency(
                    project_id=project_id,
                    job_id=job_id,
                    name=d["name"],
                    version=d["version"],
                    latest=d["latest"],
                    type=d["type"],
                    status=d["status"],
                    license=d["license"],
                    manifest_file=d["manifest_file"],
                )
                session.add(dep_model)

            # 5. Insert Default Report
            proj_name = project.name if project else "Project"
            report_model = Report(
                project_id=project_id,
                job_id=job_id,
                user_id=user_id,
                name=f"Full Architecture Audit — {proj_name}",
                project_name=proj_name,
                type="Full Audit",
                status="Generated",
                issues=len(all_findings),
                score=score,
                file_size=f"{round(0.8 + (len(all_findings) * 0.1), 1)} MB",
                summary={
                    "total_files": structure_results["total_files"],
                    "total_lines": structure_results["total_lines"],
                    "issues": len(all_findings),
                    "score": score,
                },
            )
            session.add(report_model)

            # 6. Insert Real Notification
            notif = Notification(
                user_id=user_id,
                title=f"Scan Completed for {proj_name}",
                description=f"Automated audit finished with score {score}/100 and {len(all_findings)} flagged items.",
                type="analysis",
            )
            session.add(notif)

            await session.commit()
            logger.info("Analysis job %s successfully completed and persisted.", job_id)

    except Exception as e:
        logger.exception("Analysis pipeline failed for job %s: %s", job_id, str(e))
        async with async_session_factory() as session:
            j_stmt = select(AnalysisJob).where(AnalysisJob.id == job_id)
            j_res = await session.execute(j_stmt)
            job = j_res.scalar_one_or_none()
            if job:
                job.status = "failed"
                job.error_message = str(e)
                logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] [ERROR] Pipeline failure: {str(e)}")
                job.logs = logs
                await session.commit()

            p_stmt = select(Project).where(Project.id == project_id)
            p_res = await session.execute(p_stmt)
            project = p_res.scalar_one_or_none()
            if project:
                project.status = "Failed"
                await session.commit()

    finally:
        # Clean up temporary extracted folder
        if extract_dir.exists():
            shutil.rmtree(extract_dir, ignore_errors=True)
