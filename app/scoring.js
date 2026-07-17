/**
 * Home Buyers Guide SA - Single Assessment Scoring System
 * Based on actual South African repair costs and property impact
 */

console.log('=== ENHANCED SCORING SYSTEM WITH GUIDANCE INTEGRATION LOADING ===');

// Helper function to convert hex to RGB array
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [128, 128, 128]; // fallback gray
}

// Scoring configuration
const scoringConfig = {
    weights: {
        assessment: {
            'location': 0.15,
            'exterior': 0.35,
            'interior': 0.35,
            'other': 0.15
        }
    },
    
    ratingScores: {
        excellent: 4,
        good: 3,
        fair: 2,
        poor: 1,
        na: 0
    },
    
    scoreRanges: {
		excellent: { min: 83, max: 100, label: 'Excellent', color: '#06D6A0' },
		good: { min: 66, max: 82, label: 'Good', color: '#28A745' },
		fair: { min: 46, max: 65, label: 'Fair', color: '#F18F01' },
		poor: { min: 0, max: 45, label: 'Poor', color: '#E63946' }
	}
};

// REALISTIC cost-based weighting (researched SA repair costs)
const itemCostWeights = {

    // ─── STRUCTURAL CRITICAL (5.0) ─── Highest cost items on any property. A POOR
    // rating on any of these caps the overall score at Fair; a FAIR rating caps it
    // below Excellent. Roof and structure are the most expensive repairs a buyer
    // can face — a property cannot be rated Good+ with these in poor condition. ──
    'Structural integrity': 5.0,                 // Roof structure — sagging = R100k–R500k+
    'Roof surface condition': 5.0,               // SA banks decline bonds; immediate water damage risk
    'Wall structural integrity': 5.0,            // Building walls — structural movement = R20k–R500k+

    // ─── CRITICAL (4.0) ─── Life safety / catastrophic failure / absolute bond-stopper ────
    'No electrical hazards or exposed wiring': 4.0,

    // ─── VERY HIGH (3.5) ─── R100,000–R500,000+ ──────────────────────────────
    'Foundation visibility': 3.5,

    // ─── HIGH (3.0) ─── R50,000–R300,000 typical cost or critical SA factor ──
    'Area safety and security feel': 3.0,       // SA #1 buyer concern; affects insurance and resale
    'Foundation protection': 3.0,
    'Pool structure and surface condition': 3.0, // Pool shell failure R70k–R300k+; buyers rarely anticipate this
    'Wall/fence structural condition': 3.0,      // Full boundary rebuild R50k–R200k+; major hidden cost
    'Moisture and water damage': 2.5,
    'Drainage system effectiveness': 2.5,
    'Solar panel condition and performance': 2.5,
    'Inverter and system monitoring': 2.5,
    'Battery storage system': 2.5,
    'Security system functionality': 2.5,       // SA-specific priority
    'Perimeter security': 2.5,                  // SA-specific priority
    'Insulation and energy efficiency': 2.5,    // Real monthly Eskom cost impact
    'Electrical certificate of compliance available': 2.5, // Legal — property cannot transfer without
    'Gas certificate available': 2.5,           // Legal — required for transfer where gas exists

    // ─── MODERATE (2.0) ─── R10,000–R50,000 ────────────────────────────────
    'DB board appears neat and properly labeled': 2.0,
    'Gate operation and mechanics': 2.0,
    'UPS system functionality': 2.0,
    'Cabinetry and storage': 2.0,
    'Countertops and work surfaces': 2.0,
    'Built-in wardrobes and storage': 2.0,
    'Tiling and waterproofing': 2.0,
    'Windows and natural lighting': 2.0,
    'Garage door functionality': 2.0,
    'Carport structure and stability': 2.0,
    'Plumbing fixtures functionality': 2.0,
    'Gas installation safety and compliance': 2.0,
    'Borehole operational': 2.0,
    'Height and security adequacy': 2.0,
    'Maintenance and repair needs': 2.0,
    'Ventilation and moisture control': 2.0,
    'Walls and floors - check for cracks, damp, or mould': 2.0,
    'Walls and floors - check for cracks, damp, or structural issues': 2.0,
    'AC systems functional': 2.0,
    'Heating system functional': 2.0,
    'Pool equipment and filtration': 2.0,

    // ─── LOW-MODERATE (1.5) ─── R5,000–R20,000 ──────────────────────────────
    'Paint and surface condition': 1.5,
    'Sink and taps functionality': 1.5,
    'Drainage - bath, shower, and basin drain quickly': 1.5,
    'Electrical safety and lighting': 1.5,
    'Access control systems': 1.5,
    'Safety and security features': 1.5,
    'Parking surface condition': 1.5,
    'Carport roof covering condition': 1.5,
    'Carport surface and drainage': 1.5,
    'Gutter condition and attachment': 1.5,
    'Drainage effectiveness': 1.5,
    'Equipment condition': 1.5,
    'Safety features': 1.5,
    'Gas appliance connections': 1.5,
    'Gas meter and supply': 1.5,
    'Structural condition': 1.5,
    'Installation and maintenance': 1.5,
    'Water quality': 1.5,
    'Water flow and runoff patterns': 1.5,
    'Battery condition and maintenance': 1.5,
    'Load management and capacity': 1.5,
    'Court surface condition': 1.5,
    'Court fencing and security': 1.5,
    'Sound insulation and room design': 1.5,
    'Temperature control effective': 1.5,
    'Safety and ventilation good': 1.5,
    'Proximity to amenities': 1.5,
    'Roads and infrastructure condition': 1.5,
    'Access and commute': 1.5,                 // Real monthly cost in SA — fuel, tolls, traffic
    'Plumbing, drainage, and ventilation': 1.5,

    // ─── LOW (1.0) ─── Under R5,000 / cosmetic / informational ──────────────
    'Main electrical outlets working throughout property': 1.0,
    'Maintenance and cleaning needs': 1.0,
    'Access and maneuvering space': 1.0,
    'Electrical and storage': 1.0,
    'Appliances and electrical': 1.0,
    'Electrical outlets and lighting': 1.0,
    'Room size and layout': 1.0,
    'Room size and dining capacity': 1.0,
    'Natural lighting and windows': 1.0,
    'Natural lighting and ambiance': 1.0,
    'Entertainment setup capability': 1.0,
    'Electrical and connectivity': 1.0,
    'Connection to kitchen': 1.0,
    'Lighting and ambiance': 1.0,
    'Electrical and lighting adequacy': 1.0,
    'Lighting and acoustics': 1.0,
    'Lighting and visibility': 1.0,
    'Seating and comfort arrangement': 1.0,
    'Built-in features and storage': 1.0,
    'Garden size and condition adequate': 1.0,
    'Garden aspect and sunlight good': 1.0,
    'Irrigation system present if needed': 1.0,
    'Maintenance requirements reasonable': 1.0,
    'Maintenance requirements': 1.0,
    'System monitoring and control': 1.0,
    'Power and backup systems': 1.0,
    'Water circulation and pump systems': 1.0,
    'Maintenance costs and requirements': 1.0,
    'Safety and integration': 1.0,
    'Water tank capacity and condition': 1.0,
    'Installation and connections': 1.0,
    'Smart home integration': 1.0,
    'Automation system functionality': 1.0,
    'Internet connectivity available': 1.0,
    'Network coverage quality': 1.0,
    'Equipment and accessories present': 1.0,
    'Access and lighting adequate': 1.0,
    'Structure appears sound and secure': 1.0,
    'Access and security adequate': 1.0,
    'Size adequate for intended use': 1.0,
    'Electrical supply if needed': 1.0,
    'Storage and organization': 1.0,
    'Plumbing connections present': 1.0,
    'Electrical supply adequate': 1.0,
    'Space and ventilation adequate': 1.0,
    'Emergency systems': 1.0,
    'Drain accessibility and maintenance': 1.0,
    'Electrical and entertainment setup': 1.0,
    'Room size and layout for reception use': 1.0,
    'Overall condition and presentation': 1.0,
    'Room size and layout for office use': 1.0,
    'Electrical outlets and technology': 1.0,
    'Room acoustics and lighting control': 1.0,
    'Electrical and technology infrastructure': 1.0,
    'Seating and viewing arrangement': 1.0,
    'Irrigation system effectiveness': 1.0,
    'System control and automation': 1.0,
    'Maintenance and water efficiency': 1.0,
    'Maintenance and cleaning': 1.0,
    'Maintenance and age acceptable': 1.0,
    'Energy efficiency acceptable': 1.0,
};
const ratingMultipliers = {
    excellent: 1.0,
    good: 0.8,
    fair: 0.5,
    poor: 0.2,
    na: 0.0
};

