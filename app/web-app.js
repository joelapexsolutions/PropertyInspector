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
    // 2. PHOTO PICKER — custom bottom-sheet with explicit Camera / Gallery buttons
    //    Root cause of the gallery issue: Android Chrome and iOS Safari
    //    do NOT reliably show a gallery option when input.click() is called
    //    programmatically, regardless of the `capture` attribute.
    //    Solution: show our own bottom sheet so the user explicitly chooses
    //    Camera or Gallery. Each button creates its own file input and
    //    calls .click() in THAT button's click handler — preserving the
    //    user-gesture context the browser requires.
    //
    //    TWO functions need overriding:
    //      - window.capturePhoto()        → assessment item photos (photo-manager.js)
    //      - window.selectProfilePicture() → property profile pic  (app.js)
    //    Both had the same bugs: display:none + immediate DOM removal on mobile.
    // ----------------------------------------------------------------

    // Shared helper: creates a file input and clicks it inside a user gesture.
    // withCapture=true → forces straight to camera.
    // withCapture=false → forces gallery (no capture attr).
    function _webTriggerInput(withCapture, onFile) {
        var input = document.createElement('input');
        input.type   = 'file';
        input.accept = 'image/*';
        if (withCapture) input.setAttribute('capture', 'camera');
        // 1×1 fixed in viewport — display:none or off-screen breaks the picker
        // on iOS Safari and some Android Chrome builds.
        input.style.cssText =
            'position:fixed;top:0;left:0;width:1px;height:1px;' +
            'opacity:0;overflow:hidden;pointer-events:none;';

        // Remember fullscreen state BEFORE opening picker.
        // Browsers always exit fullscreen when the camera / file picker opens.
        var _wasFullscreen = isInFullscreen();

        input.onchange = function (e) {
            if (input.parentNode) input.parentNode.removeChild(input);
            var file = e.target.files && e.target.files[0];
            if (file) {
                // Re-enter fullscreen automatically (onchange IS a user gesture)
                if (_wasFullscreen && supportsFullscreen()) {
                    enterFullscreen();
                }
                onFile(file);
            }
        };
        document.body.appendChild(input);
        input.click();
        setTimeout(function () {
            if (input.parentNode) input.parentNode.removeChild(input);
        }, 600000);
    }

    // Shared bottom-sheet builder. title = heading; onFile(file, isCamera) = callback.
    function _showPickerSheet(title, onFile) {
        var old = document.getElementById('hbgPhotoPicker');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.id        = 'hbgPhotoPicker';
        overlay.className = 'hbg-photo-picker-overlay';
        overlay.innerHTML =
            '<div class="hbg-photo-picker-sheet">' +
                '<p class="hbg-pp-title">' + title + '</p>' +
                '<button class="hbg-pp-btn" id="hbgPpCamera">' +
                    '<span class="hbg-pp-icon"><i class="fas fa-camera"></i></span>' +
                    'Take a Photo' +
                '</button>' +
                '<button class="hbg-pp-btn" id="hbgPpGallery">' +
                    '<span class="hbg-pp-icon"><i class="fas fa-images"></i></span>' +
                    'Choose from Gallery' +
                '</button>' +
                '<button class="hbg-pp-btn hbg-pp-cancel" id="hbgPpCancel">Cancel</button>' +
            '</div>';
        document.body.appendChild(overlay);

        function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
        document.getElementById('hbgPpCancel').addEventListener('click', close);

        document.getElementById('hbgPpCamera').addEventListener('click', function () {
            close();
            _webTriggerInput(true, function (file) { onFile(file, true); });
        });
        document.getElementById('hbgPpGallery').addEventListener('click', function () {
            close();
            _webTriggerInput(false, function (file) { onFile(file, false); });
        });
    }

    function applyPhotoPatch() {
        var pm = window.photoManager;
        if (!pm || typeof pm.processPhoto !== 'function') return;

        // ── 1. Assessment item photos ─────────────────────────────────
        function showAssessmentPicker(roomId, itemText) {
            _showPickerSheet('Add Photo', function (file) {
                pm.currentCapture = { roomId: roomId, itemText: itemText };
                pm.processPhoto(file, roomId, itemText).then(function () {
                    pm.currentCapture = null;
                }).catch(function (err) {
                    console.error('web-app: photo process error', err);
                    pm.currentCapture = null;
                });
            });
        }

        window.capturePhoto = function (roomId, itemText) { showAssessmentPicker(roomId, itemText); };
        pm.capturePhoto     = function (roomId, itemText) { showAssessmentPicker(roomId, itemText); };

        // ── 2. Property profile picture ───────────────────────────────
        //    Exposed as window._hbgPickerSheet so app.js can call it
        //    directly from selectProfilePicture() — more reliable than
        //    overriding window.selectProfilePicture which app.js resets.
        window._hbgPickerSheet = _showPickerSheet;

        console.log('📷 web-app: photo + profile pic pickers active');
    }

    applyPhotoPatch();
    document.addEventListener('DOMContentLoaded', applyPhotoPatch);

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

    // When the app is installed via the browser prompt, permanently record it
    // so the install banner never appears again (even across sessions).
    window.addEventListener('appinstalled', function () {
        try { localStorage.setItem('hbgAppInstalled', '1'); } catch (e) {}
        dismissInstallBanner();
        console.log('🌐 web-app: app installed — install banner permanently dismissed');
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
        // Permanent: app has been installed at some point
        try { if (localStorage.getItem('hbgAppInstalled')) return true; } catch (e) {}
        // Temporary: user dismissed within the last 30 days
        try {
            var t = localStorage.getItem('hbgInstallDismissed');
            return t && (Date.now() - parseInt(t, 10)) < 30 * 24 * 60 * 60 * 1000; // 30 days
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
    // 5. FULLSCREEN PROMPT — "feel like a native app" on first visit
    //    Shows a small banner asking the user to go full screen.
    //    Shows a prompt on first visit each session. When the user exits
    //    fullscreen (e.g. presses Escape or swipes down), a small floating
    //    button appears so they can re-enter without reloading the page.
    // ----------------------------------------------------------------
    function supportsFullscreen() {
        var el = document.documentElement;
        return !!(el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen);
    }

    function isInFullscreen() {
        return !!(document.fullscreenElement ||
                  document.webkitFullscreenElement ||
                  document.mozFullScreenElement);
    }

    function enterFullscreen() {
        var el = document.documentElement;
        try {
            if (el.requestFullscreen)            el.requestFullscreen();
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            else if (el.mozRequestFullScreen)    el.mozRequestFullScreen();
        } catch (e) {}
        try { sessionStorage.setItem('hbgWasFullscreen', '1'); } catch (e) {}
    }

    // Small floating button — shown ALWAYS when not in fullscreen (not just after
    // entering fullscreen once). Positioned inside the top-right of the app frame.
    function showFullscreenRestoreBtn() {
        if (isStandalone() || !supportsFullscreen() || isInFullscreen()) return;
        if (document.getElementById('hbgFsRestoreBtn')) return;

        var btn = document.createElement('button');
        btn.id        = 'hbgFsRestoreBtn';
        btn.className = 'hbg-fs-restore-btn';
        btn.setAttribute('aria-label', 'Enter full screen');
        btn.innerHTML = '<i class="fas fa-expand"></i>';

        btn.addEventListener('click', function () {
            enterFullscreen();
            // onFullscreenChange removes the button once fullscreen activates
        });

        document.body.appendChild(btn);
    }

    function removeFullscreenRestoreBtn() {
        var btn = document.getElementById('hbgFsRestoreBtn');
        if (btn) btn.remove();
    }

    // Fullscreen entered → hide button. Fullscreen exited → always show button.
    function onFullscreenChange() {
        if (isInFullscreen()) {
            removeFullscreenRestoreBtn();
        } else {
            // Always show restore button when leaving fullscreen
            showFullscreenRestoreBtn();
        }
    }

    document.addEventListener('fullscreenchange',       onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange',    onFullscreenChange);

    // First-visit prompt — shown once per browser session
    function showFullscreenPrompt() {
        if (isStandalone()) return;
        if (!supportsFullscreen()) return;
        if (isInFullscreen()) return;
        if (document.getElementById('hbgFsPrompt')) return;
        // Once per session only (cleared when tab/browser closes)
        try { if (sessionStorage.getItem('hbgFsPromptSeen')) return; } catch (e) {}

        var prompt = document.createElement('div');
        prompt.id        = 'hbgFsPrompt';
        prompt.className = 'hbg-fs-prompt';
        prompt.innerHTML =
            '<div class="hbg-fp-icon"><i class="fas fa-expand"></i></div>' +
            '<div class="hbg-fp-text">' +
                '<strong>Full Screen Mode</strong>' +
                '<span>Hides browser bars for an app-like experience</span>' +
            '</div>' +
            '<button class="hbg-fp-yes">Go Full Screen</button>' +
            '<button class="hbg-fp-close" aria-label="Dismiss">&times;</button>';

        document.body.appendChild(prompt);
        try { sessionStorage.setItem('hbgFsPromptSeen', '1'); } catch (e) {}

        prompt.querySelector('.hbg-fp-yes').addEventListener('click', function () {
            enterFullscreen();
            prompt.remove();
        });

        // Dismiss just hides the prompt — restore button still shows on exit
        prompt.querySelector('.hbg-fp-close').addEventListener('click', function () {
            prompt.remove();
        });

        // Auto-dismiss after 12 s if ignored
        setTimeout(function () { if (prompt.parentNode) prompt.remove(); }, 12000);
    }

    // ----------------------------------------------------------------
    // 6. WEB SPEECH API — voice notes in the browser
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
    // 7. PREMIUM GATE — reuses the existing Android-style #premiumModal
    //    from premium-system.js. We override processPurchase() to inject
    //    sign-in + PayPal directly into the existing modal sheet instead
    //    of opening Google Play.
    // ----------------------------------------------------------------

    // Map premium-system plan names → PayPal plan IDs
    var PLAN_ID_MAP = {
        'monthly':    '1month',
        'threemonth': '3month',
        'sixmonth':   '6month',
        'annual':     '1year'
    };

    // Inject sign-in form into the existing modal sheet
    function injectSignInIntoModal() {
        removeModalInjections();
        var sheet = document.querySelector('.pm-sheet');
        if (!sheet) return;
        var html = '<div id="pmWebSignIn" class="pm-web-section">' +
            '<p class="pm-web-title">Sign in to subscribe</p>' +
            '<button class="pgs-google-btn" onclick="hbgGoogleSignIn()">' +
            '<svg class="pgs-google-icon" viewBox="0 0 24 24">' +
            '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>' +
            '<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>' +
            '<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>' +
            '<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>' +
            '</svg>Continue with Google</button>' +
            '<div class="pgs-divider"><span>or use email</span></div>' +
            '<input type="email" id="pmWebEmail" class="pgs-email-input" placeholder="your@email.com" autocomplete="email">' +
            '<button class="pgs-btn-primary" onclick="pmSendMagicLink()">' +
            '<i class="fas fa-envelope"></i> Send Sign-in Link</button>' +
            '</div>';
        sheet.insertAdjacentHTML('beforeend', html);
        sheet.scrollTo({ top: sheet.scrollHeight, behavior: 'smooth' });
    }

    // Inject PayPal button into the existing modal sheet
    function injectPayPalIntoModal(planId) {
        removeModalInjections();
        var sheet = document.querySelector('.pm-sheet');
        if (!sheet) return;
        var user = window.hbgAuth && window.hbgAuth.getCurrentUser
            ? window.hbgAuth.getCurrentUser() : null;
        var email = user ? (user.email || '') : '';
        var html = '<div id="pmWebPayPal" class="pm-web-section">' +
            '<div class="pm-web-signed"><span>Signed in as <strong>' + email + '</strong></span>' +
            '<button onclick="hbgSignOut()" class="pgs-sign-out-link">Sign out</button></div>' +
            '<div id="paypal-button-container"></div>' +
            '<p id="pgsBillingInfo" class="pgs-billing-info" style="display:none"></p>' +
            '</div>';
        sheet.insertAdjacentHTML('beforeend', html);
        sheet.scrollTo({ top: sheet.scrollHeight, behavior: 'smooth' });
        if (window.hbgPayPal) window.hbgPayPal.renderButtons(planId);
    }

    function removeModalInjections() {
        ['pmWebSignIn', 'pmWebPayPal'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.remove();
        });
        // Restore plan row opacity
        document.querySelectorAll('.pm-plan-row').forEach(function (r) {
            r.style.opacity = '1';
        });
    }

    // Send magic link from the injected sign-in form
    window.pmSendMagicLink = function () {
        var input = document.getElementById('pmWebEmail');
        if (!input) return;
        var email = input.value.trim();
        if (!email || !email.includes('@')) { alert('Please enter a valid email address.'); return; }
        if (!window.hbgAuth) return;
        window.hbgAuth.sendSignInLink(email)
            .then(function () {
                var signIn = document.getElementById('pmWebSignIn');
                if (signIn) signIn.innerHTML =
                    '<div class="pgs-sent-icon"><i class="fas fa-envelope-open-text"></i></div>' +
                    '<p class="pm-web-title">Check your inbox</p>' +
                    '<p class="pgs-sent-msg">We sent a sign-in link to <strong>' + email + '</strong></p>' +
                    '<p class="pgs-sent-hint">Check spam if you don't see it.</p>';
            })
            .catch(function () { alert('Could not send link. Please try again.'); });
    };

    // Google Sign-In
    window.hbgGoogleSignIn = function () {
        if (!window.hbgAuth || !window.hbgAuth.signInWithGoogle) {
            alert('Google Sign-In is loading. Please try again in a moment.');
            return;
        }
        window.hbgAuth.signInWithGoogle().catch(function (err) {
            console.error('Google sign-in error:', err);
            alert('Google Sign-In failed. Please try the email option instead.');
        });
    };

    // Sign out
    window.hbgSignOut = function () {
        if (window.hbgAuth) {
            window.hbgAuth.signOut().then(function () {
                removeModalInjections();
                injectSignInIntoModal();
            });
        }
    };

    // Install app
    window.hbgInstallApp = function () {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt.userChoice.then(function () { deferredInstallPrompt = null; });
            return;
        }
        if (isStandalone()) { alert('The app is already installed on your device!'); return; }
        var ua = navigator.userAgent;
        var msg;
        if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
            msg = 'To install on iOS:\n1. Tap the Share button at the bottom\n2. Tap "Add to Home Screen"\n3. Tap "Add"';
        } else if (/Android/.test(ua)) {
            msg = 'To install on Android:\n1. Tap the 3-dot menu (⋮) in your browser\n2. Tap "Add to Home Screen"\n3. Tap "Add"';
        } else {
            msg = 'To install:\n1. Look for the install icon in your browser address bar\n2. Click "Install"';
        }
        alert(msg);
    };

    // ----------------------------------------------------------------
    // Update Settings subscription section
    // ----------------------------------------------------------------
    function updateSubscriptionUI(user, premiumData) {
        var planLabel   = document.getElementById('subscriptionPlanLabel');
        var expiryLabel = document.getElementById('subscriptionExpiryLabel');
        var badge       = document.getElementById('subscriptionBadge');
        var upgradeRow  = document.getElementById('subscriptionUpgradeRow');
        var refundRow   = document.getElementById('subscriptionRefundRow');
        var iconEl      = document.querySelector('#subscriptionStatusRow .stg-row-icon i');
        if (!planLabel) return;

        var PLAN_NAMES = {
            '1month': '1 Month Plan', '3month': '3 Month Plan',
            '6month': '6 Month Plan', '1year': '1 Year Plan',
            'monthly': '1 Month Plan', 'threemonth': '3 Month Plan',
            'sixmonth': '6 Month Plan', 'annual': '1 Year Plan',
            'web-paypal': 'Premium Plan', 'free': 'Free Plan'
        };

        if (user && premiumData && premiumData.isPremium) {
            planLabel.textContent = PLAN_NAMES[premiumData.plan] || 'Premium Plan';
            if (premiumData.nextBillingDate || premiumData.expiryDate) {
                var d = premiumData.nextBillingDate || premiumData.expiryDate;
                var date = d.toDate ? d.toDate() : new Date(d);
                expiryLabel.textContent = 'Next billing: '
                    + date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
            } else {
                expiryLabel.textContent = 'Premium access active';
            }
            if (iconEl) { iconEl.className = 'fas fa-crown'; iconEl.style.color = '#F9C74F'; }
            if (badge)      badge.style.display = '';
            if (upgradeRow) upgradeRow.style.display = 'none';
            if (refundRow)  refundRow.style.display = '';
        } else {
            planLabel.textContent   = 'Free Plan';
            expiryLabel.textContent = 'Up to 2 properties · basic assessment';
            if (iconEl) { iconEl.className = 'fas fa-lock'; iconEl.style.color = '#8bbad4'; }
            if (badge)      badge.style.display = 'none';
            if (upgradeRow) upgradeRow.style.display = '';
            if (refundRow)  refundRow.style.display = 'none';
        }
    }

    // Auth state changed — called by firebase-auth.js
    window.onHbgAuthStateChanged = function (user, premiumData) {
        updateSubscriptionUI(user, premiumData);

        var modal = document.getElementById('premiumModal');
        var isOpen = modal && modal.classList.contains('show');

        if (user && premiumData && premiumData.isPremium) {
            // Premium confirmed — close modal and show welcome
            if (isOpen && typeof window.hidePremiumModal === 'function') {
                window.hidePremiumModal();
                if (typeof window.showPremiumWelcome === 'function') window.showPremiumWelcome();
            }
            // Clear any pending plan
            window._pendingPlanId = null;
            try { sessionStorage.removeItem('hbgPendingPlan'); } catch(e) {}

        } else if (user && !premiumData.isPremium) {
            // Signed in but not premium — check for pending plan
            var pending = window._pendingPlanId;
            if (!pending) { try { pending = sessionStorage.getItem('hbgPendingPlan'); } catch(e) {} }
            if (pending) {
                window._pendingPlanId = null;
                try { sessionStorage.removeItem('hbgPendingPlan'); } catch(e) {}
                // Re-open modal if closed, then show PayPal
                if (!isOpen && typeof window.showPremiumModal === 'function') {
                    window.showPremiumModal('property_limit');
                    setTimeout(function() { injectPayPalIntoModal(pending); }, 300);
                } else {
                    injectPayPalIntoModal(pending);
                }
            }
        }
    };

    // ----------------------------------------------------------------
    // 8. BOOT (after DOM + premium system are ready)
    // ----------------------------------------------------------------
    function boot() {
        document.body.classList.add('web-mode');

        // Set web prices in the existing pricingConfig from premium-system.js
        // This makes getDisplayPrice() and calculateSavings() use web pricing
        if (window.pricingConfig) {
            window.pricingConfig.fallback.monthly    = { price: 100, formatted: 'R100' };
            window.pricingConfig.fallback.threemonth = { price: 250, formatted: 'R250' };
            window.pricingConfig.fallback.sixmonth   = { price: 450, formatted: 'R450' };
            window.pricingConfig.fallback.annual     = { price: 850, formatted: 'R850' };
        }

        // Override processPurchase — intercepts Subscribe button clicks for web payment
        // Instead of launching Google Play, we inject sign-in + PayPal into the existing modal
        window.processPurchase = function (plan) {
            var planId = PLAN_ID_MAP[plan];
            if (!planId) return;

            // Visual feedback — dim other rows
            document.querySelectorAll('.pm-plan-row').forEach(function(r) { r.style.opacity = '0.6'; });
            if (window.event && window.event.currentTarget) {
                window.event.currentTarget.style.opacity = '1';
            }

            window._pendingPlanId = planId;
            try { sessionStorage.setItem('hbgPendingPlan', planId); } catch(e) {}

            var user = window.hbgAuth && window.hbgAuth.getCurrentUser
                ? window.hbgAuth.getCurrentUser() : null;

            if (!user) {
                injectSignInIntoModal();
            } else {
                injectPayPalIntoModal(planId);
            }
        };

        // Wrap the original showPremiumModal to:
        // - update trial ribbon text (3-day not 7-day)
        // - hide the Google Play voucher row
        // - update the legal text for web
        // - clean up any previous injections
        var _origShow = window.showPremiumModal;
        window.showPremiumModal = function (reason) {
            if (typeof _origShow === 'function') _origShow(reason);
            setTimeout(function () {
                var ribbon = document.getElementById('monthlyTrialRibbon');
                if (ribbon) ribbon.textContent = '3-DAY FREE TRIAL';
                var subPeriod = document.getElementById('monthlySubPeriod');
                if (subPeriod) subPeriod.textContent = 'for 3 days';
                var trialThen = document.getElementById('monthlyTrialPeriod');
                if (trialThen) trialThen.innerHTML = 'then <span id="monthlyPrice">'
                    + (window.pricingConfig ? window.pricingConfig.fallback.monthly.formatted : 'R100')
                    + '</span>/mo';
                var voucher = document.querySelector('.pm-voucher-row');
                if (voucher) voucher.style.display = 'none';
                var legal = document.querySelector('.pm-legal');
                if (legal) legal.textContent = 'Subscriptions renew automatically via PayPal. Cancel anytime from Settings.';
                removeModalInjections();
            }, 0);
        };

        // Show fullscreen restore button if not in fullscreen (always visible)
        setTimeout(showFullscreenRestoreBtn, 2000);
        // Fullscreen prompt for first-time visitors, install banner after
        setTimeout(showFullscreenPrompt, 3000);
        setTimeout(showInstallBanner, 8000);

        console.log('🌐 web-app: web mode active — using existing premium modal');
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
