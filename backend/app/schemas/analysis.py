from datetime import datetime, timezone
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

Severity = Literal["Critical", "High", "Medium", "Low"]
AnalysisCategory = Literal["Integration", "Security", "Dependencies", "Configuration"]
JobStatus = Literal["pending", "running", "completed", "failed"]


class FindingSchema(BaseModel):
    id: str = Field(..., description="Unique finding ID, e.g. INT-101 or SEC-102")
    title: str = Field(..., description="Issue title")
    category: AnalysisCategory = Field(..., description="Category: Integration, Security, Dependencies, Configuration")
    severity: Severity = Field(..., description="Severity level: Critical, High, Medium, Low")
    file_path: str = Field(..., alias="filePath", description="Relative file path where the issue was detected")
    line_number: Optional[int] = Field(None, alias="lineNumber", description="Line number if available")
    description: str = Field(..., description="Explanation of the discrepancy or vulnerability")
    recommendation: str = Field(..., description="Recommended fix or actionable guidance")
    code_snippet: Optional[str] = Field(None, alias="codeSnippet", description="Relevant source code snippet")
    impact: Optional[str] = Field(None, description="Systemic or security impact")

    model_config = ConfigDict(populate_by_name=True)


class AnalysisStageStatus(BaseModel):
    id: str
    name: str
    status: Literal["pending", "running", "completed", "failed"]


class AnalysisJobCreate(BaseModel):
    project_id: str = Field(..., description="Project ID to analyze")
    project_name: Optional[str] = Field(None, description="Optional project name")
    analysis_types: List[str] = Field(
        default=["integration", "security", "dependencies"],
        description="Analysis modules to run",
    )


class AnalysisProgressResponse(BaseModel):
    job_id: str = Field(..., description="Analysis job ID, e.g. SCAN-1043")
    project_id: str
    project_name: str
    progress: int = Field(..., ge=0, le=100, description="Percentage progress 0-100")
    status: JobStatus = Field(..., description="Current job status")
    current_stage: str = Field(..., description="Current processing stage")
    stages: List[AnalysisStageStatus] = Field(default_factory=list)
    logs: List[str] = Field(default_factory=list)


class AnalysisResultsResponse(BaseModel):
    job_id: str
    project_id: str
    project_name: str
    status: JobStatus
    score: int = Field(..., ge=0, le=100, description="Overall health score (0-100)")
    scanned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    findings: List[FindingSchema] = Field(default_factory=list)
    summary: dict = Field(default_factory=dict)
