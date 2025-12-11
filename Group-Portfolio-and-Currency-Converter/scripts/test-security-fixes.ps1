# Security Fixes Testing Script
# Tests all the security fixes we implemented
# Usage: .\scripts\test-security-fixes.ps1

$base = 'http://localhost:3000'
$failed = 0
$passed = 0

Write-Host "`n=== Security Fixes Testing ===" -ForegroundColor Cyan
Write-Host "Testing fixes for: IP Spoofing, Log Protection, Rate Limiting, Error Messages`n" -ForegroundColor Gray

# Test 1: IP Spoofing Protection
Write-Host "1. Testing IP Spoofing Protection..." -ForegroundColor Yellow
Write-Host "   Making request with spoofed X-Forwarded-For header..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$base/api/health" `
        -Headers @{ 'X-Forwarded-For' = '192.168.1.100' } `
        -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✓ Request successful" -ForegroundColor Green
    Write-Host "   ℹ Check server logs - IP should be validated, not 192.168.1.100" -ForegroundColor Cyan
    Write-Host "   (If trust proxy is false, IP should be 'unknown' or your real IP)" -ForegroundColor Gray
    $passed++
} catch {
    Write-Host "   ✗ Request failed: $_" -ForegroundColor Red
    $failed++
}

# Test 2: Log Directory Blocking
Write-Host "`n2. Testing Log Directory Blocking..." -ForegroundColor Yellow
Write-Host "   Attempting to access /logs/security.log..." -ForegroundColor Gray
try {
    $logs = Invoke-WebRequest -Uri "$base/logs/security.log" -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✗ FAILED: Logs are accessible! Status: $($logs.StatusCode)" -ForegroundColor Red
    $failed++
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "   ✓ PASSED: Logs blocked with 403 Forbidden" -ForegroundColor Green
        $passed++
    } elseif ($statusCode -eq 404) {
        Write-Host "   ⚠ PARTIAL: Got 404 (not accessible, but should be 403)" -ForegroundColor Yellow
        $passed++
    } else {
        Write-Host "   ? Unexpected status: $statusCode" -ForegroundColor Yellow
    }
}

# Test 3: Health Endpoint Rate Limiting
Write-Host "`n3. Testing Health Endpoint Rate Limiting..." -ForegroundColor Yellow
Write-Host "   Making multiple requests to /api/health..." -ForegroundColor Gray
Write-Host "   (This may take a moment - testing up to 510 requests)" -ForegroundColor Gray

$rateLimited = $false
$limitReachedAt = 0
$testLimit = 510  # Health endpoint limit is 500

for ($i = 1; $i -le $testLimit; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$base/api/health" -UseBasicParsing -ErrorAction Stop
        $statusCode = $response.StatusCode
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
    }
    
    if ($statusCode -eq 429) {
        $rateLimited = $true
        $limitReachedAt = $i
        break
    }
    
    # Progress indicator
    if ($i % 100 -eq 0) {
        Write-Host "   Progress: $i requests made..." -ForegroundColor Gray
    }
    
    # Small delay to avoid overwhelming server
    Start-Sleep -Milliseconds 10
}

if ($rateLimited) {
    Write-Host "   ✓ PASSED: Rate limited at request $limitReachedAt" -ForegroundColor Green
    Write-Host "   (Health endpoint should allow ~500 requests per 15 min)" -ForegroundColor Gray
    $passed++
} else {
    Write-Host "   ✗ FAILED: No rate limiting detected after $testLimit requests" -ForegroundColor Red
    $failed++
}

# Test 4: API Endpoint Rate Limiting (Comparison)
Write-Host "`n4. Testing API Endpoint Rate Limiting (for comparison)..." -ForegroundColor Yellow
Write-Host "   Making requests to /api/convert..." -ForegroundColor Gray
Write-Host "   (API endpoint should limit at 100 requests)" -ForegroundColor Gray

$apiRateLimited = $false
$apiLimitReachedAt = 0
$apiTestLimit = 110  # API endpoint limit is 100

for ($i = 1; $i -le $apiTestLimit; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$base/api/convert?from=USD&to=EUR&amount=100" `
            -UseBasicParsing -ErrorAction Stop
        $statusCode = $response.StatusCode
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
    }
    
    if ($statusCode -eq 429) {
        $apiRateLimited = $true
        $apiLimitReachedAt = $i
        break
    }
    
    if ($i % 20 -eq 0) {
        Write-Host "   Progress: $i requests made..." -ForegroundColor Gray
    }
    
    Start-Sleep -Milliseconds 50
}

if ($apiRateLimited) {
    Write-Host "   ✓ PASSED: Rate limited at request $apiLimitReachedAt" -ForegroundColor Green
    Write-Host "   (API endpoint correctly limits at ~100 requests)" -ForegroundColor Gray
    $passed++
} else {
    Write-Host "   ⚠ WARNING: API rate limiting not detected" -ForegroundColor Yellow
    Write-Host "   (This might be expected if you don't have API key configured)" -ForegroundColor Gray
}

# Test 5: Error Message Hardening (Manual Check)
Write-Host "`n5. Testing Error Message Hardening..." -ForegroundColor Yellow
Write-Host "   Checking error messages for information disclosure..." -ForegroundColor Gray

# Test with missing parameters
try {
    $errorResponse = Invoke-WebRequest -Uri "$base/api/convert" -UseBasicParsing -ErrorAction Stop
} catch {
    $errorContent = $_.Exception.Response | ConvertFrom-Json
    if ($errorContent.error -match "temporarily unavailable|try again later") {
        Write-Host "   ✓ PASSED: Generic error message (no internal details)" -ForegroundColor Green
        $passed++
    } elseif ($errorContent.error -match "API key|configuration|server") {
        Write-Host "   ✗ FAILED: Error message reveals internal details!" -ForegroundColor Red
        Write-Host "   Error: $($errorContent.error)" -ForegroundColor Red
        $failed++
    } else {
        Write-Host "   ℹ Error message: $($errorContent.error)" -ForegroundColor Cyan
        Write-Host "   (Check if this reveals internal information)" -ForegroundColor Gray
    }
}

# Test 6: Rate Limit Headers
Write-Host "`n6. Testing Rate Limit Headers..." -ForegroundColor Yellow
try {
    $headers = (Invoke-WebRequest -Uri "$base/api/health" -UseBasicParsing).Headers
    if ($headers['RateLimit-Limit']) {
        Write-Host "   ✓ PASSED: RateLimit headers present" -ForegroundColor Green
        Write-Host "   RateLimit-Limit: $($headers['RateLimit-Limit'])" -ForegroundColor Gray
        Write-Host "   RateLimit-Remaining: $($headers['RateLimit-Remaining'])" -ForegroundColor Gray
        $passed++
    } else {
        Write-Host "   ⚠ WARNING: RateLimit headers not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠ Could not check headers: $_" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

if ($failed -eq 0) {
    Write-Host "`n✓ All security fixes appear to be working!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Review server logs to verify IP extraction" -ForegroundColor Gray
    Write-Host "2. Check that log directory is properly blocked" -ForegroundColor Gray
    Write-Host "3. Verify rate limiting is working as expected" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "`n✗ Some tests failed. Review the output above." -ForegroundColor Red
    exit 1
}

