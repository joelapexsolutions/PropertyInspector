/**
 * Property Inspector - Photo Management System
 * Android WebView Compatible - FIXED VERSION
 */

const photoManager = {
    // Store photos in memory 
    photos: {},
	profilePictures: {},
    currentCapture: null,
    
    // Capture photo using Android file chooser
    async capturePhoto(roomId, itemText) {
        console.log('=== CAPTURE PHOTO CALLED ===');
        console.log('Room ID:', roomId, 'Item:', itemText);
        
        this.currentCapture = {
            roomId: roomId,
            itemText: itemText
        };
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'camera';
        input.style.display = 'none';
        
        input.onchange = async (event) => {
            console.log('=== INPUT CHANGE EVENT ===');
            const file = event.target.files[0];
            console.log('File selected:', file);
            
            if (file && this.currentCapture) {
                console.log('Processing photo...');
                await this.processPhoto(file, this.currentCapture.roomId, this.currentCapture.itemText);
                this.currentCapture = null;
            } else {
                console.error('No file or capture context');
            }
        };
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    },
	
	saveProfilePictureToIndexedDB(propertyId, imageData) {
    // Ensure profilePictures exists
    if (!this.profilePictures) {
        this.profilePictures = {};
    }
    
    // Save to memory immediately
    this.profilePictures[propertyId] = imageData;
        
        // Save to IndexedDB
        this.initIndexedDB().then(db => {
            const transaction = db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            
            const request = store.put({ 
                id: `profile_${propertyId}`, 
                photos: [{ data: imageData, timestamp: Date.now() }] 
            });
            
            request.onsuccess = () => {
                console.log(`✅ Profile picture saved to IndexedDB for ${propertyId}`);
            };
            
            request.onerror = () => {
                console.error(`❌ Failed to save profile picture to IndexedDB for ${propertyId}`);
            };
        }).catch(error => {
            console.error('❌ IndexedDB error:', error);
        });
    },
	
	async loadPhotosFromIndexedDB() {
    try {
        const db = await this.initIndexedDB();
        const transaction = db.transaction(['photos'], 'readonly');
        const store = transaction.objectStore('photos');
        
        return new Promise((resolve) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const results = request.result;
                
                // FIXED: Only clear photos, preserve profile pictures
				this.photos = {};
				if (!this.profilePictures) {
					this.profilePictures = {};
				}
                
                results.forEach(item => {
                    if (item.id.startsWith('profile_')) {
                        // Load profile pictures
                        const propertyId = item.id.replace('profile_', '');
                        if (item.photos && item.photos.length > 0) {
                            this.profilePictures[propertyId] = item.photos[0].data;
                            console.log(`✅ Loaded profile picture for property ${propertyId}`);
                        }
                    } else {
                        // Load regular photos - FIXED STRUCTURE
                        if (item.key) {
                            // New structure with key
                            if (!this.photos[item.key]) {
                                this.photos[item.key] = [];
                            }
                            this.photos[item.key].push(item);
                        } else {
                            // Legacy structure - rebuild key
                            const key = `${item.propertyId}_${item.roomId}_${item.itemText}`;
                            if (!this.photos[key]) {
                                this.photos[key] = [];
                            }
                            this.photos[key].push(item);
                        }
                    }
                });
                
                console.log(`✅ Loaded ${results.length} photo sets from IndexedDB`);
                console.log('Profile pictures loaded:', Object.keys(this.profilePictures));
                console.log('Photo keys loaded:', Object.keys(this.photos));
                resolve();
            };
            request.onerror = () => {
                console.warn('⚠️ Could not load photos from IndexedDB');
                this.photos = {};
                this.profilePictures = {};
                resolve();
            };
        });
    } catch (error) {
        console.error('❌ Error loading photos from IndexedDB:', error);
        this.photos = {};
        this.profilePictures = {};
    }
},
    
    // Process captured photo
    async processPhoto(file, roomId, itemText) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        this.compressImage(e.target.result, async (compressedData) => {
            const photoData = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                data: compressedData,
                roomId: roomId,
                itemText: itemText,
                timestamp: new Date().toISOString(),
                fileName: file.name,
                fileSize: compressedData.length * 0.75,
                propertyId: appState.currentProperty?.id
            };
            
            await this.storePhoto(photoData);
            this.updatePhotoPreview(roomId, itemText);
            showSuccess('Photo captured successfully!');
            
            // FIXED: Don't navigate away - stay in assessment
            console.log('📸 Photo processed, staying in assessment');
        });
    };
    
    reader.onerror = () => {
        alert('Error reading photo file');
    };
    
    reader.readAsDataURL(file);
},

    // Enhanced compression with quality control
    compressImage(dataUrl, callback) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Less aggressive compression since we have unlimited storage
            const maxWidth = 800;  // Restored to higher quality
            const maxHeight = 800;
            let { width, height } = img;
            
            // Calculate new dimensions
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress with better quality
            ctx.drawImage(img, 0, 0, width, height);
            
            // Better quality since storage isn't limited
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            callback(compressed);
        };
        
        img.src = dataUrl;
    },
    
    // Store photo ONLY in IndexedDB
    async storePhoto(photoData) {
        try {
            const key = `${photoData.propertyId}_${photoData.roomId}_${photoData.itemText}`;
            
            // Store in memory for immediate access
            if (!this.photos[key]) {
                this.photos[key] = [];
            }
            this.photos[key].push(photoData);
            
            // Store in IndexedDB - this is the permanent storage
            await this.savePhotosToStorage();
            
            // DO NOT store in property object - causes localStorage overflow
            console.log('✅ Photo stored in IndexedDB only');
            
        } catch (error) {
            console.error('❌ Error storing photo:', error);
            throw error;
        }
    },
    
    // Save photos to IndexedDB with proper error handling
	async savePhotosToStorage() {
		try {
			console.log('🔍 SAVING photos - current profilePictures:', Object.keys(this.profilePictures || {}));
			
			const db = await this.initIndexedDB();
			const transaction = db.transaction(['photos'], 'readwrite');
			const store = transaction.objectStore('photos');
			
			// Store each photo individually
			for (const [key, photos] of Object.entries(this.photos)) {
				for (const photo of photos) {
					console.log('🔍 Saving photo with ID:', photo.id);
					await new Promise((resolve, reject) => {
						const request = store.put({
							id: photo.id,
							key: key,
							data: photo.data,
							roomId: photo.roomId,
							itemText: photo.itemText,
							timestamp: photo.timestamp,
							fileName: photo.fileName,
							fileSize: photo.fileSize,
							propertyId: photo.propertyId
						});
						request.onsuccess = () => resolve();
						request.onerror = () => reject(request.error);
					});
				}
			}
			
			console.log('✅ Photos saved to IndexedDB');
			
		} catch (error) {
			console.error('❌ Error saving photos to IndexedDB:', error);
			
			if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
				alert('Phone storage is full! Please free up space on your device and try again.');
				throw new Error('Phone storage full');
			} else {
				alert('Error saving photo. Please try again.');
				throw error;
			}
		}
	},

    // Load photos from IndexedDB
    async loadPhotosFromStorage() {
    try {
        const db = await this.initIndexedDB();
        const transaction = db.transaction(['photos'], 'readonly');
        const store = transaction.objectStore('photos');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const results = request.result;
                
                // Initialize photos (keep existing logic)
                this.photos = {};
                
                // ADDED: Initialize profilePictures if not exists
                if (!this.profilePictures) {
                    this.profilePictures = {};
                }
                
                results.forEach(item => {
                    // ADDED: Handle profile pictures (same logic as loadPhotosFromIndexedDB)
                    if (item.id.startsWith('profile_')) {
                        const propertyId = item.id.replace('profile_', '');
                        if (item.photos && item.photos.length > 0) {
                            this.profilePictures[propertyId] = item.photos[0].data;
                            console.log(`✅ Loaded profile picture for property ${propertyId}`);
                        }
                    } else {
                        // EXISTING: Handle regular photos (unchanged)
                        if (!this.photos[item.key]) {
                            this.photos[item.key] = [];
                        }
                        this.photos[item.key].push(item);
                    }
                });
                
                console.log(`✅ Loaded ${results.length} photos from IndexedDB`);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('❌ Error loading photos from IndexedDB:', error);
        this.photos = {};
        // ADDED: Initialize profilePictures on error too
        if (!this.profilePictures) {
            this.profilePictures = {};
        }
    }
},

    // Initialize IndexedDB with unlimited storage
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('PropertyPhotos', 3);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                console.log('✅ IndexedDB connected successfully');
                resolve(request.result);
            };
            
            request.onupgradeneeded = (event) => {
				const db = event.target.result;
				
				// Delete old stores if exist
				if (db.objectStoreNames.contains('photos')) {
					db.deleteObjectStore('photos');
				}
				if (db.objectStoreNames.contains('assessments')) {
					db.deleteObjectStore('assessments');
				}
				
				// Photos store
				const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
				photoStore.createIndex('propertyId', 'propertyId', { unique: false });
				photoStore.createIndex('key', 'key', { unique: false });
				photoStore.createIndex('timestamp', 'timestamp', { unique: false });
				
				// Assessments store
				const assessmentStore = db.createObjectStore('assessments', { keyPath: 'propertyId' });
				
				console.log('✅ IndexedDB schema updated');
			};
        });
    },
    
    // Get photos for specific room/item
    getPhotos(roomId, itemText) {
        const propertyId = appState.currentProperty?.id;
        const key = `${propertyId}_${roomId}_${itemText}`;
        return this.photos[key] || [];
    },
    
    // Update photo preview thumbnails
