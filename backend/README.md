# MergeX AI — Backend Foundation

Backend service for **MergeX AI**, built with **Python 3.11+**, **FastAPI**, **Pydantic v2**, and **Uvicorn**, integrated with **Supabase Auth** and **Supabase PostgreSQL**.

---

## Architecture Overview

- **Framework**: FastAPI (High-performance async ASGI web framework)
- **Data Validation & Settings**: Pydantic v2 & Pydantic-Settings
- **Authentication**: Supabase Auth (Bearer token validation via Supabase Auth API / JWT)
- **Database**: Supabase PostgreSQL (Persistent data layer)
- **API Documentation**: Automated OpenAPI Swagger UI (`/api/v1/docs`) & ReDoc (`/api/v1/redoc`)
- **Testing**: Pytest & FastAPI TestClient

---

## Directory Structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── analysis.py      # Codebase analysis job contracts
│   │   │   ├── health.py        # /api/health and /api/v1/health status
│   │   │   ├── history.py       # Scan audit history contracts
│   │   │   ├── projects.py      # Project management contracts
│   │   │   ├── reports.py       # Audit report contracts
│   │   │   └── results.py       # Scan findings & scores contracts
│   │   ├── deps.py              # Auth & dependency injection
│   │   └── router.py            # Aggregated API router
│   ├── core/
│   │   ├── config.py            # Environment settings (Pydantic)
│   │   ├── errors.py            # Centralized exception handlers
│   │   ├── response.py          # Standardized JSON response helpers
│   │   └── security.py          # Supabase JWT token verification
│   ├── schemas/
│   │   ├── analysis.py          # Job & Finding Pydantic models
│   │   ├── auth.py              # UserIdentity model
│   │   ├── common.py            # APIResponse & Health models
│   │   ├── history.py           # ScanRecord models
│   │   ├── projects.py          # Project models
│   │   └── reports.py           # Report models
│   └── main.py                  # FastAPI application entry point
├── tests/
│   ├── conftest.py              # Pytest fixtures & TestClient
│   ├── test_auth.py             # Supabase Auth security tests
│   └── test_health.py           # Health endpoint & CORS tests
├── .env.example                 # Environment variables template
├── .gitignore                   # Ignored files (venv, secrets, caches)
├── README.md                    # Setup and execution guide
└── requirements.txt             # Python dependencies
```

---

## Quickstart (Windows PowerShell)

Follow these exact commands to set up, run, and test the backend.

### 1. Open PowerShell and Navigate to the Backend Directory

```powershell
cd C:\Users\Albaksh\OneDrive\Desktop\Mergx.AI\backend
```

### 2. Create and Activate a Python Virtual Environment

```powershell
# Create the virtual environment
python -m venv .venv

# If script execution is restricted in your PowerShell session:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Activate the virtual environment
.\.venv\Scripts\Activate.ps1
```

*(You should see `(.venv)` in your PowerShell prompt).*

### 3. Install Backend Dependencies

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

Open `.env` and verify your Supabase settings:

```dotenv
PROJECT_NAME="MergeX AI Backend"
ENVIRONMENT="development"
DEBUG=True
API_V1_STR="/api/v1"

# Allowed frontend origins
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000"]

# Supabase Auth & Project Configuration
# Match with frontend/src/services/supabase.ts
SUPABASE_URL="https://tizevzlfawinfruxnwal.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"

# Backend Secrets (Optional / Next Phase)
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_JWT_SECRET=""
DATABASE_URL=""
```

### 5. Run the Automated Tests

Verify that your environment, CORS, health checks, and authentication dependencies are passing:

```powershell
pytest -v
```

### 6. Start the Backend Development Server

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Once running, access:
- **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- **Interactive OpenAPI Docs (Swagger)**: [http://127.0.0.1:8000/api/v1/docs](http://127.0.0.1:8000/api/v1/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/api/v1/redoc](http://127.0.0.1:8000/api/v1/redoc)

---

## Connecting the Frontend

The existing React frontend runs independently on `http://localhost:5173`.

To point the frontend to this backend:

1. In `frontend/.env`, ensure the backend API base URL is defined:
   ```dotenv
   VITE_API_BASE_URL=http://localhost:8000
   ```
2. When calling protected backend endpoints from frontend components or services, attach the Supabase access token:
   ```ts
   import { supabase } from "./services/supabase";

   const session = (await supabase.auth.getSession()).data.session;
   const token = session?.access_token;

   const response = await fetch("http://localhost:8000/api/v1/projects", {
     headers: {
       "Authorization": `Bearer ${token}`,
       "Content-Type": "application/json",
     },
   });
   ```

---

## Security & Auth Rules

1. **Single Authentication Source**: Uses the existing Supabase Auth instance. No secondary login or password database is created.
2. **Never Trust Client User IDs**: User identity (`id`, `email`, `role`) is extracted from verified Supabase JWT tokens via `get_current_user`.
3. **No Service-Role Leak**: `SUPABASE_SERVICE_ROLE_KEY` is strictly for backend administrative operations and is never shared with the frontend.
