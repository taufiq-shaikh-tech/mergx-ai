from fastapi import APIRouter
from app.api.routes import analysis, health, history, notifications, projects, reports, results, stats

api_router = APIRouter()

# Health checks
api_router.include_router(health.router)

# Production modules
api_router.include_router(projects.router)
api_router.include_router(analysis.router)
api_router.include_router(results.router)
api_router.include_router(history.router)
api_router.include_router(reports.router)
api_router.include_router(notifications.router)
api_router.include_router(stats.router)
