// Frontend Currency Converter logic (no API keys in the browser)

class CurrencyConverter {
    constructor() {
        // Static fallback list of currencies 
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
            { code: 'CDF', name: 'Congolese Franc' },
            { code: 'ZMW', name: 'Zambian Kwacha' },
            { code: 'MWK', name: 'Malawian Kwacha' },
            { code: 'MZN', name: 'Mozambican Metical' },
            { code: 'MUR', name: 'Mauritian Rupee' },
            { code: 'SCR', name: 'Seychellois Rupee' },
            { code: 'NAD', name: 'Namibian Dollar' },
            { code: 'BWP', name: 'Botswana Pula' },
            { code: 'GMD', name: 'Gambian Dalasi' },
            { code: 'TND', name: 'Tunisian Dinar' },
            { code: 'LYD', name: 'Libyan Dinar' },
            { code: 'SDG', name: 'Sudanese Pound' }
        ];

        this.initializeElements();
        this.attachEventListeners();
        this.populateCurrencyOptions();
        this.setupFilters();
        this.loadInitialData();
    }

    initializeElements() {
        this.amountInput = document.getElementById('amount');
        this.fromCurrencySelect = document.getElementById('fromCurrency');
        this.toCurrencySelect = document.getElementById('toCurrency');
        this.convertBtn = document.getElementById('convertBtn');
        this.swapBtn = document.getElementById('swapCurrencies');
        this.retryBtn = document.getElementById('retryBtn');

        this.loadingDiv = document.getElementById('loading');
        this.resultDiv = document.getElementById('result');
        this.errorDiv = document.getElementById('error');

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

        this.amountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.convertCurrency();
        });

        // Enhanced input sanitization with strict validation
        this.amountInput.addEventListener('input', () => {
            let raw = this.amountInput.value;
            
            // Remove all non-numeric characters except dot
            let cleaned = raw.replace(/[^0-9.]/g, '');
            
            // Handle multiple dots - keep only the first one
            const parts = cleaned.split('.');
            if (parts.length > 2) {
                cleaned = parts[0] + '.' + parts.slice(1).join('');
            }
            
            // Prevent leading zeros (e.g., "0001" becomes "1")
            if (cleaned.startsWith('0') && cleaned.length > 1 && cleaned[1] !== '.') {
                cleaned = cleaned.replace(/^0+/, '');
                if (cleaned === '' || cleaned.startsWith('.')) {
                    cleaned = '0' + cleaned;
                }
            }
            
            // Limit to 10 decimal places
            if (cleaned.includes('.')) {
                const [integer, decimal] = cleaned.split('.');
                cleaned = integer + '.' + decimal.slice(0, 10);
            }
            
            this.amountInput.value = cleaned;
        });

        [this.fromCurrencySelect, this.toCurrencySelect].forEach((select) => {
            select.addEventListener('change', () => {
                if (this.amountInput.value) this.convertCurrency();
            });
        });
    }

    loadInitialData() {
        this.amountInput.value = '100';
        this.fromCurrencySelect.value = 'USD';
        this.toCurrencySelect.value = 'EUR';
        this.convertCurrency();
    }

    populateCurrencyOptions() {
        const render = (select) => {
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

    setupFilters() {
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
                ? allOptions.filter(
                      ({ value, label }) =>
                          value.toLowerCase().includes(q) || label.toLowerCase().includes(q)
                  )
                : allOptions;
            filtered.forEach(({ value, label }) => {
                const opt = document.createElement('option');
                opt.value = value;
                opt.textContent = label;
                selectElement.appendChild(opt);
            });
        };

        input.addEventListener('input', (e) => filterOptions(e.target.value));

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const currentValue = selectElement.value;
                input.value = '';
                filterOptions('');
                if (currentValue) {
                    selectElement.value = currentValue;
                }
            }
        });
    }

    validateAmount(value) {
        // Sanitize input: trim whitespace
        const trimmed = String(value).trim();
        
        // Check if empty
        if (trimmed === '') {
            return { valid: false, error: 'Amount cannot be empty' };
        }
        
        // Parse to float
        const amount = parseFloat(trimmed);
        
        // Check for NaN
        if (isNaN(amount)) {
            return { valid: false, error: 'Amount must be a valid number' };
        }
        
        // Check for positive value
        if (amount <= 0) {
            return { valid: false, error: 'Amount must be greater than 0' };
        }
        
        // Check for maximum allowed value (prevent overflow/injection)
        const MAX_AMOUNT = 1e10; // 10 billion
        if (amount > MAX_AMOUNT) {
            return { valid: false, error: 'Amount exceeds maximum limit' };
        }
        
        // Check for valid decimal places (max 10 decimal places)
        if (!Number.isFinite(amount)) {
            return { valid: false, error: 'Amount must be a finite number' };
        }
        
        return { valid: true, value: amount };
    }

    validateCurrency(code) {
        // Validate currency code format: exactly 3 uppercase letters
        if (!code || typeof code !== 'string') {
            return { valid: false, error: 'Invalid currency format' };
        }
        
        const trimmed = code.trim().toUpperCase();
        
        // Check format: only 3 uppercase letters
        if (!/^[A-Z]{3}$/.test(trimmed)) {
            return { valid: false, error: 'Currency code must be 3 letters' };
        }
        
        // Check if currency exists in the list
        const exists = this.currencies.some(c => c.code === trimmed);
        if (!exists) {
            return { valid: false, error: 'Invalid currency code' };
        }
        
        return { valid: true, value: trimmed };
    }

    async convertCurrency() {
        // Validate amount with strict checks
        const amountValidation = this.validateAmount(this.amountInput.value);
        if (!amountValidation.valid) {
            this.showError(amountValidation.error);
            return;
        }
        const amount = amountValidation.value;
        
        // Validate from currency
        const fromValidation = this.validateCurrency(this.fromCurrencySelect.value);
        if (!fromValidation.valid) {
            this.showError(fromValidation.error);
            return;
        }
        const fromCurrency = fromValidation.value;
        
        // Validate to currency
        const toValidation = this.validateCurrency(this.toCurrencySelect.value);
        if (!toValidation.valid) {
            this.showError(toValidation.error);
            return;
        }
        const toCurrency = toValidation.value;

        if (fromCurrency === toCurrency) {
            this.showResult(amount, 1, fromCurrency, toCurrency, new Date().toISOString());
            return;
        }

        this.showLoading();

        try {
            const response = await this.fetchExchangeRate(fromCurrency, toCurrency, amount);
            if (response.success) {
                const rate = response.rate;
                const convertedAmount = response.convertedAmount ?? amount * rate;
                this.showResult(convertedAmount, rate, fromCurrency, toCurrency, response.lastUpdated);
            } else {
                throw new Error(response.error || 'Failed to fetch exchange rate');
            }
        } catch (error) {
            console.error('Conversion error:', error);
            this.showError('Could not fetch data. Please try again.');
        }
    }

    sanitizeHTML(str) {
        // Prevent XSS attacks by escaping HTML entities
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(str).replace(/[&<>"']/g, m => map[m]);
    }

    async fetchExchangeRate(fromCurrency, toCurrency, amount) {
        // Validate parameters again (defense in depth)
        if (!/^[A-Z]{3}$/.test(fromCurrency) || !/^[A-Z]{3}$/.test(toCurrency)) {
            throw new Error('Invalid currency format in request');
        }
        
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error('Invalid amount in request');
        }
        
        const params = new URLSearchParams({
            from: fromCurrency,
            to: toCurrency,
            amount: String(amount)
        });

        try {
            const response = await fetch(`/api/convert?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Strict validation of API response
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid API response format');
            }
            
            if (data.success !== true) {
                throw new Error(data.error || 'API returned an error');
            }
            
            // Validate rate is a positive number
            if (typeof data.rate !== 'number' || !Number.isFinite(data.rate) || data.rate <= 0) {
                throw new Error('Invalid exchange rate received');
            }
            
            // Validate convertedAmount if present
            if (data.convertedAmount !== undefined) {
                if (typeof data.convertedAmount !== 'number' || !Number.isFinite(data.convertedAmount) || data.convertedAmount < 0) {
                    throw new Error('Invalid converted amount received');
                }
            }
            
            return {
                success: true,
                rate: data.rate,
                convertedAmount: data.convertedAmount,
                lastUpdated: data.lastUpdated
            };
        } catch (error) {
            console.warn('Using fallback data due to API error:', error);
            const fallback = this.getMockExchangeRate(fromCurrency, toCurrency);
            return {
                success: true,
                rate: fallback.rate,
                convertedAmount: amount * fallback.rate,
                lastUpdated: fallback.lastUpdated
            };
        }
    }

    getMockExchangeRate(fromCurrency, toCurrency) {
        const mockRates = {
            USD: { EUR: 0.85, GBP: 0.73, JPY: 110.0, CAD: 1.25, AUD: 1.35, CHF: 0.92, CNY: 6.45, INR: 75.0, BRL: 5.2, PHP: 58.2, KRW: 1340, MXN: 17.2 },
            EUR: { USD: 1.18, GBP: 0.86, JPY: 129.0, CAD: 1.47, AUD: 1.59, CHF: 1.08, CNY: 7.59, INR: 88.0, BRL: 6.1, PHP: 63.5 },
            PHP: { USD: 0.017, EUR: 0.016, JPY: 1.9, GBP: 0.014, AUD: 0.023 },
            JPY: { USD: 0.0091, EUR: 0.0077, GBP: 0.0067, PHP: 0.53, INR: 0.68 }
        };

        const rate = (mockRates[fromCurrency] && mockRates[fromCurrency][toCurrency]) || 1.0;
        return { rate, lastUpdated: new Date().toISOString() };
    }

    showLoading() {
        this.hideAllResults();
        this.loadingDiv.classList.remove('hidden');
        this.convertBtn.disabled = true;
    }

    showResult(convertedAmount, rate, fromCurrency, toCurrency, lastUpdated) {
        this.hideAllResults();
        this.convertedAmount.textContent = this.formatCurrency(convertedAmount);
        this.toCurrencySymbol.textContent = this.getCurrencySymbol(toCurrency);
        this.fromCurrencySymbol.textContent = this.getCurrencySymbol(fromCurrency);
        this.exchangeRate.textContent = rate.toFixed(4);
        this.toCurrencyRate.textContent = (1 / rate).toFixed(4);
        this.toCurrencyCode.textContent = toCurrency;
        this.lastUpdated.textContent = lastUpdated
            ? new Date(lastUpdated).toLocaleString()
            : new Date().toLocaleString();
        this.resultDiv.classList.remove('hidden');
        this.convertBtn.disabled = false;
    }

    showError(message) {
        this.hideAllResults();
        // Sanitize message to prevent XSS attacks
        this.errorMessage.textContent = this.sanitizeHTML(message);
        this.errorDiv.classList.remove('hidden');
        this.convertBtn.disabled = false;
    }

    hideAllResults() {
        this.loadingDiv.classList.add('hidden');
        this.resultDiv.classList.add('hidden');
        this.errorDiv.classList.add('hidden');
    }

    swapCurrencies() {
        [this.fromCurrencySelect.value, this.toCurrencySelect.value] = [
            this.toCurrencySelect.value,
            this.fromCurrencySelect.value
        ];
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
            USD: '$',
            EUR: '€',
            GBP: '£',
            JPY: '¥',
            CAD: 'C$',
            AUD: 'A$',
            CHF: 'CHF',
            CNY: '¥',
            INR: '₹',
            BRL: 'R$',
            PHP: '₱',
            KRW: '₩',
            MXN: 'MX$',
            SEK: 'kr',
            NZD: 'NZ$',
            SGD: 'S$',
            HKD: 'HK$',
            ZAR: 'R',
            RUB: '₽',
            TRY: '₺',
            NOK: 'kr',
            DKK: 'kr',
            THB: '฿',
            PLN: 'zł',
            AED: 'د.إ'
        };
        return symbols[currency] || currency;
    }
}

document.addEventListener('DOMContentLoaded', () => new CurrencyConverter());


