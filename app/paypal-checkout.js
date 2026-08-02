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
    // Charging in ZAR directly — exact rand amounts, no exchange rate needed.
    // PayPal converts to USD when funds reach your PayPal account.
    var PLAN_ZAR = {
        '1month': '100.00',
        '3month': '250.00',
        '6month': '450.00',
        '1year':  '850.00'
    };

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
                      + PAYPAL_CLIENT_ID + '&currency=ZAR&intent=capture';
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
        if (!PLAN_ZAR[planId]) return;
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
                    return actions.order.create({
                        purchase_units: [{
                            description: PLAN_LABELS[_currentPlanId],
                            amount: {
                                currency_code: 'ZAR',
                                value:         PLAN_ZAR[_currentPlanId]
                            }
                        }]
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
