/**
 * Home Buyers Guide SA Website - Enhanced JavaScript v3.0
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('HBG SA Website Loading...');

    initializeThemeToggle();
    initializeNavigation();
    initializeTabs();
    initializeScrollEffects();
    initializeLazyLoading();
    initializeAnalytics();
    initializeStoriesToggle();

    console.log('HBG SA Website Loaded Successfully');
});

/* ─── THEME TOGGLE ──────────────────────────────────────── */
function initializeThemeToggle() {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    // Apply current theme icon on load
    updateThemeIcon(toggle, document.documentElement.getAttribute('data-theme') || 'light');

    toggle.addEventListener('click', function() {
        var current = document.documentElement.getAttribute('data-theme') || 'light';
        var next = current === 'dark' ? 'light' : 'dark';

        // Brief transition class for smooth color change
        document.documentElement.classList.add('theme-switching');
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('hbg-theme', next);
        updateThemeIcon(toggle, next);

        setTimeout(function() {
            document.documentElement.classList.remove('theme-switching');
        }, 350);
    });
}

function updateThemeIcon(toggle, theme) {
    var icon = toggle.querySelector('i');
    if (!icon) return;
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
        toggle.setAttribute('aria-label', 'Switch to light mode');
    } else {
        icon.className = 'fas fa-moon';
        toggle.setAttribute('aria-label', 'Switch to dark mode');
    }
}

/* ─── NAVIGATION ────────────────────────────────────────── */
function initializeNavigation() {
    var navToggle = document.getElementById('navToggle');
    var navMenu = document.getElementById('navMenu');
    var navLinks = document.querySelectorAll('.nav-link');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            var icon = navToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });
    }

    navLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                var target = document.getElementById(href.substring(1));
                if (target) {
                    if (navMenu && navMenu.classList.contains('active')) {
                        navMenu.classList.remove('active');
                        var icon = navToggle.querySelector('i');
                        if (icon) icon.className = 'fas fa-bars';
                    }
                    var navHeight = document.querySelector('.navbar').offsetHeight;
                    window.scrollTo({ top: target.offsetTop - navHeight - 16, behavior: 'smooth' });
                }
            }
        });
    });

    window.addEventListener('scroll', highlightActiveNavLink);
}

function highlightActiveNavLink() {
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    var current = '';
    var scrollPos = window.scrollY + 100;

    sections.forEach(function(section) {
        if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(function(link) {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
}

/* ─── TABS ──────────────────────────────────────────────── */
function initializeTabs() {
    var tabButtons = document.querySelectorAll('.tab-btn');
    var tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            var targetTab = this.dataset.tab;
            tabButtons.forEach(function(btn) { btn.classList.remove('active'); });
            tabPanes.forEach(function(pane) { pane.classList.remove('active'); });
            this.classList.add('active');
            var targetPane = document.getElementById(targetTab);
            if (targetPane) targetPane.classList.add('active');
            trackEvent('Engagement', 'Tab Click', targetTab);
        });
    });
}

/* ─── SCROLL EFFECTS ────────────────────────────────────── */
function initializeScrollEffects() {
    var navbar = document.getElementById('navbar');

    window.addEventListener('scroll', function() {
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });
}

/* ─── LAZY LOADING ──────────────────────────────────────── */
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        var imageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });
        document.querySelectorAll('img[data-src]').forEach(function(img) {
            imageObserver.observe(img);
        });
    }
}

/* ─── ANALYTICS ─────────────────────────────────────────── */
function initializeAnalytics() {
    document.querySelectorAll('a[href*="play.google.com"]').forEach(function(btn) {
        btn.addEventListener('click', function() { trackEvent('Download', 'Click', 'Google Play Store'); });
    });
    document.querySelectorAll('a[download]').forEach(function(link) {
        link.addEventListener('click', function() {
            trackEvent('Sample', 'Download', this.getAttribute('download') || 'sample-report');
        });
    });
}

function trackEvent(category, action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, { 'event_category': category, 'event_label': label });
    }
}

/* ─── STORIES TOGGLE (mobile) ───────────────────────────── */
function initializeStoriesToggle() {
    var toggle = document.getElementById('storiesToggle');
    var grid = document.getElementById('storiesGrid');
    if (!toggle || !grid) return;

    function checkMobile() {
        if (window.innerWidth <= 768) {
            toggle.style.display = 'inline-flex';
            if (!grid.classList.contains('expanded')) {
                grid.classList.add('collapsed');
            }
        } else {
            toggle.style.display = 'none';
            grid.classList.remove('collapsed', 'expanded');
        }
    }

    toggle.addEventListener('click', function() {
        var isExpanded = grid.classList.contains('expanded');
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

    checkMobile();
    window.addEventListener('resize', checkMobile);
}

/* ─── KEYBOARD NAV ──────────────────────────────────────── */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        var navMenu = document.getElementById('navMenu');
        var navToggle = document.getElementById('navToggle');
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            var icon = navToggle ? navToggle.querySelector('i') : null;
            if (icon) icon.className = 'fas fa-bars';
        }
    }
});

/* ─── PERFORMANCE ───────────────────────────────────────── */
window.addEventListener('load', function() {
    if (window.performance && window.performance.timing) {
        var loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        console.log('Page loaded in ' + loadTime + 'ms');
        if (typeof gtag !== 'undefined') {
            gtag('event', 'timing_complete', { 'name': 'load', 'value': loadTime, 'event_category': 'Performance' });
        }
    }
});

/* ─── ERROR HANDLING ────────────────────────────────────── */
window.addEventListener('error', function(e) {
    console.error('Website error:', e.error);
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', { 'description': (e.error && e.error.message) || 'Unknown error', 'fatal': false });
    }
});

/* ─── SCROLL TO TOP ─────────────────────────────────────── */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─── SHARE ─────────────────────────────────────────────── */
async function shareWebsite() {
    var shareData = {
        title: 'Home Buyers Guide SA - Know Before You Buy',
        text: 'Professional property assessment app for South Africa. Avoid costly mistakes!',
        url: window.location.href
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
            trackEvent('Share', 'Native', 'Website');
        } else {
            await navigator.clipboard.writeText(window.location.href);
            showNotification('Link copied to clipboard!');
            trackEvent('Share', 'Copy', 'Website');
        }
    } catch (err) {
        console.error('Error sharing:', err);
    }
}

/* ─── NOTIFICATION ──────────────────────────────────────── */
function showNotification(message, type) {
    type = type || 'success';
    var notification = document.createElement('div');
    notification.style.cssText = [
        'position:fixed;bottom:28px;right:28px;',
        'background:' + (type === 'success' ? '#00C48C' : '#DC2626') + ';',
        'color:white;padding:14px 22px;border-radius:10px;',
        'box-shadow:0 5px 20px rgba(0,0,0,0.2);z-index:10000;',
        'font-family:Poppins,sans-serif;font-size:0.9rem;font-weight:500;',
        'animation:slideInUp 0.3s ease-out;'
    ].join('');
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(function() {
        notification.style.animation = 'slideOutDown 0.3s ease-out';
        setTimeout(function() { if (notification.parentNode) notification.remove(); }, 300);
    }, 3000);
}

/* ─── ANIMATION KEYFRAMES (injected) ────────────────────── */
var style = document.createElement('style');
style.textContent = [
    '@keyframes slideInUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}',
    '@keyframes slideOutDown{from{transform:translateY(0);opacity:1}to{transform:translateY(100%);opacity:0}}'
].join('');
document.head.appendChild(style);

/* ─── MOBILE TOUCH DETECTION ────────────────────────────── */
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.body.classList.add('touch-device');
}
