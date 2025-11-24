# GEL-STOCK Full Cloud Deployment Guide

**Status**: Ready for production deployment  
**Last Updated**: November 24, 2025  
**Deployment Target**: gel-stock.me

---

## Quick Start (5 Minutes)

### For Render.com Deployment:

```bash
# 1. Create Render.com account
# Go to: https://render.com (Sign up is free)

# 2. Create Web Service
# - Click "New +" → "Web Service"
# - Connect GitHub repo: gelchrist-coder/gel-stock
# - Name: gel-stock-api
# - Environment: PHP
# - Build Command: echo "No build needed"
# - Start Command: cd api && php -S 0.0.0.0:10000

# 3. Add Environment Variables
# DB_HOST=dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com
# DB_PORT=5432
# DB_NAME=gelstockdb
# DB_USER=gelstockdb_user
# DB_PASS=4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A
# CORS_ENABLED=true

# 4. Deploy
# Click "Create Web Service" and wait ~5 minutes

# 5. Configure DNS at your domain registrar
# Add CNAME: gel-stock.me → gel-stock-api.onrender.com
```

---

## Complete Architecture

```
User Browser
    │
    ├─→ https://gel-stock.me (Frontend)
    │   └─→ GitHub Pages
    │       ├─→ index.html
    │       ├─→ dashboard/
    │       └─→ assets/
    │
    └─→ https://gel-stock.me/api/* (Backend APIs)
        └─→ Render.com (PHP)
            ├─→ auth_fallback.php (Login/Register)
            ├─→ products.php (Product CRUD)
            ├─→ sales.php (Sales Transactions)
            ├─→ customers.php (Customer Data)
            └─→ ... (Other endpoints)
                │
                └─→ PostgreSQL Database (Render.com)
                    ├─→ users table
                    ├─→ user_sessions table
                    ├─→ products table
                    ├─→ sales table
                    └─→ ... (Other tables)
```

---

## Step-by-Step Deployment

### Step 1: Prepare Repository

The following files are already in your repo:

- ✅ `Procfile` - Render.com configuration
- ✅ `render.yaml` - Service definitions
- ✅ `.env.example` - Environment variables template
- ✅ `api/index.php` - API router
- ✅ `api/auth_fallback.php` - Authentication handler
- ✅ `CNAME` - GitHub Pages domain configuration

**Nothing to do** - all files are ready!

### Step 2: Deploy to Render.com

#### Option A: Via Web Dashboard (Recommended)

1. Go to: https://dashboard.render.com
2. Sign up if you don't have an account
3. Click **"New +"** → **"Web Service"**
4. Select **"Connect a repository"**
5. Choose: `gelchrist-coder/gel-stock`
6. Fill in configuration:

   | Field | Value |
   |-------|-------|
   | **Name** | gel-stock-api |
   | **Environment** | PHP |
   | **Region** | Oregon (US) or closest to you |
   | **Branch** | master |
   | **Build Command** | `echo "GEL-STOCK API"` |
   | **Start Command** | `cd api && php -S 0.0.0.0:10000` |

7. Add **Environment Variables** (copy these exactly):

   ```
   DB_HOST=dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com
   DB_PORT=5432
   DB_NAME=gelstockdb
   DB_USER=gelstockdb_user
   DB_PASS=4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A
   CORS_ENABLED=true
   ```

8. Click **"Create Web Service"**
9. Wait for deployment (5-10 minutes)
10. Copy the URL when ready (e.g., `https://gel-stock-api.onrender.com`)

#### Option B: Via render.yaml (Automatic)

If Render.com supports `render.yaml`:

```bash
# Just push to GitHub
git add -A
git commit -m "Add Render.com deployment configuration"
git push origin master
# Render automatically deploys based on render.yaml
```

### Step 3: Test Backend Deployment

Once Render.com shows "Live":

```bash
# Test endpoint
curl https://gel-stock-api.onrender.com/api/test.php

# Should return JSON with database status
```

### Step 4: Configure DNS for gel-stock.me

Go to your domain registrar (GoDaddy, Namecheap, Bluehost, etc.):

1. Log into your domain control panel
2. Find **DNS Settings** or **DNS Management**
3. Add a **CNAME record**:

   | Type | Name | Value |
   |------|------|-------|
   | CNAME | @ (or gel-stock.me) | gel-stock-api.onrender.com |

4. **Save changes**
5. Wait 24-48 hours for DNS propagation

**Verify DNS is working:**

```bash
# On Windows PowerShell
nslookup gel-stock.me

# Should show: gel-stock-api.onrender.com
```

### Step 5: Test Full Deployment

Once DNS is live:

```bash
# 1. Test backend
curl https://gel-stock.me/api/test.php

# 2. Test frontend
# Open in browser: https://gel-stock.me

# 3. Test login/register
# Should create user in PostgreSQL automatically
```

