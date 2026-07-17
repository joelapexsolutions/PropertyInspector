/**
 * Home Buyers Guide SA — Premium Subscription System
 * Google Play Billing · AdMob · Free/Premium tier management
 */

// ====================================================================
// TESTING MODE
// Change the value below when testing. Revert to false before uploading.
//
//   false      → Production — normal Google Play behaviour
//   'free'     → Forces FREE / non-premium tier
//                (tests ads, property limit, upgrade strip, premium modal)
//   'premium'  → Forces PREMIUM tier
//                (tests premium features, no ads, no strip)
//
// UPLOAD CHECKLIST: set TESTING_MODE = false  ← that's the only change needed
// ====================================================================
const TESTING_MODE = false;

// ====================================================================
// STATE
// ====================================================================
const premiumState = {
    isPremium: false,
    subscriptionType: null,
    subscriptionEndDate: null,
    propertyCount: 0,
    maxFreeProperties: 2,
    hasUsedTrial: false,
    hasUsedMonthlyTrial: false,
    pendingSubscriptionChange: null,
    // Per-property timestamp of the last "view full report" interstitial.
    // Keyed by propertyId -> ms timestamp. Lets the same property be viewed
    // again within 30 minutes without re-showing the ad, while a DIFFERENT
    // property (or the same one after 30 minutes) still triggers one.
    reportAdTimestamps: {}
};

const REPORT_AD_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes, per property

// ====================================================================
// PRICING CONFIG
// ====================================================================
const pricingConfig = {
    // Shown immediately and as offline fallback (VAT-inclusive display prices)
    fallback: {
        monthly:    { price: 80,  formatted: 'R80'  },
        threemonth: { price: 200, formatted: 'R200' },
        sixmonth:   { price: 380, formatted: 'R380' },
        annual:     { price: 700, formatted: 'R700' }
    },
    // Populated by Google Play — overrides fallback when available
    googlePlay: {
        monthly:    { formattedPrice: null },
        threemonth: { formattedPrice: null },
        sixmonth:   { formattedPrice: null },
        annual:     { formattedPrice: null }
    },
    googlePlaySkus: {
        monthly:    'property_inspector_monthly',
        threemonth: 'property_inspector_threemonth',
        sixmonth:   'property_inspector_sixmonth',
        annual:     'property_inspector_annual'
    }
};

// Called from Kotlin when Google Play prices are ready
function updateGooglePlayPrices(prices) {
    if (prices.monthly)     pricingConfig.googlePlay.monthly.formattedPrice    = prices.monthly;
    if (prices.threemonth)  pricingConfig.googlePlay.threemonth.formattedPrice = prices.threemonth;
    if (prices.sixmonth)    pricingConfig.googlePlay.sixmonth.formattedPrice   = prices.sixmonth;
    if (prices.annual)      pricingConfig.googlePlay.annual.formattedPrice     = prices.annual;

    // If Google Play reports NO trial offer for this account (ineligible or already used),
    // immediately mark trial as used and switch the modal to regular monthly UI.
    if (prices.monthlyTrialAvailable === 'false') {
        premiumState.hasUsedMonthlyTrial = true;
        savePremiumState();
    }

    // Live-update modal if open
    const modal = document.getElementById('premiumModal');
    if (modal && !modal.classList.contains('hidden')) {
        refreshModalPrices();  // this already calls refreshMonthlyTrialUI() at the end
    }
    console.log('Google Play prices received:', pricingConfig.googlePlay,
                '| Monthly trial available:', prices.monthlyTrialAvailable);
}
window.updateGooglePlayPrices = updateGooglePlayPrices;

// ====================================================================
// PRICE HELPERS
// ====================================================================
function getDisplayPrice(plan) {
    const gp = pricingConfig.googlePlay[plan];
    return (gp && gp.formattedPrice) ? gp.formattedPrice : pricingConfig.fallback[plan].formatted;
}

function getNumericPrice(plan) {
    const gp = pricingConfig.googlePlay[plan];
    if (gp && gp.formattedPrice) {
        const n = parseFloat(gp.formattedPrice.replace(/[^0-9.,]/g, '').replace(',', '.'));
        if (!isNaN(n)) return n;
    }
    return pricingConfig.fallback[plan].price;
}

