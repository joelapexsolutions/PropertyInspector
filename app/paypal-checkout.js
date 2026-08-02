// ====================================================================
// PAYPAL-CHECKOUT.JS — Recurring subscription payments
// Home Buyers Guide SA PWA
// Uses PayPal Subscriptions API — auto-renews until user cancels,
// exactly like Google Play subscriptions.
// ====================================================================
(function () {
    'use strict';

    var PAYPAL_CLIENT_ID = 'BAAwUsXDGy5cJfkh0AkE8c-5qiUlafv5LODMyEP8p' +
                           'SzCxLUVozIWMyD9Q_crnEW63qG1ZUYkB35lxlfq6E';

    // Live PayPal Plan IDs — created in PayPal Business Dashboard
    var PLAN_IDS = {
        '1month': 'P-3X13709968877904VNJXVTPI',
        '3month': 'P-2VU09087LE26726O6NJXVU5I',
        '6month': 'P-4P7794B4YY078701RNJXVVOQ',
        '1year':  'P-2A3O5111WW754613DNJXVV4Y'
    };

    var PLAN_LABELS = {
        '1month': '1 Month Premium — Home Buyers Guide SA',
        '3month': '3 Months Premium — Home Buyers Guide SA',
        '6month': '6 Months Premium — Home Buyers Guide SA',
        '1year':  '1 Year Premium — Home Buyers Guide SA'
    };

    var _currentPlanId  = null;
    var _paypalInstance = null;
    var _sdkLoaded      = false;

    // ----------------------------------------------------------------
    // Load PayPal SDK with subscription intent
    // ----------------------------------------------------------------
    function loadSDK(callback) {
        if (_sdkLoaded && window.paypal) { callback(); return; }
        var existing = document.getElementById('paypal-sdk');
        if (existing) { existing.onload = callback; return; }

        var script    = document.createElement('script');
        script.id     = 'paypal-sdk';
        script.src    = 'https://www.paypal.com/sdk/js?client-id='
                      + PAYPAL_CLIENT_ID
                      + '&vault=true&intent=subscription';
        script.onload = function () { _sdkLoaded = true; callback(); };
        script.onerror = function () {
            showError('Could not load PayPal. Check your connection and try again.');
        };
        document.head.appendChild(script);
    }

    // ----------------------------------------------------------------
    // Render PayPal subscription buttons for the selected plan
    // ----------------------------------------------------------------
    function renderButtons(planId) {
        if (!PLAN_IDS[planId]) return;
        _currentPlanId = planId;

        var container = document.getElementById('pgsPayPalContainer');
        var btnDiv    = document.getElementById('paypal-button-container');
        if (!container || !btnDiv) return;

        // Destroy previous buttons
        if (_paypalInstance) {
            try { _paypalInstance.close(); } catch (e) {}
            _paypalInstance = null;
        }
        btnDiv.innerHTML = '<div class="pgs-paypal-loading">'
            + '<i class="fas fa-spinner fa-spin"></i> Loading payment...</div>';
        container.style.display = 'block';

        var cs = document.getElementById('pgsComingSoon');
        if (cs) cs.style.display = 'none';

        loadSDK(function () {
            btnDiv.innerHTML = '';

            _paypalInstance = window.paypal.Buttons({
                style: {
                    layout: 'vertical',
                    color:  'gold',
                    shape:  'rect',
                    label:  'subscribe',
                    height: 50
                },

                // Create subscription using the plan ID
                createSubscription: function (data, actions) {
                    return actions.subscription.create({
                        plan_id: PLAN_IDS[_currentPlanId]
                    });
                },

                // Subscription approved — verify with Cloud Function
                onApprove: function (data) {
                    onSubscriptionApproved(data.subscriptionID, _currentPlanId);
                },

                onError: function (err) {
                    console.error('PayPal error:', err);
                    showError('Payment error. Please try again.');
                },

                onCancel: function () {
                    console.log('PayPal subscription cancelled by user');
                }
            });

            _paypalInstance.render('#paypal-button-container');
        });
    }

    // ----------------------------------------------------------------
    // Subscription approved — call Cloud Function to verify and activate
    // ----------------------------------------------------------------
    function onSubscriptionApproved(subscriptionId, planId) {
        showProcessing();

        var verifyFn = firebase.functions().httpsCallable('verifyPayPalSubscription');
        verifyFn({ subscriptionId: subscriptionId, planId: planId })
            .then(function (result) {
                if (result.data && result.data.success) {
                    onActivated(planId, result.data.nextBillingDate);
                } else {
                    showError('Verification failed. Email homebuyersguidesa@gmail.com with your receipt.');
                }
            })
            .catch(function (err) {
                console.error('Cloud Function error:', err);
                showError('Could not verify payment. Email homebuyersguidesa@gmail.com with your receipt.');
            });
    }

    // ----------------------------------------------------------------
    // Subscription activated — show confirmation
    // ----------------------------------------------------------------
    function onActivated(planId, nextBillingDate) {
        var expiry = nextBillingDate ? new Date(nextBillingDate) : null;
        var expiryLabel = expiry
            ? expiry.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'active';

        var expiryEl = document.getElementById('pgsExpiryMsg');
        if (expiryEl) {
            expiryEl.textContent = 'Next billing date: ' + expiryLabel
                + ' · Cancel anytime from Settings';
        }

        ['pgsSignInSection', 'pgsEmailSentSection', 'pgsPlanSection']
            .forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });

        var premiumSection = document.getElementById('pgsPremiumSection');
        if (premiumSection) premiumSection.style.display = '';

        console.log('✅ Subscription activated:', planId);
    }

    function showProcessing() {
        var container = document.getElementById('pgsPayPalContainer');
        if (container) {
            container.innerHTML = '<div class="pgs-paypal-loading">'
                + '<i class="fas fa-spinner fa-spin"></i>'
                + ' Activating your subscription…</div>';
        }
    }

    function showError(msg) {
        var container = document.getElementById('pgsPayPalContainer');
        if (container) {
            container.innerHTML = '<p class="pgs-payment-error">'
                + '<i class="fas fa-exclamation-triangle"></i> ' + msg + '</p>';
        }
    }

    // ----------------------------------------------------------------
    // Public API
    // ----------------------------------------------------------------
    window.hbgPayPal = {
        renderButtons: renderButtons
    };

    console.log('💳 hbg-paypal: Subscription checkout ready');
})();
