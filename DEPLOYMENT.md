# MedPredict AI - 100% Free Cloud Deployment Guide

This guide walks you through deploying the complete full-stack **MedPredict AI** application (React frontend, FastAPI backend, and cloud MySQL database) for **free**.

---

## Architecture Overview

- **Database**: Cloud MySQL (Free on [Aiven.io](https://aiven.io) or [TiDB Cloud](https://tidbcloud.com))
- **Backend API**: FastAPI on [Render.com](https://render.com) (Free Web Service)
- **Frontend SPA**: React + Vite on [Vercel.com](https://vercel.com) (Free Hobby Tier)

---

## Step 1: Create Free Cloud MySQL Database (~2 minutes)

You can choose either **Aiven** or **TiDB Cloud** (both offer 100% free MySQL):

### Option A: Aiven for MySQL (Recommended)
1. Sign up / Log in to [Aiven.io](https://aiven.io).
2. Click **Create Service** -> Select **MySQL**.
3. Choose the **Free Plan** (available in supported regions like Google Cloud / AWS).
4. Name the service `medpredict-db` and click **Create Service**.
5. Once running (takes ~1-2 min), copy the **Service URI**. It looks like:
   ```text
   mysql://avnadmin:PASSWORD@HOST:PORT/defaultdb?ssl-mode=REQUIRED
   ```
6. Keep this URI handy for Step 2.

### Option B: TiDB Cloud Serverless (MySQL-Compatible)
1. Sign up / Log in to [TiDB Cloud](https://tidbcloud.com).
2. Create a free **Serverless** cluster (5 GB free forever).
3. Under **Connect**, generate credentials and copy the connection string.

---

## Step 2: Deploy Backend to Render (~3 minutes)

1. Sign up / Log in to [Render.com](https://render.com) using your **GitHub account**.
2. Click **New +** -> **Web Service**.
3. Connect your repository: `medpredect.v.0.1`.
4. Configure the service settings:
   - **Name**: `medpredict-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install --no-cache-dir -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     bash start.sh
     ```
   - **Instance Type**: Select **Free**.
5. Add the following **Environment Variables**:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `PYTHON_VERSION` | `3.11.10` | Uses pre-built wheels for fast and error-free builds |
   | `DATABASE_URL` | *(Paste your connection string from Step 1)* | Automatically runs migrations and seeds default users |
   | `APP_ENV` | `production` | Production environment mode |
   | `APP_DEBUG` | `false` | Disable debug in production |
   | `JWT_SECRET_KEY` | *(Click Generate or enter a random 32+ char string)* | For access token signing |
   | `JWT_REFRESH_SECRET_KEY` | *(Click Generate or enter a random 32+ char string)* | For refresh token signing |
   | `CORS_ORIGINS` | `*` *(or your Vercel URL once created in Step 3)* | Allows your frontend to communicate with backend |

6. Click **Create Web Service**.
7. Once deployed, Render will provide your public backend URL, for example:
   ```text
   https://medpredict-backend.onrender.com
   ```
   Test it in your browser: `https://medpredict-backend.onrender.com/api/v1/health`.

---

## Step 3: Deploy Frontend to Vercel (~2 minutes)

1. Sign up / Log in to [Vercel.com](https://vercel.com) using your **GitHub account**.
2. Click **Add New...** -> **Project**.
3. Import the `medpredect.v.0.1` repository.
4. In the project setup screen:
   - **Framework Preset**: `Vite` (automatically detected).
   - **Root Directory**: Click **Edit** and select `frontend`.
5. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://medpredict-backend.onrender.com` *(your Render backend URL from Step 2)*
6. Click **Deploy**.
7. In ~30 seconds, your site will be live at `https://<your-project>.vercel.app`!

---

## Default Accounts Seeded Automatically

Once your backend runs the migrations and `seed_users.py`, you can log in immediately with:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@medpredict.com` | `Admin123!` |
| **Doctor** | `doctor@medpredict.com` | `Doctor123!` |
| **Patient** | `patient@medpredict.com` | `Patient123!` |

*(Remember to change default passwords or disable test accounts in production settings).*