function extractCurrencyPrefix(formattedPrice) {
    if (!formattedPrice) return 'R';
    const m = formattedPrice.match(/^([^\d\s]+)\s*/);
    return m ? m[1] : 'R';
}

function calculateSavings() {
    const monthly     = getNumericPrice('monthly');
    const threemonth  = getNumericPrice('threemonth');
    const sixmonth    = getNumericPrice('sixmonth');
    const annual      = getNumericPrice('annual');

    const threePerMonth = threemonth / 3;
    const sixPerMonth   = sixmonth / 6;
    const annPerMonth   = annual / 12;

    const threeSavePct = Math.max(0, Math.round((1 - threePerMonth / monthly) * 100));
    const sixSavePct   = Math.max(0, Math.round((1 - sixPerMonth / monthly) * 100));
    const annSavePct   = Math.max(0, Math.round((1 - annPerMonth / monthly) * 100));

    const gpMonthly = pricingConfig.googlePlay.monthly;
    const curr = (gpMonthly && gpMonthly.formattedPrice)
        ? extractCurrencyPrefix(gpMonthly.formattedPrice)
        : 'R';

    return {
        threemonthSavings: threeSavePct > 0 ? `Save ${threeSavePct}%` : '',
        sixmonthSavings:   sixSavePct > 0 ? `Save ${sixSavePct}%` : '',
        annualSavings:     annSavePct > 0 ? `Save ${annSavePct}%` : '',
        threemonthEquiv:   `${curr}${Math.round(threePerMonth)}/mo`,
        sixmonthEquiv:     `${curr}${Math.round(sixPerMonth)}/mo`,
        annualEquiv:       `${curr}${Math.round(annPerMonth)}/mo`
    };
}

function refreshModalPrices() {
    const el = (id) => document.getElementById(id);
    if (el('monthlyPrice'))       el('monthlyPrice').textContent      = getDisplayPrice('monthly');
    if (el('threemonthPrice'))    el('threemonthPrice').textContent   = getDisplayPrice('threemonth');
    if (el('sixmonthPrice'))      el('sixmonthPrice').textContent     = getDisplayPrice('sixmonth');
    if (el('annualPrice'))        el('annualPrice').textContent       = getDisplayPrice('annual');

    const savings = calculateSavings();
    if (el('threemonthSavings'))  el('threemonthSavings').textContent = savings.threemonthSavings;
    if (el('sixmonthSavings'))    el('sixmonthSavings').textContent   = savings.sixmonthSavings;
    if (el('annualSavings'))      el('annualSavings').textContent     = savings.annualSavings;
    if (el('threemonthEquiv'))    el('threemonthEquiv').textContent   = savings.threemonthEquiv;
    if (el('sixmonthEquiv'))      el('sixmonthEquiv').textContent     = savings.sixmonthEquiv;
    if (el('annualEquiv'))        el('annualEquiv').textContent       = savings.annualEquiv;

    // Keep monthly row state in sync when prices update from Google Play
    refreshMonthlyTrialUI();
}
// Legacy alias
function updatePremiumModalPrices() { refreshModalPrices(); }

