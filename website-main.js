/**
 * Property Inspector Website - Enhanced JavaScript
 */

// Initialize website when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 Property Inspector Website Loading...');
    
    initializeNavigation();
    initializeTabs();
    initializeScrollEffects();
    initializeStandaloneCostCalculator();
    initializeLazyLoading();
    initializeAnalytics();
    initializeStoriesToggle();
    
    console.log('✅ Property Inspector Website Loaded Successfully');
});

/**
 * Navigation Functions
 */
function initializeNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Change icon
            const icon = navToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only handle internal links
            if (href && href.startsWith('#')) {
                e.preventDefault();
                
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    // Close mobile menu if open
                    if (navMenu.classList.contains('active')) {
                        navMenu.classList.remove('active');
                        const icon = navToggle.querySelector('i');
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                    
                    // Smooth scroll to target
                    const navHeight = document.querySelector('.navbar').offsetHeight;
                    const targetPosition = targetElement.offsetTop - navHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Highlight active section in navigation
    window.addEventListener('scroll', highlightActiveNavLink);
}

/**
 * Highlight active navigation link based on scroll position
 */
function highlightActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    let current = '';
    const scrollPosition = window.scrollY + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

/**
 * Scroll Effects
 */
function initializeScrollEffects() {
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Add scroll reveal animations
    observeElements();
}

/**
 * Intersection Observer for scroll animations
 */
function observeElements() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);
    
    // Observe cards and sections
    const cards = document.querySelectorAll('.feature-card, .problem-card, .guide-card, .sample-card, .story-card, .step, .explainer-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

/**
 * Benefits Tab System
 */
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            this.classList.add('active');
            const targetPane = document.getElementById(targetTab);
            if (targetPane) {
                targetPane.classList.add('active');
            }
            
            // Track tab click
            trackEvent('Engagement', 'Tab Click', targetTab);
        });
    });
}

/**
 * Lazy Loading for Images
 */
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

/**
 * Initialize Analytics Tracking
 */
function initializeAnalytics() {
    // Track download button clicks
    const downloadButtons = document.querySelectorAll('a[href*="play.google.com"]');
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            trackEvent('Download', 'Click', 'Google Play Store');
        });
    });
    
    // Track sample PDF downloads
    const sampleLinks = document.querySelectorAll('a[download]');
    sampleLinks.forEach(link => {
        link.addEventListener('click', function() {
            const fileName = this.getAttribute('download') || 'sample-report';
            trackEvent('Sample', 'Download', fileName);
        });
    });
    
    // Track calculator usage
    const calculatorInputs = document.querySelectorAll('.calc-input, .calc-select, .calc-slider');
    calculatorInputs.forEach(input => {
        input.addEventListener('change', function() {
            trackEvent('Calculator', 'Input Changed', this.id || 'unknown');
        });
    });
    
    // Track external link clicks
    const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])');
    externalLinks.forEach(link => {
        link.addEventListener('click', function() {
            trackEvent('External Link', 'Click', this.href);
        });
    });
}

/**
 * Google Analytics Event Tracking
 */
function trackEvent(category, action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label
        });
    }
}

/**
 * Keyboard navigation improvements
 */
document.addEventListener('keydown', function(e) {
    // ESC key closes mobile menu
    if (e.key === 'Escape') {
        const navMenu = document.getElementById('navMenu');
        const navToggle = document.getElementById('navToggle');
        
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            const icon = navToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
});

/**
 * Performance monitoring
 */
window.addEventListener('load', function() {
    // Log performance metrics
    if (window.performance && window.performance.timing) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        console.log(`⚡ Page loaded in ${loadTime}ms`);
        
        // Track performance in Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'timing_complete', {
                'name': 'load',
                'value': loadTime,
                'event_category': 'Performance'
            });
        }
    }
});

/**
 * Error handling
 */
window.addEventListener('error', function(e) {
    console.error('Website error:', e.error);
    
    // Track errors in Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
            'description': e.error?.message || 'Unknown error',
            'fatal': false
        });
    }
});

/**
 * Smooth scroll to top function
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Share functionality
 */
async function shareWebsite() {
    const shareData = {
        title: 'Property Inspector - Know Before You Buy',
        text: 'Professional property assessment app for South Africa. Avoid costly mistakes!',
        url: window.location.href
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
            trackEvent('Share', 'Native', 'Website');
        } else {
            // Fallback - copy to clipboard
            await navigator.clipboard.writeText(window.location.href);
            showNotification('Link copied to clipboard!');
            trackEvent('Share', 'Copy', 'Website');
        }
    } catch (err) {
        console.error('Error sharing:', err);
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: ${type === 'success' ? '#06D6A0' : '#EF476F'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInUp 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutDown 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Mobile-specific optimizations
 */
function initializeMobileOptimizations() {
    // Detect touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
        document.body.classList.add('touch-device');
    }
}

initializeMobileOptimizations();

/**
 * Handle form submissions (if contact form added)
 */
function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    // Track form submission
    trackEvent('Contact', 'Submit', 'Contact Form');
    
    // Here you would send data to your backend
    showNotification('Thank you! We will get back to you soon.');
    form.reset();
}

/**
 * Initialize standalone calculator on calculator page
 */
function initializeStandaloneCostCalculator() {
    // This function is called, and calculator.js handles the actual implementation
    console.log('📊 Calculator initialized');
}

/**
 * Add CSS animation keyframes dynamically
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInUp {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutDown {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

/**
 * Initialize collapsible stories on mobile
 */
function initializeStoriesToggle() {
    const toggle = document.getElementById('storiesToggle');
    const grid = document.getElementById('storiesGrid');
    
    if (!toggle || !grid) return;
    
    // Show toggle button on mobile only
    function checkMobile() {
        if (window.innerWidth <= 768) {
            toggle.style.display = 'inline-flex';
            grid.classList.add('collapsed');
        } else {
            toggle.style.display = 'none';
            grid.classList.remove('collapsed', 'expanded');
        }
    }
    
    // Toggle stories visibility
    toggle.addEventListener('click', function() {
        const isExpanded = grid.classList.contains('expanded');
        
        if (isExpanded) {
            grid.classList.remove('expanded');
            grid.classList.add('collapsed');
            toggle.querySelector('.toggle-text').textContent = 'Show All Stories';
            toggle.classList.remove('expanded');
        } else {
            grid.classList.remove('collapsed');
            grid.classList.add('expanded');
            toggle.querySelector('.toggle-text').textContent = 'Hide Stories';
            toggle.classList.add('expanded');
        }
    });
    
    // Check on load and resize
    checkMobile();
    window.addEventListener('resize', checkMobile);
}

console.log('🚀 Property Inspector Website Scripts Initialized');
