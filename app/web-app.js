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
    // 2. PHOTO PICKER — let iOS/Android show Camera AND Photo Library
    //    photo-manager.js sets input.capture = 'camera', which forces
    //    Safari straight into the camera with no gallery option. This
    //    overrides capturePhoto() (web only) to drop that attribute,
    //    which makes iOS/Android show their full picker action sheet
    //    instead. Runs immediately — photo-manager.js loads earlier in
    //    index.html, so window.photoManager already exists here.
    // ----------------------------------------------------------------
    if (window.photoManager && typeof window.photoManager.capturePhoto === 'function') {
        window.photoManager.capturePhoto = async function (roomId, itemText) {
            this.currentCapture = { roomId: roomId, itemText: itemText };

            var input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            // Deliberately no `capture` attribute here — this is what
            // lets the browser offer Camera + Photo Library + Files,
            // instead of jumping straight into the camera.
            input.style.display = 'none';

            var self = this;
            input.onchange = async function (event) {
                var file = event.target.files[0];
                if (file && self.currentCapture) {
                    await self.processPhoto(file, self.currentCapture.roomId, self.currentCapture.itemText);
                    self.currentCapture = null;
                }
            };

            document.body.appendChild(input);
            input.click();
            document.body.removeChild(input);
        };
    }

    // ----------------------------------------------------------------
    // 3. GUARANTEE SAVES — belt-and-braces persistence
    //    The app already auto-saves every 30s and on most actions via
    //    IndexedDB + localStorage, which work fine in Safari. The real
    //    web risk is the tab being backgrounded/closed between saves,
    //    or (rarely) the browser evicting storage under pressure.
    // ----------------------------------------------------------------

    // Ask the browser not to evict this site's storage under pressure.
    // (Best-effort — not all browsers grant it, but it never hurts.)
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then(function (granted) {
            console.log('🌐 web-app: persistent storage', granted ? 'granted' : 'not granted');
        }).catch(function () {});
    }

    // Force-flush any unsaved state the instant the tab is backgrounded
    // or closed — iOS Safari can suspend JS execution very quickly once
    // a tab loses focus, so waiting for the next 30s auto-save isn't
    // reliable. Looked up lazily so this works even though app.js
    // (which defines these functions) loads after this file.
    function flushSave() {
        try {
            if (typeof window.saveAppDataSafely === 'function') {
                window.saveAppDataSafely();
            } else if (typeof window.saveAppData === 'function') {
                window.saveAppData();
            }
        } catch (e) {
            console.warn('web-app: flush save failed', e);
        }
    }

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') flushSave();
    });
    window.addEventListener('pagehide', flushSave);

    // ----------------------------------------------------------------
    // 4. INSTALL PROMPT
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
    // 5. WEB SPEECH API — voice notes in the browser
    //    Android uses the native SpeechRecognizer bridge via
    //    Android.startVoiceNote(). On web we use the browser's own
    //    SpeechRecognition API and wire up the same callbacks that
    //    checklist.js already defines:
    //      onVoiceNoteListening / onVoiceNotePartial / onVoiceNoteResult / onVoiceNoteError
    //    A minimal window.Android shim is created so that:
    //      - isVoiceAvailable() in checklist.js returns true
    //      - startVoiceInto() can call Android.startVoiceNote()
    //    Mic buttons will be shown and fully functional on iOS Safari,
    //    Chrome, Edge, and Firefox (where SpeechRecognition is available).
    // ----------------------------------------------------------------
    (function () {
        var SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechAPI) return; // browser has no speech support — mic stays hidden

        var _rec = null;

        // Create the minimal Android shim (only adds voice methods).
        // Guarded so we never overwrite if something else set it first.
        if (!window.Android) window.Android = {};

        window.Android.isVoiceNoteAvailable = function () { return true; };

        window.Android.startVoiceNote = function () {
            // Abort any recognition still in progress
            if (_rec) { try { _rec.abort(); } catch (e) {} }

            _rec = new SpeechAPI();
            _rec.continuous     = false;  // single utterance per tap
            _rec.interimResults = true;   // show words appearing as user speaks
            _rec.lang           = 'en-ZA'; // South African English

            _rec.onstart = function () {
                if (typeof window.onVoiceNoteListening === 'function') {
                    window.onVoiceNoteListening();
                }
            };

            _rec.onresult = function (event) {
                var interim = '';
                var final   = '';
                for (var i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript;
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }
                if (interim && typeof window.onVoiceNotePartial === 'function') {
                    window.onVoiceNotePartial(interim);
                }
                if (final && typeof window.onVoiceNoteResult === 'function') {
                    window.onVoiceNoteResult(final);
                    _rec = null;
                }
            };

            _rec.onerror = function (event) {
                _rec = null;
                var kind = 'error';
                if (event.error === 'no-speech') kind = 'no_speech';
                if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                    kind = 'permission_denied';
                }
                if (typeof window.onVoiceNoteError === 'function') {
                    window.onVoiceNoteError(kind);
                }
            };

            _rec.onend = function () {
                // Fired after onerror OR after a final result — safe to null here
                _rec = null;
            };

            try {
                _rec.start();
            } catch (e) {
                _rec = null;
                if (typeof window.onVoiceNoteError === 'function') {
                    window.onVoiceNoteError('error');
                }
            }
        };

        window.Android.stopVoiceNote = function () {
            if (_rec) {
                try { _rec.stop(); } catch (e) {}
                _rec = null;
            }
        };

        console.log('🎤 web-app: Web Speech API voice shim active');
    })();

    // ----------------------------------------------------------------
    // 6. BOOT (after DOM + premium system are ready)
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
