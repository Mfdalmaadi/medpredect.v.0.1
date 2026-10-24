from contextlib import asynccontextmanager

from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import dispose_engine
from app.middleware.audit_context import audit_context_middleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.app_name = settings.app_name
    yield
    dispose_engine()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        debug=settings.app_debug,
        version="0.1.0",
        lifespan=lifespan,
    )
    cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
    allow_all = "*" in cors_origins

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if allow_all else cors_origins,
        allow_origin_regex=settings.cors_origin_regex if not allow_all else None,
        allow_credentials=not allow_all,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.middleware("http")(audit_context_middleware)
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
