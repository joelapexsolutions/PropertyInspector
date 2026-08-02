// ====================================================================
// PAYFAST-CHECKOUT.JS — PayFast payment integration
// Home Buyers Guide SA PWA
// PayFast is SA's leading payment gateway.
// Charges in ZAR directly. Card · Instant EFT · Capitec Pay.
// Signature is generated server-side (Cloud Function) so the
// passphrase never appears in client code.
// ====================================================================
(function () {
    'use strict';

    var PLAN_BILLING = {
        '1month': 'First 3 days FREE, then R100/month automatically.',
        '3month': 'R250 is charged every 3 months automatically.',
        '6month': 'R450 is charged every 6 months automatically.',
        '1year':  'R850 is charged every year automatically.'
    };

    // ----------------------------------------------------------------
    // Start payment — calls Cloud Function for signed form, then
    // submits to PayFast (redirect to PayFast's secure payment page)
    // ----------------------------------------------------------------
    function startPayment(planId) {
        var user = window.hbgAuth && window.hbgAuth.getCurrentUser
            ? window.hbgAuth.getCurrentUser() : null;
        if (!user) { console.warn('PayFast: no user'); return; }

        // Show loading state
        var btn = document.querySelector('.pgs-payfast-pay-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting to PayFast…';
        }

        var getFormFn = firebase.functions().httpsCallable('getPayFastForm');
        getFormFn({ planId: planId, userEmail: user.email })
            .then(function (result) {
                submitToPayFast(result.data);
            })
            .catch(function (err) {
                console.error('PayFast form error:', err);
                if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Secure Checkout — PayFast'; }
                showError('Could not connect to PayFast. Please try again or contact homebuyersguidesa@gmail.com');
            });
    }

    // Build and auto-submit a POST form to PayFast
    function submitToPayFast(formData) {
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://www.payfast.co.za/eng/process';

        Object.keys(formData).forEach(function (key) {
            var input = document.createElement('input');
            input.type  = 'hidden';
            input.name  = key;
            input.value = formData[key];
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
    }

    function showError(msg) {
        var container = document.getElementById('paypal-button-container');
        if (container) {
            container.innerHTML = '<p class="pgs-payment-error">'
                + '<i class="fas fa-exclamation-triangle"></i> ' + msg + '</p>';
        }
    }

    // ----------------------------------------------------------------
    // Inject the PayFast pay button into the payment container
    // Called from web-app.js handleSubscribeClick (signed-in path)
    // ----------------------------------------------------------------
    function showPayButton(planId) {
        // Billing info
        var infoEl = document.getElementById('pgsBillingInfo');
        if (infoEl) {
            infoEl.textContent = PLAN_BILLING[planId] || '';
            infoEl.style.display = '';
        }

        // Pay button + payment method labels
        var container = document.getElementById('paypal-button-container');
        if (container) {
            container.innerHTML =
                '<button class="pgs-payfast-pay-btn" onclick="window.hbgPayFast.startPayment(\'' + planId + '\')">'
                + '<i class="fas fa-lock"></i> Secure Checkout — PayFast'
                + '</button>'
                + '<p class="pgs-payfast-methods">'
                + '<i class="fas fa-credit-card"></i> Card &nbsp;·&nbsp; '
                + '<i class="fas fa-university"></i> Instant EFT &nbsp;·&nbsp; '
                + 'Capitec Pay'
                + '</p>';
        }
    }

    // ----------------------------------------------------------------
    // Public API
    // ----------------------------------------------------------------
    window.hbgPayFast = {
        startPayment: startPayment,
        showPayButton: showPayButton
    };

    console.log('💳 hbg-payfast: PayFast checkout ready');
})();
