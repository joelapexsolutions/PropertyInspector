/**
 * Google Maps Integration for Property Inspector
 * South Africa focused implementation
 */

const mapsManager = {
    map: null,
    autocomplete: null,
    marker: null,
    infoWindow: null,
    placesService: null,
    isLoaded: false,
    
    // Initialize Google Maps
    // Initialize Google Maps
async init() {
    console.log('Manual address entry enabled');
    this.addPropertyLinks();
    this.setupManualInput();
},

setupManualInput() {
    const addressInput = document.getElementById('propertyAddress');
    if (addressInput) {
        addressInput.autocomplete = 'off';
        console.log('✅ Manual address input ready');
    }
},
    
    setupManualAddressInput() {
        const addressInput = document.getElementById('propertyAddress');
        if (!addressInput) return;
        
        // Clear any autocomplete interference
        addressInput.autocomplete = 'off';
        
        // Add manual geocoding on blur
        addressInput.addEventListener('blur', () => {
            const address = addressInput.value.trim();
            if (address) {
                this.geocodeAddress(address);
            }
        });
        
        console.log('Manual address input enabled');
    },
    
    // Geocode address manually
    geocodeAddress(address) {
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ 
            address: address,
            region: 'ZA'
        }, (results, status) => {
            if (status === 'OK' && results[0]) {
                this.handlePlaceSelection(results[0]);
            }
        });
    },
    
    // Load Google Maps API
    loadGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${window.GOOGLE_MAPS_API_KEY}&libraries=places,geometry&region=ZA&language=en`;
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // Initialize address autocomplete
    initializeAutocomplete() {
        const addressInput = document.getElementById('propertyAddress');
        if (!addressInput) return;
        
        try {
            this.autocomplete = new google.maps.places.Autocomplete(addressInput, {
                types: ['address'],
                componentRestrictions: { country: 'za' },
                fields: ['address_components', 'formatted_address', 'geometry', 'place_id']
            });
            
            this.autocomplete.addListener('place_changed', () => {
                const place = this.autocomplete.getPlace();
                if (place.geometry) {
                    this.handlePlaceSelection(place);
                }
            });
            
            this.styleAutocomplete();
            
            // Fix input field focus issues
            addressInput.addEventListener('focus', () => {
                this.autocomplete.setBounds(null);
            });
            
        } catch (error) {
            console.error('Autocomplete initialization failed:', error);
            // Fallback: allow normal typing
            this.setupManualAddressInput();
        }
    },
    
    // Handle place selection
    handlePlaceSelection(place) {
        const addressData = this.extractAddressComponents(place);
        this.updateAddressFields(addressData);
        this.showPropertyLocation(place);
        this.getNearbyAmenities(place.geometry.location);
        showSuccess('✅ Address validated!');
    },
    
    // Extract address components
    extractAddressComponents(place) {
        const components = place.address_components;
        const addressData = {
            fullAddress: place.formatted_address,
            suburb: '',
            city: '',
            coordinates: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            }
        };
        
        components.forEach(component => {
            const types = component.types;
            if (types.includes('sublocality') || types.includes('neighborhood')) {
                addressData.suburb = component.long_name;
            } else if (types.includes('locality')) {
                addressData.city = component.long_name;
            }
        });
        
        return addressData;
    },
    
    // Update form fields
    updateAddressFields(addressData) {
        const suburbField = document.getElementById('propertySuburb');
        if (suburbField && addressData.suburb) {
            suburbField.value = addressData.suburb;
        }
        
        if (appState.currentProperty) {
            appState.currentProperty.coordinates = addressData.coordinates;
        }
    },
    
    // Show property on map
    showPropertyLocation(place) {
        this.createMapContainer();
        
        const location = place.geometry.location;
        
        this.map = new google.maps.Map(document.getElementById('propertyMap'), {
            center: location,
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        
        this.marker = new google.maps.Marker({
            position: location,
            map: this.map,
            title: place.formatted_address
        });
        
        this.infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="color: #333; font-family: Poppins;">
                    <h3 style="margin: 0 0 10px 0; color: #2E86AB;">Property Location</h3>
                    <p style="margin: 0; font-size: 14px;">${place.formatted_address}</p>
                    <button onclick="mapsManager.openInGoogleMaps()" style="
                        background: #06D6A0; 
                        color: white; 
                        border: none; 
                        padding: 8px 15px; 
                        border-radius: 5px; 
                        cursor: pointer;
                        margin-top: 10px;
                        font-weight: 600;
                    ">Navigate Here</button>
                </div>
            `
        });
        
        this.marker.addListener('click', () => {
            this.infoWindow.open(this.map, this.marker);
        });
        
        this.placesService = new google.maps.places.PlacesService(this.map);
    },
    
    // Create map container
    createMapContainer() {
        if (document.getElementById('propertyMap')) return;
        
        const notesGroup = document.querySelector('#propertyNotes').closest('.form-group');
        const mapHTML = `
            <div class="form-group">
                <label class="form-label">Property Location & Info</label>
                <div id="propertyMap" style="
                    height: 250px; 
                    border-radius: 12px; 
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    overflow: hidden;
                    margin-bottom: 15px;
                "></div>
                <div id="propertyLinks"></div>
                <div id="nearbyAmenities"></div>
            </div>
        `;
        
        notesGroup.insertAdjacentHTML('beforebegin', mapHTML);
    },
    
    // Add property links section
    addPropertyLinks() {
        const linksContainer = document.getElementById('propertyLinks');
        if (!linksContainer) return;
        
        linksContainer.innerHTML = `
            <div class="property-links-section">
                <h4 style="color: var(--text-white); margin-bottom: 12px; font-size: 1rem;">
                    <i class="fas fa-external-link-alt"></i> Property Information
                </h4>
                <div class="property-links-grid">
                    <button class="property-link-btn" onclick="mapsManager.openPropertySite('property24')">
                        <i class="fas fa-home"></i> Property24
                    </button>
                    <button class="property-link-btn" onclick="mapsManager.openPropertySite('privateproperty')">
                        <i class="fas fa-building"></i> Private Property
                    </button>
                    <button class="property-link-btn" onclick="mapsManager.openPropertySite('standardbank')">
                        <i class="fas fa-chart-line"></i> Property Guide
                    </button>
                </div>
            </div>
        `;
    },
    
    // Open property sites
    openPropertySite(site) {
        const address = document.getElementById('propertyAddress').value;
        const suburb = document.getElementById('propertySuburb').value;
        const searchTerm = encodeURIComponent(`${address} ${suburb}`);
        
        const urls = {
            property24: `https://www.property24.com/for-sale/search?search=${searchTerm}`,
            privateproperty: `https://www.privateproperty.co.za/for-sale/search?search=${searchTerm}`,
            standardbank: 'https://www.standardbank.co.za/southafrica/personal/products-and-services/borrow-for-your-needs/home-loans/home-services-property-guide'
        };
        
        window.open(urls[site], '_blank');
    },
    
    // Get nearby amenities
    async getNearbyAmenities(location) {
        const amenityTypes = [
            { type: 'school', name: 'Schools', icon: '🏫' },
            { type: 'hospital', name: 'Healthcare', icon: '🏥' },
            { type: 'shopping_mall', name: 'Shopping', icon: '🛒' },
            { type: 'bank', name: 'Banking', icon: '🏦' }
        ];
        
        const container = document.getElementById('nearbyAmenities');
        if (!container) return;
        
        container.innerHTML = '<div class="amenities-loading">Finding nearby amenities...</div>';
        
        const amenitiesData = [];
        
        for (const amenity of amenityTypes) {
            try {
                const places = await this.searchNearbyPlaces(location, amenity.type);
                if (places.length > 0) {
                    amenitiesData.push({
                        ...amenity,
                        count: places.length,
                        closest: places[0].name,
                        distance: this.calculateDistance(location, places[0].geometry.location)
                    });
                }
            } catch (error) {
                console.error(`Error finding ${amenity.name}:`, error);
            }
        }
        
        this.renderAmenities(amenitiesData);
    },
    
    // Search nearby places
    searchNearbyPlaces(location, type) {
        return new Promise((resolve, reject) => {
            this.placesService.nearbySearch({
                location: location,
                radius: 3000,
                type: type
            }, (results, status) => {
                if (status === google.maps.places.PlacesStatus.OK) {
                    resolve(results);
                } else {
                    reject(status);
                }
            });
        });
    },
    
    // Calculate distance
    calculateDistance(point1, point2) {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
        return (distance / 1000).toFixed(1);
    },
    
    // Render amenities
    renderAmenities(amenitiesData) {
        const container = document.getElementById('nearbyAmenities');
        
        if (amenitiesData.length === 0) {
            container.innerHTML = '<div class="no-amenities">No nearby amenities found</div>';
            return;
        }
        
        container.innerHTML = `
            <div class="amenities-header">
                <h4 style="color: var(--text-white); margin-bottom: 12px; font-size: 1rem;">
                    <i class="fas fa-map-marker-alt"></i> Nearby Amenities
                </h4>
            </div>
            <div class="amenities-grid">
                ${amenitiesData.map(amenity => `
                    <div class="amenity-item">
                        <span class="amenity-icon">${amenity.icon}</span>
                        <div class="amenity-info">
                            <div class="amenity-name">${amenity.name}</div>
                            <div class="amenity-detail">${amenity.closest} - ${amenity.distance}km</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    // Navigation
    openInGoogleMaps() {
        if (appState.currentProperty?.coordinates) {
            const { lat, lng } = appState.currentProperty.coordinates;
            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
            window.open(url, '_blank');
        }
    },
    
    // Style autocomplete
    styleAutocomplete() {
        const style = document.createElement('style');
        style.textContent = `
            .pac-container {
                background: linear-gradient(135deg, #0F3E54, #1B5E7C);
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                margin-top: 5px;
            }
            .pac-item {
                color: white;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding: 12px 15px;
                cursor: pointer;
            }
            .pac-item:hover {
                background: rgba(6, 214, 160, 0.2);
            }
            .pac-matched {
                color: #06D6A0;
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
    }
};

// Initialize when property details screen loads
document.addEventListener('DOMContentLoaded', () => {
    const originalShowScreen = window.showScreen;
    window.showScreen = function(screenId) {
        originalShowScreen(screenId);
        
        if (screenId === 'propertyDetailsScreen') {
            setTimeout(() => {
                mapsManager.init().catch(console.error);
            }, 500);
        }
    };
});

window.mapsManager = mapsManager;