// ====================================================================
// MONTHLY TRIAL UI TOGGLE
// Switches the monthly plan row between trial and regular state
// based on premiumState.hasUsedMonthlyTrial.
// Called on every modal open and after Google Play prices arrive.
// ====================================================================
function refreshMonthlyTrialUI() {
    const row       = document.getElementById('monthlyPlanRow');
    if (!row) return;

    const ribbon    = document.getElementById('monthlyTrialRibbon');
    const trialPer  = document.getElementById('monthlyTrialPeriod');
    const regPer    = document.getElementById('monthlyRegularPeriod');
    const mainPrice = document.getElementById('monthlyMainPrice');
    const subPer    = document.getElementById('monthlySubPeriod');
    const btn       = document.getElementById('monthlyBtn');

    if (premiumState.hasUsedMonthlyTrial) {
        // ── Trial used: show regular monthly UI ──────────────────────
        if (ribbon)    ribbon.style.display    = 'none';
        if (trialPer)  trialPer.style.display  = 'none';
        if (regPer)    regPer.style.display     = '';
        if (subPer)    subPer.style.display     = 'none';
        if (mainPrice) {
            mainPrice.textContent = getDisplayPrice('monthly');
            mainPrice.className   = 'pm-plan-price';
        }
        if (btn) { btn.textContent = 'Subscribe'; btn.className = 'pm-btn'; }
        row.classList.remove('pm-plan-row-trial');
    } else {
        // ── Trial available: show free trial UI ──────────────────────
        if (ribbon)    ribbon.style.display    = '';
        if (trialPer)  trialPer.style.display  = '';
        if (regPer)    regPer.style.display     = 'none';
        if (subPer)    subPer.style.display     = '';
        if (mainPrice) {
            mainPrice.textContent = 'FREE';
            mainPrice.className   = 'pm-plan-price pm-plan-price-free';
        }
        if (btn) { btn.textContent = 'Try Free'; btn.className = 'pm-btn pm-btn-trial'; }
        row.classList.add('pm-plan-row-trial');
    }
}
window.refreshMonthlyTrialUI = refreshMonthlyTrialUI;

// ====================================================================
// ADMOB CONFIG — interstitial only, banner ad removed entirely
// ====================================================================
const adMobConfig = {
    interstitialAdUnitId:  'ca-app-pub-3261569477417964/9738801674'
};

const adMobState = {
    interstitialLoaded: false,
    adInitialized: false,
    lastInterstitialTime: 0
};

