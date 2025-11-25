# GEL-STOCK Backend Deployment to Render.com

## Overview
This guide walks you through deploying the GEL-STOCK backend API to Render.com with PostgreSQL database.

**Deployment Mode:** Hybrid Authentication
- **Primary:** Backend API with PostgreSQL (multi-device sync)
- **Fallback:** Offline mode using localStorage (works without internet)

---

## Prerequisites

1. **GitHub Account** - Repository already connected (gelchrist-coder/gel-stock)
2. **Render.com Account** - Free (https://render.com/register)
3. **Domain:** gel-stock.me (already configured)

---

## Step 1: Create Render.com Account

1. Go to https://render.com/register
2. Sign up with email
3. Verify email
4. Complete profile setup

---

## Step 2: Connect GitHub Repository to Render.com

1. Log in to Render.com dashboard
2. Click **"New +"** → **"Web Service"**
3. Select **"Connect a GitHub repository"**
4. Search for `gel-stock` repository
5. Click **"Connect"**

---

## Step 3: Configure Web Service

### Basic Settings
- **Name:** `gel-stock-api`
- **Environment:** `Ruby` (will switch to PHP after)
- **Region:** Choose closest to you (e.g., Frankfurt, Singapore)
- **Branch:** `master`

### Build & Deploy
- **Build Command:** (Leave empty for now)
- **Start Command:** (Will set from render.yaml)

### Environment Variables
**Leave empty** - will use `DATABASE_URL` from PostgreSQL

---

## Step 4: Create PostgreSQL Database

1. In Render.com dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `gel-stock-db`
   - **Database:** `gel_stock`
   - **User:** Auto-generated
   - **Region:** Same as web service
   - **Plan:** Free tier

3. Click **"Create Database"**
4. **Wait 2-3 minutes** for database to be ready

---

## Step 5: Connect Database to Web Service

1. Go to Web Service → `gel-stock-api`
2. Scroll to **"Environment"**
3. Click **"Add Environment Variable"**
4. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** Copy from PostgreSQL database details page
     - Format: `postgres://user:password@host:5432/gel_stock`

---

## Step 6: Update Render.yaml

The `render.yaml` file has been pre-configured. It will:
1. ✅ Use `DATABASE_URL` environment variable (no hardcoded passwords)
2. ✅ Run PHP development server on Render.com PORT
3. ✅ Execute `api/setup.php` to create database tables automatically
4. ✅ Enable health checks on `/api/test.php`

**No changes needed!** The file is ready to deploy.

---

## Step 7: Deploy

### Option A: Auto-Deploy (Recommended)
Push code to GitHub master branch → Render.com automatically deploys:

```bash
git push origin master
```

### Option B: Manual Deploy
1. Go to Render.com dashboard
2. Web Service → `gel-stock-api`
3. Click **"Redeploy"** → **"Deploy latest commit"**

**Deployment takes 5-10 minutes. Watch the logs:**
- Go to **"Events"** or **"Logs"** tab
- Should see `✓ Database tables created`
- Should see `✓ PHP Development Server listening`

---

## Step 8: Verify API Deployment

Once deployment completes:

```bash
# Test basic API connection
curl https://gel-stock-api.onrender.com/api/test.php

# Should return: {"success":true,"message":"API is working"}
```

Or in browser:
```
https://gel-stock-api.onrender.com/api/test.php
```

---

## Step 9: Update Frontend to Use Backend API

The frontend (`gel-stock.me`) currently makes API calls to:
```javascript
this.apiBase = '../api/';  // Relative path (localhost)
```

Need to update this to point to Render.com:

1. Edit `dashboard/script.js`
2. Find line with `this.apiBase = '../api/'`
3. Change to:
```javascript
// Production: Use Render.com API
this.apiBase = 'https://gel-stock-api.onrender.com/api/';

// Local development: Use relative path
// this.apiBase = '../api/';
```

Or better, use environment detection:
```javascript
const isProduction = window.location.hostname === 'gel-stock.me';
this.apiBase = isProduction ? 'https://gel-stock-api.onrender.com/api/' : '../api/';
```

4. Commit and push:
```bash
git add dashboard/script.js
git commit -m "Update frontend API endpoint to use Render.com backend"
git push origin master
```

5. Frontend at gel-stock.me will auto-update (GitHub Pages)

---

## Step 10: Test Cross-Device Login

1. Go to https://gel-stock.me
2. Register new account:
   - Phone: `0501234567`
   - Password: `TestPass123`
   - Check **"Remember Me"**
3. Click Login

4. **On different device/browser:**
   - Go to https://gel-stock.me
   - Log in with same phone/password
   - Should login successfully ✅

5. **Test data sync:**
   - Device 1: Update business name in Settings
   - Device 2: Refresh page
   - Change should be visible ✅

---

## Troubleshooting

### Issue: "Connection Refused" or "Database not initialized"
**Solution:**
1. Check Render.com logs (Web Service → Logs tab)
2. Look for setup errors
3. Manually trigger setup:
   ```bash
   curl -X POST https://gel-stock-api.onrender.com/api/setup.php
   ```

### Issue: "502 Bad Gateway"
**Possible causes:**
1. API server still starting (wait 1-2 minutes)
2. DATABASE_URL environment variable not set
3. PostgreSQL database not ready

**Solution:**
1. Check Render.com logs
2. Verify DATABASE_URL in environment variables
3. Restart web service: Dashboard → Web Service → Redeploy

### Issue: "API calls timing out"
**Solution:**
1. Check internet connection
2. Verify `apiBase` URL is correct in script.js
3. Check browser console for CORS errors (F12)

### Issue: Frontend still using offline mode
**Possible causes:**
1. API endpoint URL wrong in script.js
2. CORS not enabled in api/config.php
3. Database not initialized

**Solution:**
1. Open browser console (F12)
2. Check Network tab during login
3. Look for error response from API
4. Check api/config.php has `CORS_ENABLED = true`

---

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgres://user:pass@host:5432/gel_stock` |
| `API_MODE` | Set to "production" | `production` |
| `CORS_ENABLED` | Allow cross-origin requests | `true` |
| `LOG_ERRORS` | Enable error logging | `true` |

---

## Render.com Dashboard Layout

```
Dashboard
├── Web Service: gel-stock-api
│   ├── Dashboard (overview, URL, status)
│   ├── Deploy (redeploy, manual)
│   ├── Logs (deployment & runtime logs)
│   ├── Events (deployment history)
│   ├── Environment (DATABASE_URL, etc)
│   ├── Settings (region, plan, etc)
│   └── Health (uptime, response times)
│
└── PostgreSQL: gel-stock-db
    ├── Connection (host, port, user, password)
    ├── Details (region, storage)
    ├── Backups (automatic daily)
    └── Logs (database activity)
```

---

## Post-Deployment Checklist

- [ ] Render.com account created
- [ ] GitHub repo connected
- [ ] Web service deployed (gel-stock-api)
- [ ] PostgreSQL database created (gel-stock-db)
- [ ] DATABASE_URL set in environment variables
- [ ] API test endpoint returns success
- [ ] Frontend script.js points to correct API URL
- [ ] Cross-device login tested
- [ ] Data sync verified between devices

---

## Production vs Development

### Development (Local)
```
Frontend: http://localhost:9000
Backend: http://localhost:9000/api/
Database: PostgreSQL/SQLite local
Mode: Hybrid (backend + offline fallback)
```

### Production (Render.com + GitHub Pages)
```
Frontend: https://gel-stock.me (GitHub Pages)
Backend: https://gel-stock-api.onrender.com/api/ (Render.com)
Database: PostgreSQL (Render.com managed)
Mode: Hybrid (backend + offline fallback)
```

---

## Support & Documentation

- **Render.com Docs:** https://render.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **GEL-STOCK Repo:** https://github.com/gelchrist-coder/gel-stock
- **Frontend:** https://gel-stock.me
- **Backend API:** https://gel-stock-api.onrender.com

---

## Next Steps

1. ✅ Code committed and pushed
2. 🔄 **Create Render.com account** (this guide)
3. 🔄 **Deploy web service**
4. 🔄 **Deploy PostgreSQL database**
5. 🔄 **Update frontend API endpoint**
6. 🔄 **Test cross-device login**
7. 🎯 **Monitor logs and uptime**

---

**Deployment Status:** Ready to deploy! Follow the steps above. ✅
