from datetime import datetime, timezone
import uuid
from typing import Any, List, Optional
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    status = Column(String(50), default="In Progress")  # Completed, In Progress, Failed
    technology = Column(JSON, default=list)  # ["React 19", "FastAPI", "PostgreSQL"]
    repo_url = Column(String(512), nullable=True)
    total_files = Column(Integer, default=0)
    total_lines = Column(Integer, default=0)
    issues_count = Column(Integer, default=0)
    health_score = Column(Integer, default=100)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    jobs = relationship("AnalysisJob", back_populates="project", cascade="all, delete-orphan", order_by="desc(AnalysisJob.created_at)")
    findings = relationship("Finding", back_populates="project", cascade="all, delete-orphan")
    dependencies = relationship("Dependency", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(String(64), primary_key=True, default=lambda: f"SCAN-{uuid.uuid4().hex[:6].upper()}")
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(String(128), index=True, nullable=False)
    status = Column(String(50), default="queued")  # queued, processing, completed, failed
    progress = Column(Integer, default=0)  # 0 to 100
    current_stage = Column(String(255), default="Initializing")
    stages = Column(JSON, default=list)
    logs = Column(JSON, default=list)
    error_message = Column(Text, nullable=True)
    score = Column(Integer, default=100)
    duration_seconds = Column(Float, default=0.0)
    scan_type = Column(String(100), default="Full Architecture Audit")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="jobs")
    findings = relationship("Finding", back_populates="job", cascade="all, delete-orphan")
    dependencies = relationship("Dependency", back_populates="job", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="job", cascade="all, delete-orphan")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(64), primary_key=True, default=lambda: f"FND-{uuid.uuid4().hex[:6].upper()}")
    job_id = Column(String(64), ForeignKey("analysis_jobs.id", ondelete="CASCADE"), index=True, nullable=False)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(String(128), index=True, nullable=False)
    rule_id = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)  # Integration, Security, Dependencies, Configuration
    severity = Column(String(20), nullable=False)  # Critical, High, Medium, Low, Info
    file_path = Column(String(512), nullable=False)
    line_number = Column(Integer, nullable=True)
    description = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    code_snippet = Column(Text, nullable=True)
    impact = Column(Text, nullable=True)
    confidence = Column(String(20), default="High")
    status = Column(String(20), default="open")  # open, resolved, ignored
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    job = relationship("AnalysisJob", back_populates="findings")
    project = relationship("Project", back_populates="findings")


class Dependency(Base):
    __tablename__ = "dependencies"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    job_id = Column(String(64), ForeignKey("analysis_jobs.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    version = Column(String(100), default="unknown")
    latest = Column(String(100), default="latest")
    type = Column(String(50), default="direct")  # direct, dev, peer
    status = Column(String(50), default="secure")  # secure, outdated, vulnerable
    cve = Column(String(100), nullable=True)
    license = Column(String(100), default="MIT")
    manifest_file = Column(String(255), default="")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="dependencies")
    job = relationship("AnalysisJob", back_populates="dependencies")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(64), primary_key=True, default=lambda: f"REP-{uuid.uuid4().hex[:4].upper()}")
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    job_id = Column(String(64), ForeignKey("analysis_jobs.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(String(128), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    project_name = Column(String(255), nullable=False)
    type = Column(String(50), default="Full Audit")  # Integration, Security, Dependencies, Full Audit
    status = Column(String(50), default="Generated")  # Generated, Pending Analysis
    issues = Column(Integer, default=0)
    score = Column(Integer, default=100)
    file_size = Column(String(50), default="1.2 MB")
    summary = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="reports")
    job = relationship("AnalysisJob", back_populates="reports")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(128), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    type = Column(String(50), default="system")  # system, analysis, security, team
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