updatePhotoPreview(roomId, itemText) {
    const photos = this.getPhotos(roomId, itemText);
    const itemKey = `${roomId}_${itemText.replace(/\s+/g, '_').replace(/[^\w]/g, '')}`;
    const previewContainer = document.getElementById(`photos_${itemKey}`);
    
    if (!previewContainer) {
        // Container doesn't exist yet - this is normal during UI rendering
        return;
    }
    
    // Rest of the existing function stays the same...
    if (photos.length === 0) {
        previewContainer.innerHTML = '<div class="no-photos">No photos yet</div>';
        return;
    }
    
    previewContainer.innerHTML = photos.map((photo, index) => `
        <div class="photo-thumbnail-container">
            <img src="${photo.data}" 
                 class="photo-thumbnail" 
                 onclick="photoManager.viewPhoto('${photo.id}')"
                 title="Taken: ${new Date(photo.timestamp).toLocaleString()}"
                 alt="Property photo ${index + 1}">
            <div class="photo-count">${index + 1}</div>
            <button class="photo-delete-btn-assessment" 
                    onclick="event.stopPropagation(); photoManager.deletePhoto('${photo.id}', '${roomId}', '${itemText}')" 
                    title="Delete photo">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
},
// Add new method for assessment photo deletion  
async deleteAssessmentPhoto(photoId, roomId, itemText) {
    try {
        const propertyId = appState.currentProperty?.id;
        const key = `${propertyId}_${roomId}_${itemText}`;
        
        // Remove from memory
        if (this.photos[key]) {
            this.photos[key] = this.photos[key].filter(photo => photo.id !== photoId);
        }
        
        // Remove from IndexedDB
        const db = await this.initIndexedDB();
        const transaction = db.transaction(['photos'], 'readwrite');
        const store = transaction.objectStore('photos');
        await store.delete(photoId);
        
        // Update preview immediately
        this.updatePhotoPreview(roomId, itemText);
        
        showSuccess('Assessment photo deleted');
        
    } catch (error) {
        console.error('Error deleting assessment photo:', error);
        showModal('Error', 'Failed to delete photo. Please try again.');
    }
},
    
    // Show photo gallery modal
    showPhotoGallery(roomId, itemText) {
        const photos = this.getPhotos(roomId, itemText);
        
        if (photos.length === 0) {
            showModal('No Photos', 'No photos available for this item. Take a photo first!');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'photo-gallery-modal';
        modal.innerHTML = `
            <div class="gallery-header">
                <h3>${itemText}</h3>
                <p>${photos.length} photo(s)</p>
                <button class="close-gallery-btn" onclick="this.closest('.photo-gallery-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="gallery-grid">
                ${photos.map((photo, index) => `
                    <div class="gallery-item">
                        <img src="${photo.data}" 
                             class="gallery-img" 
                             onclick="photoManager.viewPhoto('${photo.id}')"
                             alt="Property photo ${index + 1}">
                        <div class="gallery-info">
                            <span>Photo ${index + 1}</span>
                            <span>${new Date(photo.timestamp).toLocaleString()}</span>
                            <span>Size: ${Math.round(photo.fileSize / 1024)}KB</span>
                        </div>
                        <button class="delete-photo-btn" 
                                onclick="photoManager.deletePhoto('${photo.id}', '${roomId}', '${itemText}'); this.closest('.gallery-item').remove();">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    },
    
    // View individual photo
    viewPhoto(photoId) {
        const photo = this.findPhotoById(photoId);
        if (!photo) return;
        
        const modal = document.createElement('div');
        modal.className = 'photo-view-modal';
        modal.innerHTML = `
            <div class="photo-view-container">
                <button class="close-view-btn" onclick="this.closest('.photo-view-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <img src="${photo.data}" class="photo-view-img" alt="Property photo">
                <div class="photo-view-info">
                    <h4>${photo.itemText}</h4>
                    <p>Room: ${photo.roomId}</p>
                    <p>Taken: ${new Date(photo.timestamp).toLocaleString()}</p>
                    <p>Size: ${Math.round(photo.fileSize / 1024)}KB</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    },
    
    // Find photo by ID
    findPhotoById(photoId) {
        for (const photos of Object.values(this.photos)) {
            const photo = photos.find(p => p.id === photoId);
            if (photo) return photo;
        }
        return null;
    },
    
    // Delete photo from IndexedDB and memory
    async deletePhoto(photoId, roomId, itemText) {
        try {
            const propertyId = appState.currentProperty?.id;
            const key = `${propertyId}_${roomId}_${itemText}`;
            
            // Remove from memory
            if (this.photos[key]) {
                this.photos[key] = this.photos[key].filter(photo => photo.id !== photoId);
            }
            
            // Remove from IndexedDB
            const db = await this.initIndexedDB();
            const transaction = db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            await store.delete(photoId);
            
            // Update preview
            this.updatePhotoPreview(roomId, itemText);
            
            showSuccess('Photo deleted');
            
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert('Error deleting photo');
        }
    },
    
    // Load photos for property (from IndexedDB only)
    async loadPhotosForProperty(property) {
        await this.loadPhotosFromStorage();
    },
    
    // Get total photo count for property
    getTotalPhotoCount() {
        return Object.values(this.photos).reduce((total, photos) => total + photos.length, 0);
    },
    
    // Clear all photos - complete removal
    async clearAllPhotos() {
        try {
            // Clear memory
            this.photos = {};
            
            // Clear IndexedDB
            const db = await this.initIndexedDB();
            const transaction = db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            await store.clear();
            
            console.log('✅ All photos cleared');
            
        } catch (error) {
            console.error('❌ Error clearing photos:', error);
            
            if (error.name === 'QuotaExceededError') {
                alert('Phone storage is full! Cannot clear photos.');
            } else {
                alert('Error clearing photos. Please try again.');
            }
        }
    },

    // Get storage usage info for the phone
   // Get storage usage info for the phone
    async getStorageInfo() {
        try {
            const db = await this.initIndexedDB();
            const transaction = db.transaction(['photos'], 'readonly');
            const store = transaction.objectStore('photos');
            
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => {
                    const photos = request.result;
                    const totalSize = photos.reduce((sum, photo) => sum + (photo.fileSize || 0), 0);
                    resolve({
                        photoCount: photos.length,
                        totalSize: totalSize,
                        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
                        storageType: 'Phone Storage (IndexedDB)',
                        unlimited: true
                    });
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error getting storage info:', error);
            return { 
                photoCount: 0, 
                totalSize: 0, 
                totalSizeMB: '0.00',
                storageType: 'Phone Storage (IndexedDB)',
                unlimited: true,
                error: 'Unable to get storage info'
            };
        }
    },

    // Save assessment data to IndexedDB
    async saveAssessmentsToIndexedDB(properties) {
		try {
			const db = await this.initIndexedDB();
			const transaction = db.transaction(['assessments'], 'readwrite');
			const store = transaction.objectStore('assessments');
			
			for (const property of properties) {
				if (property.assessments || property.roomNotes || property.progress) {
					await new Promise((resolve, reject) => {
						const request = store.put({
							propertyId: property.id,
							assessments: property.assessments || {},
							roomNotes: property.roomNotes || {},
							itemNotes: property.itemNotes || {},
							questionResponses: property.questionResponses || {},
							roomInstances: property.roomInstances || {},
							progress: property.progress || 0
						});
						request.onsuccess = () => resolve();
						request.onerror = () => reject(request.error);
					});
				}
			}
			console.log('✅ Assessments saved to IndexedDB');
		} catch (error) {
			console.error('❌ Error saving assessments:', error);
		}
	},
	
	// Delete every photo belonging to a room instance (memory + IndexedDB)
	async deletePhotosForInstance(propertyId, instanceId) {
		try {
			if (!propertyId || !instanceId) return;
			const prefix = `${propertyId}_${instanceId}_`;
			const exact = `${propertyId}_${instanceId}`;
			const keys = Object.keys(this.photos).filter(k => k === exact || k.startsWith(prefix));
			const photoIds = [];
			keys.forEach(k => {
				(this.photos[k] || []).forEach(p => photoIds.push(p.id));
				delete this.photos[k];
			});
			if (photoIds.length > 0) {
				const db = await this.initIndexedDB();
				const transaction = db.transaction(['photos'], 'readwrite');
				const store = transaction.objectStore('photos');
				photoIds.forEach(id => { try { store.delete(id); } catch (e) {} });
			}
			console.log(`🗑️ Removed ${photoIds.length} photos for instance ${instanceId}`);
		} catch (error) {
			console.error('deletePhotosForInstance error:', error);
		}
	},
	
	// Get photos for a specific property
    getPhotosForProperty(propertyId) {
        if (!propertyId) return [];
        
        const allPhotos = [];
        const photoKeys = Object.keys(this.photos).filter(key => 
            key.startsWith(propertyId + '_')
        );
        
        photoKeys.forEach(key => {
            const [, roomId, ...itemTextParts] = key.split('_');
            const itemText = itemTextParts.join('_');
            const photos = this.photos[key] || [];
            
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
};



// Initialize photo manager when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await photoManager.loadPhotosFromStorage();
        console.log('✅ Photo manager initialized');
    } catch (error) {
        console.error('❌ Photo manager initialization failed:', error);
    }
});

// Export functions for HTML onclick
window.capturePhoto = async (roomId, itemText) => {
    await photoManager.capturePhoto(roomId, itemText);
};
window.showPhotoGallery = photoManager.showPhotoGallery.bind(photoManager);
window.deletePhoto = photoManager.deletePhoto.bind(photoManager);
window.photoManager = photoManager;
window.saveAssessmentsToIndexedDB = photoManager.saveAssessmentsToIndexedDB.bind(photoManager);
window.getPhotosForProperty = photoManager.getPhotosForProperty.bind(photoManager);
window.deleteAssessmentPhoto = photoManager.deleteAssessmentPhoto.bind(photoManager);

// Ensure delete functions are exported