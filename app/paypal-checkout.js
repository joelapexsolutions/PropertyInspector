// ====================================================================
// PAYPAL-CHECKOUT.JS — PayPal payment integration
// Home Buyers Guide SA PWA
// Client ID is safe to expose in frontend code.
// Secret key is NEVER here — it lives only in the Cloud Function.
// ====================================================================
(function () {
    'use strict';

    var PAYPAL_CLIENT_ID = 'BAAwUsXDGy5cJfkh0AkE8c-5qiUlafv5LODMyEP8p' +
                           'SzCxLUVozIWMyD9Q_crnEW63qG1ZUYkB35lxlfq6E';

    // PayPal SA accounts process in USD. These are the USD equivalents.
    // The plan cards show ZAR prices — PayPal button shows the USD charge.
    // ZAR amounts your customers see on the plan cards.
    // At checkout, the live USD equivalent is fetched from an exchange rate API
    // so the amount is always accurate — no hardcoded rates.
    var PLAN_ZAR_AMOUNTS = {
        '1month': 100,
        '3month': 250,
        '6month': 450,
        '1year':  850
    };

    // Three-tier exchange rate strategy:
    //   1. Live API  — always tried first (most accurate)
    //   2. Cached    — last known good rate stored in localStorage
    //   3. Hardcoded — absolute last resort (first-time user, API down, no cache)
    // Nobody is blocked from paying regardless of API availability.
    var _RATE_CACHE_KEY      = 'hbgZarUsdRate';
    var _RATE_CACHE_MAX_AGE  = 24 * 60 * 60 * 1000; // 24 hours in ms
    // Tier 3 hardcoded fallback amounts (USD) — update these if the rate
    // drifts significantly. Used ONLY when both API and cache are unavailable.
    var _HARDCODED_USD = {
        '1month': '6.04',   // R100
        '3month': '15.10',  // R250
        '6month': '27.18',  // R450
        '1year':  '51.34'   // R850
    };

    function _saveRate(rate) {
        try {
            localStorage.setItem(_RATE_CACHE_KEY, JSON.stringify({
                rate:      rate,
                savedAt:   Date.now()
            }));
        } catch (e) {}
    }

    function _getCachedRate() {
        try {
            var cached = JSON.parse(localStorage.getItem(_RATE_CACHE_KEY));
            if (!cached || !cached.rate) return null;
            var age = Date.now() - cached.savedAt;
            if (age > _RATE_CACHE_MAX_AGE) return null; // older than 24h
            return cached.rate;
        } catch (e) { return null; }
    }

    function getUSDAmount(zarAmount) {
        return fetch('https://open.er-api.com/v6/latest/ZAR')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var rate = data.rates && data.rates.USD;
                if (!rate || rate <= 0) throw new Error('Invalid rate from API');
                _saveRate(rate); // cache for future fallback
                var usd = (zarAmount * rate).toFixed(2);
                console.log('💱 Live rate: R1 = $' + rate.toFixed(4)
                    + ' → R' + zarAmount + ' = $' + usd);
                return usd;
            })
            .catch(function () {
                // Tier 2: use cached rate if available and fresh
                var cached = _getCachedRate();
                if (cached) {
                    var usd = (zarAmount * cached).toFixed(2);
                    console.warn('💱 API unavailable — using cached rate: R1 = $'
                        + cached.toFixed(4) + ' → R' + zarAmount + ' = $' + usd);
                    return usd;
                }
                // Tier 3: hardcoded fallback (first-time user, no cache)
                var usd = _HARDCODED_USD[_currentPlanId] || '6.04';
                console.warn('💱 No cache — using hardcoded amount: $' + usd);
                return usd;
            });
    }

    var PLAN_LABELS = {
        '1month': '1 Month Premium — Home Buyers Guide SA',
        '3month': '3 Months Premium — Home Buyers Guide SA',
        '6month': '6 Months Premium — Home Buyers Guide SA',
        '1year':  '1 Year Premium — Home Buyers Guide SA'
    };

    var _currentPlanId   = null;
    var _paypalInstance  = null;
    var _sdkLoaded       = false;

    // ----------------------------------------------------------------
    // Load the PayPal JS SDK once (lazy — only when a plan is selected)
    // ----------------------------------------------------------------
    function loadSDK(callback) {
        if (_sdkLoaded && window.paypal) { callback(); return; }
        var existing = document.getElementById('paypal-sdk');
        if (existing) { existing.onload = callback; return; }

        var script    = document.createElement('script');
        script.id     = 'paypal-sdk';
        script.src    = 'https://www.paypal.com/sdk/js?client-id='
                      + PAYPAL_CLIENT_ID + '&currency=USD&intent=capture';
        script.onload = function () { _sdkLoaded = true; callback(); };
        script.onerror = function () {
            showError('Could not load PayPal. Check your connection and try again.');
        };
        document.head.appendChild(script);
    }

    // ----------------------------------------------------------------
    // Render PayPal buttons for the selected plan
    // ----------------------------------------------------------------
    function renderButtons(planId) {
        if (!PLAN_ZAR_AMOUNTS[planId]) return;
        _currentPlanId = planId;

        var container = document.getElementById('pgsPayPalContainer');
        var btnDiv    = document.getElementById('paypal-button-container');
        if (!container || !btnDiv) return;

        // Destroy previous instance
        if (_paypalInstance) {
            try { _paypalInstance.close(); } catch (e) {}
            _paypalInstance = null;
        }
        btnDiv.innerHTML = '<div class="pgs-paypal-loading">'
            + '<i class="fas fa-spinner fa-spin"></i> Loading payment...</div>';
        container.style.display = 'block';

        // Hide "coming soon" message
        var cs = document.getElementById('pgsComingSoon');
        if (cs) cs.style.display = 'none';

        loadSDK(function () {
            btnDiv.innerHTML = '';

            _paypalInstance = window.paypal.Buttons({
                style: {
                    layout: 'vertical',
                    color:  'gold',
                    shape:  'rect',
                    label:  'pay',
                    height: 50
                },

                // Step 1 — create the order on PayPal
                createOrder: function (data, actions) {
                    var zarAmount = PLAN_ZAR_AMOUNTS[_currentPlanId];
                    return getUSDAmount(zarAmount).then(function (usdAmount) {
                        return actions.order.create({
                            purchase_units: [{
                                description: PLAN_LABELS[_currentPlanId]
                                    + ' (R' + zarAmount + ' ZAR)',
                                amount: {
                                    currency_code: 'USD',
                                    value:         usdAmount
                                }
                            }]
                        });
                    });
                },

                // Step 2 — user approved, capture the payment
                onApprove: function (data, actions) {
                    return actions.order.capture().then(function () {
                        onPaymentCaptured(data.orderID, _currentPlanId);
                    });
                },

                onError: function (err) {
                    console.error('PayPal error:', err);
                    showError('Payment error. Please try again.');
                },

                onCancel: function () {
                    // User closed PayPal — just leave buttons in place
                    console.log('PayPal checkout cancelled');
                }
            });

            _paypalInstance.render('#paypal-button-container');
        });
    }

    // ----------------------------------------------------------------
    // After PayPal captures the payment — call Cloud Function to grant premium
    // ----------------------------------------------------------------
    function onPaymentCaptured(orderId, planId) {
        // Show spinner while we verify
        var container = document.getElementById('pgsPayPalContainer');
        if (container) {
            container.innerHTML = '<div class="pgs-paypal-loading">'
                + '<i class="fas fa-spinner fa-spin"></i>'
                + ' Activating your subscription…</div>';
        }

        var verifyFn = firebase.functions().httpsCallable('verifyPayPalPayment');
        verifyFn({ orderId: orderId, planId: planId })
            .then(function (result) {
                if (result.data && result.data.success) {
                    onSubscriptionActivated(planId, result.data.expiryDate);
                } else {
                    showError('Verification failed. Email joelapexs@gmail.com with your receipt.');
                }
            })
            .catch(function (err) {
                console.error('Cloud Function error:', err);
                showError('Could not verify payment. Email joelapexs@gmail.com with your receipt.');
            });
    }

    // ----------------------------------------------------------------
    // Subscription is now live — show confirmation
    // ----------------------------------------------------------------
    function onSubscriptionActivated(planId, expiryDateStr) {
        var expiry      = new Date(expiryDateStr);
        var expiryLabel = expiry.toLocaleDateString('en-ZA', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Update the expiry message in the "You have Premium" section
        var expiryEl = document.getElementById('pgsExpiryMsg');
        if (expiryEl) {
            expiryEl.textContent = 'Your plan is active until ' + expiryLabel;
        }

        // Hide plan section, show premium section
        ['pgsSignInSection', 'pgsEmailSentSection', 'pgsPlanSection']
            .forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });

        var premiumSection = document.getElementById('pgsPremiumSection');
        if (premiumSection) premiumSection.style.display = '';

        console.log('✅ Subscription activated:', planId, 'until', expiryDateStr);
    }

    function showError(msg) {
        var container = document.getElementById('pgsPayPalContainer');
        if (container) {
            container.innerHTML = '<p class="pgs-payment-error">'
                + '<i class="fas fa-exclamation-triangle"></i> ' + msg + '</p>';
        }
    }

    // ----------------------------------------------------------------
    // Public API — called by pgsSelectPlan() in web-app.js
    // ----------------------------------------------------------------
    window.hbgPayPal = {
        renderButtons: renderButtons
    };

    console.log('💳 hbg-paypal: PayPal checkout initialised');
})();