---

## Troubleshooting

### Backend Deployment Issues

| Problem | Solution |
|---------|----------|
| "Build failed" | Check Procfile syntax and start command |
| "Service failed" | Check environment variables in Render dashboard |
| "Cannot connect to database" | Verify DB_HOST, DB_USER, DB_PASS in env vars |
| "404 errors on API calls" | Check api/index.php routing table |

### DNS Issues

| Problem | Solution |
|---------|----------|
| "gel-stock.me shows GitHub 404" | CNAME not set up yet, wait 24-48 hours |
| "Cannot resolve gel-stock.me" | Check DNS with `nslookup gel-stock.me` |
| "API timeout" | Render service might be sleeping (free tier), upgrade to starter |

### Database Connection Issues

| Problem | Solution |
|---------|----------|
| "Cannot connect to PostgreSQL" | Verify SSL=true in connection string |
| "Connection timeout" | Check firewall/security groups on Render |
| "User authentication failed" | Verify exact DB_USER and DB_PASS |

---

## API Endpoints

All endpoints are now accessible at: `https://gel-stock.me/api/`

### Authentication

```
POST /api/auth_fallback.php
Body: { "action": "login", "phone": "+233xxx", "password": "***" }
Returns: { "success": true, "sessionToken": "...", "user": {...} }
```

### Products

```
GET /api/products.php
POST /api/products.php
PUT /api/products.php
DELETE /api/products.php
```

### Sales

```
GET /api/sales.php
POST /api/sales.php
```

### Other Endpoints

All endpoints from api/ folder are accessible with same structure.

---

## Environment Variables Reference

```bash
# Database
DB_HOST=dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=gelstockdb
DB_USER=gelstockdb_user
DB_PASS=4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A

# API
CORS_ENABLED=true
API_MODE=production
API_BASE_URL=https://gel-stock.me/api

# Frontend
FRONTEND_URL=https://gel-stock.me

# Admin
ADMIN_KEY=admin123

# Session
SESSION_TIMEOUT=2592000

# Business
CURRENCY=GHS
BUSINESS_NAME=GEL-STOCK
TIMEZONE=Africa/Accra
```

---

## Monitoring

### Check Deployment Status

1. **Render Dashboard**: https://dashboard.render.com
   - Click service → see CPU, memory, logs
   - Check "Events" tab for deployment history

2. **PostgreSQL Status**: https://dashboard.render.com
   - Check database service metrics

3. **Frontend Status**: https://github.com/gelchrist-coder/gel-stock/deployments
   - View GitHub Pages deployment history

### View Logs

```bash
# SSH into Render service
render ssh --service gel-stock-api

# Or use dashboard Logs tab
```

---

## Performance Optimization

### For Production Use:

1. **Upgrade Render Plan**
   - Free tier: sleeps after 15 min inactivity
   - Starter ($7/mo): always on, 0.5 CPU, 512MB RAM
   - Recommended: Starter plan for production

2. **Database Optimization**
   - PostgreSQL Starter ($7/mo): 1 concurrent connection
   - PostgreSQL Standard ($12/mo): better for multiple users

3. **Caching**
   - Add Redis (Render supports it)
   - Cache frequently accessed data

### Costs (Estimated)

| Component | Tier | Cost |
|-----------|------|------|
| Frontend | GitHub Pages | FREE |
| Backend | Render Starter | $7/month |
| Database | PostgreSQL Starter | $7/month |
| **Total** | | **~$14/month** |

---

## Security Checklist

- [x] Database credentials in environment variables (not in code)
- [x] CORS enabled for cross-origin requests
- [x] HTTPS enforced (Render auto-enables this)
- [x] Password hashing with bcrypt (auth_fallback.php)
- [x] Session tokens with 30-day expiration
- [x] Admin key protection (admin_stats.php)

### Additional Security Steps:

1. Change `ADMIN_KEY` to a secure value
2. Consider IP whitelisting on PostgreSQL
3. Enable rate limiting on API endpoints
4. Monitor access logs regularly

---

## Rollback & Updates

### To Update Code:

```bash
# 1. Make changes locally
# 2. Push to GitHub
git add -A
git commit -m "Your changes"
git push origin master

# 3. Render auto-deploys (watch dashboard)
# 4. Check logs for errors
# 5. If broken, push fix or revert with git
```

### To Revert:

```bash
git revert HEAD
git push origin master
# Render deploys previous version
```

---

## Next Steps

1. ✅ Verify this guide
2. Create Render.com account
3. Follow **Step 2-5** above
4. Test all endpoints
5. Monitor dashboard for first week

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **GitHub Pages**: https://pages.github.com
- **GEL-STOCK Repo**: https://github.com/gelchrist-coder/gel-stock

---

**Questions?** Check the logs in Render dashboard or review api/config.php and api/index.php