// Get cost weight for any item
function getItemCostWeight(itemText) {
    if (itemCostWeights[itemText]) {
        return itemCostWeights[itemText];
    }
    
    const lowerText = itemText.toLowerCase();
    
    // Critical patterns (4.0)
    if (lowerText.includes('major structural') || lowerText.includes('foundation') && lowerText.includes('crack')) return 4.0;
    if (lowerText.includes('electrical hazard') || lowerText.includes('exposed wiring')) return 4.0;
    if (lowerText.includes('roof') && lowerText.includes('structural')) return 4.0;
    if (lowerText.includes('roof') && lowerText.includes('surface')) return 4.0;
    
    // Very high cost patterns (3.5)
    if (lowerText.includes('wall') && lowerText.includes('structural') && lowerText.includes('integrity')) return 3.5;
    if (lowerText.includes('foundation') && (lowerText.includes('visibility') || lowerText.includes('settling'))) return 3.5;
    
    // High cost patterns (3.0)
    if (lowerText.includes('area safety') || lowerText.includes('security feel')) return 3.0;
    if (lowerText.includes('pool') && lowerText.includes('structure')) return 3.0;      // R70k-R300k shell failure
    if (lowerText.includes('wall') && lowerText.includes('fence') && lowerText.includes('structural')) return 3.0; // R50k-R200k rebuild
    if (lowerText.includes('solar') || lowerText.includes('battery storage') || lowerText.includes('inverter')) return 2.5;
    if (lowerText.includes('security system') || lowerText.includes('perimeter security')) return 2.5;
    if (lowerText.includes('certificate of compliance') || lowerText.includes('gas certificate')) return 2.5;
    
    // Moderate patterns (2.0)
    if (lowerText.includes('cabinet') || lowerText.includes('wardrobe') || lowerText.includes('countertop')) return 2.0;
    if (lowerText.includes('window') || lowerText.includes('garage door')) return 2.0;
    if (lowerText.includes('paint') || lowerText.includes('tiling')) return 2.0;
    
    // Low-moderate patterns (1.5)
    if (lowerText.includes('plumbing') || lowerText.includes('water damage') || lowerText.includes('drainage')) return 1.5;
    if (lowerText.includes('ventilation') || lowerText.includes('gutter')) return 1.5;
    
    return 1.0;
}

