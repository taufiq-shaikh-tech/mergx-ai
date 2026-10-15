from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.routes.health import check_health
from app.core.config import settings
from app.core.errors import register_error_handlers
from app.db.session import init_db

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("mergex-backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up %s (env=%s)...", settings.PROJECT_NAME, settings.ENVIRONMENT)
    logger.info("Initializing database schema...")
    await init_db()
    logger.info("CORS allowed origins: %s", settings.BACKEND_CORS_ORIGINS)
    logger.info("Supabase configured: %s", settings.is_supabase_configured)
    yield
    logger.info("Shutting down %s...", settings.PROJECT_NAME)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description=(
        "Backend API for MergeX AI. Provides automated AST contract matching, "
        "cross-layer route verification, security audits, and dependency health checks."
    ),
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    debug=settings.DEBUG,
)

# Register centralized error handling
register_error_handlers(app)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root level health checks (supports /health, /api/health, /api/v1/health)
app.add_api_route(
    "/health",
    check_health,
    methods=["GET"],
    tags=["Health"],
    summary="Root Health Check",
    include_in_schema=False,
)
app.add_api_route(
    "/api/health",
    check_health,
    methods=["GET"],
    tags=["Health"],
    summary="Root Health Check",
    description="Direct root-level health check endpoint for monitoring.",
)

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/api/v1/docs", include_in_schema=False)
async def api_v1_docs():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")


@app.get("/api/v1/openapi.json", include_in_schema=False)
async def api_v1_openapi():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/openapi.json")


@app.get("/", include_in_schema=False)
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "health": "/api/health",
    }

