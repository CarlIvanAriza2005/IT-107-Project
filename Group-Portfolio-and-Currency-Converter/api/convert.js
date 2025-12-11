const EXCHANGE_API_BASE = 'https://v6.exchangerate-api.com/v6';

// Configuration for validation
const ALLOWED_QUERY_PARAMS = new Set(['from', 'to', 'amount']);
const ISO_CURRENCY_REGEX = /^[A-Z]{3}$/;
const MAX_AMOUNT = 1e12; // arbitrary cap to prevent abuse
const MAX_DECIMALS = 8;

// A conservative whitelist of common ISO 4217 currency codes. This reduces
// risk by allowing only known currencies instead of any three-letter string.
const ALLOWED_CURRENCIES = new Set([
    'USD','EUR','GBP','JPY','AUD','CAD','CHF','CNY','HKD','NZD','SEK','KRW','SGD','NOK','MXN','INR','RUB','BRL','ZAR','TRY','DKK','PLN','THB','MYR','IDR','HUF','CZK','ILS','PHP','CLP','AED','SAR','COP','ARS','VND','EGP','NGN','KZT','PKR','BDT'
]);

function validateAndNormalizeQuery(query) {
    // Reject unexpected query params to reduce attack surface
    const keys = Object.keys(query || {});
    for (const k of keys) {
        if (!ALLOWED_QUERY_PARAMS.has(k)) {
            return { ok: false, error: `Unexpected parameter '${k}'.` };
        }
    }

    const rawFrom = query.from;
    const rawTo = query.to;
    if (!rawFrom || !rawTo) {
        return { ok: false, error: 'Missing required query parameters "from" and "to".' };
    }

    const from = String(rawFrom).toUpperCase();
    const to = String(rawTo).toUpperCase();

    if (!ISO_CURRENCY_REGEX.test(from) || !ISO_CURRENCY_REGEX.test(to)) {
        return { ok: false, error: 'Currency codes must be 3-letter ISO codes (A-Z).' };
    }

    // Enforce whitelist membership to avoid accepting arbitrary 3-letter tokens.
    if (!ALLOWED_CURRENCIES.has(from) || !ALLOWED_CURRENCIES.has(to)) {
        return { ok: false, error: 'Currency not supported. Use a standard ISO 4217 currency code.' };
    }

    // Validate amount if present
    let amount = null;
    if (Object.prototype.hasOwnProperty.call(query, 'amount')) {
        const rawAmt = String(query.amount).trim();
        if (rawAmt.length === 0) {
            return { ok: false, error: 'If provided, "amount" must not be empty.' };
        }

        // Reject scientific notation and other weird formats by using a strict numeric parse
        // Allow only digits, optional decimal point and optional leading +/-. No exponent.
        if (!/^[+-]?\d+(?:\.\d+)?$/.test(rawAmt)) {
            return { ok: false, error: '"amount" must be a plain decimal number without exponent.' };
        }

        const num = Number(rawAmt);
        if (!Number.isFinite(num) || Number.isNaN(num)) {
            return { ok: false, error: 'Invalid numeric value for "amount".' };
        }


        if (Math.abs(num) > MAX_AMOUNT) {
            return { ok: false, error: '"amount" is out of allowed range.' };
        }

        // Require non-negative amounts; do not accept negative transfers here.
        if (num < 0) {
            return { ok: false, error: '"amount" must be zero or a positive value.' };
        }

        // Limit decimal places to avoid extremely precise input
        const parts = rawAmt.split('.');
        if (parts[1] && parts[1].length > MAX_DECIMALS) {
            return { ok: false, error: `"amount" may have at most ${MAX_DECIMALS} decimal places.` };
        }

        amount = num;
    }

    return { ok: true, from, to, amount };
}

export default async function handler(req, res) {
    // Only allow GET for this endpoint
    if (req.method && req.method.toUpperCase() !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed. Use GET.' });
    }

    const validation = validateAndNormalizeQuery(req.query || {});
    if (!validation.ok) {
        console.warn('Validation failed for /api/convert:', validation.error);
        return res.status(400).json({ success: false, error: validation.error });
    }

    const { from: fromCurrency, to: toCurrency, amount } = validation;

    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) {
        // Generic error message - don't reveal internal configuration
        console.error('Exchange rate API key is not configured');
        return res.status(500).json({
            success: false,
            error: 'Service temporarily unavailable. Please try again later.'
        });
    }

    // Use encodeURIComponent defensively when building upstream URL
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
        if (typeof rate !== 'number') {
            return res.status(400).json({
                success: false,
                error: `Exchange rate from ${fromCurrency} to ${toCurrency} not available.`
            });
        }

        let convertedAmount = null;
        if (amount !== null) {
            // Use safe arithmetic and limit to reasonable decimal places for response
            convertedAmount = Number((amount * rate).toFixed(6));
        }

        return res.status(200).json({
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
}
