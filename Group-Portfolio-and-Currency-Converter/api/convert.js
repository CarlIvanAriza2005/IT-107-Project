// Serverless API route: performs currency conversion using ExchangeRate-API
// The API key is read from the environment and never exposed to the browser.

const EXCHANGE_API_BASE = 'https://v6.exchangerate-api.com/v6';

export default async function handler(req, res) {
    const { from, to, amount } = req.query || {};

    if (!from || !to) {
        return res.status(400).json({
            success: false,
            error: 'Missing required query parameters "from" and "to".'
        });
    }

    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            success: false,
            error: 'Exchange rate API key is not configured on the server.'
        });
    }

    const fromCurrency = String(from).toUpperCase();
    const toCurrency = String(to).toUpperCase();

    // Basic whitelist-style validation: ISO currency codes are 3 letters
    const isoRegex = /^[A-Z]{3}$/;
    if (!isoRegex.test(fromCurrency) || !isoRegex.test(toCurrency)) {
        return res.status(400).json({
            success: false,
            error: 'Currency codes must be 3-letter ISO codes.'
        });
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

        const numericAmount = amount ? parseFloat(String(amount)) : null;
        const convertedAmount =
            typeof numericAmount === 'number' && !Number.isNaN(numericAmount)
                ? numericAmount * rate
                : null;

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


