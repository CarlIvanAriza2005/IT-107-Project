const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const fetch = (...args) => import('node-fetch').then(({ default: fetchFn }) => fetchFn(...args));
require('dotenv').config();
const logger = require('./lib/logger');

const app = express();
// Body parsing limits (protect from large payload DoS)
const BODY_LIMIT = process.env.BODY_LIMIT || '10kb';
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ limit: BODY_LIMIT, extended: false }));

// Security headers
app.use(helmet());
// Content Security Policy: restrict sources to self by default
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"]
        }
    })
);
// HSTS: tell browsers to use HTTPS for subsequent requests (configurable)
app.use(
    helmet.hsts({
        maxAge: Number(process.env.HSTS_MAX_AGE || 63072000), // 2 years in seconds
        includeSubDomains: String(process.env.HSTS_INCLUDE_SUBDOMAINS || 'true').toLowerCase() === 'true',
        preload: String(process.env.HSTS_PRELOAD || 'false').toLowerCase() === 'true'
    })
);
// Referrer policy for privacy
app.use(helmet.referrerPolicy({ policy: 'no-referrer-when-downgrade' }));
const PORT = process.env.PORT || 3000;
const EXCHANGE_API_BASE = 'https://v6.exchangerate-api.com/v6';

// Robust CORS using the `cors` package and environment-driven policy.
// Supports exact origins and simple wildcard patterns like `*.example.com`.
const rawAllowed = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const EXACT_ALLOWED = new Set(rawAllowed.filter(o => !o.includes('*')));
// Convert simple wildcard patterns to regular expressions.
// Wildcard semantics: a pattern like `*.example.com` will match any subdomain depth
// (for example `a.example.com` and `a.b.example.com`). This is intentional to
// allow flexible subdomain coverage while still restricting the base domain.
const WILDCARD_ALLOWED = rawAllowed
    .filter(o => o.includes('*'))
    .map(p => {
        const hasProto = /^https?:\/\//i.test(p);
        const escaped = p.replace(/([.+?^=!:${}()|[\]\/\\])/g, '\\$1');
        const replaced = escaped.replace(/\*/g, '(?:[^.]+\\.)*[^.]+');
        if (hasProto) {
            return new RegExp('^' + replaced + '(?::\\d+)?$', 'i');
        }
        return new RegExp('^https?:\\/\\/' + replaced + '(?::\\d+)?$', 'i');
    });

const ALLOW_CREDENTIALS = String(process.env.CORS_ALLOW_CREDENTIALS || 'false').toLowerCase() === 'true';
const PREFLIGHT_MAX_AGE = Number(process.env.CORS_PREFLIGHT_MAX_AGE || 600);
const ALLOWED_METHODS = (process.env.CORS_ALLOWED_METHODS || 'GET,OPTIONS').split(',').map(m => m.trim()).filter(Boolean);
const ALLOWED_HEADERS = (process.env.CORS_ALLOWED_HEADERS || 'Content-Type,Authorization').split(',').map(h => h.trim()).filter(Boolean);
const EXPOSED_HEADERS = (process.env.CORS_EXPOSED_HEADERS || '').split(',').map(h => h.trim()).filter(Boolean);

function isOriginAllowed(origin) {
    if (!origin) return false;
    if (EXACT_ALLOWED.has(origin)) return true;
    return WILDCARD_ALLOWED.some(rx => rx.test(origin));
}

const corsOptions = {
    origin: (origin, callback) => {
        // `origin` will be `undefined` for same-origin or non-browser requests
        if (!origin) return callback(null, true);
        if (isOriginAllowed(origin)) return callback(null, true);
        if (String(process.env.CORS_LOG_BLOCKED || 'false').toLowerCase() === 'true') {
            console.warn('Blocked CORS request from origin:', origin);
        }
        return callback(null, false);
    },
    methods: ALLOWED_METHODS,
    allowedHeaders: ALLOWED_HEADERS,
    exposedHeaders: EXPOSED_HEADERS.length ? EXPOSED_HEADERS : undefined,
    credentials: ALLOW_CREDENTIALS,
    maxAge: PREFLIGHT_MAX_AGE,
    // `optionsSuccessStatus` helps older browsers/clients that expect 200 instead of 204
    optionsSuccessStatus: Number(process.env.CORS_OPTIONS_SUCCESS_STATUS || 204)
};

app.use('/api', cors(corsOptions));

// Rate limiting: configurable via env vars
// - `RATE_LIMIT_WINDOW_MS` : time window in milliseconds (default: 15 minutes)
// - `RATE_LIMIT_MAX_REQUESTS` : max requests per window (default: 100)
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100);

const apiLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS,
    // Custom handler logs the event and returns a consistent JSON response
    handler: (req, res /*, next */) => {
        const ip = req.ip || (req.connection && req.connection.remoteAddress);
        const route = req.originalUrl || req.url;
        const origin = req.get && req.get('Origin');
        logger.warn('rate_limit_exceeded', { ip, route, origin, time: new Date().toISOString() });
        return res.status(429).json({ success: false, error: 'Too many requests, please try again later.' });
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip rate limiting for health checks (optional; comment out to rate-limit health checks too)
    skip: (req) => req.path === '/api/health'
});

