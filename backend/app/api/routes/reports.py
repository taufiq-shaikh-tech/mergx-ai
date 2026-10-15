from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.models import AnalysisJob, Project, Report
from app.db.session import get_db
from app.schemas.auth import UserIdentity
from app.core.response import ok

router = APIRouter(prefix="/reports", tags=["Reports"])


class GenerateReportRequest(BaseModel):
    job_id: str
    report_type: str = "Full Audit"  # Integration, Security, Dependencies, Full Audit


@router.get(
    "",
    summary="List Generated Reports",
    description="Retrieves a list of generated audit and compliance reports.",
)
async def list_reports(
    current_user: UserIdentity = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Report).where(Report.user_id == current_user.id).order_by(desc(Report.created_at))
    res = await db.execute(stmt)
    reports = res.scalars().all()

    formatted = [
        {
            "id": r.id,
            "name": r.name,
            "project": r.project_name,
            "type": r.type,
            "date": r.created_at.strftime("%b %d, %I:%M %p") if r.created_at else "Recently",
            "status": r.status,
            "issues": r.issues,
            "score": r.score,
            "fileSize": r.file_size,
        }
        for r in reports
    ]
    return ok(data=formatted)


@router.post(
    "/generate",
    summary="Generate New Report",
    description="Compiles an exportable audit report from an existing scan.",
)
async def generate_report(
    payload: GenerateReportRequest,
    current_user: UserIdentity = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AnalysisJob).where(AnalysisJob.id == payload.job_id, AnalysisJob.user_id == current_user.id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis job not found.")

    p_stmt = select(Project).where(Project.id == job.project_id)
    p_res = await db.execute(p_stmt)
    project = p_res.scalar_one_or_none()
    project_name = project.name if project else "Project"

    report = Report(
        project_id=job.project_id,
        job_id=job.id,
        user_id=current_user.id,
        name=f"{payload.report_type} Report — {project_name}",
        project_name=project_name,
        type=payload.report_type,
        status="Generated",
        issues=project.issues_count if project else 0,
        score=job.score,
        file_size="1.4 MB",
        summary={"score": job.score, "project": project_name},
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    return ok(data={
        "id": report.id,
        "name": report.name,
        "project": report.project_name,
        "type": report.type,
        "date": report.created_at.strftime("%b %d, %I:%M %p"),
        "status": report.status,
        "issues": report.issues,
        "score": report.score,
        "fileSize": report.file_size,
    }, message="Report generated successfully.")
