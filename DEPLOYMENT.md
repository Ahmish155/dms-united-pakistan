# Deployment & Operational Blueprint
# United Pakistan — Dawati Management System (DMS)

## Free-Tier-First Architecture
The system is architected for 100% free online production deployment using industry-standard free-tier services with zero hosting costs.

| Service | Component | Free Tier Policy | Operational Considerations |
|---|---|---|---|
| **Vercel** | Unified Frontend & Serverless Backend | Hobby Tier (Free) | Vite React SPA hosted on Global Edge CDN (`client/dist`). Express REST API bundled as a Vercel serverless function (`api/index.ts`). Single-domain deployment prevents CORS issues. |
| **MongoDB Atlas** | Database Storage | Shared M0 (512MB storage, shared RAM, free forever) | TLS encrypted connection, automated daily snapshots, SCRAM-SHA-256 authentication. Connection pooling handled via cached Mongoose client. |
| **Firebase Auth** | Authentication & Identity | Free Spark Plan (50,000 Monthly Active Users free) | Supports Email/Password and Google OAuth sign-in with zero friction and zero cost. ID tokens verified and synchronized with MongoDB user collection. |

---

## 1. Vercel Configuration (`vercel.json`)
The monorepo contains a root [vercel.json](file:///c:/Users/Shekhani%20Laptops/Downloads/DMS/vercel.json) that automatically orchestrates both frontend building and backend API serverless routing:
- **Build Target**: `client/package.json` $\to$ `dist`
- **Serverless API Function**: `api/index.ts` $\to$ `/api/(.*)` routes to Express serverless adapter
- **Single Page App Routing**: All other URLs route to `client/index.html`

---

## 2. Environment Variables Configuration

### Vercel Project Settings (Environment Variables)

Add the following environment variables in your Vercel Project Dashboard (`Settings` $\to$ `Environment Variables`):

```env
# 1. Server & Database
NODE_ENV=production
MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/dms?retryWrites=true&w=majority
JWT_SECRET=super_secret_production_key_min_32_chars_united_pakistan_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*

# 2. Firebase Authentication (Client)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=dms-united-pakistan.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dms-united-pakistan
VITE_FIREBASE_STORAGE_BUCKET=dms-united-pakistan.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

---

## 3. Step-by-Step Online Deployment Guide

### Step 1: Set up Free MongoDB Atlas Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register for a free account.
2. Create a free **M0 Shared Cluster** (e.g. AWS `eu-west-1` or `ap-south-1`).
3. Under **Database Access**, create a database user (e.g., `dms_admin`) with password.
4. Under **Network Access**, add IP `0.0.0.0/0` (Allow Access from Anywhere) so Vercel's serverless lambdas can connect.
5. Click **Connect** $\to$ **Drivers** $\to$ Copy connection string (`mongodb+srv://...`).

### Step 2: Set up Free Firebase Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project (e.g., `dms-united-pakistan`).
2. Navigate to **Build** $\to$ **Authentication** $\to$ **Sign-in method**.
3. Enable **Email/Password** and **Google**.
4. In **Project Settings** $\to$ **General** $\to$ **Your apps**, click the Web icon `</>` to register a web app.
5. Copy the `firebaseConfig` keys into your environment variables.

### Step 3: Deploy to Vercel
1. Push this repository to GitHub or GitLab:
   ```bash
   git add .
   git commit -m "feat: complete DMS production release with Firebase and Vercel"
   git push origin main
   ```
2. Log into [Vercel](https://vercel.com/) and click **Add New Project**.
3. Select your repository. Vercel automatically detects the root `vercel.json`.
4. Paste the environment variables from Section 2 above.
5. Click **Deploy**.
6. Once deployed, run the database seed once against your MongoDB Atlas URI:
   ```bash
   MONGO_URI="your_atlas_connection_string" npm run seed
   ```
   Or visit the app and register the initial Super Admin account!
