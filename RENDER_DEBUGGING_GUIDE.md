# GEL-STOCK Render.com Deployment - Debugging Guide

## When Deployment Fails

If you see "Failed" status on Render.com, follow these steps to identify the exact problem.

---

## Step 1: Check the Logs (CRITICAL)

1. Go to your **Web Service** on Render.com
2. Click **"Logs"** tab
3. **Scroll to the bottom** - look for error messages
4. Share the **last 20 lines** with me

### Common Error Patterns

#### Error: "bash: line 1: php: command not found"
```
✗ Means: Render.com didn't install PHP
✓ Solution: Delete service and create new one
            Make sure it detects buildpack as "PHP"
```

#### Error: "Port already in use"
```
✗ Means: Another process using the PORT
✓ Solution: Usually temporary, try redeploy
            Render.com assigns new PORT automatically
```

#### Error: "Cannot connect to database"
```
✗ Means: DATABASE_URL not set or invalid
✓ Solution: Check Environment Variables
            Verify Internal URL (with .c.internal)
```

#### Error: "Parse error" in PHP
```
✗ Means: PHP syntax error in code
✓ Solution: Check browser console for details
            Usually index.php or api/config.php
```

#### Error: "No such file or directory"
```
✗ Means: Route/file not found
✓ Solution: Check that index.php exists at root
            Verify api/ folder is present
```

---

## Step 2: Check Environment Variables

1. Go to Web Service → **"Environment"**
2. Verify these exist:
   ```
   DATABASE_URL = postgres://user:pass@dpg-xxxxx.c.internal:5432/gel_stock
   ```
3. If missing:
   - Add it from PostgreSQL database details page
   - Use **Internal Database URL** (not External)
   - Should have `.c.internal` in the hostname

---

## Step 3: Check PostgreSQL Status

1. Go to your **PostgreSQL database** on Render.com
2. Look for status (should be **"Connected"**)
3. Check "Connection Info" tab
4. Verify:
   - **Host:** Has `.c.internal` domain
   - **Port:** 5432
   - **User:** Matches your database user
   - **Database:** `gel_stock`

If status is **"Creating"** or **"Initializing"**:
- **Wait 2-3 minutes** and refresh
- Databases can take time to initialize

If status is **"Error"** or **"Failed"**:
- Delete and recreate the database
- Choose same region as Web Service

---

## Step 4: If Deployment Succeeded But API Returns Error

1. Test health endpoint:
   ```
   https://gel-stock-api-xxxxx.onrender.com/api/health.php
   ```
   
   **Expected result:**
   ```json
   {
     "success": true,
     "message": "API is running",
     "php_version": "8.1.x",
     "database_url": "configured"
   }
   ```

2. If you see `"database_url": "not_configured"`:
   - DATABASE_URL environment variable not set
   - Go to Web Service → Environment
   - Add DATABASE_URL from PostgreSQL page

3. If PHP syntax error appears:
   - Check exact error message
   - Usually in api/config.php or api/auth.php
   - Share error with me for quick fix

---

## Step 5: Deployment Checklist

Before creating Web Service, verify:

- [ ] You have PostgreSQL database already created
- [ ] You have copied the **Internal** Database URL
- [ ] GitHub repository is connected to Render.com
- [ ] Latest code is pushed to master branch
- [ ] Procfile exists in root (just committed)
- [ ] index.php exists in root

---

## Step 6: If Still Failing - Provide This Info

When asking for help, include:

1. **Status:** Failed / Building / Live?
2. **Last error line** from Logs tab
3. **Full error message** (copy entire error)
4. **Environment Variables** set (screenshot)
5. **PostgreSQL status** (Connected / Failed / Creating?)
6. **Commit hash** of latest code

---

## Quick Fixes to Try

### Fix #1: Delete and Recreate Service
```
1. Web Service → Settings → Delete Service
2. Confirm deletion
3. Create NEW Web Service (fresh setup)
4. Should auto-detect PHP now
```

### Fix #2: Redeploy Current Service
```
1. Web Service → Dashboard
2. Click "Redeploy" button
3. Wait 5-10 minutes
4. Watch Logs tab
```

### Fix #3: Check Procfile
```
File should contain exactly:
web: bash startup.sh

NOT:
web: php -S 0.0.0.0:$PORT
web: npm start
web: composer install
```

---

## Expected Logs Output (Successful)

```
Nov 25 10:30:00  ==> Cloning repository...
Nov 25 10:30:05  ==> Detecting buildpack: PHP
Nov 25 10:30:10  ==> Installing PHP 8.1.27
Nov 25 10:30:20  ==> Running: bash startup.sh
Nov 25 10:30:21  Starting GEL-STOCK API on port 51234...
Nov 25 10:30:21  PHP Version: PHP 8.1.27 (cli)
Nov 25 10:30:21  DATABASE_URL: postgres://user:pass@dpg-xxxxx...
Nov 25 10:30:22  Listening on http://0.0.0.0:51234
Nov 25 10:30:25  ==> Service is live
```

If you see this, deployment succeeded! ✅

---

## Still Not Working?

Share with me:
1. The exact error message from Logs
2. Screenshot of Environment Variables
3. PostgreSQL connection status
4. Whether you deleted the old service before creating new one

I can then provide a specific fix! 🔧