// ====================================================================
// PREMIUM MODAL
// ====================================================================
function createPremiumModal() {
    if (document.getElementById('premiumModal')) return;

    const savings = calculateSavings();

    const html = `
<div id="premiumModal" class="premium-modal hidden" role="dialog" aria-modal="true">
    <div class="pm-backdrop" onclick="hidePremiumModal()"></div>
    <div class="pm-sheet">
        <div class="pm-drag-handle"></div>

        <button class="pm-close" onclick="hidePremiumModal()" aria-label="Close">
            <i class="fas fa-times"></i>
        </button>

        <!-- Branding -->
        <div class="pm-brand">
            <div class="pm-crown-ring">
                <i class="fas fa-crown"></i>
            </div>
            <h2 class="pm-heading">Home Buyers Guide SA</h2>
            <p class="pm-subheading" id="pmSubtitle">Go Premium</p>
        </div>

        <!-- What you get — clean bullet list -->
        <ul class="pm-benefits">
            <li><i class="fas fa-check-circle"></i><span><strong>Unlimited Properties</strong> — assess every home with no cap</span></li>
            <li><i class="fas fa-check-circle"></i><span><strong>No Advertisements</strong> — clean, focused experience</span></li>
            <li><i class="fas fa-check-circle"></i><span><strong>Full PDF Reports</strong> — photo-backed, shareable documentation</span></li>
            <li><i class="fas fa-check-circle"></i><span><strong>Full Assessment Results</strong> — detailed assessment results</span></li>
        </ul>

        <!-- Pricing plans — vertical rows -->
        <div class="pm-plans">

            <!-- Monthly — 7-day free trial (IDs allow JS to toggle trial/regular state) -->
            <div class="pm-plan-row pm-plan-row-trial" id="monthlyPlanRow" onclick="processPurchase('monthly')">
                <div class="pm-trial-ribbon" id="monthlyTrialRibbon">7-DAY FREE TRIAL</div>
                <div class="pm-plan-info">
                    <div class="pm-plan-label">Monthly</div>
                    <div class="pm-plan-period pm-trial-then" id="monthlyTrialPeriod">then <span id="monthlyPrice">${getDisplayPrice('monthly')}</span>/mo</div>
                    <div class="pm-plan-period" id="monthlyRegularPeriod" style="display:none">per month</div>
                </div>
                <div class="pm-plan-pricing">
                    <div class="pm-plan-price pm-plan-price-free" id="monthlyMainPrice">FREE</div>
                    <div class="pm-plan-period" id="monthlySubPeriod">for 7 days</div>
                </div>
                <button class="pm-btn pm-btn-trial" id="monthlyBtn" tabindex="-1">Try Free</button>
            </div>

            <!-- 3 Months -->
            <div class="pm-plan-row" onclick="processPurchase('threemonth')">
                <div class="pm-plan-info">
                    <div class="pm-plan-label">3 Months</div>
                    <div class="pm-plan-period" id="threemonthEquiv">${savings.threemonthEquiv}</div>
                </div>
                <div class="pm-plan-pricing">
                    <div class="pm-plan-price" id="threemonthPrice">${getDisplayPrice('threemonth')}</div>
                    <div class="pm-plan-save" id="threemonthSavings">${savings.threemonthSavings}</div>
                </div>
                <button class="pm-btn" tabindex="-1">Subscribe</button>
            </div>

            <!-- 6 Months — Most Popular -->
            <div class="pm-plan-row pm-plan-row-featured" onclick="processPurchase('sixmonth')">
                <div class="pm-featured-badge">MOST POPULAR</div>
                <div class="pm-plan-info">
                    <div class="pm-plan-label">6 Months</div>
                    <div class="pm-plan-period" id="sixmonthEquiv">${savings.sixmonthEquiv}</div>
                </div>
                <div class="pm-plan-pricing">
                    <div class="pm-plan-price" id="sixmonthPrice">${getDisplayPrice('sixmonth')}</div>
                    <div class="pm-plan-save" id="sixmonthSavings">${savings.sixmonthSavings}</div>
                </div>
                <button class="pm-btn pm-btn-featured" tabindex="-1">Subscribe</button>
            </div>

            <!-- Annual — Best Value -->
            <div class="pm-plan-row pm-plan-row-annual" onclick="processPurchase('annual')">
                <div class="pm-plan-info">
                    <div class="pm-plan-label">Annual <span class="pm-best-tag">BEST VALUE</span></div>
                    <div class="pm-plan-period" id="annualEquiv">${savings.annualEquiv}</div>
                </div>
                <div class="pm-plan-pricing">
                    <div class="pm-plan-price" id="annualPrice">${getDisplayPrice('annual')}</div>
                    <div class="pm-plan-save pm-plan-save-gold" id="annualSavings">${savings.annualSavings}</div>
                </div>
                <button class="pm-btn" tabindex="-1">Subscribe</button>
            </div>

        </div>

        <!-- Promo / Voucher Code Redemption -->
        <div class="pm-voucher-row" onclick="redeemVoucherCode()">
            <i class="fas fa-ticket-alt"></i>
            <div class="pm-voucher-text">
                <span class="pm-voucher-label">Have a promo code?</span>
                <span class="pm-voucher-sub">Tap to redeem via Google Play</span>
            </div>
            <button class="pm-voucher-btn" tabindex="-1">Redeem <i class="fas fa-chevron-right"></i></button>
        </div>

        <p class="pm-legal">
            Subscriptions renew automatically and are managed by Google Play.
            Cancel anytime in the Google Play Store.
        </p>
    </div>
</div>`;

    document.body.insertAdjacentHTML('beforeend', html);
}

// ====================================================================
// PROMO CODE REDEMPTION
// ====================================================================
function redeemVoucherCode() {
    if (window.Android && window.Android.redeemPromoCode) {
        hidePremiumModal();
        window.Android.redeemPromoCode();
    } else {
        showSimpleModal('Not Available',
            'Promo code redemption requires the app to be installed from the Google Play Store.');
    }
}
window.redeemVoucherCode = redeemVoucherCode;

// ====================================================================
// SHOW / HIDE MODAL
// ====================================================================
let selectedPlan = 'sixmonth';

function showPremiumModal(reason = 'general') {
    createPremiumModal();
    refreshModalPrices();
    refreshMonthlyTrialUI();

    const subtitle = document.getElementById('pmSubtitle');
    if (subtitle) {
        if (reason === 'property_limit') {
            subtitle.textContent = "You've reached the 2-property free limit. Upgrade for unlimited access.";
        } else {
            subtitle.textContent = 'Go Premium';
        }
    }

    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }
}

function hidePremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.classList.remove('show');
        modal.classList.add('hidden');
    }
}

// ====================================================================
// PURCHASE FLOW
// ====================================================================
function processPurchase(plan) {
    selectedPlan = plan;

    // Visual feedback — dim other rows
    document.querySelectorAll('.pm-plan-row').forEach(c => c.style.opacity = '0.6');
    const clicked = event && event.currentTarget;
    if (clicked) clicked.style.opacity = '1';

    if (window.Android && window.Android.purchaseSubscription) {
        window.Android.purchaseSubscription(pricingConfig.googlePlaySkus[plan]);
    } else {
        document.querySelectorAll('.pm-plan-row').forEach(c => c.style.opacity = '1');
        showSimpleModal('Google Play Required',
            'Please download the app from Google Play Store to subscribe.');
    }
}

function handleSuccessfulPurchase() {
    premiumState.isPremium = true;
    premiumState.subscriptionType = selectedPlan;
    premiumState.subscriptionEndDate = calculateEndDate(selectedPlan);
    premiumState.hasUsedTrial = true;
    if (selectedPlan === 'monthly') premiumState.hasUsedMonthlyTrial = true;

    savePremiumState();
    hideAllAds();
    hideUpgradeStrip();
    hidePremiumModal();
    showPremiumWelcome();

    console.log('✅ Purchase complete:', selectedPlan);
}

function handlePurchaseError() {
    document.querySelectorAll('.pm-plan-row').forEach(c => {
        c.style.opacity = '1';
        c.style.pointerEvents = 'auto';
    });
    showSimpleModal('Purchase Failed',
        'There was an issue processing your purchase. Please try again.');
}

function calculateEndDate(plan) {
    const d = new Date();
    switch (plan) {
        case 'monthly':    return new Date(d.setMonth(d.getMonth() + 1));
        case 'threemonth': return new Date(d.setMonth(d.getMonth() + 3));
        case 'sixmonth':   return new Date(d.setMonth(d.getMonth() + 6));
        case 'annual':     return new Date(d.setFullYear(d.getFullYear() + 1));
        default:           return new Date(d.setMonth(d.getMonth() + 1));
    }
}

// ====================================================================
// WELCOME MODAL (auto-close after 3s)
// ====================================================================
function showPremiumWelcome() {
    const existing = document.getElementById('premiumWelcomeModal');
    if (existing) existing.remove();

    const html = `
<div id="premiumWelcomeModal" class="pm-welcome-modal">
    <div class="pm-welcome-inner">
        <div class="pm-welcome-icon"><i class="fas fa-crown"></i></div>
        <h2>You're Premium!</h2>
        <p>Everything is unlocked — enjoy the full experience.</p>
        <div class="pm-welcome-checks">
            <span><i class="fas fa-check"></i> Unlimited properties</span>
            <span><i class="fas fa-check"></i> Detailed assessment results</span>
            <span><i class="fas fa-check"></i> PDF reports</span>
            <span><i class="fas fa-check"></i> No advertisements</span>
        </div>
    </div>
</div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    setTimeout(() => {
        const m = document.getElementById('premiumWelcomeModal');
        if (m) { m.classList.add('pm-welcome-fade'); setTimeout(() => m.remove(), 400); }
        // Stay on the current screen — premium is active, no navigation needed.
        // Refresh any premium-gated UI in place if a refresher exists.
        if (typeof window.updatePremiumUI === 'function') window.updatePremiumUI();
    }, 3000);
}

// Legacy alias
function showAutoClosingWelcomeModal() { showPremiumWelcome(); }

// ====================================================================
// SIMPLE UTILITY MODAL
// ====================================================================
function showSimpleModal(title, message) {
    const existing = document.getElementById('pmSimpleModal');
    if (existing) existing.remove();

    const html = `
<div id="pmSimpleModal" class="premium-modal show">
    <div class="pm-backdrop" onclick="hideSimpleModal()"></div>
    <div class="pm-simple-card">
        <h3>${title}</h3>
        <p>${message}</p>
        <button class="pm-btn pm-btn-featured" onclick="hideSimpleModal()">OK</button>
    </div>
</div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}
function hideSimpleModal() {
    const m = document.getElementById('pmSimpleModal');
    if (m) m.remove();
}
// Legacy aliases
function hideGenericModal() { hideSimpleModal(); }
function showPremiumManagementModal() { showSimpleModal('Manage Subscription', 'To manage or cancel your subscription, go to the Google Play Store \u2192 Subscriptions.'); }

