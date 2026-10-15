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
    Test CORS headers are present for local frontend development server.
    """
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/api/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


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
