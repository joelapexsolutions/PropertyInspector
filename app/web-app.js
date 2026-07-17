// ====================================================================
// WEB-APP.JS — Web/PWA mode controller for Home Buyers Guide SA
// Only activates in a browser (window.Android absent).
// Never runs inside the Android app, so the Play Store version
// is completely unaffected.
// ====================================================================
(function () {
    'use strict';

    // Inside the Android app? Do absolutely nothing.
    if (window.Android) return;

    // ----------------------------------------------------------------
    // 1. FULL PREMIUM ACCESS ON WEB (until PayPal payments are added)
    //    Written to localStorage BEFORE the premium system initialises
    //    on DOMContentLoaded, so loadPremiumState() restores it.
    // ----------------------------------------------------------------
    var FAR_FUTURE = '2099-12-31T23:59:59.000Z';
    try {
        var raw = localStorage.getItem('propertyInspectorPremium');
        var state = raw ? JSON.parse(raw) : {};
        state.isPremium = true;
        state.subscriptionType = 'web-full-access';
        state.subscriptionEndDate = FAR_FUTURE;
        localStorage.setItem('propertyInspectorPremium', JSON.stringify(state));
    } catch (e) {
        console.warn('web-app: could not pre-set premium state', e);
    }

    // ----------------------------------------------------------------
    // 2. INSTALL PROMPT
    // ----------------------------------------------------------------
    var deferredInstallPrompt = null;

    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        deferredInstallPrompt = e;   // Android Chrome / desktop Chrome & Edge
    });

    function isStandalone() {
        return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
            || window.navigator.standalone === true;
    }

    function isIOS() {
        var ua = navigator.userAgent;
        return /iPhone|iPad|iPod/.test(ua)
            || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS
    }

    function installBannerDismissed() {
        try {
            var t = localStorage.getItem('hbgInstallDismissed');
            return t && (Date.now() - parseInt(t, 10)) < 7 * 24 * 60 * 60 * 1000; // 7 days
        } catch (e) { return false; }
    }

    function dismissInstallBanner() {
        var el = document.getElementById('hbgInstallBanner');
        if (el) el.remove();
        try { localStorage.setItem('hbgInstallDismissed', String(Date.now())); } catch (e) {}
    }

    function showInstallBanner() {
        if (isStandalone() || installBannerDismissed()) return;
        if (document.getElementById('hbgInstallBanner')) return;

        var banner = document.createElement('div');
        banner.id = 'hbgInstallBanner';
        banner.className = 'hbg-install-banner';

        if (isIOS()) {
            banner.innerHTML =
                '<div class="hbg-ib-text">' +
                '  <strong>Install this app</strong>' +
                '  <span>Tap <i class="fas fa-arrow-up-from-bracket"></i> Share, then ' +
                '  <strong>Add to Home Screen</strong></span>' +
                '</div>' +
                '<button class="hbg-ib-close" aria-label="Dismiss">&times;</button>';
        } else {
            banner.innerHTML =
                '<div class="hbg-ib-text">' +
                '  <strong>Install this app</strong>' +
                '  <span>Get the full-screen app experience</span>' +
                '</div>' +
                '<button class="hbg-ib-install">Install</button>' +
                '<button class="hbg-ib-close" aria-label="Dismiss">&times;</button>';
        }

        document.body.appendChild(banner);

        banner.querySelector('.hbg-ib-close').addEventListener('click', dismissInstallBanner);

        var installBtn = banner.querySelector('.hbg-ib-install');
        if (installBtn) {
            installBtn.addEventListener('click', function () {
                if (deferredInstallPrompt) {
                    deferredInstallPrompt.prompt();
                    deferredInstallPrompt.userChoice.then(function () {
                        deferredInstallPrompt = null;
                        dismissInstallBanner();
                    });
                } else {
                    // Browser without install support — show generic guidance
                    installBtn.previousElementSibling.innerHTML =
                        '<strong>Install this app</strong>' +
                        '<span>Open your browser menu and choose ' +
                        '<strong>Add to Home screen</strong> / <strong>Install app</strong></span>';
                    installBtn.remove();
                }
            });
        }
    }

    // ----------------------------------------------------------------
    // 3. BOOT (after DOM + premium system are ready)
    // ----------------------------------------------------------------
    function boot() {
        document.body.classList.add('web-mode');

        // Belt and braces: force premium in the live state object too,
        // in case it initialised before our localStorage write.
        try {
            if (window.premiumState) {
                window.premiumState.isPremium = true;
                window.premiumState.subscriptionType = 'web-full-access';
                window.premiumState.subscriptionEndDate = FAR_FUTURE;
            }
            if (typeof window.updateUIForPremiumStatus === 'function') {
                window.updateUIForPremiumStatus();
            }
            var strip = document.getElementById('upgradeStrip');
            if (strip) strip.remove();
        } catch (e) {
            console.warn('web-app: premium override issue', e);
        }

        // Show the install banner a few seconds after load, once the
        // loading modal and onboarding have had their moment.
        setTimeout(showInstallBanner, 6000);

        console.log('🌐 web-app: web mode active — full access enabled');
    }

    if (document.readyState === 'loading') {
        // Run after DOMContentLoaded, and after premium-integration's own
        // DOMContentLoaded handler (listener order = registration order,
        // and this file loads after premium-integration.js).
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(boot, 300);
        });
    } else {
        setTimeout(boot, 300);
    }
})();
