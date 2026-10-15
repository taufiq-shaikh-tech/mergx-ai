from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict


class ScanRecordResponse(BaseModel):
    id: str = Field(..., description="Unique scan ID, e.g. SCAN-1042")
    project: str = Field(..., description="Project name")
    type: str = Field(..., description="Scan type description")
    date: str = Field(..., description="Human-formatted scan date string")
    duration: str = Field(..., description="Execution duration string, e.g. 2m 34s")
    status: Literal["Completed", "Failed", "In Progress"] = Field(..., description="Status")
    issues: int = Field(0, description="Total issues detected in this scan")
    score: Optional[int] = Field(None, ge=0, le=100, description="Score 0-100")

    model_config = ConfigDict(populate_by_name=True)
