# MedPredict AI Backend - Phase 1

This is the FastAPI project foundation for MedPredict AI.

Phase 1 includes:

- FastAPI application structure
- Environment-based configuration
- SQLAlchemy 2.0 setup
- MySQL connection with PyMySQL
- Alembic migration configuration
- Dependency injection for database sessions
- Declarative base model setup
- Startup and shutdown lifecycle hooks
- Health check endpoint

Phase 1 intentionally excludes authentication and business logic.

## Run

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Health check:

```text
GET http://127.0.0.1:8000/api/v1/health
```
