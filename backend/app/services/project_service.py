from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Project


async def get_user_projects(session: AsyncSession, user_id: str) -> List[Project]:
    stmt = select(Project).where(Project.user_id == user_id).order_by(desc(Project.created_at))
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_project_by_id(session: AsyncSession, project_id: str, user_id: str) -> Optional[Project]:
    stmt = select(Project).where(Project.id == project_id, Project.user_id == user_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def create_user_project(
    session: AsyncSession,
    user_id: str,
    name: str,
    description: str = "",
    technology: Optional[List[str]] = None,
    repo_url: Optional[str] = None,
) -> Project:
    project = Project(
        user_id=user_id,
        name=name,
        description=description,
        technology=technology or [],
        repo_url=repo_url,
        status="In Progress",
    )
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return project
