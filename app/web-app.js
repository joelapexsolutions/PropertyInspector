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
    // 7. PREMIUM GATE — custom screen matching Android modal design
    // ----------------------------------------------------------------

    window.showPremiumGate = function (featureMsg) {
        var screen = document.getElementById('premiumGateScreen');
        if (!screen) return;
        var msgEl = document.getElementById('pgsFeatureMsg');
        if (msgEl && featureMsg) msgEl.textContent = featureMsg;
        var els = ['pgsSignInSection','pgsEmailSentSection','pgsPayPalContainer','pgsPremiumSection'];
        els.forEach(function(id){ var e=document.getElementById(id); if(e) e.style.display='none'; });
        document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
        screen.classList.add('active');
    };

    window.hidePremiumGate = function () {
        var screen = document.getElementById('premiumGateScreen');
        if (screen) screen.classList.remove('active');
        if (typeof window.showScreen === 'function') window.showScreen('homeScreen');
    };

    window.handleSubscribeClick = function (planId, rowEl) {
        // Highlight the selected plan row (rowEl = this from onclick)
        document.querySelectorAll('.pgs-plan-row').forEach(function(r) {
            r.classList.remove('pgs-selected');
        });
        if (rowEl) rowEl.classList.add('pgs-selected');

        window._pendingPlanId = planId;
        var user = window.hbgAuth && window.hbgAuth.getCurrentUser ? window.hbgAuth.getCurrentUser() : null;
        if (!user) {
            _pgShow('pgsSignInSection');
        } else {
            var emailEl = document.getElementById('pgsUserEmail');
            if (emailEl) emailEl.textContent = user.email || '';
            _pgShow('pgsPayPalContainer');
            if (window.hbgPayPal) window.hbgPayPal.renderButtons(planId);
        }
    };

    window.pgsShowSignIn = function () {
        _pgHide('pgsEmailSentSection');
        _pgShow('pgsSignInSection');
    };

    function pgsShowPlansForUser(user) {
        var emailEl = document.getElementById('pgsUserEmail');
        if (emailEl) emailEl.textContent = user.email || '';
        if (window._pendingPlanId) {
            var planId = window._pendingPlanId;
            window._pendingPlanId = null;
            _pgHide('pgsSignInSection');
            _pgHide('pgsEmailSentSection');
            _pgShow('pgsPayPalContainer');
            if (window.hbgPayPal) window.hbgPayPal.renderButtons(planId);
        }
    }

    function _pgShow(id) { var el=document.getElementById(id); if(el) el.style.display=''; }
    function _pgHide(id) { var el=document.getElementById(id); if(el) el.style.display='none'; }

    window.hbgSendMagicLink = function () {
        var input = document.getElementById('pgsEmailInput');
        if (!input) return;
        var email = input.value.trim();
        if (!email || !email.includes('@')) { alert('Please enter a valid email address.'); return; }
        if (!window.hbgAuth) return;
        window.hbgAuth.sendSignInLink(email)
            .then(function () {
                var sentEmail = document.getElementById('pgsSentEmail');
                if (sentEmail) sentEmail.textContent = email;
                _pgShow('pgsEmailSentSection');
                _pgHide('pgsSignInSection');
            })
            .catch(function () { alert('Could not send the link. Please try again.'); });
    };

    window.hbgGoogleSignIn = function () {
        if (!window.hbgAuth || !window.hbgAuth.signInWithGoogle) {
            alert('Google Sign-In is loading. Please try again in a moment.');
            return;
        }
        window.hbgAuth.signInWithGoogle().catch(function () {
            alert('Google Sign-In failed. Please try the email option instead.');
        });
    };

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
            msg = 'To install on Android:\n1. Tap the browser menu (3 dots)\n2. Tap "Add to Home Screen"\n3. Tap "Add"';
        } else {
            msg = 'To install:\n1. Look for the install icon in your browser address bar\n2. Click "Install"';
        }
        alert(msg);
    };

    window.hbgSignOut = function () {
        if (window.hbgAuth) {
            window.hbgAuth.signOut().then(function () {
                _pgHide('pgsPayPalContainer');
                _pgHide('pgsEmailSentSection');
                _pgShow('pgsSignInSection');
            });
        }
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
            '1month':'1 Month Plan','3month':'3 Month Plan',
            '6month':'6 Month Plan','1year':'1 Year Plan',
            'web-paypal':'Premium Plan','free':'Free Plan'
        };
        if (user && premiumData && premiumData.isPremium) {
            planLabel.textContent = PLAN_NAMES[premiumData.plan] || 'Premium Plan';
            var d = premiumData.nextBillingDate || premiumData.expiryDate;
            if (d) {
                var date = d.toDate ? d.toDate() : new Date(d);
                expiryLabel.textContent = 'Next billing: '
                    + date.toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'});
            } else {
                expiryLabel.textContent = 'Premium access active';
            }
            if (iconEl) { iconEl.className='fas fa-crown'; iconEl.style.color='#F9C74F'; }
            if (badge) badge.style.display='';
            if (upgradeRow) upgradeRow.style.display='none';
            if (refundRow) refundRow.style.display='';
        } else {
            planLabel.textContent   = 'Free Plan';
            expiryLabel.textContent = 'Up to 2 properties';
            if (iconEl) { iconEl.className='fas fa-lock'; iconEl.style.color='#8bbad4'; }
            if (badge) badge.style.display='none';
            if (upgradeRow) upgradeRow.style.display='';
            if (refundRow) refundRow.style.display='none';
        }
    }

    // Auth state changed callback (called by firebase-auth.js)
    window.onHbgAuthStateChanged = function (user, premiumData) {
        updateSubscriptionUI(user, premiumData);
        var screen = document.getElementById('premiumGateScreen');
        var isVisible = screen && screen.classList.contains('active');
        if (user && premiumData && premiumData.isPremium) {
            if (isVisible) {
                window.hidePremiumGate();
                if (typeof window.showPremiumWelcome === 'function') window.showPremiumWelcome();
            }
        } else if (user && !(premiumData && premiumData.isPremium)) {
            if (isVisible) pgsShowPlansForUser(user);
        }
        // Note: sign-in section is NOT shown automatically.
        // It only appears when the user clicks Subscribe on a plan.
        // This prevents the sign-in form from showing before the user
        // has expressed intent to subscribe.
    };

    // ----------------------------------------------------------------
    // 8. BOOT (after DOM + premium system are ready)
    // ----------------------------------------------------------------
    function boot() {
        document.body.classList.add('web-mode');

        // Redirect showPremiumModal to our custom gate screen
        window.showPremiumModal = function (reason) {
            var msgs = {
                property_limit:  "You've reached the 2-property free limit. Upgrade for unlimited access.",
                full_report:     "Full PDF Reports are a Premium feature.",
                locked_property: "This property is locked. Upgrade for unlimited access."
            };
            if (typeof window.showPremiumGate === 'function') {
                window.showPremiumGate(msgs[reason] || "Upgrade to Premium");
            }
        };

        setTimeout(showFullscreenRestoreBtn, 2000);
        setTimeout(showFullscreenPrompt, 3000);
        setTimeout(showInstallBanner, 8000);

        console.log('web-app: ready');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 300); });
    } else {
        setTimeout(boot, 300);
    }
})();
