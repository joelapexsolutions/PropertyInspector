/**
 * Home Buyers Guide SA - Main Application Logic
 * CLEANED VERSION - Removes duplicates and ensures proper sync
 */

// ── Customize Assessment constants — defined HERE at the very top
// so they are available regardless of any runtime errors later in the file.
var SECTION_COLORS = { location:'#ca8a04', exterior:'#28A745', interior:'#2E86AB', other:'#6F42C1' };
var SECTION_ICONS  = { location:'fa-map-marker-alt', exterior:'fa-tree', interior:'fa-door-open', other:'fa-star' };
var SECTION_LABELS = {
    location: 'Location & Neighbourhood',
    exterior: 'Exterior Assessment',
    interior: 'Interior Assessment',
    other:    'Other Features Assessment'
};
var WEIGHT_OPTIONS = [
    { label:'Low', value:1 }, { label:'Moderate', value:2 }, { label:'High', value:3 },
    { label:'Very High', value:3.5 }, { label:'Critical', value:4 }
];


// ═══════════════════════════════════════════════
// APP VERSION — single source of truth.
// Update ONLY this constant for each release; every other place that
// displays the version (Settings → About row, About modal, exported
// backup file metadata, Settings screen identity strip) reads from here.
// Keep this in sync with versionName in the app-module build.gradle.kts.
// ═══════════════════════════════════════════════
const APP_VERSION = '2.0';
window.APP_VERSION = APP_VERSION;

// ═══════════════════════════════════════════════
// THEME — dark / light mode
// ═══════════════════════════════════════════════
function initTheme() {
    // Dark mode is the default. Saved preference always wins.
    const saved = localStorage.getItem('hbg_theme') || 'dark';
    applyTheme(saved);
}

function applyTheme(mode) {
    if (mode === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    syncThemeUI();
}

function setTheme(mode) {
    localStorage.setItem('hbg_theme', mode);
    applyTheme(mode);
}

function resetAssessmentGuide() {
    localStorage.removeItem('hasSeenAssessmentGuide');
    syncAssessmentGuideToggleUI();
    showSuccess('Assessment guide will show next time you tap Assess');
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    setTheme(isDark ? 'light' : 'dark');
}

function syncThemeUI() {
    const isDark = document.body.classList.contains('dark-mode');
    // Segmented control
    const segL = document.getElementById('segLight');
    const segD = document.getElementById('segDark');
    if (segL) segL.classList.toggle('active', !isDark);
    if (segD) segD.classList.toggle('active', isDark);
    // Legacy switch (if present)
    const sw = document.getElementById('themeSwitch');
    if (sw) sw.classList.toggle('dark-on', isDark);
    // Label
    const lbl = document.getElementById('themeModeLabel');
    if (lbl) lbl.textContent = isDark ? 'Dark mode is on' : 'Light mode is on';
}

// ═══════════════════════════════════════════════
// BOTTOM NAV
// ═══════════════════════════════════════════════
function navTo(screenId, navId) {
    appState.navStack = []; // bottom-nav tabs are navigation roots
    showScreen(screenId);
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const active = document.getElementById(navId);
    if (active) active.classList.add('active');
}

// Smart back: pops the navigation stack to return to the actual previous screen.
// Falls back to the button's original hardcoded target if the stack is empty.
function goBackScreen(fallbackScreenId) {
    appState.navStack = appState.navStack || [];
    let target = null;
    while (appState.navStack.length > 0) {
        const candidate = appState.navStack.pop();
        if (candidate && candidate !== appState.currentScreen && document.getElementById(candidate)) {
            target = candidate;
            break;
        }
    }
    if (!target) target = fallbackScreenId || 'propertyListScreen';
    appState._navigatingBack = true;
    showScreen(target);
}
window.goBackScreen = goBackScreen;

// Rewire every static back button that uses a hardcoded showScreen('...') target
// so it returns to the actual previous screen, keeping the hardcoded target as fallback.
function initSmartBackButtons() {
    document.querySelectorAll('.back-button').forEach(btn => {
        const oc = btn.getAttribute('onclick') || '';
        const m = oc.match(/^\s*showScreen\('([^']+)'\)\s*;?\s*$/);
        if (!m) return; // leave custom handlers (e.g. helpScreenBack) untouched
        const fallback = m[1];
        btn.removeAttribute('onclick');
        btn.addEventListener('click', () => goBackScreen(fallback));
    });
}

function updateBottomNav(screenId) {
    const map = {
        homeScreen: 'navHome',
        propertyListScreen: 'navProperties',
        costCalculatorScreen: 'navCalc',
        settingsScreen: 'navSettings'
    };
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navId = map[screenId];
    if (navId) { const el = document.getElementById(navId); if (el) el.classList.add('active'); }
}

// ═══════════════════════════════════════════════
// FILTER PROPERTIES (All / Assessed / Pending)
// ═══════════════════════════════════════════════
function filterProperties(filter, btn) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const cards = document.querySelectorAll('#homePropertyList .property-card, #propertyList .property-card');
    cards.forEach(card => {
        const isAssessed = card.dataset.assessed === 'true';
        let show = true;
        if (filter === 'assessed') show = isAssessed;
        if (filter === 'pending') show = !isAssessed;
        card.style.display = show ? '' : 'none';
    });
    // Update tab count labels
    const all = document.querySelectorAll('.property-card').length / 2;
    document.querySelectorAll('.filter-tab')[0].textContent = `All (${all})`;
}



// App State - Simplified, delegates to specialized modules
const appState = {
    currentScreen: 'homeScreen',
    selectedPropertyType: null,
    properties: [], // Will be managed by property-data.js
    currentProperty: null,
    editingPropertyId: null,
    settings: {
        theme: 'dark',
        notifications: true
    }
};

// Initialize App
async function initApp() {
    initTheme();
	// Initialize Analytics tracking
	initializeAnalytics();
    loadAppData();
	
	 if (window.initializeOnboarding) {
        initializeOnboarding();
    }
    
    // Load photos and assessments from IndexedDB - FIXED
    try {
        if (window.photoManager && window.photoManager.loadPhotosFromIndexedDB) {
            await window.photoManager.loadPhotosFromIndexedDB();
        }
        
        await loadAssessmentsFromIndexedDB();
        updatePropertyCount();
        
        if (appState.currentScreen === 'propertyListScreen') {
            updatePropertyList();
        }
        
        // Initialize notifications and render upcoming assessments
        await initNotifications();
        renderHomeScreen();
    } catch (error) {
        console.error('Error loading data:', error);
        // Continue initialization even if loading fails
        renderHomeScreen();
    }
    
    showScreen('homeScreen');
    
    setTimeout(() => {
        document.querySelectorAll('.tile, .app-header').forEach(el => {
            el.classList.add('fade-in');
        });
    }, 100);
}

// Render home screen with upcoming assessments
function renderHomeScreen() {
    const upcomingContainer = document.getElementById('upcomingAssessmentsContainer');
    if (upcomingContainer) {
        upcomingContainer.innerHTML = renderUpcomingAssessments();
    }
    updateHomeStats();
}

// Populate the four home-screen stat tiles: Properties, Assessed, Best score, Reports
function updateHomeStats() {
    const properties = appState.properties || [];

    const totalProperties = properties.length;

    const assessedCount = properties.filter(p => {
        const progress = typeof calculateAssessmentProgress === 'function'
            ? calculateAssessmentProgress(p) : (p.progress || 0);
        return progress >= 100;
    }).length;

    const scores = properties
        .map(p => p.score)
        .filter(s => typeof s === 'number' && s > 0);
    const bestScore = scores.length ? Math.max(...scores) : 0;

    let reportsCount = 0;
    try {
        reportsCount = parseInt(localStorage.getItem('hbg_reports_generated') || '0', 10) || 0;
    } catch (e) {}

    const setStat = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setStat('statTotalProperties', totalProperties);
    setStat('statAssessed', assessedCount);
    setStat('statBestScore', bestScore || '-');
    setStat('statReports', reportsCount);
}
window.updateHomeStats = updateHomeStats;

// Increment the persisted "Reports generated" counter and refresh the home tile
function incrementReportsGenerated() {
    try {
        const current = parseInt(localStorage.getItem('hbg_reports_generated') || '0', 10) || 0;
        localStorage.setItem('hbg_reports_generated', String(current + 1));
    } catch (e) {}
    updateHomeStats();
}
window.incrementReportsGenerated = incrementReportsGenerated;

// Screen Management
function showScreen(screenId) {
    window.scrollTo(0, 0);
    if (appState.currentScreen && appState.currentScreen !== screenId) {
        appState.previousScreen = appState.currentScreen;
        // Navigation stack: push the screen we're leaving, unless we're going back
        if (!appState._navigatingBack) {
            appState.navStack = appState.navStack || [];
            appState.navStack.push(appState.currentScreen);
            if (appState.navStack.length > 20) appState.navStack.shift();
        }
        appState._navigatingBack = false;
    }

    if (appState.currentScreen === 'addPropertyScreen') {
        document.querySelectorAll('.property-type-card').forEach(card => {
            card.classList.remove('selected');
        });
    }

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        appState.currentScreen = screenId;
        updateBottomNav(screenId);
        if (screenId === 'settingsScreen') {
            syncThemeUI();
            if (typeof syncNotifToggleUI === 'function') syncNotifToggleUI();
        if (typeof syncAssessmentGuideToggleUI === 'function') syncAssessmentGuideToggleUI();
        }

        setTimeout(() => {
            // FIXED: Updated to target the correct classes after HTML changes
            targetScreen.querySelectorAll('.setup-section, .empty-state').forEach(el => {
                el.classList.add('fade-in');
            });
        }, 100);

        onScreenChanged(screenId);
        if (window._videoNotifScreenHook) window._videoNotifScreenHook(screenId);

        // Track every screen navigation
        trackEvent('screen_view', {
            screen_name: screenId,
            firebase_screen: screenId,
            firebase_screen_class: 'WebViewActivity'
        });

    } else {
        console.error(`Screen not found: ${screenId}`);
    }
}

// Handle home tile clicks
function handleHomeTileClick(screenId, tileElement) {
    document.querySelectorAll('.tile').forEach(tile => {
        tile.classList.remove('selected');
    });

    tileElement.classList.add('selected');

    setTimeout(() => {
        showScreen(screenId);
        setTimeout(() => {
            tileElement.classList.remove('selected');
        }, 300);
    }, 200);
}

// Handle screen change events
function onScreenChanged(screenId) {
    switch (screenId) {
        case 'propertyListScreen':
            // Flush the live assessment state first so progress/score/status are
            // up to date the moment the list renders (fixes stale "in progress").
            try {
                if (typeof saveCurrentAssessmentProgress === 'function' &&
                    appState.currentProperty &&
                    typeof assessmentState !== 'undefined' &&
                    assessmentState.propertyId === appState.currentProperty.id &&
                    assessmentState.scores && Object.keys(assessmentState.scores).length > 0) {
                    saveCurrentAssessmentProgress();
                }
            } catch (e) { console.log('Pre-render flush skipped:', e.message); }
            updatePropertyList();
            if (window.addLimitIndicators) window.addLimitIndicators();
            break;
        case 'addPropertyScreen':
            resetPropertyTypeSelection();
            resetPropertyFeatures();
            break;
        case 'propertyDetailsScreen':
            setTimeout(() => {
                const firstInput = document.getElementById('propertyAddress');
                if (firstInput) firstInput.focus();
            }, 100);
            break;
        case 'compareScreen':
            updateCompareScreen();
            break;
        case 'costCalculatorScreen':
            initializeStandaloneCostCalculator();
            break;	
        case 'settingsScreen':
            updateSettingsScreen();
            if (typeof updateCustomizeAssessmentPremiumTag === 'function') updateCustomizeAssessmentPremiumTag();
            break;
        case 'helpScreen':
            updateHelpScreen(); // This will now properly initialize the help system
            break;
        case 'homeScreen':
            try {
                if (typeof saveCurrentAssessmentProgress === 'function' &&
                    appState.currentProperty &&
                    typeof assessmentState !== 'undefined' &&
                    assessmentState.propertyId === appState.currentProperty.id &&
                    assessmentState.scores && Object.keys(assessmentState.scores).length > 0) {
                    saveCurrentAssessmentProgress();
                }
            } catch (e) { console.log('Pre-render flush skipped:', e.message); }
            // Home shows property cards too — rebuild them, not just the stats
            if (typeof updatePropertyList === 'function') updatePropertyList();
            renderHomeScreen();
            // Re-apply lock badges on home screen cards after rendering
            if (window.addLimitIndicators) window.addLimitIndicators();
            break;
        case 'assessmentResultsScreen':
            initializeAssessmentResults();
            break;
    }
}

// Property Type Selection
function selectPropertyType(type) {

    document.querySelectorAll('.property-type-card').forEach(card => {
        card.classList.remove('selected');
    });

    const clickedCard = event.target.closest('.property-type-card');
    if (clickedCard) {
        clickedCard.classList.add('selected');
    }

    appState.selectedPropertyType = type;

    const typeNames = {
        'house': 'House',
        'complex': 'Complex or Flat'
    };

    showSuccess(`${typeNames[type]} selected!`);

    // Show/hide complex name field
    const complexNameGroup = document.getElementById('complexNameGroup');
    if (type === 'complex') {
        complexNameGroup.style.display = 'block';
        document.getElementById('complexName').required = true;
    } else {
        complexNameGroup.style.display = 'none';
        document.getElementById('complexName').required = false;
    }

    setTimeout(() => {
        proceedToPropertyDetails(type);
    }, 1500);
}

function resetPropertyTypeSelection() {
    appState.selectedPropertyType = null;
    appState.editingPropertyId = null;
    document.querySelectorAll('.property-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    // FIXED: every NEW add-property flow must start from a completely blank
    // form. Previously only the type-display UI was reset — the underlying
    // form field VALUES (especially complexName, which stays hidden but
    // keeps its old value) persisted across sessions and even across
    // different property types, silently getting submitted onto the new
    // property. This is the single entry point for every fresh "add
    // property" flow (reached via showScreen('addPropertyScreen')), so
    // it's the correct place to guarantee a clean slate. Edit flows never
    // pass through here — they navigate directly to propertyDetailsScreen.
    clearPropertyDetailsForm();
}

// Fully reset the property details form to a blank state. Called at the
// start of every NEW property flow (never during edits — edit flows
// populate the form explicitly instead via their own population logic).
function clearPropertyDetailsForm() {
    const form = document.getElementById('propertyDetailsForm');
    if (form && typeof form.reset === 'function') {
        form.reset(); // clears all native inputs/selects/textareas, including complexName
    }

    // form.reset() doesn't affect non-form-control visual state:
    const complexGroup = document.getElementById('complexNameGroup');
    if (complexGroup) complexGroup.style.display = 'none';
    const complexInput = document.getElementById('complexName');
    if (complexInput) complexInput.required = false;

    // Clear any edit-mode header/back-button mutation left over from a
    // previous edit session
    const header = document.querySelector('#propertyDetailsScreen .screen-header h2');
    if (header) header.textContent = 'Property Details';
    const backBtn = document.querySelector('#propertyDetailsScreen .back-button');
    if (backBtn) backBtn.onclick = () => showScreen('addPropertyScreen');

    // Remove any feature-management UI injected during a previous edit session
    const featureContainer = document.getElementById('featureManagementContainer');
    if (featureContainer) featureContainer.remove();
}

function proceedToPropertyDetails(type) {
    const typeNames = {
        'house': 'House',
        'complex': 'Complex or Flat'
    };

    const typeIcons = {
        'house': 'fa-home',
        'complex': 'fa-building'
    };

    const propertyTypeDisplay = document.getElementById('selectedPropertyType');
    if (propertyTypeDisplay) {
        propertyTypeDisplay.innerHTML = `
            <i class="fas ${typeIcons[type]}"></i> ${typeNames[type]} Selected
        `;
    }

    showScreen('propertyDetailsScreen');
}

// Property List Management - Delegates to property-data.js
function updatePropertyList() {
    const emptyState = document.getElementById('emptyPropertyList');
    const propertyList = document.getElementById('propertyList');

    // Use getAllProperties from property-data.js
    const properties = window.getAllProperties ? window.getAllProperties() : appState.properties;

    if (properties.length === 0) {
        emptyState.style.display = 'block';
        propertyList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        propertyList.style.display = 'block';
        
        // Use renderPropertyList from property-data.js if available
        if (window.renderPropertyList) {
            window.renderPropertyList();
        } else {
            // Fallback basic rendering
            renderBasicPropertyList(properties);
        }
    }
}

// Basic fallback property list rendering
function renderBasicPropertyList(properties) {
    const container = document.getElementById('propertyList');
    container.innerHTML = properties.map(property => {
        const profilePic = getProfilePicture(property.id);
        const profilePicHtml = profilePic ? 
            `<img src="${profilePic}" alt="Property" class="property-profile-pic">` :
            `<div class="property-profile-pic-placeholder" onclick="event.stopPropagation(); window.selectProfilePicture('${property.id}')">
                <i class="fas fa-camera"></i>
                <span>Add Photo</span>
            </div>`;
        
        return `
            <div class="property-card interactive">
                <div class="property-header" onclick="openProperty('${property.id}')">
                    <div class="property-icon">
                        ${profilePicHtml}
                    </div>
                    <div class="property-info">
                        <h4>${property.address || 'Property Address'}</h4>
                        <p>${property.type} • ${property.bedrooms || 'N/A'} bed • ${property.bathrooms || 'N/A'} bath</p>
                        <div class="property-score">
							${property.score ? `Score: ${property.score}%` : 
							  'Not assessed'}
						</div>
                    </div>
                    <div class="property-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
                <div class="property-actions">
                    <button class="property-action-btn primary" onclick="event.stopPropagation(); ${property.score ? `viewPropertyAssessmentResults('${property.id}')` : `startAssessment('${property.id}')`}">
                        <i class="fas fa-clipboard-check"></i>
                        ${property.score ? 'Results' : 'Start'}
                    </button>
                    <button class="property-action-btn secondary" onclick="event.stopPropagation(); editProperty('${property.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="property-action-btn secondary" onclick="event.stopPropagation(); window.selectProfilePicture('${property.id}')">
                        <i class="fas fa-camera"></i>
                        Photo
                    </button>
                    <button class="property-action-btn danger" onclick="event.stopPropagation(); deleteProperty('${property.id}')">
                        <i class="fas fa-trash-alt"></i>
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getPropertyIcon(type) {
    const icons = {
        'house': 'home',
        'unit': 'building',
        'townhouse': 'city',
        'duplex': 'warehouse'
    };
    return icons[type] || 'home';
}

function openProperty(propertyId) {
    showSuccess('Property details coming soon!');
}

function getAllPropertyPhotos(property) {
    if (!window.photoManager || !property) {
        return [];
    }
    
    const allPhotos = [];
    
    // Get photos from photoManager instead of property object
    const propertyId = property.id;
    const photoKeys = Object.keys(window.photoManager.photos).filter(key => 
        key.startsWith(propertyId + '_')
    );
    
    photoKeys.forEach(key => {
        const [, roomId, ...itemTextParts] = key.split('_');
        const itemText = itemTextParts.join('_');
        const photos = window.photoManager.photos[key] || [];
        
        photos.forEach(photo => {
            allPhotos.push({
                ...photo,
                roomName: roomId.charAt(0).toUpperCase() + roomId.slice(1),
                itemName: itemText
            });
        });
    });
    
    return allPhotos;
}

// Screen update functions
function updateCompareScreen() {
}

function updateSettingsScreen() {
    renderSettingsItems();
    const versionStrip = document.querySelector('#settingsScreen .settings-version');
    if (versionStrip) {
        versionStrip.innerHTML = `Version ${APP_VERSION} &nbsp;&middot;&nbsp; Joel Apex Solutions`;
    }
}

// Add these new functions to app.js:

function renderSettingsItems() {
    const settingsList = document.querySelector('#settingsScreen .settings-list');
    if (!settingsList) return;
    
    const storageInfo = getStorageInfo();
    const appVersion = APP_VERSION;
    
    settingsList.innerHTML = `
        
        <div class="setting-item" onclick="toggleNotifications()">
            <div class="setting-icon">
                <i class="fas fa-bell"></i>
            </div>
            <div class="setting-info">
                <h4>Notifications</h4>
                <p>${appState.settings.notifications ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div class="setting-arrow">
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>

        <div class="setting-item" onclick="showStorageInfo()">
            <div class="setting-icon">
                <i class="fas fa-database"></i>
            </div>
            <div class="setting-info">
                <h4>Storage Usage</h4>
                <p>${storageInfo.propertiesCount} properties ${storageInfo.photosCount} photos</p>
            </div>
            <div class="setting-arrow">
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>

        <div class="setting-item" onclick="exportAppData()">
            <div class="setting-icon">
                <i class="fas fa-download"></i>
            </div>
            <div class="setting-info">
                <h4>Export Data</h4>
                <p>Backup your property data</p>
            </div>
            <div class="setting-arrow">
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>

        <div class="setting-item" onclick="showAboutModal()">
            <div class="setting-icon">
                <i class="fas fa-info-circle"></i>
            </div>
            <div class="setting-info">
                <h4>About Home Buyers Guide SA</h4>
                <p>Version ${appVersion}</p>
            </div>
            <div class="setting-arrow">
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>

        <div class="setting-item danger-setting" onclick="resetApp()">
            <div class="setting-icon">
                <i class="fas fa-trash-alt"></i>
            </div>
            <div class="setting-info">
                <h4>Reset All Data</h4>
                <p>Clear all properties and start fresh</p>
            </div>
            <div class="setting-arrow">
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>
    `;
}

function toggleTheme() {
    const newTheme = appState.settings.theme === 'dark' ? 'light' : 'dark';
    appState.settings.theme = newTheme;
    
    // Apply theme (currently only dark mode is styled)
    if (newTheme === 'light') {
        showModal('Theme Change', 'Light mode coming in future update!');
    } else {
        showSuccess('Dark mode enabled');
    }
    
    saveAppData();
    renderSettingsItems();
}


function syncNotifToggleUI() {
    const on = appState.settings.notifications;
    const toggle = document.getElementById('notifToggle');
    const label = document.getElementById('notifStatusLabel');
    if (toggle) toggle.classList.toggle('on', on);
    if (label) label.textContent = on ? 'Reminders are on' : 'Reminders are off';
}
window.syncNotifToggleUI = syncNotifToggleUI;

function toggleAssessmentGuide() {
    const isOn = localStorage.getItem('hasSeenAssessmentGuide') !== 'true';
    if (isOn) {
        localStorage.setItem('hasSeenAssessmentGuide', 'true');
    } else {
        localStorage.removeItem('hasSeenAssessmentGuide');
    }
    syncAssessmentGuideToggleUI();
}

function syncAssessmentGuideToggleUI() {
    const isOn = localStorage.getItem('hasSeenAssessmentGuide') !== 'true';
    const toggle = document.getElementById('assessmentGuideToggle');
    const label  = document.getElementById('assessmentGuideLabel');
    if (toggle) toggle.classList.toggle('on', isOn);
    if (label)  label.textContent = isOn
        ? 'Shown when you start an assessment'
        : 'Hidden — tap to show again';
}
window.syncAssessmentGuideToggleUI = syncAssessmentGuideToggleUI;

// ── Customize Assessment — premium gate ──────────────────────────────────────
// Called from the Settings screen row. Only premium users can access this.
function openCustomizeAssessment() {
    if (window.premiumState && !window.premiumState.isPremium) {
        if (window.showPremiumModal) window.showPremiumModal('customize_assessment');
        return;
    }
    showScreen('customizeAssessmentScreen');
    if (typeof initCustomizeScreen === 'function') initCustomizeScreen();
}
window.openCustomizeAssessment = openCustomizeAssessment;

// Show/hide the crown tag on the Customize Assessment row based on premium status
function updateCustomizeAssessmentPremiumTag() {
    var tag = document.getElementById('customizeAssessmentPremiumTag');
    if (!tag) return;
    var isPremium = window.premiumState && window.premiumState.isPremium;
    tag.style.display = isPremium ? 'none' : 'inline-flex';
}
window.updateCustomizeAssessmentPremiumTag = updateCustomizeAssessmentPremiumTag;

function toggleNotifications() {
    appState.settings.notifications = !appState.settings.notifications;
    syncNotifToggleUI();
    showSuccess(appState.settings.notifications ? 'Reminders enabled' : 'Reminders disabled');
    
    saveAppData();
    renderSettingsItems();
}

function getStorageInfo() {
    const properties = getAllProperties();
    let photosCount = 0;
    
    if (window.photoManager && window.photoManager.photos) {
        photosCount = Object.values(window.photoManager.photos).reduce((total, photos) => total + photos.length, 0);
    }
    
    return {
        propertiesCount: properties.length,
        photosCount: photosCount,
        storageSize: '0 MB' // Could be enhanced later
    };
}

function showStorageInfo() {
    const info = getStorageInfo();
    
    showModal('Storage Information', `
        <div class="storage-info-modal">
            <div class="storage-item">
                <div class="storage-icon">
                    <i class="fas fa-home"></i>
                </div>
                <div class="storage-details">
                    <h4>Properties</h4>
                    <p>${info.propertiesCount} properties saved</p>
                </div>
            </div>
            
            <div class="storage-item">
                <div class="storage-icon">
                    <i class="fas fa-camera"></i>
                </div>
                <div class="storage-details">
                    <h4>Photos</h4>
                    <p>${info.photosCount} photos captured</p>
                </div>
            </div>
            
            <div class="storage-item">
                <div class="storage-icon">
                    <i class="fas fa-database"></i>
                </div>
                <div class="storage-details">
                    <h4>Storage Type</h4>
                    <p>Device storage (unlimited)</p>
                </div>
            </div>
            
            <div class="storage-warning">
                <i class="fas fa-info-circle"></i>
                Photos are stored locally on your device and never uploaded to any server.
            </div>
        </div>
    `);
}

function exportAppData() {
    try {
        const properties = getAllProperties();
        const exportData = {
            properties: properties,
            settings: appState.settings,
            exportDate: new Date().toISOString(),
            appVersion: APP_VERSION
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `home-buyers-guide-sa-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showSuccess('Data exported successfully!');
        
    } catch (error) {
        console.error('Export failed:', error);
        showModal('Export Error', 'Failed to export data. Please try again.');
    }
}

function showAboutModal() {
    showModal('About Home Buyers Guide SA', `
        <div class="about-modal-content">
            <div class="about-header">
                <div class="about-icon">
                    <i class="fas fa-home"></i>
                </div>
                <h3>Home Buyers Guide SA</h3>
                <p class="version">Version ${APP_VERSION}</p>
            </div>
            
            <div class="about-features">
                <h4>Features</h4>
                <ul class="feature-list">
                    <li><i class="fas fa-check"></i> Property assessment & scoring</li>
                    <li><i class="fas fa-check"></i> Photo capture & management</li>
                    <li><i class="fas fa-check"></i> Cost calculator</li>
                    <li><i class="fas fa-check"></i> Assement Report Downloads</li>
                    <li><i class="fas fa-check"></i> Offline storage</li>
                </ul>
            </div>
            
            <div class="about-footer">
                <p>Built to help property buyers make informed decisions</p>
                <p class="copyright">© 2025 Home Buyers Guide SA by Joel Apex Solutions</p>
            </div>
        </div>
    `);
}

// Enhanced reset function with better styling
function resetApp() {
    showModal(
        'Reset All Data?', 
        `<div class="reset-modal-content">
            <div class="reset-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <p><strong>This action cannot be undone!</strong></p>
            <p>All your properties, assessments, and photos will be permanently deleted.</p>
            
            <div class="reset-summary">
                <div class="reset-item">
                    <span class="reset-count">${getAllProperties().length}</span>
                    <span class="reset-label">Properties</span>
                </div>
                <div class="reset-item">
                    <span class="reset-count">${getPhotoCount()}</span>
                    <span class="reset-label">Photos</span>
                </div>
            </div>
        </div>`, 
        () => {
            // Clear all data
            appState.properties = [];
            appState.selectedPropertyType = null;
            appState.currentProperty = null;

            // Clear localStorage
            localStorage.removeItem('propertyInspectorData');
            
            // Clear photos from IndexedDB
            if (window.photoManager && window.photoManager.clearAllPhotos) {
                window.photoManager.clearAllPhotos();
            }
            
            updatePropertyCount();
            showScreen('homeScreen');
            showSuccess('All data has been reset!');
        }, 
        'Delete Everything',
        null,
        'Cancel'
    );
}

function getPhotoCount() {
    if (window.photoManager && window.photoManager.photos) {
        return Object.values(window.photoManager.photos).reduce((total, photos) => total + photos.length, 0);
    }
    return 0;
}

function updateHelpScreen() {
    
    // Initialize the help system
    if (window.renderHelpScreen) {
        setTimeout(() => {
            window.renderHelpScreen();
        }, 100);
    }
    
    // Add fade-in animation
    setTimeout(() => {
        document.querySelectorAll('.help-category-card, .quick-link').forEach(card => {
            card.classList.add('fade-in');
        });
    }, 200);
}

// Settings Functions
function resetApp() {
    showModal(
        'Reset All Data?', 
        `<div class="reset-modal-content">
            <div class="reset-warning-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h4>This action cannot be undone!</h4>
            <p>All your properties, assessments, and photos will be permanently deleted.</p>
            
            <div class="reset-data-summary">
                <div class="reset-item">
                    <span class="reset-count">${getAllProperties().length}</span>
                    <span class="reset-label">Properties</span>
                </div>
                <div class="reset-item">
                    <span class="reset-count">${getPhotoCount()}</span>
                    <span class="reset-label">Photos</span>
                </div>
            </div>
            
            <div class="reset-warning-text">
                <strong>Are you sure you want to continue?</strong>
            </div>
        </div>`, 
        () => {
            // Clear all data
            appState.properties = [];
            appState.selectedPropertyType = null;
            appState.currentProperty = null;

            // Clear localStorage
            localStorage.removeItem('propertyInspectorData');
            
            // Clear photos from IndexedDB
            if (window.photoManager && window.photoManager.clearAllPhotos) {
                window.photoManager.clearAllPhotos();
            }
            
            updatePropertyCount();
            showScreen('homeScreen');
            showSuccess('All data has been reset!');
        }, 
        'Delete Everything',
        null,
        'Cancel'
    );
}

function exitApp() {
    showModal(
        'Exit Home Buyers Guide SA?', 
        `<div class="exit-modal-content">
            <div class="exit-icon">
                <i class="fas fa-sign-out-alt"></i>
            </div>
            <p>Are you sure you want to close Home Buyers Guide SA?</p>
            <p class="exit-warning">Any unsaved changes will be automatically saved.</p>
        </div>`, 
        () => {
            try {
                
                // Save any pending data before exit
                saveAppData();
                
                // Try different methods to close the app
                if (window.Android && typeof window.Android.exitApp === 'function') {
                    window.Android.exitApp();
                } else if (typeof window.close === 'function') {
                    window.close();
                } else {
                    window.history.back();
                }
            } catch (error) {
                console.error('Error during app exit:', error);
                // Still try to close even if there's an error
                window.history.back();
            }
        }, 
        'Exit App',
        () => {
        },
        'Cancel'
    );
}

// Success Animation
function showSuccess(message) {
    const successAnimation = document.getElementById('successAnimation');
    const successMessage = document.getElementById('successMessage');

    successMessage.textContent = message;
    successAnimation.classList.add('show');

    setTimeout(() => {
        successAnimation.classList.remove('show');
    }, 2000);
}

// Modal system for property-data.js integration
function showModal(title, content, onConfirm, confirmText = 'OK', onCancel = null, cancelText = 'Cancel') {
    
    // Remove existing modal if any
    const existingModal = document.getElementById('customModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'customModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modalTitle">${title}</h3>
                <button class="modal-close-btn" id="modalCloseBtn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" id="modalBody">${content}</div>
            <div class="modal-footer" id="modalFooter"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners IMMEDIATELY - no setTimeout
    const modalFooter = document.getElementById('modalFooter');
    
    if (!modalFooter) {
        console.error('Modal footer not found!');
        return;
    }
    
    // Add cancel button if callback provided
    if (onCancel) {
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = cancelText;
        cancelBtn.className = 'cancel-button';
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            modal.remove();
            try {
                if (typeof onCancel === 'function') {
                    onCancel();
                }
            } catch (error) {
                console.error('Error in cancel callback:', error);
            }
        });
        modalFooter.appendChild(cancelBtn);
    }
    
    // Add confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = confirmText;
    confirmBtn.className = 'save-button';
    confirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            if (typeof onConfirm === 'function') {
                onConfirm();
                modal.remove();
            } else {
                console.error('onConfirm is not a function:', typeof onConfirm);
                modal.remove();
            }
        } catch (error) {
            console.error('Error in confirm callback:', error);
            modal.remove();
        }
    });
    modalFooter.appendChild(confirmBtn);
    
    // Add close button functionality
    const closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            modal.remove();
        });
    }
    
    // Show modal
    modal.style.display = 'flex';
}