// ====================================================================
// PROPERTY LIMIT ENFORCEMENT
// ====================================================================
function checkPropertyLimit() {
    if (premiumState.isPremium) return true;
    const props = getAllProperties();
    premiumState.propertyCount = props.length;
    return premiumState.propertyCount < premiumState.maxFreeProperties;
}

function enforcePropertyLimit() {
    if (!checkPropertyLimit()) {
        showPremiumModal('property_limit');
        return false;
    }
    return true;
}

// ====================================================================
// ADMOB — interstitial only
//
// Exactly two trigger points app-wide:
//   1. 'add_property'  — fires every single time, no cooldown.
//   2. 'view_report'   — fires per-property, with a 30-minute cooldown
//                         PER PROPERTY. Viewing property A's report twice
//                         within 30 min only shows the ad once; viewing
//                         property B in between is unaffected and always
//                         evaluated independently of A's timer.
// ====================================================================
function initializeAdMob() {
    if (premiumState.isPremium || adMobState.adInitialized) return;
    try {
        if (window.Android && window.Android.initializeAds) {
            window.Android.initializeAds();
            adMobState.adInitialized = true;
            loadInterstitialAd();
        }
    } catch (e) { console.error('AdMob init failed:', e); }
}

function loadInterstitialAd() {
    if (premiumState.isPremium) return;
    try { if (window.Android && window.Android.loadInterstitialAd) {
        window.Android.loadInterstitialAd();
        adMobState.interstitialLoaded = true;
    }} catch (e) {}
}

/**
 * showInterstitialAd
 * @param {string} trigger    - 'add_property' | 'view_report'
 * @param {string} [propertyId] - required for 'view_report', used for the
 *                                 per-property 30-minute cooldown lookup.
 */
function showInterstitialAd(trigger, propertyId) {
    if (premiumState.isPremium) return;

    if (trigger === 'view_report') {
        if (!propertyId) {
            console.warn('showInterstitialAd("view_report") called without propertyId — skipping cooldown check, firing anyway');
        } else {
            const last = premiumState.reportAdTimestamps[propertyId] || 0;
            const elapsed = Date.now() - last;
            if (elapsed < REPORT_AD_COOLDOWN_MS) {
                console.log(`Report ad skipped for ${propertyId} — ${Math.round((REPORT_AD_COOLDOWN_MS - elapsed) / 60000)}min remaining on cooldown`);
                return;
            }
        }
    }
    // 'add_property' — no cooldown, always proceeds to fire below.

    try {
        if (window.Android && window.Android.showInterstitialAd) {
            window.Android.showInterstitialAd();
            if (trigger === 'view_report' && propertyId) {
                premiumState.reportAdTimestamps[propertyId] = Date.now();
                savePremiumState();
            }
            setTimeout(loadInterstitialAd, 1000);
        }
    } catch (e) { console.error('Interstitial show error:', e); }
}

function hideAllAds() {
    // No-op now that the banner ad is removed — kept for backward
    // compatibility with existing call sites elsewhere in the codebase.
}

// ====================================================================
// UPGRADE STRIP (shown in app for free users)
// ====================================================================
function createUpgradeStrip() {
    if (document.getElementById('upgradeStrip')) return;
    if (premiumState.isPremium) return;

    const strip = document.createElement('div');
    strip.id = 'upgradeStrip';
    strip.className = 'upgrade-strip';
    strip.innerHTML = `
        <div class="us-left">
            <i class="fas fa-crown"></i>
            <div class="us-text">
                <strong>Upgrade to Premium</strong>
                <span id="usPropertyCount">Unlimited properties &amp; no ads</span>
            </div>
        </div>
        <button class="us-btn" onclick="window.showPremiumModal('upgrade_strip')">
            Upgrade <i class="fas fa-arrow-right"></i>
        </button>`;
    document.body.appendChild(strip);
}

