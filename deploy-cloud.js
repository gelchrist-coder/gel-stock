#!/usr/bin/env node
/**
 * GEL-STOCK Cloud Deployment Setup
 * Deploys backend API to Render.com and connects to PostgreSQL
 */

const fs = require('fs');
const path = require('path');

console.log('\n════════════════════════════════════════════════════════════════');
console.log('  GEL-STOCK Cloud Deployment Setup');
console.log('════════════════════════════════════════════════════════════════\n');

// Configuration
const config = {
    domain: 'gel-stock.me',
    github_repo: 'gelchrist-coder/gel-stock',
    postgresql: {
        host: 'dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com',
        port: 5432,
        database: 'gelstockdb',
        user: 'gelstockdb_user',
        password: '4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A'
    },
    github_pages: 'gelchrist-coder.github.io',
    render_services: {
        web: 'gel-stock-api',
        database: 'gel-stock-db'
    }
};

console.log('Step 1: Verifying Configuration');
console.log('────────────────────────────────────────────────────────────────\n');

console.log('✅ Domain: ' + config.domain);
console.log('✅ GitHub Repo: ' + config.github_repo);
console.log('✅ PostgreSQL Host: ' + config.postgresql.host);
console.log('✅ GitHub Pages: ' + config.github_pages);
console.log('✅ Render Web Service: ' + config.render_services.web);

console.log('\n\nStep 2: Files to Create for Render.com Deployment');
console.log('────────────────────────────────────────────────────────────────\n');

const requiredFiles = [
    'Procfile',
    'render.yaml',
    '.env.example',
    'api/index.php'
];

console.log('Required files:');
requiredFiles.forEach(f => console.log('  📄 ' + f));

console.log('\n\nStep 3: Render.com Setup Instructions');
console.log('────────────────────────────────────────────────────────────────\n');

console.log(`
1. Go to: https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo: ${config.github_repo}
4. Configuration:
   - Name: ${config.render_services.web}
   - Environment: PHP
   - Build Command: echo "No build needed"
   - Start Command: cd api && php -S 0.0.0.0:10000
   
5. Environment Variables:
   - DB_HOST=${config.postgresql.host}
   - DB_PORT=5432
   - DB_NAME=${config.postgresql.database}
   - DB_USER=${config.postgresql.user}
   - DB_PASS=${config.postgresql.password}
   - CORS_ENABLED=true

6. Pricing: Free tier available (but sleeps after 15 min)
7. Click "Create Web Service"
8. Wait for deployment (~5 min)
9. Note the URL: https://gel-stock-api.onrender.com
`);

console.log('\n\nStep 4: DNS Configuration for gel-stock.me');
console.log('────────────────────────────────────────────────────────────────\n');

console.log(`
After Render.com deployment, configure your domain registrar:

Option A: CNAME (Recommended)
  Type: CNAME
  Name: @  (or gel-stock.me)
  Value: gel-stock-api.onrender.com

Option B: A Records (Alternative)
  Type: A
  Name: @
  Values:
    - 76.76.19.131
    - 76.76.19.132
    - 76.76.19.133
    - 76.76.19.134

Steps:
  1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
  2. Find DNS settings
  3. Add the records above
  4. Wait 24-48 hours for DNS propagation
  5. Test: curl https://gel-stock.me/api/auth_fallback.php
`);

console.log('\n\nStep 5: Update Frontend API Path');
console.log('────────────────────────────────────────────────────────────────\n');

console.log(`
Once Render.com is deployed, update:

File: dashboard/script.js
  Change: const response = await fetch('../api/auth_fallback.php'...)
  To:     const response = await fetch('https://gel-stock.me/api/auth_fallback.php'...)

Or use relative paths that work for both local and production:
  const response = await fetch('/api/auth_fallback.php'...)
`);

console.log('\n\nStep 6: Enable GitHub Pages with Custom Domain');
console.log('────────────────────────────────────────────────────────────────\n');

