from unittest.mock import AsyncMock, patch
import pytest
from app.schemas.auth import UserIdentity
from tests.test_analysis_pipeline import create_sample_zip


def test_user_data_isolation_and_workflow(client):
    user_a = UserIdentity(
        id="usr_tenant_alice",
        email="alice@company.com",
        role="authenticated",
    )
    user_b = UserIdentity(
        id="usr_tenant_bob",
        email="bob@company.com",
        role="authenticated",
    )

    # 1. User A uploads a real project
    with patch("app.core.security.verify_supabase_token", new=AsyncMock(return_value=user_a)):
        zip_bytes = create_sample_zip()
        files = {"file": ("alice_app.zip", zip_bytes, "application/zip")}
        data = {"projectName": "Alice Service", "description": "Alice private repo"}
        res = client.post(
            "/api/v1/projects/upload",
            files=files,
            data=data,
            headers={"Authorization": "Bearer alice-token"},
        )
        assert res.status_code == 200
        alice_data = res.json()["data"]
        alice_project_id = alice_data["projectId"]
        alice_job_id = alice_data["jobId"]
        assert alice_project_id is not None
        assert alice_job_id is not None

        # 2. User A can retrieve her project
        res_proj = client.get(
            f"/api/v1/projects/{alice_project_id}",
            headers={"Authorization": "Bearer alice-token"},
        )
        assert res_proj.status_code == 200
        assert res_proj.json()["data"]["name"] == "Alice Service"

        # Wait for background pipeline to complete
        import time
        for _ in range(50):
            res_prog = client.get(
                f"/api/v1/analysis/{alice_job_id}",
                headers={"Authorization": "Bearer alice-token"},
            )
            if res_prog.status_code == 200 and res_prog.json()["data"]["status"] == "completed":
                break
            time.sleep(0.1)

        # 3. User A checks analysis results
        res_results = client.get(
            f"/api/v1/analysis/{alice_job_id}/results",
            headers={"Authorization": "Bearer alice-token"},
        )
        assert res_results.status_code == 200
        findings = res_results.json()["data"]["findings"]
        assert len(findings) > 0
        first_finding_id = findings[0]["id"]

        # 4. User A toggles status of a finding to resolved
        res_patch = client.patch(
            f"/api/v1/results/findings/{first_finding_id}/status",
            json={"status": "resolved"},
            headers={"Authorization": "Bearer alice-token"},
        )
        assert res_patch.status_code == 200
        assert res_patch.json()["data"]["status"] == "resolved"

        # 5. User A checks dashboard stats
        res_stats = client.get(
            "/api/v1/stats",
            headers={"Authorization": "Bearer alice-token"},
        )
        assert res_stats.status_code == 200
        stats = res_stats.json()["data"]
        assert stats["totalProjects"] >= 1
        assert stats["totalScans"] >= 1

        # 6. User A checks scan history
        res_hist = client.get(
            "/api/v1/history",
            headers={"Authorization": "Bearer alice-token"},
        )
        assert res_hist.status_code == 200
        assert len(res_hist.json()["data"]) >= 1

        # 7. User A checks reports
        res_reports = client.get(
            "/api/v1/reports",
            headers={"Authorization": "Bearer alice-token"},
        )
        assert res_reports.status_code == 200
        assert len(res_reports.json()["data"]) >= 1

        # 8. User A checks notifications
        res_notif = client.get(
            "/api/v1/notifications",
            headers={"Authorization": "Bearer alice-token"},
        )
        assert res_notif.status_code == 200
        notifications = res_notif.json()["data"]
        assert len(notifications) >= 1
        notif_id = notifications[0]["id"]

        # 9. Mark notification as read
        res_read = client.patch(
            f"/api/v1/notifications/{notif_id}/read",
            headers={"Authorization": "Bearer alice-token"},
        )
        assert res_read.status_code == 200
        assert res_read.json()["data"]["read"] is True

    # 10. User B should NOT see User A's project (Tenant Isolation Verification)
    with patch("app.core.security.verify_supabase_token", new=AsyncMock(return_value=user_b)):
        # User B requests Alice's project -> 404
        res_b_proj = client.get(
            f"/api/v1/projects/{alice_project_id}",
            headers={"Authorization": "Bearer bob-token"},
        )
        assert res_b_proj.status_code == 404

        # User B requests Alice's analysis results -> 404
        res_b_results = client.get(
            f"/api/v1/analysis/{alice_job_id}/results",
            headers={"Authorization": "Bearer bob-token"},
        )
        assert res_b_results.status_code == 404

        # User B's project list is empty
        res_b_list = client.get(
            "/api/v1/projects",
            headers={"Authorization": "Bearer bob-token"},
        )
        assert res_b_list.status_code == 200
        bob_projects = res_b_list.json()["data"]
        assert all(p["id"] != alice_project_id for p in bob_projects)
