const path = require('path');
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetchFn }) => fetchFn(...args));
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const EXCHANGE_API_BASE = 'https://v6.exchangerate-api.com/v6';

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

    const fromCurrency = String(from).toUpperCase();
    const toCurrency = String(to).toUpperCase();

    if (!validateCurrencyCode(fromCurrency) || !validateCurrencyCode(toCurrency)) {
        return res.status(400).json({ success: false, error: 'Currency codes must be supported 3-letter ISO codes.' });
    }

    const url = `${EXCHANGE_API_BASE}/${apiKey}/latest/${fromCurrency}`;

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
        if (typeof rate !== 'number') {
            return res.status(400).json({
                success: false,
                error: `Exchange rate from ${fromCurrency} to ${toCurrency} not available.`
            });
        }

        // Strict amount parsing: no exponent, only plain decimal, limited precision and non-negative
        let convertedAmount = null;
        if (Object.prototype.hasOwnProperty.call(req.query, 'amount')) {
            const rawAmt = String(amount).trim();
            if (!/^[+-]?\d+(?:\.\d+)?$/.test(rawAmt)) {
                return res.status(400).json({ success: false, error: '"amount" must be a plain decimal number without exponent.' });
            }
            const num = Number(rawAmt);
            if (!Number.isFinite(num) || Number.isNaN(num) || num < 0) {
                return res.status(400).json({ success: false, error: 'Invalid or negative "amount" provided.' });
            }
            if (rawAmt.split('.')[1] && rawAmt.split('.')[1].length > 8) {
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
        console.error('Error in /api/convert:', error);
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

app.listen(PORT, () => {
    console.log(`Currency converter dev server running at http://localhost:${PORT}`);
});

