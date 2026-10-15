from datetime import datetime, timezone
import io
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, patch
import zipfile
import pytest
from app.analyzers.dependencies import analyze_dependencies
from app.analyzers.security_checks import analyze_security
from app.analyzers.structure import analyze_structure
from app.schemas.auth import UserIdentity
from app.services.analysis_service import safe_extract_zip


def create_sample_zip() -> bytes:
    """Helper that generates an in-memory sample project ZIP archive for testing."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        # 1. package.json
        zf.writestr(
            "package.json",
            '{\n  "name": "sample-app",\n  "dependencies": {\n    "react": "^19.0.0",\n    "loose-pkg": "*"\n  }\n}\n',
        )
        # 2. main.py with hardcoded AWS key and dangerous eval
        zf.writestr(
            "backend/main.py",
            'aws_key = "AKIA1234567890ABCDEF"\ndef run_dynamic(cmd):\n    eval(cmd)\n',
        )
        # 3. frontend component with API call and hardcoded URL
        zf.writestr(
            "frontend/App.tsx",
            'export function App() {\n  const url = "http://localhost:5000/api/users";\n  fetch("/api/v1/missing-route");\n  return <div>App</div>;\n}\n',
        )
    return buf.getvalue()


def test_structure_analyzer(tmp_path):
    # Setup files in tmp_path
    (tmp_path / "main.py").write_text("print('hello')\n", encoding="utf-8")
    (tmp_path / "App.tsx").write_text("export const A = 1;\n", encoding="utf-8")

    result = analyze_structure(tmp_path)
    assert result["total_files"] == 2
    assert "Python" in result["languages"]
    assert "TypeScript (React)" in result["languages"]


def test_dependency_analyzer(tmp_path):
    pkg_json = tmp_path / "package.json"
    pkg_json.write_text(
        '{"dependencies": {"react": "^19.0.0", "unpinned-lib": "*"}}',
        encoding="utf-8",
    )

    deps, findings, frameworks = analyze_dependencies(tmp_path)
    assert len(deps) == 2
    assert "React" in frameworks
    assert any(f["rule_id"] == "DEP-UNPINNED-VERSION" for f in findings)


def test_security_analyzer(tmp_path):
    src_file = tmp_path / "secrets.py"
    src_file.write_text(
        'aws_key = "AKIA1234567890ABCDEF"\neval("2 + 2")\n',
        encoding="utf-8",
    )

    findings = analyze_security(tmp_path)
    assert any(f["rule_id"] == "SEC-HARDCODED-AWS-KEY" for f in findings)
    assert any(f["rule_id"] == "SEC-UNSAFE-EVAL" for f in findings)


def test_safe_extract_zip(tmp_path):
    zip_bytes = create_sample_zip()
    extract_target = tmp_path / "extracted"
    extract_target.mkdir()

    count = safe_extract_zip(zip_bytes, extract_target)
    assert count == 3
    assert (extract_target / "package.json").exists()
    assert (extract_target / "backend" / "main.py").exists()


def test_upload_rejects_non_zip(client):
    mock_user = UserIdentity(
        id="usr_test_upload",
        email="test@mergex.ai",
        role="authenticated",
    )

    with patch("app.core.security.verify_supabase_token", new=AsyncMock(return_value=mock_user)):
        files = {"file": ("test.txt", b"plain text content", "text/plain")}
        headers = {"Authorization": "Bearer mock-token"}
        response = client.post("/api/v1/projects/upload", files=files, headers=headers)
        assert response.status_code == 400
        data = response.json()
        assert "Invalid file format" in data["error"]["message"]


def test_upload_and_pipeline_execution(client):
    mock_user = UserIdentity(
        id="usr_test_pipeline",
        email="pipeline@mergex.ai",
        role="authenticated",
    )

    with patch("app.core.security.verify_supabase_token", new=AsyncMock(return_value=mock_user)):
        zip_bytes = create_sample_zip()
        files = {"file": ("project.zip", zip_bytes, "application/zip")}
        data = {"projectName": "Pipeline Test App"}
        headers = {"Authorization": "Bearer mock-token"}

        response = client.post(
            "/api/v1/projects/upload",
            files=files,
            data=data,
            headers=headers,
        )
        assert response.status_code == 200
        res_data = response.json()
        assert res_data["success"] is True
        project_id = res_data["data"]["projectId"]
        job_id = res_data["data"]["jobId"]
        assert project_id is not None
        assert job_id is not None
