# Quick Test: Hybrid Authentication (Backend + Offline)

## What Changed?
Your cross-device login was broken because the frontend wasn't calling the real authentication API. Now it:
1. **Tries backend first** (PostgreSQL via `api/auth.php`)
2. **Falls back to offline** (localStorage JSON) if backend is unavailable
3. **Supports "Remember Me"** across browser closes

## Test Scenario 1: Offline Mode (No Database)

### Step 1: Clear Browser Storage
1. Open browser DevTools (F12)
2. Application → Storage → Local Storage
3. Delete all entries starting with `gel_`
4. Close DevTools

### Step 2: Register New Account
1. Go to http://localhost:9000
2. Click "Don't have an account? Register"
3. Fill form:
   - Business Name: `Test Company`
   - Owner Name: `Test User`
   - Email: (leave blank - optional)
   - Phone: `0501234567` (or any Ghana number)
   - Password: `TestPass123`
   - Check "I agree to terms and conditions"
4. Click Register

**Expected Result:** ✅ Account created, redirected to dashboard

### Step 3: Check Storage
1. Open DevTools → Application → Local Storage
2. Look for `gel_offline_users` - should contain your user data
3. Close DevTools

### Step 4: Test Remember Me
1. Log out (Settings → Logout)
2. Go back to login
3. Enter phone: `0501234567`, password: `TestPass123`
4. **Check "Remember Me"** ✓
5. Click Login
6. Verify logged in ✅

### Step 5: Test Persistence
1. **Close browser completely** (all windows)
2. **Reopen browser**
3. Go to http://localhost:9000
4. **Should be automatically logged in** ✅ (because Remember Me stored in localStorage)

**What You'll See:**
- If localStorage still has your session → Auto-login happens
- If localStorage expired → Shows login screen (go back to Step 2)

---

## Test Scenario 2: Online Mode (With Database)

### Prerequisites
You need PostgreSQL running with:
- Users table with at least one test user
- User sessions tracking enabled

### Step 1: Verify Backend Connection
```powershell
# In terminal/PowerShell:
Invoke-WebRequest http://localhost:9000/api/test.php | Select-Object Content
```

**Expected Result:** Should show `{"success":true}` or similar

### Step 2: Register via Backend
1. Same as offline, but this time:
   - Phone: `0559876543`
   - Password: `SecurePass123`
2. **Do NOT check Remember Me** (to test backend)
3. Click Register

**Expected Result:** User stored in PostgreSQL (check with: `SELECT * FROM users;` in database)

### Step 3: Test Cross-Device on Same Computer
1. Open **second browser** (or private/incognito window)
2. Go to http://localhost:9000
3. Login with same credentials from Step 2:
   - Phone: `0559876543`
   - Password: `SecurePass123`
   - **Check "Remember Me"**
4. Click Login

**Expected Result:** ✅ Should login successfully (because PostgreSQL has your user)

### Step 4: Verify Data Sync
1. In first browser, go to Settings
2. Make a change (e.g., update business name)
3. Switch to second browser
4. Refresh page
5. **Change should be visible** ✅ (data synced via PostgreSQL)

---

## Test Scenario 3: Frontend Error Handling

### Step 1: Stop PHP Server
```powershell
# Find the process
Get-Process php

# Stop it
Stop-Process -Name "php" -Force
```

### Step 2: Try to Login
1. Go to http://localhost:9000
2. Enter phone and password
3. Click Login

**Expected Result:** 
- ❌ Backend fails (no server)
- ✅ System automatically tries offline mode
- If you have offline account registered → Login succeeds
- Error message: "Failed to connect to backend. Using offline mode."

### Step 3: Restart Server
```powershell
cd c:\GEL-STOCK
php -S localhost:9000
```

---

## Troubleshooting

### Issue: "Not authorized" when logging in
**Possible Causes:**
1. Wrong phone number or password
2. Account registered offline, trying to login to backend (or vice versa)

**Solution:** Use browser DevTools (F12) → Console to see error messages

### Issue: "Remember Me" not working
**Possible Cause:** localStorage cleared or corrupted

**Solution:**
1. Open DevTools → Application → Storage
2. Check `gel_user_remember` exists
3. If not, login again and check Remember Me

### Issue: Can't login on different device
**Possible Causes:**
1. Offline mode: Different devices have separate localStorage (by design)
2. Backend mode: PostgreSQL not running or database empty

**Solution:** 
- Check if PostgreSQL is running
- Verify user exists in database: `SELECT * FROM users WHERE phone = '0501234567';`

### Issue: Session expired
**Expected Behavior:** Sessions last 30 days by default

**Solution:** Register/login again

---

## Success Criteria

You'll know hybrid authentication is working when:

✅ **Offline Mode Works:**
- Can register and login without any backend
- "Remember Me" persists after closing browser
- Account stored in localStorage (check DevTools)

✅ **Online Mode Works:**
- Can register and login with backend running
- User appears in PostgreSQL database
- Data syncs across devices with same phone/password

✅ **Fallback Works:**
- If backend fails, system automatically uses offline mode
- No error messages about failed authentication
- Users can still login with offline-registered accounts

✅ **Error Handling Works:**
- Stops PHP server → Login still works (uses offline)
- Start PHP server → Backend credentials validated
- Switch between modes seamlessly

---

## What's Different Now?

### Before (Broken)
```javascript
// Old code - just fake session
this.currentUser = {name: data.name};
this.isLoggedIn = true;
// No database connection, no multi-device sync ❌
```

### After (Fixed)
```javascript
// New code - real authentication
const backend_success = await this.attemptBackendLogin(phone, password);
if (backend_success) {
    // Use PostgreSQL session ✅
} else {
    const offline_success = await this.attemptOfflineLogin(phone, password);
    if (offline_success) {
        // Use localStorage fallback ✅
    }
}
// Multi-device sync works both ways!
```

---

## Common Questions

**Q: Do I need to register separately on each device?**
- **Online Mode:** No! Same phone/password logs in everywhere (PostgreSQL)
- **Offline Mode:** Yes, each device has separate localStorage

**Q: What if I register offline, then go online?**
- Account is stored in localStorage only
- If you want to sync to database: Register again online
- Or wait for offline-to-online sync feature (future enhancement)

**Q: Is my password safe in offline mode?**
- In offline mode, passwords stored plaintext in localStorage (development only)
- In online mode, passwords hashed with bcrypt in PostgreSQL ✅
- **Recommendation:** Always use online mode (PostgreSQL) for production

**Q: Can I use Remember Me forever?**
- Sessions expire in 30 days
- After 30 days, you'll need to login again
- This is intentional security feature

**Q: Does offline mode work without internet?**
- Yes! Completely offline-capable
- No internet needed if database was registered offline
- Perfect for locations with unreliable connectivity

---

## Next Steps

1. **Test Scenario 1** (Offline) - Takes 5 minutes
2. **If working:** You can now use multi-device login ✅
3. **Then test Scenario 2** (Online) if you have PostgreSQL running
4. **Report any issues** with screenshots of browser console (F12 → Console)

---

## Browser Console Errors?

**How to check:**
1. Press F12 to open DevTools
2. Click "Console" tab
3. Try to login
4. Watch for error messages in red
5. Copy/paste errors here for debugging

Common errors you might see:
- `Failed to fetch` → Backend not running (fallback to offline) ✅
- `"message": "Invalid credentials"` → Wrong phone/password ❌
- `Uncaught TypeError` → JavaScript error (report with screenshot)

---

**Server is running at:** http://localhost:9000

**Status:** PHP server started, ready to test! 🚀
