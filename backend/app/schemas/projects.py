from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Project repository/workspace name")
    description: str = Field("", max_length=500, description="Brief description of the project")
    technology: List[str] = Field(default_factory=list, description="Technologies detected or configured (e.g. React, FastAPI)")
    repo_url: Optional[str] = Field(None, alias="repoUrl", description="Optional git repository URL")

    model_config = ConfigDict(populate_by_name=True)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    technology: Optional[List[str]] = None
    repo_url: Optional[str] = Field(None, alias="repoUrl")
    status: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class ProjectResponse(ProjectBase):
    id: str = Field(..., description="Unique project identifier (e.g. MX-001 or UUID)")
    status: str = Field("In Progress", description="Status: 'Completed' | 'In Progress' | 'Failed'")
    date: str = Field(..., description="Display date string matching frontend format (e.g. Oct 14, 2026)")
    issues: int = Field(0, description="Total detected issues count")
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True)
