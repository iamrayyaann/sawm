/**
 * Sawm - Prayer times and hydration app
 * Modern, enhanced JavaScript with tab navigation and tracking features
 */

// Storage keys
const THEME_KEY = 'sawm-theme';
const LOCATION_KEY = 'sawm-location';
const LOCATION_EXPIRY_KEY = 'sawm-location-expiry';
const METHOD_KEY = 'sawm-method';
const LOCATION_EXPIRY_DAYS = 30;

// DOM Element References (lazy loaded)
const elements = {
    get html() { return document.documentElement; },
    get themeToggle() { return document.getElementById('themeToggle'); },
    get settingsBtn() { return document.getElementById('settingsBtn'); },
    get settingsModal() { return document.getElementById('settingsModal'); },
    get closeSettingsBtn() { return document.getElementById('closeSettings'); },
    get geolocateBtn() { return document.getElementById('geolocateBtn'); },
    get settingsLocation() { return document.getElementById('settingsLocation'); },
    get settingsMethod() { return document.getElementById('settingsMethod'); },
    get updateSettingsBtn() { return document.getElementById('updateLocationSettings'); },
    get yearEl() { return document.getElementById('year'); },
    get locationDisplay() { return document.getElementById('locationDisplay'); },
    get tabButtons() { return document.querySelectorAll('.tab-btn'); },
    get tabContents() { return document.querySelectorAll('.tab-content'); },
    get suhoorCountdown() { return document.getElementById('suhoor-countdown'); },
    get iftarCountdown() { return document.getElementById('iftar-countdown'); },
    get fastingProgress() { return document.getElementById('fastingProgress'); },
    get progressText() { return document.getElementById('progressText'); },
};

// ========================
// Theme Management
// ========================

function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    const isDark = theme === 'dark';
    elements.html.classList.toggle('dark-mode', isDark);
    updateThemeIcon(isDark);
    
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute('content', isDark ? '#1a1735' : '#f9f8ff');
    }
}

function updateThemeIcon(isDark) {
    const icon = elements.themeToggle?.querySelector('i');
    if (icon) {
        icon.className = isDark ? 'bx bxs-moon' : 'bx bxs-sun';
    }
}

function toggleTheme() {
    const isDark = elements.html.classList.toggle('dark-mode');
    const newTheme = isDark ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeIcon(isDark);
    
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute('content', isDark ? '#1a1735' : '#f9f8ff');
    }
}

// ========================
// Tab Navigation
// ========================

function switchTab(tabName) {
    // Deactivate all tabs
    elements.tabButtons.forEach(btn => btn.classList.remove('active'));
    elements.tabContents.forEach(content => content.classList.remove('active'));
    
    // Activate selected tab
    const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const tabContent = document.getElementById(tabName);
    
    if (tabBtn && tabContent) {
        tabBtn.classList.add('active');
        tabBtn.setAttribute('aria-selected', 'true');
        tabContent.classList.add('active');
    }
}

function initializeTabs() {
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

// ========================
// Modal Management
// ========================

let previousActiveElement = null;

function openModal() {
    const modal = elements.settingsModal;
    if (!modal) return;
    
    previousActiveElement = document.activeElement;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Load cached location into input
    const cached = getCachedLocation();
    if (cached && elements.settingsLocation) {
        elements.settingsLocation.value = `${cached.city}, ${cached.country}`;
    }
    
    // Focus first focusable element
    const firstFocusable = modal.querySelector('input, button, select');
    if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 50);
    }
}

function closeModal() {
    const modal = elements.settingsModal;
    if (!modal) return;
    
    modal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Restore focus
    if (previousActiveElement) {
        previousActiveElement.focus();
        previousActiveElement = null;
    }
}