// Helper functions
function cleanupAssessmentData(property) {
    const assessments = property.assessments || {};
    console.log('Assessment data keys:', Object.keys(assessments));
    return assessments;
}

function canGenerateReport(property) {
    const availableTypes = getAvailableAssessmentTypes(property);
    const typeInfo = availableTypes.find(t => t.type === 'assessment');
    
    if (!typeInfo) {
        return {
            canGenerate: false,
            reason: 'No assessment data found',
            completeness: 0
        };
    }
    
    // Allow report generation if assessment has any data
    const canGenerate = Object.keys(property.assessments || {}).length > 0;
    
    return {
        canGenerate: canGenerate,
        reason: canGenerate ? 'Assessment data available' : 'No assessment data found. Please complete at least some sections of the assessment.',
        completeness: Math.round(typeInfo.completeness)
    };
}

// Enhanced scoring engine
const scoringEngine = {
    
    calculatePropertyScore(property) {
		console.log('=== CALCULATING PROPERTY SCORE ===');

		const assessments = property.assessments || {};
		const categories = assessmentCategories;

		if (!assessments || Object.keys(assessments).length === 0) {
			console.log('No assessments found');
			return null;
		}

		const roomScores = this.calculateCostWeightedRoomScores(assessments, categories);
		const weightedScore = this.calculateRealisticOverallScore(roomScores);
		const finalScore = Math.round(weightedScore);
		const recommendations = this.generateEnhancedRecommendations(property, assessments, roomScores);

		const scoreData = {
			overall: finalScore,
			rooms: roomScores,
			assessmentType: 'assessment',
			breakdown: this.generateScoreBreakdown(roomScores),
			grade: this.getScoreGrade(finalScore),
			recommendations: recommendations,
			completeness: this.calculateCompleteness(assessments, categories),
			structuralCap: this.lastStructuralCap || null
		};

		property.score = scoreData.overall;
		scoreData.dynamicGuidance = this.getDynamicGuidanceFromAssessment(property, scoreData);
		return scoreData;
	},
    
    calculateCostWeightedRoomScores(assessments, categories) {
		const roomScores = {};
		
		console.log('=== SCORING ASSESSMENT ===');
		console.log('Available assessment keys:', Object.keys(assessments));
		
		categories.forEach(category => {
			category.rooms.forEach(room => {
				// More robust room instance matching
				const roomInstances = [];
				
				// First try exact match
				if (assessments[room.id]) {
					roomInstances.push(room.id);
				}
				
				// Then try instance pattern matching
				Object.keys(assessments).forEach(key => {
					if (key.startsWith(room.id + '_') && !roomInstances.includes(key)) {
						roomInstances.push(key);
					}
				});
				
				console.log(`Room ${room.id} instances found:`, roomInstances);
            
            roomInstances.forEach(instanceId => {
                let totalWeightedScore = 0;
                let totalMaxWeightedScore = 0;
                let assessedItems = 0;
                const itemDetails = [];
                
                const roomAssessments = assessments[instanceId] || {};
                
                room.items.forEach(item => {
                    if (roomAssessments[item.text]) {
                        const rating = roomAssessments[item.text].rating;
                        if (rating && rating !== 'na') {
                            const costWeight = getItemCostWeight(item.text);
                            const ratingMultiplier = ratingMultipliers[rating];
                            const itemScore = costWeight * ratingMultiplier;
                            const maxItemScore = costWeight * 1.0;
                            
                            totalWeightedScore += itemScore;
                            totalMaxWeightedScore += maxItemScore;
                            assessedItems++;
                            
                            itemDetails.push({
                                text: item.text,
                                rating: rating,
                                costWeight: costWeight,
                                weightedScore: itemScore,
                                maxScore: maxItemScore
                            });
                        }
                    }
                });
                
                const roomPercentage = totalMaxWeightedScore > 0 ? (totalWeightedScore / totalMaxWeightedScore) * 100 : 0;
                
                roomScores[instanceId] = {
                    score: Math.round(roomPercentage),
                    name: room.name,
                    category: category.id,
                    weight: scoringConfig.weights['assessment'][category.id] || 0,
                    assessedItems: assessedItems,
                    totalItems: room.items.length,
                    completeness: room.items.length > 0 ? (assessedItems / room.items.length) * 100 : 0,
                    weightedScore: totalWeightedScore,
                    maxWeightedScore: totalMaxWeightedScore,
                    itemDetails: itemDetails
                };
            });
        });
    });
    
    return roomScores;
},
    
    calculateRealisticOverallScore(roomScores) {
        let totalWeightedScore = 0;
        let totalMaxWeightedScore = 0;
        let criticalPoorCount = 0;
        let criticalFairCount = 0;
        let structuralPoorCount = 0;
        let structuralFairCount = 0;
        
        // Structural-critical items: the most expensive components of any property.
        // These carry hard caps — a property cannot score Good+ with a poor roof or structure.
        const STRUCTURAL_CRITICAL_ITEMS = [
            'Roof surface condition',
            'Structural integrity',
            'Wall structural integrity'
        ];
        
        Object.values(roomScores).forEach(room => {
            if (room.itemDetails) {
                room.itemDetails.forEach(item => {
                    if (item.costWeight >= 4.0) {
                        if (item.rating === 'poor') criticalPoorCount++;
                        if (item.rating === 'fair') criticalFairCount++;
                    }
                    if (STRUCTURAL_CRITICAL_ITEMS.includes(item.text)) {
                        if (item.rating === 'poor') structuralPoorCount++;
                        if (item.rating === 'fair') structuralFairCount++;
                    }
                });
            }
            
            if (room.weightedScore > 0) {
                totalWeightedScore += room.weightedScore;
                totalMaxWeightedScore += room.maxWeightedScore;
            }
        });
        
        let overallScore = totalMaxWeightedScore > 0 ? (totalWeightedScore / totalMaxWeightedScore) * 100 : 0;
        
        // Apply proportional penalties
        let penaltyMultiplier = 1.0;
        penaltyMultiplier -= (criticalPoorCount * 0.15);
        penaltyMultiplier -= (criticalFairCount * 0.08);
        penaltyMultiplier = Math.max(penaltyMultiplier, 0.3);
        
        overallScore *= penaltyMultiplier;
        
        // ─── STRUCTURAL HARD CAPS ───
        // Roof and structural integrity are the most expensive repairs a property can
        // need. A property with any of these in poor condition can never be rated
        // Good or Excellent, regardless of how well everything else scores.
        this.lastStructuralCap = null;
        if (structuralPoorCount >= 2) {
            if (overallScore > 45) {
                overallScore = 45;
                this.lastStructuralCap = 'Multiple structural-critical items (roof/structure) rated Poor — score capped at Poor.';
            }
        } else if (structuralPoorCount === 1) {
            if (overallScore > 65) {
                overallScore = 65;
                this.lastStructuralCap = 'A structural-critical item (roof/structure) is rated Poor — score capped at Fair.';
            }
        } else if (structuralFairCount >= 1) {
            if (overallScore > 75) {
                overallScore = 75;
                this.lastStructuralCap = 'A structural-critical item (roof/structure) is rated Fair — score capped pending professional verification.';
            }
        }
        
        console.log('Proportional penalty + structural caps:', {
            criticalPoor: criticalPoorCount,
            criticalFair: criticalFairCount,
            structuralPoor: structuralPoorCount,
            structuralFair: structuralFairCount,
            penaltyMultiplier: penaltyMultiplier.toFixed(2),
            structuralCap: this.lastStructuralCap || 'none',
            finalScore: overallScore.toFixed(2)
        });
        
        return overallScore;
    },
    
    // REPLACE the calculateCompleteness function (building on our previous 100% requirement change):
	calculateCompleteness(assessments, categories) {
		let totalItems = 0;
		let assessedItems = 0;
		
		// CRITICAL: Only count items that actually exist in the current assessment data
		Object.keys(assessments).forEach(instanceId => {
			const roomAssessments = assessments[instanceId] || {};
			
			// Find the room definition for this instance
			const roomDef = categories.flatMap(cat => cat.rooms).find(room => {
				return instanceId === room.id || instanceId.startsWith(room.id + '_');
			});
			
			if (roomDef) {
				roomDef.items.forEach(item => {
					totalItems++;
					
					if (roomAssessments[item.text] && 
						roomAssessments[item.text].rating &&
						roomAssessments[item.text].rating !== '' &&
						roomAssessments[item.text].rating !== 'select' &&
						roomAssessments[item.text].rating !== 'Select rating...') {
						assessedItems++;
					}
				});
			}
		});
		
		const completeness = totalItems > 0 ? (assessedItems / totalItems) * 100 : 0;
		console.log(`ACCURATE COMPLETENESS: ${assessedItems}/${totalItems} = ${completeness.toFixed(1)}%`);
		return completeness;
	},
    
    generateScoreBreakdown(roomScores) {
        const breakdown = {};
        
        Object.entries(roomScores).forEach(([roomId, data]) => {
            breakdown[roomId] = {
                score: data.score,
                contribution: Math.round(data.score * data.weight),
                weight: Math.round(data.weight * 100),
                status: this.getScoreGrade(data.score).label,
                completeness: data.completeness,
                weightedScore: data.weightedScore,
                maxWeightedScore: data.maxWeightedScore
            };
        });
        
        return breakdown;
    },
    
    getScoreGrade(score) {
    const numScore = Number(score);
    if (isNaN(numScore)) {
        console.error('Invalid score:', score);
        return {
            grade: 'poor',
            label: 'Poor',
            color: '#E63946',
            colorRGB: [230, 57, 70]
        };
    }
    
    // FIXED: Use only >= checks, no upper bounds except for excellent
    let grade, range;
    
    if (numScore >= 83) {
        grade = 'excellent';
        range = scoringConfig.scoreRanges.excellent;
    } else if (numScore >= 66) {
        grade = 'good';
        range = scoringConfig.scoreRanges.good;
    } else if (numScore >= 46) {
        grade = 'fair';
        range = scoringConfig.scoreRanges.fair;
    } else {
        grade = 'poor';
        range = scoringConfig.scoreRanges.poor;
    }
    
    const result = {
        grade: grade,
        label: range.label,
        color: range.color,
        colorRGB: hexToRgb(range.color)
    };
    
    if (window.assessmentGuidance?.scoreGuidance?.[grade]) {
        Object.assign(result, window.assessmentGuidance.scoreGuidance[grade]);
    }
    
    return result;
},
    
    generateEnhancedRecommendations(property, assessments, roomScores) {
		const allRecommendations = [];
		const criticalIssues = []; // Only costWeight >= 3.0 AND (fair/poor) AND has issuesRequiringAttention
		
		Object.entries(roomScores).forEach(([roomId, roomData]) => {
			if (roomData.itemDetails) {
				roomData.itemDetails.forEach(item => {
					if (item.rating === 'poor' || item.rating === 'fair') {
						const costWeight = item.costWeight;
						const costCategory = costWeight >= 4.0 ? 'CRITICAL' : 
										   costWeight >= 3.0 ? 'HIGH' : 
										   costWeight >= 2.0 ? 'MODERATE' : 'LOW';
						
						// Get detailed guidance from assessment-guidance.js
						let detailedDescription = '';
						let issuesDescription = '';
						
						if (window.assessmentGuidance?.getItemGuidanceWithRating) {
							const guidance = window.assessmentGuidance.getItemGuidanceWithRating(item.text, item.rating);
							detailedDescription = guidance?.description || '';
							issuesDescription = guidance?.issuesRequiringAttention || '';
						}
						
						const recommendation = {
							priority: item.rating === 'poor' && costWeight >= 3.0 ? 'critical' :
									 item.rating === 'poor' ? 'high' : 
									 costWeight >= 2.0 ? 'medium' : 'low',
							room: roomData.name,
							item: item.text,
							rating: item.rating,
							costWeight: costWeight,
							costCategory: costCategory,
							impactScore: costWeight * (item.rating === 'poor' ? 0.2 : 0.5),
							detailedDescription: detailedDescription,
							issuesRequiringAttention: issuesDescription
						};
						
						allRecommendations.push(recommendation);
						
						// CRITICAL: Only add if costWeight >= 3.0 AND has issuesRequiringAttention
						if (costWeight >= 3.0 && issuesDescription && issuesDescription.trim() !== '') {
							criticalIssues.push({
								section: roomData.category,
								room: roomData.name,
								item: item.text,
								issue: issuesDescription,
								priority: item.rating === 'poor' ? 'critical' : 'high',
								rating: item.rating,
								costWeight: costWeight
							});
						}
					}
				});
			}
		});
		
		allRecommendations.sort((a, b) => b.impactScore - a.impactScore);
		
		return {
			all: allRecommendations,
			critical: criticalIssues,
			count: criticalIssues.length
		};
	},

getDynamicGuidanceFromAssessment(property, scoreData) {
    const score = scoreData.overall;
    const criticalIssues = scoreData.recommendations.critical || [];
    
    // Get base guidance from assessment-guidance.js
    const baseGuidance = this.getScoreGrade(score);
    
    // Only provide budget estimates - no professional determinations
    let specificBudget = baseGuidance.budgetConsiderations;
    if (criticalIssues.length > 0) {
        const poorCount = criticalIssues.filter(i => i.rating === 'poor').length;
        const fairCount = criticalIssues.filter(i => i.rating === 'fair').length;
        
        // Realistic inspection cost (ONE inspection, not per item)
        const inspectionCost = 'R2,000-R7,500 depending on property size';
        
        if (poorCount > 0 && fairCount === 0) {
            specificBudget = `Professional building inspection (${inspectionCost}) essential to assess ${poorCount} identified area${poorCount > 1 ? 's' : ''} with visible problems. Actual repair costs depend on professional evaluation and chosen solutions.`;
        } else if (fairCount > 0 && poorCount === 0) {
            specificBudget = `Consider professional building inspection (${inspectionCost}) to evaluate ${fairCount} identified area${fairCount > 1 ? 's' : ''}. Issues may range from minor to significant - inspection clarifies actual needs and costs.`;
        } else {
            specificBudget = `Professional building inspection (${inspectionCost}) recommended to assess ${criticalIssues.length} identified areas with varying conditions. Actual repair costs depend on professional evaluation and chosen solutions.`;
        }
    }
    
    return {
        ...baseGuidance,
        budgetConsiderations: specificBudget,
        criticalIssues: criticalIssues,
        criticalIssueCount: criticalIssues.length
    };
},
    
    generateAssessmentReport(property, options = {}) {
        const {
            includePhotos = true,
            companyLogo = null,
            reportTitle = 'Property Assessment Report'
        } = options;
        
        // CRITICAL: Check if report can be generated
        const reportCheck = canGenerateReport(property);
        if (!reportCheck.canGenerate) {
            return { 
                error: reportCheck.reason,
                completeness: reportCheck.completeness
            };
        }
        
        const scoreData = this.calculatePropertyScore(property);
        if (!scoreData) {
            return { error: 'Unable to calculate property score' };
        }
        
        const assessments = property.assessments || {};
        const notes = property.roomNotes || {};
        const itemNotes = property.itemNotes || {};
        const categories = assessmentCategories;
        
        return {
            property: {
                id: property.id,
                address: property.address,
                suburb: property.suburb,
                type: property.type,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                price: property.price,
                assessmentDate: property.assessmentDate
            },
            assessment: {
                type: 'assessment',
                overallScore: scoreData.overall,
                grade: scoreData.grade,
                completeness: scoreData.completeness,
                assessedAt: new Date().toISOString()
            },
            sections: this.generateReportSections(assessments, notes, categories, includePhotos, property, itemNotes),
            recommendations: scoreData.recommendations,
            summary: scoreData.grade.description || `Property scored ${scoreData.overall}% (${scoreData.grade.label})`,
            options: {
                includePhotos,
                companyLogo,
                reportTitle
            }
        };
    },
    
    generateReportSections(assessments, notes, categories, includePhotos, property, itemNotes = {}) {
		const sections = [];
		
		categories.forEach(category => {
			const categorySection = {
				id: category.id,
				name: category.name,
				icon: category.icon,
				color: category.color,
				rooms: []
			};
			
			category.rooms.forEach(room => {
				// Get room instances from unified property store
				const roomInstancesSource = property.roomInstances || {};
				let roomInstances = roomInstancesSource[room.id] || [];

				// FALLBACK: If no room instances found, search for actual assessment keys
				if (roomInstances.length === 0) {
					const foundKeys = Object.keys(assessments).filter(key => 
						key === room.id || key.startsWith(room.id + '_')
					);
					
					roomInstances = foundKeys.map(key => ({
						id: key,
						name: key === room.id ? room.name : `${room.name} ${foundKeys.indexOf(key) + 1}`,
						customName: ''
					}));
				}

				// If still no instances, use default
				if (roomInstances.length === 0) {
					roomInstances = [{ id: room.id, name: room.name }];
				}
				
				roomInstances.forEach(instance => {
					const roomAssessments = assessments[instance.id] || {};
					const roomNotes = notes[instance.id] || '';
					
					if (Object.keys(roomAssessments).length === 0) return;
					
					const roomSection = {
						id: instance.id,
						name: instance.customName || instance.name || room.name,
						icon: room.icon,
						notes: roomNotes,
						items: []
					};
					
					room.items.forEach(item => {
						const itemAssessment = roomAssessments[item.text];
						if (itemAssessment) {
							const costWeight = getItemCostWeight(item.text);
							const costCategory = costWeight >= 4.0 ? 'CRITICAL' : 
											   costWeight >= 3.0 ? 'HIGH' : 
											   costWeight >= 2.0 ? 'MODERATE' : 
											   costWeight >= 1.5 ? 'LOW-MODERATE' : 'LOW';
							
							// Get detailed guidance description
							let detailedDescription = '';
							let issuesDescription = '';
							
							if (window.assessmentGuidance?.getItemGuidanceWithRating) {
								const guidance = window.assessmentGuidance.getItemGuidanceWithRating(item.text, itemAssessment.rating);
								detailedDescription = guidance?.description || '';
								issuesDescription = guidance?.issuesRequiringAttention || '';
							}
							
							const itemSection = {
								text: item.text,
								info: item.info,
								rating: itemAssessment.rating,
								ratingDescription: detailedDescription,
								issuesRequiringAttention: issuesDescription,
								score: scoringConfig.ratingScores[itemAssessment.rating] || 0,
								costWeight: costWeight,
								costCategory: costCategory,
								note: (itemNotes[instance.id] && itemNotes[instance.id][item.text]) || null,
								photos: includePhotos ? this.getItemPhotos(property, instance.id, item.text) : []
							};
							roomSection.items.push(itemSection);
						}
					});
					
					if (roomSection.items.length > 0) {
						categorySection.rooms.push(roomSection);
					}
				});
			});
			
			if (categorySection.rooms.length > 0) {
				sections.push(categorySection);
			}
		});
		
		return sections;
	},
    
    getItemPhotos(property, roomId, itemText) {
        if (!window.photoManager || !window.photoManager.photos) return [];
        
        const photoKey = `${property.id}_${roomId}_${itemText}`;
        return window.photoManager.photos[photoKey] || [];
    },
};

function getAvailableAssessmentTypes(property) {
    const types = [];
    const assessmentProgress = property.progress || 0;
    if (property.assessments && Object.keys(property.assessments).length > 0) {
        types.push({
            type: 'assessment',
            name: 'Property Assessment',
            completeness: assessmentProgress,
            canGenerate: assessmentProgress >= 100
        });
    }
    return types;
}

// Main function
function calculatePropertyScore(property) {
    if (!property) {
        console.error('No property provided for scoring');
        return null;
    }
    return scoringEngine.calculatePropertyScore(property);
}

// Exports
window.scoringEngine = scoringEngine;
window.calculatePropertyScore = calculatePropertyScore;
window.generateAssessmentReport = scoringEngine.generateAssessmentReport.bind(scoringEngine);
window.getScoreGrade = scoringEngine.getScoreGrade.bind(scoringEngine);
window.getAvailableAssessmentTypes = getAvailableAssessmentTypes;
window.canGenerateReport = canGenerateReport;
window.cleanupAssessmentData = cleanupAssessmentData;
window.scoringConfig = scoringConfig;
window.itemCostWeights = itemCostWeights;
window.getItemCostWeight = getItemCostWeight;

console.log('🚀 Enhanced Scoring System with Guidance Integration loaded successfully');