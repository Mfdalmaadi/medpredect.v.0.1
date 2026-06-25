# PROJECT_PROGRESS.md

Last updated: 2026-06-20

This document describes the current MedPredict AI backend implementation as it exists today. It should be updated whenever the codebase changes.

## ML Pipeline Completion Log

### 2026-06-21 - Step 1: ML folder and artifact inspection

What changed:

* No backend architecture or API contracts were changed.
* Inspected the current ML folder, README, artifact directory, dataset directory, and MLService artifact path.

Why:

* Prediction endpoints returned HTTP 503 because `MLService` could not find required trained artifacts.

Concepts involved:

* ML artifacts
* joblib serialization
* model loading
* scaler loading
* FastAPI dependency injection

Files modified:

* `PROJECT_PROGRESS.md`

Commands executed:

```powershell
Get-ChildItem -Recurse app\ml
Get-ChildItem app\ml\diabetes\artifacts -Force
Get-ChildItem app\ml\diabetes\data -Force
Select-String -Path app\services\ml_service.py -Pattern "DIABETES_ARTIFACTS_DIR|model.pkl|scaler.pkl" -Context 0,2
Get-Content app\ml\diabetes\README.md
python --version
```

Verification performed:

* Confirmed Python version is `Python 3.13.0`.
* Confirmed `app/ml/diabetes/artifacts` contains only `.gitkeep`.
* Confirmed `app/ml/diabetes/data` contains only `.gitkeep`.
* Confirmed backend expects:

```text
app/ml/diabetes/artifacts/model.pkl
app/ml/diabetes/artifacts/scaler.pkl
```

### 2026-06-21 - Step 2: Python 3.13 ML dependency check

What changed:

* No code was changed.
* Verified the local Python 3.13 environment can import the required ML libraries.

Why:

* The training pipeline depends on pandas, numpy, scikit-learn, joblib, and SHAP.
* Python 3.13 can have compatibility issues with older ML wheels, so this was checked before training.

Concepts involved:

* Python package compatibility
* scikit-learn
* pandas
* numpy
* joblib
* SHAP

Files modified:

* `PROJECT_PROGRESS.md`

Commands executed:

```powershell
python -c "import pandas, numpy, sklearn, joblib; print('pandas', pandas.__version__); print('numpy', numpy.__version__); print('sklearn', sklearn.__version__); print('joblib', joblib.__version__)"
python -c "import shap; print('shap', shap.__version__)"
```

Verification performed:

* Confirmed installed versions:

```text
pandas 2.2.3
numpy 2.2.1
sklearn 1.6.0
joblib 1.4.2
shap 0.48.0
```

## Project Overview

### Project Purpose

MedPredict AI is a FastAPI backend for a medical decision-support platform. It manages users, doctors, patients, medical prediction records, diabetes ML inference, SHAP explainability, notifications, audit logs, dashboard statistics, admin operations, and PDF report export.

The system is a decision-support prototype. It does not diagnose patients and should not be presented as a medical device.

### Architecture Summary

The backend uses a layered modular-monolith architecture:

```text
FastAPI app
-> API routers/endpoints
-> Dependency injection
-> Service layer
-> Repository layer
-> SQLAlchemy ORM models
-> MySQL database
```

ML inference is isolated in `MLService`, PDF generation is isolated in `PDFReportService`, and authorization is centralized through dependencies and permission utilities.

### Current Technology Stack

* Python
* FastAPI
* Uvicorn
* SQLAlchemy 2.0
* Alembic
* MySQL
* PyMySQL
* Pydantic v2
* pydantic-settings
* python-jose
* passlib bcrypt
* pandas
* numpy
* scikit-learn
* joblib
* SHAP
* ReportLab
* Jupyter

## Completed Features

* ✅ FastAPI project foundation
* ✅ Environment configuration
* ✅ SQLAlchemy database setup
* ✅ Alembic migrations
* ✅ Health check endpoint
* ✅ User model
* ✅ Authentication
* ✅ Password hashing
* ✅ JWT access token
* ✅ JWT refresh token generation
* ✅ Role-Based Access Control
* ✅ Patient Management
* ✅ Audit Logging
* ✅ Prediction database structures
* ✅ Diabetes training script
* ✅ Diabetes training notebook
* ✅ Diabetes MLService
* ✅ SHAP Explainability service
* ✅ Diabetes Prediction API
* ✅ Prepared PCOS endpoint returning 501 until model is trained
* ✅ Prediction History
* ✅ Notification System
* ✅ PDF Export
* ✅ Admin Module
* ✅ Dashboard Statistics
* ✅ ReportLab PDF report generation

## Project Structure

### `backend/app`

Main application package.

### `backend/app/main.py`

Creates the FastAPI app, registers middleware, registers API routers, and handles startup/shutdown lifecycle.

### `backend/app/api`

Contains API dependencies and versioned routers.

### `backend/app/api/deps.py`

Defines reusable FastAPI dependencies:

* database session
* current user extraction
* role checks
* ML service injection

### `backend/app/api/v1/endpoints`

Contains route files for each API feature:

* admin
* auth
* dashboard
* health
* notifications
* patients
* predict
* predictions
* reports
* RBAC examples

### `backend/app/core`

Contains core infrastructure:

* configuration
* JWT/security helpers
* RBAC permission utilities

### `backend/app/db`

Contains SQLAlchemy base classes and session/engine setup.

### `backend/app/middleware`

Contains middleware for request-level concerns such as IP extraction for audit logs.

### `backend/app/models`

Responsible for SQLAlchemy database entities:

* User
* Patient
* Prediction
* Clinical inputs
* Recommendation
* Notification
* SHAP values
* Audit logs

### `backend/app/schemas`

Contains Pydantic request and response schemas.

### `backend/app/repositories`

