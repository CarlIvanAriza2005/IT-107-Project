# Security Testing & Attack Path Guide

## ⚠️ IMPORTANT: Ethical Use Only

This guide is for **authorized security testing only**. Only test on:
- Your own applications
- Applications you have explicit written permission to test
- Applications in a controlled lab environment

**Unauthorized testing is illegal and unethical.**

---

## Understanding Attack Paths

An "attack path" is the sequence of steps an attacker takes to exploit a vulnerability. Understanding these helps you:
1. Test if your fixes work
2. Understand security concepts
3. Build better defenses
4. Conduct legitimate penetration testing

---

## Attack Path #1: IP Spoofing to Bypass Rate Limiting

### What Was the Vulnerability?

The application trusted the `X-Forwarded-For` header without validation, allowing attackers to spoof their IP address.

### Attack Steps (Educational)

#### Step 1: Understand Rate Limiting
```bash
# Normal request - your real IP gets rate limited after 100 requests
curl http://localhost:3000/api/convert?from=USD&to=EUR&amount=100
```

#### Step 2: Spoof IP Address
```bash
# Attacker sets X-Forwarded-For to a different IP
# This makes the server think requests come from different IPs
curl -H "X-Forwarded-For: 192.168.1.100" http://localhost:3000/api/convert?from=USD&to=EUR&amount=100
curl -H "X-Forwarded-For: 192.168.1.101" http://localhost:3000/api/convert?from=USD&to=EUR&amount=100
# Each different IP bypasses rate limiting!
```

#### Step 3: Automated Attack Script
```bash
# Simple bash script to test rate limit bypass
for i in {1..200}; do
  curl -H "X-Forwarded-For: 192.168.1.$((RANDOM % 255))" \
    http://localhost:3000/api/convert?from=USD&to=EUR&amount=100
  echo "Request $i"
done
```

### How to Test the Fix

#### Test 1: Verify Trust Proxy Configuration
```javascript
// Check if trust proxy is set correctly
// In server.js, verify:
app.set('trust proxy', false); // For local dev (most secure)
// OR
app.set('trust proxy', true); // Only if behind known proxy
```

#### Test 2: Test IP Extraction
```bash
# Make request with spoofed header
curl -H "X-Forwarded-For: 1.2.3.4" http://localhost:3000/api/health

# Check server logs - IP should be 'unknown' or your real IP, not 1.2.3.4
# (if trust proxy is false)
```

#### Test 3: Verify Rate Limiting Still Works
```bash
# Make 101 requests - should get 429 on 101st
for i in {1..101}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-Forwarded-For: 1.2.3.4" \
    http://localhost:3000/api/convert?from=USD&to=EUR&amount=100)
  echo "Request $i: $response"
  if [ "$response" = "429" ]; then
    echo "✓ Rate limiting works! Got 429 on request $i"
    break
  fi
done
```

### What the Fix Does

1. **Trust Proxy Setting**: Only trusts proxy headers when configured
2. **IP Priority**: Uses `req.ip` (validated by Express) first
3. **Fallback Protection**: Falls back to direct connection IP if not behind proxy

---

## Attack Path #2: Log File Information Disclosure

### What Was the Vulnerability?

Log files containing sensitive information (IPs, user agents, paths) could be accessed via web server.

### Attack Steps (Educational)

#### Step 1: Directory Traversal Attempt
```bash
# Try to access log files directly
curl http://localhost:3000/logs/security.log
curl http://localhost:3000/logs/access.log
curl http://localhost:3000/logs/error.log
```

#### Step 2: Path Traversal Variations
```bash
# Try different path traversal techniques
curl http://localhost:3000/../logs/security.log
curl http://localhost:3000/..%2Flogs%2Fsecurity.log
curl http://localhost:3000/%2e%2e%2flogs%2fsecurity.log
```

#### Step 3: Information Extraction
If successful, attacker could:
- See all IP addresses accessing the site
- View user agents (browser fingerprinting)
- See attempted attack paths
- Identify security events

### How to Test the Fix

#### Test 1: Verify Log Directory Blocking
```bash
# Should get 403 Forbidden
curl -v http://localhost:3000/logs/security.log
# Expected: HTTP/1.1 403 Forbidden
```

#### Test 2: Check Security Event Logging
```bash
# Make request to logs directory
curl http://localhost:3000/logs/test.log

# Check server logs - should see:
# Security event: BLOCKED_PATH_ACCESS
```

