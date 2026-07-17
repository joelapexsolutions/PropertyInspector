// Fixed Property PDF Generator - Robust Loading and Universal Image Support
class PropertyPDFGenerator {
    constructor() {
        this.doc = null;
        this.pageWidth = 210;
        this.pageHeight = 297;
        this.margin = 10;
        this.contentWidth = this.pageWidth - (this.margin * 2);
        this.currentY = 0;
        this.lineHeight = 6;
        
        // Brand colour scheme — matches app design system
        this.colors = {
            navy:    [15, 31, 53],       // #0f1f35  — primary dark navy
            teal:    [6, 214, 160],      // #06D6A0  — brand teal/green
            tealDark:[4, 160, 120],      // darker teal for text on white
            primary: [28, 68, 108],      // #1c446c  — deep blue for headings
            secondary:[100, 120, 140],   // mid grey
            success: [6, 214, 160],      // teal = success
            warning: [241, 143, 1],      // amber
            danger:  [220, 53, 69],      // red
            light:   [245, 248, 251],    // very light blue-grey
            border:  [215, 225, 235],    // soft border
            text:    [33, 44, 56],       // near-black
            white:   [255, 255, 255],
            // grade colours
            excellent:[6, 214, 160],
            good:    [40, 167, 69],
            fair:    [241, 143, 1],
            poor:    [220, 53, 69]
        };
    }

    // Calculate dynamic text height
    calculateTextHeight(text, width, fontSize = 9) {
        if (!text) return 0;
        this.doc.setFontSize(fontSize);
        const lines = this.doc.splitTextToSize(text, width);
        return lines.length * this.lineHeight;
    }

    // Calculate section height based on content
    calculateSectionHeight(section) {
        let totalHeight = 16; // Header height
        
        section.rooms.forEach(room => {
            totalHeight += 12; // Room header
            
            room.items.forEach(item => {
                totalHeight += 10; // Basic item height
                
                if (item.ratingDescription) {
                    const descriptionHeight = this.calculateTextHeight(item.ratingDescription, this.contentWidth - 20, 8);
                    totalHeight += Math.max(12, descriptionHeight + 6);
                }
                
                if (item.issuesRequiringAttention && (item.rating === 'fair' || item.rating === 'poor')) {
                    const issueTextHeight = this.calculateTextHeight(item.issuesRequiringAttention, this.contentWidth - 20, 7);
                    totalHeight += Math.max(15, issueTextHeight + 8);
                }
            });
            
            if (room.notes) {
                const notesHeight = this.calculateTextHeight(room.notes, this.contentWidth - 10, 7);
                totalHeight += Math.max(15, notesHeight + 8);
            }
            
            totalHeight += 5;
        });
        
        return totalHeight;
    }