Contains database query classes. Repositories isolate SQLAlchemy queries from business logic.

### `backend/app/services`

Contains business logic and orchestration:

* authentication
* patient management
* prediction workflow
* prediction history
* ML service
* notification logic
* dashboard logic
* admin logic
* audit logic
* PDF generation

### `backend/app/ml`

Contains ML training, artifacts, SHAP explainability, and educational ML guides.

### `backend/app/ml/diabetes`

Contains diabetes-specific ML work:

* training script
* notebook
* SHAP service
* dataset placeholder
* artifact placeholder

### `backend/app/reports`

Contains report documentation and report package marker.

### `backend/alembic`

Contains Alembic migration environment and database migration versions.

## Feature Breakdown

### 1. FastAPI Foundation

Objective:
Create a clean application skeleton with versioned APIs, database connection, settings, lifecycle events, and health checking.

Files involved:

* `app/main.py`
* `app/core/config.py`
* `app/db/base.py`
* `app/db/session.py`
* `app/api/v1/router.py`
* `app/api/v1/endpoints/health.py`
* `alembic/env.py`
* `alembic.ini`

Request flow:

```text
Client
-> FastAPI app
-> /api/v1/health route
-> database session
-> SELECT 1
-> JSON response
```

Database impact:

No domain table is created by the foundation itself. It prepares SQLAlchemy metadata and Alembic.

API endpoints:

* `GET /api/v1/health`

Dependencies:

* FastAPI
* SQLAlchemy
* PyMySQL
* Alembic
* pydantic-settings

Security considerations:

Health endpoint confirms database availability. In production, avoid exposing too much diagnostic detail.

Learning Corner:

Best practices used:

* App factory pattern
* Environment-based configuration
* Versioned API routing
* Database dependency injection

Common beginner mistakes:

* Putting all code in `main.py`
* Hardcoding database URLs
* Creating a new database connection manually in every route

Interview questions:

* Why use dependency injection in FastAPI?
* Why use Alembic instead of manually editing the database?

Exercises:

* Add a `/health/live` and `/health/ready` distinction.
* Add startup validation for required environment variables.

### 2. Authentication

Objective:
Allow users to register, log in, receive JWT tokens, refresh tokens, and prepare logout behavior.

Files involved:

* `app/api/v1/endpoints/auth.py`
* `app/services/auth_service.py`
* `app/core/security.py`
* `app/schemas/auth.py`
* `app/schemas/user.py`
* `app/models/user.py`
* `app/repositories/user_repository.py`

Request flow:

```text
React
-> POST /api/v1/auth/login
-> Auth router
-> AuthService
-> UserRepository
-> MySQL users table
-> bcrypt verification
-> JWT access token + refresh token
-> response
```

Database impact:

Uses the `users` table. Register creates a user. Login creates an audit log.

API endpoints:

* `POST /api/v1/auth/register`
* `POST /api/v1/auth/login`
* `POST /api/v1/auth/refresh`
* `POST /api/v1/auth/logout`

Dependencies:

* python-jose
* passlib bcrypt
* Pydantic `EmailStr`

Security considerations:

* Passwords are hashed with bcrypt.
* JWT tokens contain user subject and role.
* Refresh token revocation is not yet implemented.
* Logout is currently a preparation endpoint, not true token invalidation.

Learning Corner:

Best practices used:

* Passwords are never stored in plain text.
* Auth logic is in a service, not in the router.
* JWT creation is centralized in `core/security.py`.

Common beginner mistakes:

* Returning password hashes in API responses.
* Storing plain passwords.
* Treating JWT logout as automatic.

Interview questions:

* What is the difference between authentication and authorization?
* Why do we need refresh tokens?
* Why should JWT secrets be loaded from environment variables?

Exercises:

* Add a refresh token table.
* Add token rotation.
* Add login rate limiting.

### 3. Role-Based Access Control

Objective:
Restrict system actions based on user role.

Roles:

* doctor
* patient
* admin

Files involved:

* `app/core/permissions.py`
* `app/api/deps.py`
* `app/api/v1/endpoints/rbac_examples.py`
* `app/models/user.py`

Request flow:

```text
Request with Bearer token
-> get_current_user
-> decode JWT
-> load user
-> role dependency
-> endpoint
```

Database impact:

Reads the `users` table to verify the current user and role.

API endpoints:

* `GET /api/v1/rbac/examples/doctor-area`
* `GET /api/v1/rbac/examples/patient-area`
* `GET /api/v1/rbac/examples/admin-area`
* `GET /api/v1/rbac/examples/users/{user_id}/own-data`

Dependencies:

* FastAPI dependencies
* python-jose

Security considerations:

* Admin role bypass is centralized in permission utilities.
* Ownership checks are separate from role checks.

Learning Corner:

Best practices used:

* Authorization is centralized.
* Dependencies are reusable.
* Admin-only checks are explicit.

Common beginner mistakes:

* Hiding buttons in frontend but not protecting backend routes.
* Checking roles inconsistently in each route.

Interview questions:

* What is RBAC?
* What is the difference between role check and ownership check?

Exercises:

* Add a permission matrix document.
* Add tests for doctor/admin/patient access.

### 4. Patient Management

Objective:
Allow doctors to manage their own patients while admins can access all patients.

Files involved:

* `app/api/v1/endpoints/patients.py`
* `app/services/patient_service.py`
* `app/repositories/patient_repository.py`
* `app/schemas/patient.py`
* `app/models/patient.py`
* `alembic/versions/2026_06_17_0002-0002_create_patients_table.py`

Request flow:

```text
React
-> Patient route
-> JWT/RBAC dependency
-> PatientService
-> PatientRepository
-> MySQL patients table
-> response
```

Database impact:

Creates and manages the `patients` table. Each patient belongs to a doctor through `doctor_id`.

