$filePath = "c:\GEL-STOCK\styles.css"
$content = Get-Content -Raw $filePath

# Update professional header min-height from 80px to 70px
$content = $content -replace 'min-height: 80px;(\s+)display: flex;(\s+)align-items: center;(\s+)border-bottom: 2px solid #e5e7eb;', 'min-height: 70px;$1display: flex;$2align-items: center;$3border-bottom: none;'

# Update professional header .header-content min-height
$content = $content -replace 'professional-header \.header-content \{([^}]*?)min-height: 80px;', 'professional-header .header-content {$1min-height: 70px;'

# Update mobile media query to fix dashboard-container
$content = $content -replace 'dashboard-container \{\s+flex-direction: column-reverse;', 'dashboard-container {
        flex-direction: column;'

# Add mobile header styles at the end of the mobile media query, before closing brace
$insertPoint = $content.LastIndexOf("    /* Notification Styles */`n    .notification-bar {`n        bottom: 0;")
if ($insertPoint -gt 0) {
    $mobileHeaderStyles = @"

    /* Mobile Header Layout Overrides */
    .header-left {
        width: auto !important;
        justify-content: flex-start !important;
    }

    .header-center {
        flex: 1;
        justify-content: center;
        width: auto !important;
    }

    .header-right {
        width: auto !important;
        justify-content: flex-end !important;
    }

    .business-name-main {
        font-size: 1rem !important;
        flex: none !important;
        text-align: center;
        color: white;
        font-weight: 700;
    }

    .sidebar-toggle {
        display: none !important;
    }
"@
    
    $findEnd = $content.IndexOf("}", $insertPoint + 200)
    if ($findEnd -gt 0) {
        $content = $content.Substring(0, $findEnd) + $mobileHeaderStyles + "`n" + $content.Substring($findEnd)
    }
}

Set-Content -Path $filePath -Value $content
Write-Host "✓ Mobile styles updated successfully"
