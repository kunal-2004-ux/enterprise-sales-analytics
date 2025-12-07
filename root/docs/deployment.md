# Free Tier Deployment Guide

This guide describes how to deploy the full stack application for **free** using the best available services for 2024/2025.

**Strategy:**
- **Database**: **Neon** (Serverless PostgreSQL) or **Supabase**. Best free tiers that don't delete your data after inactivity.
- **Backend**: **Render**. Offers a free Web Service tier (spins down after inactivity, causing a ~50s delay on first request, but completely free).
- **Frontend**: **Vercel**. Perfect for Vite/React apps.

---

## 1. Database (Neon)
1. Go to [neon.tech](https://neon.tech) and Sign Up.
2. Create a new Project (e.g., `sales-dashboard`).
3. Copy the **Connection String** (e.g., `postgres://user:pass@ep-xyz.us-east-1.aws.neon.tech/neondb...`).
   - ensure you select "Pooled connection" if available, or standard is fine for low traffic.
4. **Migration**:
   - You need to create the schema in this new cloud DB.
   - You can connect to it using a tool like **pgAdmin** or **DBeaver** on your local machine using the connection string.
   - Run the SQL commands from your `scripts/schema.sql` (or if you ingest data via script, simply point your local ingestion script to this new PROD URL and run it once).

## 2. Backend (Render)
1. Push your latest code to GitHub.
2. Go to [dashboard.render.com](https://dashboard.render.com) and Sign Up.
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. **Settings**:
   - **Root Directory**: `backend` (Important! Your node app is inside this folder).
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. **Environment Variables** (Advanced / Environment):
   - Key: `DATABASE_URL`
   - Value: (Paste your Neon Connection String)
   - Key: `PORT`
   - Value: `3001` (or let Render assign one, usually `10000`, Render injects `PORT` automatically).
7. Click **Deploy Web Service**.
8. Once live, copy the **Service URL** (e.g., `https://my-api.onrender.com`).

## 3. Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com) and Sign Up.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. **Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: Click "Edit" and select `frontend`.
5. **Environment Variables**:
   - Key: `VITE_API_BASE`
   - Value: (Paste your Render Backend URL, e.g., `https://my-api.onrender.com`)
     - *Note: Do not add a trailing slash.*
6. Click **Deploy**.

## 4. Verification
1. Open your Vercel App URL.
2. It might take 30-60 seconds to load data the FIRST time (because Render backend is waking up).
3. Subsequent requests will be fast.