API endpoints:

* `POST /api/v1/patients`
* `GET /api/v1/patients`
* `GET /api/v1/patients/{patient_id}`
* `PATCH /api/v1/patients/{patient_id}`
* `DELETE /api/v1/patients/{patient_id}`

Dependencies:

* SQLAlchemy
* Pydantic validation
* RBAC dependencies

Security considerations:

* Doctors only access patients where `doctor_id` equals their user ID.
* Admins can access all patients.
* Patient role is not allowed to use patient-management endpoints.

Learning Corner:

Best practices used:

* Ownership checks in service layer.
* Unique medical identifier per doctor.
* Validation for date of birth and field lengths.

Common beginner mistakes:

* Fetching patient by ID without checking ownership.
* Allowing doctors to assign patients to another doctor.

Interview questions:

* Why is ownership validation important?
* Why use a repository instead of querying inside the route?

Exercises:

* Add patient search by name.
* Add pagination metadata.
* Add soft delete.

### 5. Audit Logging

Objective:
Track sensitive actions for traceability.

Tracked actions:

* register
* login
* patient_created
* patient_updated
* patient_deleted
* user_enabled
* user_disabled

Files involved:

* `app/models/audit_log.py`
* `app/services/audit_service.py`
* `app/repositories/audit_repository.py`
* `app/middleware/audit_context.py`
* `app/services/auth_service.py`
* `app/services/patient_service.py`
* `app/services/admin_service.py`

Request flow:

```text
Request
-> audit middleware extracts IP
-> service performs action
-> AuditService writes audit log
-> commit
```

Database impact:

Creates and writes to `audit_logs`.

API endpoints:

Audit logs are viewed through:

* `GET /api/v1/admin/audit-logs`

Dependencies:

* SQLAlchemy
* FastAPI middleware

Security considerations:

* Audit logs should be append-only in production.
* IP address extraction trusts proxy headers and should be hardened behind known proxies.

Learning Corner:

Best practices used:

* Audit logging is separated from debug logging.
* Important actions are recorded with user, resource, time, and IP.

Common beginner mistakes:

* Logging sensitive passwords or tokens.
* Treating audit logs as normal debug logs.

Interview questions:

* What should be stored in an audit log?
* Why should audit logs be immutable?

Exercises:

* Add failed login audit events.
* Add audit filters by action and user.

### 6. Prediction Data Model

Objective:
Store prediction results, disease-specific clinical inputs, recommendations, SHAP values, and notifications.

Files involved:

* `app/models/prediction.py`
* `app/schemas/prediction.py`
* `alembic/versions/2026_06_17_0004-0004_create_prediction_structures.py`
* `alembic/versions/2026_06_18_0005-0005_create_shap_values_table.py`

Request flow:

```text
Prediction service
-> create prediction
-> create clinical input
-> create SHAP values
-> create recommendations
-> optional notification
```

Database impact:

Creates:

* `predictions`
* `clinical_inputs_diabetes`
* `clinical_inputs_pcos`
* `recommendations`
* `notifications`
* `shap_values`

API endpoints:

Used by prediction, history, notifications, and reports endpoints.

Dependencies:

* SQLAlchemy relationships
* Alembic migrations
* Pydantic schemas

Security considerations:

Prediction records are medical data. All access must go through ownership or admin checks.

Learning Corner:

Best practices used:

* Separate clinical input tables for diabetes and PCOS.
* Prediction output is persisted.
* SHAP explanations are stored for later reports.

Common beginner mistakes:

* Storing only the prediction score and losing the inputs/explanations.
* Mixing unrelated disease fields in one huge nullable table.

Interview questions:

* Why persist SHAP values?
* Why store model inputs with outputs?

Exercises:

* Add `model_version_id` to predictions.
* Add indexes on `created_at`.

### 7. Diabetes ML Training

Objective:
Train and save a diabetes prediction model and scaler.

Files involved:

* `app/ml/diabetes/train_diabetes_model.py`
* `app/ml/diabetes/diabetes_training_notebook.ipynb`
* `app/ml/diabetes/MODEL_EVALUATION_GUIDE.md`
* `app/ml/diabetes/README.md`
* `app/ml/diabetes/data`
* `app/ml/diabetes/artifacts`

Request flow:

Training is offline:

```text
CSV dataset
-> pandas
-> train/test split
-> StandardScaler
-> RandomForestClassifier
-> metrics
-> model.pkl + scaler.pkl
```

Database impact:

None during training.

API endpoints:

None. The generated artifacts are used later by `MLService`.

Dependencies:

* pandas
* numpy
* scikit-learn
* joblib
* Jupyter

Security considerations:

Only trusted model artifacts should be loaded. Pickle/joblib files can execute unsafe code if tampered with.

Learning Corner:

Best practices used:

* Train/test split.
* Scaler saved with model.
* Metrics saved to `evaluation.json`.

Common beginner mistakes:

* Scaling test data with `fit_transform`.
* Evaluating on training data only.
* Forgetting feature order.

Interview questions:

* What is train/test split?
* Why save the scaler?
* What does recall mean in medical screening?

Exercises:

* Add cross-validation.
* Add feature importance export.
* Compare RandomForest with LogisticRegression.

### 8. SHAP Explainability

Objective:
Explain diabetes model predictions through top contributing factors.

Files involved:

* `app/ml/diabetes/shap_service.py`
* `app/ml/diabetes/SHAP_EXPLAINABILITY_GUIDE.md`
* `app/services/ml_service.py`

Request flow:

```text
Clinical input
-> scaler
-> model probability
-> SHAP TreeExplainer
-> ranked top factors
-> API response + database save
```

Database impact:

SHAP results are saved to `shap_values` during prediction.

API endpoints:

Used by:

* `POST /api/v1/predict/diabetes`

