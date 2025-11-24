// Currency Converter Application
// Using ExchangeRate-API (free tier)

class CurrencyConverter {
    constructor() {
        this.apiKey = 'c2b165670e30068ea1ad3cf5'; //https://app.exchangerate-api.com
        this.baseUrl = 'https://v6.exchangerate-api.com/v6'; 
        // Static fallback list of currencies (broad coverage)
        this.currencies = [
            { code: 'USD', name: 'United States Dollar' },
            { code: 'EUR', name: 'Euro' },
            { code: 'JPY', name: 'Japanese Yen' },
            { code: 'GBP', name: 'British Pound' },
            { code: 'AUD', name: 'Australian Dollar' },
            { code: 'CAD', name: 'Canadian Dollar' },
            { code: 'CHF', name: 'Swiss Franc' },
            { code: 'CNY', name: 'Chinese Yuan' },
            { code: 'HKD', name: 'Hong Kong Dollar' },
            { code: 'NZD', name: 'New Zealand Dollar' },
            { code: 'SEK', name: 'Swedish Krona' },
            { code: 'KRW', name: 'South Korean Won' },
            { code: 'SGD', name: 'Singapore Dollar' },
            { code: 'NOK', name: 'Norwegian Krone' },
            { code: 'MXN', name: 'Mexican Peso' },
            { code: 'INR', name: 'Indian Rupee' },
            { code: 'RUB', name: 'Russian Ruble' },
            { code: 'ZAR', name: 'South African Rand' },
            { code: 'TRY', name: 'Turkish Lira' },
            { code: 'BRL', name: 'Brazilian Real' },
            { code: 'TWD', name: 'New Taiwan Dollar' },
            { code: 'DKK', name: 'Danish Krone' },
            { code: 'PLN', name: 'Polish Zloty' },
            { code: 'THB', name: 'Thai Baht' },
            { code: 'IDR', name: 'Indonesian Rupiah' },
            { code: 'HUF', name: 'Hungarian Forint' },
            { code: 'CZK', name: 'Czech Koruna' },
            { code: 'ILS', name: 'Israeli New Shekel' },
            { code: 'CLP', name: 'Chilean Peso' },
            { code: 'PHP', name: 'Philippine Peso' },
            { code: 'AED', name: 'United Arab Emirates Dirham' },
            { code: 'COP', name: 'Colombian Peso' },
            { code: 'SAR', name: 'Saudi Riyal' },
            { code: 'MYR', name: 'Malaysian Ringgit' },
            { code: 'RON', name: 'Romanian Leu' },
            { code: 'ARS', name: 'Argentine Peso' },
            { code: 'PEN', name: 'Peruvian Sol' },
            { code: 'NGN', name: 'Nigerian Naira' },
            { code: 'EGP', name: 'Egyptian Pound' },
            { code: 'BDT', name: 'Bangladeshi Taka' },
            { code: 'PKR', name: 'Pakistani Rupee' },
            { code: 'VND', name: 'Vietnamese Dong' },
            { code: 'MAD', name: 'Moroccan Dirham' },
            { code: 'DZD', name: 'Algerian Dinar' },
            { code: 'KWD', name: 'Kuwaiti Dinar' },
            { code: 'QAR', name: 'Qatari Riyal' },
            { code: 'BHD', name: 'Bahraini Dinar' },
            { code: 'OMR', name: 'Omani Rial' },
            { code: 'UYU', name: 'Uruguayan Peso' },
            { code: 'BOB', name: 'Bolivian Boliviano' },
            { code: 'PYG', name: 'Paraguayan Guaraní' },
            { code: 'GTQ', name: 'Guatemalan Quetzal' },
            { code: 'CRC', name: 'Costa Rican Colón' },
            { code: 'DOP', name: 'Dominican Peso' },
            { code: 'JMD', name: 'Jamaican Dollar' },
            { code: 'TTD', name: 'Trinidad and Tobago Dollar' },
            { code: 'BBD', name: 'Barbadian Dollar' },
            { code: 'BMD', name: 'Bermudian Dollar' },
            { code: 'BSD', name: 'Bahamian Dollar' },
            { code: 'XCD', name: 'East Caribbean Dollar' },
            { code: 'UYU', name: 'Uruguayan Peso' },
            { code: 'RSD', name: 'Serbian Dinar' },
            { code: 'UAH', name: 'Ukrainian Hryvnia' },
            { code: 'GEL', name: 'Georgian Lari' },
            { code: 'KZT', name: 'Kazakhstani Tenge' },
            { code: 'UZS', name: 'Uzbekistani Soʻm' },
            { code: 'AZN', name: 'Azerbaijani Manat' },
            { code: 'AMD', name: 'Armenian Dram' },
            { code: 'BYN', name: 'Belarusian Ruble' },
            { code: 'BGN', name: 'Bulgarian Lev' },
            { code: 'HRK', name: 'Croatian Kuna' },
            { code: 'ISK', name: 'Icelandic Króna' },
            { code: 'MKD', name: 'Macedonian Denar' },
            { code: 'ALL', name: 'Albanian Lek' },
            { code: 'MDL', name: 'Moldovan Leu' },
            { code: 'AED', name: 'United Arab Emirates Dirham' },
            { code: 'IRR', name: 'Iranian Rial' },
            { code: 'IQD', name: 'Iraqi Dinar' },
            { code: 'LKR', name: 'Sri Lankan Rupee' },
            { code: 'NPR', name: 'Nepalese Rupee' },
            { code: 'MMK', name: 'Burmese Kyat' },
            { code: 'KHR', name: 'Cambodian Riel' },
            { code: 'LAK', name: 'Lao Kip' },
            { code: 'MNT', name: 'Mongolian Tögrög' },
            { code: 'KGS', name: 'Kyrgyzstani Som' },
            { code: 'TJS', name: 'Tajikistani Somoni' },
            { code: 'AFN', name: 'Afghan Afghani' },
            { code: 'MVR', name: 'Maldivian Rufiyaa' },
            { code: 'BND', name: 'Brunei Dollar' },
            { code: 'FJD', name: 'Fijian Dollar' },
            { code: 'PGK', name: 'Papua New Guinean Kina' },
            { code: 'SBD', name: 'Solomon Islands Dollar' },
            { code: 'VUV', name: 'Vanuatu Vatu' },
            { code: 'XPF', name: 'CFP Franc' },
            { code: 'XOF', name: 'West African CFA Franc' },
            { code: 'XAF', name: 'Central African CFA Franc' },
            { code: 'KES', name: 'Kenyan Shilling' },
            { code: 'TZS', name: 'Tanzanian Shilling' },
            { code: 'UGX', name: 'Ugandan Shilling' },
            { code: 'GHS', name: 'Ghanaian Cedi' },
            { code: 'ETB', name: 'Ethiopian Birr' },
            { code: 'XOF', name: 'West African CFA Franc' },
            { code: 'XAF', name: 'Central African CFA Franc' },
            { code: 'CDF', name: 'Congolese Franc' },
            { code: 'ZMW', name: 'Zambian Kwacha' },
            { code: 'MWK', name: 'Malawian Kwacha' },
            { code: 'MZN', name: 'Mozambican Metical' },
            { code: 'MUR', name: 'Mauritian Rupee' },
            { code: 'SCR', name: 'Seychellois Rupee' },
            { code: 'NAD', name: 'Namibian Dollar' },
            { code: 'BWP', name: 'Botswana Pula' },
            { code: 'GMD', name: 'Gambian Dalasi' },
            { code: 'MAD', name: 'Moroccan Dirham' },
            { code: 'TND', name: 'Tunisian Dinar' },
            { code: 'LYD', name: 'Libyan Dinar' },
            { code: 'SDG', name: 'Sudanese Pound' }
        ];
        this.initializeElements();
        this.attachEventListeners();
        this.loadCurrenciesAndInit();
    }