#### Test 3: Verify Static File Serving
```bash
# Public files should still work
curl http://localhost:3000/index.html
# Should return 200 OK

# Logs should be blocked
curl http://localhost:3000/logs/anything.log
# Should return 403 Forbidden
```

### What the Fix Does

1. **Explicit Route Handler**: Blocks all `/logs/*` paths with 403
2. **Security Logging**: Logs all blocked access attempts
3. **Static File Isolation**: Only serves files from `public/` directory

---

## Attack Path #3: Health Endpoint DoS

### What Was the Vulnerability?

Health endpoint was excluded from rate limiting, allowing unlimited requests for reconnaissance or DoS.

### Attack Steps (Educational)

#### Step 1: Reconnaissance
```bash
# Health endpoint reveals server status
curl http://localhost:3000/api/health
# Response: {"status":"ok","message":"Currency converter API is healthy."}
```

#### Step 2: Resource Exhaustion
```bash
# Spam health endpoint (previously unlimited)
for i in {1..10000}; do
  curl -s http://localhost:3000/api/health > /dev/null &
done
# Could exhaust server resources
```

#### Step 3: Timing Analysis
```bash
# Measure response times to detect rate limiting
time curl http://localhost:3000/api/health
# If no rate limit, all requests fast
# If rate limited, some requests slow/blocked
```

### How to Test the Fix

#### Test 1: Verify Health Endpoint Rate Limiting
```bash
# Make 501 requests (limit is 500)
for i in {1..501}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    http://localhost:3000/api/health)
  if [ "$response" = "429" ]; then
    echo "✓ Rate limiting works! Got 429 on request $i"
    break
  fi
done
```

#### Test 2: Check Rate Limit Headers
```bash
# First request should show rate limit headers
curl -v http://localhost:3000/api/health 2>&1 | grep -i "ratelimit"
# Should see: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
```

#### Test 3: Compare with API Endpoint
```bash
# Health endpoint: 500 requests per 15 min
# API endpoint: 100 requests per 15 min
# Health should allow more requests before rate limiting
```

### What the Fix Does

1. **Separate Rate Limiter**: Health endpoint gets 5x higher limit (500 vs 100)
2. **Still Protected**: Prevents abuse while allowing legitimate monitoring
3. **Rate Limit Headers**: Provides visibility into remaining requests

---

## Attack Path #4: Information Disclosure via Error Messages

### What Was the Vulnerability?

Error messages revealed internal configuration details (e.g., "API key not configured").

### Attack Steps (Educational)

#### Step 1: Error Enumeration
```bash
# Try to trigger different errors
curl http://localhost:3000/api/convert
# Old response: "Missing required query parameters..."
# (Reveals API structure)

curl http://localhost:3000/api/convert?from=USD&to=EUR
# Old response: "Exchange rate API key is not configured on the server."
# (Reveals internal configuration!)
```

#### Step 2: Information Gathering
Attacker learns:
- Server uses ExchangeRate-API
- API key might be missing/incorrect
- Internal error handling structure
- Technology stack hints

#### Step 3: Targeted Attacks
With this information, attacker can:
- Focus on API key related attacks
- Try to find API key in other ways
- Understand system architecture

### How to Test the Fix

#### Test 1: Verify Generic Error Messages
```bash
# Test missing API key scenario
# (Set EXCHANGE_RATE_API_KEY to empty in .env.local temporarily)
curl http://localhost:3000/api/convert?from=USD&to=EUR&amount=100

# Should return: "Service temporarily unavailable. Please try again later."
# NOT: "Exchange rate API key is not configured on the server."
```

#### Test 2: Check Server Logs
```bash
# Detailed error should still be in server logs
# Check logs/error.log - should contain full error details
# But user only sees generic message
```

### What the Fix Does

1. **Generic User Messages**: Users see friendly, non-revealing errors
2. **Detailed Server Logs**: Full error details logged server-side only
3. **Information Hiding**: Prevents attackers from learning system internals

---

## Testing Tools & Scripts

### PowerShell Test Script (Windows)

```powershell
# test-security-fixes.ps1
$base = 'http://localhost:3000'

Write-Host "=== Testing Security Fixes ===" -ForegroundColor Cyan

# Test 1: IP Spoofing Protection
Write-Host "`n1. Testing IP spoofing protection..."
$spoofed = Invoke-WebRequest -Uri "$base/api/health" `
    -Headers @{ 'X-Forwarded-For' = '1.2.3.4' } `
    -UseBasicParsing
Write-Host "Response received (check logs for IP)" -ForegroundColor Green

