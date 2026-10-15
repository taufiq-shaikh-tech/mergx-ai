from fastapi import APIRouter, Depends
from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.models import AnalysisJob, Finding, Project
from app.db.session import get_db
from app.schemas.auth import UserIdentity
from app.core.response import ok

router = APIRouter(prefix="/stats", tags=["Dashboard Statistics"])


@router.get(
    "",
    summary="Get Dashboard Statistics",
    description="Calculates real aggregate health metrics, issue counts, and recent activity from persisted records.",
)
async def get_dashboard_stats(
    current_user: UserIdentity = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Total projects
    p_count_stmt = select(func.count(Project.id)).where(Project.user_id == current_user.id)
    total_projects = (await db.execute(p_count_stmt)).scalar() or 0

    # Total scans
    s_count_stmt = select(func.count(AnalysisJob.id)).where(AnalysisJob.user_id == current_user.id)
    total_scans = (await db.execute(s_count_stmt)).scalar() or 0

    # Total open findings
    f_count_stmt = select(func.count(Finding.id)).where(Finding.user_id == current_user.id, Finding.status == "open")
    open_issues = (await db.execute(f_count_stmt)).scalar() or 0

    # Critical findings
    crit_count_stmt = select(func.count(Finding.id)).where(Finding.user_id == current_user.id, Finding.severity == "Critical", Finding.status == "open")
    critical_issues = (await db.execute(crit_count_stmt)).scalar() or 0

    # Average score across completed scans
    avg_score_stmt = select(func.avg(AnalysisJob.score)).where(AnalysisJob.user_id == current_user.id, AnalysisJob.status == "completed")
    avg_score_val = (await db.execute(avg_score_stmt)).scalar()
    avg_score = round(float(avg_score_val), 1) if avg_score_val is not None else None

    # Recent scans
    recent_scans_stmt = (
        select(AnalysisJob, Project.name.label("project_name"))
        .join(Project, AnalysisJob.project_id == Project.id)
        .where(AnalysisJob.user_id == current_user.id)
        .order_by(desc(AnalysisJob.created_at))
        .limit(5)
    )
    recent_scans = (await db.execute(recent_scans_stmt)).all()

    # Recent projects
    recent_projects_stmt = (
        select(Project)
        .where(Project.user_id == current_user.id)
        .order_by(desc(Project.created_at))
        .limit(4)
    )
    recent_projects = (await db.execute(recent_projects_stmt)).scalars().all()

    return ok(data={
        "totalProjects": total_projects,
        "totalScans": total_scans,
        "openIssues": open_issues,
        "criticalIssues": critical_issues,
        "averageScore": avg_score,
        "recentProjects": [
            {
                "id": p.id,
                "name": p.name,
                "status": p.status,
                "issues": p.issues_count,
                "technology": p.technology or [],
                "date": p.created_at.strftime("%b %d, %Y") if p.created_at else "Recently",
            }
            for p in recent_projects
        ],
        "recentActivity": [
            {
                "id": job.id,
                "title": f"Scan {job.id} for {proj_name}",
                "description": f"Status: {job.status.title()} — Score: {job.score}/100",
                "time": job.created_at.strftime("%b %d, %I:%M %p") if job.created_at else "Recently",
                "status": job.status,
            }
            for job, proj_name in recent_scans
        ],
    })
