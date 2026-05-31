# Production Deployment Guide: Shares of Goodness Backend

This document contains step-by-step instructions for deploying the Node.js + Express backend to production using **Render** or **Railway** (free/affordable tiers) and connecting it with your Angular frontend hosted on Vercel.

---

## 1. Required Environment Variables

When deploying the backend, you must configure the following Environment Variables in your hosting provider's dashboard:

| Variable | Description | Example / Recommended Value |
|---|---|---|
| `NODE_ENV` | Environment context | `production` |
| `PORT` | Listening port for the server | `5000` (Render/Railway override this automatically) |
| `MONGODB_URI` | Production MongoDB Atlas Connection string | `mongodb+srv://...` |
| `FRONTEND_URL` | Allowed origin for CORS (your Vercel app URL) | `https://shares-of-goodness.vercel.app` |
| `SUPABASE_URL` | URL of your Supabase storage project | `https://xyz.supabase.co` |
| `SUPABASE_KEY` | Supabase API/Service Role key | `eyJhbGciOi...` |
| `SUPABASE_BUCKET_NAME`| Name of the storage bucket for receipts | `donation-receipts` |
| `TELEGRAM_BOT_TOKEN` | Bot token for admin notification alerts | `123456:ABC...` |
| `TELEGRAM_CHAT_ID` | Telegram chat ID for admin group | `-100...` |
| `FIREBASE_SERVICE_ACCOUNT`| Stringified single-line FCM service account JSON | `{"type":"service_account",...}` |
| `JWT_SECRET` | Secret key for JWT generation | (Generate a secure random string) |

---

## 2. Database Setup: MongoDB Atlas (Free Tier)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new Shared Cluster (Free tier).
3. Under **Database Access**, create a database user with a secure password (avoid special characters in password).
4. Under **Network Access**, choose **Allow Access From Anywhere** (`0.0.0.0/0`) so Render/Railway servers can connect.
5. In **Database Clusters**, click **Connect** -> **Connect your application**.
6. Copy the connection string, replace `<username>` and `<password>`, and use this as your `MONGODB_URI`.

---

## 3. Render Deployment Guide (Recommended Free Option)

Render is extremely easy to use and provides an excellent free tier for web services.

### Dashboard Deployment:
1. Sign up/Log in at [Render](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service settings:
   - **Name**: `shares-of-goodness-backend`
   - **Root Directory**: `backend`
   - **Language**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **Advanced** and add your **Environment Variables** (see Section 1).
6. Click **Create Web Service**.

---

## 4. Railway Deployment Guide

Railway offers fast deployments and excellent developer tooling.

### CLI Deployment:
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Link your project: `railway link` (or create a new project with `railway init`)
4. Set root directory path in the Railway Dashboard under settings if deploy doesn't start automatically inside the subfolder. Or use a Dockerfile.
5. Deploy: `railway up`

### Dashboard Deployment:
1. Go to [Railway](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub**.
3. Select your repository.
4. Under **Settings**, set **Root Directory** to `backend`.
5. Under **Variables**, add the required environment variables.
6. Railway will automatically build and deploy your service using Nixpacks.

---

## 5. Connecting Frontend ↔ Backend

### In your Angular App (on Vercel):
Ensure the API base URL points to your deployed backend domain (e.g., `https://shares-of-goodness-backend.onrender.com`).
1. In your Angular codebase, update `src/environments/environment.prod.ts`:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://shares-of-goodness-backend.onrender.com/api'
   };
   ```
2. Redeploy the frontend to Vercel.

### In your Backend App:
Make sure the environment variable `FRONTEND_URL` matches your deployed Angular app's Vercel URL (e.g., `https://shares-of-goodness.vercel.app`).

---

## 6. Custom Domain Setup

### Render:
1. In your Render Web Service dashboard, go to **Settings** -> **Custom Domains**.
2. Click **Add Custom Domain** and enter your domain name.
3. Configure your DNS provider:
   - Add a `CNAME` pointing to the Render sub-domain.
   - Or add an `A` record pointing to the Render IP if configuring a root domain.

### Railway:
1. In the Railway Service dashboard, click **Settings** -> **Domains**.
2. Click **Custom Domain** and enter your domain.
3. Add the displayed `CNAME` record in your DNS provider's DNS management console.
