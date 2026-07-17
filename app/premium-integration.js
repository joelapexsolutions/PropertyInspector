/**
 * Home Buyers Guide SA — Premium Integration
 */

// ====================================================================
// BOOT
// ====================================================================

function bootPremiumIntegration() {
    if (typeof window.initializePremiumSystem === 'function') {
        window.initializePremiumSystem();
        attachAppFunctionHooks();
        return;
    }
    let tries = 0;
    const poll = setInterval(() => {
        tries++;
        if (typeof window.initializePremiumSystem === 'function') {
            clearInterval(poll);
            window.initializePremiumSystem();
            attachAppFunctionHooks();
        } else if (tries >= 100) {
            clearInterval(poll);
        }
    }, 50);
}

function attachAppFunctionHooks() {
    let tries = 0;
    const poll = setInterval(() => {
        tries++;
        const ready = typeof window.showScreen === 'function';
        if (ready || tries >= 100) {
            clearInterval(poll);
            safeOverrideAppFunctions();
            setupAddPropertySaveHook();
            updateUIForPremiumStatus();
            setupPremiumEventListeners();
            setupPromoCodeTracking();
        }
    }, 50);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootPremiumIntegration);
} else {
    bootPremiumIntegration();
}

// ====================================================================
// PROMO CODE TRACKING
// ====================================================================

function setupPromoCodeTracking() {
    if (typeof gtag === 'undefined') return;
    window.trackPromoCodeUsage = function(promoType, productId) {
        gtag('event', 'promo_code_used', {
            'promo_type': promoType,
            'product_id': productId,
            'timestamp': new Date().toISOString()
        });
    };
    window.trackPromoRedemption = function(productId, originalPrice, discountAmount) {
        gtag('event', 'promo_redemption_success', {
            'product_id': productId,
            'original_price': originalPrice,
            'discount_amount': discountAmount,
            'redemption_date': new Date().toISOString()
        });
    };
}

// ====================================================================
// PURCHASE SUCCESS HANDLER
// ====================================================================

const originalOnPurchaseSuccess = window.onPurchaseSuccess;

window.onPurchaseSuccess = function(sku, purchaseData) {
    const isPromoCodePurchase = checkIfPromoCodePurchase(purchaseData);

    if (isPromoCodePurchase) {
        if (window.trackPromoCodeUsage) {
            window.trackPromoCodeUsage('google_play_promo', sku);
        }
        showPromoCodeSuccessMessage(sku);
        savePromoCodeUsage(sku, purchaseData);
    }

    if (originalOnPurchaseSuccess) {
        originalOnPurchaseSuccess(sku, purchaseData);
    } else {
        activatePremiumFromPromoCode(sku);
    }
};

function checkIfPromoCodePurchase(purchaseData) {
    try {
        if (typeof purchaseData === 'string') {
            const data = JSON.parse(purchaseData);
            return data.promotionCode || data.originalPrice !== data.finalPrice;
        }
        if (typeof purchaseData === 'object' && purchaseData !== null) {
            return purchaseData.promotionCode || purchaseData.originalPrice !== purchaseData.finalPrice;
        }
        return false;
    } catch (e) {
        return false;
    }
}

