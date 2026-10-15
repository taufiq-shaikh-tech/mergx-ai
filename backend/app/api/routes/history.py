from fastapi import APIRouter, Depends
from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.models import AnalysisJob, Finding, Project
from app.db.session import get_db
from app.schemas.auth import UserIdentity
from app.core.response import ok

router = APIRouter(prefix="/history", tags=["Scan History"])


@router.get(
    "",
    summary="List Scan History",
    description="Retrieves chronological scan audit records for the authenticated user.",
)
async def list_scan_history(
    current_user: UserIdentity = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    f_subquery = (
        select(Finding.job_id, func.count(Finding.id).label("issue_count"))
        .group_by(Finding.job_id)
        .subquery()
    )
    stmt = (
        select(
            AnalysisJob,
            Project.name.label("project_name"),
            func.coalesce(f_subquery.c.issue_count, 0).label("issues"),
        )
        .join(Project, AnalysisJob.project_id == Project.id)
        .outerjoin(f_subquery, AnalysisJob.id == f_subquery.c.job_id)
        .where(AnalysisJob.user_id == current_user.id)
        .order_by(desc(AnalysisJob.created_at))
    )
    res = await db.execute(stmt)
    rows = res.all()

    formatted = []
    for job, project_name, issues in rows:
        formatted.append({
            "id": job.id,
            "project": project_name,
            "type": job.scan_type or "Full Architecture Audit",
            "date": job.created_at.strftime("%b %d, %I:%M %p") if job.created_at else "Recently",
            "duration": f"{round(job.duration_seconds, 1)}s" if job.duration_seconds else "1m 12s",
            "status": "Completed" if job.status == "completed" else "Failed" if job.status == "failed" else "In Progress",
            "issues": issues,
            "score": job.score,
        })

    return ok(data=formatted)
