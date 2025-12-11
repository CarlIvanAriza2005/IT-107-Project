# Attack Paths Quick Reference

## 🎯 Quick Overview

This is a **cheat sheet** for understanding and testing the vulnerabilities we found and fixed.

---

## 1. IP Spoofing Attack

### The Attack
```bash
# Spoof your IP to bypass rate limiting
curl -H "X-Forwarded-For: 192.168.1.100" http://localhost:3000/api/convert?from=USD&to=EUR
```

### What It Does
- Makes server think requests come from different IPs
- Each "new" IP gets fresh rate limit quota
- Can make unlimited requests by rotating IPs

### The Fix
- Trust proxy configuration validates IPs
- `req.ip` is validated by Express
- Spoofed headers ignored when not behind proxy

### Test It
```bash
# Should still rate limit even with spoofed header
for i in {1..101}; do
  curl -H "X-Forwarded-For: 1.2.3.4" http://localhost:3000/api/convert?from=USD&to=EUR
done
# Should get 429 on 101st request
```

---

## 2. Log File Access Attack

### The Attack
```bash
# Try to read log files directly
curl http://localhost:3000/logs/security.log
curl http://localhost:3000/logs/access.log
```

### What It Does
- Accesses sensitive log files via web server
- Reveals IPs, user agents, attack attempts
- Information disclosure vulnerability

### The Fix
- Explicit route handler blocks `/logs/*`
- Returns 403 Forbidden
- Logs all blocked access attempts

### Test It
```bash
# Should get 403, not 200
curl -v http://localhost:3000/logs/security.log
# Expected: HTTP/1.1 403 Forbidden
```

---

## 3. Health Endpoint DoS Attack

### The Attack
```bash
# Spam health endpoint (was unlimited)
for i in {1..10000}; do
  curl http://localhost:3000/api/health &
done
```

### What It Does
- Health endpoint was excluded from rate limiting
- Could make unlimited requests
- Resource exhaustion / DoS

### The Fix
- Separate rate limiter for health endpoint
- 5x higher limit (500 vs 100) but still limited
- Prevents abuse while allowing monitoring

### Test It
```bash
# Should get 429 after ~500 requests
for i in {1..510}; do
  curl http://localhost:3000/api/health
done
# Should see 429 responses
```

---

## 4. Information Disclosure Attack

### The Attack
```bash
# Trigger errors to learn about system
curl http://localhost:3000/api/convert
# Old: "Missing required query parameters..."
# Old: "API key not configured on server" ← REVEALS INTERNAL INFO!
```

### What It Does
- Error messages reveal:
  - Internal configuration
  - Technology stack
  - System architecture
  - API structure

### The Fix
- Generic user-facing error messages
- Detailed errors logged server-side only
- No internal details exposed

### Test It
```bash
# Should see generic message
curl http://localhost:3000/api/convert
# Expected: Generic error, no internal details
# Check server logs for detailed error
```

---

## 🛠️ Testing Commands

### Quick Test All Fixes
```powershell
# Windows
.\scripts\test-security-fixes.ps1

# Linux/Mac
bash scripts/test-security-fixes.sh
```

### Manual Testing
```bash
# 1. Test IP spoofing
curl -H "X-Forwarded-For: 1.2.3.4" http://localhost:3000/api/health

# 2. Test log blocking
curl http://localhost:3000/logs/security.log
# Should be 403

# 3. Test rate limiting
for i in {1..101}; do curl http://localhost:3000/api/convert?from=USD&to=EUR; done

# 4. Test error messages
curl http://localhost:3000/api/convert
# Should be generic
```

---

## 📊 Attack Path Flowchart

```
┌─────────────────┐
│  Attacker       │
└────────┬────────┘
         │
         ├─→ IP Spoofing → Bypass Rate Limit → DoS
         │
         ├─→ Log Access → Information Disclosure → Reconnaissance
         │
         ├─→ Health Endpoint Spam → Resource Exhaustion → DoS
         │
         └─→ Error Enumeration → Information Gathering → Targeted Attacks
```

---

## 🔒 Defense Layers

1. **Input Validation** - Validate all user input
2. **Rate Limiting** - Prevent abuse and DoS
3. **Access Control** - Block unauthorized paths
4. **Error Handling** - Don't reveal internal details
5. **Logging** - Monitor and detect attacks
6. **Security Headers** - Helmet, CORS, CSP

---

## 📚 Learning Path

1. **Understand** - Read the attack paths
2. **Test** - Run the test scripts
3. **Analyze** - Check server logs
4. **Verify** - Confirm fixes work
5. **Learn** - Study security concepts
6. **Practice** - Set up a lab environment

---

## ⚠️ Remember

- **Only test your own systems**
- **Get permission before testing**
- **Use knowledge responsibly**
- **Report findings ethically**

---

## 🎓 Key Concepts

- **Attack Surface**: All possible entry points
- **Attack Vector**: Specific method of attack
- **Attack Path**: Sequence of steps to exploit
- **Defense in Depth**: Multiple security layers
- **Least Privilege**: Minimum access needed
- **Fail Secure**: Default to secure state

---

## 🔗 Related Files

- `SECURITY_TESTING_GUIDE.md` - Detailed guide
- `SECURITY_REPORT.md` - Full vulnerability report
- `SECURITY_FIXES.md` - Implementation details
- `scripts/test-security-fixes.ps1` - Test script

---

**Use this knowledge to build better defenses!** 🛡️

