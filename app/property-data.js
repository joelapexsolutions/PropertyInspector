/**
 * Property Inspector - Property Data Management
 * Handles CRUD operations and data persistence
 * FIXED: Removed duplicate functions causing saving conflicts
 */

// Property data operations
const propertyDataManager = {
    
    // Create new property
    createProperty(propertyData) {
        const property = {
            id: generateId(),
            ...propertyData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            photos: {},
            assessments: {},
            score: null,
            roomScores: {},
            assessmentNotes: '',
            roomInstances: {},
            roomNotes: {}
        };
        
        // Add to app state
        appState.properties.push(property);
        
        // Save to storage
        saveAppData();
        
        console.log('✅ Property created:', property.address);
        return property;
    },
    
    // Get property by ID
    getProperty(propertyId) {
        return appState.properties.find(p => p.id === propertyId);
    },
    
    // Get all properties
    getAllProperties() {
        return appState.properties;
    },
    
    // Update property
    updateProperty(propertyId, updates) {
        const propertyIndex = appState.properties.findIndex(p => p.id === propertyId);
        
        if (propertyIndex === -1) {
            console.error('Property not found:', propertyId);
            return null;
        }
        
        // Update property with new data
        appState.properties[propertyIndex] = {
            ...appState.properties[propertyIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        // Save to storage
        saveAppData();
        
        console.log('✅ Property updated:', propertyId);
        return appState.properties[propertyIndex];
    },
    
    // Delete property
    deleteProperty(propertyId) {
        const propertyIndex = appState.properties.findIndex(p => p.id === propertyId);
        
        if (propertyIndex === -1) {
            console.error('Property not found:', propertyId);
            return false;
        }
        
        // Remove from array
        const deletedProperty = appState.properties.splice(propertyIndex, 1)[0];
        
        // Save to storage
        saveAppData();
        
        console.log('✅ Property deleted:', deletedProperty.address);
        return true;
    },
    
    // Search properties
    searchProperties(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            return appState.properties;
        }
        
        const term = searchTerm.toLowerCase();
        
        return appState.properties.filter(property => {
            return (
                property.address?.toLowerCase().includes(term) ||
                property.suburb?.toLowerCase().includes(term) ||
                property.type?.toLowerCase().includes(term) ||
                property.notes?.toLowerCase().includes(term)
            );
        });
    },
    
    // Filter properties by criteria
    filterProperties(criteria) {
        let filtered = appState.properties;
        
        if (criteria.type) {
            filtered = filtered.filter(p => p.type === criteria.type);
        }
        
        if (criteria.bedrooms) {
            filtered = filtered.filter(p => parseInt(p.bedrooms) === criteria.bedrooms);
        }
        
        if (criteria.bathrooms) {
            filtered = filtered.filter(p => parseFloat(p.bathrooms) === criteria.bathrooms);
        }
        
        if (criteria.minScore !== undefined) {
            filtered = filtered.filter(p => p.score >= criteria.minScore);
        }
        
        if (criteria.maxScore !== undefined) {
            filtered = filtered.filter(p => p.score <= criteria.maxScore);
        }
        
        if (criteria.assessed !== undefined) {
            if (criteria.assessed) {
                filtered = filtered.filter(p => p.score !== null);
            } else {
                filtered = filtered.filter(p => p.score === null);
            }
        }
        
        return filtered;
    },
    
    // Sort properties
    sortProperties(properties, sortBy, order = 'asc') {
        const sorted = [...properties];
        
        sorted.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'address':
                    aValue = a.address || '';
                    bValue = b.address || '';
                    break;
                case 'score':
                    aValue = a.score || 0;
                    bValue = b.score || 0;
                    break;
                case 'createdAt':
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
                case 'assessedAt':
                    aValue = a.assessedAt ? new Date(a.assessedAt) : new Date(0);
                    bValue = b.assessedAt ? new Date(b.assessedAt) : new Date(0);
                    break;
                case 'type':
                    aValue = a.type || '';
                    bValue = b.type || '';
                    break;
                default:
                    return 0;
            }
            
            if (aValue < bValue) return order === 'asc' ? -1 : 1;
            if (aValue > bValue) return order === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sorted;
    },
    
    // Get property statistics
    getPropertyStats() {
        const properties = appState.properties;
        
        const stats = {
            total: properties.length,
            assessed: properties.filter(p => p.score !== null).length,
            unassessed: properties.filter(p => p.score === null).length,
            avgScore: 0,
            byType: {},
            byScore: {
                excellent: 0, // 80-100
                good: 0,      // 60-79
                fair: 0,      // 40-59
                poor: 0       // 0-39
            }
        };
        
        // Calculate average score
        const assessedProperties = properties.filter(p => p.score !== null);
        if (assessedProperties.length > 0) {
            stats.avgScore = Math.round(
                assessedProperties.reduce((sum, p) => sum + p.score, 0) / assessedProperties.length
            );
        }
        
        // Count by type
        properties.forEach(property => {
            const type = property.type || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });
        
        // Count by score ranges
        assessedProperties.forEach(property => {
            const score = property.score;
            if (score >= 80) stats.byScore.excellent++;
            else if (score >= 60) stats.byScore.good++;
            else if (score >= 40) stats.byScore.fair++;
            else stats.byScore.poor++;
        });
        
        return stats;
    },
    
    // Export properties data
    exportProperties(format = 'json') {
        const properties = appState.properties;
        
        if (format === 'json') {
            return JSON.stringify(properties, null, 2);
        } else if (format === 'csv') {
            if (properties.length === 0) return '';
            
            const headers = [
                'Address', 'Suburb', 'Type', 'Bedrooms', 'Bathrooms', 
                'Parking', 'Size', 'Price', 'Score', 'Created', 'Assessed'
            ];
            
            const rows = properties.map(p => [
                p.address || '',
                p.suburb || '',
                p.type || '',
                p.bedrooms || '',
                p.bathrooms || '',
                p.parking || '',
                p.size || '',
                p.price || '',
                p.score || '',
                p.createdAt || '',
                p.assessedAt || ''
            ]);
            
            const csvContent = [headers, ...rows]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');
                
            return csvContent;
        }
        
        return null;
    },
    
    // Import properties data
    importProperties(data, format = 'json') {
        try {
            let importedProperties = [];
            
            if (format === 'json') {
                importedProperties = JSON.parse(data);
            } else if (format === 'csv') {
                // Basic CSV parsing - you might want to use a library for complex CSV
                const lines = data.split('\n');
                const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
                
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim()) {
                        const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
                        const property = {};
                        headers.forEach((header, index) => {
                            property[header.toLowerCase()] = values[index] || '';
                        });
                        importedProperties.push(property);
                    }
                }
            }
            
            // Validate and add imported properties
            let importedCount = 0;
            importedProperties.forEach(propData => {
                if (propData.address) { // Basic validation
                    this.createProperty(propData);
                    importedCount++;
                }
            });
            
            console.log(`✅ Imported ${importedCount} properties`);
            return importedCount;
            
        } catch (error) {
            console.error('Import failed:', error);
            return 0;
        }
    }
};

