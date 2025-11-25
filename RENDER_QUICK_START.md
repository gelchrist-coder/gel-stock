# Render.com Deployment Checklist - Quick Start

**Everything is committed and ready! Follow these steps:**

---

## ⏱️ Estimated Time: 15-20 minutes

---

## Step 1: Go to Render.com (2 minutes)

1. Visit https://render.com/register
2. Sign up with your email
3. Verify email and login

---

## Step 2: Connect GitHub (2 minutes)

1. In Render.com dashboard: Click **"New +"** → **"Web Service"**
2. Click **"Connect a GitHub repository"**
3. Search: `gel-stock`
4. Click **"Connect"**

---

## Step 3: Create PostgreSQL Database (3 minutes)

1. Render.com dashboard: Click **"New +"** → **"PostgreSQL"**
2. Name: `gel-stock-db`
3. Database: `gel_stock`
4. Region: Choose closest to you
5. Plan: **Free tier**
6. Click **"Create Database"**
7. **Wait 2-3 minutes** for database to initialize

---

## Step 4: Get Database URL (1 minute)

1. Go to PostgreSQL details page
2. Copy the **Connection String**
3. Looks like: `postgres://user:password@host:5432/gel_stock`

---

## Step 5: Create Web Service (3 minutes)

1. Render.com: Click **"New +"** → **"Web Service"**
2. Select your `gel-stock` repository
3. Configure:
   - **Name:** `gel-stock-api`
   - **Environment:** `Node` (will auto-detect PHP)
   - **Region:** Same as PostgreSQL
   - **Branch:** `master`
4. Scroll to **"Advanced"**
5. In **"Environment Variables"** add:
   - **Key:** `DATABASE_URL`
   - **Value:** (Paste the connection string from Step 4)
6. Click **"Create Web Service"**

---

## Step 6: Wait for Deployment (5-10 minutes)

1. Go to Web Service → **"Events"** tab
2. Watch for:
   - ✅ `Build started`
   - ✅ `npm install`
   - ✅ `Setup database tables`
   - ✅ `Server listening on port`

3. Go to **"Logs"** tab to watch real-time logs

---

## Step 7: Test API (1 minute)

Once deployment completes:

1. Render.com shows you a URL like: `https://gel-stock-api-xxxxx.onrender.com`
2. Test it: Open in browser:
   ```
   https://gel-stock-api-xxxxx.onrender.com/api/test.php
   ```
3. Should see: `{"success":true}`

---

## Step 8: Update Frontend (1 minute)

1. Edit file: `dashboard/script.js`
2. Find: `this.apiBase = '../api/'` (around line 50-60)
3. Change to:
   ```javascript
   const isProduction = window.location.hostname === 'gel-stock.me';
   this.apiBase = isProduction 
       ? 'https://gel-stock-api-xxxxx.onrender.com/api/'  // Your URL from Step 7
       : '../api/';
   ```
4. Save file
5. Run:
   ```bash
   cd c:\GEL-STOCK
   git add dashboard/script.js
   git commit -m "Update API endpoint to production Render.com backend"
   git push origin master
   ```

6. Wait 2-3 minutes for GitHub Pages to update

---

## Step 9: Test Everything! (2 minutes)

### Test 1: Can I register?
1. Go to https://gel-stock.me
2. Click "Don't have an account? Create one"
3. Register with:
   - Business: `Test Company`
   - Owner: `Your Name`
   - Phone: `0501234567`
   - Password: `TestPass123`
   - Check "Remember Me"
4. Click Register
5. Should login automatically ✅

### Test 2: Can I login on another device?
1. On different device/browser:
2. Go to https://gel-stock.me
3. Enter phone: `0501234567`, password: `TestPass123`
4. Click Login
5. Should show your data (Business name, etc) ✅

### Test 3: Is data synced?
1. Device 1: Go to Settings
2. Change business name to something else
3. Save
4. Device 2: Refresh page
5. New business name should appear ✅

---

## If Something Goes Wrong

### API still not working?
1. Check Render.com Logs:
   - Service → Logs tab
   - Look for red "ERROR" messages
2. Check environment variables:
   - Service → Environment tab
   - Verify `DATABASE_URL` is set
3. Redeploy:
   - Service → Dashboard
   - Click "Redeploy" button

### Frontend still using offline mode?
1. Open browser DevTools (F12)
2. Console tab
3. Try to login
4. Look for errors
5. Check that API URL in script.js is correct

### Database connection failed?
1. Check PostgreSQL:
   - Go to database details page
   - Verify "Connection Status"
2. Check connection string:
   - Make sure DATABASE_URL matches exactly
3. Wait for database to be ready (can take 2-3 minutes)

---

## Success Criteria ✅

You'll know it's working when:

- ✅ Can register account on gel-stock.me
- ✅ Data stored in PostgreSQL (not just localStorage)
- ✅ Can login on 2 different devices with same phone/password
- ✅ Data syncs between devices
- ✅ "Remember Me" works (auto-login after closing browser)
- ✅ Browser console shows no API errors (F12)

---

## Render.com Dashboard Tips

**Bookmarks these URLs:**
- Web Service: https://dashboard.render.com/web/YOUR_SERVICE_ID
- PostgreSQL: https://dashboard.render.com/d/YOUR_DB_ID
- GitHub integration: https://github.com/settings/installations

**Auto-deploy on push:**
- Any push to `master` → Auto-deploys new version
- Takes 5-10 minutes
- Watch Logs tab to see progress

**Monitor uptime:**
- Service → Health tab
- Shows uptime, response times, errors
- Free tier has 99% SLA (some downtime OK)

---

## Costs

- **Web Service (PHP API):** Free tier ✅
- **PostgreSQL Database:** Free tier ✅
- **Total Cost:** $0/month until you scale up

---

## Need Help?

Read: `RENDER_DEPLOYMENT_GUIDE.md` for detailed instructions

---

**Ready? Let's deploy! 🚀**