app.use('/api', apiLimiter);

// Optional: enforce HTTPS in production if configured
if (String(process.env.ENFORCE_HTTPS || 'false').toLowerCase() === 'true') {
    app.use((req, res, next) => {
        const forwardedProto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
        if (req.secure || forwardedProto === 'https') return next();
        // Preserve host and original URL
        const host = req.get('host');
        return res.redirect(301, `https://${host}${req.originalUrl}`);
    });
}

// Request timeout: set socket timeout on the server after listen
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 30000);

// Conservative whitelist of allowed currency codes (ISO 4217)
const ALLOWED_CURRENCIES = new Set([
    'USD','EUR','GBP','JPY','AUD','CAD','CHF','CNY','HKD','NZD','SEK','KRW','SGD','NOK','MXN','INR','RUB','BRL','ZAR','TRY','DKK','PLN','THB','MYR','IDR','HUF','CZK','ILS','PHP','CLP','AED','SAR','COP','ARS','VND','EGP','NGN','KZT','PKR','BDT'
]);

function validateCurrencyCode(code) {
    return /^[A-Z]{3}$/.test(code) && ALLOWED_CURRENCIES.has(code);
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Currency converter API is healthy.',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/convert', async (req, res) => {
    const { from, to, amount } = req.query || {};
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;

    if (!from || !to) {
        return res.status(400).json({ success: false, error: 'Missing required query parameters "from" and "to".' });
    }

    if (!apiKey) {
        return res.status(500).json({ success: false, error: 'Exchange rate API key is not configured on the server.' });
    }

    // Trim and validate input lengths to prevent ReDoS and other attacks
    const fromCurrency = String(from).trim().toUpperCase();
    const toCurrency = String(to).trim().toUpperCase();

    if (fromCurrency.length > 10 || toCurrency.length > 10) {
        return res.status(400).json({ success: false, error: 'Invalid parameter length.' });
    }

    if (!validateCurrencyCode(fromCurrency) || !validateCurrencyCode(toCurrency)) {
        return res.status(400).json({ success: false, error: 'Currency codes must be supported 3-letter ISO codes.' });
    }

    // Use encodeURIComponent to safely construct the URL
    const url = `${EXCHANGE_API_BASE}/${encodeURIComponent(apiKey)}/latest/${encodeURIComponent(fromCurrency)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Upstream API error: ${response.status}`);
        }

        const data = await response.json();
        if (data.result !== 'success' || !data.conversion_rates) {
            throw new Error(data.error || 'Unexpected response from ExchangeRate-API');
        }

        const rate = data.conversion_rates[toCurrency];
        if (typeof rate !== 'number' || !Number.isFinite(rate)) {
            logger.warn('missing_rate', { from: fromCurrency, to: toCurrency });
            return res.status(400).json({
                success: false,
                error: `Exchange rate from ${fromCurrency} to ${toCurrency} not available.`
            });
        }

        // Strict amount parsing: no exponent, only plain decimal, limited precision and non-negative
        let convertedAmount = null;
        if (Object.prototype.hasOwnProperty.call(req.query, 'amount')) {
            const rawAmt = String(amount).trim();
            
            // Prevent excessively long input strings (ReDoS prevention)
            if (rawAmt.length > 30) {
                return res.status(400).json({ success: false, error: '"amount" input is too long.' });
            }
            
            if (!/^[+-]?\d+(?:\.\d+)?$/.test(rawAmt)) {
                return res.status(400).json({ success: false, error: '"amount" must be a plain decimal number without exponent.' });
            }
            
            const num = Number(rawAmt);
            if (!Number.isFinite(num) || Number.isNaN(num) || num < 0) {
                return res.status(400).json({ success: false, error: 'Invalid or negative "amount" provided.' });
            }
            
            // Check max amount to prevent overflow
            const MAX_AMOUNT = 1e12;
            if (Math.abs(num) > MAX_AMOUNT) {
                return res.status(400).json({ success: false, error: '"amount" exceeds maximum limit.' });
            }
            
            const decimalPart = rawAmt.split('.')[1];
            if (decimalPart && decimalPart.length > 8) {
                return res.status(400).json({ success: false, error: '"amount" may have at most 8 decimal places.' });
            }
            
            convertedAmount = Number((num * rate).toFixed(6));
        }

        return res.json({
            success: true,
            rate,
            convertedAmount,
            from: fromCurrency,
            to: toCurrency,
            lastUpdated: data.time_last_update_utc
        });
    } catch (error) {
        logger.error('convert_error', { message: error && error.message, stack: error && error.stack });
        return res.status(502).json({
            success: false,
            error: 'Failed to fetch exchange rate from upstream API.'
        });
    }
});

// Fallback to index.html for unknown routes (SPA-friendly)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
    console.log(`Currency converter dev server running at http://localhost:${PORT}`);
});

// Apply request socket timeout to mitigate slowloris-style attacks
const REQUEST_TIMEOUT_MS_NUM = Number(process.env.REQUEST_TIMEOUT_MS || 30000);
if (Number.isFinite(REQUEST_TIMEOUT_MS_NUM) && REQUEST_TIMEOUT_MS_NUM > 0) {
    server.setTimeout(REQUEST_TIMEOUT_MS_NUM);
}