Dependencies:

* SHAP
* joblib
* pandas
* numpy
* scikit-learn

Security considerations:

SHAP explains model behavior, not medical causality. This distinction should be clear in UI and reports.

Learning Corner:

Best practices used:

* Explanation logic isolated from route files.
* Top factors are ranked by absolute impact.
* Positive/negative directions are included.

Common beginner mistakes:

* Treating SHAP as proof of causation.
* Showing raw arrays instead of understandable factors.

Interview questions:

* What does a positive SHAP value mean?
* Why is explainability important in healthcare AI?

Exercises:

* Add SHAP bar chart data endpoint.
* Store all SHAP factors, not only top factors.

### 9. MLService

Objective:
Provide one backend-facing interface for model loading, prediction, probability calculation, SHAP explanation, and risk classification.

Files involved:

* `app/services/ml_service.py`
* `app/api/deps.py`
* `app/ml/ML_SERVICE_GUIDE.md`

Request flow:

```text
PredictionService
-> MLService.predict_diabetes
-> normalize feature names
-> scaler.transform
-> model.predict_proba
-> DiabetesSHAPService
-> risk classification
```

Database impact:

None directly. Prediction persistence happens in `PredictionService`.

API endpoints:

Used by:

* `POST /api/v1/predict/diabetes`

Dependencies:

* joblib
* pandas
* scikit-learn
* SHAP service

Security considerations:

Do not load untrusted pickle/joblib artifacts.

Learning Corner:

Best practices used:

* ML loading is cached through dependency injection.
* API routes do not call model/scaler directly.
* Custom ML exceptions exist.

Common beginner mistakes:

* Loading model on every request.
* Mixing ML code inside routers.
* Not validating feature names.

Interview questions:

* Why use a service for ML inference?
* Why cache model loading?

Exercises:

* Add model version metadata.
* Add startup warmup check.

### 10. Prediction API

Objective:
Allow doctors/admins to submit clinical inputs and receive prediction result, risk level, SHAP explanation, recommendations, and notification status.

Files involved:

* `app/api/v1/endpoints/predict.py`
* `app/services/prediction_service.py`
* `app/repositories/prediction_repository.py`
* `app/schemas/prediction.py`
* `app/services/ml_service.py`
* `app/services/notification_service.py`

Request flow:

```text
React
-> POST /api/v1/predict/diabetes
-> JWT verification
-> doctor/admin authorization
-> patient ownership check
-> MLService
-> SHAP explanation
-> PredictionRepository
-> MySQL
-> response
```

Database impact:

Creates prediction records, diabetes clinical input rows, SHAP values, recommendations, and optional notification.

API endpoints:

* `POST /api/v1/predict/diabetes`
* `POST /api/v1/predict/pcos`

Dependencies:

* MLService
* PredictionRepository
* NotificationService
* Pydantic validation

Security considerations:

Doctors only submit predictions for their own patients. Admin can submit for any patient.

Learning Corner:

Best practices used:

* Request validation before ML call.
* Ownership check before prediction.
* Result is persisted.
* SHAP values are stored.

Common beginner mistakes:

* Trusting patient ID from frontend without ownership validation.
* Returning predictions without saving them.
* Running ML before checking permission.

Interview questions:

* What is the complete prediction request flow?
* Why save both inputs and outputs?

Exercises:

* Implement PCOS ML model.
* Add prediction deletion policy.

### 11. Prediction History

Objective:
Retrieve saved predictions by ID, by patient, or by doctor.

Files involved:

* `app/api/v1/endpoints/predictions.py`
* `app/services/prediction_history_service.py`
* `app/repositories/prediction_repository.py`
* `app/schemas/prediction.py`

Request flow:

```text
React
-> prediction history endpoint
-> JWT/RBAC
-> PredictionHistoryService
-> PredictionRepository
-> MySQL
-> response with related data
```

Database impact:

Read-only.

API endpoints:

* `GET /api/v1/predictions/{prediction_id}`
* `GET /api/v1/predictions/patient/{patient_id}/history`
* `GET /api/v1/predictions/doctor/history`

Dependencies:

* SQLAlchemy eager loading
* RBAC dependencies

Security considerations:

Doctors only see their own prediction records. Admin sees all.

Learning Corner:

Best practices used:

* Eager loading for related prediction data.
* Fixed routes are placed before `/{prediction_id}`.
* Pagination is included.

Common beginner mistakes:

* Putting `/{id}` route before fixed routes.
* Returning predictions without ownership check.

Interview questions:

* What is eager loading?
* Why does route ordering matter?

Exercises:

* Add filters by risk level and date range.
* Add CSV export.

### 12. Notification System

Objective:
Create in-app notifications and prepare email drafts when prediction probability exceeds a configured threshold.

Files involved:

* `app/api/v1/endpoints/notifications.py`
* `app/services/notification_service.py`
* `app/repositories/notification_repository.py`
* `app/schemas/notification.py`
* `app/models/prediction.py`
* `app/core/config.py`

Request flow:

```text
Prediction completed
-> NotificationService
-> check probability threshold
-> create notification
-> prepare email draft
```

Database impact:

Writes to `notifications`.

API endpoints:

* `GET /api/v1/notifications`
* `PATCH /api/v1/notifications/{notification_id}/read`

Dependencies:

* SQLAlchemy
* Pydantic
* Settings threshold

Security considerations:

Users can see their own notifications. Admin can view all.

Learning Corner:

Best practices used:

* Notification creation is centralized.
* Email preparation is separated from actual SMTP sending.
* Threshold is configurable.

Common beginner mistakes:

* Sending email synchronously inside prediction code.
* Hardcoding alert threshold deep in business logic.

Interview questions:

* Why separate notification persistence from email sending?
* What should happen if email fails?

Exercises:

