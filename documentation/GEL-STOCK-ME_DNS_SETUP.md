# gel-stock.me - DNS Configuration Guide

**Status**: Ready for DNS setup  
**Domain**: gel-stock.me  
**Current**: CNAME file created, GitHub Pages enabled, Render.com backend ready  

---

## What is gel-stock.me?

Your custom domain for accessing GEL-STOCK dashboard. Instead of using GitHub Pages' long URL, users can visit:

```
https://gel-stock.me  (Your domain)
↓
gelchrist-coder.github.io/gel-stock (GitHub Pages backend)
↓
gel-stock.me/api (Render.com API backend)
↓
PostgreSQL Database (Cloud storage)
```

---

## Current Status ✅

- ✅ **Repository**: CNAME file created with "gel-stock.me"
- ✅ **GitHub Pages**: Enabled for gel-stock.me
- ✅ **Render.com**: PostgreSQL configured and tested
- ✅ **Frontend**: Dashboard ready at https://github.com/gelchrist-coder/gel-stock
- ⏳ **DNS**: Needs configuration at your domain registrar

---

## DNS Setup Steps (Choose One Option)

### Option 1: CNAME Record (Recommended) ⭐

**Best for GitHub Pages + Render.com combined domain**

#### Step 1: Go to Your Domain Registrar

- **GoDaddy**: https://www.godaddy.com/
- **Namecheap**: https://www.namecheap.com/
- **Bluehost**: https://www.bluehost.com/
- **Hostinger**: https://www.hostinger.com/
- **Other**: Search "[Your registrar] DNS settings"

#### Step 2: Find DNS Management

Look for options like:
- "DNS Settings"
- "DNS Management"
- "Domain Management"
- "Advanced DNS"
- "Name Servers"

#### Step 3: Add CNAME Record

Create a new CNAME record:

| Field | Value |
|-------|-------|
| **Type** | CNAME |
| **Name** | @ (or gel-stock.me) |
| **Value** | gelchrist-coder.github.io |
| **TTL** | 3600 (default) |

**Example in GoDaddy interface:**
```
Type:    CNAME
Name:    @
Data:    gelchrist-coder.github.io
TTL:     3600
```

#### Step 4: Save

Click "Save" or "Update"

#### Step 5: Wait for DNS Propagation

DNS changes take **24-48 hours** to propagate globally.

Check progress:
```powershell
# On Windows PowerShell
nslookup gel-stock.me

# Should show: gelchrist-coder.github.io
```

---

### Option 2: A Records (Alternative)

If CNAME doesn't work, use GitHub's A records:

#### Step 1: Add 4 A Records

| Field | Value |
|-------|-------|
| Type | A |
| Name | @ |
| Value | 185.199.108.153 |

| Field | Value |
|-------|-------|
| Type | A |
| Name | @ |
| Value | 185.199.109.153 |

| Field | Value |
|-------|-------|
| Type | A |
| Name | @ |
| Value | 185.199.110.153 |

| Field | Value |
|-------|-------|
| Type | A |
| Name | @ |
| Value | 185.199.111.153 |

#### Step 2: Wait for Propagation

DNS changes take 24-48 hours.

---

### Option 3: Subdomain (If Main Domain Used)

If you already have a CNAME for main domain, create subdomain:

| Field | Value |
|-------|-------|
| Type | CNAME |
| Name | app (creates app.gel-stock.me) |
| Value | gelchrist-coder.github.io |

Then access at: `https://app.gel-stock.me`

---

## After DNS is Configured

### Verify DNS Setup

```powershell
# Check CNAME record
nslookup gel-stock.me

# Should resolve to: gelchrist-coder.github.io
```

### Test Access

1. Open browser: `https://gel-stock.me`
2. Should see GEL-STOCK dashboard
3. Login with your account
4. Should connect to cloud database

### Test API

```powershell
# Test backend endpoint
Invoke-WebRequest https://gel-stock.me/api/test.php

# Should return database status JSON
```

---

## Troubleshooting DNS

### Problem: "gel-stock.me shows GitHub 404 page"

**Cause**: DNS is set up but GitHub Pages doesn't recognize the domain

**Solution**:
1. Go to GitHub repo settings: https://github.com/gelchrist-coder/gel-stock/settings/pages
2. Under "Custom domain", enter: `gel-stock.me`
3. Click "Save"
4. Check "Enforce HTTPS"
5. Wait 5 minutes

### Problem: "Cannot resolve gel-stock.me"

**Cause**: DNS records not yet propagated

**Solution**:
1. Wait 24-48 hours
2. Clear DNS cache:
   ```powershell
   ipconfig /flushdns
   ```
3. Try again: `nslookup gel-stock.me`

### Problem: "SSL certificate error"

**Cause**: HTTPS not working yet

**Solution**:
1. Wait for GitHub to issue SSL certificate (5-10 minutes after DNS setup)
2. Clear browser cache
3. Try incognito window
4. Check certificate: `https://gel-stock.me`

### Problem: "Backend API returns 404"

**Cause**: Render.com backend not deployed yet

**Solution**:
1. Deploy to Render.com (see CLOUD_DEPLOYMENT_COMPLETE.md)
2. Update frontend API URL in script.js
3. Ensure CORS enabled in api/config.php
4. Test: `https://gel-stock.me/api/test.php`

---

## API Endpoints After DNS Setup

Once fully deployed, these endpoints will work:

```
https://gel-stock.me                    # Frontend dashboard
https://gel-stock.me/api/auth           # Login/Register
https://gel-stock.me/api/products       # Product management
https://gel-stock.me/api/sales          # Sales transactions
https://gel-stock.me/api/dashboard      # Analytics
https://gel-stock.me/api/customers      # Customer data
```

---

## Security Notes

1. **HTTPS is automatic** - GitHub Pages and Render provide SSL/TLS
2. **No password in DNS** - All credentials stored in environment variables
3. **CORS configured** - API accessible from gel-stock.me domain only
4. **Database secured** - PostgreSQL requires authentication

---

## Cost

- **Domain**: Varies by registrar ($10-15/year)
- **Frontend**: FREE (GitHub Pages)
- **Backend**: FREE-$7/month (Render free tier or starter)
- **Database**: FREE-$7/month (Render PostgreSQL)

**Total**: $10-15/year for domain + optional backend costs

---

## Next Steps

1. ✅ DNS configured with CNAME or A records
2. ✅ GitHub Pages custom domain enabled
3. ✅ Render.com backend deployed
4. ✅ Test gel-stock.me in browser
5. ✅ Share link with team!

---

## Registrar-Specific Instructions

### GoDaddy
1. Log in to godaddy.com
2. Find your domain
3. Click "DNS" or "Manage DNS"
4. Add new record → CNAME
5. Name: `@` | Value: `gelchrist-coder.github.io`
6. Save

### Namecheap
1. Log in to namecheap.com
2. Click "Manage" next to your domain
3. Go to "Advanced DNS" tab
4. Click "Add New Record"
5. Type: CNAME | Name: `@` | Value: `gelchrist-coder.github.io`
6. Save

### Bluehost
1. Log in to bluehost.com
2. Find your domain in "My Domains"
3. Click "Manage" or "Update DNS"
4. Find CNAME section
5. Add: `@` → `gelchrist-coder.github.io`
6. Save

### Hostinger
1. Log in to hostinger.com
2. Go to "Domains" → Your Domain
3. Click "DNS/Nameservers" tab
4. Add DNS Record: CNAME | `@` | `gelchrist-coder.github.io`
5. Save changes

---

**Questions?** Check DNS with: `nslookup gel-stock.me`  
**Need Help?** Visit: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-pages-site