function hideModal() {
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.remove();
    }
}

// Data Management - Simplified, delegates to property-data.js
function saveAppData() {
    try {
        const properties = window.getAllProperties ? window.getAllProperties() : appState.properties;
        
        // Only save basic property info to localStorage
		const basicProperties = properties.map(prop => ({
		id: prop.id,
		address: prop.address,
		suburb: prop.suburb,
		type: prop.type,
		bedrooms: prop.bedrooms,
		bathrooms: prop.bathrooms,
		parking: prop.parking,
		size: prop.size,
		price: prop.price,
		notes: prop.notes,
		assessmentDate: prop.assessmentDate,
		saleLink: prop.saleLink,
		score: prop.score,
		hasProfilePicture: prop.hasProfilePicture,
		profilePictureUpdated: prop.profilePictureUpdated,
		createdAt: prop.createdAt,
		updatedAt: prop.updatedAt,
		assessedAt: prop.assessedAt,
		features: prop.features,
		activatedCustomItems: prop.activatedCustomItems || [],
		customAssessments: prop.customAssessments || {},
		customGuidanceNotes: prop.customGuidanceNotes || {}
	}));
        
        // Save detailed assessments to IndexedDB
        if (window.saveAssessmentsToIndexedDB) {
            window.saveAssessmentsToIndexedDB(properties);
        }
        
        const dataToSave = {
            properties: basicProperties,
            settings: appState.settings,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('propertyInspectorData', JSON.stringify(dataToSave));
        
    } catch (error) {
        console.error('Failed to save app data:', error);
    }
}

function loadAppData() {
    try {
        const savedData = localStorage.getItem('propertyInspectorData');
        if (savedData) {
            const data = JSON.parse(savedData);
            appState.properties = data.properties || [];
            appState.settings = { ...appState.settings, ...data.settings };
            
            // Ensure photos are never loaded from localStorage
            appState.properties.forEach(property => {
                property.photos = null; // Explicitly remove any photo data
            });
            
            // Photos will be loaded separately from IndexedDB by photoManager
        }
    } catch (error) {
        console.error('Failed to load app data:', error);
        appState.properties = [];
        
        // Try to recover from corrupted localStorage
        try {
            localStorage.removeItem('propertyInspectorData');
        } catch (clearError) {
            console.error('Could not clear localStorage:', clearError);
        }
    }
}

// Load assessment data from IndexedDB
async function loadAssessmentsFromIndexedDB() {
    try {
        if (!window.photoManager) return;
        
        const db = await window.photoManager.initIndexedDB();
        const transaction = db.transaction(['assessments'], 'readonly');
        const store = transaction.objectStore('assessments');
        
        return new Promise((resolve) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const assessments = request.result;
                
                // Merge assessment data back into properties
                assessments.forEach(assessmentData => {
                    const property = appState.properties.find(p => p.id === assessmentData.propertyId);
                    if (property) {
                        // Load assessments — with backward compat for old format
                        property.assessments = assessmentData.assessments ||
                                               assessmentData.detailedAssessments ||
                                               assessmentData.quickAssessments || {};

                        property.roomNotes = assessmentData.roomNotes ||
                                             assessmentData.detailedRoomNotes ||
                                             assessmentData.quickRoomNotes || {};

                        property.itemNotes = assessmentData.itemNotes || {};

                        property.questionResponses = assessmentData.questionResponses ||
                                                     assessmentData.detailedQuestionResponses ||
                                                     assessmentData.quickQuestionResponses || {};

                        property.roomInstances = assessmentData.roomInstances ||
                                                 assessmentData.detailedRoomInstances ||
                                                 assessmentData.quickRoomInstances || {};

                        property.progress = assessmentData.progress ||
                                            assessmentData.detailedAssessmentProgress ||
                                            assessmentData.quickAssessmentProgress || 0;

                        property.score = assessmentData.score ||
                                         assessmentData.detailedScore ||
                                         assessmentData.quickScore || undefined;

                        property.roomScores = assessmentData.roomScores || {};

                        // Restore custom feature activation and ratings
                        if (assessmentData.activatedCustomItems) {
                            property.activatedCustomItems = assessmentData.activatedCustomItems;
                        }
                        if (assessmentData.customAssessments) {
                            property.customAssessments = assessmentData.customAssessments;
                        }
                        if (assessmentData.customGuidanceNotes) {
                            property.customGuidanceNotes = assessmentData.customGuidanceNotes;
                        }
                    }
                });
                
                // Refresh property lists & home stats now that data is loaded
                if (typeof renderPropertyList === 'function') {
                    try { renderPropertyList(); } catch (e) {}
                }
                resolve();
            };
            request.onerror = () => resolve();
        });
    } catch (error) {
        console.error('Error loading assessments:', error);
    }
}

function updatePropertyCount() {
    const properties = window.getAllProperties ? window.getAllProperties() : appState.properties;
}

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function addInteractiveEffects() {
    document.querySelectorAll('.interactive').forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
        });

        element.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });
}

// ====================================================================
// CLEAN PROPERTY FEATURES MANAGEMENT SYSTEM
// ====================================================================

// Property features state - SINGLE SOURCE OF TRUTH
let propertyFeatures = {
    internal: [],
    external: [],
    other: []
};

// Auto-populate assessment rooms based on property details
function autoPopulateAssessmentRooms(property) {
    if (!property.features) {
        property.features = { internal: [], external: [], other: [] };
    }

    // Seed default internal features: Bedrooms, Bathrooms, Kitchen, Lounge
    const defaultInternal = getDefaultInternalSeeds(property);
    for (let i = defaultInternal.length - 1; i >= 0; i--) {
        const def = defaultInternal[i];
        if (!property.features.internal.find(f => f.id === def.id)) {
            property.features.internal.unshift({ ...def });
        }
    }

    // Seed default external features: Garden (houses), Parking/Garages
    const defaultExternal = getDefaultExternalSeeds(property);
    for (const def of defaultExternal) {
        if (!property.features.external.find(f => f.id === def.id)) {
            property.features.external.push({ ...def });
        }
    }

    return property;
}

function hasExistingFeature(property, featureId) {
    if (!property.features) return false;
    
    for (const [category, features] of Object.entries(property.features)) {
        if (Array.isArray(features) && features.some(f => f.id === featureId)) {
            return true;
        }
    }
    return false;
}

// Central definition of default internal features every property always has.
// Called on CREATE (autoPopulateAssessmentRooms) and on LOAD (loadPropertyFeatures).
function getDefaultInternalSeeds(property) {
    return [
        { id: 'bedrooms', name: 'Bedrooms', quantity: parseInt(property.bedrooms) || 1 },
        { id: 'bathrooms', name: 'Bathrooms', quantity: parseInt(property.bathrooms) || 1 },
        { id: 'kitchen', name: 'Kitchen', quantity: 1 },
        { id: 'lounge', name: 'Lounge', quantity: 1 },
    ];
}

// Default external features — conditional on property type and parking count.
function getDefaultExternalSeeds(property) {
    const seeds = [];
    if (property.type === 'house') {
        seeds.push({ id: 'garden-areas', name: 'Garden', quantity: 1 });
    }
    if (property.parking && parseInt(property.parking) > 0) {
        seeds.push({ id: 'garages', name: 'Parking / Garages', quantity: parseInt(property.parking) || 1 });
    }
    return seeds;
}

// Reset property features when starting new property
function resetPropertyFeatures() {
    propertyFeatures = {
        internal: [],
        external: [],
        other: []
    };
}

// Load existing property features when editing
function loadPropertyFeatures(property) {
    if (property && property.features) {
        propertyFeatures = {
            internal: [...(property.features.internal || [])],
            external: [...(property.features.external || [])],
            other: [...(property.features.other || [])]
        };
    } else {
        resetPropertyFeatures();
    }

    if (property) {
        // Ensure default internal features (handles old properties too)
        const defaultInternal = getDefaultInternalSeeds(property);
        for (let i = defaultInternal.length - 1; i >= 0; i--) {
            const def = defaultInternal[i];
            const existingIdx = propertyFeatures.internal.findIndex(
                f => f.id === def.id || f.name.toLowerCase() === def.name.toLowerCase()
            );
            if (existingIdx === -1) {
                // Feature not found — add it with the correct quantity
                propertyFeatures.internal.unshift({ ...def });
            } else {
                // Feature exists — ALWAYS sync the quantity from the property fields
                // so the edit screen always reflects what was set in the form.
                // This fixes old properties that have the feature stored without quantity.
                propertyFeatures.internal[existingIdx].quantity = def.quantity;
            }
        }

        // Ensure default external features (Garden, Parking/Garages)
        const defaultExternal = getDefaultExternalSeeds(property);
        for (const def of defaultExternal) {
            const existingIdx = propertyFeatures.external.findIndex(
                f => f.id === def.id || f.name.toLowerCase() === def.name.toLowerCase()
            );
            if (existingIdx === -1) {
                propertyFeatures.external.push({ ...def });
            } else {
                // Sync Parking qty from property.parking
                propertyFeatures.external[existingIdx].quantity = def.quantity;
            }
        }
    }
}

// SINGLE ADD FEATURE FUNCTION - Used by property details screen
function addFeatureToProperty(category) {
    const dropdown = document.getElementById(category + 'FeaturesView');
    if (!dropdown) {
        console.error(`Dropdown not found: ${category}FeaturesView`);
        return;
    }
    
    const selectedValue = dropdown.value;
    const selectedText = dropdown.options[dropdown.selectedIndex].text;
    
    if (!selectedValue) {
        alert('Please select a feature to add');
        return;
    }
    
    // Check if feature already exists - if so, increase quantity instead
    const existingFeature = propertyFeatures[category].find(f => f.id === selectedValue);
    if (existingFeature) {
        existingFeature.quantity = (existingFeature.quantity || 1) + 1;
        showSuccess('Feature quantity increased!');
    } else {
        // Add new feature
        propertyFeatures[category].push({
            id: selectedValue,
            name: selectedText,
            quantity: 1
        });
        showSuccess('Feature added successfully!');
    }
    
    // Update current property if it exists
    if (appState.currentProperty) {
        if (!appState.currentProperty.features) {
            appState.currentProperty.features = { internal: [], external: [], other: [] };
        }
        appState.currentProperty.features[category] = [...propertyFeatures[category]];
        
        // Save to storage
        updateProperty(appState.currentProperty.id, { features: appState.currentProperty.features });
        
        // Sync with assessment if available
        syncWithAssessment(category, selectedValue, 'add');
    }
    
    // Clear dropdown
    dropdown.value = '';
    
    // Re-render the current screen
    if (appState.currentScreen === 'propertyDetailViewScreen') {
        renderPropertyDetailView(appState.currentProperty);
    } else {
        renderFeaturesList(category);
    }
}

// SINGLE REMOVE FEATURE FUNCTION - Used by property details screen
function removeFeatureFromProperty(category, featureName) {
    if (!confirm(`Remove ${featureName}?`)) return;
    
    // Find and remove from local state
    const featureIndex = propertyFeatures[category].findIndex(f => f.name === featureName);
    if (featureIndex === -1) return;
    
    const removedFeature = propertyFeatures[category][featureIndex];
    propertyFeatures[category].splice(featureIndex, 1);
    
    // Update current property if it exists
    if (appState.currentProperty) {
        if (appState.currentProperty.features) {
            appState.currentProperty.features[category] = [...propertyFeatures[category]];
            
            // Save to storage
            updateProperty(appState.currentProperty.id, { features: appState.currentProperty.features });
            
            // Sync with assessment if available
            syncWithAssessment(category, removedFeature.id, 'remove');
        }
    }
    
    showSuccess('Feature removed successfully!');
    
    // Re-render the current screen
    if (appState.currentScreen === 'propertyDetailViewScreen') {
        renderPropertyDetailView(appState.currentProperty);
    } else {
        renderFeaturesList(category);
    }
}

// UPDATE FEATURE QUANTITY
function updateFeatureQuantity(category, featureName, change) {
    const feature = propertyFeatures[category].find(f => f.name === featureName);
    if (!feature) return;
    
    feature.quantity = Math.max(1, Math.min(20, (feature.quantity || 1) + change));
    
    // Update current property if it exists
    if (appState.currentProperty && appState.currentProperty.features) {
        appState.currentProperty.features[category] = [...propertyFeatures[category]];
    }
    
    // Re-render the current screen
    if (appState.currentScreen === 'propertyDetailViewScreen') {
        renderPropertyDetailView(appState.currentProperty);
    } else {
        renderFeaturesList(category);
    }
}

// SYNC WITH ASSESSMENT SYSTEM
function syncWithAssessment(category, featureId, action) {
    if (action === 'add' && window.updateAssessmentWithNewFeature) {
        window.updateAssessmentWithNewFeature(category, featureId);
    } else if (action === 'remove' && window.removeFeatureFromAssessment) {
        const featureName = getFeatureNameFromId(featureId);
        window.removeFeatureFromAssessment(category, featureName);
    }
}

// Helper function to get feature name from ID
function getFeatureNameFromId(featureId) {
    const idToNameMap = {
        'lounge': 'Lounge',
        'garden-areas': 'Garden',
        'swimming-pool': 'Pool',
        'water-features': 'Water Features',
        'family-tv-rooms': 'Family/TV Rooms',
        'dining-room': 'Dining Room',
        'reception': 'Reception',
        'study-office': 'Study/Office',
        'laundry-room': 'Laundry Room',
        'home-theater': 'Home Theater',
        'gate-entrance': 'Gate/Entrance',
        'security-safety': 'Security/Safety',
        'garages': 'Garages',
        'solar-power': 'Solar Power',
        'backup-power': 'Backup Power/UPS',
        'borehole': 'Borehole',
        'irrigation-systems': 'Irrigation Systems',
        'water-tank': 'Water Tank/Storage',
        'gas-installation': 'Gas Installation',
        'outbuildings': 'Outbuildings',
        'internet-fibre': 'Internet Access/Fibre',
        'sports-court': 'Sports Court',
        'smart-home': 'Smart Home',
        'air-conditioning': 'Air Conditioning',
        'heating-systems': 'Heating Systems'
    };
    
    return idToNameMap[featureId] || featureId;
}