* Implement SMTP sender.
* Add background task dispatch.

### 13. PDF Export

Objective:
Generate PDF prediction reports from persisted data.

Files involved:

* `app/api/v1/endpoints/reports.py`
* `app/services/pdf_report_service.py`
* `app/reports/EXAMPLE_PDF_OUTPUT.md`
* `requirements.txt`

Request flow:

```text
React
-> GET /api/v1/reports/predictions/{prediction_id}/pdf
-> JWT/RBAC
-> PredictionHistoryService
-> PDFReportService
-> ReportLab
-> PDF stream response
```

Database impact:

Read-only.

API endpoints:

* `GET /api/v1/reports/predictions/{prediction_id}/pdf`

Dependencies:

* ReportLab
* StreamingResponse

Security considerations:

PDF access follows prediction ownership rules.

Learning Corner:

Best practices used:

* PDF is generated from trusted database records.
* PDF generation is isolated from routes.
* Medical disclaimer is included.

Common beginner mistakes:

* Generating reports from client payloads.
* Writing temporary PDFs unnecessarily.

Interview questions:

* Why generate reports server-side?
* Why stream the response?

Exercises:

* Add hospital logo.
* Add chart image for SHAP factors.

### 14. Admin Module

Objective:
Allow admins to manage users, enable/disable accounts, view audit logs, and view global statistics.

Files involved:

* `app/api/v1/endpoints/admin.py`
* `app/services/admin_service.py`
* `app/schemas/admin.py`
* `app/repositories/audit_repository.py`
* `app/repositories/stats_repository.py`
* `app/repositories/user_repository.py`

Request flow:

```text
Admin request
-> JWT
-> require_admin
-> AdminService
-> repository
-> MySQL
-> response
```

Database impact:

Reads users, audit logs, patients, predictions, notifications. Updates `users.is_active`. Writes audit logs for account status changes.

API endpoints:

* `GET /api/v1/admin/users`
* `PATCH /api/v1/admin/users/{user_id}/enable`
* `PATCH /api/v1/admin/users/{user_id}/disable`
* `GET /api/v1/admin/audit-logs`
* `GET /api/v1/admin/stats`

Dependencies:

* RBAC admin dependency
* SQLAlchemy
* AuditService

Security considerations:

Admin endpoints require strict admin role. Admin cannot disable their own account.

Learning Corner:

Best practices used:

* Admin logic is isolated.
* Sensitive admin actions are audited.
* Pagination exists for user and audit log lists.

Common beginner mistakes:

* Allowing admin routes without role checks.
* Allowing admins to deactivate themselves accidentally.

Interview questions:

* Why should admin actions be audited?
* What should an admin dashboard include?

Exercises:

* Add filters to audit logs.
* Add user creation by admin.

### 15. Dashboard Statistics

Objective:
Provide summary metrics and recent activity for doctors/admins.

Files involved:

* `app/api/v1/endpoints/dashboard.py`
* `app/services/dashboard_service.py`
* `app/schemas/dashboard.py`
* `app/repositories/stats_repository.py`

Request flow:

```text
React dashboard
-> GET /api/v1/dashboard/summary
-> JWT/RBAC
-> DashboardService
-> StatsRepository
-> MySQL
-> dashboard summary
```

Database impact:

Read-only.

API endpoints:

* `GET /api/v1/dashboard/summary`

Dependencies:

* SQLAlchemy aggregate queries
* RBAC dependencies

Security considerations:

Admin receives global stats. Doctor receives scoped stats.

Learning Corner:

Best practices used:

* Role-aware dashboard.
* Recent activity merges audit logs and predictions.
* Aggregation queries are isolated.

Common beginner mistakes:

* Showing global statistics to doctors.
* Computing stats in frontend only.

Interview questions:

* Why should dashboard scope depend on role?
* How would you optimize dashboard queries?

Exercises:

* Add monthly prediction trend.
* Add high-risk alert chart.

## Concepts Used

### FastAPI

What it is:
A modern Python web framework for building APIs.

Why it is used:
It provides routing, validation integration, OpenAPI docs, dependency injection, and async support.

How it works in this project:
Routes are defined in `app/api/v1/endpoints`, registered through `app/api/v1/router.py`, and mounted in `app/main.py`.

Files:

* `app/main.py`
* `app/api/v1/router.py`
* `app/api/v1/endpoints/*.py`

### Dependency Injection

What it is:
A pattern where shared objects are provided to functions automatically.

Why it is used:
It avoids manual setup in every route and keeps authentication, database, and ML access reusable.

How it works:
`Depends()` injects database sessions, current user, role checks, and ML service.

Files:

* `app/api/deps.py`

### SQLAlchemy ORM

What it is:
A Python ORM for mapping classes to database tables.

Why it is used:
It allows typed model classes and structured database access.

How it works:
Models in `app/models` inherit from `Base` and map to MySQL tables.

Files:

* `app/db/base.py`
* `app/models/*.py`

### Alembic

What it is:
Database migration tool for SQLAlchemy.

Why it is used:
It versions database schema changes.

How it works:
Migration files in `alembic/versions` create and update tables.

Files:

* `alembic.ini`
* `alembic/env.py`
* `alembic/versions/*.py`

### JWT

What it is:
JSON Web Token, a signed token used to identify users.

Why it is used:
It lets the backend authenticate requests without server-side session storage for access tokens.

How it works:
`core/security.py` creates and decodes access/refresh tokens.

Files:

* `app/core/security.py`
* `app/services/auth_service.py`
* `app/api/deps.py`

### Repository Pattern

What it is:
A layer that contains database queries.

Why it is used:
It prevents SQLAlchemy queries from spreading across routes and services.

How it works:
Services call repository methods instead of querying directly.

Files:

* `app/repositories/*.py`

### Service Layer

