def test_root_health_endpoint(client):
    """
    Test GET /api/health returns HTTP 200 with consistent JSON response structure.
    """
    response = client.get("/api/health")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "timestamp" in data
    assert data["data"]["status"] == "healthy"
    assert data["data"]["version"] == "1.0.0"
    assert "services" in data["data"]
    assert "supabase_configured" in data["data"]["services"]


def test_v1_health_endpoint(client):
    """
    Test GET /api/v1/health returns HTTP 200 with consistent JSON response structure.
    """
    response = client.get("/api/v1/health")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"


def test_cors_headers(client):
    """
    Test CORS headers are present for local frontend and Vercel deployments.
    """
    # 1. Local Vite dev server
    headers_local = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    }
    res_local = client.options("/api/health", headers=headers_local)
    assert res_local.status_code == 200
    assert res_local.headers.get("access-control-allow-origin") == "http://localhost:5173"

    # 2. Vercel Production deployment
    headers_vercel = {
        "Origin": "https://mergx-ai.vercel.app",
        "Access-Control-Request-Method": "GET",
    }
    res_vercel = client.options("/api/health", headers=headers_vercel)
    assert res_vercel.status_code == 200
    assert res_vercel.headers.get("access-control-allow-origin") == "https://mergx-ai.vercel.app"

    # 3. Vercel Preview/Branch deployment
    headers_preview = {
        "Origin": "https://mergx-ai-preview-abc.vercel.app",
        "Access-Control-Request-Method": "GET",
    }
    res_preview = client.options("/api/health", headers=headers_preview)
    assert res_preview.status_code == 200
    assert res_preview.headers.get("access-control-allow-origin") == "https://mergx-ai-preview-abc.vercel.app"



def test_centralized_error_format_404(client):
    """
    Test 404 Not Found returns centralized JSON error format.
    """
    response = client.get("/api/non-existent-endpoint")
    assert response.status_code == 404

    data = response.json()
    assert data["success"] is False
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"
    assert "timestamp" in data