function handleModalKeydown(e) {
    if (!elements.settingsModal?.classList.contains('show')) return;
    
    if (e.key === 'Escape') {
        closeModal();
        return;
    }
    
    // Trap focus within modal
    if (e.key === 'Tab') {
        const modal = elements.settingsModal;
        const focusableElements = modal.querySelectorAll(
            'button, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }
}

// ========================
// Location Management
// ========================

function parseLocation(input) {
    const parts = input.split(',').map(s => s.trim());
    if (parts.length >= 2 && parts[0] && parts[1]) {
        return { city: parts[0], country: parts[1] };
    }
    return null;
}

function encodeLocation(city, country) {
    const method = localStorage.getItem(METHOD_KEY) || '2';
    return `/?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
}

function saveLocation(city, country) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + LOCATION_EXPIRY_DAYS);
    localStorage.setItem(LOCATION_KEY, JSON.stringify({ city, country }));
    localStorage.setItem(LOCATION_EXPIRY_KEY, expiry.getTime());
}

function getCachedLocation() {
    const cached = localStorage.getItem(LOCATION_KEY);
    const expiry = localStorage.getItem(LOCATION_EXPIRY_KEY);
    
    if (!cached || !expiry) return null;
    
    if (Date.now() > parseInt(expiry, 10)) {
        localStorage.removeItem(LOCATION_KEY);
        localStorage.removeItem(LOCATION_EXPIRY_KEY);
        return null;
    }
    
    try {
        return JSON.parse(cached);
    } catch {
        return null;
    }
}

function updateLocation(city, country) {
    saveLocation(city, country);
    window.location.href = encodeLocation(city, country);
}

function requestGeolocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    const gpsBtn = elements.geolocateBtn;
    if (gpsBtn) {
        gpsBtn.disabled = true;
    }
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                    { headers: { 'Accept': 'application/json' } }
                );
                
                if (!response.ok) throw new Error('Geocoding failed');
                
                const data = await response.json();
                const { address } = data;
                const city = address.city || address.town || address.village || address.municipality || 'Unknown';
                const country = address.country || 'Unknown';
                
                closeModal();
                updateLocation(city, country);
            } catch (error) {
                console.error('Geolocation error:', error);
                alert('Could not determine your location. Please enter it manually.');
            } finally {
                if (gpsBtn) {
                    gpsBtn.disabled = false;
                }
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            alert('Location access denied. Please enter your location manually.');
            if (gpsBtn) {
                gpsBtn.disabled = false;
            }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
}

// ========================
// Settings Management
// ========================

function saveSettings() {
    const locationInput = elements.settingsLocation?.value.trim();
    
    if (!locationInput) {
        alert('Please enter a location');
        elements.settingsLocation?.focus();
        return;
    }
    
    const parsed = parseLocation(locationInput);
    if (!parsed) {
        alert('Please enter location in format: City, Country');
        elements.settingsLocation?.focus();
        return;
    }
    
    // Save method
    if (elements.settingsMethod) {
        localStorage.setItem(METHOD_KEY, elements.settingsMethod.value);
    }
    
    updateLocation(parsed.city, parsed.country);
}

// ========================
// Initialization
// ========================

function initializeTheme() {
    applyTheme(getPreferredTheme());
    elements.themeToggle?.addEventListener('click', toggleTheme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function initializeMethod() {
    const method = localStorage.getItem(METHOD_KEY) || '2';
    if (elements.settingsMethod) {
        elements.settingsMethod.value = method;
    }
}

function initializeModal() {
    // Open modal
    elements.settingsBtn?.addEventListener('click', openModal);
    
    // Close modal
    elements.closeSettingsBtn?.addEventListener('click', closeModal);
    
    // Close on backdrop click
    elements.settingsModal?.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            closeModal();
        }
    });
    
    // Keyboard handling
    document.addEventListener('keydown', handleModalKeydown);
    
    // Geolocation
    elements.geolocateBtn?.addEventListener('click', requestGeolocation);
    
    // Save settings
    elements.updateSettingsBtn?.addEventListener('click', saveSettings);
    
    // Save method on change
    elements.settingsMethod?.addEventListener('change', () => {
        localStorage.setItem(METHOD_KEY, elements.settingsMethod.value);
    });
    
    // Allow Enter key to submit in location input
    elements.settingsLocation?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveSettings();
        }
    });
}

function initializeFooter() {
    if (elements.yearEl) {
        elements.yearEl.textContent = new Date().getFullYear().toString();
    }
}

// ========================
// Countdown & Progress
// ========================

function parseTime(timeString) {
    // Handle format like "05:30 AM" or "05:30"
    const parts = timeString.match(/(\d{2}):(\d{2})\s*(AM|PM)?/i);
    if (!parts) return null;
    
    let hours = parseInt(parts[1], 10);
    const minutes = parseInt(parts[2], 10);
    const meridiem = parts[3]?.toUpperCase();
    
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    
    return new Date().setHours(hours, minutes, 0, 0);
}

function formatTimeRemaining(ms) {
    if (ms <= 0) return '0s';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

function updateCountdowns() {
    const now = new Date();
    
    // Get prayer times from page content
    const suhoorTimeText = document.querySelector('.suhoor-card .prayer-time')?.textContent;
    const iftarTimeText = document.querySelector('.iftar-card .prayer-time')?.textContent;
    
    if (suhoorTimeText && elements.suhoorCountdown) {
        const suhoorTime = parseTime(suhoorTimeText);
        if (suhoorTime) {
            const remaining = suhoorTime - now.getTime();
            elements.suhoorCountdown.textContent = remaining > 0 ? formatTimeRemaining(remaining) : 'Time passed';
        }
    }
    
    if (iftarTimeText && elements.iftarCountdown) {
        const iftarTime = parseTime(iftarTimeText);
        if (iftarTime) {
            const remaining = iftarTime - now.getTime();
            elements.iftarCountdown.textContent = remaining > 0 ? formatTimeRemaining(remaining) : 'Time passed';
            
            // Update fasting progress
            if (elements.fastingProgress && elements.progressText && suhoorTimeText) {
                const suhoorTime = parseTime(suhoorTimeText);
                if (suhoorTime) {
                    const totalDuration = iftarTime - suhoorTime;
                    const elapsed = now.getTime() - suhoorTime;
                    const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
                    
                    elements.fastingProgress.style.width = progress + '%';
                    elements.progressText.textContent = Math.round(progress) + '%';
                }
            }
        }
    }
}

function initializeCountdowns() {
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
}

// ========================
// Tracker Functions
// ========================

function initializeTracker() {
    const logWaterBtn = document.getElementById('logWater');
    const resetBtn = document.getElementById('resetTracker');
    
    if (logWaterBtn) {
        logWaterBtn.addEventListener('click', () => {
            alert('🎉 Great! You logged your water intake. Keep staying hydrated!');
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset today\'s tracker?')) {
                localStorage.removeItem('sawm-tracker-today');
                alert('✅ Today\'s tracker has been reset!');
            }
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeMethod();
    initializeModal();
    initializeFooter();
    initializeTabs();
    initializeCountdowns();
    initializeTracker();
});