// Make functions globally available
window.getProperty = propertyDataManager.getProperty.bind(propertyDataManager);
window.getAllProperties = propertyDataManager.getAllProperties.bind(propertyDataManager);
window.updateProperty = propertyDataManager.updateProperty.bind(propertyDataManager);
window.deleteProperty = propertyDataManager.deleteProperty.bind(propertyDataManager);
window.searchProperties = propertyDataManager.searchProperties.bind(propertyDataManager);
window.filterProperties = propertyDataManager.filterProperties.bind(propertyDataManager);
window.sortProperties = propertyDataManager.sortProperties.bind(propertyDataManager);
window.getPropertyStats = propertyDataManager.getPropertyStats.bind(propertyDataManager);
window.exportProperties = propertyDataManager.exportProperties.bind(propertyDataManager);
window.importProperties = propertyDataManager.importProperties.bind(propertyDataManager);

// Enhanced property list rendering
function renderPropertyList() {
    const container = document.getElementById('propertyList');
    const properties = getAllProperties();
    container.innerHTML = properties.map(p => buildPropertyCard(p)).join('');
    // Also update home screen list
    const homeList = document.getElementById('homePropertyList');
    if (homeList) homeList.innerHTML = properties.map(p => buildPropertyCard(p)).join('');
    // Update stats
    updateHomeStats(properties);
    // Re-apply premium lock badges after rebuilding the card HTML
    if (window.addLimitIndicators) window.addLimitIndicators();
}

