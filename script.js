/**
 * Root Index Page Script
 * Handles navigation to dashboard and demo mode
 */

function goToDashboard() {
    window.location.href = './dashboard/';
}

function goToDemoMode() {
    // Set demo mode flag
    sessionStorage.setItem('gel_demo_mode', 'true');
    // Navigate to dashboard
    window.location.href = './dashboard/';
}

// Auto-redirect to dashboard if accessed directly
document.addEventListener('DOMContentLoaded', function() {
    // Check if user has active session
    const hasSession = localStorage.getItem('gel_user') || sessionStorage.getItem('gel_user');
    
    // If user is logged in, go directly to dashboard
    if (hasSession) {
        // Slight delay for page load experience
        setTimeout(() => {
            window.location.href = './dashboard/';
        }, 500);
    }
});
