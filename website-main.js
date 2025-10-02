/**
 * Property Inspector Website - Main JavaScript
 */

// Initialize website when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 Property Inspector Website Loading...');
    
    initializeNavigation();
    initializeTabs();
    initializeScrollEffects();
    initializeStandaloneCostCalculator();
    
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
            }
        });
    }, observerOptions);
    
    // Observe cards and sections
    const cards = document.querySelectorAll('.feature-card, .problem-card, .guide-card, .sample-card');
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
        });
    });
}

/**
 * Format price input with spaces
 */
function formatPrice(input) {
    // Remove all non-numeric characters
    let value = input.value.replace(/\D/g, '');
    
    // Add spaces every 3 digits from right
    if (value) {
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    
    input.value = value;
}

/**
 * Utility function for showing modals/alerts
 */
function showModal(title, message) {
    // Simple alert for now - can be enhanced with custom modal
    alert(title + '\n\n' + message);
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

// Track download button clicks
document.addEventListener('DOMContentLoaded', function() {
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
            const fileName = this.getAttribute('download');
            trackEvent('Sample', 'Download', fileName);
        });
    });
});

/**
 * Set minimum datetime for assessment date input
 */
function setMinDateTime() {
    const dateInputs = document.querySelectorAll('input[type="datetime-local"]');
    if (dateInputs.length > 0) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        dateInputs.forEach(input => {
            input.setAttribute('min', minDateTime);
        });
    }
}

// Call on load
setMinDateTime();

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
 * Handle external links
 */
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.hostname !== window.location.hostname) {
        e.preventDefault();
        window.open(e.target.href, '_blank', 'noopener,noreferrer');
    }
});

/**
 * Lazy loading for images
 */
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

/**
 * Handle contact form submission (if added)
 */
function handleContactForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Track form submission
    trackEvent('Contact', 'Submit', 'Contact Form');
    
    // Show success message
    alert('Thank you for your message! We will get back to you soon.');
    form.reset();
}

/**
 * Mobile-specific optimizations
 */
function initializeMobileOptimizations() {
    // Detect touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
        document.body.classList.add('touch-device');
        
        // Remove hover effects on mobile
        const cards = document.querySelectorAll('.feature-card, .problem-card, .guide-card');
        cards.forEach(card => {
            card.addEventListener('touchstart', function() {
                this.style.transform = 'translateY(-5px)';
            });
            
            card.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.style.transform = '';
                }, 300);
            });
        });
    }
}

// Initialize mobile optimizations
initializeMobileOptimizations();

/**
 * Print current page
 */
function printPage() {
    window.print();
}

/**
 * Share functionality
 */
async function shareWebsite() {
    const shareData = {
        title: 'Property Inspector',
        text: 'Know Before You Buy - Professional property assessment app',
        url: window.location.href
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
            trackEvent('Share', 'Native', 'Website');
        } else {
            // Fallback - copy to clipboard
            await navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
            trackEvent('Share', 'Copy', 'Website');
        }
    } catch (err) {
        console.error('Error sharing:', err);
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
            'description': e.error.message,
            'fatal': false
        });
    }
});

/**
 * Service Worker registration (for PWA functionality - optional)
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(reg => console.log('Service Worker registered'))
        //     .catch(err => console.log('Service Worker registration failed'));
    });
}

console.log('🚀 Property Inspector Website Scripts Initialized');
