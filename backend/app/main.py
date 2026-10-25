import re
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
    # Build the origin regex from the comma-separated cors_origins list
    # plus common patterns for local dev and Vercel deployments.
    # We rely solely on regex (no allow_origins list) because mixing both
    # with allow_credentials=True can cause Starlette validation errors.
    extra_origins = "|".join(
        re.escape(o.strip())
        for o in settings.cors_origins.split(",")
        if o.strip() and o.strip() != "*"
    )
    origin_regex = rf"({extra_origins}|https://[\w-]+\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+)"
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[],
        allow_origin_regex=origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.middleware("http")(audit_context_middleware)
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
