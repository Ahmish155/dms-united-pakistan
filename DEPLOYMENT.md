# Deployment & Operational Blueprint
# United Pakistan — Dawati Management System (DMS)

## Free-Tier-First Architecture
The system is architected for zero-cost deployment using industry-standard free-tier services.

| Service | Component | Free Tier Policy | Operational Considerations |
|---|---|---|---|
| **MongoDB Atlas** | Database | Shared M0 (512MB storage, RAM shared) | Automatic daily snapshots, TLS connection string. Must monitor connection pool limits. |
| **Render** | Node/Express Backend | Free Web Service (512MB RAM) | Free instances spin down after 15 mins of inactivity. A lightweight self-ping or uptime ping avoids cold start delays during core operating hours. |
| **Vercel** | React Vite Frontend | Hobby Tier (Unlimited bandwidth within personal scope) | Global edge CDN, automated preview builds on PRs. |
| **GitHub Actions** | CI/CD | 2,000 free minutes/month | Automated linting, TypeScript type-checks, and unit test suites on push. |

## Environment Variables Configuration

### Server (`server/.env`)
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/dms?retryWrites=true&w=majority
JWT_SECRET=super_secret_production_key_min_32_chars
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://dms-frontend.vercel.app
RATE_LIMIT_MAX=100
```

### Client (`client/.env`)
```env
VITE_API_BASE_URL=https://dms-backend.onrender.com/api/v1
```

## Production Verification Checklist
1. [ ] Set `NODE_ENV=production` on Render.
2. [ ] Restrict MongoDB Atlas IP whitelist to Render outbound IPs or `0.0.0.0/0` with strong password and SCRAM-SHA-256.
3. [ ] Verify secure CORS origin matching frontend domain.
4. [ ] Run seed script for initial Sector Gulraiz workspace metadata.