    async generateReport(property, assessmentType, options = {}) {
        try {
            // Initialize jsPDF - FIXED: Proper initialization
            if (window.jspdf && window.jspdf.jsPDF) {
                this.doc = new window.jspdf.jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4',
                    compress: true
                });
            } else if (window.jsPDF) {
                this.doc = new window.jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4',
                    compress: true
                });
            } else {
                throw new Error('jsPDF library not available');
            }

            // Generate complete report
            const reportData = this.generateCompleteReportData(property, assessmentType, options);
            const scoreData = window.calculatePropertyScore ? 
                window.calculatePropertyScore(property, assessmentType) : null;
            
            const score = scoreData ? scoreData.overall : property.score || 0;
            const grade = this.getScoreGrade(score);

            // Pre-process profile picture: crop gallery nav arrows from edges via canvas
            // The arrows are baked into the stored image pixels — this is the only real fix.
            const rawProfilePic = (window.photoManager && window.photoManager.profilePictures)
                ? window.photoManager.profilePictures[property.id] : null;
            this._croppedProfilePic = rawProfilePic
                ? await this.cropProfilePicture(rawProfilePic)
                : null;

            // Generate PDF sections
            this.renderFixedHeader(property, assessmentType, options);
            this.renderFixedPropertyOverview(property, score, grade);
            this.renderFixedPropertyFeatures(property);

			// FIXED: Conditional page break based on Purchase Guidance setting
			if (options.includePurchaseGuidance) {
				// When Purchase Guidance is included, start Executive Summary on new page
				this.addNewPage();
				this.renderExecutiveSummary(property, score, grade, options, reportData);
				this.renderGuidanceSections(score, grade);
			} else {
				// When Purchase Guidance is excluded, keep Executive Summary on first page
				this.renderExecutiveSummary(property, score, grade, options, reportData);
			}

			// FIXED: Only add new page if we have content to show
			if (reportData && reportData.sections) {
				this.addNewPage();
			}
            
            if (reportData && reportData.sections) {
                this.renderDynamicDetailedResults(reportData);
                this.renderDynamicIssuesSection(reportData);
                this.renderImportantMessage();
            } else {
                console.warn('No report data available, skipping detailed results');
            }
            
            if (options.includePhotos) {
				this.renderPhotosSection(property);
			}

			// Add questions page as the last page
			this.renderQuestionsPage(property, assessmentType);

			// FIXED: Make footer rendering synchronous
			this.renderFooter(options);

            console.log('Complete PDF report generated successfully');
            return this.doc;
        } catch (error) {
            console.error('PDF generation error:', error);
            throw error;
        }
    }

    // Generate complete report data
		generateCompleteReportData(property, assessmentType, options) {
		if (window.generateAssessmentReport) {
			return window.generateAssessmentReport(property, assessmentType, { includePhotos: options.includePhotos });
		}

		const assessments = property.assessments || property.detailedAssessments;
		const roomNotes = property.roomNotes || property.detailedRoomNotes;
		
		if (!assessments) return null;

		const sections = [];
		const categories = window.assessmentCategories;
		
		if (!categories) {
			console.warn('Assessment categories not found, using fallback');
			return null;
		}
		
		categories.forEach(category => {
			const sectionData = {
				name: category.name,
				icon: category.icon,
				color: category.color,
				rooms: []
			};

			category.rooms.forEach(room => {
				// ✅ FIX: Iterate through all assessment instances that match this room
				const roomInstances = Object.keys(assessments).filter(instanceId => 
					instanceId === room.id || instanceId.startsWith(room.id + '_')
				);

				roomInstances.forEach(instanceId => {
					const instanceAssessments = assessments[instanceId];
					if (instanceAssessments && Object.keys(instanceAssessments).length > 0) {
						const roomData = {
							name: room.name,
							icon: room.icon,
							items: [],
							notes: roomNotes && roomNotes[instanceId] ? roomNotes[instanceId] : null
						};

						room.items.forEach(item => {
							const assessment = instanceAssessments[item.text];
							if (assessment) {
								const guidance = this.getCompleteItemGuidance(item.text, assessment.rating);
								
								const itemData = {
									text: item.text,  // ✅ This will now be correct
									rating: assessment.rating,
									ratingDescription: guidance.description,
									issuesRequiringAttention: guidance.issuesRequiringAttention,
									costWeight: item.costWeight || 1.0,
									costCategory: item.costCategory || 'minor',
									note: (property.itemNotes && property.itemNotes[instanceId] && property.itemNotes[instanceId][item.text]) || null
								};
								
								roomData.items.push(itemData);
							}
						});

						if (roomData.items.length > 0) {
							sectionData.rooms.push(roomData);
						}
					}
				});
			});

			if (sectionData.rooms.length > 0) {
				sections.push(sectionData);
			}
		});

		return { sections, property, assessmentType };
	}

    // Get complete item guidance
    getCompleteItemGuidance(itemText, rating) {
		if (window.assessmentGuidance?.getItemGuidanceWithRating) {
			return window.assessmentGuidance.getItemGuidanceWithRating(itemText, rating);
		}
		
		const guidance = window.assessmentGuidance?.itemGuidance?.[itemText];
		if (!guidance) {
			return {
				description: `Item rated as ${rating.toUpperCase()}`,
				issuesRequiringAttention: null
			};
		}

		return {
			description: guidance[rating] || `Item rated as ${rating.toUpperCase()}`,
			issuesRequiringAttention: guidance.issuesRequiringAttention?.[rating] || null
		};
	}

    // FIXED: Home Buyers Guide SA logo with JPG support
    renderPropertyInspectorLogo() {
    try {
        // Android asset path
        this.doc.addImage('file:///android_asset/Images/transparent_logo.png', 'PNG', this.margin, this.pageHeight - 15, 10, 10);
    } catch (error) {
        console.warn('Logo failed, using fallback');
        // Fallback PI circle
        this.doc.setFillColor(...this.colors.navy);
        this.doc.circle(this.margin + 5, this.pageHeight - 10, 5, 'F');
        this.doc.setTextColor(...this.colors.white);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(8);
        this.centerText('PI', this.pageHeight - 8, this.margin + 1, 8);
    }
}

    // FIXED: Crop UI navigation arrows from profile picture edges using canvas
    // Arrows from the app gallery overlay are baked into the stored image data.
    // This crops 9% from left and right edges where the chevron buttons appear.
    cropProfilePicture(imageDataUrl) {
        return new Promise((resolve) => {
            if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
                resolve(null);
                return;
            }
            try {
                const img = new Image();
                img.onload = () => {
                    try {
                        const cropFraction = 0.09; // 9% from each side removes arrow area
                        const cropPx = Math.floor(img.width * cropFraction);
                        const newW = img.width - cropPx * 2;

                        const canvas = document.createElement('canvas');
                        canvas.width = newW;
                        canvas.height = img.height;

                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, newW, img.height);
                        // Shift image left by cropPx so cropped region starts at x=0
                        ctx.drawImage(img, -cropPx, 0, img.width, img.height);

                        resolve(canvas.toDataURL('image/jpeg', 0.92));
                    } catch (e) {
                        console.warn('Profile pic crop failed, using original:', e);
                        resolve(imageDataUrl);
                    }
                };
                img.onerror = () => {
                    console.warn('Profile pic load failed for crop, using original');
                    resolve(imageDataUrl);
                };
                img.src = imageDataUrl;
            } catch (e) {
                console.warn('cropProfilePicture error:', e);
                resolve(imageDataUrl);
            }
        });
    }

    // FIXED: Universal image format support
    async convertImageToFormat(imageDataUrl, targetFormat = 'JPEG') {
        return new Promise((resolve) => {
            if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
                resolve(null);
                return;
            }

            try {
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = img.width;
                        canvas.height = img.height;
                        
                        // Fill white background for transparency
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        ctx.drawImage(img, 0, 0);
                        
                        // Convert to target format
                        const convertedDataUrl = canvas.toDataURL(`image/${targetFormat.toLowerCase()}`, 0.9);
                        resolve(convertedDataUrl);
                    } catch (error) {
                        console.warn('Image conversion failed:', error);
                        resolve(imageDataUrl); // Return original if conversion fails
                    }
                };
                
                img.onerror = () => {
                    console.warn('Image loading failed');
                    resolve(null);
                };
                
                img.src = imageDataUrl;
            } catch (error) {
                console.warn('Image processing error:', error);
                resolve(null);
            }
        });
    }

    // FIXED: Robust footer rendering (synchronous)
    renderFooter(options) {
        const pageCount = this.doc.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);

            // Footer band
            this.doc.setFillColor(...this.colors.navy);
            this.doc.rect(0, this.pageHeight - 14, this.pageWidth, 14, 'F');

            // Teal top accent
            this.doc.setFillColor(...this.colors.teal);
            this.doc.rect(0, this.pageHeight - 14, this.pageWidth, 1.5, 'F');

            // App icon
            try {
                this.doc.addImage('file:///android_asset/Images/transparent_logo.png', 'PNG',
                    this.margin, this.pageHeight - 11.5, 7, 7);
            } catch (e) {
                this.doc.setFillColor(...this.colors.teal);
                this.doc.circle(this.margin + 3.5, this.pageHeight - 8, 3.5, 'F');
            }

            // App name + tagline
            this.doc.setTextColor(...this.colors.white);
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(7.5);
            this.doc.text('Home Buyers Guide SA', this.margin + 10, this.pageHeight - 9);

            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(6);
            this.doc.setTextColor(...this.colors.teal);
            this.doc.text('Know Before You Buy', this.margin + 10, this.pageHeight - 4.5);

            // Generated date — centre
            this.doc.setTextColor(140, 170, 195);
            this.doc.setFontSize(6);
            this.centerText('Generated: ' + new Date().toLocaleDateString('en-ZA'), this.pageHeight - 6, 0, this.pageWidth);

            // Inspector name — right of centre, before page number
            if (options.inspectorName) {
                this.doc.setTextColor(...this.colors.white);
                this.doc.setFont('helvetica', 'normal');
                this.doc.setFontSize(7);
                const nameW = this.doc.getTextWidth(options.inspectorName);
                this.doc.text(options.inspectorName, this.pageWidth - this.margin - nameW - 18, this.pageHeight - 9);
                this.doc.setFontSize(5.5);
                this.doc.setTextColor(140, 170, 195);
                const lblW = this.doc.getTextWidth('Inspector');
                this.doc.text('Inspector', this.pageWidth - this.margin - lblW - 18, this.pageHeight - 5);
            }

            // Page number — plain white text, bottom-right
            this.doc.setTextColor(...this.colors.white);
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(7);
            const pageText = i + ' / ' + pageCount;
            const pageTextW = this.doc.getTextWidth(pageText);
            this.doc.text(pageText, this.pageWidth - this.margin - pageTextW, this.pageHeight - 6);
        }
    }

    // FIXED: Safe image addition with format conversion
    addImageSafely(imageData, x, y, width, height) {
        try {
            if (!imageData) return;
            
            // Detect format and convert if needed
            let format = 'JPEG';
            if (imageData.includes('data:image/png')) format = 'PNG';
            else if (imageData.includes('data:image/gif')) format = 'JPEG';
            else if (imageData.includes('data:image/webp')) format = 'JPEG';
            else if (imageData.includes('data:image/bmp')) format = 'JPEG';
            
            this.doc.addImage(imageData, format, x, y, width, height);
        } catch (error) {
            console.warn('Image addition failed, using fallback:', error);
            this.renderCompanyLogoFallback(x, y);
        }
    }

    renderCompanyLogoFallback(x, y) {
        this.doc.setFillColor(...this.colors.secondary);
        this.doc.circle(x + 5, y + 5, 5, 'F');
        
        this.doc.setTextColor(...this.colors.white);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(6);
        this.centerText('CO', y + 7, x + 1, 8);
    }

    // All other methods remain the same as in your original file...
    // [Include all the other methods from your original pdf-report-generator.js]
    
    renderFixedHeader(property, assessmentType, options) {
        // Full-width navy cover band
        this.doc.setFillColor(...this.colors.navy);
        this.doc.rect(0, 0, this.pageWidth, 58, 'F');

        // Top teal accent stripe
        this.doc.setFillColor(...this.colors.teal);
        this.doc.rect(0, 0, this.pageWidth, 2.5, 'F');

        // App banner image (white logo on transparent/dark bg)
        try {
            this.doc.addImage('file:///android_asset/Images/app_banner.png', 'PNG',
                this.margin, 6, this.contentWidth, 18);
        } catch (e) {
            // Fallback text logo
            this.doc.setTextColor(...this.colors.white);
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(18);
            this.centerText('HOME BUYERS GUIDE SA', 18);
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(8);
            this.doc.setTextColor(...this.colors.teal);
            this.centerText('Know Before You Buy', 25);
        }

        // Teal divider below banner
        this.doc.setDrawColor(...this.colors.teal);
        this.doc.setLineWidth(0.4);
        this.doc.line(this.margin, 27, this.pageWidth - this.margin, 27);

        // Report type label + custom title
        this.doc.setTextColor(...this.colors.white);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);
        const reportLabel = (options.reportTitle && options.reportTitle !== 'Property Assessment Report')
            ? options.reportTitle
            : 'Property Assessment Report';
        this.centerText(reportLabel, 34);

        // Meta strip — date | type | address
        this.doc.setFontSize(7);
        this.doc.setTextColor(160, 200, 230);
        const col1 = this.margin;
        const col2 = this.margin + (this.contentWidth / 3);
        const col3 = this.margin + (2 * this.contentWidth / 3);
        this.doc.text('Date: ' + new Date().toLocaleDateString('en-ZA'), col1, 44);
        this.doc.text('Type: Full Property Assessment', col2, 44);
        this.doc.text('Property: ' + this.truncateText(property.address || 'Address', 28), col3, 44);

        // Bottom teal accent
        this.doc.setFillColor(...this.colors.teal);
        this.doc.rect(0, 55, this.pageWidth, 3, 'F');

        this.currentY = 65;
    }

    renderFixedPropertyOverview(property, score, grade) {
        // Use pre-cropped image (arrows stripped) if available; fall back to raw
        const profilePic = (this._croppedProfilePic != null)
            ? this._croppedProfilePic
            : (window.photoManager && window.photoManager.profilePictures
                ? window.photoManager.profilePictures[property.id] : null);

        // Outer card — no border, clean white background only
        const cardH = 62;
        this.doc.setFillColor(...this.colors.white);
        this.doc.setDrawColor(...this.colors.border);
        this.doc.setLineWidth(0.3);
        this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, cardH, 3, 3, 'FD');

        // --- PHOTO (left column, larger) ---
        const picX = this.margin + 4;
        const picY = this.currentY + 7;
        const picW = 62;
        const picH = 38;

        if (profilePic) {
            try {
                // Rounded container
                this.doc.setFillColor(...this.colors.light);
                this.doc.setDrawColor(...this.colors.border);
                this.doc.setLineWidth(0.3);
                this.doc.roundedRect(picX, picY, picW, picH, 2, 2, 'FD');
                // Image fills container — arrows already removed by cropProfilePicture()
                this.addImageSafely(profilePic, picX, picY, picW, picH);
                // Redraw border on top so it sits cleanly over the image edges
                this.doc.setDrawColor(...this.colors.border);
                this.doc.setLineWidth(0.3);
                this.doc.roundedRect(picX, picY, picW, picH, 2, 2, 'D');
            } catch (e) {
                this.renderPhotoPlaceholder(picX, picY, picW, picH);
            }
        } else {
            this.renderPhotoPlaceholder(picX, picY, picW, picH);
        }

        // --- PROPERTY INFO (centre column) ---
        const infoX = picX + picW + 6;
        const infoY = this.currentY + 8;
        // Reserve 42mm on right for score badge
        const infoW = this.contentWidth - picW - 50;

        // Address
        this.doc.setTextColor(...this.colors.navy);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(13);
        const addressLines = this.doc.splitTextToSize(property.address || 'Property Address', infoW);
        this.doc.text(addressLines, infoX, infoY);
        let dy = infoY + (addressLines.length * 6.5);

        // Suburb
        if (property.suburb) {
            this.doc.setTextColor(...this.colors.secondary);
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(8.5);
            const suburb = property.suburb + (property.complexName ? ', ' + property.complexName : '');
            this.doc.text(this.truncateText(suburb, 38), infoX, dy);
            dy += 6;
        }

        // Price
        if (property.price) {
            this.doc.setTextColor(...this.colors.tealDark);
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(12);
            this.doc.text('R ' + property.price.replace(/\B(?=(\d{3})+(?!\d))/g, ' '), infoX, dy);
            dy += 7;
        }

        // Specs — inline text (not chips), saves width
        const specs = [];
        if (property.bedrooms) specs.push(property.bedrooms + ' Beds');
        if (property.bathrooms) specs.push(property.bathrooms + ' Baths');
        if (property.parking) specs.push(property.parking + ' Parking');
        if (property.size) specs.push(property.size + 'm²');

        if (specs.length) {
            this.doc.setTextColor(...this.colors.secondary);
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(8);
            this.doc.text(specs.join('  ·  '), infoX, dy);
        }

        // --- SCORE BADGE (right column, elegant design) ---
        const badgeW = 36;
        const badgeH = 48;
        const badgeX = this.pageWidth - this.margin - badgeW - 4;
        const badgeY = this.currentY + 8;

        // Outer coloured ring (slightly larger rounded rect)
        this.doc.setFillColor(...grade.colorRGB);
        this.doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 4, 4, 'F');

        // Inner white card (inset 2mm, creates a clean ring border effect)
        this.doc.setFillColor(255, 255, 255);
        this.doc.roundedRect(badgeX + 2, badgeY + 2, badgeW - 4, badgeH - 4, 3, 3, 'F');

        // Score number — large, in grade colour
        this.doc.setTextColor(...grade.colorRGB);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(18);
        this.centerText(score + '%', badgeY + 17, badgeX, badgeW);

        // Thin separator line
        this.doc.setDrawColor(...this.colors.border);
        this.doc.setLineWidth(0.3);
        this.doc.line(badgeX + 6, badgeY + 22, badgeX + badgeW - 6, badgeY + 22);
        this.doc.setLineWidth(0.5);

        // Grade label — in grade colour, small caps
        this.doc.setTextColor(...grade.colorRGB);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(7.5);
        this.centerText(grade.shortLabel || grade.label, badgeY + 28, badgeX, badgeW);

        // Property type — subtle grey
        this.doc.setTextColor(...this.colors.secondary);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(6);
        this.centerText(property.type === 'complex' ? 'Sectional Title' : 'Freehold', badgeY + 34, badgeX, badgeW);

        this.currentY += cardH + 6;
    }

    renderFixedPropertyFeatures(property) {
        this.currentY += 8;

        // Section heading
        this.doc.setTextColor(...this.colors.navy);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(13);
        this.doc.text('Property Features & Details', this.margin, this.currentY);


        this.currentY += 10;

        const allFeatures = this.getAllPropertyFeatures(property);
        const columnWidth = (this.contentWidth - 10) / 3;

        const featureGroups = [
            { title: 'Internal Features', items: allFeatures.internal },
            { title: 'External Features', items: allFeatures.external },
            { title: 'Other Features',   items: allFeatures.other   }
        ];

        const startY = this.currentY;
        const maxItems = Math.max(
            featureGroups[0].items.length,
            featureGroups[1].items.length,
            featureGroups[2].items.length
        );
        const rowH = 6;
        const boxH = Math.max(28, 14 + maxItems * rowH);

        featureGroups.forEach((group, i) => {
            const x = this.margin + i * (columnWidth + 5);

            // Card background
            this.doc.setFillColor(...this.colors.light);
            this.doc.setDrawColor(...this.colors.border);
            this.doc.roundedRect(x, startY, columnWidth, boxH, 2, 2, 'FD');

            // Header band
            this.doc.setFillColor(...this.colors.navy);
            this.doc.roundedRect(x, startY, columnWidth, 10, 2, 2, 'F');
            // Cover bottom corners of header
            this.doc.rect(x, startY + 6, columnWidth, 4, 'F');

            this.doc.setTextColor(...this.colors.white);
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(7.5);
            this.doc.text(group.title.toUpperCase(), x + 4, startY + 7);

            let itemY = startY + 16;
            if (group.items.length === 0) {
                this.doc.setTextColor(...this.colors.secondary);
                this.doc.setFont('helvetica', 'italic');
                this.doc.setFontSize(7.5);
                this.doc.text('None specified', x + 4, itemY);
            } else {
                group.items.slice(0, 8).forEach(item => {
                    this.doc.setTextColor(...this.colors.teal);
                    this.doc.setFontSize(7);
                    this.doc.text('•', x + 4, itemY);
                    this.doc.setTextColor(...this.colors.text);
                    this.doc.setFont('helvetica', 'normal');
                    this.doc.setFontSize(7.5);
                    const label = item.quantity && item.quantity > 1
                        ? item.name + ' (' + item.quantity + ')'
                        : item.name;
                    this.doc.text(this.truncateText(label, 22), x + 8, itemY);
                    itemY += rowH;
                });
            }
        });

        this.currentY = startY + boxH + 8;
    }

    renderExecutiveSummary(property, score, grade, options, reportData = null) {
        // Section heading
        this.doc.setTextColor(...this.colors.navy);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(13);
        this.doc.text('Executive Summary', this.margin, this.currentY);
        this.currentY += 10;

        const detailedGuidance = this.getDetailedScoreGuidance(score);

        // Set font to body size BEFORE splitTextToSize so wrapping is calculated correctly
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(9);
        const descriptionLines = this.doc.splitTextToSize(detailedGuidance.description, this.contentWidth - 10);
        const descH = descriptionLines.length * 5.5;
        const summaryHeight = Math.max(28, descH + 18);

        // Main summary card
        this.doc.setFillColor(...this.colors.light);
        this.doc.setDrawColor(...this.colors.border);
        this.doc.setLineWidth(0.4);
        this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, summaryHeight, 3, 3, 'FD');
        this.doc.setLineWidth(0.5);

        // Grade label + score
        this.doc.setTextColor(...grade.colorRGB);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(13);
        this.doc.text(detailedGuidance.title + ' — ' + score + '/100', this.margin + 5, this.currentY + 9);

        // Description
        this.doc.setTextColor(...this.colors.text);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(9);
        this.doc.text(descriptionLines, this.margin + 5, this.currentY + 16);

        this.currentY += summaryHeight + 4;

        // Implications (only if purchase guidance enabled)
        if (options.includePurchaseGuidance) {
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(8.5);
            const implLines = this.doc.splitTextToSize(detailedGuidance.implications, this.contentWidth - 10);
            const implH = Math.max(18, implLines.length * 5.5 + 12);

            this.doc.setFillColor(...this.colors.white);
            this.doc.setDrawColor(...this.colors.border);
            this.doc.setLineWidth(0.4);
            this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, implH, 3, 3, 'FD');
            this.doc.setLineWidth(0.5);


            this.doc.setTextColor(...this.colors.tealDark);
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(9);
            this.doc.text('Implications', this.margin + 5, this.currentY + 8);

            this.doc.setTextColor(...this.colors.text);
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(8.5);
            this.doc.text(implLines, this.margin + 5, this.currentY + 14);

            this.currentY += implH + 5;
        }

        // Poor-rated items summary — only if there are any
        if (reportData && reportData.sections) {
            const poorItems = [];
            for (const section of reportData.sections) {
                for (const room of section.rooms) {
                    for (const item of room.items) {
                        if (item.rating === 'poor') {
                            poorItems.push({ section: section.name, room: room.name, item: item.text });
                        }
                    }
                }
            }

            if (poorItems.length > 0) {
                if (this.currentY > this.pageHeight - 20) this.addNewPage();

                const rowH = 6;
                const boxH = 14 + poorItems.length * rowH;

                this.doc.setFillColor(255, 240, 240);
                this.doc.setDrawColor(...this.colors.danger);
                this.doc.setLineWidth(0.4);
                this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, boxH, 3, 3, 'FD');
                this.doc.setLineWidth(0.5);

                // Header
                this.doc.setTextColor(...this.colors.danger);
                this.doc.setFont('helvetica', 'bold');
                this.doc.setFontSize(9);
                this.doc.text(`Poor Ratings (${poorItems.length})`, this.margin + 5, this.currentY + 8);

                // List items
                let itemY = this.currentY + 13;
                poorItems.forEach(pi => {
                    // Filled square bullet in danger colour (reliable across all jsPDF font sets)
                    this.doc.setFillColor(...this.colors.danger);
                    this.doc.rect(this.margin + 5, itemY - 1.8, 2, 2, 'F');
                    this.doc.setTextColor(...this.colors.text);
                    this.doc.setFont('helvetica', 'normal');
                    this.doc.setFontSize(7.5);
                    const label = `${pi.room} — ${this.truncateText(pi.item, 60)}`;
                    this.doc.text(label, this.margin + 9, itemY);
                    itemY += rowH;
                });

                this.currentY += boxH + 5;
            }
        }
    }

    renderGuidanceSections(score, grade) {
        const detailedGuidance = this.getDetailedScoreGuidance(score);
        const guidanceSections = [
            { title: 'Purchase Recommendation', content: detailedGuidance.buyerAdvice,         icon: '★' },
            { title: 'Budget Considerations',   content: detailedGuidance.budgetConsiderations, icon: 'R' },
            { title: 'Negotiation Strategy',    content: detailedGuidance.negotiationAdvice,    icon: '↕' }
        ];

        guidanceSections.forEach((section) => {
            if (this.currentY > this.pageHeight - 20) this.addNewPage();

            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(8.5);
            const contentLines = this.doc.splitTextToSize(section.content, this.contentWidth - 10);
            const sectionHeight = Math.max(22, contentLines.length * 5.5 + 16);

            // Clean white card, subtle border
            this.doc.setFillColor(...this.colors.white);
            this.doc.setDrawColor(...this.colors.border);
            this.doc.setLineWidth(0.4);
            this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, sectionHeight, 3, 3, 'FD');
            this.doc.setLineWidth(0.5);


            // Section title in navy
            this.doc.setTextColor(...this.colors.navy);
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(9);
            this.doc.text(section.title, this.margin + 5, this.currentY + 8);

            // Content in body text colour
            this.doc.setTextColor(...this.colors.text);
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(8.5);
            this.doc.text(contentLines, this.margin + 5, this.currentY + 14);

            this.currentY += sectionHeight + 5;
        });
    }
    renderDynamicDetailedResults(reportData) {
        if (!reportData || !reportData.sections) return;

        // Section heading
        this.doc.setTextColor(...this.colors.navy);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(13);
        this.doc.text('Detailed Assessment Results', this.margin, this.currentY);
        this.currentY += 12;

        for (const section of reportData.sections) {
            for (const room of section.rooms) {
                const estimatedSectionHeight = this.calculateSectionHeight({rooms: [room]});
                if (this.currentY + estimatedSectionHeight > this.pageHeight - 20) {
                    this.addNewPage();
                }

                // Room header — full navy band, no left bar
                this.doc.setFillColor(...this.colors.navy);
                this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 12, 2, 2, 'F');

                this.doc.setTextColor(...this.colors.white);
                this.doc.setFont('helvetica', 'bold');
                this.doc.setFontSize(10);
                this.doc.text(room.name + ' Assessment', this.margin + 8, this.currentY + 8);

                const overallGrade = this.calculateRoomGrade(room.items);
                const summaryText = room.items.length + ' items assessed — Overall: ' + overallGrade;
                this.doc.setFontSize(8);
                this.doc.setFont('helvetica', 'normal');
                this.doc.setTextColor(...this.colors.teal);
                const summaryWidth = this.doc.getTextWidth(summaryText);
                this.doc.text(summaryText, this.pageWidth - this.margin - summaryWidth - 5, this.currentY + 8);

                this.currentY += 14;



                let itemsHeight = 0;
                room.items.forEach(item => {
                    // Must exactly match renderDynamicAssessmentItem's itemHeight logic
                    let ih = 11;
                    if (item.ratingDescription) {
                        const dh = this.calculateTextHeight(item.ratingDescription, this.contentWidth - 24, 8);
                        ih += Math.max(10, dh + 5);
                    }
                    if (item.issuesRequiringAttention && (item.rating === 'fair' || item.rating === 'poor')) {
                        const issH = this.calculateTextHeight(item.issuesRequiringAttention, this.contentWidth - 28, 7.5);
                        ih += Math.max(14, issH + 10) + 3;
                    }
                    if (item.note) {
                        const noteH = this.calculateTextHeight(item.note, this.contentWidth - 28, 7.5);
                        ih += Math.max(14, noteH + 10) + 3;
                    }
                    itemsHeight += ih;
                });

                this.doc.setFillColor(...this.colors.white);
                this.doc.setDrawColor(...this.colors.border);
                this.doc.setLineWidth(0.3);
                this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, itemsHeight + 8, 2, 2, 'FD');
                this.doc.setLineWidth(0.5);

                this.currentY += 3;

                room.items.forEach((item, itemIndex) => {
                    this.renderDynamicAssessmentItem(item, itemIndex);
                });

                this.currentY += 7;

                if (room.notes) {
                    this.renderDynamicRoomNotes(room.notes);
                }

                this.currentY += 6;
            }
        }
    }

    renderDynamicAssessmentItem(item, itemIndex) {
        let itemHeight = 11;
        let descriptionHeight = 0;
        let issuesHeight = 0;
        let noteHeight = 0;

        if (item.ratingDescription) {
            descriptionHeight = this.calculateTextHeight(item.ratingDescription, this.contentWidth - 24, 8);
            itemHeight += Math.max(10, descriptionHeight + 5);
        }

        if (item.issuesRequiringAttention && (item.rating === 'fair' || item.rating === 'poor')) {
            issuesHeight = this.calculateTextHeight(item.issuesRequiringAttention, this.contentWidth - 28, 7.5);
            itemHeight += Math.max(14, issuesHeight + 10);
        }

        if (item.note) {
            noteHeight = this.calculateTextHeight(item.note, this.contentWidth - 28, 7.5);
            itemHeight += Math.max(14, noteHeight + 10);
        }

        // Thin top divider
        this.doc.setDrawColor(...this.colors.border);
        this.doc.setLineWidth(0.3);
        this.doc.line(this.margin + 2, this.currentY, this.pageWidth - this.margin - 2, this.currentY);
        this.doc.setLineWidth(0.5);

        // Item name
        this.doc.setTextColor(...this.colors.text);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(8.5);
        const itemText = this.truncateText(item.text, 65);
        this.doc.text(itemText, this.margin + 6, this.currentY + 7);

        // Rating pill badge
        const ratingColor = this.getRatingColor(item.rating);
        const badgeW = 18;
        const badgeX = this.pageWidth - this.margin - badgeW - 2;
        this.doc.setFillColor(...ratingColor);
        this.doc.roundedRect(badgeX, this.currentY + 2, badgeW, 7, 2, 2, 'F');
        this.doc.setTextColor(...this.colors.white);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(6.5);
        this.centerText(item.rating.toUpperCase(), this.currentY + 6.5, badgeX, badgeW);

        this.currentY += 11;

        // Rating description
        if (item.ratingDescription) {
            this.doc.setTextColor(...this.colors.secondary);
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(8);
            const descLines = this.doc.splitTextToSize(item.ratingDescription, this.contentWidth - 24);
            this.doc.text(descLines, this.margin + 8, this.currentY + 1);
            this.currentY += Math.max(10, descriptionHeight + 5);
        }

        // Attention required box
        if (item.issuesRequiringAttention && (item.rating === 'fair' || item.rating === 'poor')) {
            const issueText = item.issuesRequiringAttention;
            const containerHeight = Math.max(14, issuesHeight + 10);

            this.doc.setFillColor(255, 246, 246);
            this.doc.setDrawColor(220, 53, 69);
            this.doc.setLineWidth(0.4);
            this.doc.roundedRect(this.margin + 6, this.currentY, this.contentWidth - 12, containerHeight, 2, 2, 'FD');
            this.doc.setLineWidth(0.5);

            this.doc.setTextColor(...this.colors.danger);
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(7);
            this.doc.text('Worth Checking', this.margin + 12, this.currentY + 5);

            this.doc.setTextColor(...this.colors.text);
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(7.5);
            const issueLines = this.doc.splitTextToSize(issueText, this.contentWidth - 24);
            this.doc.text(issueLines, this.margin + 12, this.currentY + 9);

            this.currentY += containerHeight + 3;
        }

        // Buyer's note for this item
        if (item.note) {
            const noteContainerHeight = Math.max(14, noteHeight + 10);

            this.doc.setFillColor(240, 250, 246);
            this.doc.setDrawColor(29, 158, 117);
            this.doc.setLineWidth(0.4);
            this.doc.roundedRect(this.margin + 6, this.currentY, this.contentWidth - 12, noteContainerHeight, 2, 2, 'FD');
            this.doc.setLineWidth(0.5);

            this.doc.setTextColor(29, 158, 117);
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(7);
            this.doc.text('Your Note', this.margin + 12, this.currentY + 5);

            this.doc.setTextColor(...this.colors.text);
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(7.5);
            const noteLines = this.doc.splitTextToSize(item.note, this.contentWidth - 24);
            this.doc.text(noteLines, this.margin + 12, this.currentY + 9);

            this.currentY += noteContainerHeight + 3;
        }
    }

    renderDynamicRoomNotes(notes) {
        if (!notes) return;

        const notesLines = this.doc.splitTextToSize(notes, this.contentWidth - 10);
        const containerHeight = Math.max(14, notesLines.length * 4.5 + 12);

        this.doc.setFillColor(240, 250, 247);
        this.doc.setDrawColor(...this.colors.teal);
        this.doc.setLineWidth(0.3);
        this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, containerHeight, 2, 2, 'FD');


        this.doc.setTextColor(...this.colors.tealDark);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(7.5);
        this.doc.text('Inspector Notes:', this.margin + 6, this.currentY + 6);

        this.doc.setTextColor(...this.colors.text);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(7.5);
        this.doc.text(notesLines, this.margin + 6, this.currentY + 10.5);

        this.currentY += containerHeight + 3;
    }

    renderDynamicIssuesSection(reportData) {
        const allIssues = this.collectHighPriorityIssues(reportData);
        if (allIssues.length === 0) return;

        this.addNewPage();

        this.doc.setTextColor(...this.colors.navy);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(13);
        this.doc.text('Issues Requiring Attention', this.margin, this.currentY);

        this.currentY += 12;

        // Issue count summary pill
        this.doc.setFillColor(255, 240, 240);
        this.doc.setDrawColor(...this.colors.danger);
        this.doc.setLineWidth(0.4);
        this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 10, 2, 2, 'FD');
        this.doc.setLineWidth(0.5);

        this.doc.setTextColor(...this.colors.danger);
		this.doc.setFont('helvetica', 'bold');
		this.doc.setFontSize(8.5);
		const summaryText = allIssues.length + ' issue' + (allIssues.length === 1 ? '' : 's') + ' identified requiring attention.';
		this.doc.text(summaryText, this.margin + 6, this.currentY + 7);

		this.currentY += 16;

		// Add issues introduction text
		this.doc.setTextColor(...this.colors.text);
		this.doc.setFont('helvetica', 'normal');
		this.doc.setFontSize(9);
		const introText = 'The following issues should be assessed by qualified professionals as they could involve significant repair costs. Prioritize these when planning your budget and negotiations.';
		const introLines = this.doc.splitTextToSize(introText, this.contentWidth - 10);
		const introHeight = introLines.length * this.lineHeight + 10;

		this.doc.setFillColor(...this.colors.light);
		this.doc.setDrawColor(...this.colors.border);
		this.doc.setLineWidth(0.3);
		this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, introHeight, 2, 2, 'FD');
		this.doc.setLineWidth(0.5);

		this.doc.text(introLines, this.margin + 5, this.currentY + 6);
		this.currentY += introHeight + 10;

        allIssues.forEach((issue, index) => {
            this.renderDynamicIssueItem(issue, index);
        });
    }

    renderDynamicIssueItem(issue, index) {
        const issueLines = this.doc.splitTextToSize(issue.issue || '', this.contentWidth - 24);
        const containerHeight = Math.max(26, issueLines.length * 5 + 20);

        if (this.currentY + containerHeight > this.pageHeight - 20) this.addNewPage();

        const priorityColor = issue.priority === 'critical' ? this.colors.danger : this.colors.warning;

        // Card — clean, no left bar
        this.doc.setFillColor(...this.colors.white);
        this.doc.setDrawColor(...this.colors.border);
        this.doc.setLineWidth(0.4);
        this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, containerHeight, 3, 3, 'FD');
        this.doc.setLineWidth(0.5);

        // Priority badge (top-left)
        const badgeW = 18;
        this.doc.setFillColor(...priorityColor);
        this.doc.roundedRect(this.margin + 6, this.currentY + 3, badgeW, 7, 2, 2, 'F');
        this.doc.setTextColor(...this.colors.white);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(6.5);
        this.centerText(issue.priority.toUpperCase(), this.currentY + 7.5, this.margin + 6, badgeW);

        // Issue number (top-right)
        this.doc.setTextColor(...this.colors.secondary);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(9);
        const numW = this.doc.getTextWidth(String(index + 1));
        this.doc.text(String(index + 1), this.pageWidth - this.margin - numW - 4, this.currentY + 9);

        // Section > Room breadcrumb
        this.doc.setTextColor(...this.colors.tealDark);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(7.5);
        this.doc.text(issue.section + ' — ' + issue.room, this.margin + 6, this.currentY + 14);

        // Item name
        this.doc.setTextColor(...this.colors.navy);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(9);
        this.doc.text(this.truncateText(issue.item, 55), this.margin + 6, this.currentY + 20);

        // Issue description
        this.doc.setTextColor(...this.colors.text);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(7.5);
        this.doc.text(issueLines, this.margin + 8, this.currentY + 25);

        this.currentY += containerHeight + 5;
    }

    renderImportantMessage() {
        if (this.currentY > this.pageHeight - 20) this.addNewPage();
        this.currentY += 8;

        const importantText = 'Cost estimates are based on typical South African market rates and may vary significantly based on specific circumstances, material choices, and local service providers. Always obtain professional quotes before making decisions.';
        const lines = this.doc.splitTextToSize(importantText, this.contentWidth - 10);
        const boxH = Math.max(24, lines.length * 5 + 18);

        this.doc.setFillColor(240, 250, 247);
        this.doc.setDrawColor(...this.colors.teal);
        this.doc.setLineWidth(0.4);
        this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, boxH, 3, 3, 'FD');
        this.doc.setLineWidth(0.5);


        this.doc.setTextColor(...this.colors.tealDark);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(9);
        this.doc.text('Important Information', this.margin + 5, this.currentY + 8);

        this.doc.setTextColor(...this.colors.text);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(8);
        this.doc.text(lines, this.margin + 5, this.currentY + 14);

        this.currentY += boxH + 6;
    }
	
	renderQuestionsPage(property, assessmentType) {
		const propertyType = property.type === 'complex' ? 'complex' : 'house';
		const questionsData = window.importantQuestions;
		const questionResponses = property.questionResponses || property.detailedQuestionResponses;
		
		if (!questionsData || !questionsData[propertyType]) {
			return;
		}
		
		const questions = questionsData[propertyType];
		if (questions.length === 0) return;
		
		this.addNewPage();
		
		// Page header
		this.doc.setTextColor(...this.colors.navy);
		this.doc.setFont('helvetica', 'bold');
		this.doc.setFontSize(13);
		this.doc.text('Assessment Questions & Responses', this.margin, this.currentY);

		
		this.currentY += 20;
		
		// Render each question
		questions.forEach((question, index) => {
			const response = questionResponses ? questionResponses[question.id] : null;
			this.renderQuestionContainer(question, response, index + 1, property);
		});
	}

	renderQuestionContainer(question, response, questionNumber, property) {
		// Get notes for this question
		const questionNotes = property.detailedQuestionNotes && property.detailedQuestionNotes[question.id];
		
		// Calculate container height
		const questionHeight = this.calculateTextHeight(question.question, this.contentWidth - 16, 9);
		const infoHeight = this.calculateTextHeight(question.info, this.contentWidth - 16, 7);
		
		// Combine response and notes for height calculation
		let responseText = '';
		if (response && response.trim()) {
			responseText = response.trim();
		}
		if (questionNotes && questionNotes.trim()) {
			responseText += (responseText ? ' ' : '') + questionNotes.trim();
		}
		
		const responseHeight = responseText ? this.calculateTextHeight(responseText, this.contentWidth - 16, 8) : 15;
		const containerHeight = Math.max(30, questionHeight + infoHeight + responseHeight + 20);
		
		// Check if we need a new page
		if (this.currentY + containerHeight > this.pageHeight - 20) {
			this.addNewPage();
		}
		
		// Main container
		this.doc.setFillColor(...this.colors.white);
		this.doc.setDrawColor(...this.colors.border);
		this.doc.setLineWidth(0.3);
		this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, containerHeight, 2, 2, 'FD');
		this.doc.setLineWidth(0.5);
		
		// Question header
		this.doc.setFillColor(...this.colors.navy);
		this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 10, 2, 2, 'F');
		// Cover bottom corners of header band
		this.doc.rect(this.margin, this.currentY + 6, this.contentWidth, 4, 'F');
		
		// Question number
		this.doc.setTextColor(...this.colors.white);
		this.doc.setFont('helvetica', 'bold');
		this.doc.setFontSize(9);
		this.doc.text(`Question ${questionNumber}`, this.margin + 5, this.currentY + 7);
		
		let contentY = this.currentY + 15;
		
		// Question text
		this.doc.setTextColor(...this.colors.text);
		this.doc.setFont('helvetica', 'bold');
		this.doc.setFontSize(9);
		const questionLines = this.doc.splitTextToSize(question.question, this.contentWidth - 16);
		this.doc.text(questionLines, this.margin + 5, contentY);
		contentY += questionLines.length * 4 + 2;
		
		// Question info
		this.doc.setTextColor(...this.colors.secondary);
		this.doc.setFont('helvetica', 'italic');
		this.doc.setFontSize(7);
		const infoLines = this.doc.splitTextToSize(question.info, this.contentWidth - 16);
		this.doc.text(infoLines, this.margin + 5, contentY);
		contentY += infoLines.length * 3 + 8;
		
		// Response section with inline notes
		this.doc.setTextColor(...this.colors.navy);
		this.doc.setFont('helvetica', 'bold');
		this.doc.setFontSize(8);
		
		if (responseText) {
			// Show "RESPONSE: " followed immediately by the combined text
			const responseLabel = 'RESPONSE: ';
			this.doc.text(responseLabel, this.margin + 5, contentY);
			
			// Calculate where the response text should start
			const labelWidth = this.doc.getTextWidth(responseLabel);
			
			this.doc.setTextColor(...this.colors.text);
			this.doc.setFont('helvetica', 'normal');
			this.doc.setFontSize(8);
			
			// Split the combined text to fit the remaining width
			const remainingWidth = this.contentWidth - 16 - labelWidth;
			const responseLines = this.doc.splitTextToSize(responseText, remainingWidth);
			
			// First line goes on the same line as "RESPONSE:"
			if (responseLines.length > 0) {
				this.doc.text(responseLines[0], this.margin + 5 + labelWidth, contentY);
				
				// Additional lines go below
				for (let i = 1; i < responseLines.length; i++) {
					contentY += 4;
					this.doc.text(responseLines[i], this.margin + 5, contentY);
				}
			}
		} else {
			// Just show "RESPONSE:" with no text following
			this.doc.text('RESPONSE:', this.margin + 5, contentY);
		}
		
		this.currentY += containerHeight + 3;
	}

    renderPhotosSection(property) {
        if (!window.photoManager || !window.photoManager.photos) return;

        const allPhotos = this.getAllPropertyPhotos(property);
        if (allPhotos.length === 0) return;

        this.addNewPage();

        this.doc.setTextColor(...this.colors.navy);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(18);
        this.doc.setTextColor(...this.colors.navy);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(13);
        this.doc.text('Assessment Photos', this.margin, this.currentY);

        this.currentY += 15;

        const photosByRoom = {};
        allPhotos.forEach(photo => {
            if (!photosByRoom[photo.roomName]) {
                photosByRoom[photo.roomName] = [];
            }
            photosByRoom[photo.roomName].push(photo);
        });

        this.doc.setFillColor(...this.colors.light);
        this.doc.rect(this.margin, this.currentY, this.contentWidth, 10, 'F');
        
        this.doc.setTextColor(...this.colors.text);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);
        const summaryText = allPhotos.length + ' photos captured across ' + Object.keys(photosByRoom).length + ' rooms';
        this.doc.text(summaryText, this.margin + 5, this.currentY + 7);

        this.currentY += 15;

        for (const [roomName, photos] of Object.entries(photosByRoom)) {
            this.renderRoomPhotos(roomName, photos);
        }
    }

    renderRoomPhotos(roomName, photos) {
        if (this.currentY > this.pageHeight - 80) {
            this.addNewPage();
        }

        this.doc.setTextColor(...this.colors.navy);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(12);
        this.doc.text(roomName + ' (' + photos.length + ' photos)', this.margin, this.currentY);

        this.currentY += 8;

        // Two photos per row, side by side — tight frames, no wasted space
        const colWidth = (this.contentWidth - 6) / 2;
        
        for (let i = 0; i < photos.length; i += 2) {
            const left = photos[i];
            const right = photos[i + 1] || null;
            
            // Pre-measure both cards so the row height and page break are exact
            const leftCard = this.measurePhotoCard(left, colWidth);
            const rightCard = right ? this.measurePhotoCard(right, colWidth) : null;
            const rowHeight = Math.max(leftCard.cardH, rightCard ? rightCard.cardH : 0);
            
            if (this.currentY + rowHeight > this.pageHeight - 18) {
                this.addNewPage();
            }
            
            this.renderPhotoCard(left, this.margin, this.currentY, leftCard);
            if (right) {
                this.renderPhotoCard(right, this.margin + colWidth + 6, this.currentY, rightCard);
            }
            
            this.currentY += rowHeight + 8;
        }

        this.currentY += 5;
    }
    
    // Measure a photo card: image scaled to fit the column, frame hugging the image
    measurePhotoCard(photo, colWidth) {
        const pad = 1;
        const captionArea = 10;
        const maxW = colWidth - pad * 2;
        const maxH = 62;
        
        let drawW = maxW;
        let drawH = maxW * 0.72;
        try {
            if (photo.data && photo.data.startsWith('data:image')) {
                const props = this.doc.getImageProperties(photo.data);
                if (props && props.width > 0 && props.height > 0) {
                    const scale = Math.min(maxW / props.width, maxH / props.height);
                    drawW = props.width * scale;
                    drawH = props.height * scale;
                }
            }
        } catch (e) { /* keep defaults */ }
        
        return {
            drawW: drawW,
            drawH: drawH,
            cardW: drawW + pad * 2,
            cardH: drawH + captionArea + pad * 2,
            pad: pad
        };
    }

    renderPhotoCard(photo, colX, y, m) {
        // Centre the card within its column
        const colWidth = (this.contentWidth - 6) / 2;
        const x = colX + (colWidth - m.cardW) / 2;

        // Thin, tight frame hugging the image — no wasted space
        this.doc.setFillColor(255, 255, 255);
        this.doc.setDrawColor(...this.colors.border);
        this.doc.setLineWidth(0.25);
        this.doc.rect(x, y, m.cardW, m.cardH, 'FD');

        try {
            if (photo.data && photo.data.startsWith('data:image')) {
                this.addImageSafely(photo.data, x + m.pad, y + m.pad, m.drawW, m.drawH);
            } else {
                this.renderPhotoPlaceholder(x + m.pad, y + m.pad, m.drawW, m.drawH);
            }
        } catch (error) {
            this.renderPhotoPlaceholder(x + m.pad, y + m.pad, m.drawW, m.drawH);
        }

        // Caption directly beneath the image
        this.doc.setTextColor(...this.colors.navy);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(7.5);
        const caption = this.truncateText(photo.itemName, 40);
        this.centerText(caption, y + m.pad + m.drawH + 4.5, x, m.cardW);

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(6);
        this.doc.setTextColor(...this.colors.secondary);
        const timestamp = new Date(photo.timestamp).toLocaleDateString('en-ZA');
        this.centerText(timestamp, y + m.pad + m.drawH + 8, x, m.cardW);
    }

    renderPhotoPlaceholder(x, y, width, height) {
        this.doc.setFillColor(...this.colors.light);
        this.doc.rect(x, y, width, height, 'F');
        this.doc.setDrawColor(...this.colors.border);
        this.doc.setLineDashPattern([2, 2], 0);
        this.doc.rect(x, y, width, height, 'D');
        this.doc.setLineDashPattern([], 0);
        
        this.doc.setTextColor(153, 153, 153);
        this.doc.setFontSize(12);
        this.centerText('PHOTO', y + (height/2) + 2, x, width);
    }

    // Helper methods
    addNewPage() {
        this.doc.addPage();
        this.currentY = this.margin;
    }

    getAllPropertyPhotos(property) {
        if (!window.photoManager || !property) return [];
        
        const allPhotos = [];
        const propertyId = property.id;
        
        // Only include photos belonging to room instances that CURRENTLY exist.
        // Photos of removed features/instances are excluded, so the PDF always
        // mirrors the assessment exactly.
        const validInstanceIds = new Set();
        Object.values(property.roomInstances || {}).forEach(list => {
            (list || []).forEach(inst => { if (inst && inst.id) validInstanceIds.add(inst.id); });
        });
        
        const photoKeys = Object.keys(window.photoManager.photos).filter(key => {
            if (!key.startsWith(propertyId + '_')) return false;
            const rest = key.slice(propertyId.length + 1);
            for (const instId of validInstanceIds) {
                if (rest === instId || rest.startsWith(instId + '_')) return true;
            }
            return false;
        });
        
        // Resolve human-friendly room names from the property's room instances
        const instanceNameById = {};
        Object.values(property.roomInstances || {}).forEach(list => {
            (list || []).forEach(inst => {
                if (inst && inst.id) instanceNameById[inst.id] = inst.customName || inst.name || inst.id;
            });
        });
        
        photoKeys.forEach(key => {
            const photos = window.photoManager.photos[key] || [];
            
            photos.forEach(photo => {
                // Photo records carry clean roomId + itemText fields — use them directly
                const instId = photo.roomId || '';
                const roomName = instanceNameById[instId] ||
                    (instId.charAt(0).toUpperCase() + instId.slice(1).replace(/[_-]/g, ' '));
                allPhotos.push({
                    ...photo,
                    roomName: roomName,
                    itemName: photo.itemText || 'Photo'
                });
            });
        });
        
        return allPhotos;
    }

    getScoreGrade(score) {
    if (window.scoringEngine && window.scoringEngine.getScoreGrade) {
        return window.scoringEngine.getScoreGrade(score);
    }
    
    // Fallback matching scoring.js exactly
    if (score >= 83) return { 
        label: 'Excellent', 
        shortLabel: 'Excellent',
        colorRGB: [6, 214, 160]
    };
    if (score >= 66) return { 
        label: 'Good', 
        shortLabel: 'Good',
        colorRGB: [40, 167, 69]
    };
    if (score >= 46) return { 
        label: 'Fair', 
        shortLabel: 'Fair',
        colorRGB: [241, 143, 1]
    };
    return { 
        label: 'Poor', 
        shortLabel: 'Poor',
        colorRGB: [220, 53, 69]
    };
}

    getAllPropertyFeatures(property) {
        const features = { internal: [], external: [], other: [] };
        
        if (property.bedrooms) features.internal.push({ name: 'Bedrooms', quantity: property.bedrooms });
        if (property.bathrooms) features.internal.push({ name: 'Bathrooms', quantity: property.bathrooms });
        features.internal.push({ name: 'Kitchen', quantity: 1 });
        
        if (property.parking) features.external.push({ name: 'Parking', quantity: property.parking });
        
        if (property.features) {
            ['internal', 'external', 'other'].forEach(category => {
                if (property.features[category]) {
                    features[category] = [...features[category], ...property.features[category]];
                }
            });
        }
        
        return features;
    }

    getDetailedScoreGuidance(score) {
		const guidance = window.assessmentGuidance?.scoreGuidance;
		if (!guidance) {
			return this.getBasicGuidance(score);
		}

		if (score >= 83) return guidance.excellent;
		if (score >= 66) return guidance.good;
		if (score >= 46) return guidance.fair;
		return guidance.poor;
	}

    getBasicGuidance(score) {
		if (score >= 83) return {
			title: 'Excellent Condition',
			description: 'Based on the assessment ratings, this property is in excellent overall condition. The majority of items rated well with minimal issues identified. Properties in this condition typically require only routine upkeep rather than remedial work.',
			implications: 'A property in excellent condition generally means lower immediate out-of-pocket costs after purchase, more predictable maintenance budgets, and less disruption to daily life. For first-time buyers, this can make the transition to homeownership more straightforward. For experienced buyers, it means capital can be directed elsewhere rather than into repairs.',
			buyerAdvice: 'The assessment findings suggest this property has been well maintained. It is worth understanding what has contributed to the good condition — recent renovations, the age of key systems (roof, geyser, electrical), and the seller\'s maintenance habits all play a role. Some buyers choose to commission an independent professional building inspection (typically R2,000–R5,000 depending on property size) for additional peace of mind, particularly for high-value purchases. The issues identified, while minor, are still worth factoring into your planning.',
			budgetConsiderations: 'Routine maintenance costs for a well-maintained SA property typically range from R10,000–R20,000 per year, depending on size and property type. Set aside a contingency fund for unexpected repairs — even excellent-condition properties can have surprises after transfer. Check when major items like the geyser, roof, and electrical panel were last serviced or replaced, as these have finite lifespans regardless of current condition.',
			negotiationAdvice: 'Understanding the condition of a property is one input into an offer — but market conditions, comparable sales in the area, how long the property has been listed, and your own circumstances all play a role too. The assessment gives you an objective, documented basis for your offer price and for any discussions about repairs or adjustments with the seller.'
		};
		if (score >= 66) return {
			title: 'Good Condition',
			description: 'Based on the assessment ratings, this property is in good overall condition. Most areas rated well, with some items showing normal wear or requiring minor attention. Issues identified are generally manageable and are not expected to significantly affect comfort or safety.',
			implications: 'Good condition properties are common in the SA market and represent a balance between move-in readiness and ongoing maintenance. The issues identified are the kind that accumulate over time in any lived-in home — they are informative rather than alarming. Understanding which items need attention in the short term versus which can wait helps with budgeting and prioritisation.',
			buyerAdvice: 'The assessment has identified specific areas that may need attention. Reviewing these in the context of the property as a whole — its location, size, price, and how it fits your needs — helps put them in perspective. Getting indicative repair or maintenance quotes for the flagged items before finalising an offer gives you a clearer picture of the true cost of ownership. For first-time buyers, the Issues Requiring Attention section of this report is a practical starting point for conversations with contractors or a building inspector.',
			budgetConsiderations: 'Budget R15,000–R40,000 in the first year for addressing the identified items and routine maintenance. Once the flagged items are addressed, annual upkeep costs for a well-maintained property of this type typically fall in the range of R15,000–R25,000 per year. Costs vary significantly by property size, age, and type — sectional title properties may have some costs covered by the body corporate levy.',
			negotiationAdvice: 'The documented findings from this assessment provide an objective basis for understanding the property\'s condition. Buyers often use identified maintenance items to inform their offer or to request that specific repairs be completed before transfer. The weight you place on each factor — condition, price, location, your personal priorities — is ultimately a personal decision based on what matters most to you.'
		};
		if (score >= 46) return {
			title: 'Fair Condition',
			description: 'Based on the assessment ratings, this property has a number of items requiring attention. While the property may be liveable, some areas show meaningful wear or issues that will need to be addressed within a reasonable timeframe. Fair condition does not mean the property is unsuitable — it means going in with clear information.',
			implications: 'Properties in fair condition can represent good opportunities for buyers who are prepared for the investment required. The key is having a realistic and well-researched understanding of what the repair and renovation costs will be, and how those costs relate to the purchase price and the property\'s potential value once work is done. For first-time buyers, fair condition properties require more careful financial planning than move-in-ready homes. For renovation-minded buyers or investors, they can offer more room to add value.',
			buyerAdvice: 'The Issues Requiring Attention section of this report details the specific items of concern and their priority level. Getting written cost estimates from qualified contractors for the major items before proceeding gives you the clearest picture of total outlay. An independent professional building inspection (R2,000–R5,000) can add further detail, particularly for structural, electrical, or plumbing concerns. Understanding the difference between cosmetic issues (generally cheaper and easier to address) and structural or system-level issues (typically more costly and complex) helps with prioritisation and budget planning.',
			budgetConsiderations: 'The repair and renovation costs for a fair condition property vary widely depending on what needs doing. As a broad guide, buyers in this situation often budget R50,000–R150,000+ for necessary repairs in the first 18 months, on top of standard purchase costs. Renovation loan products are available from SA banks if additional funding is needed. It is worth consulting with a financial adviser or mortgage originator if the scope of repairs affects your affordability calculations.',
			negotiationAdvice: 'The condition findings documented in this report provide a factual basis for price discussions. Buyers typically approach this by obtaining repair quotes, understanding the market value of the property in good condition, and using the gap between current condition and that value to inform their offer. There is no single right approach — how you weigh the property\'s condition against its other attributes, location, and price is a personal decision. Having documented, objective findings from an assessment puts you in a well-informed position for any discussions.'
		};
		return {
			title: 'Needs Significant Attention',
			description: 'Based on the assessment ratings, this property has significant issues across multiple areas. Several items have been rated poor or fair, indicating that meaningful investment will be required to bring the property to a comfortable and well-maintained standard. This does not mean the property has no merit — it means that going in with a thorough understanding of the scope and cost of work is particularly important.',
			implications: 'Properties in this condition carry higher financial and practical risk than well-maintained homes, but they can also offer greater potential for buyers who are able to manage a renovation project. The total cost of ownership — purchase price plus repair costs — is the critical number to understand. Understanding the local market value of the property in good condition helps assess whether the numbers make sense for your situation. For first-time buyers, it is worth taking additional time to fully understand the scope of work before committing, as unexpected costs can add up quickly.',
			buyerAdvice: 'The Issues Requiring Attention section of this report lists the specific concerns and their priority. Getting detailed written quotes from qualified contractors and specialists for all major items is an important step before finalising any decision. For complex or structural issues, engaging a professional building inspector or structural engineer (R2,000–R8,000 depending on scope) provides an expert assessment beyond what a walkthrough assessment can determine. Understanding which issues are urgent safety or habitability concerns versus which are longer-term maintenance items helps with prioritisation.',
			budgetConsiderations: 'Major repair and renovation budgets for properties in this condition can range from R100,000 to R300,000+ depending on what needs doing and the size of the property. It is important to build in a contingency — renovation projects commonly exceed initial estimates. If the property is to be uninhabitable during repairs, factor in the cost of alternative accommodation during that period. Consulting a quantity surveyor or experienced contractor for a realistic project estimate before committing can be valuable.',
			negotiationAdvice: 'Detailed, documented assessment findings and contractor quotes are particularly useful when discussing price for a property in this condition. The gap between the property\'s current state and its potential value in good repair is the foundation for those conversations. Every buyer\'s situation, risk tolerance, and priorities are different — what matters is that any decision is made with a clear and realistic understanding of what the property will cost in total, not just the purchase price.'
		};
	}

    calculateRoomGrade(items) {
        const ratings = { excellent: 4, good: 3, fair: 2, poor: 1 };
        const avg = items.reduce((sum, item) => sum + (ratings[item.rating] || 0), 0) / items.length;
        
        if (avg >= 3.5) return 'Excellent';
        if (avg >= 2.5) return 'Good';
        if (avg >= 1.5) return 'Fair';
        return 'Poor';
    }

    getRatingColor(rating) {
        switch (rating) {
            case 'excellent': return this.colors.teal;
            case 'good':      return this.colors.good;
            case 'fair':      return this.colors.warning;
            case 'poor':      return this.colors.danger;
            default: return this.colors.secondary;
        }
    }

    collectHighPriorityIssues(reportData) {
        const allIssues = [];
        reportData.sections.forEach(section => {
            section.rooms.forEach(room => {
                room.items.forEach(item => {
                    if (item.issuesRequiringAttention && 
                        (item.rating === 'fair' || item.rating === 'poor') &&
                        item.costWeight >= 3.0) {
                        allIssues.push({
                            section: section.name,
                            room: room.name,
                            item: item.text,
                            issue: item.issuesRequiringAttention,
                            priority: item.rating === 'poor' ? 'critical' : 'high',
                            rating: item.rating
                        });
                    }
                });
            });
        });
        return allIssues;
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    centerText(text, y, x = 0, width = this.pageWidth) {
        if (!text) return;
        const textWidth = this.doc.getTextWidth(String(text));
        const centerX = x + (width / 2) - (textWidth / 2);
        this.doc.text(String(text), centerX, y);
    }

    // FIXED: Download and share methods
    downloadPDF(filename, options = {}) {
    if (!this.doc) {
        throw new Error('No PDF document available');
    }
    
    try {
        console.log('📱 Attempting Android WebView download...');
        
        // Build a clean filename from the report title if provided
        let finalFilename = filename;
        if (!finalFilename) {
            const title = options.reportTitle || 'property-assessment';
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            finalFilename = slug + '-' + new Date().toISOString().split('T')[0] + '.pdf';
        }
        
        // Android WebView method
        if (window.Android && window.Android.generatePDF) {
            const pdfBlob = this.doc.output('blob');
            const reader = new FileReader();
            reader.onload = function() {
                const base64Data = reader.result.split(',')[1];
                window.Android.generatePDF(base64Data, finalFilename);
                console.log('✅ PDF sent to Android for download');
            };
            reader.readAsDataURL(pdfBlob);
        } 
        // Fallback: Standard browser download
        else {
            this.doc.save(finalFilename);
            console.log('✅ PDF downloaded via browser');
        }
    } catch (error) {
        console.error('❌ PDF download error:', error);
        throw error;
    }
}

    sharePDF() {
        if (!this.doc) {
            throw new Error('No PDF document available');
        }
        
        try {
            // For sharing, just download the file
            this.downloadPDF('property-assessment-report.pdf');
            console.log('✅ PDF prepared for sharing');
        } catch (error) {
            console.error('PDF share error:', error);
            throw error;
        }
    }
}

// FIXED: Robust class export with error handling
try {
    if (typeof window !== 'undefined') {
        window.PropertyPDFGenerator = PropertyPDFGenerator;
        console.log('✅ PropertyPDFGenerator class loaded successfully');
        
        // Verify jsPDF is available
        if (window.jspdf || window.jsPDF) {
            console.log('✅ jsPDF library detected');
        } else {
            console.warn('⚠️ jsPDF library not detected - PDF generation may fail');
        }
    }
} catch (error) {
    console.error('❌ Error exporting PropertyPDFGenerator:', error);
}