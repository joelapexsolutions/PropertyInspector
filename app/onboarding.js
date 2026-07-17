/**
 * Onboarding/Welcome Modal System
 * Guides new users through the app
 */

console.log('=== ONBOARDING.JS LOADED ===');

// Initialize onboarding system
function initializeOnboarding() {
    console.log('Initializing onboarding system...');
    
    // Check if user has seen the welcome modal
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    
    if (!hasSeenWelcome || hasSeenWelcome !== 'true') {
        console.log('First time user - showing welcome modal');
        // Show welcome modal after a short delay
        setTimeout(() => {
            showWelcomeModal();
        }, 1000);
    } else {
        console.log('Returning user - welcome modal skipped');
    }
}

// Show welcome modal
function showWelcomeModal() {
    console.log('Showing welcome modal...');
    
    // Remove existing modal if any
    const existingModal = document.getElementById('welcomeModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal HTML
    const modalHTML = `
        <div id="welcomeModal" class="hbgw-overlay">
            <div class="hbgw-card">
                <button class="hbgw-close" onclick="closeWelcomeModal()" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>

                <div class="hbgw-hero">
                    <div class="hbgw-logo">
                        <i class="fas fa-home"></i>
                        <i class="fas fa-search hbgw-mag"></i>
                    </div>
                    <h2>Home Buyers <span>Guide SA</span></h2>
                    <p class="hbgw-tagline">Know Before You Buy</p>
                </div>

                <div class="hbgw-body">
                    <p class="hbgw-intro">Walk into every property viewing with a professional checklist in your pocket.</p>

                    <div class="hbgw-feature">
                        <div class="hbgw-fi"><i class="fas fa-clipboard-check"></i></div>
                        <div class="hbgw-ft">
                            <h4>Guided room-by-room checks</h4>
                            <p>Know exactly what to look for — from the roof to the DB board.</p>
                        </div>
                    </div>

                    <div class="hbgw-feature">
                        <div class="hbgw-fi"><i class="fas fa-chart-line"></i></div>
                        <div class="hbgw-ft">
                            <h4>Instant property score</h4>
                            <p>Every property rated out of 100 so you can compare with confidence.</p>
                        </div>
                    </div>

                    <div class="hbgw-feature">
                        <div class="hbgw-fi"><i class="fas fa-file-pdf"></i></div>
                        <div class="hbgw-ft">
                            <h4>Professional PDF reports</h4>
                            <p>Share findings with your agent or use them to negotiate the price.</p>
                        </div>
                    </div>

                    <div class="hbgw-feature">
                        <div class="hbgw-fi"><i class="fas fa-shield-alt"></i></div>
                        <div class="hbgw-ft">
                            <h4>Built for South Africa</h4>
                            <p>Load shedding, boreholes, electric fencing — we cover what matters here.</p>
                        </div>
                    </div>
                </div>

                <div class="hbgw-footer">
                    <button class="hbgw-cta" onclick="startUsingApp()">
                        Get Started <i class="fas fa-arrow-right"></i>
                    </button>
                    <div class="hbgw-resource-card" onclick="openYoutubeAcademy()">
                        <div class="hbgw-rc-icon hbgw-rc-youtube">
                            <i class="fab fa-youtube"></i>
                        </div>
                        <div class="hbgw-rc-text">
                            <strong>HBG SA Academy</strong>
                            <span>Video tutorials — watch on YouTube</span>
                        </div>
                        <i class="fas fa-external-link-alt hbgw-rc-arrow"></i>
                    </div>
                    <button class="hbgw-secondary" onclick="openHelpGuide()">
                        View the in-app guide
                    </button>
                    <label class="hbgw-dontshow" onclick="event.stopPropagation()">
                        <input type="checkbox" id="dontShowAgainCheckbox">
                        <span>Don't show this again</span>
                    </label>
                </div>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Track analytics
    if (window.trackEvent) {
        trackEvent('onboarding_shown', {
            first_time_user: true
        });
    }
}

// Close welcome modal
function closeWelcomeModal() {
    console.log('Closing welcome modal...');
    
    const modal = document.getElementById('welcomeModal');
    const checkbox = document.getElementById('dontShowAgainCheckbox');
    
    if (modal) {
        // Check if "don't show again" is checked
        if (checkbox && checkbox.checked) {
            localStorage.setItem('hasSeenWelcome', 'true');
            console.log('User opted to not see welcome modal again');
            
            if (window.trackEvent) {
                trackEvent('onboarding_dismissed', {
                    dont_show_again: true
                });
            }
        } else {
            if (window.trackEvent) {
                trackEvent('onboarding_dismissed', {
                    dont_show_again: false
                });
            }
        }
        
        // Fade out and remove
        modal.style.animation = 'welcomeFadeOut 0.3s ease';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Toggle "don't show again" checkbox
function toggleDontShowAgain() {
    const checkbox = document.getElementById('dontShowAgainCheckbox');
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
    }
}

// Start using app
function startUsingApp() {
    console.log('User starting to use app...');
    
    const checkbox = document.getElementById('dontShowAgainCheckbox');
    
    // Mark as seen
    if (checkbox && checkbox.checked) {
        localStorage.setItem('hasSeenWelcome', 'true');
    }
    
    if (window.trackEvent) {
        trackEvent('onboarding_completed', {
            action: 'get_started',
            dont_show_again: checkbox ? checkbox.checked : false
        });
    }
    
    // Close modal
    closeWelcomeModal();
    
    // Navigate to home screen after a brief delay
    setTimeout(() => {
        if (window.navTo) {
            navTo('homeScreen', 'navHome');
        } else if (window.showScreen) {
            showScreen('homeScreen');
        }
    }, 400);
}

// Open help guide from welcome modal
function openHelpGuide() {
    console.log('Opening help guide from welcome modal...');
    
    const checkbox = document.getElementById('dontShowAgainCheckbox');
    
    if (window.trackEvent) {
        trackEvent('onboarding_help_clicked', {
            dont_show_again: checkbox ? checkbox.checked : false
        });
    }
    
    // Mark as seen if checkbox is checked
    if (checkbox && checkbox.checked) {
        localStorage.setItem('hasSeenWelcome', 'true');
    }
    
    // Close modal
    closeWelcomeModal();
    
    // Navigate to help screen
    setTimeout(() => {
        if (window.showScreen) {
            showScreen('helpScreen');
        }
    }, 400);
}

// Function to manually show welcome modal (can be called from Help menu)
function showWelcomeModalManually() {
    console.log('Showing welcome modal manually...');
    
    if (window.trackEvent) {
        trackEvent('onboarding_manual_open', {
            source: 'help_menu'
        });
    }
    
    showWelcomeModal();
}

// Reset welcome modal preference (for testing)
function resetWelcomeModal() {
    localStorage.removeItem('hasSeenWelcome');
    console.log('Welcome modal preference reset');
    showSuccess('Welcome tutorial will show on next app launch');
}

// Info notice — uses CSS vars so it works in dark AND light mode
function showAssessmentGuideHiddenNotice() {
    var ex = document.getElementById('_agNotice');
    if (ex) ex.remove();
    var n = document.createElement('div');
    n.id = '_agNotice';
    n.style.cssText = 'position:fixed;top:72px;left:16px;right:16px;background:var(--surface);border:1px solid rgba(6,214,160,0.5);border-radius:14px;padding:13px 16px;display:flex;align-items:center;gap:11px;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.18);animation:vnbSlideDown 0.3s ease';
    n.innerHTML = `
        <i class="fas fa-info-circle" style="color:#06D6A0;font-size:18px;flex-shrink:0"></i>
        <span style="color:var(--text-2);font-size:13px;line-height:1.4">
            Assessment guide hidden.
            <strong style="color:var(--text-1)">You can turn it back on in Settings.</strong>
        </span>`;
    document.body.appendChild(n);
    setTimeout(function() {
        n.style.transition = 'opacity 0.35s';
        n.style.opacity = '0';
        setTimeout(function() { n.remove(); }, 380);
    }, 3400);
}

function resetAssessmentGuide() {
    localStorage.removeItem('hasSeenAssessmentGuide');
    showSuccess('Assessment guide will show next time you tap Assess');
}


// Add fade out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes welcomeFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Export functions for global use
window.showWelcomeModal = showWelcomeModal;
window.showWelcomeModalManually = showWelcomeModalManually;
window.closeWelcomeModal = closeWelcomeModal;
window.toggleDontShowAgain = toggleDontShowAgain;
window.startUsingApp = startUsingApp;
function openYoutubeAcademy() {
    if (window.trackEvent) {
        trackEvent('youtube_academy_opened', { source: 'onboarding_modal' });
    }
    const url = 'https://www.youtube.com/playlist?list=PLD3VMzEE0ugs';
    if (window.Android && window.Android.openExternalUrl) {
        window.Android.openExternalUrl(url);
    } else {
        window.open(url, '_blank');
    }
}

window.openHelpGuide = openHelpGuide;
window.openYoutubeAcademy = openYoutubeAcademy;
window.resetWelcomeModal = resetWelcomeModal;
window.resetAssessmentGuide = resetAssessmentGuide;
window.showAssessmentGuideHiddenNotice = showAssessmentGuideHiddenNotice;

console.log('=== ONBOARDING.JS READY ===');

// Show assessment guidance modal
function showAssessmentGuide() {
    console.log('Showing assessment guide');
    
    // Remove existing modal if any
    const existingModal = document.getElementById('assessmentGuideModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div id="assessmentGuideModal" class="assessment-guide-modal">
            <div class="assessment-guide-content">
                <button class="welcome-close-btn" onclick="closeAssessmentGuide()">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="assessment-guide-header">
                    <div class="assessment-guide-icon">
                        <i class="fas fa-clipboard-check"></i>
                    </div>
                    <h2>Property Assessment Guide</h2>
                    <p>A guided walkthrough to help you evaluate this property room by room</p>
                </div>
                
                <div class="assessment-guide-body">
                    <div class="welcome-intro">
                        <p><strong>Professional Rating System:</strong> Use this 5-point system to evaluate each item accurately</p>
                    </div>
                    
                    <div class="guide-rating-system">
                        <div class="rating-item excellent">
                            <div class="rating-header">
                                <span style="font-size: 1.2rem;">⭐</span>
                                <span class="rating-label">Excellent (5/5)</span>
                            </div>
                            <div class="rating-desc">Perfect condition, no faults. Exceeds expectations with premium finishes or recent updates.</div>
                        </div>
                        
                        <div class="rating-item good">
                            <div class="rating-header">
                                <span style="font-size: 1.2rem;">✅</span>
                                <span class="rating-label">Good (4/5)</span>
                            </div>
                            <div class="rating-desc">Well-maintained with minor wear. Meets expectations, fully functional.</div>
                        </div>
                        
                        <div class="rating-item fair">
                            <div class="rating-header">
                                <span style="font-size: 1.2rem;">⚠️</span>
                                <span class="rating-label">Fair (3/5)</span>
                            </div>
                            <div class="rating-desc">Functional but showing wear. Needs attention within 1-2 years.</div>
                        </div>
                        
                        <div class="rating-item poor">
                            <div class="rating-header">
                                <span style="font-size: 1.2rem;">❌</span>
                                <span class="rating-label">Poor (2/5)</span>
                            </div>
                            <div class="rating-desc">Significant problems requiring immediate attention or repair.</div>
                        </div>
                        
                        <div class="rating-item na">
                            <div class="rating-header">
                                <span style="font-size: 1.2rem;">➖</span>
                                <span class="rating-label">Not Applicable (N/A)</span>
                            </div>
                            <div class="rating-desc">Item not present, not accessible, or not relevant.</div>
                        </div>
                    </div>
                    
                    <div class="guide-tips-section">
                        <h4><i class="fas fa-lightbulb"></i> Assessment Tips</h4>
                        <ul>
                            <li><strong>Use Tooltips:</strong> Tap the info icon (ℹ️) next to each item for specific guidance</li>
                            <li><strong>Take Photos:</strong> Document issues for contractor quotes and exceptional features for comparison</li>
                            <li><strong>Add Notes:</strong> Record observations, measurements, or questions for each room</li>
                            <li><strong>Be Systematic:</strong> Complete each section before moving to the next</li>
                            <li><strong>Save Progress:</strong> Your assessment saves automatically - you can pause anytime</li>
                        </ul>
                    </div>
                    
                    <div class="guide-tips-section" style="background: linear-gradient(135deg, rgba(241, 143, 1, 0.1), rgba(244, 162, 97, 0.05)); border-color: rgba(241, 143, 1, 0.3);">
                        <h4 style="color: #F18F01;"><i class="fas fa-camera"></i> Photo Documentation</h4>
                        <ul>
                            <li>Capture issues clearly for professional consultation</li>
                            <li>Photograph premium features and quality finishes</li>
                            <li>Use good lighting - natural light is best</li>
                            <li>Take wide shots for context, close-ups for detail</li>
                        </ul>
                    </div>
                </div>
                
                <div class="welcome-footer">
                    <div class="dont-show-again" onclick="toggleAssessmentGuideDontShow()">
                        <input type="checkbox" id="dontShowAssessmentGuideCheckbox">
                        <label for="dontShowAssessmentGuideCheckbox">Don't show this again</label>
                    </div>
                    
                    <div class="welcome-actions">
                        <button class="welcome-btn welcome-btn-secondary" onclick="closeAssessmentGuide()">
                            <i class="fas fa-times"></i>
                            Close
                        </button>
                        <button class="welcome-btn welcome-btn-primary" onclick="startAssessmentFromGuide()">
                            <i class="fas fa-play"></i>
                            Start Assessment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
   if (window.trackEvent) {
        trackEvent('assessment_guide_shown', {});
    }
}

// Close assessment guide
function closeAssessmentGuide() {
    const modal = document.getElementById('assessmentGuideModal');
    const checkbox = document.getElementById('dontShowAssessmentGuideCheckbox');
    
    if (modal) {
        if (checkbox && checkbox.checked) {
            localStorage.setItem('hasSeenAssessmentGuide', 'true');
            showAssessmentGuideHiddenNotice();
            
            if (window.trackEvent) {
                trackEvent('assessment_guide_dismissed', { dont_show_again: true });
            }
        }
        
        modal.style.animation = 'welcomeFadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
    }
}

// Toggle checkbox
function toggleAssessmentGuideDontShow() {
    const checkbox = document.getElementById('dontShowAssessmentGuideCheckbox');
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
    }
}

// Start assessment from guide
function startAssessmentFromGuide() {
    const checkbox = document.getElementById('dontShowAssessmentGuideCheckbox');
    
    if (checkbox && checkbox.checked) {
        localStorage.setItem('hasSeenAssessmentGuide', 'true');
    }
    
    if (window.trackEvent) {
        trackEvent('assessment_started_from_guide', {
            dont_show_again: checkbox ? checkbox.checked : false
        });
    }
    
    closeAssessmentGuide();
    
    // Proceed directly to assessment - single mode, no selection needed
    if (window.pendingAssessmentProperty) {
        const property = window.getProperty ? window.getProperty(window.pendingAssessmentProperty) : null;
        if (property && window.initializeDetailedAssessment) {
            window.initializeDetailedAssessment(property);
        }
    }
}

// Export functions
window.showAssessmentGuide = showAssessmentGuide;
window.closeAssessmentGuide = closeAssessmentGuide;
window.toggleAssessmentGuideDontShow = toggleAssessmentGuideDontShow;
window.startAssessmentFromGuide = startAssessmentFromGuide;

// YouTube Academy button styles
(function() {
    const ys = document.createElement('style');
    ys.id = 'hbgw-youtube-styles';
    ys.textContent = `
        /* YouTube Academy card — teal-branded, always dark modal */
        .hbgw-resource-card {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 15px 16px;
            background: linear-gradient(135deg, rgba(6,214,160,0.18) 0%, rgba(29,158,117,0.12) 100%);
            border: 1.5px solid rgba(6,214,160,0.55);
            border-radius: 14px;
            cursor: pointer;
            transition: background 0.2s, border-color 0.2s;
            margin-top: 12px;
            margin-bottom: 4px;
            box-shadow: 0 2px 16px rgba(6,214,160,0.12);
            -webkit-tap-highlight-color: transparent;
        }
        .hbgw-resource-card:active {
            background: linear-gradient(135deg, rgba(6,214,160,0.28) 0%, rgba(29,158,117,0.22) 100%);
            border-color: #06D6A0;
        }
        .hbgw-rc-icon {
            width: 44px; height: 44px; min-width: 44px;
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.3rem; flex-shrink: 0;
        }
        .hbgw-rc-youtube {
            background: rgba(255,0,0,0.2);
            color: #ff4444;
            border: 0.5px solid rgba(255,68,68,0.3);
        }
        .hbgw-rc-text { flex: 1; min-width: 0; }
        .hbgw-rc-text strong {
            display: block;
            color: #06D6A0;
            font-size: 0.92rem;
            font-weight: 700;
            margin-bottom: 3px;
        }
        .hbgw-rc-text span {
            color: rgba(255,255,255,0.72);
            font-size: 0.78rem;
        }
        .hbgw-rc-arrow {
            color: #06D6A0;
            font-size: 0.8rem;
            flex-shrink: 0;
        }
    `;
    if (!document.getElementById('hbgw-youtube-styles')) {
        document.head.appendChild(ys);
    }
})();