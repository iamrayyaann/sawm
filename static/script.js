const THEME_KEY = 'sawm-theme';
const LOCATION_KEY = 'sawm-location';
const LOCATION_EXPIRY_KEY = 'sawm-location-expiry';
const METHOD_KEY = 'sawm-method';
const LOCATION_EXPIRY_DAYS = 30;

// DOM Element References
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
    get yearEl() { return document.getElementById('year'); }
};

// Utility Functions
const toggleModal = (show) => {
    if (elements.settingsModal) {
        elements.settingsModal.classList.toggle('show', show);
    }
};

const updateThemeIcon = (isDark) => {
    const icon = elements.themeToggle?.querySelector('i');
    if (icon) {
        icon.className = isDark ? 'bx bxs-moon' : 'bx bxs-sun';
    }
};

const parseLocation = (input) => {
    const [city, country] = input.split(',').map(s => s.trim());
    return city && country ? { city, country } : null;
};

const encodeLocation = (city, country) => {
    return `/?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${localStorage.getItem(METHOD_KEY) || '2'}`;
};

// Storage Functions
const saveLocation = (city, country) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + LOCATION_EXPIRY_DAYS);
    localStorage.setItem(LOCATION_KEY, JSON.stringify({ city, country }));
    localStorage.setItem(LOCATION_EXPIRY_KEY, expiry.getTime());
};

const getCachedLocation = () => {
    const cached = localStorage.getItem(LOCATION_KEY);
    const expiry = localStorage.getItem(LOCATION_EXPIRY_KEY);
    
    if (!cached || !expiry || new Date().getTime() > parseInt(expiry)) {
        localStorage.removeItem(LOCATION_KEY);
        localStorage.removeItem(LOCATION_EXPIRY_KEY);
        return null;
    }
    
    return JSON.parse(cached);
};

// Location Functions
const updateLocation = (city, country) => {
    saveLocation(city, country);
    window.location.href = encodeLocation(city, country);
};

const requestGeolocation = () => {
    if (!navigator.geolocation) {
        alert('Geolocation not supported');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude: lat, longitude: lon } = position.coords;
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
                );
                const { address } = await response.json();
                const city = address.city || address.town || address.village || 'Unknown';
                const country = address.country || 'Unknown';
                updateLocation(city, country);
            } catch (error) {
                console.error('Geolocation error:', error);
                alert('Error determining location. Please enter manually.');
            }
        },
        () => alert('Location permission denied. Please enter manually.')
    );
};

// Initialization Functions
const initializeTheme = () => {
    const isDark = localStorage.getItem(THEME_KEY) === 'dark';
    elements.html.classList.toggle('dark-mode', isDark);
    updateThemeIcon(isDark);
    
    elements.themeToggle?.addEventListener('click', () => {
        const newDark = elements.html.classList.toggle('dark-mode');
        localStorage.setItem(THEME_KEY, newDark ? 'dark' : 'light');
        updateThemeIcon(newDark);
    });
};

const initializeMethod = () => {
    const method = localStorage.getItem(METHOD_KEY) || '2';
    if (elements.settingsMethod) {
        elements.settingsMethod.value = method;
    }
};

const initializeModal = () => {
    // Open modal
    elements.settingsBtn?.addEventListener('click', () => {
        toggleModal(true);
        const cached = getCachedLocation();
        if (cached && elements.settingsLocation) {
            elements.settingsLocation.value = `${cached.city}, ${cached.country}`;
        }
    });
    
    // Close modal
    elements.closeSettingsBtn?.addEventListener('click', () => toggleModal(false));
    
    // Close on outside click
    elements.settingsModal?.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            toggleModal(false);
        }
    });
    
    // Geolocation button
    elements.geolocateBtn?.addEventListener('click', () => {
        requestGeolocation();
        toggleModal(false);
    });
    
    // Save settings
    elements.updateSettingsBtn?.addEventListener('click', () => {
        const location = elements.settingsLocation?.value.trim();
        
        if (!location) {
            alert('Please enter a location');
            return;
        }
        
        const parsed = parseLocation(location);
        if (!parsed) {
            alert('Please use format: City, Country');
            return;
        }
        
        if (elements.settingsMethod) {
            localStorage.setItem(METHOD_KEY, elements.settingsMethod.value);
        }
        updateLocation(parsed.city, parsed.country);
    });
    
    // Save method on change
    elements.settingsMethod?.addEventListener('change', () => {
        localStorage.setItem(METHOD_KEY, elements.settingsMethod.value);
    });
};

const initializeFooter = () => {
    if (elements.yearEl) {
        elements.yearEl.textContent = new Date().getFullYear();
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeMethod();
    initializeModal();
    initializeFooter();
});