function buildPropertyCard(property) {
    const progress = calculateAssessmentProgress(property);
    const profilePic = (window.photoManager && window.photoManager.profilePictures ?
        window.photoManager.profilePictures[property.id] : null) ||
        getMainPropertyPhoto(property);

    // Ensure score is calculated for completed assessments
    const isComplete = progress >= 100;
    let score = null;
    if (isComplete) score = property.score;
    if (isComplete && !score && hasAssessmentData(property) && window.calculatePropertyScore) {
        try {
            const sd = window.calculatePropertyScore(property);
            if (sd && sd.overall) score = sd.overall;
        } catch (e) { console.log('Score calc on render:', e.message); }
    }

    // Grade for badge colour — uses the official scoring thresholds
    // (>=83 Excellent, >=66 Good, >=46 Fair, <46 Poor) so the grade
    // matches the Assessment Results and Full Report everywhere.
    let gradeClass = 'pending', statusText = 'NOT ASSESSED';
    if (score) {
        let g = null;
        if (window.getScoreGrade) {
            try { g = window.getScoreGrade(score).grade; } catch (e) { g = null; }
        }
        if (!g) g = score >= 83 ? 'excellent' : score >= 66 ? 'good' : score >= 46 ? 'fair' : 'poor';
        gradeClass = g;
        statusText = g === 'excellent' ? 'EXCELLENT CONDITION' :
                     g === 'good'      ? 'GOOD CONDITION' :
                     g === 'fair'      ? 'FAIR CONDITION' :
                                         'NEEDS ATTENTION';
    }
    if (!score && progress > 0 && !isComplete) {
        statusText = 'ASSESSMENT IN PROGRESS';
    }
    const statusClass = gradeClass;

    // Labelled assessment score badge
    const scoreBadge = score ? `
        <div class="prop-score-badge ${gradeClass}">
            <div class="psb-label">Assessment Score</div>
            <div class="psb-value"><span class="psb-num">${score}</span><span class="psb-out">/100</span></div>
        </div>` : '';

    // Specs row
    const specs = [
        property.bedrooms ? `<span class="prop-card-spec"><i class="fas fa-bed"></i> ${property.bedrooms}</span>` : '',
        property.bathrooms ? `<span class="prop-card-spec"><i class="fas fa-bath"></i> ${property.bathrooms}</span>` : '',
        property.parking ? `<span class="prop-card-spec"><i class="fas fa-car"></i> ${property.parking}</span>` : '',
        property.size ? `<span class="prop-card-spec"><i class="fas fa-ruler-combined"></i> ${property.size}m²</span>` : '',
    ].filter(Boolean).join('');

    // Buttons
    const hasData = hasAssessmentData(property);
    const resultsBtn = (hasData && isComplete) ? `
        <button class="prop-action-btn view" onclick="viewAssessmentResults('${property.id}')">
            <i class="fas fa-chart-line"></i> Results
        </button>` : '';

    return `
        <div class="property-card" data-id="${property.id}" data-assessed="${hasData ? 'true' : 'false'}">
            <div class="prop-photo-area" onclick="selectPropertyProfilePic('${property.id}')">
                ${profilePic
                    ? `<img src="${profilePic}" alt="${property.address}">`
                    : `<div class="prop-photo-placeholder">
                           <i class="fas fa-camera"></i>
                           <span>Tap to add photo</span>
                       </div>`}
                ${scoreBadge}
                <div class="prop-status-badge ${statusClass}">${statusText}</div>
            </div>
            <div class="prop-card-info">
                ${property.complexName ? `<div class="prop-card-address">${property.complexName}</div>
                <div class="prop-card-meta">${property.address || ''}</div>` :
                `<div class="prop-card-address">${property.address || 'Property'}</div>`}
                <div class="prop-card-meta">${property.type || 'Property'}${property.price ? ` &nbsp;·&nbsp; R ${property.price.replace(/\B(?=(\d{3})+(?!\d))/g,' ')}` : ''}</div>
                <div class="prop-card-specs">${specs}</div>
                <div class="prop-progress-wrap">
                    <div class="prop-progress-bg">
                        <div class="prop-progress-fill" style="width:${progress}%"></div>
                    </div>
                    <div class="prop-progress-row">
                        <span>${isComplete ? 'Assessment complete' : progress > 0 ? 'Assessment in progress' : 'Not yet assessed'}</span>
                        <span class="prog-pct">${progress > 0 ? progress + '%' : '0%'}</span>
                    </div>
                </div>
            </div>
            <div class="prop-card-actions">
                <button class="prop-action-btn assess" onclick="startAssessment('${property.id}')">
                    <i class="fas fa-clipboard-check"></i> ${isComplete ? 'Reassess' : progress > 0 ? 'Continue' : 'Assess'}
                </button>
                ${resultsBtn}
                <button class="prop-action-btn edit labeled" onclick="viewPropertyDetails('${property.id}')">
                    <i class="fas fa-eye"></i> View &amp; Edit
                </button>
                <button class="prop-action-btn del" onclick="confirmDeleteProperty('${property.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
}

function updateHomeStats(properties) {
    const total = properties.length;
    const assessed = properties.filter(p => calculateAssessmentProgress(p) >= 100).length;
    const scores = properties
        .filter(p => calculateAssessmentProgress(p) >= 100)
        .map(p => p.score)
        .filter(Boolean);
    const best = scores.length ? Math.max(...scores) : null;
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('statTotalProperties', total);
    el('statAssessed', assessed);
    el('statBestScore', best ? best : '--');
    el('statReports', 0);
}

function calculateAssessmentProgress(property) {
    // If this property's assessment is currently open, compute progress LIVE from
    // the in-session assessment state. This guarantees the property cards always
    // match the assessment screen exactly, with no dependency on save timing.
    try {
        if (typeof appState !== 'undefined' && appState.currentProperty &&
            appState.currentProperty.id === property.id &&
            typeof calculateAccurateProgress === 'function' &&
            typeof assessmentState !== 'undefined' && assessmentState.scores &&
            assessmentState.propertyId === property.id &&
            Object.keys(assessmentState.scores).length > 0) {
            const live = calculateAccurateProgress();
            property.progress = live; // keep the stored field in sync
            const idx = appState.properties.findIndex(p => p.id === property.id);
            if (idx !== -1) appState.properties[idx].progress = live;
            // Ensure the score exists the moment the assessment completes
            if (live >= 100 && !property.score &&
                typeof forceRecalculatePropertyScore === 'function') {
                try { forceRecalculatePropertyScore(property); } catch (e) {}
            }
            return live;
        }
    } catch (e) {}
    return property.progress || 0;
}

function createDefaultInstances(property, room) {
    const instances = [];
    if (room.allowMultiple) {
        const count = getRoomCount(property, room.id);
        for (let i = 0; i < count; i++) {
            instances.push({ id: `${room.id}_${i}` });
        }
    } else {
        instances.push({ id: room.id });
    }
    return instances;
}

function getRoomCount(property, roomId) {
    switch (roomId) {
        case 'kitchen':
            return 1;
        case 'bedrooms':
            return parseInt(property.bedrooms) || 1;
        case 'bathrooms':
            return Math.ceil(parseFloat(property.bathrooms)) || 1;
        case 'living':
            return 1;
        case 'garage':
            return parseInt(property.parking) || 1;
        default:
            return 1;
    }
}

// Property management functions
function getMainPropertyPhoto(property) {
    if (!property.photos) return null;
    
    // Find first photo from any room
    for (const [key, photos] of Object.entries(property.photos)) {
        if (photos.length > 0) {
            return photos[0].data;
        }
    }
    return null;
}

function selectPropertyProfilePic(propertyId) {
    const property = getProperty(propertyId);
    if (!property) return;
    
    const existingPhotos = getAllPropertyPhotos(property);
    let selectedPhoto = null;
    
    const photoOptions = existingPhotos.map((photo, index) => 
        `<div class="profile-pic-option" onclick="viewProfilePhoto('${photo.data}', ${index})" data-photo="${photo.data}">
            <img src="${photo.data}" alt="Photo ${index + 1}" style="width: 120px; height: 90px; object-fit: cover; border-radius: 8px;">
        </div>`
    ).join('');
    
    showModal('Select Profile Picture', `
        <div class="profile-pic-selector">
            ${photoOptions}
            <button class="profile-pic-button add-new" onclick="capturePropertyProfilePic('${propertyId}')" style="
                background: var(--gradient-success); 
                color: white; 
                border: none; 
                padding: 15px 20px; 
                border-radius: 12px; 
                font-weight: 700; 
                cursor: pointer; 
                display: flex; 
                align-items: center; 
                gap: 10px;
                width: 100%;
                justify-content: center;
                margin: 10px 0;
            ">
                <i class="fas fa-camera"></i>
                Add Profile Pic
            </button>
            ${property.profilePicture ? `
                <button class="profile-pic-button remove-pic" onclick="removePropertyProfilePic('${propertyId}')" style="
                    background: linear-gradient(135deg, #E63946, #DC2626); 
                    color: white; 
                    border: none; 
                    padding: 15px 20px; 
                    border-radius: 12px; 
                    font-weight: 700; 
                    cursor: pointer;
                    display: flex; 
                    align-items: center; 
                    gap: 10px;
                    width: 100%;
                    justify-content: center;
                ">
                    <i class="fas fa-trash"></i>
                    Remove Profile Picture
                </button>
            ` : ''}
        </div>
    `, () => {
        // OK button callback
        const selectedOption = document.querySelector('.profile-pic-option.selected');
        if (selectedOption) {
            const photoData = selectedOption.getAttribute('data-photo');
            setPropertyProfilePic(propertyId, photoData);
        }
    }, 'OK');
}

function removePropertyProfilePic(propertyId) {
    updateProperty(propertyId, { profilePicture: null });
    hideModal();
    renderPropertyList();
    showSuccess('Profile picture removed!');
}

function viewProfilePhoto(photoData, index) {
    // Remove previous selection
    document.querySelectorAll('.profile-pic-option').forEach(opt => opt.classList.remove('selected'));
    
    // Mark as selected
    event.target.closest('.profile-pic-option').classList.add('selected');
    
    // Show large preview
    const modal = document.createElement('div');
    modal.className = 'photo-view-modal';
    modal.innerHTML = `
        <div class="photo-view-container">
            <button class="close-view-btn" onclick="this.closest('.photo-view-modal').remove()">
                <i class="fas fa-times"></i>
            </button>
            <img src="${photoData}" class="photo-view-img" alt="Profile photo preview">
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

function getAllPropertyPhotos(property) {
    const allPhotos = [];
    
    if (property.photos) {
        Object.entries(property.photos).forEach(([key, photos]) => {
            const [propertyId, roomId, itemText] = key.split('_');
            photos.forEach(photo => {
                allPhotos.push({
                    ...photo,
                    roomName: roomId.charAt(0).toUpperCase() + roomId.slice(1),
                    itemName: itemText
                });
            });
        });
    }
    
    return allPhotos;
}

function setPropertyProfilePic(propertyId, photoData) {
    try {
        // Save ONLY to IndexedDB, NOT to localStorage
        if (window.photoManager) {
            // Ensure profilePictures exists
            if (!window.photoManager.profilePictures) {
                window.photoManager.profilePictures = {};
            }
            
            // Save to memory
            window.photoManager.profilePictures[propertyId] = photoData;
            
            // Save to IndexedDB
            if (typeof window.photoManager.saveProfilePictureToIndexedDB === 'function') {
                window.photoManager.saveProfilePictureToIndexedDB(propertyId, photoData);
            }
        }
        
        // Update property with just a FLAG, NOT the actual image data
        const updates = { 
            hasProfilePicture: true,
            profilePictureUpdated: new Date().toISOString()
        };
        updateProperty(propertyId, updates);
        
        hideModal();
        renderPropertyList();
        showSuccess('Profile picture updated!');
        
    } catch (error) {
        console.error('❌ Failed to set profile picture:', error);
        showSuccess('Failed to save profile picture');
    }
}

async function capturePropertyProfilePic(propertyId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'camera';
    
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Add new photo to modal
                const selector = document.querySelector('.profile-pic-selector');
                const newPhotoHtml = `
                    <div class="profile-pic-option selected" onclick="viewProfilePhoto('${e.target.result}', -1)" data-photo="${e.target.result}">
                        <img src="${e.target.result}" alt="New photo" style="width: 120px; height: 90px; object-fit: cover; border-radius: 8px;">
                    </div>
                `;
                
                // Remove previous selection
                document.querySelectorAll('.profile-pic-option').forEach(opt => opt.classList.remove('selected'));
                
                // Add new photo at the top
                selector.insertAdjacentHTML('afterbegin', newPhotoHtml);
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// Enhanced property details view
function viewPropertyDetails(propertyId) {
    const property = getProperty(propertyId);
    if (!property) {
        showModal('Error', 'Property not found');
        return;
    }
    
    // Ensure photos are loaded before rendering
    if (window.photoManager && window.photoManager.loadPhotosFromIndexedDB) {
        window.photoManager.loadPhotosFromIndexedDB().then(() => {
            appState.currentProperty = property;
            showScreen('propertyDetailViewScreen');
            renderPropertyDetailView(property);
        });
    } else {
        appState.currentProperty = property;
        showScreen('propertyDetailViewScreen');
        renderPropertyDetailView(property);
    }
}

function confirmDeleteProperty(propertyId) {
    const property = getProperty(propertyId);
    if (!property) return;
    
    showModal('Delete Property?', 
        `Are you sure you want to delete "${property.address}"? This action cannot be undone.`,
        () => {
            if (deleteProperty(propertyId)) {
                showSuccess('Property deleted successfully');
                updatePropertyList();
                updatePropertyCount();
            }
        },
        'Delete',
        null,
        'Cancel'
    );
}

// Property Detail View - will be enhanced next
function renderPropertyDetailView(property) {
    const container = document.getElementById('propertyDetailContainer');
    container.innerHTML = `
        <div class="property-detail-placeholder">
            <h3>Property Details Screen</h3>
            <p>Building Property24-style view...</p>
            <p>Property: ${property.address}</p>
            <button class="primary-button" onclick="showScreen('propertyListScreen')">Back to List</button>
        </div>
    `;
}

function toggleEditMode() {
    alert('Edit mode coming soon');
}

// Get property score display
function getPropertyScoreDisplay(property) {
    const progress = calculateAssessmentProgress(property);

    if (progress >= 100 && property.assessments && Object.keys(property.assessments).length > 0) {
        const scoreData = window.calculatePropertyScore(property);
        if (scoreData && scoreData.overall) {
            const grade = window.getScoreGrade(scoreData.overall);
            return `
                <div class="score-with-type">
                    <span class="score-value" style="color: ${grade.color}">${scoreData.overall}% ${grade.label}</span>
                </div>
            `;
        }
    }

    if (progress > 0) {
        return `<span class="assessment-in-progress">Assessment Progress: ${progress}%</span>`;
    }

    return '<span class="no-score">Not Assessed</span>';
}

// Check if property has assessment data
function hasAssessmentData(property) {
    return property.assessments && Object.keys(property.assessments).length > 0;
}

// Navigate to assessment results
function viewAssessmentResults(propertyId) {
    const property = getProperty(propertyId);
    if (!property) {
        console.error('Property not found:', propertyId);
        return;
    }
    
    // Check if assessment is 100% complete
    const progress = calculateAssessmentProgress(property);
    if (progress < 100) {
        showModal('Assessment Incomplete', `
            <div class="warning-modal-content">
                <div class="warning-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <p><strong>Assessment must be 100% complete to view results.</strong></p>
                <p>Current progress: ${progress}%</p>
            </div>
        `);
        return;
    }
    
    appState.currentProperty = property;
    showScreen('assessmentResultsScreen');
}

// Export new functions
window.getPropertyScoreDisplay = getPropertyScoreDisplay;
window.hasAssessmentData = hasAssessmentData;
window.viewAssessmentResults = viewAssessmentResults;

// Export functions
window.propertyDataManager = propertyDataManager;
window.renderPropertyList = renderPropertyList;
window.confirmDeleteProperty = confirmDeleteProperty;
window.viewPropertyDetails = viewPropertyDetails;
window.renderPropertyDetailView = renderPropertyDetailView;
window.toggleEditMode = toggleEditMode;

// ═══════════════════════════════════════════════════════════════
// CUSTOM APP CONFIG — global customization, stored in localStorage
// Configured once in "Customize Assessment" screen.
// Applies to ALL future assessments automatically.
// ═══════════════════════════════════════════════════════════════

// Key used for localStorage — literal string avoids any const TDZ issues
function _custKey() { return 'hbg_custom_config'; }

function _defaultCustomConfig() {
    return { version: 1, customFeatures: [], customQuestions: [] };
}

function getCustomConfig() {
    try {
        var raw = localStorage.getItem(_custKey());
        if (!raw) return _defaultCustomConfig();
        var parsed = JSON.parse(raw);
        return {
            version: parsed.version || 1,
            customFeatures: Array.isArray(parsed.customFeatures) ? parsed.customFeatures : [],
            customQuestions: Array.isArray(parsed.customQuestions) ? parsed.customQuestions : []
        };
    } catch(e) { return _defaultCustomConfig(); }
}

function saveCustomConfig(config) {
    try {
        localStorage.setItem(_custKey(), JSON.stringify(config));
        return true;
    } catch(e) {
        console.error('Failed to save custom config:', e);
        return false;
    }
}

// ── Custom Features CRUD ──────────────────────────────────────

function addCustomFeature(data) {
    const config = getCustomConfig();
    const feature = {
        id: 'cf_' + Date.now(),
        name: data.name,
        section: data.section,   // 'location' | 'exterior' | 'interior' | 'other'
        excluded: false,
        items: []
    };
    config.customFeatures.push(feature);
    saveCustomConfig(config);
    return feature;
}

function updateCustomFeature(featureId, updates) {
    const config = getCustomConfig();
    const idx = config.customFeatures.findIndex(f => f.id === featureId);
    if (idx === -1) return null;
    config.customFeatures[idx] = { ...config.customFeatures[idx], ...updates };
    saveCustomConfig(config);
    return config.customFeatures[idx];
}

function deleteCustomFeature(featureId) {
    const config = getCustomConfig();
    config.customFeatures = config.customFeatures.filter(f => f.id !== featureId);
    saveCustomConfig(config);
}

function toggleCustomFeatureExcluded(featureId) {
    const config = getCustomConfig();
    const feature = config.customFeatures.find(f => f.id === featureId);
    if (!feature) return false;
    feature.excluded = !feature.excluded;
    saveCustomConfig(config);
    return feature.excluded;
}

// ── Custom Feature Items CRUD ────────────────────────────────

function addCustomFeatureItem(featureId, data) {
    const config = getCustomConfig();
    const feature = config.customFeatures.find(f => f.id === featureId);
    if (!feature) return null;
    const item = {
        id: 'cfi_' + Date.now(),
        name: data.name,
        tooltip: data.tooltip || '',
        weightLabel: data.weightLabel,          // 'Low'|'Moderate'|'High'|'Very High'|'Critical'
        weightValue: Number(data.weightValue),  // 1 | 2 | 3 | 3.5 | 4
        includeAs: data.includeAs || 'dropdown', // 'dropdown' | 'main'
        guidance: {
            excellent: data.guidance?.excellent || '',
            good:      data.guidance?.good      || '',
            fair:      data.guidance?.fair      || '',
            poor:      data.guidance?.poor      || ''
        }
    };
    feature.items.push(item);
    saveCustomConfig(config);
    return item;
}

function updateCustomFeatureItem(featureId, itemId, updates) {
    const config = getCustomConfig();
    const feature = config.customFeatures.find(f => f.id === featureId);
    if (!feature) return null;
    const idx = feature.items.findIndex(i => i.id === itemId);
    if (idx === -1) return null;
    if (updates.guidance) {
        feature.items[idx].guidance = { ...feature.items[idx].guidance, ...updates.guidance };
        const { guidance, ...rest } = updates;
        feature.items[idx] = { ...feature.items[idx], ...rest };
    } else {
        feature.items[idx] = { ...feature.items[idx], ...updates };
    }
    saveCustomConfig(config);
    return feature.items[idx];
}

function deleteCustomFeatureItem(featureId, itemId) {
    const config = getCustomConfig();
    const feature = config.customFeatures.find(f => f.id === featureId);
    if (!feature) return;
    feature.items = feature.items.filter(i => i.id !== itemId);
    saveCustomConfig(config);
}

// ── Custom Questions CRUD ────────────────────────────────────

function addCustomQuestion(data) {
    const config = getCustomConfig();
    const question = {
        id: 'cq_' + Date.now(),
        question: data.question,
        tooltip: data.tooltip || ''
    };
    config.customQuestions.push(question);
    saveCustomConfig(config);
    return question;
}

function deleteCustomQuestion(questionId) {
    const config = getCustomConfig();
    config.customQuestions = config.customQuestions.filter(q => q.id !== questionId);
    saveCustomConfig(config);
}

// ── Export / Import ──────────────────────────────────────────

function exportCustomConfig() {
    const config   = getCustomConfig();
    const json     = JSON.stringify(config, null, 2);
    const filename = 'hbg_custom_settings_' + new Date().toISOString().slice(0, 10) + '.json';

    if (typeof Android !== 'undefined' && Android.shareJsonFile) {
        // Android WebView — use native bridge (Blob URLs not supported in WebView)
        try {
            const bytes  = new TextEncoder().encode(json);
            const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
            const base64 = btoa(binary);
            Android.shareJsonFile(base64, filename);
        } catch (e) {
            console.error('Export via bridge failed:', e);
        }
    } else {
        // PWA / browser fallback
        const blob = new Blob([json], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

function importCustomConfig(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        if (!Array.isArray(parsed.customFeatures) || !Array.isArray(parsed.customQuestions)) {
            return { success: false, error: 'Invalid settings file. Please use a file exported from this app.' };
        }
        saveCustomConfig({
            version: parsed.version || 1,
            customFeatures: parsed.customFeatures,
            customQuestions: parsed.customQuestions
        });
        return { success: true };
    } catch(e) {
        return { success: false, error: 'Could not read the file. Make sure it is a valid settings file.' };
    }
}

// ── Custom Assessment State helpers ─────────────────────────
// Custom item ratings stored in property.customAssessments[itemId] = { rating, note }
// Custom guidance notes (from full report screen) in property.customGuidanceNotes[itemId]

function getCustomAssessments(property) {
    return property.customAssessments || {};
}

function getCustomGuidanceNotes(property) {
    return property.customGuidanceNotes || {};
}

// Expose everything
window.getCustomConfig            = getCustomConfig;
window.saveCustomConfig           = saveCustomConfig;
window.addCustomFeature           = addCustomFeature;
window.updateCustomFeature        = updateCustomFeature;
window.deleteCustomFeature        = deleteCustomFeature;
window.toggleCustomFeatureExcluded = toggleCustomFeatureExcluded;
window.addCustomFeatureItem       = addCustomFeatureItem;
window.updateCustomFeatureItem    = updateCustomFeatureItem;
window.deleteCustomFeatureItem    = deleteCustomFeatureItem;
window.addCustomQuestion          = addCustomQuestion;
window.deleteCustomQuestion       = deleteCustomQuestion;
window.exportCustomConfig         = exportCustomConfig;
window.importCustomConfig         = importCustomConfig;
window.getCustomAssessments       = getCustomAssessments;
window.getCustomGuidanceNotes     = getCustomGuidanceNotes;
