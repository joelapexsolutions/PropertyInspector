// ====================================================================
// FIREBASE-AUTH.JS — Authentication + Firestore premium check
// Home Buyers Guide SA PWA
// Uses Firebase Compat SDK loaded via CDN in index.html.
// Never affects the Android APK — web-app.js guards everything with
// "if (window.Android) return;" so this only runs in a browser.
// ====================================================================
(function () {
    'use strict';

    var FIREBASE_CONFIG = {
        apiKey:            'AIzaSyAN3bx5HybX8UF78WSwkHpUhTDIIPxI1cQ',
        authDomain:        'property-inspector-analytics.firebaseapp.com',
        projectId:         'property-inspector-analytics',
        storageBucket:     'property-inspector-analytics.firebasestorage.app',
        messagingSenderId: '996006026790',
        appId:             '1:996006026790:web:3b4fb15a49693ead8490e7',
        measurementId:     'G-DBCMBQE5NL'
    };

    // Initialise Firebase (compat SDK — no npm / build tools needed)
    var app  = firebase.initializeApp(FIREBASE_CONFIG);
    var auth = firebase.auth();
    var db   = firebase.firestore();

    // The URL Firebase sends in the magic link email.
    // Must be listed in Firebase Console → Authentication → Settings →
    // Authorized domains (propertyinspector.site is already added).
    var ACTION_CODE_SETTINGS = {
        url:              'https://propertyinspector.site/app/',
        handleCodeInApp:  true
    };

    // ----------------------------------------------------------------
    // Send a magic sign-in link to the given email
    // ----------------------------------------------------------------
    function sendSignInLink(email) {
        return auth.sendSignInLinkToEmail(email, ACTION_CODE_SETTINGS)
            .then(function () {
                localStorage.setItem('hbgEmailForSignIn', email);
            });
    }

    // ----------------------------------------------------------------
    // Complete sign-in when the user lands back via the magic link
    // ----------------------------------------------------------------
    function completeSignInFromLink() {
        if (!auth.isSignInWithEmailLink(window.location.href)) {
            return Promise.resolve(false);
        }
        var email = localStorage.getItem('hbgEmailForSignIn');
        if (!email) {
            email = window.prompt('Please confirm your email address to sign in:');
        }
        if (!email) return Promise.resolve(false);

        return auth.signInWithEmailLink(email, window.location.href)
            .then(function () {
                localStorage.removeItem('hbgEmailForSignIn');
                // Remove the magic-link query params from the address bar
                if (window.history && window.history.replaceState) {
                    window.history.replaceState({}, document.title,
                        window.location.pathname);
                }
                return true;
            })
            .catch(function (err) {
                console.error('hbg-auth: magic link sign-in failed', err);
                return false;
            });
    }

    // ----------------------------------------------------------------
    // Check Firestore for this user's premium status
    // ----------------------------------------------------------------
    function checkFirestorePremium(uid) {
        return db.collection('users').doc(uid).get()
            .then(function (doc) {
                if (!doc.exists) return { isPremium: false };
                var data = doc.data();
                if (!data.isPremium) return { isPremium: false };
                // Check if the subscription has expired
                if (data.expiryDate) {
                    var expiry = data.expiryDate.toDate
                        ? data.expiryDate.toDate()
                        : new Date(data.expiryDate);
                    if (expiry < new Date()) {
                        return { isPremium: false, expired: true };
                    }
                }
                return {
                    isPremium:  true,
                    plan:       data.plan       || '',
                    expiryDate: data.expiryDate || null
                };
            })
            .catch(function (e) {
                console.error('hbg-auth: Firestore check failed', e);
                return { isPremium: false };
            });
    }

    // ----------------------------------------------------------------
    // Apply premium state to localStorage so premium-system.js picks it up
    // ----------------------------------------------------------------
    function applyPremiumState(premiumData) {
        try {
            var raw   = localStorage.getItem('propertyInspectorPremium');
            var state = raw ? JSON.parse(raw) : {};

            if (premiumData.isPremium) {
                var expiry = null;
                if (premiumData.expiryDate) {
                    expiry = premiumData.expiryDate.toDate
                        ? premiumData.expiryDate.toDate().toISOString()
                        : new Date(premiumData.expiryDate).toISOString();
                }
                state.isPremium          = true;
                state.subscriptionType   = premiumData.plan || 'web-paypal';
                state.subscriptionEndDate = expiry || '2099-12-31T23:59:59.000Z';
            } else {
                state.isPremium          = false;
                state.subscriptionType   = 'free';
                state.subscriptionEndDate = null;
            }

            localStorage.setItem('propertyInspectorPremium', JSON.stringify(state));

            // Update the live state object if premium-system.js already ran
            if (window.premiumState) {
                window.premiumState.isPremium          = state.isPremium;
                window.premiumState.subscriptionType   = state.subscriptionType;
                window.premiumState.subscriptionEndDate = state.subscriptionEndDate;
            }
            if (typeof window.updateUIForPremiumStatus === 'function') {
                window.updateUIForPremiumStatus();
            }
        } catch (e) {
            console.error('hbg-auth: applyPremiumState failed', e);
        }
    }

    // ----------------------------------------------------------------
    // Auth state listener — fires on every page load and on sign-in/out
    // ----------------------------------------------------------------
    auth.onAuthStateChanged(function (user) {
        if (user) {
            checkFirestorePremium(user.uid).then(function (premiumData) {
                applyPremiumState(premiumData);
                if (typeof window.onHbgAuthStateChanged === 'function') {
                    window.onHbgAuthStateChanged(user, premiumData);
                }
            });
        } else {
            applyPremiumState({ isPremium: false });
            if (typeof window.onHbgAuthStateChanged === 'function') {
                window.onHbgAuthStateChanged(null, { isPremium: false });
            }
        }
    });

    // ----------------------------------------------------------------
    // Auto-complete sign-in if this page load is a magic link redirect
    // Also handle Google redirect result
    // ----------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', function () {
        // Handle Google redirect sign-in result
        auth.getRedirectResult().then(function (result) {
            if (result && result.user) {
                console.log('hbg-auth: Google redirect sign-in complete');
            }
        }).catch(function (err) {
            if (err.code && err.code !== 'auth/no-current-user') {
                console.error('hbg-auth: redirect result error', err.message);
            }
        });

        // Handle email magic link
        completeSignInFromLink();
    });

    // ----------------------------------------------------------------
    // Google Sign-In
    // ----------------------------------------------------------------
    function signInWithGoogle() {
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        // Redirect works reliably on all mobile browsers including Safari iOS
        return auth.signInWithRedirect(provider);
    }

    // ----------------------------------------------------------------
    // Public API — used by web-app.js UI functions
    // ----------------------------------------------------------------
    window.hbgAuth = {
        sendSignInLink:         sendSignInLink,
        completeSignInFromLink: completeSignInFromLink,
        checkFirestorePremium:  checkFirestorePremium,
        signInWithGoogle:       signInWithGoogle,
        signOut:        function () { return auth.signOut(); },
        getCurrentUser: function () { return auth.currentUser; },
        onAuthStateChanged: function (cb) { return auth.onAuthStateChanged(cb); }
    };

    console.log('🔐 hbg-auth: Firebase Auth + Firestore initialised');
})();
