# GEL-STOCK: Render.com Production Setup Guide

## Overview

GEL-STOCK is now configured to use **Render.com PostgreSQL as the only database**. There is no offline mode or local fallback - all operations require a live connection to the Render.com backend.

## Prerequisites

- Render.com account (free tier eligible)
- Git and GitHub configured
- GEL-STOCK repository forked/cloned

## Deployment Steps

### Step 1: Create PostgreSQL Database on Render.com

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `gel-stock-db`
   - **Region**: Ohio (or your preferred region)
   - **PostgreSQL Version**: 15
   - **Datadog API Key**: Leave empty
4. Click **Create Database**
5. Wait for database to be "Available" (2-3 minutes)
6. Copy the **Internal Database URL** (example: `postgresql://username:password@host:5432/database`)
   - Save this for the Web Service configuration

### Step 2: Create Web Service on Render.com

1. Click **New +** → **Web Service**
2. Select the `gel-stock` repository
3. Configure:
   - **Name**: `gel-stock-api`
   - **Environment**: `Docker` or `Native` (we're using PHP native)
   - **Build Command**: (leave empty - uses .buildpacks)
   - **Start Command**: `/app/.heroku/php/bin/php -S 0.0.0.0:$PORT -t .`
   - **Region**: Same as database (Ohio)
   - **Plan**: Free
4. Click **Create Web Service**
5. Wait for the service to deploy (watch the Logs tab)

### Step 3: Set Environment Variables

1. On the Web Service page, go to **Environment**
2. Click **Add Environment Variable**
3. Set:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the PostgreSQL Internal URL from Step 1
   - Example: `postgresql://user:pass@gel-stock-db.c.internal:5432/gel_stock`

### Step 4: Verify Deployment

1. Watch the **Logs** tab for:
   ```
   ✅ Cloning from https://github.com/gelchrist-coder/gel-stock
   ✅ Detecting buildpack: PHP
   ✅ Installing PHP 8.2
   ✅ Running: /app/.heroku/php/bin/php -S 0.0.0.0:PORT -t .
   ✅ Service is live
   ```

2. Test the API:
   ```bash
   curl https://gel-stock-api-xxxxx.onrender.com/api/health.php
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "message": "API is healthy",
     "php_version": "8.2.x",
     "database_connected": true
   }
   ```

3. Test the frontend:
   - Visit `https://gel-stock.me` (GitHub Pages)
   - Should load the login screen

### Step 5: Configure API URL in Frontend

The frontend currently points to the local API (`../api/`). You need to update it for production:

1. Edit `dashboard/script.js`
2. Find line 5: `this.apiBase = '../api/'`
3. Change to: `this.apiBase = 'https://gel-stock-api-xxxxx.onrender.com/api/'`
   - Replace `xxxxx` with your actual Render.com service subdomain
4. Commit and push:
   ```bash
   git add dashboard/script.js
   git commit -m "Update API base URL for production Render.com deployment"
   git push origin master
   ```

### Step 6: Initialize Database

1. Access the setup endpoint:
   ```
   https://gel-stock-api-xxxxx.onrender.com/api/setup.php
   ```
   
2. This will:
   - Create all required database tables
   - Create indexes
   - Return setup confirmation

3. Check the response for success (you should see `"success": true`)

### Step 7: Create First User

1. Go to `https://gel-stock.me`
2. Click **Don't have an account? Register here**
3. Register with:
   - Phone: Ghana number (0XXXXXXXXX or +233XXXXXXXXX)
   - Password: Your choice (min 6 characters)
4. Click Register
5. Should see "Registration successful!"
6. Login with the same credentials

## Important Notes

### Database URL Format

Render.com provides the URL in this format:
```
postgresql://username:password@host:5432/database
```

- `host` ends with `.c.internal` for Internal URL (use this for Web Service)
- `host` is a public URL for External URL (don't use for Web Service)

### Environment Variables

- **DATABASE_URL**: Required. Set in Web Service Environment settings
- No other environment variables needed for basic functionality
- All configuration is in `api/config.php`

### File Structure

```
/api/
  ├── config.php          ← Database configuration
  ├── auth.php            ← Login/register API
  ├── products.php        ← Product management API
  ├── sales.php           ← Sales API
  └── setup.php           ← Database initialization

/dashboard/
  ├── script.js           ← Frontend (calls /api/)
  ├── index.html          ← UI layout
  └── styles.css          ← Styling

.buildpacks              ← Tells Render.com to use PHP buildpack
Procfile                 ← Startup command
```

## Troubleshooting

### Error: "No DATABASE_URL set"

**Solution**: 
1. Go to Web Service → Environment
2. Verify DATABASE_URL is set
3. Copy the Internal URL (not External URL)
4. Example: `postgresql://...@gel-stock-db.c.internal:5432/...`

### Error: "Connection refused" when accessing `/api/health.php`

**Possible causes**:
1. Web Service is still building (wait 3-5 minutes)
2. Wrong URL in apiBase
3. CORS issue (check api/config.php CORS settings)

**Solution**:
1. Check Logs tab for deployment status
2. Verify correct service URL: `https://gel-stock-api-xxxxx.onrender.com`
3. Test with curl: `curl -v https://gel-stock-api-xxxxx.onrender.com/api/health.php`

### Error: "Database connection failed"

**Possible causes**:
1. DATABASE_URL incorrect or not set
2. PostgreSQL service not running
3. Wrong Internal vs External URL

**Solution**:
1. Verify PostgreSQL service shows "Available"
2. Copy Internal URL (not External URL)
3. Ensure it ends with `.c.internal`
4. Verify username and password are correct

### Login fails with "Invalid phone or password"

**Possible causes**:
1. User not created yet (need to register first)
2. Database tables not initialized (run `/api/setup.php`)
3. Incorrect phone format

**Solution**:
1. Visit `/api/setup.php` to initialize database
2. Register a new user first
3. Use Ghana phone format: 0XXXXXXXXX or +233XXXXXXXXX

## Security Considerations

### For Production:

1. **API_KEY_REQUIRED**: Set to `true` in `api/config.php`
   - Uncomment and add API key generation

2. **CORS_ENABLED**: Currently `true` (allows all origins)
   - Restrict to specific domains in production

3. **Database Access**: 
   - Use Internal URL (`.c.internal`) for Web Service
   - Only Internal Network can access
   - External URL would expose database to internet

4. **Passwords**: 
   - Stored using bcrypt hashing
   - Never stored in plaintext
   - Never logged or exposed in errors

## Deployment Commands

```bash
# Check current branch
git branch

# Make sure you're on master
git checkout master

# Push latest changes to GitHub
git push origin master

# On Render.com, the deployment will auto-trigger when you push

# Verify deployment
curl https://gel-stock-api-xxxxx.onrender.com/api/health.php
```

## Monitoring

### Check Deployment Status:
- Go to Web Service → Logs
- See real-time build and runtime logs

### Check Database Status:
- Go to PostgreSQL Service → Logs
- Verify no connection errors

### Check API Status:
- Test endpoint: `https://gel-stock-api-xxxxx.onrender.com/api/health.php`
- Should return JSON with `"success": true`

## Rollback Procedure

If something breaks:

1. **Revert latest commit**:
   ```bash
   git revert HEAD
   git push origin master
   ```

2. **Render.com will auto-redeploy** (2-3 minutes)

3. **Check logs** to verify deployment succeeded

## Support

For issues:

1. Check `Logs` tab on Render.com for error messages
2. Check `api/health.php` for database connection status
3. Verify DATABASE_URL in Environment variables
4. Test API endpoints with curl
5. Check browser console for frontend errors (F12)

---

**Status**: ✅ Production Ready
**Database**: Render.com PostgreSQL
**Fallback**: None (production mode only)
**Last Updated**: November 27, 2025