What it is:
A layer for business rules and orchestration.

Why it is used:
It keeps routers thin and makes logic easier to test.

How it works:
Routes call services such as `AuthService`, `PatientService`, and `PredictionService`.

Files:

* `app/services/*.py`

### UUID

What it is:
A globally unique identifier.

Why it is used:
It avoids predictable integer IDs for medical resources.

How it works:
`UUIDPrimaryKeyMixin` generates string UUID primary keys.

Files:

* `app/db/base.py`

### RBAC

What it is:
Role-Based Access Control.

Why it is used:
Doctors, patients, and admins need different permissions.

How it works:
`require_doctor_or_admin`, `require_admin`, and related dependencies enforce role rules.

Files:

* `app/core/permissions.py`
* `app/api/deps.py`

### Pydantic

What it is:
Python data validation and serialization library.

Why it is used:
It validates request bodies and shapes responses.

How it works:
Schemas live in `app/schemas`.

Files:

* `app/schemas/*.py`

### Middleware

What it is:
Code that runs around every request.

Why it is used:
It captures request IP address for audit logging.

How it works:
`audit_context_middleware` stores `request.state.ip_address`.

Files:

* `app/middleware/audit_context.py`
* `app/main.py`

### Machine Learning Pipeline

What it is:
The process of training, saving, loading, and using ML models.

Why it is used:
The system predicts diabetes risk.

How it works:
Training creates `model.pkl` and `scaler.pkl`; `MLService` loads them for prediction.

Files:

* `app/ml/diabetes/train_diabetes_model.py`
* `app/services/ml_service.py`

### SHAP

What it is:
An explainability method that assigns contribution values to features.

Why it is used:
Medical AI should explain top contributing factors, not only output a score.

How it works:
`DiabetesSHAPService` computes SHAP values and returns top factors.

Files:

* `app/ml/diabetes/shap_service.py`

### ReportLab

What it is:
A Python library for generating PDFs.

Why it is used:
The system exports prediction reports.

How it works:
`PDFReportService` builds a PDF in memory and returns it through a streaming response.

Files:

* `app/services/pdf_report_service.py`
* `app/api/v1/endpoints/reports.py`

## Learning Roadmap

Recommended study order:

1. `app/main.py`
2. `app/core/config.py`
3. `app/db/base.py`
4. `app/db/session.py`
5. `app/models`
6. `app/schemas`
7. `app/repositories`
8. `app/api/deps.py`
9. `app/core/security.py`
10. `app/core/permissions.py`
11. `app/services/auth_service.py`
12. `app/api/v1/endpoints/auth.py`
13. `app/services/patient_service.py`
14. `app/api/v1/endpoints/patients.py`
15. `app/ml/diabetes/train_diabetes_model.py`
16. `app/services/ml_service.py`
17. `app/services/prediction_service.py`
18. `app/api/v1/endpoints/predict.py`
19. History, notification, reports, admin, and dashboard modules
20. Alembic migrations

Why this order:

This path starts with how the app starts, then how configuration and database access work, then data models, then validation, then persistence, then security, then business modules, then ML and advanced features. It follows the way requests actually move through the backend.

## File Guide

### `app/main.py`

Responsibility:
Create and configure FastAPI app.

Why it exists:
It is the application entry point.

Related files:
`app/api/v1/router.py`, `app/core/config.py`, `app/middleware/audit_context.py`.

Important functions:
`create_app`, `lifespan`.

Concepts demonstrated:
FastAPI app factory, middleware, lifespan.

### `app/core/config.py`

Responsibility:
Load settings from environment variables.

Why it exists:
Centralizes app, database, JWT, and threshold configuration.

Related files:
`.env.example`, `app/db/session.py`, `app/core/security.py`.

Important functions:
`database_url`, `get_settings`.

Concepts demonstrated:
Pydantic settings, environment config.

### `app/core/security.py`

Responsibility:
Password hashing and JWT handling.

Why it exists:
Keeps security primitives centralized.

Related files:
`app/services/auth_service.py`, `app/api/deps.py`.

Important functions:
`hash_password`, `verify_password`, `create_access_token`, `create_refresh_token`, `decode_access_token`, `decode_refresh_token`.

Concepts demonstrated:
bcrypt, JWT.

### `app/core/permissions.py`

Responsibility:
Permission and ownership utilities.

Why it exists:
Centralizes RBAC logic.

Related files:
`app/api/deps.py`, service files.

Important functions:
`require_roles`, `require_admin_role`, `require_same_user_or_admin`, `require_owner_or_admin`.

Concepts demonstrated:
RBAC, ownership checks.

### `app/db/base.py`

Responsibility:
Define SQLAlchemy base and reusable mixins.

Why it exists:
All models share a common declarative base and UUID/timestamp behavior.

Related files:
`app/models/*.py`.

Important classes:
`Base`, `UUIDPrimaryKeyMixin`, `TimestampMixin`.

Concepts demonstrated:
SQLAlchemy declarative base, UUID primary key.

### `app/db/session.py`

Responsibility:
Create SQLAlchemy engine and session factory.

Why it exists:
All database access depends on this configuration.

Related files:
`app/api/deps.py`, `app/core/config.py`.

Important objects:
`engine`, `SessionLocal`.

Concepts demonstrated:
Database engine, session lifecycle.

### `app/api/deps.py`

Responsibility:
Reusable FastAPI dependencies.

Why it exists:
Provides database sessions, current user, authorization checks, and ML service injection.

Related files:
`app/core/security.py`, `app/core/permissions.py`, `app/services/ml_service.py`.

Important functions:
`get_db`, `get_current_user`, `require_admin`, `require_doctor_or_admin`, `get_ml_service`.

Concepts demonstrated:
Dependency injection, JWT auth, RBAC.

### `app/models/user.py`