    initializeElements() {
        // Input elements
        this.amountInput = document.getElementById('amount');
        this.fromCurrencySelect = document.getElementById('fromCurrency');
        this.toCurrencySelect = document.getElementById('toCurrency');
        this.convertBtn = document.getElementById('convertBtn');
        this.swapBtn = document.getElementById('swapCurrencies');
        this.retryBtn = document.getElementById('retryBtn');

        // Result elements
        this.loadingDiv = document.getElementById('loading');
        this.resultDiv = document.getElementById('result');
        this.errorDiv = document.getElementById('error');

        // Result display elements
        this.convertedAmount = document.getElementById('convertedAmount');
        this.toCurrencySymbol = document.getElementById('toCurrencySymbol');
        this.exchangeRate = document.getElementById('exchangeRate');
        this.fromCurrencySymbol = document.getElementById('fromCurrencySymbol');
        this.toCurrencyRate = document.getElementById('toCurrencyRate');
        this.toCurrencyCode = document.getElementById('toCurrencyCode');
        this.lastUpdated = document.getElementById('lastUpdated');
        this.errorMessage = document.getElementById('errorMessage');
    }

    attachEventListeners() {
        this.convertBtn.addEventListener('click', () => this.convertCurrency());
        this.swapBtn.addEventListener('click', () => this.swapCurrencies());
        this.retryBtn.addEventListener('click', () => this.convertCurrency());

        // Convert on Enter key press
        this.amountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.convertCurrency();
        });
        // Sanitize amount input to allow only digits and one dot
        this.amountInput.addEventListener('input', () => {
            const raw = this.amountInput.value;
            const cleaned = raw
                .replace(/[^0-9.,]/g, '') // keep digits, comma, dot
                .replace(/,/g, '.') // normalize comma to dot
                .replace(/(\..*)\./g, '$1'); // keep only first dot
            this.amountInput.value = cleaned;
        });

        // Auto-convert when currency changes
        [this.fromCurrencySelect, this.toCurrencySelect].forEach(select => {
            select.addEventListener('change', () => {
                if (this.amountInput.value) this.convertCurrency();
            });
        });
    }

    async loadInitialData() {
        this.amountInput.value = '100';
        this.fromCurrencySelect.value = 'USD';
        this.toCurrencySelect.value = 'EUR';
        await this.convertCurrency();
    }

    populateCurrencyOptions() {
        const render = (select) => {
            // Remember current selection if any
            const prev = select.value;
            select.innerHTML = '';
            this.currencies.forEach(({ code, name }) => {
                const opt = document.createElement('option');
                opt.value = code;
                opt.textContent = `${code} — ${name}`;
                select.appendChild(opt);
            });
            if (prev) select.value = prev;
        };
        render(this.fromCurrencySelect);
        render(this.toCurrencySelect);
    }

    async loadCurrenciesAndInit() {
        try {
            const response = await fetch(`${this.baseUrl}/${this.apiKey}/codes`);
            if (response.ok) {
                const data = await response.json();
                if (data.result === 'success' && Array.isArray(data.supported_codes)) {
                    const codes = data.supported_codes.map(([code, name]) => ({ code, name }));
                    this.currencies = codes.slice(0, 163);
                }
            }
        } catch (e) {
            // Use fallback list if API fails
        }
        this.populateCurrencyOptions();
        this.setupFilters();
        this.loadInitialData();
    }

    setupFilters() {
        // Add filter inputs for selects
        this.setupSelectFilter(this.fromCurrencySelect, 'Filter from currency');
        this.setupSelectFilter(this.toCurrencySelect, 'Filter to currency');
    }

    setupSelectFilter(selectElement, placeholder) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = placeholder;
        input.style.marginBottom = '6px';
        input.style.width = '100%';
        input.style.padding = '8px';
        input.style.border = '1px solid #ddd';
        input.style.borderRadius = '4px';
        // Insert input just before the select
        selectElement.parentNode.insertBefore(input, selectElement);

        const allOptions = [];
        for (let i = 0; i < selectElement.options.length; i++) {
            const o = selectElement.options[i];
            allOptions.push({ value: o.value, label: o.textContent });
        }

        const filterOptions = (query) => {
            const q = query.trim().toLowerCase();
            selectElement.innerHTML = '';
            const filtered = q
                ? allOptions.filter(({ value, label }) => value.toLowerCase().includes(q) || label.toLowerCase().includes(q))
                : allOptions;
            filtered.forEach(({ value, label }) => {
                const opt = document.createElement('option');
                opt.value = value;
                opt.textContent = label;
                selectElement.appendChild(opt);
            });
        };

        // Filter on input
        input.addEventListener('input', (e) => filterOptions(e.target.value));
        
        // Clear filter and maintain selection on Enter key press
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Remember current selection before clearing
                const currentValue = selectElement.value;
                // Clear the filter input
                input.value = '';
                // Reset to show all options
                filterOptions('');
                // Restore the previous selection
                if (currentValue) {
                    selectElement.value = currentValue;
                }
            }
        });
    }

    async convertCurrency() {
        const amount = parseFloat(this.amountInput.value);
        const fromCurrency = this.fromCurrencySelect.value;
        const toCurrency = this.toCurrencySelect.value;

        if (!amount || amount <= 0) {
            this.showError('Please enter a valid amount');
            return;
        }

        if (fromCurrency === toCurrency) {
            this.showResult(amount, 1, fromCurrency, toCurrency);
            return;
        }

        this.showLoading();

        try {
            const response = await this.fetchExchangeRate(fromCurrency, toCurrency);
            if (response.success) {
                const rate = response.rates[toCurrency];
                const convertedAmount = amount * rate;
                this.showResult(convertedAmount, rate, fromCurrency, toCurrency);
            } else {
                throw new Error(response.error || 'Failed to fetch exchange rate');
            }
        } catch (error) {
            console.error('Conversion error:', error);
            this.showError('Could not fetch data. Please try again.');
        }
    }

    async fetchExchangeRate(fromCurrency, toCurrency) {
        const url = `${this.baseUrl}/${this.apiKey}/latest/${fromCurrency}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();

            // ExchangeRate-API returns `result` === "success"
            if (data.result === 'success' && data.conversion_rates) {
                return {
                    success: true,
                    rates: data.conversion_rates,
                    lastUpdated: data.time_last_update_utc
                };
            } else {
                throw new Error(data.error || 'API returned an error');
            }
        } catch (error) {
            console.warn('Using fallback data due to API error:', error);
            return this.getMockExchangeRate(fromCurrency, toCurrency);
        }
    }

    // Added missing rates for more currencies
    getMockExchangeRate(fromCurrency, toCurrency) {
        const mockRates = {
            'USD': { 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110.0, 'CAD': 1.25, 'AUD': 1.35, 'CHF': 0.92, 'CNY': 6.45, 'INR': 75.0, 'BRL': 5.2, 'PHP': 58.2, 'KRW': 1340, 'MXN': 17.2 },
            'EUR': { 'USD': 1.18, 'GBP': 0.86, 'JPY': 129.0, 'CAD': 1.47, 'AUD': 1.59, 'CHF': 1.08, 'CNY': 7.59, 'INR': 88.0, 'BRL': 6.1, 'PHP': 63.5 },
            'PHP': { 'USD': 0.017, 'EUR': 0.016, 'JPY': 1.9, 'GBP': 0.014, 'AUD': 0.023 },
            'JPY': { 'USD': 0.0091, 'EUR': 0.0077, 'GBP': 0.0067, 'PHP': 0.53, 'INR': 0.68 }
        };

        const rate = mockRates[fromCurrency]?.[toCurrency] || 1.0;
        return { success: true, rates: { [toCurrency]: rate }, lastUpdated: new Date().toISOString() };
    }

    showLoading() {
        this.hideAllResults();
        this.loadingDiv.classList.remove('hidden');
        this.convertBtn.disabled = true;
    }

    showResult(convertedAmount, rate, fromCurrency, toCurrency) {
        this.hideAllResults();
        this.convertedAmount.textContent = this.formatCurrency(convertedAmount);
        this.toCurrencySymbol.textContent = this.getCurrencySymbol(toCurrency);
        this.fromCurrencySymbol.textContent = this.getCurrencySymbol(fromCurrency);
        this.exchangeRate.textContent = rate.toFixed(4);
        this.toCurrencyRate.textContent = (1 / rate).toFixed(4);
        this.toCurrencyCode.textContent = toCurrency;
        this.lastUpdated.textContent = new Date().toLocaleString();
        this.resultDiv.classList.remove('hidden');
        this.convertBtn.disabled = false;
    }

    showError(message) {
        this.hideAllResults();
        this.errorMessage.textContent = message;
        this.errorDiv.classList.remove('hidden');
        this.convertBtn.disabled = false;
    }

    hideAllResults() {
        this.loadingDiv.classList.add('hidden');
        this.resultDiv.classList.add('hidden');
        this.errorDiv.classList.add('hidden');
    }

    swapCurrencies() {
        [this.fromCurrencySelect.value, this.toCurrencySelect.value] = 
        [this.toCurrencySelect.value, this.fromCurrencySelect.value];
        if (this.amountInput.value) this.convertCurrency();
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    getCurrencySymbol(currency) {
        const symbols = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CAD': 'C$', 'AUD': 'A$', 
            'CHF': 'CHF', 'CNY': '¥', 'INR': '₹', 'BRL': 'R$', 'PHP': '₱', 'KRW': '₩',
            'MXN': 'MX$', 'SEK': 'kr', 'NZD': 'NZ$', 'SGD': 'S$', 'HKD': 'HK$', 'ZAR': 'R',
            'RUB': '₽', 'TRY': '₺', 'NOK': 'kr', 'DKK': 'kr', 'THB': '฿', 'PLN': 'zł', 'AED': 'د.إ'
        };
        return symbols[currency] || currency;
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => new CurrencyConverter());
