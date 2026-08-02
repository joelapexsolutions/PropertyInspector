// ====================================================================
// PAYPAL-CHECKOUT.JS — Recurring subscription payments
// Home Buyers Guide SA PWA
// ====================================================================
(function () {
    'use strict';

    var PAYPAL_CLIENT_ID = 'BAAwUsXDGy5cJfkh0AkE8c-5qiUlafv5LODMyEP8p' +
                           'SzCxLUVozIWMyD9Q_crnEW63qG1ZUYkB35lxlfq6E';

    var PLAN_IDS = {
        '1month': 'P-3X13709968877904VNJXVTPI',
        '3month': 'P-2VU09087LE2672606NJXVU5I',
        '6month': 'P-4P779484YY078701RNJXVVOQ',
        '1year':  'P-2A305111WW754613DNJXVV4Y'
    };

    // Trial info — only 1 month plan has a free trial
    var TRIAL_DAYS = { '1month': 3 };

    var PLAN_BILLING = {
        '1month': 'After your 3-day free trial, R100/month is charged automatically.',
        '3month': 'R250 is charged every 3 months automatically.',
        '6month': 'R450 is charged every 6 months automatically.',
        '1year':  'R850 is charged once a year automatically.'
    };

    var _currentPlanId  = null;
    var _paypalInstance = null;
    var _renderCount    = 0; // forces fresh container on every render

    // ----------------------------------------------------------------
    // Load PayPal SDK — disable card button, use subscription intent
    // card payments go through PayPal's own checkout, not a separate modal
    // ----------------------------------------------------------------
    function loadSDK(callback) {
        if (window.paypal) { callback(); return; }

        // Remove any existing SDK script to force fresh load
        var existing = document.getElementById('paypal-sdk');
        if (existing) existing.parentNode.removeChild(existing);

        var script    = document.createElement('script');
        script.id     = 'paypal-sdk';
        script.src    = 'https://www.paypal.com/sdk/js?client-id='
                      + PAYPAL_CLIENT_ID
                      + '&vault=true&intent=subscription'
                      + '&disable-funding=card,paylater,venmo';
        script.onload = callback;
        script.onerror = function () {
            showError('Could not load PayPal. Check your connection and try again.');
        };
        document.head.appendChild(script);
    }

    // ----------------------------------------------------------------
    // Show billing info for selected plan
    // ----------------------------------------------------------------
    function showBillingInfo(planId) {
        var infoEl = document.getElementById('pgsBillingInfo');
        if (!infoEl) return;
        infoEl.textContent = PLAN_BILLING[planId] || '';
        infoEl.style.display = '';
    }

    // ----------------------------------------------------------------
    // Render PayPal subscription buttons
    // SDK loads ONCE on first use. Subsequent plan changes just close
    // the old buttons and render new ones — no SDK reload needed.
    // ----------------------------------------------------------------
    function doRender(freshId) {
        var loading = document.getElementById('pgsPayPalLoading');
        if (loading) loading.remove();

        _paypalInstance = window.paypal.Buttons({
            style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'subscribe', height: 50 },

            createSubscription: function (data, actions) {
                return actions.subscription.create({
                    plan_id: PLAN_IDS[_currentPlanId]
                });
            },

            onApprove: function (data) {
                onSubscriptionApproved(data.subscriptionID, _currentPlanId);
            },

            onError: function (err) {
                console.error('PayPal error:', err);
                showError('Payment error. Please try again or contact homebuyersguidesa@gmail.com');
            },

            onCancel: function () {}
        });

        _paypalInstance.render('#' + freshId);
    }

    function renderButtons(planId) {
        if (!PLAN_IDS[planId]) return;
        _currentPlanId = planId;
        _renderCount++;

        var btnDiv = document.getElementById('paypal-button-container');
        if (!btnDiv) return;

        // Close previous instance cleanly
        if (_paypalInstance) {
            try { _paypalInstance.close(); } catch (e) {}
            _paypalInstance = null;
        }

        var freshId = 'ppbtn-' + _renderCount;
        btnDiv.innerHTML = '<div id="' + freshId + '"></div>';

        showBillingInfo(planId);

        // If SDK already loaded, render immediately — NO delete/reload
        if (window.paypal) {
            doRender(freshId);
        } else {
            // First time — load the SDK then render
            btnDiv.innerHTML = '<div id="' + freshId + '"></div>'
                + '<div class="pgs-paypal-loading" id="pgsPayPalLoading">'
                + '<i class="fas fa-spinner fa-spin"></i> Loading PayPal...</div>';
            loadSDK(function () { doRender(freshId); });
        }
    }
                        var info = document.createElement('p');
                        info.className = 'pgs-payment-error';
                        info.style.color = '#8bbad4';
                        info.innerHTML = '<i class="fas fa-info-circle"></i> Payment cancelled. Select a plan to try again.';
                        var bd = document.getElementById(freshId);
                        if (bd) bd.insertAdjacentElement('afterend', info);
                    }
                }
            });

            var target = document.getElementById(freshId);
            if (target) {
                _paypalInstance.render('#' + freshId);
            }
        });
    }

    // ----------------------------------------------------------------
    // Subscription approved
    // ----------------------------------------------------------------
    function onSubscriptionApproved(subscriptionId, planId) {
        var container = document.getElementById('pgsPayPalContainer');
        if (container) {
            container.innerHTML = '<div class="pgs-paypal-loading">'
                + '<i class="fas fa-spinner fa-spin"></i>'
                + ' Activating your subscription…</div>';
        }

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
                showError('Could not verify. Email homebuyersguidesa@gmail.com with your PayPal receipt.');
            });
    }

    // ----------------------------------------------------------------
    // Show success screen
    // ----------------------------------------------------------------
    function onActivated(planId, nextBillingDate) {
        var expiry = nextBillingDate ? new Date(nextBillingDate) : null;
        var expiryEl = document.getElementById('pgsExpiryMsg');
        if (expiryEl) {
            expiryEl.textContent = expiry
                ? 'Next billing date: '
                  + expiry.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
                  + ' · Cancel anytime from Settings'
                : 'Subscription active · Cancel anytime from Settings';
        }
        ['pgsSignInSection','pgsEmailSentSection','pgsPlanSection'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        var premiumSection = document.getElementById('pgsPremiumSection');
        if (premiumSection) premiumSection.style.display = '';
    }

    function showError(msg) {
        var container = document.getElementById('pgsPayPalContainer');
        if (container) {
            container.innerHTML = '<p class="pgs-payment-error">'
                + '<i class="fas fa-exclamation-triangle"></i> ' + msg + '</p>';
        }
    }

    window.hbgPayPal = { renderButtons: renderButtons };
    console.log('💳 hbg-paypal: Subscription checkout ready');
})();