Responsibility:
User database entity and role enum.

Why it exists:
Represents accounts for doctors, patients, and admins.

Related files:
`app/schemas/user.py`, `app/repositories/user_repository.py`.

Important classes:
`User`, `UserRole`.

Concepts demonstrated:
ORM model, enum role.

### `app/models/patient.py`

Responsibility:
Patient medical record entity.

Why it exists:
Stores doctor-owned patient records.

Related files:
`app/schemas/patient.py`, `app/repositories/patient_repository.py`.

Important classes:
`Patient`, `Gender`.

Concepts demonstrated:
Ownership via `doctor_id`, unique constraints.

### `app/models/prediction.py`

Responsibility:
Prediction-related entities.

Why it exists:
Stores predictions, inputs, recommendations, SHAP values, and notifications.

Related files:
`app/schemas/prediction.py`, `app/repositories/prediction_repository.py`.

Important classes:
`Prediction`, `ClinicalInputDiabetes`, `ClinicalInputPCOS`, `Recommendation`, `ShapValue`, `Notification`.

Concepts demonstrated:
Relationships, cascade behavior, enum columns.

### `app/models/audit_log.py`

Responsibility:
Audit log entity.

Why it exists:
Tracks important user actions.

Related files:
`app/services/audit_service.py`, `app/repositories/audit_repository.py`.

Important class:
`AuditLog`.

Concepts demonstrated:
Audit trail.

### `app/repositories/*.py`

Responsibility:
Database queries.

Why they exist:
Prevent service and route layers from directly owning SQL query details.

Related files:
Models and services.

Important files:
`user_repository.py`, `patient_repository.py`, `prediction_repository.py`, `notification_repository.py`, `stats_repository.py`, `audit_repository.py`.

Concepts demonstrated:
Repository pattern.

### `app/services/*.py`

Responsibility:
Business logic and orchestration.

Why they exist:
Keep route files thin and organize feature behavior.

Important files:
`auth_service.py`, `patient_service.py`, `prediction_service.py`, `ml_service.py`, `notification_service.py`, `pdf_report_service.py`, `admin_service.py`, `dashboard_service.py`.

Concepts demonstrated:
Service layer, orchestration, transaction boundaries.

### `app/api/v1/endpoints/*.py`

Responsibility:
HTTP route definitions.

Why they exist:
Expose service functionality as REST endpoints.

Related files:
Schemas, dependencies, services.

Concepts demonstrated:
FastAPI routing, response models, request validation.

### `app/ml/diabetes/train_diabetes_model.py`

Responsibility:
Train diabetes model and save artifacts.

Why it exists:
Creates `model.pkl`, `scaler.pkl`, and evaluation output.

Related files:
`app/services/ml_service.py`, `app/ml/diabetes/shap_service.py`.

Concepts demonstrated:
Train/test split, scaling, RandomForestClassifier, metrics.

### `app/ml/diabetes/shap_service.py`

Responsibility:
Generate SHAP explanations for diabetes predictions.

Why it exists:
Provides explainable AI output.

Related files:
`app/services/ml_service.py`.

Concepts demonstrated:
SHAP, feature contribution ranking.

### `app/services/pdf_report_service.py`

Responsibility:
Generate prediction PDF reports.

Why it exists:
Creates downloadable medical-support reports.

Related files:
`app/api/v1/endpoints/reports.py`.

Concepts demonstrated:
ReportLab, PDF generation.

## Request Flow

### Login Request

```text
React
-> POST /api/v1/auth/login
-> auth.py router
-> AuthService.login
-> UserRepository.get_by_email
-> MySQL users table
-> bcrypt verify
-> AuditService.log_action
-> JWT access/refresh token creation
-> AuthResponse
```

### Register Request

```text
React
-> POST /api/v1/auth/register
-> RegisterRequest validation
-> AuthService.register
-> email uniqueness check
-> hash password
-> UserRepository.create
-> AuditService.log_action
-> commit
-> tokens + user response
```

### Patient Creation Request

```text
React
-> POST /api/v1/patients
-> JWT verification
-> require_doctor_or_admin
-> PatientService.create_patient
-> resolve doctor ownership
-> PatientRepository.create
-> AuditService.log_action
-> commit
-> PatientRead response
```

### Prediction Request

```text
React
-> POST /api/v1/predict/diabetes
-> request validation
-> JWT verification
-> require_doctor_or_admin
-> patient ownership check
-> MLService.predict_diabetes
-> scaler.pkl
-> model.pkl
-> SHAP service
-> PredictionRepository
-> save prediction/input/SHAP/recommendations
-> NotificationService if probability threshold exceeded
-> commit
-> PredictionResponse
```

### Prediction History Request

```text
React
-> GET /api/v1/predictions/{prediction_id}
-> JWT/RBAC
-> PredictionHistoryService
-> PredictionRepository with eager loading
-> MySQL
-> PredictionRead response
```

### PDF Export Request

```text
React
-> GET /api/v1/reports/predictions/{prediction_id}/pdf
-> JWT/RBAC
-> PredictionHistoryService.get_prediction
-> PDFReportService
-> ReportLab
-> StreamingResponse application/pdf
```

### Admin Statistics Request

```text
Admin UI
-> GET /api/v1/admin/stats
-> require_admin
-> AdminService
-> StatsRepository
-> aggregate SQL queries
-> AdminStats response
```

### Dashboard Request

```text
React
-> GET /api/v1/dashboard/summary
-> require_doctor_or_admin
-> DashboardService
-> StatsRepository
-> scoped or global metrics
-> DashboardSummary response
```

## Development Journal

### Phase 1: Project Foundation

Goal:
Create FastAPI backend skeleton.

Files created:
`main.py`, config, database session, health endpoint, Alembic setup.