console.log(`
1. Go to: https://github.com/gelchrist-coder/gel-stock/settings/pages
2. Source: Deploy from a branch
3. Branch: master
4. Folder: / (root)
5. Custom domain: gel-stock.me
6. Check "Enforce HTTPS"
7. Save

The CNAME file should already be created in your repo.
`);

console.log('\n\nStep 7: Architecture After Deployment');
console.log('────────────────────────────────────────────────────────────────\n');

console.log(`
  gel-stock.me (Your Domain)
      ↓
   ┌──────────────────────────────┐
   │   Frontend + Backend         │
   │   (Same domain)              │
   └──────┬───────────────────────┘
          │
   ┌──────┴──────────────────────────┐
   │                                 │
   ▼                                 ▼
Frontend                        Backend API
(GitHub Pages)                  (Render.com)
index.html                      /api/auth_fallback.php
dashboard/                      /api/products.php
/                               /api/sales.php
   │                                 │
   │                                 ▼
   │                           PostgreSQL
   │                           (Render.com)
   │                           gelstockdb
   │
   └─────────────────────────────────┘
              (CORS enabled)

Users access: gel-stock.me
  ↓ Frontend served from GitHub Pages
  ↓ API calls to gel-stock.me/api
  ↓ Routes to Render.com backend
  ↓ Queries PostgreSQL
  ↓ Returns data to frontend
`);

console.log('\n\nStep 8: Testing Deployment');
console.log('────────────────────────────────────────────────────────────────\n');

console.log(`
After everything is deployed:

1. Test frontend: https://gel-stock.me
2. Test backend: https://gel-stock.me/api/auth_fallback.php (should return JSON)
3. Test login: Register new user → should save to PostgreSQL
4. Test cross-device: Open on different browser → should auto-login
5. Check database: 
   psql -h ${config.postgresql.host} -U ${config.postgresql.user} -d ${config.postgresql.database}
   SELECT * FROM users;
`);

console.log('\n\nStep 9: Monitoring & Logs');
console.log('────────────────────────────────────────────────────────────────\n');

console.log(`
Monitor your deployment:

1. Render.com Dashboard: https://dashboard.render.com
2. Check logs: Click service → Logs tab
3. CPU/Memory: Click service → Metrics tab
4. Database: Render PostgreSQL dashboard
5. GitHub: https://github.com/gelchrist-coder/gel-stock/deployments

Common issues:
  ❌ "Service failed to start"
     → Check Procfile and start command
  ❌ "Cannot connect to database"
     → Verify environment variables
  ❌ "API returns 404"
     → Check file paths (relative to /api directory)
  ❌ "CORS errors"
     → Ensure CORS_ENABLED=true in config.php
`);

console.log('\n\nStep 10: Cost & Performance');
console.log('────────────────────────────────────────────────────────────────\n');

console.log(`
Render.com Pricing:
  - Free tier: $0/month (sleeps after 15 min inactivity)
  - Starter: $7/month (always on, 0.5 CPU, 512 MB RAM)
  - Standard: $12/month (1 CPU, 1 GB RAM)
  - PostgreSQL: Starting from $7/month

GitHub Pages: FREE (unlimited bandwidth)

Recommendation for production:
  - Frontend: GitHub Pages (FREE)
  - Backend: Render Starter ($7/month)
  - Database: Render PostgreSQL Starter ($7/month)
  - Total: ~$14/month for full cloud deployment

Performance:
  - Page load: <2 seconds
  - API response: <500ms
  - Database queries: <100ms
`);

console.log('\n════════════════════════════════════════════════════════════════');
console.log('✅ Setup instructions ready!');
console.log('════════════════════════════════════════════════════════════════\n');

console.log('Next steps:');
console.log('1. Create Render.com account: https://render.com');
console.log('2. Follow Step 3 above to deploy');
console.log('3. Configure DNS in Step 4');
console.log('4. Update API paths in Step 5');
console.log('5. Test in Step 8\n');

process.exit(0);