// RENDER FEATURES LIST
function renderFeaturesList(category) {
    const container = document.getElementById(category + 'FeaturesViewList');
    if (!container) return;
    
    const features = propertyFeatures[category] || [];
    
    container.innerHTML = features.map(feature => `
        <div class="feature-item">
            <div class="feature-info">
                <div class="feature-name">
                    <i class="fas fa-check-circle"></i>
                    ${feature.name}
                </div>
                <div class="quantity-selector">
                    <button class="quantity-btn" onclick="updateFeatureQuantity('${category}', '${feature.name}', -1)">-</button>
                    <div class="quantity-display">${feature.quantity || 1}</div>
                    <button class="quantity-btn" onclick="updateFeatureQuantity('${category}', '${feature.name}', 1)">+</button>
                </div>
            </div>
            <button class="remove-feature-btn" onclick="removeFeatureFromProperty('${category}', '${feature.name}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// ====================================================================
// PROPERTY FORM SUBMISSION - CLEANED AND ENHANCED
// ====================================================================

// Property Details Form Submission - Enhanced with proper sync
function handlePropertyDetailsSubmit(event) {
    event.preventDefault();
    
    const formData = {
        type: appState.selectedPropertyType,
        complexName: document.getElementById('complexName').value,
        address: document.getElementById('propertyAddress').value,
        suburb: document.getElementById('propertySuburb').value,
        bedrooms: document.getElementById('propertyBedrooms')?.value || '',
        bathrooms: document.getElementById('propertyBathrooms')?.value || '',
        parking: document.getElementById('propertyParking')?.value || '',
        size: document.getElementById('propertySize')?.value || '',
        price: document.getElementById('propertyPrice').value,
        notes: document.getElementById('propertyNotes').value,
        assessmentDate: document.getElementById('assessmentDate')?.value || null,
        features: propertyFeatures
    };

    if (!formData.address) {
        alert('Please fill in the property address');
        return;
    }

    let savedProperty;
    
    if (appState.editingPropertyId) {
        // Before saving, sync property fields from feature quantities
        // so property.bedrooms always matches the Bedrooms feature qty
        const bedroomsFeature = propertyFeatures.internal?.find(f => f.id === 'bedrooms');
        if (bedroomsFeature && bedroomsFeature.quantity > 1) {
            formData.bedrooms = String(bedroomsFeature.quantity);
        }
        const bathroomsFeature = propertyFeatures.internal?.find(f => f.id === 'bathrooms');
        if (bathroomsFeature && bathroomsFeature.quantity > 1) {
            formData.bathrooms = String(bathroomsFeature.quantity);
        }
        const parkingFeature = propertyFeatures.external?.find(f => f.id === 'garages');
        if (parkingFeature && parkingFeature.quantity > 0) {
            formData.parking = String(parkingFeature.quantity);
        }

        savedProperty = window.propertyDataManager.updateProperty(appState.editingPropertyId, formData);
        // Also ensure defaults are seeded/updated in case property was created before auto-seeding
        savedProperty = autoPopulateAssessmentRooms(savedProperty);
        window.propertyDataManager.updateProperty(savedProperty.id, savedProperty);
        appState.editingPropertyId = null;
        showSuccess('Property updated successfully!');
        
        if (window.updateAssessmentWithProperty) {
            window.updateAssessmentWithProperty(savedProperty);
        }
    } else {
        savedProperty = window.propertyDataManager.createProperty(formData);
        savedProperty = autoPopulateAssessmentRooms(savedProperty);
        window.propertyDataManager.updateProperty(savedProperty.id, savedProperty);
        showSuccess('Property created successfully!');
    }
    
    appState.currentProperty = savedProperty;
	updatePropertyCount();

	setTimeout(() => {
		showScreen('propertyListScreen');
	}, 1500);
}

// ====================================================================
// PROPERTY DETAIL VIEW FUNCTIONS
// ====================================================================

// Property Details Screen State
const propertyDetailsState = {
    currentImageIndex: 0,
    sectionsExpanded: {
        overview: true,
        details: false,
        financial: false,
        assessment: false,
        photos: false,
        links: false
    }
};

// Main Property Detail View Renderer
function renderPropertyDetailView(property) {
    // Load property features into local state
    loadPropertyFeatures(property);
    
    const container = document.getElementById('propertyDetailContainer');
    const propertyPhotos = getAllPropertyPhotos(property);
    
    container.innerHTML = `
        <div class="property-detail-view">
            <!-- Property Image Gallery Section -->
            <div class="property-gallery-section">
                ${renderPropertyGallery(property, propertyPhotos)}
            </div>
            
            <!-- Simple Property Overview -->
            ${renderPropertyOverview(property)}
            
            <!-- Property Details Section - SIMPLIFIED -->
            <div class="detail-section-container">
                <div class="detail-section-header" onclick="toggleDetailSection('details')">
                    <div class="section-title">
                        <i class="fas fa-info-circle"></i>
                        <h3>Property Details</h3>
                    </div>
                    <div class="section-toggle ${propertyDetailsState.sectionsExpanded.details ? '' : 'collapsed'}">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="detail-section-content ${propertyDetailsState.sectionsExpanded.details ? 'expanded' : 'collapsed'}">
                    ${renderPropertyDetailsSimplified(property)}
                </div>
            </div>
            
            <!-- Financial Information Section -->
            <div class="detail-section-container">
                <div class="detail-section-header" onclick="toggleDetailSection('financial')">
                    <div class="section-title">
                        <i class="fas fa-dollar-sign"></i>
                        <h3>Financial Information & Cost Calculator</h3>
                    </div>
                    <div class="section-toggle ${propertyDetailsState.sectionsExpanded.financial ? '' : 'collapsed'}">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="detail-section-content ${propertyDetailsState.sectionsExpanded.financial ? 'expanded' : 'collapsed'}">
                    <!-- Quick Overview -->
                    <div class="financial-overview">
                        <div class="financial-item">
                            <label>Asking Price</label>
                            <span class="value price-highlight">${property.price ? 'R ' + property.price.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : 'Not specified'}</span>
                        </div>
                    </div>
                    
                    <!-- Cost Calculator -->
                    <div id="costCalculatorContent">
                        <!-- Calculator will be loaded here -->
                    </div>
                    
                    <!-- Additional Information -->
                    <div class="financial-disclaimer">
                        <div class="disclaimer-box">
                            <h4>
                                <i class="fas fa-info-circle"></i>
                                Important Information
                            </h4>
                            <ul>
                                <li>All calculations are estimates based on current South African regulations</li>
                                <li>Interest rates may vary between banks and depend on your credit profile</li>
                                <li>Budget 8-10% of purchase price for additional costs</li>
                                <li>Consider a 105% bond to finance transfer costs</li>
                                <li>Consult with a mortgage originator for personalized quotes</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Assessment Section -->
            <div class="detail-section-container">
                <div class="detail-section-header" onclick="toggleDetailSection('assessment')">
                    <div class="section-title">
                        <i class="fas fa-clipboard-check"></i>
                        <h3>Assessment Results</h3>
                    </div>
                    <div class="section-toggle ${propertyDetailsState.sectionsExpanded.assessment ? '' : 'collapsed'}">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="detail-section-content ${propertyDetailsState.sectionsExpanded.assessment ? 'expanded' : 'collapsed'}">
                    ${renderAssessmentSection(property)}
                </div>
            </div>
            
            <!-- Photos Section -->
            <div class="detail-section-container">
                <div class="detail-section-header" onclick="toggleDetailSection('photos')">
                    <div class="section-title">
                        <i class="fas fa-camera"></i>
                        <h3>All Photos</h3>
                        <span class="section-status">${propertyPhotos.length} Photos</span>
                    </div>
                    <div class="section-toggle ${propertyDetailsState.sectionsExpanded.photos ? '' : 'collapsed'}">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="detail-section-content ${propertyDetailsState.sectionsExpanded.photos ? 'expanded' : 'collapsed'}">
                    ${renderPhotosSectionThumbnails(property, propertyPhotos)}
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="detail-actions">
                <button class="action-btn primary" onclick="startAssessment('${property.id}')">
                    <i class="fas fa-clipboard-check"></i>
                    ${(window.calculateAssessmentProgress && calculateAssessmentProgress(property) >= 100) ? 'Update Assessment'
                      : (window.calculateAssessmentProgress && calculateAssessmentProgress(property) > 0) ? 'Continue Assessment'
                      : 'Start Assessment'}
                </button>
                <button class="action-btn secondary" onclick="editProperty('${property.id}')">
                    <i class="fas fa-edit"></i> Edit Property
                </button>
            </div>
    `;

    // Initialize cost calculator
    setTimeout(() => {
        initializeCostCalculator(property);
    }, 100);
}

// Property Gallery Renderer
function renderPropertyGallery(property, propertyPhotos) {
    // Score badge overlay — only when assessment is 100% complete
    let scoreOverlay = '';
    try {
        const prog = window.calculateAssessmentProgress ? calculateAssessmentProgress(property) : 0;
        if (prog >= 100 && property.score) {
            const g = window.getScoreGrade ? getScoreGrade(property.score)
                : { grade: property.score >= 83 ? 'excellent' : property.score >= 66 ? 'good' : property.score >= 46 ? 'fair' : 'poor' };
            scoreOverlay = `
                <div class="prop-score-badge ${g.grade}">
                    <div class="psb-label">Assessment Score</div>
                    <div class="psb-value">
                        <span class="psb-num">${property.score}</span>
                        <span class="psb-out">/100</span>
                    </div>
                </div>`;
        }
    } catch (e) {}

    // Profile picture — same source as the property cards
    const profilePic = (window.photoManager && window.photoManager.profilePictures
        ? window.photoManager.profilePictures[property.id] : null)
        || (property.profilePicture || null)
        || (typeof getMainPropertyPhoto === 'function' ? getMainPropertyPhoto(property) : null);

    if (propertyPhotos.length === 0) {
        if (profilePic) {
            return `
                <div class="property-gallery">
                    ${scoreOverlay}
                    <div class="gallery-main-image">
                        <img src="${profilePic}" alt="${property.address}" class="main-image">
                    </div>
                </div>
            `;
        }
        return `
            <div class="no-photos-gallery">
                ${scoreOverlay}
                <div class="no-photos-placeholder">
                    <div class="npg-icon"><i class="fas fa-home"></i></div>
                    <p class="npg-hint">Photos taken during your assessment appear here</p>
                </div>
            </div>
        `;
    }
    
    const mainPhoto = propertyPhotos[propertyDetailsState.currentImageIndex] || propertyPhotos[0];
    
    return `
        <div class="property-gallery">
            ${scoreOverlay}
            <div class="gallery-main-image">
                <img src="${mainPhoto.data}" alt="${mainPhoto.itemName}" class="main-image">
                <div class="gallery-controls">
                    <button class="gallery-prev" onclick="changeGalleryImage(-1)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="gallery-next" onclick="changeGalleryImage(1)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                <div class="photo-counter">
                    ${propertyDetailsState.currentImageIndex + 1} of ${propertyPhotos.length}
                </div>
            </div>
            
            <div class="gallery-thumbnails">
                ${propertyPhotos.map((photo, index) => `
                    <div class="gallery-thumbnail ${index === propertyDetailsState.currentImageIndex ? 'active' : ''}" 
                         onclick="selectGalleryImage(${index})">
                        <img src="${photo.data}" alt="${photo.itemName}">
                        <div class="thumbnail-label">${photo.roomName}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Property Overview Renderer
function renderPropertyOverview(property) {
    return `
        <div class="simple-property-overview">
            <div class="property-price">R ${property.price ? property.price.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : 'Price TBC'}</div>
            
            <div class="property-main-row">
                <div class="property-info-left">
                    <div class="property-type-line">${property.bedrooms || 'N/A'} Bedroom ${property.type || 'Property'} for Sale in ${property.suburb || 'Area'}</div>
                    <div class="property-address-line">${property.address}${property.complexName ? `, ${property.complexName}` : ''}</div>
                    
                    <div class="property-specs-row">
                        <div class="spec-item">
                            <i class="fas fa-bed"></i>
                            <span>${property.bedrooms || 'N/A'}</span>
                        </div>
                        <div class="spec-item">
                            <i class="fas fa-bath"></i>
                            <span>${property.bathrooms || 'N/A'}</span>
                        </div>
                        <div class="spec-item">
                            <i class="fas fa-car"></i>
                            <span>${property.parking || 'N/A'}</span>
                        </div>
                        <div class="spec-item">
                            <i class="fas fa-ruler-combined"></i>
                            <span>${property.size || 'N/A'} m²</span>
                        </div>
                    </div>
                </div>
                
                <div class="property-sale-link-area">
                    <div class="sale-link-header">
                        <h4>Property Sale Link</h4>
                        <button class="edit-link-btn" onclick="editPropertyLink('${property.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    ${property.saleLink ? `
                        <a href="${property.saleLink}" target="_blank" class="property-sale-link">
                            <i class="fas fa-external-link-alt"></i>
                            Property Link
                        </a>
                    ` : `
                        <div class="no-sale-link" onclick="editPropertyLink('${property.id}')">
                            <i class="fas fa-plus"></i>
                            Add Property Link
                        </div>
                    `}
                </div>
            </div>
            
            ${property.notes ? `
                <div class="property-notes-simple">
                    <strong>Notes:</strong> ${property.notes}
                </div>
            ` : ''}
            
            ${property.assessmentDate ? `
                <div class="assessment-date-section">
                    <div class="assessment-date-info">
                        <i class="fas fa-calendar-check"></i>
                        <span class="assessment-date-text">
                            Assessment: ${new Date(property.assessmentDate).toLocaleDateString()} at ${new Date(property.assessmentDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div class="assessment-actions">
                        <button class="edit-assessment-date-btn" onclick="editProperty('${property.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <div class="cal-btns">
                            <button class="add-calendar-btn" onclick="addToCalendar('${property.id}')">
                                <i class="fas fa-calendar-plus"></i> Add to Calendar
                            </button>
                            <button class="add-calendar-btn remind-btn" onclick="scheduleAssessmentReminder('${property.id}')">
                                <i class="fas fa-bell"></i> Set Reminder
                            </button>
                        </div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Enhanced Property Details Renderer with CLEAN feature management
function renderPropertyDetailsSimplified(property) {
    return `
        <div class="property-details-readonly">
            <!-- External Features -->
            ${renderFeatureSection(property, 'external', 'External Features', 'fa-tree')}

            <!-- Internal Features -->  
            ${renderFeatureSection(property, 'internal', 'Internal Features', 'fa-door-open')}

            <!-- Other Features -->
            ${renderFeatureSection(property, 'other', 'Other Features', 'fa-star')}
        </div>
    `;
}

// Render existing features for property detail view
function renderExistingFeaturesClean(property, category) {
    // Show basic property info as features
    let features = [];
    
    if (category === 'internal') {
        if (property.bedrooms) features.push({ name: 'Bedrooms', quantity: property.bedrooms });
        if (property.bathrooms) features.push({ name: 'Bathrooms', quantity: property.bathrooms });
        // ADD KITCHEN AS DEFAULT
        features.push({ name: 'Kitchen', quantity: 1 });
    }
    
    if (category === 'external') {
        if (property.parking) features.push({ name: 'Parking', quantity: property.parking });
    }
    
    // Add stored features from propertyFeatures state
    if (propertyFeatures[category]) {
        features = [...features, ...propertyFeatures[category]];
    }
    
    if (features.length === 0) {
        return '<div class="no-features">No features added yet</div>';
    }
    
    return features.map(feature => `
        <div class="feature-item-clean">
            <div class="feature-content">
                <div class="feature-name">
                    <i class="fas fa-check-circle"></i>
                    ${feature.name}
                </div>
                <div class="feature-quantity">
                    <button class="qty-btn" onclick="updateFeatureQuantity('${category}', '${feature.name}', -1)">-</button>
                    <span class="qty-display">${feature.quantity || 1}</span>
                    <button class="qty-btn" onclick="updateFeatureQuantity('${category}', '${feature.name}', 1)">+</button>
                </div>
            </div>
            <button class="remove-feature-btn-clean" onclick="removeFeatureFromProperty('${category}', '${feature.name}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Assessment Section Renderer
function renderAssessmentSection(property) {
    if (!property.score) {
        return `
            <div class="assessment-placeholder">
                <i class="fas fa-clipboard-check"></i>
                <h4>No Assessment Available</h4>
                <p>Start an assessment to see detailed property analysis</p>
                <button class="primary-button" onclick="startAssessment('${property.id}')">
                    <i class="fas fa-play"></i> Start Assessment
                </button>
            </div>
        `;
    }

    // Only show results when assessment is 100% complete
    const assessmentProgress = window.calculateAssessmentProgress ? calculateAssessmentProgress(property) : 0;
    if (assessmentProgress < 100) {
        return `
            <div class="assessment-placeholder">
                <i class="fas fa-hourglass-half" style="color: #F4A261"></i>
                <h4>Assessment In Progress</h4>
                <p>Complete your assessment to <strong>100%</strong> to unlock your results and score.</p>
                <div class="progress-bar-container" style="margin: 10px 0">
                    <div class="progress-bar-fill" style="width: ${Math.round(assessmentProgress)}%"></div>
                </div>
                <p style="font-size:12px; color:#8bbad4; margin: 4px 0 12px">${Math.round(assessmentProgress)}% complete</p>
                <button class="primary-button" onclick="startAssessment('${property.id}')">
                    <i class="fas fa-play"></i> Continue Assessment
                </button>
            </div>
        `;
    }
    
    // Determine assessment type - same logic as Assessment Results screen

    
    // FIXED: Use the same scoring calculation as Assessment Results screen
    let scoreData = null;
    let displayScore = property.score;
    
    // Get dynamic guidance from scoring system - same as Assessment Results screen
    if (window.calculatePropertyScore) {
        scoreData = window.calculatePropertyScore(property);
        if (scoreData && scoreData.overall) {
            displayScore = scoreData.overall;
            property.score = displayScore;
        }
    }
    
    const scoreGrade = window.getScoreGrade ? window.getScoreGrade(displayScore) : 
                      getScoreGradeBasic(displayScore);
    
    // FIXED: Use same dynamic content generation as Assessment Results screen
    const dynamicGuidance = scoreData ? scoreData.dynamicGuidance || scoreGrade : scoreGrade;
    const criticalIssueCount = dynamicGuidance.criticalIssueCount || 0;
    
    return `
        <div class="assessment-results-improved">
            <h3>Assessment Results</h3>
            <div class="assessment-date">
                Assessment completed on ${property.assessedAt ? new Date(property.assessedAt).toLocaleDateString() : 'Recent'}
            </div>

            <div class="score-display-main">
                <div class="score-number-section">
                    <div class="score-number-large" style="color: ${scoreGrade.color}">${displayScore}</div>
                    <div class="score-out-of">/100</div>
                </div>
                <div class="score-grade-section">
                    <div class="score-grade-badge" style="background: ${scoreGrade.color}1c; color: ${scoreGrade.color}; border: 1px solid ${scoreGrade.color}50;">
                        ${scoreGrade.label}
                    </div>
                    ${getScoreDescription(displayScore)}
                </div>
            </div>

            <div class="progress-section">
				<div class="progress-label">
					<span>Property Condition</span>
					<span>${displayScore}%</span>
				</div>
				<div class="progress-bar-container">
					<div class="progress-bar-fill" style="width: ${displayScore}%"></div>
				</div>
				<div class="progress-markers">
					<span>Poor</span>
					<span>Fair</span>
					<span>Good</span>
					<span>Excellent</span>
				</div>
			</div>

            <div class="key-insights">
                <h4><i class="fas fa-lightbulb"></i> Key Insights</h4>
                <div class="insights-grid">
                    ${generateDynamicInsights(dynamicGuidance, criticalIssueCount).map(insight => `
                        <div class="insight-item">
                            <div class="insight-icon ${insight.type}">
                                <i class="fas ${insight.icon}"></i>
                            </div>
                            <span>${insight.text}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="budget-considerations">
                <h4><i class="fas fa-calculator"></i> Budget Considerations</h4>
                <div class="budget-text">
                    ${dynamicGuidance.budgetConsiderations || 'Budget for routine maintenance and any identified repair needs.'}
                </div>
            </div>

            <div class="price-impact">
                <h4><i class="fas fa-chart-line"></i> Negotiation Considerations</h4>
                <div class="price-text">
                    ${dynamicGuidance.negotiationAdvice || generateDynamicNegotiationAdvice(dynamicGuidance, criticalIssueCount).advice}
                </div>
            </div>

            <button class="btn btn-primary" onclick="generateDetailedReportForProperty('${property.id}')">
				<i class="fas fa-chart-line"></i> Full Report
			</button>
            </div>
        </div>
    `;
}

// Helper functions
function getScoreGradeBasic(score) {
    // Use consistent scoring from scoring.js
    if (window.getScoreGrade) {
        return window.getScoreGrade(score);
    }
    // Fallback with consistent ranges
    if (score >= 83) return { label: 'Excellent', color: '#06D6A0' };
    if (score >= 66) return { label: 'Good', color: '#28A745' };
    if (score >= 46) return { label: 'Fair', color: '#F18F01' };
    return { label: 'Poor', color: '#E63946' };
}

function getScoreDescription(score) {
    // Use consistent scoring first
    if (window.getScoreGrade) {
        const grade = window.getScoreGrade(score);
        if (grade.description) return grade.description;
    }
    // Fallback descriptions
    if (score >= 83) return 'Excellent condition with minimal issues';
    if (score >= 66) return 'Good condition with minor maintenance needs';
    if (score >= 46) return 'Fair condition requiring several repairs';
    return 'Poor condition needing significant work';
}

function estimateRepairCosts(score) {
    if (score >= 83) return { min: 5, max: 15 };
    if (score >= 66) return { min: 15, max: 40 };
    if (score >= 46) return { min: 50, max: 120 };
    return { min: 120, max: 300 };
}

function getNegotiationPower(score) {
    if (score >= 83) return { 
        level: 'Low', 
        color: '#06D6A0',
        advice: 'Property condition is a strong point for the seller, but condition is just one factor in pricing. Comparable sales in the area, market conditions, and your own priorities all play a role in what makes sense as an offer. The assessment gives you an objective view of condition to factor into that thinking.'
    };
    if (score >= 66) return { 
        level: 'Low-Moderate', 
        color: '#28A745',
        advice: 'The identified items provide context for price discussions. Getting indicative repair quotes for the flagged items gives you a factual basis for your offer. Comparable sales in the area help you understand whether the asking price already reflects the condition.'
    };
    if (score >= 46) return { 
        level: 'Moderate-High', 
        color: '#F18F01',
        advice: 'The documented condition findings provide a factual basis for price discussions. Contractor quotes for the major items identified help establish realistic repair costs, which buyers often use to inform their offer relative to comparable properties in better condition.'
    };
    return { 
        level: 'High', 
        color: '#E63946',
        advice: 'The extent of work required is a significant factor in pricing. Establishing the total cost of ownership — purchase price plus all repair costs — is the key figure. Comparing that to the market value of similar properties in good condition helps you understand what a fair price looks like for the property in its current state.'
    };
}

function generateKeyInsights(property, scoreData) {
    const insights = [];
    const score = scoreData ? scoreData.overall : (property.score || 0);
	const scoreGrade = scoreData ? scoreData.grade : getScoreGradeBasic(score);
    
    // Structural insight
    if (score >= 66) {
        insights.push({ type: 'good', icon: 'fa-check', text: 'Structural integrity good' });
    } else if (score >= 45) {
        insights.push({ type: 'warning', icon: 'fa-exclamation', text: 'Some structural concerns' });
    } else {
        insights.push({ type: 'critical', icon: 'fa-times', text: 'Structural issues present' });
    }
    
    // Issues count
    const issueCount = Math.floor((100 - score) / 15);
    if (issueCount > 0) {
        insights.push({ 
            type: issueCount > 3 ? 'critical' : 'warning', 
            icon: 'fa-exclamation', 
            text: `${issueCount} areas need attention` 
        });
    }
    
    // Safety
    if (score >= 60) {
        insights.push({ type: 'good', icon: 'fa-shield-alt', text: 'No critical safety issues' });
    } else {
        insights.push({ type: 'critical', icon: 'fa-exclamation-triangle', text: 'Safety concerns identified' });
    }
    
    // Repair estimate
    const repairCost = estimateRepairCosts(score);
    insights.push({ 
        type: score >= 70 ? 'good' : score >= 45 ? 'warning' : 'critical', 
        icon: 'fa-tools', 
        text: `Est. R${repairCost.min}-${repairCost.max}k repairs needed` 
    });
    
    return insights.slice(0, 4); // Maximum 4 insights
}

// Photos Section Renderer
function renderPhotosSectionThumbnails(property, propertyPhotos) {
    if (propertyPhotos.length === 0) {
        return `
            <div class="photos-placeholder">
                <i class="fas fa-camera"></i>
                <h4>No Photos Available</h4>
                <p>Photos will appear here after your assessment</p>
            </div>
        `;
    }
    
    // Group photos by room
    const photosByRoom = {};
    propertyPhotos.forEach(photo => {
        if (!photosByRoom[photo.roomName]) {
            photosByRoom[photo.roomName] = [];
        }
        photosByRoom[photo.roomName].push(photo);
    });
    
    return `
        <div class="photos-section-clean">
            <div class="photos-summary">
                <h4>Photo Gallery</h4>
                <p>${propertyPhotos.length} photos across ${Object.keys(photosByRoom).length} rooms</p>
            </div>
            
            ${Object.entries(photosByRoom).map(([roomName, photos]) => `
                <div class="room-photos-group">
                    <h5><i class="fas fa-door-open"></i> ${roomName} (${photos.length} photos)</h5>
                    <div class="photos-grid-thumbnails">
                        ${photos.map(photo => `
                            <div class="photo-thumbnail-item" onclick="viewLargePhoto('${photo.data}', '${photo.itemName}', '${roomName}')">
                                <img src="${photo.data}" alt="${photo.itemName}" class="photo-thumbnail-img">
                                <div class="photo-thumbnail-overlay">
									<span class="photo-thumbnail-title">${getCleanPhotoDescription(photo.itemName)}</span>
									<span class="photo-thumbnail-date">${new Date(photo.timestamp).toLocaleDateString()}</span>
								</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Clean photo description helper
function getCleanPhotoDescription(itemText) {
    if (!itemText) return 'Property Photo';
    
    let cleanText = itemText;
    
    // Remove the specific pattern: numbers + space + random chars + space + description
    // Example: "175916671144469 fywty86qm Gate access secure with working mechanisms"
    const pattern = /^\d+\s+[a-z0-9]+\s+(.+)$/;
    const match = cleanText.match(pattern);
    
    if (match) {
        cleanText = match[1]; // Extract just the description part
    } else {
        // Fallback: remove any leading numbers and random characters
        cleanText = cleanText
            .replace(/^\d+\s*/, '')              // Remove leading numbers
            .replace(/^[a-z0-9]+\s+/, '')        // Remove random chars at start
            .replace(/^(quick|detailed)_\w+_/, '') // Remove assessment prefixes
    }
    
    // Clean up formatting
    cleanText = cleanText
        .replace(/_/g, ' ')
        .trim();
    
    // Capitalize first letter
    if (cleanText) {
        cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
    }
    
    return cleanText || 'Property Photo';
}

// Gallery Controls
function changeGalleryImage(direction) {
    const property = appState.currentProperty;
    const photos = getAllPropertyPhotos(property);
    
    if (photos.length === 0) return;
    
    propertyDetailsState.currentImageIndex += direction;
    
    if (propertyDetailsState.currentImageIndex < 0) {
        propertyDetailsState.currentImageIndex = photos.length - 1;
    } else if (propertyDetailsState.currentImageIndex >= photos.length) {
        propertyDetailsState.currentImageIndex = 0;
    }
    
    // Re-render just the gallery section
    const gallerySection = document.querySelector('.property-gallery-section');
    gallerySection.innerHTML = renderPropertyGallery(property, photos);
}

function selectGalleryImage(index) {
    propertyDetailsState.currentImageIndex = index;
    const property = appState.currentProperty;
    const photos = getAllPropertyPhotos(property);
    
    // Re-render just the gallery section
    const gallerySection = document.querySelector('.property-gallery-section');
    gallerySection.innerHTML = renderPropertyGallery(property, photos);
}

// Section Toggle
function toggleDetailSection(sectionId) {
    // Don't allow collapsing overview section
    if (sectionId === 'overview') return;
    
    propertyDetailsState.sectionsExpanded[sectionId] = !propertyDetailsState.sectionsExpanded[sectionId];
    
    const toggle = document.querySelector(`[onclick="toggleDetailSection('${sectionId}')"] .section-toggle`);
    const content = toggle.closest('.detail-section-container').querySelector('.detail-section-content');
    
    if (propertyDetailsState.sectionsExpanded[sectionId]) {
        toggle.classList.remove('collapsed');
        content.classList.remove('collapsed');
        content.classList.add('expanded');
    } else {
        toggle.classList.add('collapsed');
        content.classList.remove('expanded');
        content.classList.add('collapsed');
    }
}

// Toggle property category in detail view
function togglePropertyCategory(categoryId) {
    const content = document.getElementById(categoryId + 'Content');
    const toggle = document.getElementById(categoryId + 'Toggle');
    
    if (content && toggle) {
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            content.classList.add('collapsed');
            toggle.classList.add('collapsed');
        } else {
            content.classList.remove('collapsed');
            content.classList.add('expanded');
            toggle.classList.remove('collapsed');
        }
    }
}

// Action Functions
function editProperty(propertyId) {
    const property = getProperty(propertyId);
    if (!property) return;
    
    // Set editing mode
    appState.editingPropertyId = propertyId;
    appState.selectedPropertyType = property.type;
    
    // Load property features
    loadPropertyFeatures(property);
    
    // Pre-populate the form with existing data
    document.getElementById('propertyAddress').value = property.address || '';
    document.getElementById('propertySuburb').value = property.suburb || '';
    document.getElementById('propertyBedrooms').value = property.bedrooms || '';
    document.getElementById('propertyBathrooms').value = property.bathrooms || '';
    document.getElementById('propertyParking').value = property.parking || '';
    document.getElementById('propertySize').value = property.size || '';
    document.getElementById('propertyPrice').value = property.price || '';
    document.getElementById('propertyNotes').value = property.notes || '';
    if (property.assessmentDate) {
        document.getElementById('assessmentDate').value = property.assessmentDate;
    }
    
    // Show complex name field if needed
    if (property.complexName) {
        document.getElementById('complexName').value = property.complexName;
        document.getElementById('complexNameGroup').style.display = 'block';
    }
    
    // Update the screen title and back button for editing
    document.querySelector('#propertyDetailsScreen .screen-header h2').textContent = 'Edit Property';
    document.querySelector('#propertyDetailsScreen .back-button').onclick = () => {
        // Clean up edit mode when going back
        document.querySelector('#propertyDetailsScreen .screen-header h2').textContent = 'Property Details';
        const featureContainer = document.getElementById('featureManagementContainer');
        if (featureContainer) {
            featureContainer.remove();
        }
        appState.editingPropertyId = null;
        viewPropertyDetails(propertyId);
    };
    
    showScreen('propertyDetailsScreen');
    
    // Render feature management sections after form loads
    setTimeout(() => {
        renderFeatureManagementSections();
    }, 100);
}

function exportPropertyReport(propertyId) {
    showModal('Export Report', 'PDF export functionality coming soon!');
}

function openCostCalculator(propertyId) {
    const property = getProperty(propertyId);
    if (!property) return;
    
    // Navigate to property detail view
    viewPropertyDetails(propertyId);
    
    // Expand financial section and highlight calculator
    setTimeout(() => {
        if (!propertyDetailsState.sectionsExpanded.financial) {
            toggleDetailSection('financial');
        }
        
        const calculator = document.getElementById('costCalculatorContent');
        if (calculator) {
            calculator.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 500);
}

function viewLargePhoto(photoData, itemName, roomName) {
    const modal = document.createElement('div');
    modal.className = 'photo-view-modal';
    modal.innerHTML = `
        <div class="photo-view-container">
            <button class="close-view-btn" onclick="this.closest('.photo-view-modal').remove()">
                <i class="fas fa-times"></i>
            </button>
            <img src="${photoData}" class="photo-view-img" alt="${itemName}">
            <div class="photo-view-info">
                <h4>${getCleanPhotoDescription(itemName)}</h4>
                <p>Room: ${roomName}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// Fixed Property Link Edit
function editPropertyLink(propertyId) {
    const property = getProperty(propertyId);
    const currentLink = property.saleLink || '';
    
    const modal = document.createElement('div');
modal.id = 'propertyLinkModal';
modal.className = 'modal';
modal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h3>Edit Property Sale Link</h3>
            <button class="modal-close-btn" onclick="document.getElementById('propertyLinkModal').remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="link-edit-form">
                <label>Property Sale Link:</label>
                <input type="url" id="saleLinkInput" class="form-input" value="${currentLink}" placeholder="https://www.property24.com/..." style="width: 100%; margin-top: 10px;">
                <p style="font-size: 0.9rem; color: rgba(255,255,255,0.7); margin-top: 10px;">
                    Add the link where this property is listed for sale (Property24, Private Property, etc.)
                </p>
            </div>
        </div>
        <div class="modal-footer">
            <button class="cancel-button" onclick="document.getElementById('propertyLinkModal').remove()">Cancel</button>
            <button class="save-button" onclick="saveLinkFromModal('${propertyId}')">Save Link</button>
        </div>
    </div>
`;

document.body.appendChild(modal);
modal.classList.remove('hidden');
}

function saveLinkFromModal(propertyId) {
    const newLink = document.getElementById('saleLinkInput').value.trim();
    if (newLink && isValidURL(newLink)) {
        const result = updateProperty(propertyId, { saleLink: newLink });
        // Update current property in state
        if (appState.currentProperty && appState.currentProperty.id === propertyId) {
            appState.currentProperty.saleLink = newLink;
        }
        document.getElementById('propertyLinkModal').remove();
        renderPropertyDetailView(appState.currentProperty);
        showSuccess('Property link updated!');
    } else {
        alert('Please enter a valid URL (e.g., https://www.property24.com/...)');
    }
}

function viewPropertyAssessmentResults(propertyId) {
    const property = getProperty(propertyId);
    if (!property) {
        showModal('Error', 'Property not found');
        return;
    }
    
    // Check if any assessment is 100% complete
    const availableTypes = getAvailableAssessmentTypes(property);
    const completeAssessments = availableTypes.filter(type => type.canGenerate);
    
    if (completeAssessments.length === 0) {
        showModal('Assessment Incomplete', `
            <div class="incomplete-assessment-modal">
                <div class="incomplete-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h4>Complete Assessment Required</h4>
                <p>You need to complete the Property Assessment to 100% before viewing results.</p>
                <div class="progress-info">
                    ${availableTypes.map(type => `
                        <div class="assessment-progress-item">
                            <span>${type.name}:</span>
                            <span class="progress-percentage">${type.completeness}% complete</span>
                        </div>
                    `).join('')}
                </div>
                <p><strong>Please complete your assessment and try again.</strong></p>
            </div>
        `, () => {
            // Take user back to assessment
            if (availableTypes.length > 0) {
                const mostComplete = availableTypes.reduce((max, current) => 
                    current.completeness > max.completeness ? current : max
                );
                selectAssessmentMode(mostComplete.type, propertyId);
            } else {
                startAssessment(propertyId);
            }
        }, 'Continue Assessment', null, 'Cancel');
        return;
    }
    
    // Proceed to results if at least one assessment is complete
    appState.currentProperty = property;
    showScreen('assessmentResultsScreen');
    initializeAssessmentResults();
}

// URL Validation
function isValidURL(string) {
    try {
        new URL(string);
        return string.startsWith('http://') || string.startsWith('https://');
    } catch (_) {
        return false;
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    initSmartBackButtons();
	
    initApp();
    
    // Initialize form handler
    const propertyForm = document.getElementById('propertyDetailsForm');
	if (propertyForm) {
		propertyForm.addEventListener('submit', handlePropertyDetailsSubmitEnhanced);
	}
    
    // Set minimum date to today
    const assessmentDateInput = document.getElementById('assessmentDate');
    if (assessmentDateInput) {
        assessmentDateInput.min = new Date().toISOString().slice(0, 16);
    }
    
    setTimeout(() => {
        addInteractiveEffects();
    }, 500);
});

// Storage monitor - warn if getting close to limits
function checkStorageHealth() {
    try {
        const data = localStorage.getItem('propertyInspectorData');
        if (data) {
            const sizeKB = data.length / 1024;
            const maxSizeKB = 4 * 1024; // 4MB
            const usagePercent = (sizeKB / maxSizeKB) * 100;
            
            if (usagePercent > 80) {
                console.warn(`âš ï¸ localStorage usage: ${usagePercent.toFixed(1)}% (${sizeKB.toFixed(1)}KB)`);
            }
            
            return {
                sizeKB: sizeKB,
                usagePercent: usagePercent,
                healthy: usagePercent < 80
            };
        }
    } catch (error) {
        console.error('Error checking storage:', error);
        return { healthy: false };
    }
}

// Auto-save with health check
function saveAppDataSafely() {
    const healthCheck = checkStorageHealth();
    if (healthCheck && !healthCheck.healthy) {
        console.warn('âš ï¸ Storage health poor, performing cleanup before save');
        // Could implement additional cleanup here
    }
    
    saveAppData();
}

// Replace the regular auto-save interval
setInterval(() => {
    // Only save if there are actual changes and app is stable
    if (appState.properties.length > 0) {
        saveAppDataSafely();
    }
}, 30000); // Every 30 seconds

function formatPrice(input) {
    let value = input.value.replace(/\s/g, ''); // Remove spaces
    if (value && !isNaN(value)) {
        input.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // Add spaces every 3 digits
    }
}

function getUnformattedPrice() {
    const priceInput = document.getElementById('propertyPrice');
    return priceInput.value.replace(/\s/g, ''); // Remove spaces for storage
}

// Initialize notifications when app loads
async function initNotifications() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }
        
        // Check for today's assessments
        checkTodaysAssessments();
        
        // Set up daily check at 9 AM
        scheduleDaily9AMCheck();
    }
}

// Check for assessments scheduled for today
function checkTodaysAssessments() {
    if (!appState.settings.notifications) return;
    
    const now = new Date();
    const properties = getAllProperties();
    
    const upcomingAssessments = properties.filter(property => {
        if (!property.assessmentDate) return false;
        
        const assessmentTime = new Date(property.assessmentDate);
        const timeDiff = assessmentTime.getTime() - now.getTime();
        
        // Show notification 30 minutes before assessment
        return timeDiff > 0 && timeDiff <= 30 * 60 * 1000;
    });
    
    upcomingAssessments.forEach(property => {
        showAssessmentNotification(property);
    });
}

// Show browser notification for assessment
function showAssessmentNotification(property) {
    if (Notification.permission === 'granted') {
        const notification = new Notification('Property Assessment Today', {
            body: `Assessment scheduled for ${property.address}`,
            icon: '/android-chrome-192x192.png', // Add your app icon
            badge: '/android-chrome-192x192.png',
            tag: `assessment-${property.id}`,
            requireInteraction: true,
            actions: [
                { action: 'view', title: 'View Property' },
                { action: 'assess', title: 'Start Assessment' }
            ]
        });
        
        notification.onclick = () => {
            window.focus();
            viewPropertyDetails(property.id);
            notification.close();
        };
    }
}

// Schedule daily 9 AM check
function scheduleDaily9AMCheck() {
    const now = new Date();
    const next9AM = new Date();
    next9AM.setHours(9, 0, 0, 0);
    
    // If it's past 9 AM today, schedule for tomorrow
    if (now > next9AM) {
        next9AM.setDate(next9AM.getDate() + 1);
    }
    
    const timeUntil9AM = next9AM.getTime() - now.getTime();
    
    setTimeout(() => {
        checkTodaysAssessments();
        // Schedule next day
        setInterval(checkTodaysAssessments, 24 * 60 * 60 * 1000);
    }, timeUntil9AM);
}

// Get upcoming assessments for home screen
function getUpcomingAssessments() {
    const properties = getAllProperties();
    const today = new Date();
    
    return properties
        .filter(property => property.assessmentDate)
        .map(property => ({
            ...property,
            assessmentDateObj: new Date(property.assessmentDate)
        }))
        .filter(property => property.assessmentDateObj >= today)
        .sort((a, b) => a.assessmentDateObj - b.assessmentDateObj)
        .slice(0, 3); // Show next 3 assessments
}

// Update home screen to show upcoming assessments
function renderUpcomingAssessments() {
    const upcomingAssessments = getUpcomingAssessments();
    
    if (upcomingAssessments.length === 0) return '';
    
    return `
        <div class="upcoming-assessments">
            <div class="upcoming-header">
                <h3><i class="fas fa-calendar-check"></i> Upcoming Assessments</h3>
            </div>
            <div class="upcoming-list">
                ${upcomingAssessments.map(property => {
                    const assessmentDate = new Date(property.assessmentDate);
                    const isToday = assessmentDate.toDateString() === new Date().toDateString();
                    const daysDiff = Math.ceil((assessmentDate - new Date()) / (1000 * 60 * 60 * 24));
                    
                    return `
                        <div class="upcoming-item ${isToday ? 'today' : ''}" onclick="viewPropertyDetails('${property.id}')">
                            <div class="upcoming-date">
                                <div class="date-day">${assessmentDate.getDate()}</div>
                                <div class="date-month">${assessmentDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                            </div>
                            <div class="upcoming-info">
                                <h4>${property.address}</h4>
                                <p>${isToday ? `Today at ${assessmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : `${assessmentDate.toLocaleDateString()} at ${assessmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}</p>
                            </div>
                            <div class="upcoming-action">
                                <button class="start-assessment-btn" onclick="event.stopPropagation(); startAssessment('${property.id}')">
                                    <i class="fas fa-play"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Update settings notification function
function toggleNotifications() {
    appState.settings.notifications = !appState.settings.notifications;
    
    if (appState.settings.notifications) {
        // Request permission when enabling
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showSuccess('Assessment reminders enabled');
                    checkTodaysAssessments();
                } else {
                    showSuccess('Assessment reminders enabled (browser notifications disabled)');
                }
            });
        } else {
            showSuccess('Assessment reminders enabled');
            checkTodaysAssessments();
        }
    } else {
        showSuccess('Assessment reminders disabled');
    }
    
    saveAppData();
    renderSettingsItems();
}

// Update property form submit to handle assessment date
function handlePropertyDetailsSubmitEnhanced(event) {
    event.preventDefault();
    
    const formData = {
        type: appState.selectedPropertyType,
        complexName: document.getElementById('complexName').value,
        address: document.getElementById('propertyAddress').value,
        suburb: document.getElementById('propertySuburb').value,
        bedrooms: document.getElementById('propertyBedrooms')?.value || '',
        bathrooms: document.getElementById('propertyBathrooms')?.value || '',
        parking: document.getElementById('propertyParking')?.value || '',
        size: document.getElementById('propertySize')?.value || '',
        price: document.getElementById('propertyPrice').value,
        notes: document.getElementById('propertyNotes').value,
        assessmentDate: document.getElementById('assessmentDate')?.value || null,
        features: propertyFeatures
    };

    if (!formData.address) {
        alert('Please fill in the property address');
        return;
    }

    let savedProperty;
    
    if (appState.editingPropertyId) {
		// Update existing property
		const propertyIndex = appState.properties.findIndex(p => p.id === appState.editingPropertyId);
		if (propertyIndex !== -1) {
			Object.assign(appState.properties[propertyIndex], formData);
			savedProperty = appState.properties[propertyIndex];
			savedProperty.updatedAt = new Date().toISOString();
		}
		appState.editingPropertyId = null;
		
		// Clean up edit mode
		document.querySelector('#propertyDetailsScreen .screen-header h2').textContent = 'Property Details';
		const featureContainer = document.getElementById('featureManagementContainer');
		if (featureContainer) {
			featureContainer.remove();
		}
		
		showSuccess('Property updated successfully!');
	} else {
		// Create new property
		savedProperty = {
			id: generateId(),
			...formData,
			score: null,
			hasProfilePicture: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		
		savedProperty = autoPopulateAssessmentRooms(savedProperty);
		appState.properties.push(savedProperty);
		showSuccess('Property created successfully!');
		
		trackEvent('property_created', {
			property_type: formData.type,
			bedrooms: formData.bedrooms || 'unknown'
		});
	}
    
    appState.currentProperty = savedProperty;
    updatePropertyCount();
    
    setTimeout(() => {
        showScreen('propertyListScreen');
    }, 1500);
}

// ====================================================================
// ASSESSMENT RESULTS AND REPORTING SYSTEM
// ====================================================================

// Initialize assessment results screen
function initializeAssessmentResults() {
    const property = appState.currentProperty;
    if (!property) {
        showScreen('propertyListScreen');
        return;
    }
    
    updateResultsHeader(property);
    
    // Get available assessment types with STRICT 100% requirement
    const availableTypes = getAvailableAssessmentTypes(property);
    const completeTypes = availableTypes.filter(type => type.completeness >= 100 && type.canGenerate);
    
    
    // STRICT: Only proceed if there are 100% complete assessments
    if (completeTypes.length === 0) {
        displayNoAssessmentMessage(property, availableTypes);
        return;
    }
    
    // Single assessment — show directly, hide the old toggle container
    const container = document.getElementById('assessmentTypeSelection');
    if (container) {
        container.innerHTML = '';
        container.style.display = 'none';
    }
    displayImprovedAssessmentView(property);
}

// ADD this new function to handle no complete assessments:
function displayNoAssessmentMessage(property, availableTypes) {
    const container = document.getElementById('assessmentTypeSelection');
    container.innerHTML = `
        <div class="no-complete-assessments">
            <div class="no-assessments-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>No Complete Assessments</h3>
            <p>You need to complete an assessment to 100% before viewing results.</p>
            <div class="incomplete-assessments-list">
                ${availableTypes.map(type => `
                    <div class="incomplete-assessment-item">
                        <strong>${type.name}:</strong> ${type.completeness}% complete
                        <button class="continue-assessment-btn" onclick="continueIncompleteAssessment('${property.id}')">
                            Continue
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    const reportContainer = document.getElementById('assessmentReportContainer');
    reportContainer.classList.add('hidden');
}

// ADD this new function:
function continueIncompleteAssessment(propertyId) {
    startAssessment(propertyId);
}

function showIncompleteAssessmentMessage(completeness) {
    const typeName = 'Property Assessment';
    
    showModal('Assessment Incomplete', `
        <div class="incomplete-assessment-modal">
            <div class="incomplete-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h4>${typeName} Not Complete</h4>
            <p>This assessment is only <strong>${completeness}% complete</strong>.</p>
            <p>You need to complete 100% of the assessment items to view the results.</p>
            <div class="completion-bar">
                <div class="completion-fill" style="width: ${completeness}%"></div>
                <span class="completion-text">${completeness}%</span>
            </div>
        </div>
    `, () => {
        // Take user to continue the assessment
        startAssessment(appState.currentProperty.id);
    }, 'Continue Assessment', null, 'Cancel');
}

function showExistingAssessmentSelection(property, availableTypes) {
    showModal('Continue Assessment', `
        <div class="existing-assessment-selection">
            <div class="selection-intro">
                <h4>Which assessment would you like to continue?</h4>
                <p>You have existing assessment data for this property.</p>
            </div>
            
            <div class="assessment-options">
                ${availableTypes.map(type => `
                    <div class="assessment-option-card" onclick="selectAssessmentMode('${type.type}', '${property.id}')">
                        <div class="option-info">
                            <h5>${type.name}</h5>
                            <div class="option-progress">
                                <div class="progress-bar-small">
                                    <div class="progress-fill-small" style="width: ${type.completeness}%"></div>
                                </div>
                                <span class="progress-text-small">${type.completeness}% Complete</span>
                            </div>
                            ${type.canGenerate ? 
                                '<div class="complete-badge">âœ… Ready for Results</div>' : 
                                '<div class="incomplete-badge">âš ï¸ Needs Completion</div>'
                            }
                        </div>
                        <div class="option-arrow">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="new-assessment-option">
                <p>Or start a new assessment type:</p>
                <button class="secondary-button" onclick="hideModal(); showAssessmentModeSelection(getProperty('${property.id}'))">
                    <i class="fas fa-plus"></i> Start New Assessment
                </button>
            </div>
        </div>
    `, null, null, null, 'Cancel');
}

function switchAssessmentType(type) {
    const property = appState.currentProperty;
    const availableTypes = getAvailableAssessmentTypes(property);
    const selectedType = availableTypes.find(t => t.type === type);
    
    // STRICT: Only allow switching to 100% complete assessments
    if (!selectedType || selectedType.completeness < 100 || !selectedType.canGenerate) {
        showIncompleteAssessmentMessage(type, selectedType?.completeness || 0);
        return;
    }
    
    
    // Update toggle buttons - be more robust
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Set the correct button as active
    const targetBtn = document.querySelector(`[data-type="${type}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    } else {
        console.warn('Toggle button not found for type:', type);
    }
    
    // Update view
    displayImprovedAssessmentView(property);
}

function displayAssessmentToggle(completeTypes, defaultType = 'assessment') {
    const container = document.getElementById('assessmentTypeSelection');
    
    // ONLY show toggle if there are complete assessments
    if (completeTypes.length === 0) {
        container.innerHTML = ''; // Hide toggle completely
        return;
    }
    
    // ONLY show toggle if multiple complete assessments exist
    if (completeTypes.length === 1) {
        container.innerHTML = ''; // Hide toggle for single assessment
        return;
    }
    
    container.innerHTML = `
        <div class="assessment-toggle-section">
            <div class="toggle-buttons">
                ${completeTypes.map((type) => `
                    <button class="toggle-btn ${type.type === defaultType ? 'active' : ''}" 
                            onclick="switchAssessmentType('${type.type}')"
                            data-type="${type.type}">
                        ${type.name}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function displayImprovedAssessmentView(property) {
    const container = document.getElementById('assessmentReportContainer');
    container.classList.remove('hidden');
    
    const scoreData = window.calculatePropertyScore(property);
    if (!scoreData) return;
    
    const scoreGrade = scoreData.grade;
    
    // Use dynamic guidance instead of generic functions
    const dynamicGuidance = scoreData.dynamicGuidance || scoreGrade;
    const criticalIssueCount = dynamicGuidance.criticalIssueCount || 0;
    
    container.innerHTML = `
        <div class="assessment-results-improved">
            <h3>Assessment Results</h3>
            <div class="assessment-date">
                Assessment completed on ${property.assessedAt ? new Date(property.assessedAt).toLocaleDateString() : new Date().toLocaleDateString()}
            </div>
            <div class="score-display-main">
                <div class="score-number-section">
                    <div class="score-number-large" style="color: ${scoreGrade.color}">${scoreData.overall}</div>
                    <div class="score-out-of">/100</div>
                </div>
                <div class="score-grade-section">
                    <div class="score-grade-badge" style="background: ${scoreGrade.color}1c; color: ${scoreGrade.color}; border: 1px solid ${scoreGrade.color}50;">
                        ${scoreGrade.label}
                    </div>
                    <div class="score-description">
                        Property scored ${scoreData.overall}% with ${criticalIssueCount} area${criticalIssueCount !== 1 ? 's' : ''} needing attention
                    </div>
                </div>
            </div>
            <div class="progress-section">
                <div class="progress-label">
                    <span>Property Condition</span>
                    <span>${scoreData.overall}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${scoreData.overall}%"></div>
                </div>
                <div class="progress-markers">
                    <span>Poor</span>
                    <span>Fair</span>
                    <span>Good</span>
                    <span>Excellent</span>
                </div>
            </div>
            <div class="key-insights">
                <h4><i class="fas fa-lightbulb"></i> Key Insights</h4>
                <div class="insights-grid">
                    ${generateDynamicInsights(dynamicGuidance, criticalIssueCount).map(insight => `
                        <div class="insight-item">
                            <div class="insight-icon ${insight.type}">
                                <i class="fas ${insight.icon}"></i>
                            </div>
                            <span>${insight.text}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="budget-considerations">
                <h4><i class="fas fa-calculator"></i> Budget Considerations</h4>
                <div class="budget-text">
                    ${dynamicGuidance.budgetConsiderations}
                </div>
            </div>
            <div class="price-impact">
                <h4><i class="fas fa-chart-line"></i> Negotiation Considerations</h4>
                <div class="price-text">
                    ${dynamicGuidance.negotiationAdvice || generateDynamicNegotiationAdvice(dynamicGuidance, criticalIssueCount).advice}
                </div>
            </div>
            <div class="assessment-actions">
                <button class="btn btn-primary" onclick="generateAssessmentData()">
                    <i class="fas fa-chart-line"></i> Full Report
                </button>
            </div>
        </div>
    `;
}

// Helper functions for dynamic insights
function generateDynamicInsights(guidance, criticalIssueCount) {
    const insights = [];
    
    // Count fair vs poor ratings from guidance
    const poorCount = guidance.criticalIssues ? 
        guidance.criticalIssues.filter(i => i.rating === 'poor').length : 0;
    const fairCount = guidance.criticalIssues ? 
        guidance.criticalIssues.filter(i => i.rating === 'fair').length : 0;
    
    if (criticalIssueCount === 0) {
        insights.push({
            type: 'positive',
            icon: 'fa-check-circle',
            text: 'No critical issues identified - property appears to be in good condition with minimal repair concerns'
        });
        insights.push({
            type: 'neutral',
            icon: 'fa-calculator',
            text: 'Budget primarily for routine maintenance and personal preference improvements'
        });
    } else if (poorCount === 0 && fairCount > 0) {
        // Only FAIR ratings - less severe
        insights.push({
            type: 'info',
            icon: 'fa-clipboard-check',
            text: `${fairCount} area${fairCount > 1 ? 's' : ''} identified that may benefit from professional assessment to determine actual condition and any repair needs`
        });
        insights.push({
            type: 'neutral',
            icon: 'fa-coins',
            text: 'Professional inspection helps clarify which items need attention and estimated costs for informed negotiations'
        });
        if (fairCount >= 2) {
            insights.push({
                type: 'info',
                icon: 'fa-user-hard-hat',
                text: 'Building inspection recommended to evaluate identified areas and check for additional concerns'
            });
        }
    } else if (poorCount > 0 && fairCount === 0) {
        // Only POOR ratings - more severe
        insights.push({
            type: 'warning',
            icon: 'fa-exclamation-triangle',
            text: `${poorCount} area${poorCount > 1 ? 's' : ''} showing visible problems requiring professional evaluation and likely repair work`
        });
        insights.push({
            type: 'neutral',
            icon: 'fa-coins',
            text: 'Get detailed repair quotes to understand costs and use for price negotiations with seller'
        });
        insights.push({
            type: 'info',
            icon: 'fa-user-hard-hat',
            text: 'Professional building inspection essential to assess severity and identify any additional hidden issues'
        });
    } else {
        // Mixed fair and poor
        insights.push({
            type: 'info',
            icon: 'fa-clipboard-check',
            text: `${criticalIssueCount} areas identified with varying conditions - professional evaluation essential to determine actual repair scope`
        });
        insights.push({
            type: 'neutral',
            icon: 'fa-coins',
            text: 'Some issues may be minor while others need attention - inspection clarifies actual costs for negotiations'
        });
        insights.push({
            type: 'info',
            icon: 'fa-user-hard-hat',
            text: 'Comprehensive professional inspection strongly recommended given number of identified areas'
        });
    }
    
    return insights.slice(0, 4);
}

function generateDynamicNegotiationAdvice(guidance, criticalIssueCount) {
    if (criticalIssueCount === 0) {
        return {
            level: 'Limited',
            color: '#28A745',
            advice: 'No major property issues identified. Negotiations should focus on market comparables, included fixtures, and settlement terms rather than repair-based adjustments.'
        };
    } else if (criticalIssueCount >= 3) {
        return {
            level: 'Strong',
            color: '#DC3545',
            advice: 'Multiple repair needs provide significant negotiation leverage. Obtain professional quotes and use documented issues to justify repair allowances or price reductions.'
        };
    } else {
        return {
            level: 'Moderate',
            color: '#F18F01',
            advice: 'Identified issues provide reasonable negotiation position. Use your assessment documentation to request repair allowances based on actual professional repair quotes.'
        };
    }
}

function generateDetailedReport() {
    
    // Save the current toggle state
    const toggleContainer = document.getElementById('assessmentTypeSelection');
    const savedToggleHTML = toggleContainer ? toggleContainer.innerHTML : '';
    
    // Generate the quick report (which shows the full detailed view)
    generateAssessmentData();
    
    // Restore the toggle after report generation
    setTimeout(() => {
        if (toggleContainer && savedToggleHTML) {
            toggleContainer.innerHTML = savedToggleHTML;
        }
    }, 100);
}

// Update results screen header
function updateResultsHeader(property) {
    const resultsInfo = document.getElementById('resultsPropertyInfo');
    if (resultsInfo) {
        resultsInfo.textContent = property.address;
    }
}

// Display assessment type selection
function displayAssessmentTypeSelection(property) {
    const container = document.getElementById('assessmentTypeOptions');
    const availableTypes = window.getAvailableAssessmentTypes(property);
    
    if (availableTypes.length === 0) {
        container.innerHTML = `
            <div class="no-assessments-message">
                <div class="no-assessments-icon">
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <h3>No Assessments Available</h3>
                <p>No completed assessments found for this property.</p>
                <button class="primary-button" onclick="startAssessment('${property.id}')">
                    <i class="fas fa-play"></i> Start Assessment
                </button>
            </div>
        `;
        return;
    }
    
    // Show selection if multiple types or single type
    container.innerHTML = availableTypes.map(typeInfo => {
        const canGenerate = typeInfo.canGenerate;
        const completenessText = `${Math.round(typeInfo.completeness)}% Complete`;
        
        return `
            <div class="assessment-type-option ${!canGenerate ? 'incomplete' : ''}" 
                 ${canGenerate ? `onclick="selectAssessmentType('${typeInfo.type}')"` : ''}>
                <div class="type-option-header">
                    <div class="type-option-info">
                        <h4>${typeInfo.name}</h4>
                        <div class="type-completion-status ${canGenerate ? 'complete' : 'incomplete'}">
                            <i class="fas ${canGenerate ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                            ${completenessText}
                        </div>
                    </div>
                    <div class="type-option-score">
                        ${canGenerate ? this.getDisplayScore(property) : 'Incomplete'}
                    </div>
                </div>
                
                ${!canGenerate ? `
                    <div class="incomplete-message">
                        <p><strong>${typeInfo.name} report cannot be generated because the assessment is incomplete.</strong> 
                        Please complete at least 100% of the assessment items to generate a report.</p>
                        <button class="secondary-button" onclick="continueAssessment('${property.id}', '${typeInfo.type}')">
                            <i class="fas fa-edit"></i> Continue Assessment
                        </button>
                    </div>
                ` : `
                    <div class="type-option-actions">
                        <button class="primary-button" onclick="generateAssessmentData()">
                            <i class="fas fa-eye"></i> View Report
                        </button>
                        <button class="secondary-button" onclick="showReportOptions('${typeInfo.type}')">
                            <i class="fas fa-cog"></i> Generate PDF
                        </button>
                    </div>
                `}
            </div>
        `;
    }).join('');
}

// Get display score for property and assessment type
function getDisplayScore(property) {
    let score = 0;
    
    if (property.assessments && Object.keys(property.assessments).length > 0) {
        const scoreData = window.calculatePropertyScore(property);
        score = scoreData ? scoreData.overall : 0;
    } else if (property.assessments && Object.keys(property.assessments).length > 0) {
        const scoreData = window.calculatePropertyScore(property);
        score = scoreData ? scoreData.overall : 0;
    } else {
        score = property.score || 0; // Fallback to general score
    }
    
    if (score > 0) {
        const grade = window.getScoreGrade ? window.getScoreGrade(score) : { 
            label: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor',
            color: score >= 80 ? '#06D6A0' : score >= 60 ? '#28A745' : score >= 40 ? '#F18F01' : '#E63946'
        };
        
        return `
            <div class="score-display-inline" style="color: ${grade.color}">
                <span class="score-number">${score}%</span>
                <span class="score-label">${grade.label}</span>
            </div>
        `;
    }
    
    return 'Not Scored';
}

// Select assessment type and show report
function selectAssessmentType() {
    generateAssessmentData();
}

// Generate and display quick report view
function generateAssessmentData() {
    const property = appState.currentProperty;
    if (!property) return;
    
    showLoadingState();
    
    setTimeout(() => {
        // FIXED: Force recalculation of score and recommendations
        const scoreData = window.calculatePropertyScore(property);
		
		if (scoreData) {
			trackEvent('assessment_completed', {
				property_id: property.id,
				assessment_type: 'assessment',
				score: scoreData.overall
			});
		}
        
        if (!scoreData) {
            showModal('Error', 'No assessment data available for report generation.');
            return;
        }
        
        const reportData = window.generateAssessmentReport(property, {
            includePhotos: true,
            reportTitle: 'Property Assessment Report'
        });
        
        if (!reportData || reportData.error) {
            showModal('Error', reportData?.error || 'Unable to generate report. Please ensure the assessment is complete.');
            hideLoadingState();
            return;
        }
        
        displayAssessmentReport(reportData);
        hideLoadingState();
    }, 500);
}

// Show loading state
function showLoadingState() {
    const container = document.getElementById('assessmentReportContainer');
    container.className = 'assessment-report-container';
    container.innerHTML = `
        <div class="report-loading">
            <div class="loading-spinner"></div>
            <p>Generating assessment report...</p>
        </div>
    `;
}

// Hide loading state
function hideLoadingState() {
    const container = document.getElementById('assessmentReportContainer');
    if (container) {
        const loader = container.querySelector('.report-loading');
        if (loader) loader.remove();
    }
}

// Display the assessment report
function displayAssessmentReport(reportData) {
    const container = document.getElementById('assessmentReportContainer');
    const typeSelection = document.getElementById('assessmentTypeSelection');
    
    // DON'T hide the toggle - keep it visible during full report
    // typeSelection.classList.add('hidden'); // REMOVE THIS LINE
    
    container.classList.remove('hidden');
    container.innerHTML = generateReportHTML(reportData);

    // Insurance: mirror report styles into <head> so they apply
    // even if WebView ignores <style> inside innerHTML
    try {
        const inlineStyle = container.querySelector('#rptInlineStyles');
        if (inlineStyle) {
            let headStyle = document.getElementById('rptHeadStyles');
            if (!headStyle) {
                headStyle = document.createElement('style');
                headStyle.id = 'rptHeadStyles';
                document.head.appendChild(headStyle);
            }
            headStyle.textContent = inlineStyle.textContent;
        }
    } catch (e) {}

    // Always open the report at the top (hero + score visible)
    requestAnimationFrame(() => {
        try {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            const screen = document.getElementById('assessmentResultsScreen');
            if (screen) screen.scrollTop = 0;
        } catch (e) { /* scroll best-effort */ }
    });
}

// Generate HTML for the assessment report
// Enhanced generateReportHTML function for professional, readable reports

// Fix 1: Update generateReportHTML to pass correct assessment type

// ── Report rating filter: tap a distribution chip to show only that rating ──
function toggleReportRatingFilter(rating) {
    const isActive = document.body.getAttribute('data-rpt-filter') === rating;
    if (isActive) {
        clearReportRatingFilter();
        return;
    }
    applyReportRatingFilter(rating);
}

function applyReportRatingFilter(rating) {
    document.body.setAttribute('data-rpt-filter', rating);

    // Highlight the active chip
    document.querySelectorAll('.rpt-chip').forEach(chip => {
        chip.classList.toggle('active', chip.getAttribute('data-filter-rating') === rating);
    });

    // Show the filter bar
    const bar = document.getElementById('rptFilterBar');
    const nameEl = document.getElementById('rptFilterName');
    if (bar) bar.classList.remove('hidden');
    if (nameEl) nameEl.textContent = rating.charAt(0).toUpperCase() + rating.slice(1);

    // Walk every item: hide non-matching, show matching
    document.querySelectorAll('.rpt-item').forEach(item => {
        const match = item.getAttribute('data-rating') === rating;
        item.classList.toggle('rpt-item-hidden', !match);
    });

    // Hide rooms with zero visible items; expand sections with at least one match
    document.querySelectorAll('.rpt-room').forEach(room => {
        const hasMatch = room.querySelector('.rpt-item:not(.rpt-item-hidden)');
        room.classList.toggle('rpt-room-hidden', !hasMatch);
    });

    document.querySelectorAll('.rpt-acc').forEach(acc => {
        if (acc.querySelector('.rpt-room')) { // only category accordions, not summary/issues
            const hasMatch = acc.querySelector('.rpt-room:not(.rpt-room-hidden)');
            if (hasMatch) {
                acc.classList.add('open');
            } else {
                acc.classList.remove('open');
            }
            acc.classList.toggle('rpt-acc-filtered-empty', !hasMatch);
        }
    });
}

function clearReportRatingFilter() {
    document.body.removeAttribute('data-rpt-filter');
    document.querySelectorAll('.rpt-chip').forEach(chip => chip.classList.remove('active'));
    const bar = document.getElementById('rptFilterBar');
    if (bar) bar.classList.add('hidden');
    document.querySelectorAll('.rpt-item').forEach(item => item.classList.remove('rpt-item-hidden'));
    document.querySelectorAll('.rpt-room').forEach(room => room.classList.remove('rpt-room-hidden'));
    document.querySelectorAll('.rpt-acc').forEach(acc => {
        acc.classList.remove('rpt-acc-filtered-empty');
        if (acc.querySelector('.rpt-room')) {
            acc.classList.remove('open');
        }
    });
}
window.toggleReportRatingFilter = toggleReportRatingFilter;
window.clearReportRatingFilter = clearReportRatingFilter;

function generateReportHTML(reportData) {
    const { property, assessment, sections, recommendations, summary, options } = reportData;
    const grade = assessment.grade;

    // Custom feature data for inline integration
    const _fullProp = (typeof appState !== 'undefined' && appState.currentProperty && appState.currentProperty.id === property.id)
        ? appState.currentProperty : property;
    const _custAssessments   = _fullProp.customAssessments   || property.customAssessments   || {};
    const _custGuidanceNotes = _fullProp.customGuidanceNotes || property.customGuidanceNotes || {};
    const _propId = property.id;
    
    // FIX: Get the correct assessment type from the report data
    const currentAssessmentType = assessment.type || 'assessment';
    
    // Collect high/critical issues requiring attention
    const allIssuesRequiringAttention = [];
    sections.forEach(section => {
        section.rooms.forEach(room => {
            room.items.forEach(item => {
                if (item.issuesRequiringAttention && 
                    (item.rating === 'fair' || item.rating === 'poor') &&
                    item.costWeight >= 3.0) {
                    allIssuesRequiringAttention.push({
                        section: section.name,
                        room: room.name,
                        item: item.text,
                        issue: item.issuesRequiringAttention,
                        priority: item.rating === 'poor' ? 'critical' : 'high',
                        rating: item.rating,
                        costWeight: item.costWeight,
                        costCategory: item.costCategory
                    });
                }
            });
        });
    });
    
    // ── Compute dashboard stats ──
    let totalRooms = 0, totalItems = 0;
    const ratingCounts = { excellent: 0, good: 0, fair: 0, poor: 0 };
    sections.forEach(section => {
        totalRooms += section.rooms.length;
        section.rooms.forEach(room => {
            room.items.forEach(item => {
                totalItems++;
                if (ratingCounts[item.rating] !== undefined) ratingCounts[item.rating]++;
            });
        });
    });

    // Also count custom item ratings so filter chips include them
    if (typeof getCustomConfig === 'function') {
        getCustomConfig().customFeatures.forEach(f => {
            if (f.excluded) return;
            f.items.forEach(item => {
                const assessed = _custAssessments[item.id];
                if (assessed?.rating && ratingCounts[assessed.rating] !== undefined) {
                    ratingCounts[assessed.rating]++;
                    totalItems++;
                }
            });
        });
    }

    return `
        <div class="assessment-report rpt-v2">
            <style id="rptInlineStyles">
                .rpt-room{margin:0 0 4px 0}
                .rpt-room-head{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:10px;border-bottom:1.5px solid var(--border,#1e3448);padding:12px 0 8px 0}
                .rpt-room-name{display:inline-flex;align-items:center;gap:8px;color:var(--text-1,#e8f1f8);font-size:0.95rem;font-weight:600}
                .rpt-room-name i{color:var(--brand-green,#1d9e75);font-size:0.85rem}
                .rpt-room-count{color:var(--text-3,#5a85a0);font-size:0.72rem;font-weight:500;white-space:nowrap}
                .rpt-item{border-bottom:0.5px solid var(--divider,#1a2c3f);padding:11px 0}
                .rpt-item:last-child{border-bottom:none}
                .rpt-item-row{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:12px}
                .rpt-item-text{color:var(--text-1,#e8f1f8);font-size:0.88rem;font-weight:500;line-height:1.4;flex:1}
                .rpt-pill{display:inline-block;border-radius:99px;padding:4px 11px;font-size:0.64rem;font-weight:700;letter-spacing:0.05em;white-space:nowrap;flex-shrink:0}
                .rpt-item-guide{border-left:2px solid var(--border,#1e3448);padding:2px 0 2px 11px;margin-top:7px;color:var(--text-2,#8bbad4);font-size:0.79rem;line-height:1.5}
                .rpt-room-notes{display:flex;gap:8px;border-left:2px solid var(--brand-green,#1d9e75);padding:2px 0 2px 11px;margin:8px 0 4px 0;color:var(--text-2,#8bbad4);font-size:0.79rem;line-height:1.5}
                .rpt-room-notes i{color:var(--brand-green,#1d9e75);margin-top:2px}
                .rpt-room-notes strong{color:var(--text-1,#e8f1f8)}
                body:not(.dark-mode) .rpt-room-name{color:#111827}
                body:not(.dark-mode) .rpt-room-head{border-bottom-color:#e3e8ee}
                body:not(.dark-mode) .rpt-room-count{color:#9ca3af}
                body:not(.dark-mode) .rpt-item{border-bottom-color:#eef1f4}
                body:not(.dark-mode) .rpt-item-text{color:#111827}
                body:not(.dark-mode) .rpt-item-guide{color:#4b5563;border-left-color:#e3e8ee}
                body:not(.dark-mode) .rpt-room-notes{color:#4b5563}
                body:not(.dark-mode) .rpt-room-notes strong{color:#111827}
            </style>
            
            <!-- Export -->
            <div class="assessment-top-actions">
                <button class="assessment-pdf-btn" onclick="showPDFExportModal('${property.id}', '${currentAssessmentType}')">
                    <i class="fas fa-file-pdf"></i> Export Report
                </button>
            </div>

            <!-- ══ DASHBOARD HERO ══ -->
            <div class="rpt-hero">
                <div class="rpt-hero-top">
                    <div class="rpt-ring" style="background: conic-gradient(${grade.color} ${(assessment.overallScore / 100) * 360}deg, var(--prog-bg) 0deg)">
                        <div class="rpt-ring-inner">
                            <span class="rpt-ring-num" style="color: ${grade.color}">${assessment.overallScore}</span>
                            <span class="rpt-ring-out">/100</span>
                        </div>
                    </div>
                    <div class="rpt-hero-info">
                        <div class="rpt-grade-pill" style="background: ${grade.color}1c; color: ${grade.color}; border: 1px solid ${grade.color}50;">${grade.label}</div>
                        <h2 class="rpt-address">${property.address}</h2>
                        <p class="rpt-meta">${property.type}${property.bedrooms ? ' · ' + property.bedrooms + ' bed' : ''}${property.bathrooms ? ' · ' + property.bathrooms + ' bath' : ''}${property.price ? ' · R ' + property.price.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''}</p>
                        <p class="rpt-date">Report generated ${new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div class="rpt-stats">
                    <div class="rpt-stat">
                        <span class="rpt-stat-num">${sections.length}</span>
                        <span class="rpt-stat-lbl">Categories</span>
                    </div>
                    <div class="rpt-stat">
                        <span class="rpt-stat-num">${totalRooms}</span>
                        <span class="rpt-stat-lbl">Areas</span>
                    </div>
                    <div class="rpt-stat">
                        <span class="rpt-stat-num">${totalItems}</span>
                        <span class="rpt-stat-lbl">Items checked</span>
                    </div>
                    <div class="rpt-stat">
                        <span class="rpt-stat-num" style="color: ${allIssuesRequiringAttention.length > 0 ? '#f1a008' : 'var(--brand-green)'}">${allIssuesRequiringAttention.length}</span>
                        <span class="rpt-stat-lbl">Issues</span>
                    </div>
                </div>

                <div class="rpt-dist">
                    ${ratingCounts.excellent ? `<button class="rpt-chip excellent" data-filter-rating="excellent" onclick="toggleReportRatingFilter('excellent')"><i class="fas fa-check-circle"></i> ${ratingCounts.excellent} Excellent</button>` : ''}
                    ${ratingCounts.good ? `<button class="rpt-chip good" data-filter-rating="good" onclick="toggleReportRatingFilter('good')"><i class="fas fa-thumbs-up"></i> ${ratingCounts.good} Good</button>` : ''}
                    ${ratingCounts.fair ? `<button class="rpt-chip fair" data-filter-rating="fair" onclick="toggleReportRatingFilter('fair')"><i class="fas fa-exclamation-triangle"></i> ${ratingCounts.fair} Fair</button>` : ''}
                    ${ratingCounts.poor ? `<button class="rpt-chip poor" data-filter-rating="poor" onclick="toggleReportRatingFilter('poor')"><i class="fas fa-times-circle"></i> ${ratingCounts.poor} Poor</button>` : ''}
                </div>
                <div class="rpt-filter-bar hidden" id="rptFilterBar">
                    <span class="rpt-filter-label">Showing <strong id="rptFilterName">Fair</strong> items only</span>
                    <button class="rpt-filter-clear" onclick="clearReportRatingFilter()">
                        <i class="fas fa-times"></i> Clear filter
                    </button>
                </div>
            </div>

            <!-- ══ SUMMARY & ADVICE ══ -->
            <div class="rpt-acc">
                <div class="rpt-acc-header" onclick="toggleRptSection(this)">
                    <div class="rpt-acc-title">
                        <i class="fas fa-file-alt"></i>
                        <span>Summary &amp; Advice</span>
                    </div>
                    <i class="fas fa-chevron-down rpt-acc-chev"></i>
                </div>
                <div class="rpt-acc-body">
                    <div class="summary-description">${assessment.grade.description || summary}</div>
                    ${assessment.grade.implications ? `
                        <div class="guidance-block">
                            <h4><i class="fas fa-exclamation-triangle"></i> Implications</h4>
                            <p>${assessment.grade.implications}</p>
                        </div>` : ''}
                    ${assessment.grade.buyerAdvice ? `
                        <div class="guidance-block">
                            <h4><i class="fas fa-user-check"></i> Buyer Advice</h4>
                            <p>${assessment.grade.buyerAdvice}</p>
                        </div>` : ''}
                    ${assessment.grade.negotiationAdvice ? `
                        <div class="guidance-block">
                            <h4><i class="fas fa-handshake"></i> Negotiation Strategy</h4>
                            <p>${assessment.grade.negotiationAdvice}</p>
                        </div>` : ''}
                    ${assessment.grade.budgetConsiderations ? `
                        <div class="guidance-block budget-highlight">
                            <h4><i class="fas fa-calculator"></i> Budget Considerations</h4>
                            <p>${assessment.grade.budgetConsiderations}</p>
                        </div>` : ''}
                    ${assessment.grade.immediateActions ? `
                        <div class="immediate-actions">
                            <h4><i class="fas fa-tasks"></i> Immediate Actions Required</h4>
                            <ul>${assessment.grade.immediateActions.map(action => `<li>${action}</li>`).join('')}</ul>
                        </div>` : ''}
                </div>
            </div>

            <!-- ══ ISSUES (open if any) ══ -->
            ${allIssuesRequiringAttention.length > 0 ? `
                <div class="rpt-acc">
                    <div class="rpt-acc-header" onclick="toggleRptSection(this)">
                        <div class="rpt-acc-title">
                            <i class="fas fa-exclamation-triangle" style="color:#f1a008"></i>
                            <span>Issues Requiring Attention</span>
                            <span class="rpt-acc-count warn">${allIssuesRequiringAttention.length}</span>
                        </div>
                        <i class="fas fa-chevron-down rpt-acc-chev"></i>
                    </div>
                    <div class="rpt-acc-body">
                        <div class="issues-introduction">
                            <p>These items should be assessed by qualified professionals as they could involve significant repair costs. Prioritise them in your budget and negotiations.</p>
                        </div>
                        ${allIssuesRequiringAttention.map((issue, index) => `
                            <div class="issue-item-enhanced priority-${issue.priority}">
                                <div class="issue-header">
                                    <div class="issue-priority-badge ${issue.priority}">
                                        <i class="fas ${issue.priority === 'critical' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}"></i>
                                        ${issue.priority.toUpperCase()}
                                    </div>
                                    <div class="issue-number">#${index + 1}</div>
                                </div>
                                <div class="issue-location">
                                    <span>${issue.section}</span>
                                    <i class="fas fa-chevron-right"></i>
                                    <span>${issue.room}</span>
                                </div>
                                <div class="issue-item-name"><strong>${issue.item}</strong></div>
                                <div class="issue-description">${issue.issue}</div>
                            </div>
                        `).join('')}
                        <div class="issues-footer-note">
                            <i class="fas fa-info-circle"></i>
                            <div><strong>Important:</strong> Cost estimates are based on typical South African market rates and may vary. Always obtain professional quotes before making decisions.</div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- ══ DETAILED RESULTS — one accordion per category ══ -->
            <div class="rpt-details-label">Detailed Results — tap a category to expand</div>
            ${sections.map(section => {
                const sectionItems = section.rooms.reduce((sum, r) => sum + r.items.length, 0);
                const sectionIssues = section.rooms.reduce((sum, r) => sum + r.items.filter(i => i.rating === 'fair' || i.rating === 'poor').length, 0);
                return `
                <div class="rpt-acc">
                    <div class="rpt-acc-header" onclick="toggleRptSection(this)">
                        <div class="rpt-acc-title">
                            <i class="fas ${section.icon}" style="color:${section.color}"></i>
                            <span>${section.name}</span>
                            <span class="rpt-acc-count">${sectionItems}</span>
                            ${sectionIssues > 0 ? `<span class="rpt-acc-count warn">${sectionIssues} <i class="fas fa-exclamation-triangle" style="font-size:8px"></i></span>` : ''}
                        </div>
                        <i class="fas fa-chevron-down rpt-acc-chev"></i>
                    </div>
                    <div class="rpt-acc-body">
                        ${section.rooms.map(room => `
                            <div class="rpt-room" data-room="1">
                                <div class="rpt-room-head">
                                    <span class="rpt-room-name"><i class="fas ${room.icon}"></i>${room.name}</span>
                                    <span class="rpt-room-count">${room.items.length} items</span>
                                </div>
                                ${room.items.map(item => {
                                    const ratingColor = item.rating === 'excellent' ? '#06D6A0' :
                                                      item.rating === 'good' ? '#28A745' :
                                                      item.rating === 'fair' ? '#F18F01' :
                                                      item.rating === 'poor' ? '#E63946' : '#6C757D';
                                    return `
                                        <div class="rpt-item" data-rating="${item.rating}">
                                            <div class="rpt-item-row">
                                                <span class="rpt-item-text">${item.text}</span>
                                                <span class="rpt-pill" style="background: ${ratingColor}1c; color: ${ratingColor};">${item.rating.toUpperCase()}</span>
                                            </div>
                                            ${item.ratingDescription ? `
                                                <div class="rpt-item-guide">${item.ratingDescription}</div>
                                            ` : ''}
                                        </div>
                                    `;
                                }).join('')}
                                ${room.notes ? `
                                    <div class="rpt-room-notes">
                                        <i class="fas fa-sticky-note"></i>
                                        <span><strong>Your notes:</strong> ${room.notes}</span>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                        ${_buildCustomRoomsForSection(section.id, _custAssessments, _custGuidanceNotes, _propId)}
                    </div>
                </div>
            `;}).join('')}

            <!-- Back to top -->
            <div class="scroll-to-top-container">
                <button class="scroll-to-top-btn" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
                    <i class="fas fa-arrow-up"></i>
                    <span>Back to Top</span>
                </button>
            </div>

        </div>
    `;
}


// Toggle report accordion sections
function toggleRptSection(headerEl) {
    const acc = headerEl.closest('.rpt-acc');
    if (acc) acc.classList.toggle('open');
}
window.toggleRptSection = toggleRptSection;

// ── Custom Features section in Full Report screen ─────────────
// Shows rated custom items with guidance notes textareas.
// Notes saved here go into the PDF when generated.
function generateCustomFeaturesReportSection(property) { return ''; }

// ── Custom rooms inline in report sections ──────────────────────────────────
// Called from generateReportHTML for each section — adds custom feature rooms
// in the same format as built-in rooms so they look identical.
function _buildCustomRoomsForSection(sectionId, customAssessments, customGuidanceNotes, propId) {
    if (typeof getCustomConfig !== 'function') return '';
    const config = getCustomConfig();
    const sectionMap = {
        exterior: ['exterior', 'location'],
        interior: ['interior'],
        other:    ['other']
    };
    const sections = sectionMap[sectionId] || [];

    const rc = r =>
        r === 'excellent' ? '#06D6A0' :
        r === 'good'      ? '#28A745' :
        r === 'fair'      ? '#F18F01' :
        r === 'poor'      ? '#E63946' : '#6C757D';

    const features = config.customFeatures.filter(f =>
        !f.excluded && sections.includes(f.section) &&
        f.items.some(i => customAssessments[i.id]?.rating)
    );
    if (!features.length) return '';

    const editStyle = [
        'background:none','border:none','cursor:pointer',
        'color:var(--brand-green,#1d9e75)',
        'font-size:0.7rem','padding:0 0 0 8px','vertical-align:middle'
    ].join(';');

    return features.map(feature => {
        const ratedItems = feature.items.filter(i => customAssessments[i.id]?.rating);
        if (!ratedItems.length) return '';
        return `
        <div class="rpt-room" data-room="1">
            <div class="rpt-room-head">
                <span class="rpt-room-name">
                    <i class="fas fa-puzzle-piece"></i>${feature.name}
                </span>
                <span class="rpt-room-count">${ratedItems.length} item${ratedItems.length !== 1 ? 's' : ''}</span>
            </div>
            ${ratedItems.map(item => {
                const assessed  = customAssessments[item.id];
                const rating    = assessed.rating;
                const color     = rc(rating);
                const rLabel    = rating === 'na' ? 'N/A' : rating.toUpperCase();
                const savedNote = customGuidanceNotes[item.id] || '';
                const cfgGuide  = rating !== 'na' ? (item.guidance?.[rating] || '') : '';
                const guidance  = savedNote || cfgGuide;
                const escaped   = guidance ? guidance.replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';
                const nameEsc   = item.name.replace(/'/g,"&#39;");
                return `
                <div class="rpt-item" data-rating="${rating}">
                    <div class="rpt-item-row">
                        <span class="rpt-item-text">${item.name}</span>
                        <span class="rpt-pill" style="background:${color}1c;color:${color}">${rLabel}</span>
                    </div>
                    <div class="rpt-item-guide" id="custGuide_${item.id}">
                        ${escaped || ''}
                        <button onclick="editCustomGuidanceModal('${item.id}','${propId}','${nameEsc}')"
                            style="${editStyle}" title="${guidance ? 'Edit guidance' : 'Add guidance'}">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    }).join('');
}

// Opens a modal to edit guidance for a custom item in the report
// Opens a modal to edit guidance for a custom item in the report
function editCustomGuidanceModal(itemId, propId, itemName) {
    if (typeof openCustModal !== 'function') return;
    const prop = (typeof appState !== 'undefined' && appState.currentProperty?.id === propId)
        ? appState.currentProperty : null;
    const currentNote = prop?.customGuidanceNotes?.[itemId] || '';
    const taStyle = 'width:100%;box-sizing:border-box;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:11px 13px;color:var(--text-1);font-size:0.85rem;font-family:Poppins,sans-serif;resize:vertical;line-height:1.5;min-height:90px;display:block;margin-top:8px';

    openCustModal('Guidance: ' + itemName, `
        <p style="font-size:0.8rem;color:var(--text-3);margin:0 0 2px;font-family:Poppins,sans-serif;line-height:1.5">
            Add your guidance or findings — this will appear in the PDF report.
        </p>
        <div class="voice-listening" id="guidModalVoice_${itemId}" style="display:none">
            <span class="voice-dot"></span>
            <span class="voice-listening-text">Listening… speak now</span>
            <button class="voice-stop-btn" onclick="stopVoiceCapture()">
                <i class="fas fa-stop"></i> Stop
            </button>
        </div>
        <div class="note-input-row" style="margin-top:10px">
            <textarea id="cgEditNote_${itemId}"
                style="${taStyle}"
                placeholder="e.g. No visible defects found. Fully operational.">${currentNote}</textarea>
            <button class="voice-mic-btn"
                onclick="startVoiceIntoGuidanceModal(this,'${itemId}')"
                title="Speak guidance">
                <i class="fas fa-microphone"></i>
            </button>
        </div>
    `, 'Save ✓', () => {
        const el = document.getElementById('cgEditNote_' + itemId);
        if (!el) return;
        const value = el.value;
        saveCustomGuidanceNote(propId, itemId, value);

        const escaped   = value ? value.replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';
        const editStyle = 'background:none;border:none;cursor:pointer;color:var(--brand-green,#1d9e75);font-size:0.7rem;padding:0 0 0 8px;vertical-align:middle';
        const nameEsc   = itemName.replace(/'/g,"&#39;");
        const guideDiv  = document.getElementById('custGuide_' + itemId);
        if (guideDiv) {
            guideDiv.innerHTML = (escaped || '') +
                `<button onclick="editCustomGuidanceModal('${itemId}','${propId}','${nameEsc}')" style="${editStyle}" title="${value ? 'Edit guidance' : 'Add guidance'}"><i class="fas fa-pencil-alt"></i></button>`;
        }
        closeCustModal();
        showSuccess('Guidance saved!');
    });
}

function startVoiceIntoGuidanceModal(btn, itemId) {
    if (typeof startVoiceInto !== 'function') return;
    startVoiceInto(btn, null, null, function(text) {
        var ta = document.getElementById('cgEditNote_' + itemId);
        if (ta) ta.value = (ta.value ? ta.value + ' ' : '') + text;
    });
}
window.editCustomGuidanceModal     = editCustomGuidanceModal;
window.startVoiceIntoGuidanceModal = startVoiceIntoGuidanceModal;

window._buildCustomRoomsForSection = _buildCustomRoomsForSection;
window.editCustomGuidanceModal     = editCustomGuidanceModal;

function saveCustomGuidanceNote(propertyId, itemId, value) {
    const property = getProperty(propertyId);
    if (!property) return;
    if (!property.customGuidanceNotes) property.customGuidanceNotes = {};
    property.customGuidanceNotes[itemId] = value;
    updateProperty(propertyId, { customGuidanceNotes: property.customGuidanceNotes });
}

function startVoiceIntoCustomGuidance(btn, propertyId, itemId) {
    const textarea = document.getElementById('cgNote_' + itemId);
    if (!textarea) return;
    startVoiceInto(btn, null, null, (text) => {
        textarea.value = (textarea.value ? textarea.value + ' ' : '') + text;
        saveCustomGuidanceNote(propertyId, itemId, textarea.value);
    });
}

window.generateCustomFeaturesReportSection = generateCustomFeaturesReportSection;
window.saveCustomGuidanceNote              = saveCustomGuidanceNote;
window.startVoiceIntoCustomGuidance        = startVoiceIntoCustomGuidance;

// Get rating icon for display
function getRatingIcon(rating) {
    const icons = {
        excellent: '<i class="fas fa-check-circle" style="color: #06D6A0;"></i>',
        good: '<i class="fas fa-thumbs-up" style="color: #28A745;"></i>', 
        fair: '<i class="fas fa-exclamation-triangle" style="color: #F18F01;"></i>',
        poor: '<i class="fas fa-times-circle" style="color: #E63946;"></i>',
        na: '<i class="fas fa-minus-circle" style="color: #6C757D;"></i>'
    };
    return icons[rating] || '<i class="fas fa-question-circle"></i>';
}

// Go back to type selection
function backToTypeSelection() {
    const container = document.getElementById('assessmentReportContainer');
    const typeSelection = document.getElementById('assessmentTypeSelection');
    
    // Hide the report container
    container.classList.add('hidden');
    
    // Make sure toggle is visible
    if (typeSelection) {
        typeSelection.classList.remove('hidden');
    }
    
    // Re-initialize to restore proper state
    initializeAssessmentResults();
}

function clearAssessmentReportState() {
    const container = document.getElementById('assessmentReportContainer');
    const typeSelection = document.getElementById('assessmentTypeSelection');
    
    // Clear report container content
    container.innerHTML = '';
    container.classList.add('hidden');
    
    // Show type selection
    typeSelection.classList.remove('hidden');
    
}

// Show report options modal
function showReportOptions() {
    appState.selectedAssessmentType = 'assessment';
    document.getElementById('reportOptionsModal').classList.remove('hidden');
}

// Hide report options modal
function hideReportOptionsModal() {
    document.getElementById('reportOptionsModal').classList.add('hidden');
}

// Generate report with custom options
function generateReportWithOptions() {
    const includePhotos = document.getElementById('includePhotosOption').checked;
    const reportTitle = document.getElementById('reportTitleInput').value.trim() || 'Property Assessment Report';
    const logoFile = document.getElementById('companyLogoInput').files[0];
    
    if (logoFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            generatePDFReport(appState.selectedAssessmentType, {
                includePhotos,
                reportTitle,
                companyLogo: e.target.result
            });
        };
        reader.readAsDataURL(logoFile);
    } else {
        generatePDFReport(appState.selectedAssessmentType, {
            includePhotos,
            reportTitle,
            companyLogo: null
        });
    }
    
    hideReportOptionsModal();
}

// Generate PDF report (placeholder - will need PDF library)
function generatePDFReport(options) {
    // This is a placeholder - you'll need to implement with a PDF library like jsPDF
    showModal('PDF Generation', `
        <div class="pdf-generation-info">
            <i class="fas fa-file-pdf" style="font-size: 3rem; color: #E63946; margin-bottom: 15px;"></i>
            <h4>PDF Report Generation</h4>
            <p>PDF generation feature will be implemented with jsPDF library.</p>
            <p><strong>Report Settings:</strong></p>
            <ul style="text-align: left; margin: 15px 0;">
                <li>Assessment Type: ${'Property'}</li>
                <li>Include Photos: ${options.includePhotos ? 'Yes' : 'No'}</li>
                <li>Title: ${options.reportTitle}</li>
                <li>Company Logo: ${options.companyLogo ? 'Included' : 'None'}</li>
            </ul>
            <p>For now, you can use the browser's print function to save as PDF.</p>
        </div>
    `, () => {
        window.print();
    }, 'Print Report');
}

// Continue assessment for incomplete assessments
function continueAssessment(propertyId) {
    if (window.startAssessment) {
        window.startAssessment(propertyId);
    }
}


// Get property by ID
function getProperty(propertyId) {
    const property = appState.properties.find(p => p.id === propertyId);
    return property || null;
}

// Get available assessment types for a property
function getAvailableAssessmentTypes(property) {
    const types = [];
    const assessmentProgress = property.progress || 0;
    if (property.assessments && Object.keys(property.assessments).length > 0) {
        types.push({
            type: 'assessment',
            name: 'Property Assessment',
            completeness: assessmentProgress,
            canGenerate: assessmentProgress >= 100
        });
    }
    return types;
}



function getTotalItemsForProperty(property) {
    let total = 0;
    const categories = assessmentCategories;
    const roomInstances = property.roomInstances || {};
    
    categories.forEach(category => {
        category.rooms.forEach(room => {
            if (!room.conditional || roomInstances[room.id]) {
                const instances = roomInstances[room.id] || [{ id: room.id }];
                instances.forEach(() => {
                    total += room.items.length;
                });
            }
        });
    });
    
    return total;
}

// Loading Modal Management
function showLoadingModal() {
    const loadingModal = document.getElementById('loadingModal');
    if (loadingModal) {
        loadingModal.style.display = 'flex';
    }
}

function hideLoadingModal() {
    const loadingModal = document.getElementById('loadingModal');
    if (loadingModal) {
        loadingModal.classList.add('hide');
        setTimeout(() => {
            loadingModal.style.display = 'none';
            loadingModal.classList.remove('hide');
        }, 500); // Match the fadeOut animation duration
    }
}

// Enhanced App Initialization with Loading Modal
async function initAppWithLoading() {
    // Show loading modal immediately
    showLoadingModal();
    
    try {
        
        // Simulate minimum loading time for professional feel
        const minLoadTime = 2000; // 2 seconds minimum
        const startTime = Date.now();
        
        // Initialize the app
        await initApp();
        
        // Ensure minimum loading time has passed
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - elapsedTime);
        
        setTimeout(() => {
            hideLoadingModal();
        }, remainingTime);
        
    } catch (error) {
        console.error('âŒ Error initializing app:', error);
        // Still hide loading modal even if there's an error
        setTimeout(() => {
            hideLoadingModal();
        }, 1000);
    }
}

function refreshPropertyPhotos(propertyId) {
    if (window.photoManager && window.photoManager.loadPhotosFromIndexedDB) {
        return window.photoManager.loadPhotosFromIndexedDB().then(() => {
            
            // Update property list if currently viewing
            if (appState.currentScreen === 'propertyListScreen') {
                updatePropertyList();
            }
            
            // Update property detail view if currently viewing this property
            if (appState.currentScreen === 'propertyDetailViewScreen' && 
                appState.currentProperty && appState.currentProperty.id === propertyId) {
                renderPropertyDetailView(appState.currentProperty);
            }
        });
    }
    return Promise.resolve();
}

// Update the existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // Initialize app with loading modal
    initAppWithLoading();
    
    // Initialize form handler
    const propertyForm = document.getElementById('propertyDetailsForm');
    if (propertyForm) {
        propertyForm.addEventListener('submit', handlePropertyDetailsSubmitEnhanced);
    }
    
    // Set minimum date to today
    const assessmentDateInput = document.getElementById('assessmentDate');
    if (assessmentDateInput) {
        assessmentDateInput.min = new Date().toISOString().slice(0, 16);
    }
    
    setTimeout(() => {
        addInteractiveEffects();
    }, 500);
});

function renderFeatureSection(property, category, title, icon) {
    const features = getPropertyFeatures(property, category);
    
    if (features.length === 0) {
        return `
            <div class="feature-section-readonly">
                <div class="feature-header-readonly collapsed" onclick="toggleFeatureSection('${category}')">
                    <div class="feature-title">
                        <i class="fas ${icon}"></i>
                        <span>${title}</span>
                    </div>
                    <div class="feature-toggle" id="${category}Toggle">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="feature-content-readonly collapsed" id="${category}Content">
                    <div class="no-features-message">No ${title.toLowerCase()} added yet</div>
                </div>
            </div>
        `;
    }

    return `
        <div class="feature-section-readonly">
            <div class="feature-header-readonly" onclick="toggleFeatureSection('${category}')">
                <div class="feature-title">
                    <i class="fas ${icon}"></i>
                    <span>${title}</span>
                    <span class="feature-count">(${features.length})</span>
                </div>
                <div class="feature-toggle" id="${category}Toggle">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
            <div class="feature-content-readonly collapsed" id="${category}Content">
                <div class="features-list-readonly">
                    ${features.map(feature => `
                        <div class="feature-item-readonly">
                            <span class="feature-name">${feature.name}</span>
                            <span class="feature-quantity">${feature.quantity || 1}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Get property features for display (property detail view screen)
function getPropertyFeatures(property, category) {
    // Use stored features as primary source
    const features = (property.features && property.features[category])
        ? [...property.features[category]]
        : [];

    if (category === 'internal') {
        const defaults = getDefaultInternalSeeds(property);
        for (let i = defaults.length - 1; i >= 0; i--) {
            const def = defaults[i];
            if (!features.find(f => f.id === def.id || f.name.toLowerCase() === def.name.toLowerCase())) {
                features.unshift(def);
            }
        }
    }

    if (category === 'external') {
        const defaults = getDefaultExternalSeeds(property);
        for (const def of defaults) {
            if (!features.find(f => f.id === def.id || f.name.toLowerCase() === def.name.toLowerCase())) {
                features.push(def);
            }
        }
    }

    return features;
}

// NEW: Toggle feature sections
function toggleFeatureSection(categoryId) {
    const content = document.getElementById(categoryId + 'Content');
    const toggle = document.getElementById(categoryId + 'Toggle');
    
    if (content && toggle) {
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            content.classList.add('expanded');
            toggle.classList.remove('collapsed');
        } else {
            content.classList.remove('expanded');
            content.classList.add('collapsed');
            toggle.classList.add('collapsed');
        }
    }
}

function renderFeatureManagementSections() {
    if (document.getElementById('featureManagementContainer')) {
        return;
    }

    // Inject AFTER the form wrapper so category cards fill the full screen width
    // (the form has padding:25px which would constrain the cards if injected inside)
    const formWrapper = document.querySelector('#propertyDetailsScreen .property-details-form');
    if (!formWrapper) return;

    const featureManagementHTML = `
        <div id="featureManagementContainer" class="pf-mgmt-section">
            <div class="pf-mgmt-heading">
                <i class="fas fa-sliders-h"></i>
                <div>
                    <span class="pf-mgmt-title">Property Features</span>
                    <p class="pf-mgmt-hint">Tap a section below to expand and manage features included in your assessment.</p>
                </div>
            </div>

            <div class="assessment-categories">
                <!-- External Features -->
                <div class="assessment-category pf-cat" id="pf-cat-external">
                    <div class="category-header" onclick="toggleManagementSection('external')">
                        <div class="category-title">
                            <div class="category-icon" style="background:#28A745">
                                <i class="fas fa-tree"></i>
                            </div>
                            <span class="category-name">External Features</span>
                        </div>
                        <i class="fas fa-chevron-down category-toggle collapsed" id="externalManagementToggle"></i>
                    </div>
                </div>

                <!-- Internal Features -->
                <div class="assessment-category pf-cat" id="pf-cat-internal">
                    <div class="category-header" onclick="toggleManagementSection('internal')">
                        <div class="category-title">
                            <div class="category-icon" style="background:#2E86AB">
                                <i class="fas fa-door-open"></i>
                            </div>
                            <span class="category-name">Internal Features</span>
                        </div>
                        <i class="fas fa-chevron-down category-toggle collapsed" id="internalManagementToggle"></i>
                    </div>
                </div>

                <!-- Other Features -->
                <div class="assessment-category pf-cat" id="pf-cat-other">
                    <div class="category-header" onclick="toggleManagementSection('other')">
                        <div class="category-title">
                            <div class="category-icon" style="background:#6F42C1">
                                <i class="fas fa-star"></i>
                            </div>
                            <span class="category-name">Other Features</span>
                        </div>
                        <i class="fas fa-chevron-down category-toggle collapsed" id="otherManagementToggle"></i>
                    </div>
                </div>
            </div>
        </div>
    `;

    formWrapper.insertAdjacentHTML('afterend', featureManagementHTML);
}

// Toggle management sections — assessment-screen style (build on expand, remove on collapse)
function toggleManagementSection(category) {
    const catEl = document.getElementById('pf-cat-' + category);
    const toggle = document.getElementById(category + 'ManagementToggle');
    if (!catEl || !toggle) return;

    const existingContent = catEl.querySelector('.category-expanded-content');

    if (existingContent) {
        // Collapse: remove content block and reset chevron
        existingContent.remove();
        toggle.classList.add('collapsed');
    } else {
        // Expand: build and inject content, rotate chevron
        toggle.classList.remove('collapsed');

        const optionSets = {
            external: `
                <option value="">Select feature to add...</option>
                <option value="gate-entrance">Gate/Entrance</option>
                <option value="security-safety">Security/Safety</option>
                <option value="garages">Garages</option>
                <option value="garden-areas">Garden</option>
                <option value="swimming-pool">Pool</option>
                <option value="water-features">Water Features</option>
                <option value="sports-court">Sports Court</option>
                <option value="outbuildings">Outbuildings</option>`,
            internal: `
                <option value="">Select feature to add...</option>
                <option value="lounge">Lounge</option>
                <option value="family-tv-rooms">Family/TV Rooms</option>
                <option value="dining-room">Dining Room</option>
                <option value="reception">Reception</option>
                <option value="study-office">Study/Office</option>
                <option value="laundry-room">Laundry Room</option>
                <option value="home-theater">Home Theater</option>`,
            other: `
                <option value="">Select feature to add...</option>
                <option value="solar-power">Solar Power</option>
                <option value="backup-power">Backup Power/UPS</option>
                <option value="borehole">Borehole</option>
                <option value="irrigation-systems">Irrigation Systems</option>
                <option value="water-tank">Water Tank/Storage</option>
                <option value="gas-installation">Gas Installation</option>
                <option value="internet-fibre">Internet Access/Fibre</option>
                <option value="smart-home">Smart Home</option>
                <option value="air-conditioning">Air Conditioning</option>
                <option value="heating-systems">Heating Systems</option>`
        };

        const label = category.charAt(0).toUpperCase() + category.slice(1);
        const content = document.createElement('div');
        content.className = 'category-expanded-content';
        content.id = category + 'ManagementContent';
        content.innerHTML = `
            <div class="pf-features-list" id="${category}FeaturesManagementList"></div>
            <div class="add-other-features-section">
                <h4><i class="fas fa-plus-circle"></i> Add ${label} Feature</h4>
                <select id="${category}FeaturesManagement" class="feature-dropdown" onchange="if(this.value) addFeatureInManagement('${category}')">
                    ${optionSets[category]}
                </select>
            </div>
        `;
        catEl.appendChild(content);
        renderManagementFeaturesList(category);
    }
}

// NEW: Add feature in management mode
function addFeatureInManagement(category) {
    const dropdown = document.getElementById(category + 'FeaturesManagement');
    if (!dropdown) return;
    
    const selectedValue = dropdown.value;
    const selectedText = dropdown.options[dropdown.selectedIndex].text;
    
    if (!selectedValue) {
        alert('Please select a feature to add');
        return;
    }
    
    // Check if feature already exists
    const existingFeature = propertyFeatures[category].find(f => f.id === selectedValue);
    if (existingFeature) {
        existingFeature.quantity = (existingFeature.quantity || 1) + 1;
        showSuccess('Feature quantity increased!');
    } else {
        // Add new feature
        propertyFeatures[category].push({
            id: selectedValue,
            name: selectedText,
            quantity: 1
        });
        showSuccess('Feature added successfully!');
    }
    
    // Clear dropdown
    dropdown.value = '';
    
    // Re-render the features list
    renderManagementFeaturesList(category);
}

// Render features list — flat rows matching assessment-screen room style
function renderManagementFeaturesList(category) {
    const container = document.getElementById(category + 'FeaturesManagementList');
    if (!container) return;

    const features = propertyFeatures[category] || [];

    if (features.length === 0) {
        container.innerHTML = '<div class="pf-no-features">No features added yet — use the dropdown below to add one.</div>';
        return;
    }

    container.innerHTML = features.map(feature => `
        <div class="pf-feature-row">
            <span class="pf-feature-name">${feature.name}</span>
            <div class="feature-controls">
                <button class="qty-btn" onclick="updateFeatureQuantityManagement('${category}', '${feature.name}', -1)">-</button>
                <span class="qty-num">${feature.quantity || 1}</span>
                <button class="qty-btn" onclick="updateFeatureQuantityManagement('${category}', '${feature.name}', 1)">+</button>
                <button class="remove-btn" onclick="removeFeatureFromManagement('${category}', '${feature.name}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Update feature quantity in management mode
function updateFeatureQuantityManagement(category, featureName, change) {
    const feature = propertyFeatures[category].find(f => f.name === featureName);
    if (!feature) return;
    
    feature.quantity = Math.max(1, Math.min(20, (feature.quantity || 1) + change));
    
    // Sync qty back to the matching property form field and appState
    // so the property overview, list, and PDF always reflect the same value.
    if (category === 'internal') {
        if (feature.id === 'bedrooms') {
            const el = document.getElementById('propertyBedrooms');
            if (el) el.value = feature.quantity;
            if (appState.currentProperty) appState.currentProperty.bedrooms = String(feature.quantity);
        } else if (feature.id === 'bathrooms') {
            const el = document.getElementById('propertyBathrooms');
            if (el) el.value = feature.quantity;
            if (appState.currentProperty) appState.currentProperty.bathrooms = String(feature.quantity);
        }
    } else if (category === 'external') {
        if (feature.id === 'garages') {
            const el = document.getElementById('propertyParking');
            if (el) el.value = feature.quantity;
            if (appState.currentProperty) appState.currentProperty.parking = String(feature.quantity);
        }
    }

    renderManagementFeaturesList(category);
}

// NEW: Remove feature from management mode
function removeFeatureFromManagement(category, featureName) {
    showModal(
        'Remove Feature',
        `Remove <strong>${featureName}</strong> from the property?`,
        () => {
            const featureIndex = propertyFeatures[category].findIndex(f => f.name === featureName);
            if (featureIndex === -1) return;
            propertyFeatures[category].splice(featureIndex, 1);
            showSuccess('Feature removed!');
            renderManagementFeaturesList(category);
        },
        'Remove',
        () => {},
        'Cancel'
    );
}

function showPDFExportModal(propertyId) {
    const property = getProperty(propertyId);
    if (!property) {
        showModal('Error', 'Property not found');
        return;
    }


    // Create modal if it doesn't exist
    createPDFExportModal();
    
    // Store current export context with validation
    window.currentPDFExport = {
        propertyId: propertyId,
        assessmentType: 'assessment',
        property: property
    };
    
    // Show modal
    const modal = document.getElementById('pdfExportModal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Reset form
        resetPDFExportForm();
        
        // Focus on title input
        setTimeout(() => {
            const titleInput = document.getElementById('pdfReportTitle');
            if (titleInput) {
                titleInput.focus();
                titleInput.select();
            }
        }, 300);
    } else {
        console.error('âŒ PDF export modal not found');
        showModal('Error', 'Could not open PDF export dialog. Please try again.');
    }
}

function createPDFExportModal() {
    // Check if modal already exists
    if (document.getElementById('pdfExportModal')) {
        return;
    }
    
    const modalHTML = `
        <div id="pdfExportModal" class="pdf-export-modal hidden">
            <div class="pdf-modal-overlay" onclick="hidePDFExportModal()"></div>
            <div class="pdf-modal-content">
                <div class="pdf-modal-header">
                    <div class="pdf-modal-title-row">
                        <div class="pdf-modal-icon"><i class="fas fa-file-pdf"></i></div>
                        <div>
                            <h3>Export Report</h3>
                            <p>Customise and download your PDF</p>
                        </div>
                    </div>
                    <button class="pdf-modal-close" onclick="hidePDFExportModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="pdf-modal-body">
                    <div class="pdf-field">
                        <label class="pdf-label">Report Title</label>
                        <input type="text" id="pdfReportTitle" class="pdf-input"
                               placeholder="Property Assessment Report"
                               value="Property Assessment Report">
                    </div>
                    <div class="pdf-field">
                        <label class="pdf-label">Your Name <span class="pdf-optional">(optional)</span></label>
                        <input type="text" id="pdfInspectorName" class="pdf-input"
                               placeholder="e.g. John Smith">
                    </div>
                    <div class="pdf-section-label">Include in report</div>
                    <div class="pdf-toggle-row">
                        <div class="pdf-toggle-info">
                            <span class="pdf-toggle-title">Assessment Photos</span>
                            <span class="pdf-toggle-sub">Attach photos taken during assessment</span>
                        </div>
                        <label class="pdf-switch">
                            <input type="checkbox" id="pdfIncludePhotos" checked>
                            <span class="pdf-switch-slider"></span>
                        </label>
                    </div>
                    <div class="pdf-toggle-row">
                        <div class="pdf-toggle-info">
                            <span class="pdf-toggle-title">Purchase Guidance</span>
                            <span class="pdf-toggle-sub">Budget, negotiation & buyer advice</span>
                        </div>
                        <label class="pdf-switch">
                            <input type="checkbox" id="pdfIncludePurchaseGuidance" checked>
                            <span class="pdf-switch-slider"></span>
                        </label>
                    </div>
                    <div class="pdf-section-label">Branding <span class="pdf-optional">(optional)</span></div>
                    <div class="pdf-logo-row">
                        <label class="pdf-logo-label" for="pdfCustomLogo">
                            <i class="fas fa-image"></i>
                            <span id="pdfLogoLabelText">Upload company logo</span>
                        </label>
                        <input type="file" id="pdfCustomLogo" class="pdf-input-file"
                               accept="image/*" onchange="handleLogoUpload(this)">
                        <button type="button" id="removeLogo" class="pdf-remove-logo hidden" onclick="removeStoredLogo()">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                    <div id="logoPreview" class="pdf-logo-preview hidden">
                        <img id="logoPreviewImg" src="" alt="Logo">
                        <div class="pdf-logo-preview-label">Logo preview</div>
                    </div>
                </div>
                <div class="pdf-modal-footer">
                    <button class="pdf-btn-cancel" onclick="hidePDFExportModal()">Cancel</button>
                    <button class="pdf-btn-download" onclick="downloadPDFReport()">
                        <i class="fas fa-download"></i> Download PDF
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Load saved logo after modal is created
    setTimeout(() => {
        loadSavedLogo();
    }, 100);
}

function hidePDFExportModal() {
    const modal = document.getElementById('pdfExportModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Clear export context
    window.currentPDFExport = null;
}

function resetPDFExportForm() {
    const titleInput = document.getElementById('pdfReportTitle');
    const inspectorNameInput = document.getElementById('pdfInspectorName');
    const photosCheckbox = document.getElementById('pdfIncludePhotos');
    
    if (titleInput) titleInput.value = 'Property Assessment Report';
    if (photosCheckbox) photosCheckbox.checked = true;

    // Restore saved inspector name so users don't retype it every time
    if (inspectorNameInput) {
        const savedName = localStorage.getItem('pdfInspectorName') || '';
        inspectorNameInput.value = savedName;
        // Save as the user edits, so the next export remembers it
        inspectorNameInput.oninput = () => {
            try { localStorage.setItem('pdfInspectorName', inspectorNameInput.value); } catch (e) {}
        };
    }
    
    // Load saved logo but don't reset it
    loadSavedLogo();
}

function handleLogoUpload(input) {
    const file = input.files[0];
    const preview = document.getElementById('logoPreview');
    const previewImg = document.getElementById('logoPreviewImg');
    const removeBtn = document.getElementById('removeLogo');
    
    if (file) {
        // FIXED: Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Logo file is too large. Please choose a file smaller than 5MB.');
            input.value = '';
            return;
        }
        
        // FIXED: Support all common image formats
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please select a valid image file (JPG, PNG, GIF, WEBP, BMP).');
            input.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const logoData = e.target.result;
            previewImg.src = logoData;
            preview.classList.remove('hidden');
            removeBtn.classList.remove('hidden');
            
            // Save logo to localStorage
            saveLogoToStorage(logoData);
            
        };
        reader.onerror = function() {
            alert('Error reading logo file. Please try again.');
            input.value = '';
        };
        reader.readAsDataURL(file);
    }
}

function saveLogoToStorage(logoData) {
    try {
        // Check if the logo data is too large for localStorage
        const dataSize = logoData.length;
        const maxSize = 500 * 1024; // 500KB limit for localStorage
        
        if (dataSize > maxSize) {
            console.warn('âš ï¸ Logo is large, compressing...');
            // Compress the image
            compressImageToSize(logoData, maxSize).then(compressedData => {
                localStorage.setItem('pdfCompanyLogo', compressedData);
            }).catch(error => {
                console.error('Failed to compress logo:', error);
                alert('Logo file is too large and could not be compressed. Please use a smaller file.');
            });
        } else {
            localStorage.setItem('pdfCompanyLogo', logoData);
        }
    } catch (error) {
        console.error('Failed to save logo:', error);
        if (error.name === 'QuotaExceededError') {
            alert('Storage is full. Please clear some data and try again.');
        }
    }
}

function loadSavedLogo() {
    try {
        const savedLogo = localStorage.getItem('pdfCompanyLogo');
        if (savedLogo) {
            const previewImg = document.getElementById('logoPreviewImg');
            const preview = document.getElementById('logoPreview');
            const removeBtn = document.getElementById('removeLogo');
            
            previewImg.src = savedLogo;
            preview.classList.remove('hidden');
            removeBtn.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Failed to load saved logo:', error);
    }
}

function removeStoredLogo() {
    try {
        localStorage.removeItem('pdfCompanyLogo');
        
        const previewImg = document.getElementById('logoPreviewImg');
        const preview = document.getElementById('logoPreview');
        const removeBtn = document.getElementById('removeLogo');
        const logoInput = document.getElementById('pdfCustomLogo');
        
        previewImg.src = '';
        preview.classList.add('hidden');
        removeBtn.classList.add('hidden');
        logoInput.value = '';
        
    } catch (error) {
        console.error('Failed to remove logo:', error);
    }
}

async function downloadPDFReport() {
    if (!window.currentPDFExport) {
        showModal('Error', 'No export context found. Please try again.');
        return;
    }
    
    const { propertyId } = window.currentPDFExport;
    const assessmentType = 'assessment';
    const options = getPDFExportOptions();
    
    const downloadBtn = document.querySelector('.pdf-btn-download');
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
    downloadBtn.disabled = true;
    
    try {
        
        await downloadPropertyPDF(propertyId, options);
        
        incrementReportsGenerated();
        
        hidePDFExportModal();
        showModal('Report Saved', `
            <div class="save-modal-content">
                <div class="save-icon"><i class="fas fa-check-circle"></i></div>
                <p><strong>Your PDF report has been saved.</strong></p>
                <p>You'll find it in your device's <strong>Downloads</strong> folder, or in the notification shade — tap the download notification to open it directly.</p>
            </div>
        `, null, 'Got it')
        
    } catch (error) {
        console.error('PDF download failed:', error);
        
        let errorMessage = 'Failed to generate PDF report. ';
        if (error.message.includes('PDF generator not available')) {
            errorMessage += 'The PDF generator is not loaded. Please refresh the page and try again.';
        } else if (error.message.includes('jsPDF')) {
            errorMessage += 'PDF library is not available. Please refresh the page.';
        } else if (error.message.includes('Property not found')) {
            errorMessage += 'Property data is missing. Please go back and try again.';
        } else {
            errorMessage += 'Please try again or refresh the page.';
        }
        
        showModal('PDF Generation Failed', errorMessage);
    } finally {
        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;
    }
}

function getPDFExportOptions() {
    const titleInput = document.getElementById('pdfReportTitle');
    const inspectorNameInput = document.getElementById('pdfInspectorName');
    const photosCheckbox = document.getElementById('pdfIncludePhotos');
    
    const options = {
        reportTitle: titleInput ? titleInput.value.trim() || 'Property Assessment Report' : 'Property Assessment Report',
        inspectorName: inspectorNameInput ? inspectorNameInput.value.trim() || '' : '',
        includePhotos: photosCheckbox ? photosCheckbox.checked : true,
		includePurchaseGuidance: document.getElementById('pdfIncludePurchaseGuidance')?.checked ?? true,
        customLogo: null
    };
    
    // Get logo from storage
    try {
        const savedLogo = localStorage.getItem('pdfCompanyLogo');
        if (savedLogo) {
            options.customLogo = savedLogo;
        }
    } catch (error) {
        console.error('Failed to get saved logo:', error);
    }
    
    
    return options;
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('pdfExportModal');
    if (modal && !modal.classList.contains('hidden') && event.target === modal) {
        hidePDFExportModal();
    }
});

// Close modal with escape key
document.addEventListener('keydown', function(event) {
    const modal = document.getElementById('pdfExportModal');
    if (modal && !modal.classList.contains('hidden') && event.key === 'Escape') {
        hidePDFExportModal();
    }
});

// PDF Generation Functions - Add before exports
async function generatePropertyPDF(propertyId, options = {}) {
    
    // FIXED: Better class availability check with retries
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
        if (window.PropertyPDFGenerator) {
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
    }
    
    if (!window.PropertyPDFGenerator) {
        console.error('PropertyPDFGenerator class not found after retries');
        throw new Error('PDF generator not available. Please ensure pdf-report-generator.js is loaded correctly.');
    }
    
    // FIXED: Check jsPDF availability
    if (!window.jspdf && !window.jsPDF) {
        console.error('jsPDF library not found');
        throw new Error('jsPDF library not available. Please ensure jsPDF is loaded.');
    }
    
    const property = getProperty(propertyId);
    if (!property) {
        throw new Error('Property not found');
    }
    
    try {
        const generator = new window.PropertyPDFGenerator();
        
        const doc = await generator.generateReport(property, 'assessment', options);
        
        return { generator, doc, property };
    } catch (error) {
        console.error('PDF generation failed:', error);
        throw error;
    }
}


async function downloadPropertyPDF(propertyId, options = {}) {
    try {
        
        const { generator } = await generatePropertyPDF(propertyId, options);
        
        if (!generator || !generator.doc) {
            throw new Error('PDF generator not available');
        }
        
        const filename = `property-assessment-${propertyId}-${new Date().toISOString().split('T')[0]}.pdf`;
        
        // FIXED: Better download handling
        generator.downloadPDF(filename);
        
        
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
}


// FIXED: Checkbox toggle function
function togglePhotosCheckbox() {
    const checkbox = document.getElementById('pdfIncludePhotos');
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
    }
}

// FIXED: Image compression function for large logos
function compressImageToSize(imageData, maxSizeBytes, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate new dimensions to reduce file size
            let { width, height } = img;
            const maxDimension = 200; // Maximum width or height
            
            if (width > height && width > maxDimension) {
                height = (height * maxDimension) / width;
                width = maxDimension;
            } else if (height > maxDimension) {
                width = (width * maxDimension) / height;
                height = maxDimension;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Fill white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            
            // Draw image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to JPEG with quality compression
            const compressedData = canvas.toDataURL('image/jpeg', quality);
            
            if (compressedData.length > maxSizeBytes && quality > 0.1) {
                // Recursively reduce quality if still too large
                compressImageToSize(imageData, maxSizeBytes, quality - 0.1)
                    .then(resolve)
                    .catch(reject);
            } else {
                resolve(compressedData);
            }
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = imageData;
    });
}

// Export the new functions
window.togglePhotosCheckbox = togglePhotosCheckbox;
window.compressImageToSize = compressImageToSize;



// Export the new functions
window.showPDFExportModal = showPDFExportModal;
window.hidePDFExportModal = hidePDFExportModal;
window.handleLogoUpload = handleLogoUpload;
window.downloadPDFReport = downloadPDFReport;
window.getPDFExportOptions = getPDFExportOptions;
window.generatePropertyPDF = generatePropertyPDF;
window.downloadPropertyPDF = downloadPropertyPDF;

// Export the new functions
window.handleLogoUpload = handleLogoUpload;
window.removeStoredLogo = removeStoredLogo;
window.saveLogoToStorage = saveLogoToStorage;
window.loadSavedLogo = loadSavedLogo;

// Export new functions
window.toggleFeatureSection = toggleFeatureSection;

// Export the loading functions for use elsewhere if needed
window.showLoadingModal = showLoadingModal;
window.hideLoadingModal = hideLoadingModal;

// Export the function
window.getAvailableAssessmentTypes = getAvailableAssessmentTypes;
window.getTotalItemsForProperty = getTotalItemsForProperty;

// Export the function
window.getProperty = getProperty;

// Export assessment results functions
window.initializeAssessmentResults = initializeAssessmentResults;
window.displayAssessmentTypeSelection = displayAssessmentTypeSelection;
window.selectAssessmentType = selectAssessmentType;
window.generateQuickReport = generateQuickReport;
window.backToTypeSelection = backToTypeSelection;
window.showReportOptions = showReportOptions;
window.hideReportOptionsModal = hideReportOptionsModal;
window.generateReportWithOptions = generateReportWithOptions;
window.generatePDFReport = generatePDFReport;
window.continueAssessment = continueAssessment;

// Export functions
window.initNotifications = initNotifications;
window.checkTodaysAssessments = checkTodaysAssessments;
window.getUpcomingAssessments = getUpcomingAssessments;
window.renderUpcomingAssessments = renderUpcomingAssessments;
window.handlePropertyDetailsSubmitEnhanced = handlePropertyDetailsSubmitEnhanced;

// Core app functions
window.showScreen = showScreen;
window.handleHomeTileClick = handleHomeTileClick;
window.selectPropertyType = selectPropertyType;
window.resetApp = resetApp;
window.exitApp = exitApp;
window.openProperty = openProperty;
window.showSuccess = showSuccess;
window.showModal = showModal;
window.hideModal = hideModal;
window.handlePropertyDetailsSubmit = handlePropertyDetailsSubmit;
window.formatPrice = formatPrice;
window.initializeStandaloneCostCalculator = initializeStandaloneCostCalculator;

// Property detail view functions
window.renderPropertyDetailView = renderPropertyDetailView;
window.changeGalleryImage = changeGalleryImage;
window.selectGalleryImage = selectGalleryImage;
window.toggleDetailSection = toggleDetailSection;
window.togglePropertyCategory = togglePropertyCategory;
window.editProperty = editProperty;
window.exportPropertyReport = exportPropertyReport;
window.openCostCalculator = openCostCalculator;
window.viewLargePhoto = viewLargePhoto;
window.editPropertyLink = editPropertyLink;
window.isValidURL = isValidURL;

// CLEAN Feature management functions - SINGLE SOURCE
window.addFeatureToProperty = addFeatureToProperty;
window.removeFeatureFromProperty = removeFeatureFromProperty;
window.updateFeatureQuantity = updateFeatureQuantity;
window.renderFeaturesList = renderFeaturesList;
window.autoPopulateAssessmentRooms = autoPopulateAssessmentRooms;

// Export app state for debugging
window.appState = appState;

// Export new functions
window.toggleTheme = toggleTheme;
window.toggleNotifications = toggleNotifications;
window.showStorageInfo = showStorageInfo;
window.exportAppData = exportAppData;
window.showAboutModal = showAboutModal;

// Export the functions
window.refreshPropertyPhotos = refreshPropertyPhotos;
window.toggleManagementSection = toggleManagementSection;
window.addFeatureInManagement = addFeatureInManagement;
window.updateFeatureQuantityManagement = updateFeatureQuantityManagement;
window.removeFeatureFromManagement = removeFeatureFromManagement;

// Export profile picture functions
window.selectProfilePicture = selectProfilePicture;
window.getProfilePicture = getProfilePicture;
window.saveLinkFromModal = saveLinkFromModal;
window.handlePropertyProfilePicChange = handlePropertyProfilePicChange;
window.getCleanPhotoDescription = getCleanPhotoDescription;

// Update the property update function to not include photos
function updateProperty(propertyId, updates) {
    // Find property in appState.properties
    const propertyIndex = appState.properties.findIndex(p => p.id === propertyId);
    if (propertyIndex === -1) {
        console.error('Property not found:', propertyId);
        return null;
    }
    
    // Remove photos from updates to prevent localStorage storage
    const { photos, ...safeUpdates } = updates;
    
    // Update the property
    Object.assign(appState.properties[propertyIndex], safeUpdates);
    const updatedProperty = appState.properties[propertyIndex];
    
    // Update current property if it's the same one
    if (appState.currentProperty && appState.currentProperty.id === propertyId) {
        Object.assign(appState.currentProperty, safeUpdates);
    }
    
    // Save to storage
    saveAppData();
    
    return updatedProperty;
}

// Handle profile picture selection
function selectProfilePicture(propertyId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imageData = e.target.result;
                    handlePropertyProfilePicChange(propertyId, imageData);
                };
                reader.onerror = function(e) {
                    console.error('=== FILE READ ERROR ===', e);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error reading file:', error);
                showModal('Error', 'Failed to read image file. Please try again.');
            }
        } else {
        }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

// Get profile picture for display
function getProfilePicture(propertyId) {
    if (window.photoManager && window.photoManager.profilePictures) {
        return window.photoManager.profilePictures[propertyId] || null;
    }
    return null;
}

// Handle profile picture change from property list  
function handlePropertyProfilePicChange(propertyId, imageData) {
    
    // Save to photo manager
    if (window.photoManager && window.photoManager.saveProfilePictureToIndexedDB) {
        window.photoManager.saveProfilePictureToIndexedDB(propertyId, imageData);
    }
    
    // Update property
    const result = updateProperty(propertyId, { 
        hasProfilePicture: true,
        profilePictureUpdated: new Date().toISOString()
    });
    
    // Force UI update
    setTimeout(() => {
        updatePropertyList();
        showSuccess('Profile picture updated!');
    }, 500);
}

function deleteProperty(propertyId) {
    const property = getProperty(propertyId);
    if (!property) {
        showModal('Error', 'Property not found');
        return;
    }
    
    showModal(
        'Delete Property?',
        `<div style="text-align: center; padding: 20px 0;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #E63946, #DC2626); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; font-size: 1.5rem;">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <p><strong>Delete ${property.address}?</strong></p>
            <p>This will permanently delete all assessment data and photos.</p>
        </div>`,
        () => {
            try {
                
                // Delete from propertyDataManager if available, otherwise delete directly
                if (window.propertyDataManager && typeof window.propertyDataManager.deleteProperty === 'function') {
                    window.propertyDataManager.deleteProperty(propertyId);
                }
                // FIXED: always explicitly sync appState.properties ourselves too,
                // regardless of what propertyDataManager did internally. This is a
                // belt-and-braces guarantee against any timing/reference issue that
                // could leave a deleted property visible in the list until app restart.
                appState.properties = appState.properties.filter(p => p.id !== propertyId);
                saveAppData();
                
                // Delete photos if photo manager is available
                if (window.photoManager && typeof window.photoManager.deletePropertyPhotos === 'function') {
                    window.photoManager.deletePropertyPhotos(propertyId);
                }

                // FIXED: immediately remove the specific card element from the DOM
                // by ID, on top of the full re-render below. Guarantees the exact
                // card disappears instantly regardless of any render-path timing.
                document.querySelectorAll(`[data-id="${propertyId}"]`).forEach(el => el.remove());

                // Re-render every surface that can show a property list
                updatePropertyList();
                if (typeof renderHomeScreen === 'function') renderHomeScreen();
                updatePropertyCount();

                // FIXED: the upgrade strip's "X/2 free properties used" count
                // was never refreshed on delete — only on add. Refresh it here too.
                if (window.updateUpgradeStrip) window.updateUpgradeStrip();
                if (window.updateBannerUpgradeButton) window.updateBannerUpgradeButton();
                // FIXED: "My Properties (X/2)" header count was frozen at
                // whatever it showed on first render — refresh it here too.
                if (window.addLimitIndicators) window.addLimitIndicators();

                // Re-apply whichever filter tab (All/Assessed/Pending) was active —
                // freshly rendered cards default to visible regardless of prior filter
                const activeTab = document.querySelector('.filter-tab.active');
                if (activeTab && typeof filterProperties === 'function') {
                    const tabText = activeTab.textContent.toLowerCase();
                    const filter = tabText.includes('assessed') ? 'assessed' :
                                   tabText.includes('pending')  ? 'pending'  : 'all';
                    filterProperties(filter, activeTab);
                }

                showSuccess('Property deleted successfully!');
                
            } catch (error) {
                console.error('Error deleting property:', error);
                showModal('Error', 'Failed to delete property. Please try again.');
            }
        },
        'Delete',
        () => {
        },
        'Cancel'
    );
}

window.deleteProperty = deleteProperty;

function generateDetailedReportForProperty(propertyId) {
    const property = getProperty(propertyId);
    if (!property) {
        showModal('Error', 'Property not found');
        return;
    }
    
    // STRICT: Check if assessment is 100% complete before generating report
    const availableTypes = getAvailableAssessmentTypes(property);
    const selectedAssessment = availableTypes.find(type => type.type === 'assessment');
    
    if (!selectedAssessment || selectedAssessment.completeness < 100 || !selectedAssessment.canGenerate) {
        showModal('Assessment Incomplete', `
            <div class="incomplete-assessment-modal">
                <div class="incomplete-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h4>Assessment Must Be 100% Complete</h4>
                <p>This assessment is only ${selectedAssessment?.completeness || 0}% complete.</p>
                <p><strong>Please complete the assessment to 100% before generating a report.</strong></p>
            </div>
        `, () => {
            startAssessment(propertyId);
        }, 'Continue Assessment', null, 'Cancel');
        return;
    }
    
    // Set current property for the report generation
    appState.currentProperty = property;
    
    // Navigate to assessment results screen
    showScreen('assessmentResultsScreen');
    
    // Then generate the detailed report
    setTimeout(() => {
        generateDetailedReport();
    }, 100);
}

// Test modal button clicks
window.testModalButtons = function() {
    showModal(
        'Test Modal',
        'This is a test modal',
        () => {
            alert('Confirm button works!');
        },
        'Test OK',
        () => {
            alert('Cancel button works!');
        },
        'Test Cancel'
    );
};

// Analytics Functions
function initializeAnalytics() {
    // Track app start
    trackEvent('app_start', {
        platform: 'android_webview',
        app_version: '1.13'
    });
}

function trackEvent(eventName, parameters = {}) {
    // Web Analytics (gtag)
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
    
    // Android Analytics via bridge
    if (window.Android && window.Android.trackAnalyticsEvent) {
        window.Android.trackAnalyticsEvent(eventName, JSON.stringify(parameters));
    }
    
}

// Android Back Button Handler
window.handleAndroidBackButton = function() {
    
    if (appState.currentScreen === 'homeScreen') {
        // On home screen - let Android handle (exit app)
        if (window.Android && window.Android.handleBackNavigation) {
            window.Android.handleBackNavigation(false);
        }
    } else {
        // On any other screen - go back to home
        showScreen('homeScreen');
        if (window.Android && window.Android.handleBackNavigation) {
            window.Android.handleBackNavigation(true);
        }
    }
};

// Export analytics functions
window.trackEvent = trackEvent;
window.initializeAnalytics = initializeAnalytics;

// ====================================================================
// VIDEO NOTIFICATION SYSTEM — Remote Config + FCM
// ====================================================================

(function injectVideoNotifStyles() {
    if (document.getElementById("vnb-styles")) return;
    const style = document.createElement("style");
    style.id = "vnb-styles";
    style.textContent = `
        .vnb-wrap {
            margin: 0 16px 12px;
            background: #0d1f30;
            border: 1px solid rgba(6,214,160,0.35);
            border-radius: 14px;
            overflow: hidden;
            animation: vnbSlideDown 0.35s cubic-bezier(0.32,0.72,0,1);
        }
        @keyframes vnbSlideDown {
            from { opacity:0; transform:translateY(-12px); }
            to   { opacity:1; transform:translateY(0); }
        }
        .vnb-inner {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 14px;
        }
        .vnb-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: rgba(6,214,160,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #06D6A0;
            font-size: 18px;
            flex-shrink: 0;
        }
        .vnb-text {
            flex: 1;
            min-width: 0;
        }
        .vnb-text strong {
            display: block;
            font-size: 12px;
            font-weight: 700;
            color: #e8f1f8;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .vnb-text span {
            font-size: 11px;
            color: #8bbad4;
        }
        .vnb-watch {
            flex-shrink: 0;
            background: #06D6A0;
            color: #0d1520;
            border: none;
            border-radius: 8px;
            padding: 7px 13px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
        }
        .vnb-watch:active { background: #05bf8e; }
        .vnb-dismiss {
            flex-shrink: 0;
            background: transparent;
            border: none;
            color: #5a85a0;
            font-size: 14px;
            cursor: pointer;
            padding: 4px 6px;
        }
        /* Contextual hint — small teal bar under a section header */
        .video-hint {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: rgba(6,214,160,0.08);
            border-left: 3px solid #06D6A0;
            border-radius: 0 8px 8px 0;
            margin: 8px 16px 4px;
            font-size: 11px;
            color: #8bbad4;
            cursor: pointer;
            animation: vnbSlideDown 0.3s ease;
        }
        .video-hint i { color: #06D6A0; font-size: 13px; }
        .video-hint strong { color: #06D6A0; }
    `;
    document.head.appendChild(style);
})();

window.showVideoNotification = function(config) {
    if (!config || !config.url) return;

    // Only skip dismissed if NOT a forced FCM-click notification
    if (!config.forceShow) {
        try {
            const dismissed = JSON.parse(localStorage.getItem("hbg_dismissed_videos") || "[]");
            if (dismissed.includes(config.id)) return;
        } catch (e) {}
    }

    // Remove any existing banner first
    const existing = document.getElementById("videoNotifBanner");
    if (existing) existing.remove();

    const banner = document.createElement("div");
    banner.id = "videoNotifBanner";
    banner.className = "vnb-wrap";
    banner.innerHTML = `
        <div class="vnb-inner">
            <div class="vnb-icon"><i class="fas fa-play-circle"></i></div>
            <div class="vnb-text">
                <strong>${config.title || "New Training Video"}</strong>
                <span>${config.subtitle || "Watch the guide"}</span>
            </div>
            <button class="vnb-watch"
                onclick="watchVideoNotification('${config.url}','${config.id || ""}')"
            >Watch</button>
            <button class="vnb-dismiss"
                onclick="dismissVideoNotification('${config.id || ""}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Insert at the top of the target screen content (below fixed header)
    const targetId = config.screen || "homeScreen";
    const screen = document.getElementById(targetId);
    if (screen) {
        // Insert after the first .screen-header if present, else prepend
        const header = screen.querySelector(".screen-header, .app-header-banner");
        if (header && header.nextSibling) {
            screen.insertBefore(banner, header.nextSibling);
        } else {
            screen.insertAdjacentElement("afterbegin", banner);
        }
        // If user is not on this screen, store and show on next visit
        if (appState.currentScreen !== targetId) {
            banner.style.display = "none";
            window._pendingVideoConfig = config;
        }
    }
};

window.watchVideoNotification = function(url, videoId) {
    dismissVideoNotification(videoId);
    trackEvent("video_watched", { video_id: videoId, video_url: url });
    if (window.Android && window.Android.openExternalUrl) {
        window.Android.openExternalUrl(url);
    } else {
        window.open(url, "_blank");
    }
};

window.dismissVideoNotification = function(videoId) {
    if (videoId) {
        try {
            const dismissed = JSON.parse(localStorage.getItem("hbg_dismissed_videos") || "[]");
            if (!dismissed.includes(videoId)) {
                dismissed.push(videoId);
                localStorage.setItem("hbg_dismissed_videos", JSON.stringify(dismissed));
            }
        } catch (e) {}
    }
    const banner = document.getElementById("videoNotifBanner");
    if (banner) {
        banner.style.opacity = "0";
        banner.style.transition = "opacity 0.2s";
        setTimeout(() => banner.remove(), 200);
    }
    window._pendingVideoConfig = null;
};

// Show pending notification when user navigates to its target screen
const _origOnScreenChanged = window.onScreenChanged || function() {};
window._videoNotifScreenHook = function(screenId) {
    if (window._pendingVideoConfig && screenId === (window._pendingVideoConfig.screen || "homeScreen")) {
        const banner = document.getElementById("videoNotifBanner");
        if (banner) banner.style.display = "";
        window._pendingVideoConfig = null;
    }
};

// Calendar Functions
function addToCalendar(propertyId) {
    const property = getProperty(propertyId);
    if (!property || !property.assessmentDate) {
        showModal('Error', 'No assessment date set for this property.');
        return;
    }
    
    const assessmentDate = new Date(property.assessmentDate);
    const title = `Property Assessment: ${property.address}`;
    const details = `Assessment for ${property.type} at ${property.address}${property.suburb ? ', ' + property.suburb : ''}`;
    
    // Try Android bridge first
    if (window.Android && window.Android.addToCalendar) {
        try {
            // Format date for Android (ISO string)
            const dateString = assessmentDate.toISOString();
            window.Android.addToCalendar(title, dateString, details);
            return;
        } catch (error) {
            console.error('Android calendar bridge failed:', error);
        }
    }
    
    // Fallback: Generate calendar URL for web
    const startTime = assessmentDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = new Date(assessmentDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(property.address)}`;
    
    showModal('Add to Calendar', `
        <div class="calendar-modal">
            <div class="calendar-options">
                <h4>Choose your calendar app:</h4>
                <button class="calendar-option-btn" onclick="window.open('${googleCalendarUrl}', '_blank'); hideModal();">
                    <i class="fab fa-google"></i> Google Calendar
                </button>
                <button class="calendar-option-btn" onclick="downloadICSFile('${propertyId}'); hideModal();">
                    <i class="fas fa-download"></i> Download .ics file
                </button>
            </div>
        </div>
    `, null, null, null, 'Cancel');
}

// Schedule an in-app push notification for the assessment date
function scheduleAssessmentReminder(propertyId) {
    const property = getProperty(propertyId);
    if (!property || !property.assessmentDate) {
        showModal('No Date Set', 'Please set an assessment date first by editing the property.');
        return;
    }
    const d = new Date(property.assessmentDate);
    if (d <= new Date()) {
        showModal('Date in the Past', 'The assessment date is in the past. Please update it.');
        return;
    }
    if (!appState.settings.notifications) {
        showModal('Notifications Off', 'Turn on notifications in Settings to receive reminders.');
        return;
    }
    if (window.Android && window.Android.scheduleReminder) {
        try {
            window.Android.scheduleReminder(property.address, d.toISOString());
        } catch (e) {}
    } else {
        // Web fallback — use Notification API
        if ('Notification' in window && Notification.permission === 'granted') {
            const delay = d.getTime() - Date.now();
            if (delay > 0) {
                setTimeout(() => {
                    new Notification('Property Assessment Reminder', {
                        body: `Time to assess: ${property.address}`,
                        icon: '/favicon.png'
                    });
                }, delay);
                showSuccess('Reminder set for ' + d.toLocaleString());
            }
        } else {
            showModal('Not Supported', 'Push notifications are not available in this context.');
        }
    }
}
window.scheduleAssessmentReminder = scheduleAssessmentReminder;


function downloadICSFile(propertyId) {
    const property = getProperty(propertyId);
    const assessmentDate = new Date(property.assessmentDate);
    
    const startTime = assessmentDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = new Date(assessmentDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Home Buyers Guide SA//Property Assessment//EN
BEGIN:VEVENT
UID:${property.id}-${Date.now()}@propertyinspector.app
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}
DTSTART:${startTime}
DTEND:${endTime}
SUMMARY:Property Assessment: ${property.address}
DESCRIPTION:Assessment for ${property.type} at ${property.address}${property.suburb ? ', ' + property.suburb : ''}
LOCATION:${property.address}${property.suburb ? ', ' + property.suburb : ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `property-assessment-${property.id}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    
    showSuccess('Calendar file downloaded!');
}

// Export the new functions
window.addToCalendar = addToCalendar;
window.downloadICSFile = downloadICSFile;


// Share App Function
function shareApp() {
    try {
        if (typeof Android !== 'undefined' && Android.shareApp) {
            Android.shareApp();
            
            // Show success feedback
            showSuccess('Share menu opened!');
            
            // Track in Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'share', {
                    'event_category': 'engagement',
                    'event_label': 'app_share_button',
                    'value': 1
                });
            }
        } else {
            // Fallback for web/testing
            const shareData = {
                title: 'Home Buyers Guide SA',
                text: 'Check out Home Buyers Guide SA - Know Before You Buy! The ultimate property assessment app.',
                url: 'https://play.google.com/store/apps/details?id=com.joelapexs.propertyinspector'
            };
            
            if (navigator.share) {
                navigator.share(shareData);
            } else {
                alert('Download Home Buyers Guide SA:\nhttps://play.google.com/store/apps/details?id=com.joelapexs.propertyinspector');
            }
        }
    } catch (error) {
        console.error('Share error:', error);
        showModal('Info', 'Unable to open share menu. Please try again.');
    }
}

// Export shareApp function
window.shareApp = shareApp;

// ═══════════════════════════════════════════════════════════════
// CUSTOMIZE ASSESSMENT SCREEN
// ═══════════════════════════════════════════════════════════════

function initCustomizeScreen() {
    renderCustomizeScreen();
}

function renderCustomizeScreen() {
    renderCustomFeaturesList();
    renderCustomQuestionsList();
}

// ── Render custom features list ──────────────────────────────

function renderCustomFeaturesList() {
    const container = document.getElementById('customFeaturesList');
    if (!container) return;

    const config   = getCustomConfig();
    const features = config.customFeatures;

    if (features.length === 0) {
        container.innerHTML = `
            <div class="cust-empty-state">
                <i class="fas fa-puzzle-piece"></i>
                <p>No custom features yet.<br>Tap <strong>Add Feature</strong> to get started.</p>
            </div>`;
        return;
    }

    container.innerHTML = features.map(feature => {
        const color    = SECTION_COLORS[feature.section] || '#6F42C1';
        const label    = SECTION_LABELS[feature.section]  || feature.section;
        const excluded = feature.excluded;
        const count    = feature.items.length;

        return `
        <div class="cust-feat-card${excluded ? ' cf-excluded' : ''}" id="featCard_${feature.id}">
            <!-- Row header -->
            <div class="cust-feat-row" onclick="toggleFeatureCard('${feature.id}')">
                <span class="cf-dot" style="background:${color}"></span>
                <div class="cf-info">
                    <span class="cf-name">${feature.name}</span>
                    <span class="cf-meta">${label}&ensp;·&ensp;${count} item${count !== 1 ? 's' : ''}${excluded ? '&ensp;·&ensp;<em>Excluded</em>' : ''}</span>
                </div>
                <div class="cf-actions" onclick="event.stopPropagation()">
                    <button class="cf-btn" onclick="showEditFeatureModal('${feature.id}')" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                    <button class="cf-btn cf-del" onclick="deleteCustomFeatureUI('${feature.id}')" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    <i class="fas fa-chevron-down cf-chev" id="chevron_${feature.id}"></i>
                </div>
            </div>

            <!-- Expanded items -->
            <div class="cf-expanded" id="featItems_${feature.id}" style="display:none">
                ${feature.items.length === 0 ? `<p class="cf-no-items">No items yet — tap Add Item below.</p>` :
                    feature.items.map(item => `
                    <div class="cf-item-row">
                        <span class="cf-item-bullet" style="background:${color}"></span>
                        <span class="cf-item-name">${item.name}</span>
                        <span class="cf-item-wt">${item.weightLabel}</span>
                        ${(item.guidance?.excellent || item.guidance?.good || item.guidance?.fair || item.guidance?.poor) ? '<span class="cf-guide-pill">guide</span>' : ''}
                        <div class="cf-actions">
                            <button class="cf-btn" onclick="showEditItemModal('${feature.id}','${item.id}')" title="Edit item"><i class="fas fa-pencil-alt"></i></button>
                            <button class="cf-btn cf-del" onclick="deleteCustomItemUI('${feature.id}','${item.id}')" title="Delete item"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>`).join('')
                }
                <div class="cf-expanded-foot">
                    <button class="cf-add-item" onclick="showAddItemModal('${feature.id}')">
                        <i class="fas fa-plus-circle"></i> Add Item
                    </button>
                    <label class="cf-exclude-row" onclick="toggleFeatureExcludeUI('${feature.id}')">
                        <span class="cf-exclude-lbl">Exclude from new assessments</span>
                        <div class="stg-toggle" style="cursor:pointer">
                            <div class="stg-toggle-knob" style="${excluded ? 'transform:translateX(22px)' : ''}"></div>
                        </div>
                    </label>
                </div>
            </div>
        </div>`;
    }).join('');
}

function toggleFeatureCard(featureId) {
    const body    = document.getElementById('featItems_'  + featureId);
    const chevron = document.getElementById('chevron_'    + featureId);
    if (!body) return;
    const open = body.style.display !== 'none';
    body.style.display    = open ? 'none' : '';
    chevron.classList.toggle('open', !open);
}

// ── Render custom questions list ─────────────────────────────

function renderCustomQuestionsList() {
    const container = document.getElementById('customQuestionsList');
    if (!container) return;

    const config    = getCustomConfig();
    const questions = config.customQuestions;

    if (questions.length === 0) {
        container.innerHTML = `
            <div class="cust-empty-state">
                <i class="fas fa-question-circle"></i>
                <p>No custom questions yet.<br>Tap <strong>Add Question</strong> to add one.</p>
            </div>`;
        return;
    }

    container.innerHTML = questions.map(q => `
        <div class="cust-q-compact">
            <span class="cf-dot" style="background:var(--brand-green)"></span>
            <span class="cf-name" style="flex:1">${q.question}</span>
            <div class="cf-actions">
                <button class="cf-btn" onclick="showEditQuestionModal('${q.id}')" title="Edit question"><i class="fas fa-pencil-alt"></i></button>
                <button class="cf-btn cf-del" onclick="deleteCustomQuestionUI('${q.id}')" title="Delete question"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>`).join('');
}

// ── Info card toggle ─────────────────────────────────────────

function toggleCustInfo() {
    const body    = document.getElementById('custInfoBody');
    const chevron = document.getElementById('custInfoChevron');
    if (!body) return;
    const open = body.classList.toggle('open');
    chevron.classList.toggle('open', open);
}

// ── Modal helpers ────────────────────────────────────────────
// Mirrors the existing showModal pattern: creates element + appends to document.body
// This avoids stacking context issues caused by screen animation transforms.

function openCustModal(title, bodyHTML, saveLabel, onSave) {
    const existing = document.getElementById('custModalInstance');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custModalInstance';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.82);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';

    overlay.innerHTML = `
        <div style="background:var(--bg-primary);border-radius:20px;width:100%;max-width:500px;max-height:calc(100vh - 140px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.6)">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px 15px;border-bottom:0.5px solid var(--border);flex-shrink:0">
                <h3 style="font-size:1rem;font-weight:700;color:var(--text-1);margin:0;font-family:'Poppins',sans-serif">${title}</h3>
                <button onclick="closeCustModal()" style="width:34px;height:34px;border-radius:50%;background:var(--surface);border:none;color:var(--text-3);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.82rem"><i class="fas fa-times"></i></button>
            </div>
            <div style="flex:1;overflow-y:auto;padding:18px 20px;-webkit-overflow-scrolling:touch">
                ${bodyHTML}
            </div>
            <div style="padding:14px 20px;border-top:0.5px solid var(--border);display:flex;gap:10px;flex-shrink:0;background:var(--bg-primary)">
                <button onclick="closeCustModal()" style="flex:1;padding:13px;border-radius:12px;font-size:0.88rem;font-weight:600;cursor:pointer;font-family:'Poppins',sans-serif;background:var(--surface);color:var(--text-2);border:1px solid var(--border)">Cancel</button>
                <button onclick="_custModalSave()" style="flex:1;padding:13px;border-radius:12px;font-size:0.88rem;font-weight:600;cursor:pointer;font-family:'Poppins',sans-serif;background:var(--gradient-success);color:#fff;border:none">${saveLabel}</button>
            </div>
        </div>
    `;

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCustModal(); });
    window._custModalSaveFn = onSave;
    document.body.appendChild(overlay);
}

function closeCustModal() {
    const modal = document.getElementById('custModalInstance');
    if (modal) modal.remove();
}

function closeCustModalOnBg(e) {
    if (e.target && e.target.id === 'custModalInstance') closeCustModal();
}

function _custModalSave() {
    if (typeof window._custModalSaveFn === 'function') window._custModalSaveFn();
}

// ── Add Feature Modal — unified: feature details + first item in one form ──

function showAddFeatureModal() {
    const weightOpts = WEIGHT_OPTIONS.map(w =>
        `<option value="${w.value}">${w.label} (${w.value})</option>`
    ).join('');

    const fieldStyle  = 'margin-bottom:16px';
    const labelStyle  = 'display:block;font-size:0.78rem;font-weight:600;color:var(--text-2);margin-bottom:6px;font-family:Poppins,sans-serif';
    const hintStyle   = 'display:block;font-size:0.7rem;color:var(--text-3);margin-top:4px;line-height:1.4;font-family:Poppins,sans-serif';
    const inputStyle  = 'width:100%;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:11px 13px;color:var(--text-1);font-size:0.85rem;font-family:Poppins,sans-serif;box-sizing:border-box';
    const divStyle    = 'display:flex;align-items:center;gap:8px;margin:18px 0 14px;color:var(--brand-green);font-size:0.8rem;font-weight:700;font-family:Poppins,sans-serif';
    const divLine     = 'flex:1;height:1px;background:var(--border)';

    const body = `
        <!-- FEATURE DETAILS -->
        <div style="${fieldStyle}">
            <label style="${labelStyle}">Feature Name <span style="color:#ef4444">*</span></label>
            <input id="cfName" type="text" maxlength="60" placeholder="e.g. Granny Flat, Borehole, Solar System" style="${inputStyle}">
            <span style="${hintStyle}">The name of the feature group (e.g. Granny Flat).</span>
        </div>
        <div style="${fieldStyle}">
            <label style="${labelStyle}">Section <span style="color:#ef4444">*</span></label>
            <select id="cfSection" style="${inputStyle}">
                <option value="exterior">Exterior Assessment</option>
                <option value="interior">Interior Assessment</option>
                <option value="location">Location &amp; Neighbourhood</option>
                <option value="other">Other Features Assessment</option>
            </select>
            <span style="${hintStyle}">Which part of the assessment this feature belongs to.</span>
        </div>

        <!-- DIVIDER -->
        <div style="${divStyle}">
            <div style="${divLine}"></div>
            <span><i class="fas fa-plus-circle" style="margin-right:5px"></i>Add First Item to Inspect</span>
            <div style="${divLine}"></div>
        </div>

        <!-- ITEM DETAILS -->
        <div style="${fieldStyle}">
            <label style="${labelStyle}">Item Name <span style="color:#ef4444">*</span></label>
            <input id="cfiName" type="text" maxlength="80" placeholder="e.g. Structural Condition, Water Pressure" style="${inputStyle}">
        </div>
        <div style="${fieldStyle}">
            <label style="${labelStyle}">Tooltip — What to look for <span style="color:#ef4444">*</span>
                <span style="font-weight:400;color:var(--text-3)"> · shown to assessor during inspection</span>
            </label>
            <textarea id="cfiTooltip" rows="3" placeholder="e.g. Check walls and ceiling for cracks, damp patches, or signs of settling..." style="${inputStyle};resize:vertical;line-height:1.5"></textarea>
        </div>
        <div style="${fieldStyle}">
            <label style="${labelStyle}">Weight — Impact on Score <span style="color:#ef4444">*</span></label>
            <select id="cfiWeight" style="${inputStyle}">
                <option value="" disabled selected>Select weight...</option>
                ${weightOpts}
            </select>
            <span style="${hintStyle}">Low (1) = minor · Moderate (2) = standard · High (3) = significant · Very High (3.5) = major · Critical (4) = deal-breaker</span>
        </div>

        <!-- GUIDANCE (COLLAPSIBLE) -->
        <div style="border-top:0.5px solid var(--divider);margin-top:4px;padding-top:12px">
            <div onclick="toggleCustGuidance()" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;margin-bottom:8px">
                <span style="font-size:0.82rem;font-weight:600;color:var(--text-2);font-family:Poppins,sans-serif;display:flex;align-items:center;gap:7px">
                    <i class="fas fa-clipboard-list" style="color:var(--brand-green);font-size:0.78rem"></i>
                    Guidance
                    <span style="font-size:0.65rem;color:var(--text-3);background:var(--surface);padding:2px 6px;border-radius:99px">Optional</span>
                </span>
                <i class="fas fa-chevron-down" id="guidanceChevron" style="font-size:0.75rem;color:var(--text-3);transition:transform 0.2s"></i>
            </div>
            <div id="custGuidanceBody" style="display:none">
                <p style="font-size:0.72rem;color:var(--text-3);margin:0 0 12px;line-height:1.5;font-family:Poppins,sans-serif">Define what each rating looks like. If left blank, the assessor can add their own notes in the Full Report screen before generating the PDF.</p>
                <div style="${fieldStyle}">
                    <label style="${labelStyle}">✅ Excellent</label>
                    <textarea id="guideExcellent" rows="2" placeholder="No visible defects, fully operational..." style="${inputStyle};resize:vertical"></textarea>
                </div>
                <div style="${fieldStyle}">
                    <label style="${labelStyle}">👍 Good</label>
                    <textarea id="guideGood" rows="2" placeholder="Minor cosmetic issues, functional..." style="${inputStyle};resize:vertical"></textarea>
                </div>
                <div style="${fieldStyle}">
                    <label style="${labelStyle}">⚠️ Fair</label>
                    <textarea id="guideFair" rows="2" placeholder="Some maintenance needed..." style="${inputStyle};resize:vertical"></textarea>
                </div>
                <div style="${fieldStyle}">
                    <label style="${labelStyle}">❌ Poor</label>
                    <textarea id="guidePoor" rows="2" placeholder="Major repairs required, consider impact on purchase..." style="${inputStyle};resize:vertical"></textarea>
                </div>
            </div>
        </div>
    `;

    openCustModal('Add Custom Feature', body, 'Save Feature ✓', () => {
        // Read all values
        const featureName = document.getElementById('cfName').value.trim();
        const section     = document.getElementById('cfSection').value;
        const itemName    = document.getElementById('cfiName').value.trim();
        const tooltip     = document.getElementById('cfiTooltip').value.trim();
        const weight      = document.getElementById('cfiWeight').value;

        // Validate feature
        if (!featureName) { _custModalAlert('Please enter a Feature Name.'); return; }
        // Validate item
        if (!itemName)    { _custModalAlert('Please enter an Item Name.'); return; }
        if (!tooltip)     { _custModalAlert('Please enter a Tooltip for the item.'); return; }
        if (!weight)      { _custModalAlert('Please select a Weight for the item.'); return; }

        const wLabel = WEIGHT_OPTIONS.find(w => String(w.value) === String(weight))?.label || '';

        // Create feature + item together (always dropdown)
        const feature = addCustomFeature({ name: featureName, section });
        addCustomFeatureItem(feature.id, {
            name: itemName, tooltip,
            weightLabel: wLabel, weightValue: Number(weight),
            includeAs: 'dropdown',
            guidance: {
                excellent: (document.getElementById('guideExcellent')?.value || '').trim(),
                good:      (document.getElementById('guideGood')?.value      || '').trim(),
                fair:      (document.getElementById('guideFair')?.value      || '').trim(),
                poor:      (document.getElementById('guidePoor')?.value      || '').trim()
            }
        });

        closeCustModal();
        renderCustomFeaturesList();
        // Auto-expand the new feature card so user sees their item immediately
        setTimeout(() => {
            const body = document.getElementById('featItems_' + feature.id);
            const chev = document.getElementById('chevron_'   + feature.id);
            if (body) { body.style.display = ''; if (chev) chev.classList.add('open'); }
        }, 80);
        showSuccess('Feature and item saved!');
    });
}

// Visual toggle for Include As buttons
function selectIncludeAs(value) {
    const dd = document.getElementById('inclDropdown');
    const mn = document.getElementById('inclMain');
    const hd = document.getElementById('cfIncludeAs');
    if (!dd || !mn || !hd) return;

    const activeStyle   = 'flex:1;border:1.5px solid var(--brand-green);border-radius:12px;padding:11px 8px;cursor:pointer;text-align:center;background:rgba(29,158,117,0.08)';
    const inactiveStyle = 'flex:1;border:1.5px solid var(--border);border-radius:12px;padding:11px 8px;cursor:pointer;text-align:center';

    if (value === 'dropdown') {
        dd.style.cssText = activeStyle;
        mn.style.cssText = inactiveStyle;
        dd.querySelector('i').style.color  = 'var(--brand-green)';
        mn.querySelector('i').style.color  = 'var(--text-3)';
        dd.querySelector('span').style.color = 'var(--brand-green)';
        mn.querySelector('span').style.color = 'var(--text-2)';
    } else {
        mn.style.cssText = activeStyle;
        dd.style.cssText = inactiveStyle;
        mn.querySelector('i').style.color  = 'var(--brand-green)';
        dd.querySelector('i').style.color  = 'var(--text-3)';
        mn.querySelector('span').style.color = 'var(--brand-green)';
        dd.querySelector('span').style.color = 'var(--text-2)';
    }
    hd.value = value;
}

function _custModalAlert(msg) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);background:#ef4444;color:#fff;padding:10px 20px;border-radius:10px;font-size:0.82rem;font-weight:600;z-index:99999;font-family:Poppins,sans-serif;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.3)';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
}

function toggleCustGuidance() {
    const body = document.getElementById('custGuidanceBody');
    const chev = document.getElementById('guidanceChevron');
    if (!body) return;
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : '';
    if (chev) chev.style.transform = open ? '' : 'rotate(180deg)';
}

// ── Add Item Modal — for adding MORE items to an existing feature ──

function showAddItemModal(featureId) {
    const config  = getCustomConfig();
    const feature = config.customFeatures.find(f => f.id === featureId);
    if (!feature) return;

    const weightOpts  = WEIGHT_OPTIONS.map(w =>
        `<option value="${w.value}">${w.label} (${w.value})</option>`
    ).join('');
    const s = 'width:100%;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:11px 13px;color:var(--text-1);font-size:0.85rem;font-family:Poppins,sans-serif;box-sizing:border-box';
    const l = 'display:block;font-size:0.78rem;font-weight:600;color:var(--text-2);margin-bottom:6px;font-family:Poppins,sans-serif';
    const h = 'display:block;font-size:0.7rem;color:var(--text-3);margin-top:4px;line-height:1.4;font-family:Poppins,sans-serif';

    const body = `
        <div style="margin-bottom:16px">
            <label style="${l}">Item Name <span style="color:#ef4444">*</span></label>
            <input type="text" id="cfiName" maxlength="80" placeholder="e.g. Structural Condition, Pump Pressure" style="${s}">
        </div>
        <div style="margin-bottom:16px">
            <label style="${l}">Tooltip — What to look for <span style="color:#ef4444">*</span></label>
            <textarea id="cfiTooltip" rows="3" placeholder="e.g. Check for cracks, damp patches, signs of settling..." style="${s};resize:vertical;line-height:1.5"></textarea>
            <span style="${h}">Shown as a hint to the assessor during the assessment.</span>
        </div>
        <div style="margin-bottom:16px">
            <label style="${l}">Weight — Impact on Score <span style="color:#ef4444">*</span></label>
            <select id="cfiWeight" style="${s}">
                <option value="" disabled selected>Select weight...</option>
                ${weightOpts}
            </select>
            <span style="${h}">Low (1) = minor · Moderate (2) = standard · High (3) = significant · Very High (3.5) = major · Critical (4) = deal-breaker</span>
        </div>
        <div style="border-top:0.5px solid var(--divider);padding-top:12px">
            <div onclick="toggleCustGuidance()" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;margin-bottom:8px">
                <span style="font-size:0.82rem;font-weight:600;color:var(--text-2);font-family:Poppins,sans-serif;display:flex;align-items:center;gap:7px">
                    <i class="fas fa-clipboard-list" style="color:var(--brand-green);font-size:0.78rem"></i>
                    Guidance
                    <span style="font-size:0.65rem;color:var(--text-3);background:var(--surface);padding:2px 6px;border-radius:99px">Optional</span>
                </span>
                <i class="fas fa-chevron-down" id="guidanceChevron" style="font-size:0.75rem;color:var(--text-3)"></i>
            </div>
            <div id="custGuidanceBody" style="display:none">
                <span style="${h};display:block;margin-bottom:10px">Define what each rating looks like. Leave blank to add notes manually in the Full Report screen.</span>
                <div style="margin-bottom:12px"><label style="${l}">✅ Excellent</label><textarea id="guideExcellent" rows="2" placeholder="No visible defects, fully operational..." style="${s};resize:vertical"></textarea></div>
                <div style="margin-bottom:12px"><label style="${l}">👍 Good</label><textarea id="guideGood" rows="2" placeholder="Minor cosmetic issues, functional..." style="${s};resize:vertical"></textarea></div>
                <div style="margin-bottom:12px"><label style="${l}">⚠️ Fair</label><textarea id="guideFair" rows="2" placeholder="Some maintenance needed..." style="${s};resize:vertical"></textarea></div>
                <div style="margin-bottom:4px"><label style="${l}">❌ Poor</label><textarea id="guidePoor" rows="2" placeholder="Major repairs required..." style="${s};resize:vertical"></textarea></div>
            </div>
        </div>`;

    openCustModal(`Add Item to "${feature.name}"`, body, 'Save Item ✓', () => {
        const name    = document.getElementById('cfiName').value.trim();
        const tooltip = document.getElementById('cfiTooltip').value.trim();
        const weight  = document.getElementById('cfiWeight').value;
        const wLabel  = WEIGHT_OPTIONS.find(w => String(w.value) === String(weight))?.label || '';
        if (!name)    { _custModalAlert('Please enter an item name.'); return; }
        if (!tooltip) { _custModalAlert('Please enter a tooltip.'); return; }
        if (!weight)  { _custModalAlert('Please select a weight.'); return; }
        addCustomFeatureItem(featureId, {
            name, tooltip,
            weightLabel: wLabel, weightValue: Number(weight),
            includeAs: 'dropdown',
            guidance: {
                excellent: (document.getElementById('guideExcellent')?.value || '').trim(),
                good:      (document.getElementById('guideGood')?.value      || '').trim(),
                fair:      (document.getElementById('guideFair')?.value      || '').trim(),
                poor:      (document.getElementById('guidePoor')?.value      || '').trim()
            }
        });
        closeCustModal();
        renderCustomFeaturesList();
        setTimeout(() => {
            const b = document.getElementById('featItems_' + featureId);
            const c = document.getElementById('chevron_'   + featureId);
            if (b) { b.style.display = ''; if (c) c.classList.add('open'); }
        }, 80);
        showSuccess('Item added!');
    });
}

// ── Add Question Modal ────────────────────────────────────────

function showAddQuestionModal() {
    const s = 'width:100%;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:11px 13px;color:var(--text-1);font-size:0.85rem;font-family:Poppins,sans-serif;box-sizing:border-box';
    const l = 'display:block;font-size:0.78rem;font-weight:600;color:var(--text-2);margin-bottom:6px;font-family:Poppins,sans-serif';
    const h = 'display:block;font-size:0.7rem;color:var(--text-3);margin-top:4px;line-height:1.4;font-family:Poppins,sans-serif';

    const body = `
        <div style="margin-bottom:16px">
            <label style="${l}">Question <span style="color:#ef4444">*</span></label>
            <textarea id="cqQuestion" rows="3" placeholder="e.g. Has the property been renovated in the last 5 years?" style="${s};resize:vertical;line-height:1.5"></textarea>
        </div>
        <div style="margin-bottom:8px">
            <label style="${l}">Tooltip — Context for the assessor</label>
            <textarea id="cqTooltip" rows="2" placeholder="e.g. Ask the agent or check property records for renovation permits..." style="${s};resize:vertical;line-height:1.5"></textarea>
            <span style="${h}">Optional hint shown when the assessor taps the info button.</span>
        </div>`;

    openCustModal('Add Custom Question', body, 'Save Question ✓', () => {
        const question = document.getElementById('cqQuestion').value.trim();
        const tooltip  = document.getElementById('cqTooltip').value.trim();
        if (!question) { _custModalAlert('Please enter a question.'); return; }
        addCustomQuestion({ question, tooltip });
        closeCustModal();
        renderCustomQuestionsList();
        showSuccess('Question added!');
    });
}

// ── Delete handlers ───────────────────────────────────────────

function showEditFeatureModal(featureId) {
    const config  = getCustomConfig();
    const feature = config.customFeatures.find(f => f.id === featureId);
    if (!feature) return;

    const s = 'width:100%;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:11px 13px;color:var(--text-1);font-size:0.85rem;font-family:Poppins,sans-serif;box-sizing:border-box';
    const l = 'display:block;font-size:0.78rem;font-weight:600;color:var(--text-2);margin-bottom:6px;font-family:Poppins,sans-serif';

    const body = `
        <div style="margin-bottom:16px">
            <label style="${l}">Feature Name <span style="color:#ef4444">*</span></label>
            <input id="efName" type="text" maxlength="60" value="${feature.name}" style="${s}">
        </div>
        <div style="margin-bottom:8px">
            <label style="${l}">Section <span style="color:#ef4444">*</span></label>
            <select id="efSection" style="${s}">
                <option value="exterior" ${feature.section==='exterior'?'selected':''}>Exterior Assessment</option>
                <option value="interior" ${feature.section==='interior'?'selected':''}>Interior Assessment</option>
                <option value="location" ${feature.section==='location'?'selected':''}>Location &amp; Neighbourhood</option>
                <option value="other"    ${feature.section==='other'   ?'selected':''}>Other Features Assessment</option>
            </select>
        </div>`;

    openCustModal('Edit Feature', body, 'Save Changes ✓', () => {
        const name    = document.getElementById('efName').value.trim();
        const section = document.getElementById('efSection').value;
        if (!name) { _custModalAlert('Please enter a feature name.'); return; }
        updateCustomFeature(featureId, { name, section });
        closeCustModal();
        renderCustomFeaturesList();
        showSuccess('Feature updated!');
    });
}
window.showEditFeatureModal = showEditFeatureModal;

// ── Edit Item Modal ────────────────────────────────────────────
function showEditItemModal(featureId, itemId) {
    const config  = getCustomConfig();
    const feature = config.customFeatures.find(f => f.id === featureId);
    const item    = feature?.items.find(i => i.id === itemId);
    if (!item) return;

    const weightOpts = WEIGHT_OPTIONS.map(w =>
        `<option value="${w.value}" ${String(item.weightValue) === String(w.value) ? 'selected' : ''}>${w.label} (${w.value})</option>`
    ).join('');

    const s = 'width:100%;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:11px 13px;color:var(--text-1);font-size:0.85rem;font-family:Poppins,sans-serif;box-sizing:border-box';
    const l = 'display:block;font-size:0.78rem;font-weight:600;color:var(--text-2);margin-bottom:6px;font-family:Poppins,sans-serif';
    const h = 'display:block;font-size:0.7rem;color:var(--text-3);margin-top:4px;line-height:1.4;font-family:Poppins,sans-serif';

    const body = `
        <div style="margin-bottom:16px">
            <label style="${l}">Item Name <span style="color:#ef4444">*</span></label>
            <input id="eiName" type="text" maxlength="80" value="${item.name}" style="${s}">
        </div>
        <div style="margin-bottom:16px">
            <label style="${l}">Tooltip — What to look for <span style="color:#ef4444">*</span></label>
            <textarea id="eiTooltip" rows="3" style="${s};resize:vertical;line-height:1.5">${item.tooltip || ''}</textarea>
        </div>
        <div style="margin-bottom:16px">
            <label style="${l}">Weight <span style="color:#ef4444">*</span></label>
            <select id="eiWeight" style="${s}">
                ${weightOpts}
            </select>
            <span style="${h}">Low (1) = minor · Moderate (2) = standard · High (3) = significant · Very High (3.5) = major · Critical (4) = deal-breaker</span>
        </div>
        <div style="border-top:0.5px solid var(--divider);padding-top:12px">
            <div onclick="toggleCustGuidance()" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;margin-bottom:8px">
                <span style="font-size:0.82rem;font-weight:600;color:var(--text-2);font-family:Poppins,sans-serif;display:flex;align-items:center;gap:7px">
                    <i class="fas fa-clipboard-list" style="color:var(--brand-green);font-size:0.78rem"></i>
                    Guidance <span style="font-size:0.65rem;color:var(--text-3);background:var(--surface);padding:2px 6px;border-radius:99px">Optional</span>
                </span>
                <i class="fas fa-chevron-down" id="guidanceChevron" style="font-size:0.75rem;color:var(--text-3)"></i>
            </div>
            <div id="custGuidanceBody" style="display:none">
                <div style="margin-bottom:12px"><label style="${l}">✅ Excellent</label><textarea id="guideExcellent" rows="2" style="${s};resize:vertical">${item.guidance?.excellent || ''}</textarea></div>
                <div style="margin-bottom:12px"><label style="${l}">👍 Good</label><textarea id="guideGood" rows="2" style="${s};resize:vertical">${item.guidance?.good || ''}</textarea></div>
                <div style="margin-bottom:12px"><label style="${l}">⚠️ Fair</label><textarea id="guideFair" rows="2" style="${s};resize:vertical">${item.guidance?.fair || ''}</textarea></div>
                <div><label style="${l}">❌ Poor</label><textarea id="guidePoor" rows="2" style="${s};resize:vertical">${item.guidance?.poor || ''}</textarea></div>
            </div>
        </div>`;

    openCustModal(`Edit Item — ${feature.name}`, body, 'Save Changes ✓', () => {
        const name    = document.getElementById('eiName').value.trim();
        const tooltip = document.getElementById('eiTooltip').value.trim();
        const weight  = document.getElementById('eiWeight').value;
        if (!name)    { _custModalAlert('Please enter an item name.'); return; }
        if (!tooltip) { _custModalAlert('Please enter a tooltip.'); return; }
        if (!weight)  { _custModalAlert('Please select a weight.'); return; }
        const wLabel = WEIGHT_OPTIONS.find(w => String(w.value) === String(weight))?.label || '';
        updateCustomFeatureItem(featureId, itemId, {
            name, tooltip,
            weightLabel: wLabel, weightValue: Number(weight),
            guidance: {
                excellent: (document.getElementById('guideExcellent')?.value || '').trim(),
                good:      (document.getElementById('guideGood')?.value      || '').trim(),
                fair:      (document.getElementById('guideFair')?.value      || '').trim(),
                poor:      (document.getElementById('guidePoor')?.value      || '').trim()
            }
        });
        closeCustModal();
        renderCustomFeaturesList();
        showSuccess('Item updated!');
    });
}
window.showEditItemModal = showEditItemModal;

// ── Edit Question Modal ────────────────────────────────────────
function showEditQuestionModal(questionId) {
    const config = getCustomConfig();
    const q      = config.customQuestions.find(q => q.id === questionId);
    if (!q) return;

    const s = 'width:100%;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:11px 13px;color:var(--text-1);font-size:0.85rem;font-family:Poppins,sans-serif;box-sizing:border-box';
    const l = 'display:block;font-size:0.78rem;font-weight:600;color:var(--text-2);margin-bottom:6px;font-family:Poppins,sans-serif';

    const body = `
        <div style="margin-bottom:16px">
            <label style="${l}">Question <span style="color:#ef4444">*</span></label>
            <textarea id="eqQuestion" rows="3" style="${s};resize:vertical;line-height:1.5">${q.question}</textarea>
        </div>
        <div style="margin-bottom:8px">
            <label style="${l}">Tooltip — Context for the assessor</label>
            <textarea id="eqTooltip" rows="2" style="${s};resize:vertical;line-height:1.5">${q.tooltip || ''}</textarea>
        </div>`;

    openCustModal('Edit Question', body, 'Save Changes ✓', () => {
        const question = document.getElementById('eqQuestion').value.trim();
        const tooltip  = document.getElementById('eqTooltip').value.trim();
        if (!question) { _custModalAlert('Please enter a question.'); return; }
        const config2 = getCustomConfig();
        const idx = config2.customQuestions.findIndex(q => q.id === questionId);
        if (idx !== -1) {
            config2.customQuestions[idx] = { ...config2.customQuestions[idx], question, tooltip };
            saveCustomConfig(config2);
        }
        closeCustModal();
        renderCustomQuestionsList();
        showSuccess('Question updated!');
    });
}
window.showEditQuestionModal = showEditQuestionModal;

function deleteCustomFeatureUI(featureId) {
    const config  = getCustomConfig();
    const feature = config.customFeatures.find(f => f.id === featureId);
    if (!feature) return;
    showModal(
        'Delete Feature?',
        `Delete <strong>${feature.name}</strong> and all its items? This cannot be undone.`,
        () => {
            deleteCustomFeature(featureId);
            renderCustomFeaturesList();
            showSuccess('Feature deleted.');
        },
        'Delete', null, 'Cancel'
    );
}

function deleteCustomItemUI(featureId, itemId) {
    const config  = getCustomConfig();
    const feature = config.customFeatures.find(f => f.id === featureId);
    const item    = feature?.items.find(i => i.id === itemId);
    if (!item) return;
    showModal(
        'Delete Item?',
        `Delete <strong>${item.name}</strong> from ${feature.name}?`,
        () => {
            deleteCustomFeatureItem(featureId, itemId);
            renderCustomFeaturesList();
            showSuccess('Item deleted.');
        },
        'Delete', null, 'Cancel'
    );
}

function deleteCustomQuestionUI(questionId) {
    const config = getCustomConfig();
    const q      = config.customQuestions.find(q => q.id === questionId);
    if (!q) return;
    showModal(
        'Delete Question?',
        `Delete this question: <em>"${q.question}"</em>?`,
        () => {
            deleteCustomQuestion(questionId);
            renderCustomQuestionsList();
            showSuccess('Question deleted.');
        },
        'Delete', null, 'Cancel'
    );
}

function toggleFeatureExcludeUI(featureId) {
    const nowExcluded = toggleCustomFeatureExcluded(featureId);
    renderCustomFeaturesList();
    showSuccess(nowExcluded ? 'Feature excluded from new assessments.' : 'Feature re-enabled.');
}

// ── Export / Import ───────────────────────────────────────────

function exportCustomSettings() {
    exportCustomConfig();
}

function importCustomSettings() {
    if (typeof Android !== 'undefined' && Android.pickJsonFile) {
        // Android WebView — use native file picker bridge
        Android.pickJsonFile();
    } else {
        // PWA / browser fallback — use hidden file input
        document.getElementById('customConfigImportInput').click();
    }
}

// Called by MainActivity.kt jsonPickerLauncher after user selects a JSON file
// Content is passed as base64 to avoid escaping issues
function handleJsonFileContentBase64(base64) {
    try {
        const binary = atob(base64);
        const bytes  = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const jsonString = new TextDecoder().decode(bytes);
        const result = importCustomConfig(jsonString);
        if (result.success) {
            renderCustomizeScreen();
            showSuccess('Settings loaded successfully!');
        } else {
            showModal('Import Failed', result.error || 'Could not load settings file.');
        }
    } catch (e) {
        showModal('Import Failed', 'Could not read the file. Make sure it is a valid settings file.');
    }
}
window.handleJsonFileContentBase64 = handleJsonFileContentBase64;

function handleCustomConfigImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const result = importCustomConfig(e.target.result);
        if (result.success) {
            renderCustomizeScreen();
            showSuccess('Settings loaded successfully!');
        } else {
            showModal('Import Failed', result.error || 'Could not load settings file.');
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}

// Expose functions
window.initCustomizeScreen        = initCustomizeScreen;
window.renderCustomizeScreen      = renderCustomizeScreen;
window.toggleFeatureCard          = toggleFeatureCard;
window.toggleCustInfo             = toggleCustInfo;
window.showAddFeatureModal        = showAddFeatureModal;
window.showAddItemModal           = showAddItemModal;
window.showAddQuestionModal       = showAddQuestionModal;
window.selectIncludeAs            = selectIncludeAs;
window.toggleCustGuidance         = toggleCustGuidance;
window.deleteCustomFeatureUI      = deleteCustomFeatureUI;
window.deleteCustomItemUI         = deleteCustomItemUI;
window.deleteCustomQuestionUI     = deleteCustomQuestionUI;
window.toggleFeatureExcludeUI     = toggleFeatureExcludeUI;
window.exportCustomSettings       = exportCustomSettings;
window.importCustomSettings       = importCustomSettings;
window.handleCustomConfigImport   = handleCustomConfigImport;
window.closeCustModal             = closeCustModal;
window.closeCustModalOnBg         = closeCustModalOnBg;