function showPromoCodeSuccessMessage(sku) {
    const promoMessage = `
        <div class="promo-success-overlay">
            <div class="promo-success-content">
                <div class="promo-success-icon">
                    <i class="fas fa-gift"></i>
                </div>
                <h2>🎉 Promo Code Applied!</h2>
                <p>Your promotional code has been successfully applied and premium features are now active!</p>
                <div class="promo-benefits">
                    <div class="benefit-item">
                        <i class="fas fa-check-circle"></i>
                        <span>Unlimited property assessments</span>
                    </div>
                    <div class="benefit-item">
                        <i class="fas fa-check-circle"></i>
                        <span>PDF report generation</span>
                    </div>
                    <div class="benefit-item">
                        <i class="fas fa-check-circle"></i>
                        <span>Advanced cost calculator</span>
                    </div>
                    <div class="benefit-item">
                        <i class="fas fa-check-circle"></i>
                        <span>No advertisements</span>
                    </div>
                </div>
                <button class="promo-success-close" onclick="closePromoSuccessMessage()">
                    <i class="fas fa-times"></i>
                    Start Using Premium
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', promoMessage);
    setTimeout(() => closePromoSuccessMessage(), 10000);
}

function closePromoSuccessMessage() {
    const overlay = document.querySelector('.promo-success-overlay');
    if (overlay) overlay.remove();
}

function savePromoCodeUsage(sku, purchaseData) {
    try {
        const promoUsage = { sku, usedAt: new Date().toISOString(), purchaseData };
        const existing = JSON.parse(localStorage.getItem('promoCodeUsage') || '[]');
        existing.push(promoUsage);
        localStorage.setItem('promoCodeUsage', JSON.stringify(existing));
    } catch (e) {
        console.error('Error saving promo code usage:', e);
    }
}

function activatePremiumFromPromoCode(sku) {
    let subscriptionType = 'monthly';
    if (sku.includes('sixmonth'))  subscriptionType = 'sixmonth';
    else if (sku.includes('annual')) subscriptionType = 'annual';

    if (window.premiumState) {
        window.premiumState.isPremium = true;
        window.premiumState.subscriptionType = subscriptionType;
        window.premiumState.subscriptionEndDate = window.calculateEndDate(subscriptionType);
        window.premiumState.hasUsedTrial = true;
        window.premiumState.acquiredViaPromoCode = true;
        window.premiumState.promoCodeDate = new Date().toISOString();
    }

    if (window.savePremiumState)    window.savePremiumState();
    if (window.hideAllAds)          window.hideAllAds();
    if (window.hidePremiumModal)    window.hidePremiumModal();
    if (window.showPremiumWelcome)  window.showPremiumWelcome();

    updateUIForPremiumStatus();
    if (window.updateBannerUpgradeButton) window.updateBannerUpgradeButton();
}

// ====================================================================
// APP FUNCTION OVERRIDES
// ====================================================================

function safeOverrideAppFunctions() {

    // Block property add screen when free user is at limit
    if (window.showScreen && !window.showScreen._premiumOverridden) {
        const _orig = window.showScreen;
        window.showScreen = function(screenId, ...args) {
            if (screenId === 'addPropertyScreen') {
                if (!window.premiumState || window.premiumState.isPremium) {
                    return _orig(screenId, ...args);
                }
                const count = (window.getAllProperties ? window.getAllProperties() :
                    (window.appState && window.appState.properties ? window.appState.properties : [])).length;
                if (count >= (window.premiumState.maxFreeProperties || 2)) {
                    window.showPremiumModal('property_limit');
                    return false;
                }
            }
            return _orig(screenId, ...args);
        };
        window.showScreen._premiumOverridden = true;
    }

    if (window.selectPropertyType && !window.selectPropertyType._premiumOverridden) {
        const _orig = window.selectPropertyType;
        window.selectPropertyType = function(type) { return _orig.call(this, type); };
        window.selectPropertyType._premiumOverridden = true;
    }

    if (window.handleHomeTileClick && !window.handleHomeTileClick._premiumOverridden) {
        const _orig = window.handleHomeTileClick;
        window.handleHomeTileClick = function(screenId, tileElement) { return _orig.call(this, screenId, tileElement); };
        window.handleHomeTileClick._premiumOverridden = true;
    }

    // Block Full Report for free users — show premium modal instead
    function blockReportForFreeUsers() {
        if (window.premiumState && window.premiumState.isPremium) return false;
        if (window.showPremiumModal) window.showPremiumModal('full_report');
        return true;
    }

    if (window.generateDetailedReportForProperty && !window.generateDetailedReportForProperty._premiumOverridden) {
        const _orig = window.generateDetailedReportForProperty;
        window.generateDetailedReportForProperty = function(propertyId, ...rest) {
            if (blockReportForFreeUsers()) return;
            return _orig.call(this, propertyId, ...rest);
        };
        window.generateDetailedReportForProperty._premiumOverridden = true;
    }

    if (window.generateAssessmentData && !window.generateAssessmentData._premiumOverridden) {
        const _orig = window.generateAssessmentData;
        window.generateAssessmentData = function(...args) {
            if (blockReportForFreeUsers()) return;
            return _orig.apply(this, args);
        };
        window.generateAssessmentData._premiumOverridden = true;
    }

    // Gate access to properties at index 2+ for free users.
    // First 2 properties always accessible. Properties added while premium
    // become locked when the subscription expires.
    function isPropertyLocked(propertyId) {
        if (window.premiumState && window.premiumState.isPremium) return false;
        const all = getAllProperties();
        const idx = all.findIndex(p => p.id === propertyId);
        return idx >= 2;
    }

    if (window.viewPropertyDetails && !window.viewPropertyDetails._premiumOverridden) {
        const _origVPD = window.viewPropertyDetails;
        window.viewPropertyDetails = function(propertyId) {
            if (isPropertyLocked(propertyId)) {
                if (window.showPremiumModal) window.showPremiumModal('locked_property');
                return;
            }
            return _origVPD(propertyId);
        };
        window.viewPropertyDetails._premiumOverridden = true;
    }

    if (window.viewPropertyAssessmentResults && !window.viewPropertyAssessmentResults._premiumOverridden) {
        const _origVAR = window.viewPropertyAssessmentResults;
        window.viewPropertyAssessmentResults = function(propertyId) {
            if (isPropertyLocked(propertyId)) {
                if (window.showPremiumModal) window.showPremiumModal('locked_property');
                return;
            }
            return _origVAR(propertyId);
        };
        window.viewPropertyAssessmentResults._premiumOverridden = true;
    }

    // Gate Assess button — startAssessment is called when property has no assessment yet
    if (window.startAssessment && !window.startAssessment._premiumOverridden) {
        const _origSA = window.startAssessment;
        window.startAssessment = function(propertyId) {
            if (isPropertyLocked(propertyId)) {
                if (window.showPremiumModal) window.showPremiumModal('locked_property');
                return;
            }
            return _origSA(propertyId);
        };
        window.startAssessment._premiumOverridden = true;
    }

    // Gate View & Edit button — only delete should work on locked properties
    if (window.editProperty && !window.editProperty._premiumOverridden) {
        const _origEP = window.editProperty;
        window.editProperty = function(propertyId) {
            if (isPropertyLocked(propertyId)) {
                if (window.showPremiumModal) window.showPremiumModal('locked_property');
                return;
            }
            return _origEP(propertyId);
        };
        window.editProperty._premiumOverridden = true;
    }
}

// ====================================================================
// ADD-PROPERTY SAVE HOOK
// ====================================================================

let _premiumSaveHookInstalled = false;

function setupAddPropertySaveHook() {
    if (_premiumSaveHookInstalled) return;
    _premiumSaveHookInstalled = true;

    document.addEventListener('submit', function(e) {
        if (!e.target || e.target.id !== 'propertyDetailsForm') return;

        const wasEditing = !!(window.appState && window.appState.editingPropertyId);

        setTimeout(() => {
            if (wasEditing) return;

            if (window.updateUpgradeStrip)       window.updateUpgradeStrip();
            if (window.updateBannerUpgradeButton) window.updateBannerUpgradeButton();
            if (window.addLimitIndicators)        window.addLimitIndicators();

            if (!window.premiumState || !window.premiumState.isPremium) {
                if (window.showInterstitialAd) {
                    window.showInterstitialAd('add_property');
                }
            }
        }, 50);
    }, true);
}

// ====================================================================
// UI — PREMIUM STATUS
// ====================================================================

function updateUIForPremiumStatus() {
    if (premiumState.isPremium) {
        document.body.classList.add('premium-user');
        if (premiumState.acquiredViaPromoCode) document.body.classList.add('promo-code-user');
        hideAllAds();
        addPremiumIndicators();
        removeLimitWarnings();
        if (window.updateUpgradeStrip) window.updateUpgradeStrip();
    } else {
        document.body.classList.remove('premium-user', 'promo-code-user');
        document.querySelectorAll('.premium-badge').forEach(b => b.remove());
        addLimitIndicators();
        if (window.updateUpgradeStrip) window.updateUpgradeStrip();
        if (!premiumState.isPremium) initializeAdMob();
    }
}

function addPremiumIndicators() {
    const header = document.querySelector('.app-header-banner');
    if (!header || header.querySelector('.premium-badge')) return;
    const badge = document.createElement('div');
    badge.className = 'premium-badge';
    badge.innerHTML = premiumState.acquiredViaPromoCode
        ? `<i class="fas fa-gift"></i><span>Premium (Promo)</span>`
        : `<i class="fas fa-crown"></i><span>Premium</span>`;
    if (premiumState.acquiredViaPromoCode) badge.classList.add('promo-badge');
    header.appendChild(badge);
}

function addLimitIndicators() {
    if (window.premiumState && window.premiumState.isPremium) return;

    // Update the property count in the list header
    const header = document.querySelector('#propertyListScreen .screen-header h2');
    if (header) {
        const count = getAllProperties().length;
        let indicator = header.querySelector('.property-count');
        if (indicator) {
            indicator.textContent = ` (${count}/${premiumState.maxFreeProperties})`;
        } else {
            indicator = document.createElement('span');
            indicator.className = 'property-count';
            indicator.textContent = ` (${count}/${premiumState.maxFreeProperties})`;
            header.appendChild(indicator);
        }
    }

    // Apply lock badges per list independently so each list's index resets.
    // Using a combined selector would merge both lists into one array,
    // causing ALL cards in the second list to get locked.
    ['#homePropertyList', '#propertyList'].forEach(function(listId) {
        const cards = document.querySelectorAll(listId + ' .property-card');
        cards.forEach(function(card, i) {
            if (i >= 2) {
                card.classList.add('property-locked');
                if (!card.querySelector('.property-lock-badge')) {
                    const badge = document.createElement('div');
                    badge.className = 'property-lock-badge';
                    badge.innerHTML = '<i class="fas fa-lock"></i> Premium Required';
                    card.appendChild(badge);
                }
            } else {
                card.classList.remove('property-locked');
                const b = card.querySelector('.property-lock-badge');
                if (b) b.remove();
            }
        });
    });
}

function removeLimitWarnings() {
    document.querySelectorAll('.property-limit-warning, .property-count').forEach(el => el.remove());
    // Remove lock badges and unlock cards when premium is restored
    document.querySelectorAll('.property-lock-badge').forEach(el => el.remove());
    document.querySelectorAll('.property-locked').forEach(el => el.classList.remove('property-locked'));
}

function updatePropertyCount() {
    const properties = getAllProperties();
    premiumState.propertyCount = properties.length;
    if (window.premiumSystemInitialized) savePremiumState();
    if (!premiumState.isPremium) {
        const indicator = document.querySelector('.property-count');
        if (indicator) {
            indicator.textContent = ` (${premiumState.propertyCount}/${premiumState.maxFreeProperties})`;
            if (premiumState.propertyCount >= premiumState.maxFreeProperties) {
                indicator.style.color = '#E63946';
                indicator.style.fontWeight = 'bold';
            }
        }
    }
}

// ====================================================================
// EVENT LISTENERS
// ====================================================================

function setupPremiumEventListeners() {
    document.addEventListener('click', function(event) {
        if (event.target.matches('.upgrade-to-premium, .upgrade-btn')) {
            event.preventDefault();
            showPremiumModal('button_click');
        }
    });
}

// ====================================================================
// UTILITY
// ====================================================================

function getAllProperties() {
    try {
        if (window.propertyDataManager && window.propertyDataManager.getAllProperties) return window.propertyDataManager.getAllProperties();
        if (window.appState && Array.isArray(window.appState.properties)) return window.appState.properties;
        const stored = localStorage.getItem('propertyInspectorData');
        if (stored) {
            const data = JSON.parse(stored);
            if (data.properties && Array.isArray(data.properties)) return data.properties;
        }
        return [];
    } catch (e) {
        return [];
    }
}

// ====================================================================
// ANDROID WEBVIEW CALLBACKS
// ====================================================================

window.onAdLoaded = function(adType) {
    if (adType === 'interstitial') adMobState.interstitialLoaded = true;
};

window.onAdFailedToLoad = function(adType, error) {};

window.onAdClosed = function(adType) {
    if (adType === 'interstitial') {
        setTimeout(() => loadInterstitialAd(), 1000);
    }
};

window.onPurchaseFailure = function(error) {
    const upgradeButton = document.getElementById('upgradeButton');
    if (upgradeButton) {
        upgradeButton.classList.remove('loading');
        upgradeButton.innerHTML = `<i class="fas fa-crown"></i><span>Try Again</span>`;
    }
    if (error.toLowerCase().includes('promo') || error.toLowerCase().includes('code')) {
        showModal('Promo Code Issue', 'There was an issue with your promotional code. Please check that the code is valid and try again.');
    } else {
        showModal('Purchase Failed', 'There was an issue processing your purchase. Please try again.');
    }
};

window.onExistingPurchase = function(sku) {
    let subscriptionType = 'monthly';
    if (sku.includes('threemonth') || sku.includes('3month')) subscriptionType = 'threemonth';
    else if (sku.includes('sixmonth'))                        subscriptionType = 'sixmonth';
    else if (sku.includes('annual'))                          subscriptionType = 'annual';

    if (window.premiumState) {
        window.premiumState.isPremium = true;
        window.premiumState.subscriptionType = subscriptionType;
        window.premiumState.subscriptionEndDate = window.calculateEndDate(subscriptionType);
        window.premiumState.hasUsedTrial = true;
        if (subscriptionType === 'monthly') window.premiumState.hasUsedMonthlyTrial = true;

        const promoUsage = JSON.parse(localStorage.getItem('promoCodeUsage') || '[]');
        const matchingPromo = promoUsage.find(usage => usage.sku === sku);
        if (matchingPromo) {
            window.premiumState.acquiredViaPromoCode = true;
            window.premiumState.promoCodeDate = matchingPromo.usedAt;
        }
    }

    if (window.savePremiumState) window.savePremiumState();
    if (window.hideAllAds)       window.hideAllAds();

    updateUIForPremiumStatus();
    if (window.updateBannerUpgradeButton) window.updateBannerUpgradeButton();
};

window.handleSubscriptionStatus = function(status) {
    if (status.isPremium) {
        premiumState.isPremium = true;
        premiumState.subscriptionType = status.subscriptionType;
        premiumState.subscriptionEndDate = calculateEndDate(status.subscriptionType);
        if (status.acquiredViaPromoCode) {
            premiumState.acquiredViaPromoCode = true;
            premiumState.promoCodeDate = status.promoCodeDate;
        }
    } else {
        premiumState.isPremium = false;
        premiumState.subscriptionType = null;
        premiumState.subscriptionEndDate = null;
        premiumState.acquiredViaPromoCode = false;
        premiumState.promoCodeDate = null;
    }
    savePremiumState();
    updateUIForPremiumStatus();
    updateBannerUpgradeButton();
};

// ====================================================================
// PROMO CODE STATS
// ====================================================================

window.getPromoCodeStats = function() {
    try {
        const promoUsage = JSON.parse(localStorage.getItem('promoCodeUsage') || '[]');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const stats = { totalUsage: promoUsage.length, byProduct: {}, recentUsage: 0 };
        promoUsage.forEach(u => {
            stats.byProduct[u.sku] = (stats.byProduct[u.sku] || 0) + 1;
            if (new Date(u.usedAt) > thirtyDaysAgo) stats.recentUsage++;
        });
        return stats;
    } catch (e) {
        return { totalUsage: 0, byProduct: {}, recentUsage: 0 };
    }
};

// ====================================================================
// EXPORTS
// ====================================================================

window.updateUIForPremiumStatus  = updateUIForPremiumStatus;
window.updatePropertyCount       = updatePropertyCount;
window.getAllProperties           = getAllProperties;
window.closePromoSuccessMessage  = closePromoSuccessMessage;
window.addLimitIndicators        = addLimitIndicators;