function updateUpgradeStrip() {
    if (premiumState.isPremium) {
        hideUpgradeStrip();
        return;
    }
    createUpgradeStrip();

    const countEl = document.getElementById('usPropertyCount');
    if (countEl) {
        const count = getAllProperties().length;
        const max   = premiumState.maxFreeProperties;
        countEl.textContent = count >= max
            ? `${count}/${max} properties used — upgrade for unlimited`
            : `${count}/${max} free properties used`;
        if (count >= max) countEl.style.color = '#F4A261';
    }
}

function hideUpgradeStrip() {
    const strip = document.getElementById('upgradeStrip');
    if (strip) strip.remove();
}

// Legacy aliases (still referenced in integration.js)
function createBannerUpgradeButton() { createUpgradeStrip(); }
function updateBannerUpgradeButton() { updateUpgradeStrip(); }
function handleBannerUpgradeClick()  { showPremiumModal('upgrade_strip'); }

// ====================================================================
// PREMIUM STATE — SAVE / LOAD
// ====================================================================
function savePremiumState() {
    try { localStorage.setItem('propertyInspectorPremium', JSON.stringify(premiumState)); }
    catch (e) { console.error('Failed to save premium state:', e); }
}

function loadPremiumState() {
    try {
        const raw = localStorage.getItem('propertyInspectorPremium');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.hasOwnProperty('isPremium')) {
                Object.assign(premiumState, parsed);
                // Safe fallback for users upgrading from a version that
                // didn't have per-property report-ad cooldown tracking
                if (!premiumState.reportAdTimestamps || typeof premiumState.reportAdTimestamps !== 'object') {
                    premiumState.reportAdTimestamps = {};
                }

                // Check subscription expiry
                if (premiumState.subscriptionEndDate) {
                    if (new Date() > new Date(premiumState.subscriptionEndDate)) {
                        premiumState.isPremium = false;
                        premiumState.subscriptionType = null;
                        premiumState.subscriptionEndDate = null;
                        savePremiumState();
                    }
                }
            }
        } else {
            savePremiumState();
        }
    } catch (e) {
        console.error('Failed to load premium state:', e);
    }
}

// ====================================================================
// UTILITIES
// ====================================================================
function getAllProperties() {
    try {
        if (window.getAllProperties) return window.getAllProperties();
        if (window.appState && window.appState.properties) return window.appState.properties;
        const s = localStorage.getItem('propertyInspectorProperties');
        return s ? JSON.parse(s) : [];
    } catch (e) { return []; }
}

function updateUIForPremiumStatus() {
    if (premiumState.isPremium) {
        document.body.classList.add('premium-user');
        hideAllAds();
        hideUpgradeStrip();
    } else {
        document.body.classList.remove('premium-user');
        updateUpgradeStrip();
    }
}

