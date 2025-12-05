/**
 * Sawm - Minimal JS
 */

const THEME_KEY = 'sawm-theme';
const LOCATION_KEY = 'sawm-location';
const LOCATION_EXPIRY_KEY = 'sawm-location-expiry';
const METHOD_KEY = 'sawm-method';
const LOCATION_EXPIRY_DAYS = 30;

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
    get suhoorCountdown() { return document.getElementById('suhoor-countdown'); },
    get iftarCountdown() { return document.getElementById('iftar-countdown'); },
};

// Theme
function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    const isDark = theme === 'dark';
    elements.html.classList.toggle('dark-mode', isDark);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute('content', isDark ? '#000000' : '#ffffff');
    }
}

function toggleTheme() {
    const isDark = elements.html.classList.toggle('dark-mode');
    const newTheme = isDark ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, newTheme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute('content', isDark ? '#000000' : '#ffffff');
    }
}

// Modal
function openModal() {
    const modal = elements.settingsModal;
    if (!modal) return;
    modal.classList.add('show');
    const cached = getCachedLocation();
    if (cached && elements.settingsLocation) {
        elements.settingsLocation.value = `${cached.city}, ${cached.country}`;
    }
}

function closeModal() {
    const modal = elements.settingsModal;
    if (!modal) return;
    modal.classList.remove('show');
}

// Location
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
    if (new Date().getTime() > parseInt(expiry)) {
        localStorage.removeItem(LOCATION_KEY);
        localStorage.removeItem(LOCATION_EXPIRY_KEY);
        return null;
    }
    return JSON.parse(cached);
}

function updateLocation() {
    const input = elements.settingsLocation.value;
    const location = parseLocation(input);
    const method = elements.settingsMethod.value;
    
    if (location) {
        saveLocation(location.city, location.country);
        localStorage.setItem(METHOD_KEY, method);
        window.location.href = encodeLocation(location.city, location.country);
    } else {
        alert('Please enter location as "City, Country"');
    }
}

function geolocate() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    elements.geolocateBtn.textContent = '...';
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const response = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                );
                const data = await response.json();
                
                if (data.city && data.countryName) {
                    elements.settingsLocation.value = `${data.city}, ${data.countryName}`;
                }
            } catch (error) {
                console.error('Error getting location:', error);
                alert('Could not detect location');
            } finally {
                elements.geolocateBtn.textContent = 'GPS';
            }
        },
        () => {
            alert('Unable to retrieve your location');
            elements.geolocateBtn.textContent = 'GPS';
        }
    );
}

// Countdowns
function parseTime(timeStr) {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    
    if (target < now) {
        target.setDate(target.getDate() + 1);
    }
    
    return target;
}

function updateCountdowns() {
    const now = new Date();
    
    // Get times from DOM
    const suhoorTimeStr = document.querySelector('.prayer-card:first-child .prayer-time').textContent;
    const iftarTimeStr = document.querySelector('.prayer-card:last-child .prayer-time').textContent;
    
    const suhoorTime = parseTime(suhoorTimeStr);
    const iftarTime = parseTime(iftarTimeStr);
    
    function formatDiff(diff) {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    
    if (elements.suhoorCountdown) {
        let diff = suhoorTime - now;
        if (diff < 0) diff += 24 * 60 * 60 * 1000; // Should not happen with parseTime logic but safe guard
        elements.suhoorCountdown.textContent = formatDiff(diff);
    }
    
    if (elements.iftarCountdown) {
        let diff = iftarTime - now;
        if (diff < 0) diff += 24 * 60 * 60 * 1000;
        elements.iftarCountdown.textContent = formatDiff(diff);
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getPreferredTheme());
    
    if (elements.yearEl) {
        elements.yearEl.textContent = new Date().getFullYear();
    }
    
    // Event Listeners
    elements.themeToggle?.addEventListener('click', toggleTheme);
    elements.settingsBtn?.addEventListener('click', openModal);
    elements.closeSettingsBtn?.addEventListener('click', closeModal);
    elements.updateSettingsBtn?.addEventListener('click', updateLocation);
    elements.geolocateBtn?.addEventListener('click', geolocate);
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            closeModal();
        }
    });
    
    // Load saved method
    const savedMethod = localStorage.getItem(METHOD_KEY);
    if (savedMethod && elements.settingsMethod) {
        elements.settingsMethod.value = savedMethod;
    }
    
    // Start countdowns
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
});
