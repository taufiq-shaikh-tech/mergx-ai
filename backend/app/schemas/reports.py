from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

ReportType = Literal["Integration", "Security", "Dependencies", "Full Audit"]
ReportStatus = Literal["Generated", "Pending Analysis"]


class ReportResponse(BaseModel):
    id: str = Field(..., description="Unique report ID, e.g. REP-401")
    name: str = Field(..., description="Report title")
    project: str = Field(..., description="Project name")
    type: ReportType = Field(..., description="Report category")
    date: str = Field(..., description="Formatted generation date string")
    status: ReportStatus = Field("Generated", description="Report generation status")
    issues: int = Field(0, description="Total issues included")
    score: int = Field(100, ge=0, le=100, description="Health score")
    file_size: str = Field("1.0 MB", alias="fileSize", description="Size of the exportable file")
    download_url: Optional[str] = Field(None, alias="downloadUrl", description="Direct download link")

    model_config = ConfigDict(populate_by_name=True)
