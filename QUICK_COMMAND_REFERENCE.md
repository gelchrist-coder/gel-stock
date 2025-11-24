# GEL-STOCK Cloud Deployment - Quick Command Reference

## PowerShell Commands for Your Setup

### 1. Test Render.com Deployment (After it's live)

```powershell
# Test backend API connection
Invoke-WebRequest https://gel-stock-api.onrender.com/api/test.php

# Or shorter:
curl https://gel-stock-api.onrender.com/api/test.php
```

### 2. Check DNS Configuration

```powershell
# Verify gel-stock.me resolves
nslookup gel-stock.me

# Should show: gelchrist-coder.github.io
```

### 3. Start Local Development Server

```powershell
# From GEL-STOCK directory
cd c:\GEL-STOCK
php -S localhost:9000

# Then visit: http://localhost:9000
```

### 4. Test API Locally

```powershell
# Test auth endpoint
Invoke-WebRequest http://localhost:9000/api/auth_fallback.php

# Test specific endpoint
curl http://localhost:9000/api/products.php
```

### 5. Git Operations

```powershell
# Check status
cd c:\GEL-STOCK
git status

# Commit changes
git add -A
git commit -m "Your message here"

# Push to GitHub
git push origin master

# View log
git log --oneline -5
```

### 6. Database Operations

```powershell
# Check users in PostgreSQL (requires psql installed)
psql -h dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com \
     -U gelstockdb_user \
     -d gelstockdb \
     -c "SELECT id, username, email, created_at FROM users;"

# Count all users
psql -h dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com \
     -U gelstockdb_user \
     -d gelstockdb \
     -c "SELECT COUNT(*) as user_count FROM users;"

# View sessions
psql -h dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com \
     -U gelstockdb_user \
     -d gelstockdb \
     -c "SELECT * FROM user_sessions LIMIT 10;"
```

### 7. Test Full Deployment (After DNS is working)

```powershell
# Test frontend
Invoke-WebRequest https://gel-stock.me
# Should return HTML dashboard

# Test backend
Invoke-WebRequest https://gel-stock.me/api/test.php
# Should return JSON with database status

# Test auth endpoint
Invoke-WebRequest https://gel-stock.me/api/auth_fallback.php
# Should return auth response
```

### 8. Monitor Render.com Service

```powershell
# Open Render dashboard in browser
Start-Process https://dashboard.render.com

# Or curl to check service status
curl -I https://gel-stock-api.onrender.com
# Should return HTTP 200
```

### 9. View GitHub Deployment Status

```powershell
# Open GitHub deployments page
Start-Process https://github.com/gelchrist-coder/gel-stock/deployments

# Or check GitHub Pages settings
Start-Process https://github.com/gelchrist-coder/gel-stock/settings/pages
```

### 10. Flush DNS Cache (If DNS changed)

```powershell
# Clear local DNS cache
ipconfig /flushdns

# Then verify domain
nslookup gel-stock.me
```

---

## Environment Variables (For Render.com)

Copy these exactly when setting up Render.com service:

```
DB_HOST=dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=gelstockdb
DB_USER=gelstockdb_user
DB_PASS=4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A
CORS_ENABLED=true
API_MODE=production
ADMIN_KEY=admin123
SESSION_TIMEOUT=2592000
TIMEZONE=Africa/Accra
CURRENCY=GHS
BUSINESS_NAME=GEL-STOCK
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Read `documentation/CLOUD_DEPLOYMENT_COMPLETE.md`
- [ ] Read `documentation/GEL-STOCK-ME_DNS_SETUP.md`
- [ ] Create Render.com account
- [ ] Have domain registrar login ready

### Render.com Setup
- [ ] Create "Web Service"
- [ ] Connect GitHub repo
- [ ] Set name: gel-stock-api
- [ ] Set environment: PHP
- [ ] Add all environment variables
- [ ] Set start command: `cd api && php -S 0.0.0.0:10000`
- [ ] Click "Create Web Service"
- [ ] Wait for "Live" status
- [ ] Copy deployment URL

### DNS Setup
- [ ] Log into domain registrar
- [ ] Add CNAME record: `@` → `gelchrist-coder.github.io`
- [ ] Save changes
- [ ] Wait 24-48 hours
- [ ] Verify: `nslookup gel-stock.me`

### Post-Deployment
- [ ] Test: `https://gel-stock.me`
- [ ] Test: `https://gel-stock.me/api/test.php`
- [ ] Register test user
- [ ] Check PostgreSQL for user data
- [ ] Test login from different device
- [ ] Check offline mode (disable network)
- [ ] Monitor Render dashboard for errors

---

## Troubleshooting Commands

### Problem: Can't connect to database

```powershell
# Test PostgreSQL connection
psql -h dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com \
     -U gelstockdb_user \
     -d gelstockdb \
     -c "SELECT NOW();"

# If works, shows current timestamp
```

### Problem: API endpoint returns 404

```powershell
# Check if Render service is running
curl -v https://gel-stock-api.onrender.com

# Check for errors in logs (via Render dashboard)
# Or SSH: render ssh --service gel-stock-api
```

### Problem: DNS not resolving

```powershell
# Flush DNS and try again
ipconfig /flushdns
nslookup gel-stock.me

# Try with specific nameserver
nslookup gel-stock.me 8.8.8.8 (Google DNS)
```

### Problem: GitHub Pages not loading

```powershell
# Check GitHub Pages settings
Start-Process https://github.com/gelchrist-coder/gel-stock/settings/pages

# Verify CNAME file exists
git show HEAD:CNAME
# Should output: gel-stock.me
```

---

## Performance Monitoring

### Check Render Service Status

```powershell
# In Render dashboard: https://dashboard.render.com
# Click your service → Metrics tab
# View: CPU, Memory, Requests, Response Time
```

### Check Database Performance

```powershell
# List slow queries (requires psql)
psql -h dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com \
     -U gelstockdb_user \
     -d gelstockdb \
     -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### Monitor Request Logs

```powershell
# View Render logs
# Method 1: Dashboard → Service → Logs tab
# Method 2: CLI (if render-cli installed)
# render logs --service gel-stock-api
```

---

## Common URLs

| URL | Purpose |
|-----|---------|
| https://gel-stock.me | Frontend dashboard |
| https://gel-stock.me/api/test.php | API health check |
| https://dashboard.render.com | Monitor services |
| https://github.com/gelchrist-coder/gel-stock | Repository |
| http://localhost:9000 | Local development |
| https://nslookup.io | DNS lookup tool |

---

## Useful Links

- **Render Docs**: https://render.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **GitHub Pages**: https://pages.github.com
- **DNS Checker**: https://mxtoolbox.com/dnscheck.aspx

---

**Keep this file handy for quick command reference!**

Created: November 24, 2025