Concepts introduced:
FastAPI, settings, SQLAlchemy engine, Alembic.

Challenges solved:
Clean project structure and database-ready foundation.

### Phase 2: User Module

Goal:
Create user model and repository.

Files created:
User model, user schemas, user repository, users migration.

Concepts introduced:
UUID primary keys, role enum, Pydantic schemas.

Challenges solved:
Single account table for doctor/patient/admin.

### Phase 3: Authentication

Goal:
Register, login, refresh token, password hashing, JWT.

Files created:
Auth service, auth router, auth schemas, security utilities.

Concepts introduced:
bcrypt, JWT, auth service.

Challenges solved:
Secure password storage and token generation.

### Phase 4: RBAC

Goal:
Role-based authorization.

Files created:
Permission utilities, auth dependencies, RBAC example routes.

Concepts introduced:
RBAC, admin override, ownership helpers.

Challenges solved:
Reusable role checks.

### Phase 5: Patient Management

Goal:
Doctor-owned patient CRUD.

Files created:
Patient model, schemas, repository, service, routes, migration.

Concepts introduced:
Ownership constraints, validation, CRUD service.

Challenges solved:
Doctors only see their own patients.

### Phase 6: Audit Logging

Goal:
Track important actions.

Files created:
Audit model, service, middleware, migration.

Concepts introduced:
Audit trail, request IP middleware.

Challenges solved:
Traceability for register/login/patient/admin actions.

### Phase 7: Prediction Structures

Goal:
Create database structures for predictions.

Files created:
Prediction models, schemas, migrations.

Concepts introduced:
Disease-specific input tables, recommendations, notifications.

Challenges solved:
Structured persistence for ML results.

### Phase 8: Diabetes Training

Goal:
Train and save diabetes model/scaler.

Files created:
Training script, notebook, ML guides.

Concepts introduced:
train/test split, scaling, RandomForest, metrics.

Challenges solved:
Reproducible training workflow.

### Phase 9: SHAP Explainability

Goal:
Explain model predictions.

Files created:
SHAP service and guide.

Concepts introduced:
SHAP top factors.

Challenges solved:
Explainable prediction output.

### Phase 10: MLService

Goal:
Create backend ML abstraction.

Files created:
MLService, ML dependency injection, guide.

Concepts introduced:
cached model loading, risk classification.

Challenges solved:
Routes do not touch model/scaler directly.

### Phase 11: Prediction Endpoints

Goal:
Create prediction API.

Files created:
Predict routes, prediction service, prediction repository, SHAP migration.

Concepts introduced:
ML orchestration, persistence, notification hook.

Challenges solved:
End-to-end diabetes prediction.

### Phase 12: Prediction History

Goal:
Read saved predictions.

Files created:
Prediction history routes and service.

Concepts introduced:
Eager loading, history queries.

Challenges solved:
Complete persisted result retrieval.

### Phase 13: Notifications

Goal:
Create and manage notifications.

Files created:
Notification service, repository, schemas, routes.

Concepts introduced:
threshold alerts, email draft preparation.

Challenges solved:
High-risk alert persistence.

### Phase 14: PDF Export

Goal:
Generate reports.

Files created:
PDF service, report route, example output documentation.

Concepts introduced:
ReportLab, StreamingResponse.

Challenges solved:
Downloadable prediction report.

### Phase 15: Admin Module

Goal:
Admin user management, audit logs, stats.

Files created:
Admin routes, service, schemas, audit/stats repositories.

Concepts introduced:
Admin-only endpoints, platform stats.

Challenges solved:
Administrative visibility and account control.

### Phase 16: Dashboard Statistics

Goal:
Role-aware dashboard summary.

Files created:
Dashboard routes, service, schemas.

Concepts introduced:
Scoped statistics, recent activity.

Challenges solved:
Doctor/admin dashboard data.

## Remaining Tasks

* Implement true refresh token persistence and revocation.
* Implement real logout by revoking refresh tokens.
* Add password reset flow.
* Add SMTP email sending.
* Train and integrate PCOS model.
* Add `model_versions` table and model metadata.
* Add automated tests.
* Add Dockerfile and production deployment files.
* Add CORS configuration.
* Add global exception handlers.
* Add rate limiting.
* Add failed login audit events.
* Add OpenAPI tags/descriptions polish.
* Add seed script for first admin.
* Add CI checks.
* Add structured logging.

## Technical Debt

* Refresh tokens are generated but not stored or revoked.
* Logout endpoint is currently only preparation.
* PCOS endpoint returns 501 because no PCOS model exists yet.
* Recommendation text is hardcoded inside `PredictionService`.
* Risk thresholds are educational placeholders.
* Dashboard and admin statistics overlap in query responsibilities.
* Notification schemas partially duplicate earlier prediction notification schemas.
* SHAP persistence was added after initial prediction structures rather than in the first prediction migration.
* No automated test suite exists yet.
* No production CORS/security middleware is configured.
* `joblib` artifacts require trust and checksum/version verification before production use.
* Email is prepared but not dispatched.
* PDF generation is synchronous.

## Presentation Notes

For professors:

* Start with the conception document requirements.
* Explain the layered architecture.
* Show the database entities.
* Demonstrate JWT login and RBAC.
* Demonstrate doctor patient ownership.
* Demonstrate diabetes prediction and SHAP factors.
* Export a PDF report.
* Show audit logs and admin stats.
* Clearly explain that PCOS model integration is prepared but not trained yet.

For recruiters:

* Emphasize clean separation of routers, services, repositories, models, and schemas.
* Explain ML integration as a service abstraction.
* Explain SHAP explainability.
* Explain production improvements you would implement next.
* Show that you understand security, traceability, and maintainability.

## Maintenance Rule

Whenever code changes, update this file in the same commit or development session. This document should always describe the current implementation, not an ideal future version.