// ====================================================================
// INITIALIZATION
// ====================================================================
function initializePremiumSystem() {
    console.log('Initializing premium system...');
    loadPremiumState();

    if (TESTING_MODE === 'free') {
        // Force free/non-premium — clears any saved premium state
        premiumState.isPremium = false;
        premiumState.subscriptionType = null;
        premiumState.subscriptionEndDate = null;
        premiumState.hasUsedTrial = false;
        savePremiumState();
        console.log('🧪 TESTING MODE: free tier forced');
    } else if (TESTING_MODE === 'premium' || TESTING_MODE === true) {
        // Force premium
        premiumState.isPremium = true;
        premiumState.subscriptionType = 'monthly';
        premiumState.subscriptionEndDate = calculateEndDate('monthly');
        savePremiumState();
        console.log('🧪 TESTING MODE: premium tier forced');
    }

    const originalPremiumState = JSON.parse(JSON.stringify(premiumState));

    createPremiumModal();
    refreshModalPrices();
    updateUpgradeStrip();
    updateUIForPremiumStatus();

    if (!premiumState.isPremium) {
        initializeAdMob();
    }

    premiumState.propertyCount = getAllProperties().length;

    // Verify with Google Play
    if (window.Android && window.Android.checkPurchases) {
        setTimeout(() => {
            const timeoutId = setTimeout(() => {
                if (window.androidPurchaseTimeout === timeoutId) {
                    updateUIForPremiumStatus();
                    updateUpgradeStrip();
                    window.androidPurchaseTimeout = null;
                }
            }, 5000);
            window.androidPurchaseTimeout = timeoutId;
            try {
                const statusJson = window.Android.getSubscriptionStatus();
                const status = JSON.parse(statusJson);
                if (status && status.isPremium === true) {
                    premiumState.isPremium = true;
                    premiumState.subscriptionType = status.subscriptionType || 'monthly';
                    premiumState.subscriptionEndDate = calculateEndDate(premiumState.subscriptionType);
                    savePremiumState();
                    hideAllAds();
                    hideUpgradeStrip();
                    clearTimeout(timeoutId);
                    window.androidPurchaseTimeout = null;
                } else if (status && status.isPremium === false && originalPremiumState.isPremium) {
                    premiumState.isPremium = false;
                    premiumState.subscriptionType = null;
                    premiumState.subscriptionEndDate = null;
                    savePremiumState();
                    clearTimeout(timeoutId);
                    window.androidPurchaseTimeout = null;
                }
                updateUIForPremiumStatus();
                updateUpgradeStrip();
            } catch (e) { console.log('Subscription status check error:', e); }
        }, 2000);
    }

    window.premiumSystemInitialized = true;
    console.log('Premium system ready. isPremium:', premiumState.isPremium);
}

// ====================================================================
// ANDROID CALLBACKS (called from Kotlin)
// ====================================================================
window.onExistingPurchase = function(sku) {
    let subscriptionType = 'monthly';
    if (sku.includes('threemonth'))          subscriptionType = 'threemonth';
    else if (sku.includes('sixmonth'))   subscriptionType = 'sixmonth';
    else if (sku.includes('annual'))     subscriptionType = 'annual';

    if (subscriptionType === 'monthly') premiumState.hasUsedMonthlyTrial = true;
    premiumState.isPremium = true;
    premiumState.subscriptionType = subscriptionType;
    premiumState.subscriptionEndDate = calculateEndDate(subscriptionType);
    premiumState.hasUsedTrial = true;

    savePremiumState();
    hideAllAds();
    hideUpgradeStrip();
    updateUIForPremiumStatus();
};

window.onPurchaseCheckComplete = function(result) {
    if (window.androidPurchaseTimeout) {
        clearTimeout(window.androidPurchaseTimeout);
        window.androidPurchaseTimeout = null;
    }
    if (result === false) {
        premiumState.isPremium = false;
        premiumState.subscriptionType = null;
        premiumState.subscriptionEndDate = null;
        premiumState.hasUsedTrial = true;
        savePremiumState();
        updateUIForPremiumStatus();
        updateUpgradeStrip();
        setTimeout(() => { if (!premiumState.isPremium) initializeAdMob(); }, 1000);
    }
};

// ====================================================================
// GLOBAL EXPORTS
// ====================================================================
window.showPremiumModal            = showPremiumModal;
window.hidePremiumModal            = hidePremiumModal;
window.processPurchase             = processPurchase;
window.handleSuccessfulPurchase    = handleSuccessfulPurchase;
window.handlePurchaseError         = handlePurchaseError;
window.checkPropertyLimit          = checkPropertyLimit;
window.enforcePropertyLimit        = enforcePropertyLimit;
window.showInterstitialAd          = showInterstitialAd;
window.initializePremiumSystem     = initializePremiumSystem;
window.updateBannerUpgradeButton   = updateBannerUpgradeButton;
window.handleBannerUpgradeClick    = handleBannerUpgradeClick;
window.showPremiumManagementModal  = showPremiumManagementModal;
window.updateUIForPremiumStatus    = updateUIForPremiumStatus;
window.premiumState                = premiumState;
window.calculateEndDate            = calculateEndDate;
window.updateGooglePlayPrices      = updateGooglePlayPrices;