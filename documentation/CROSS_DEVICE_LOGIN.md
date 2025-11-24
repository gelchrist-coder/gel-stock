# Cross-Device Login & Session Management

## Overview

GEL-STOCK now supports cross-device login persistence. Users can register on one device (desktop, mobile, tablet) and access their account from any other device using the same credentials.

## Features

### 1. **Session Token System**
- Each successful login generates a unique 64-character session token
- Tokens are stored in the `user_sessions` table with metadata
- Tokens expire after 30 days of inactivity
- Device information is captured (device name, type, IP address)

### 2. **Automatic Session Verification**
When a user opens the application:
1. System checks for existing session token (in sessionStorage or localStorage)
2. If token exists, it's verified with the backend
3. If valid, user is automatically logged in without re-entering credentials
4. If expired, user is prompted to log in again

### 3. **Device Tracking**
The system tracks:
- Device name (iPhone, Android, Chrome Browser, etc.)
- Device type (mobile, tablet, web)
- IP address
- User agent
- Last activity timestamp

## Technical Implementation

### Database Schema

```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    device_name VARCHAR(255),
    device_type VARCHAR(50),      -- web, mobile, tablet
    ip_address VARCHAR(45),       -- IPv4 and IPv6 support
    user_agent TEXT,
    last_activity TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### API Endpoints

#### **POST /api/auth.php** - Login
Creates a new session token when user logs in.

**Request:**
```json
{
    "action": "login",
    "phone": "+233599123456",
    "password": "userpassword",
    "device_name": "iPhone 12",
    "device_type": "mobile"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "session_token": "a1b2c3d4e5f6...",
        "expires_at": "2025-12-24 10:30:00",
        "user": {
            "id": 1,
            "username": "user_233599123456",
            "email": "user@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "phone": "+233599123456",
            "role": "owner",
            "business_name": "My Shop"
        }
    }
}
```

#### **GET /api/auth.php?token=...** - Verify Token
Verifies if a session token is valid.

**Response:**
```json
{
    "success": true,
    "message": "Token valid",
    "data": {
        "user": { ... },
        "device": {
            "name": "iPhone 12",
            "type": "mobile",
            "last_activity": "2025-11-24 15:30:00"
        }
    }
}
```

#### **GET /api/devices.php?token=...** - List Devices
Gets all active devices/sessions for current user.

**Response:**
```json
{
    "success": true,
    "message": "Devices retrieved successfully",
    "data": {
        "devices": [
            {
                "id": 1,
                "device_name": "Desktop Chrome",
                "device_type": "web",
                "ip_address": "192.168.1.100",
                "last_activity": "2025-11-24 15:30:00",
                "created_at": "2025-11-20 10:00:00"
            },
            {
                "id": 2,
                "device_name": "iPhone 12",
                "device_type": "mobile",
                "ip_address": "41.205.30.100",
                "last_activity": "2025-11-24 14:30:00",
                "created_at": "2025-11-24 09:00:00"
            }
        ],
        "total": 2
    }
}
```

#### **DELETE /api/devices.php** - Remove Device
Logs out from a specific device.

**Request:**
```json
{
    "token": "a1b2c3d4e5f6...",
    "device_id": 2
}
```

**Response:**
```json
{
    "success": true,
    "message": "Device removed successfully"
}
```

### Frontend Implementation

#### Login Flow (Updated)
```javascript
async function handleLogin(event) {
    // 1. Validate phone & password
    // 2. POST to /api/auth.php with device info
    // 3. On success, store session_token in sessionStorage + optionally localStorage
    // 4. Reload page - app will auto-verify token and restore session
}
```

#### App Initialization (Updated)
```javascript
initializeAuthSystem() {
    // 1. Check for saved session token
    const token = sessionStorage.getItem('gel_session_token') 
                  || localStorage.getItem('gel_session_token');
    
    // 2. If found, verify with backend
    if (token) {
        this.verifySessionToken(token);  // GET /api/auth.php?token=...
    }
    
    // 3. Restore user session if valid
}
```

#### "Remember Me" Functionality
- When unchecked: Token stored only in `sessionStorage` (cleared on browser close)
- When checked: Token also stored in `localStorage` (persists across browser sessions)

## User Experience

### Scenario 1: First Login on Desktop
1. User enters phone number and password on desktop browser
2. System creates session token and stores it locally
3. User sees dashboard

### Scenario 2: Access from Mobile (Same Day)
1. User opens app on mobile phone
2. If they had token saved in localStorage, app auto-logs them in
3. Or they enter phone/password again - creates new session
4. User can be logged in from both desktop and mobile simultaneously

### Scenario 3: Session Expires
1. After 30 days without activity, token expires
2. User tries to access app from saved device
3. Backend returns "invalid token" error
4. App shows login screen - user must enter credentials again

### Scenario 4: Manual Logout from Device
1. User logs out from mobile
2. Session token is deleted from `user_sessions` table
3. User must log in again on that device

### Scenario 5: View Active Devices
1. User can navigate to Settings → Active Sessions
2. See all devices currently logged in
3. Can remove any device remotely (log out from specific device)

## Security Considerations

1. **Token Storage:**
   - Never store tokens in cookies (vulnerable to XSS)
   - SessionStorage cleared on browser close (good for public computers)
   - LocalStorage persists (use "Remember Me" checkbox to control)

2. **Token Invalidation:**
   - 30-day expiration on inactivity
   - Delete from DB when user logs out
   - User can manually remove devices from active sessions list

3. **IP Tracking:**
   - Capture IP for audit trail
   - Can be used to detect suspicious logins (future enhancement)

4. **HTTPS Recommended:**
   - Always use HTTPS in production
   - Prevents token interception in transit

## Migration Steps

### 1. Create Sessions Table
```bash
# Run the migration SQL
mysql -u root -p gel_stock < api/migrations/001_add_user_sessions.sql
```

Or for PostgreSQL:
```bash
psql -U gelstockdb_user -d gelstockdb -f api/migrations/001_add_user_sessions.sql
```

### 2. Update Login API
- `/api/auth.php` now handles both login and registration
- Returns session token instead of just user data

### 3. Update Frontend
- `dashboard/script.js` updated to:
  - Store session tokens
  - Verify tokens on page load
  - Auto-login from saved token

### 4. Add Device Management (Optional)
- Add "Settings → Active Sessions" section to show all logged-in devices
- Allow users to log out from other devices

## Testing

### Test Cross-Device Login
1. Open browser 1 (Chrome) → Register/Login
2. Open browser 2 (Firefox) → Should auto-login or prompt
3. Open mobile browser → Should auto-login if token saved
4. All three devices should have access simultaneously

### Test Session Expiration
1. Set token expiration to 1 minute in code (for testing)
2. Wait 1 minute after login
3. Try to access dashboard
4. Should be redirected to login screen

### Test Token Verification
1. Get session token from browser DevTools → Application
2. Open new incognito window
3. Manually inject token into localStorage
4. Load app → Should auto-login

## Future Enhancements

1. **Device Fingerprinting:**
   - Detect suspicious logins from unusual locations
   - Prompt for additional verification

2. **Two-Factor Authentication:**
   - Send OTP to phone when logging in from new device
   - SMS or WhatsApp based on user preference

3. **Activity Timeline:**
   - Show user when account was accessed
   - From which devices and IP addresses

4. **Geo-Blocking:**
   - Restrict login to specific countries/regions
   - Useful for security-sensitive operations

5. **Automatic Logout:**
   - Auto-logout if inactive for X hours
   - Helps secure public computers
