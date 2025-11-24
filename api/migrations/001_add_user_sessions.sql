/**
 * PostgreSQL Session Management Migration
 * Add user_sessions table to support cross-device login persistence
 */

-- Create user_sessions table for storing active sessions across devices
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- web, mobile, tablet
    ip_address VARCHAR(45), -- IPv4 and IPv6
    user_agent TEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_sessions (user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_expires_at (expires_at)
);

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_session_token_active 
ON user_sessions(session_token) 
WHERE expires_at > CURRENT_TIMESTAMP;

-- Auto-cleanup: Delete expired sessions (run via cron)
-- DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;