# Test 2: Log Directory Blocking
Write-Host "`n2. Testing log directory blocking..."
try {
    $logs = Invoke-WebRequest -Uri "$base/logs/security.log" -UseBasicParsing
    Write-Host "✗ FAILED: Logs accessible!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✓ PASSED: Logs blocked (403)" -ForegroundColor Green
    } else {
        Write-Host "? Unexpected response: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Test 3: Health Endpoint Rate Limiting
Write-Host "`n3. Testing health endpoint rate limiting..."
$rateLimited = $false
for ($i = 1; $i -le 510; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$base/api/health" -UseBasicParsing
        if ($response.StatusCode -eq 429) {
            Write-Host "✓ PASSED: Rate limited at request $i" -ForegroundColor Green
            $rateLimited = $true
            break
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            Write-Host "✓ PASSED: Rate limited at request $i" -ForegroundColor Green
            $rateLimited = $true
            break
        }
    }
    if ($i % 100 -eq 0) {
        Write-Host "  Made $i requests..." -ForegroundColor Gray
    }
}
if (-not $rateLimited) {
    Write-Host "✗ FAILED: No rate limiting detected" -ForegroundColor Red
}

# Test 4: Error Message Hardening
Write-Host "`n4. Testing error message hardening..."
# This requires API key to be missing - test manually
Write-Host "  (Manual test: Remove API key and check error messages)" -ForegroundColor Gray

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan
```

### Bash Test Script (Linux/Mac)

```bash
#!/bin/bash
# test-security-fixes.sh

BASE="http://localhost:3000"

echo "=== Testing Security Fixes ==="

# Test 1: IP Spoofing
echo -e "\n1. Testing IP spoofing protection..."
curl -s -H "X-Forwarded-For: 1.2.3.4" "$BASE/api/health" > /dev/null
echo "  Response received (check server logs for IP)"

# Test 2: Log Directory Blocking
echo -e "\n2. Testing log directory blocking..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/logs/security.log")
if [ "$STATUS" = "403" ]; then
    echo "  ✓ PASSED: Logs blocked (403)"
else
    echo "  ✗ FAILED: Status code $STATUS"
fi

# Test 3: Health Endpoint Rate Limiting
echo -e "\n3. Testing health endpoint rate limiting..."
RATE_LIMITED=false
for i in {1..510}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health")
    if [ "$STATUS" = "429" ]; then
        echo "  ✓ PASSED: Rate limited at request $i"
        RATE_LIMITED=true
        break
    fi
    if [ $((i % 100)) -eq 0 ]; then
        echo "  Made $i requests..."
    fi
done
if [ "$RATE_LIMITED" = false ]; then
    echo "  ✗ FAILED: No rate limiting detected"
fi

echo -e "\n=== Tests Complete ==="
```

---

## Defensive Security Concepts

### Why Understanding Attacks Matters

1. **Better Fixes**: Understanding attack paths helps create better defenses
2. **Threat Modeling**: Know what to protect against
3. **Testing**: Verify your fixes actually work
4. **Education**: Learn security through hands-on experience

### Security Testing Best Practices

1. **Authorized Testing Only**: Never test without permission
2. **Controlled Environment**: Use isolated test environments
3. **Document Everything**: Keep records of tests and results
4. **Responsible Disclosure**: Report findings responsibly
5. **Continuous Learning**: Security is an ongoing process

### Red Team vs Blue Team

- **Red Team (Attackers)**: Find vulnerabilities, test defenses
- **Blue Team (Defenders)**: Build defenses, monitor, respond
- **Purple Team**: Collaboration between red and blue

You're learning both sides!

---

## Next Steps

1. **Run the Test Scripts**: Verify all fixes work
2. **Study the Code**: Understand how fixes prevent attacks
3. **Try Variations**: Test edge cases and variations
4. **Learn More**: Study OWASP Top 10, security frameworks
5. **Practice**: Set up a lab environment for safe testing

---

## Resources

- **OWASP Top 10**: Common web vulnerabilities
- **OWASP Testing Guide**: How to test for vulnerabilities
- **PortSwigger Web Security Academy**: Free security training
- **HackerOne**: Bug bounty programs (with permission)

---

## Legal & Ethical Reminder

**Only test systems you own or have explicit permission to test.**

Unauthorized access is illegal under:
- Computer Fraud and Abuse Act (US)
- Computer Misuse Act (UK)
- Similar laws worldwide

Use your knowledge responsibly and ethically! 🛡️

