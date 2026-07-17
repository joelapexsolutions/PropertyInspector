/**
 * South African Property Cost Calculator - UPDATED VERSION
 * Fixed rates and detailed breakdowns
 */

// South African Transfer Duty Rates (2025/26 - 2026/27)
// Source: SARS Transfer Duty Act — effective 1 April 2025, confirmed unchanged for 2026/27
// by National Treasury (Budget, 19 February 2026). Verified against MJ Kotze Inc (May 2026),
// SA Home Loans, Rand Tools (May 2026) and Cape Town Lawyer.
// Each bracket stores: lower threshold, marginal rate, and cumulative base duty at that threshold.
const SA_TRANSFER_DUTY_BRACKETS = [
    { min: 0,          max: 1210000,   rate: 0.00, base: 0         },
    { min: 1210001,    max: 1663800,   rate: 0.03, base: 0         },
    { min: 1663801,    max: 2329300,   rate: 0.06, base: 13614     },
    { min: 2329301,    max: 2994800,   rate: 0.08, base: 53544     },
    { min: 2994801,    max: 13310000,  rate: 0.11, base: 106784    },
    { min: 13310001,   max: Infinity,  rate: 0.13, base: 1241456   }
];

// Cost Calculator State
const costCalculatorState = {
    askingPrice: 0,
    isBonded: true,
    loanAmount: 0,
    loanTerm: 20,
    interestRate: 10.25,  // SA prime rate (SARB repo 6.75% + 3.5% margin, May 2026)
    ratesTaxes: 0,
    waterLights: 0,
    levies: 0,
    sectionsExpanded: {
        monthly: false,
        onceOff: false
    }
};
const SAPropertyCostCalculator = {
    
    // Calculate transfer duty using the SARS cumulative progressive scale
    calculateTransferDuty(purchasePrice) {
        if (!purchasePrice || purchasePrice <= 0) return 0;

        // Find the applicable bracket and apply: base + (price - lower threshold) * marginal rate
        for (let i = SA_TRANSFER_DUTY_BRACKETS.length - 1; i >= 0; i--) {
            const bracket = SA_TRANSFER_DUTY_BRACKETS[i];
            if (purchasePrice >= bracket.min) {
                return Math.round(bracket.base + (purchasePrice - bracket.min) * bracket.rate);
            }
        }
        return 0;
    },
    
    // Helper function to get base transfer fees without VAT and additional costs
	calculateTransferFeesBase(purchasePrice) {
		if (purchasePrice === 0 || !purchasePrice) return 0;
		
		let baseFees = 0;
		
		// LSSA Attorney Fee Tariff — effective 1 August 2025
		// Source: Law Society of South Africa Guideline, confirmed Cape Town Lawyer (capetownlawyer.co.za)
		// Fees excl. VAT; each band uses ceiling (rounds UP to next full band)
		if (purchasePrice <= 100000) {
			baseFees = 6640;
		} else if (purchasePrice <= 500000) {
			const bands = Math.ceil((purchasePrice - 100000) / 50000);
			baseFees = 6640 + bands * 1060;
		} else if (purchasePrice <= 1000000) {
			const bands = Math.ceil((purchasePrice - 500000) / 100000);
			baseFees = 15120 + bands * 2050;
		} else if (purchasePrice <= 5000000) {
			const bands = Math.ceil((purchasePrice - 1000000) / 200000);
			baseFees = 25370 + bands * 2050;
		} else {
			const bands = Math.ceil((purchasePrice - 5000000) / 1000000);
			baseFees = 66370 + bands * 5160;
		}
		
		return Math.round(baseFees);
	},
    
    // Calculate transfer attorney fees (based on SA Law Society guidelines + additional fees) - FIXED
    calculateTransferFees(purchasePrice) {
        if (purchasePrice === 0 || !purchasePrice) return 0;
        
        const baseFees = this.calculateTransferFeesBase(purchasePrice);
        
        // Add VAT (15%)
        const feesWithVAT = baseFees * 1.15;
        
        // Additional fees (combined)
        const additionalFees = 2200;  // FIXED: reduced from 2600
        
        return Math.round(feesWithVAT + additionalFees);
    },
    
    // Calculate bond registration costs with detailed breakdown
    calculateBondRegistrationBreakdown(loanAmount) {
        if (loanAmount === 0 || !loanAmount) return {
            attorneyFeesBase: 0,
            attorneyFeesWithVAT: 0,
            deedsOfficeFee: 0,
            bankInitiationFee: 0,
            additionalFees: 0,
            total: 0
        };
        
        // Deeds Office bond registration fees — 1 April 2026 gazette (Govt Gazette No. 54225)
        // Source: capetownlawyer.co.za/property/conveyancing/fees/deeds-office-fees.php
        let deedsOfficeFee = 0;
        if (loanAmount <= 150000)       { deedsOfficeFee = 561; }
        else if (loanAmount <= 300000)  { deedsOfficeFee = 727; }
        else if (loanAmount <= 600000)  { deedsOfficeFee = 956; }
        else if (loanAmount <= 800000)  { deedsOfficeFee = 1346; }
        else if (loanAmount <= 1000000) { deedsOfficeFee = 1546; }
        else if (loanAmount <= 2000000) { deedsOfficeFee = 1738; }
        else if (loanAmount <= 4000000) { deedsOfficeFee = 2408; }
        else if (loanAmount <= 6000000) { deedsOfficeFee = 2922; }
        else if (loanAmount <= 8000000) { deedsOfficeFee = 3480; }
        else if (loanAmount <= 10000000){ deedsOfficeFee = 4068; }
        else if (loanAmount <= 15000000){ deedsOfficeFee = 4844; }
        else if (loanAmount <= 20000000){ deedsOfficeFee = 5818; }
        else if (loanAmount <= 30000000){ deedsOfficeFee = 6781; }
        else                            { deedsOfficeFee = 9690; }
        
        // Bond attorney fees — LSSA tariff effective 1 August 2025
        // Same tariff table as transfer attorney fees (applied to bond amount)
        let attorneyFeesBase = 0;
        if (loanAmount <= 100000) {
            attorneyFeesBase = 6640;
        } else if (loanAmount <= 500000) {
            const bands = Math.ceil((loanAmount - 100000) / 50000);
            attorneyFeesBase = 6640 + bands * 1060;
        } else if (loanAmount <= 1000000) {
            const bands = Math.ceil((loanAmount - 500000) / 100000);
            attorneyFeesBase = 15120 + bands * 2050;
        } else if (loanAmount <= 5000000) {
            const bands = Math.ceil((loanAmount - 1000000) / 200000);
            attorneyFeesBase = 25370 + bands * 2050;
        } else {
            const bands = Math.ceil((loanAmount - 5000000) / 1000000);
            attorneyFeesBase = 66370 + bands * 5160;
        }
        
        // Add VAT to attorney fees (15%)
        const attorneyFeesWithVAT = Math.round(attorneyFeesBase * 1.15);
        
        // Bank initiation fee (NCA maximum: R5,250 + 15% VAT = R6,037.50)
        const bankInitiationFee = 6037.50;
        // Post, petties, FICA, electronic lodgement and other disbursements
        const additionalFees = 2000;
        
        const total = deedsOfficeFee + attorneyFeesWithVAT + bankInitiationFee + additionalFees;
        
        return {
            attorneyFeesBase: Math.round(attorneyFeesBase),
            attorneyFeesWithVAT: attorneyFeesWithVAT,
            deedsOfficeFee: deedsOfficeFee,
            bankInitiationFee: bankInitiationFee,
            additionalFees: additionalFees,
            total: Math.round(total)
        };
    },
    
    // Calculate bond registration costs (comprehensive)
    calculateBondRegistrationCosts(loanAmount) {
        const breakdown = this.calculateBondRegistrationBreakdown(loanAmount);
        return breakdown.total;
    },
    
    // Calculate monthly bond repayment with dynamic loan term
    calculateMonthlyBondRepayment(loanAmount, interestRate, termYears) {
        if (loanAmount === 0 || !loanAmount) return 0;
        
        const monthlyRate = interestRate / 100 / 12;
        const numberOfPayments = termYears * 12;
        
        // Standard loan payment formula
        const monthlyPayment = loanAmount * 
            (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        
        return Math.round(monthlyPayment);
    },
    
    // Calculate deeds office fees for property transfer — 1 April 2026 gazette (Govt Gazette No. 54225)
    // Source: capetownlawyer.co.za/property/conveyancing/fees/deeds-office-fees.php
    calculateDeedsOfficeFees(purchasePrice) {
        if (purchasePrice === 0 || !purchasePrice) return 0;
        if (purchasePrice <= 100000)      return 50;
        if (purchasePrice <= 200000)      return 114;
        if (purchasePrice <= 300000)      return 727;
        if (purchasePrice <= 600000)      return 956;
        if (purchasePrice <= 800000)      return 1346;
        if (purchasePrice <= 1000000)     return 1546;
        if (purchasePrice <= 2000000)     return 1738;
        if (purchasePrice <= 4000000)     return 2408;
        if (purchasePrice <= 6000000)     return 2922;
        if (purchasePrice <= 8000000)     return 3480;
        if (purchasePrice <= 10000000)    return 4068;
        if (purchasePrice <= 15000000)    return 4844;
        if (purchasePrice <= 20000000)    return 5818;
        return 7751;
    },
    
    // Get comprehensive cost breakdown with detailed once-off costs
    getCostBreakdown(state) {
        const transferDuty = this.calculateTransferDuty(state.askingPrice);
        const transferFeesBase = this.calculateTransferFeesBase(state.askingPrice);
        const transferFeesWithVAT = Math.round(transferFeesBase * 1.15);
        const transferAdditionalFees = 2200;
        const transferFees = transferFeesWithVAT + transferAdditionalFees;
        
        const deedsOfficeFees = this.calculateDeedsOfficeFees(state.askingPrice);
        
        let bondBreakdown = {
            attorneyFeesBase: 0,
            attorneyFeesWithVAT: 0,
            deedsOfficeFee: 0,
            bankInitiationFee: 0,
            additionalFees: 0,
            total: 0
        };
        
        if (state.isBonded && state.loanAmount > 0) {
            bondBreakdown = this.calculateBondRegistrationBreakdown(state.loanAmount);
        }
        
        const monthlyBond = state.isBonded ? this.calculateMonthlyBondRepayment(state.loanAmount, state.interestRate, state.loanTerm) : 0;
        
        return {
            monthly: {
                bondRepayment: monthlyBond,
                ratesTaxes: state.ratesTaxes,
                waterLights: state.waterLights,
                levies: state.levies,
                total: monthlyBond + state.ratesTaxes + state.waterLights + state.levies
            },
            onceOff: {
                bond: {
                    attorneyFees: bondBreakdown.attorneyFeesWithVAT,
                    bankInitiation: bondBreakdown.bankInitiationFee,
                    deedsOfficeFees: bondBreakdown.deedsOfficeFee,
                    additionalFees: bondBreakdown.additionalFees,
                    total: bondBreakdown.total
                },
                transfer: {
                    attorneyFees: transferFeesWithVAT,
                    transferDuty: transferDuty,
                    deedsOfficeFees: deedsOfficeFees,
                    additionalFees: transferAdditionalFees,
                    total: transferDuty + transferFees + deedsOfficeFees
                },
                total: transferDuty + transferFees + deedsOfficeFees + bondBreakdown.total
            }
        };
    }
};

// Load saved calculator data for property
function loadCalculatorData(property) {
    const savedData = localStorage.getItem(`calculator_${property.id}`);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            Object.assign(costCalculatorState, data);
            console.log('✅ Calculator data loaded for property:', property.id);
        } catch (error) {
            console.error('❌ Error loading calculator data:', error);
        }
    } else {
        // Initialize with property data
        costCalculatorState.askingPrice = parseFloat(property.price?.replace(/\s/g, '') || 0);
        costCalculatorState.loanAmount = costCalculatorState.askingPrice;
    }
}

// Save calculator data for property
function saveCalculatorData(property) {
    try {
        localStorage.setItem(`calculator_${property.id}`, JSON.stringify(costCalculatorState));
        console.log('✅ Calculator data saved for property:', property.id);
    } catch (error) {
        console.error('❌ Error saving calculator data:', error);
    }
}

// Initialize Cost Calculator UI
function initializeCostCalculator(property) {
    loadCalculatorData(property);
    
    // If no saved data but property has price, initialize with property price
    if (!localStorage.getItem(`calculator_${property.id}`) && property.price) {
        const propertyPrice = parseFloat(property.price.replace(/\s/g, '') || 0);
        costCalculatorState.askingPrice = propertyPrice;
        costCalculatorState.loanAmount = propertyPrice;
    }
    
    const container = document.getElementById('costCalculatorContent');
    if (container) {
        container.innerHTML = renderCostCalculatorUI();
        updateCalculatedValues();
    }
}

// Render the complete cost calculator
function renderCostCalculatorUI() {
    const property = appState.currentProperty;
    const isComplex = property?.type === 'complex';
    
    return `
        <div class="cost-calculator-container">
            <!-- Input Section -->
            <div class="cost-input-section">
                <h4>
                    <i class="fas fa-calculator"></i>
                    Property Cost Calculator
                </h4>
                
                <div class="cost-form-grid">
                    <!-- Asking Price -->
                    <div class="cost-input-group">
                        <label class="cost-label">
                            Asking Price (R)
                            <button class="cost-info-btn" onclick="showCostInfo('asking-price')">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </label>
                        <input type="text" class="cost-input" id="askingPriceInput" 
                               value="${formatCurrency(costCalculatorState.askingPrice)}" 
                               oninput="formatNumberInput(this); updateAskingPrice(this.value)"
                               inputmode="numeric"
                               placeholder="e.g. 1 500 000">
                    </div>
                    
                    <!-- Bond Selection -->
                    <div class="cost-input-group">
                        <label class="cost-label">
                            Financed with Bond
                            <button class="cost-info-btn" onclick="showCostInfo('bond')">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </label>
                        <div class="bond-toggle">
                            <button class="bond-toggle-btn ${costCalculatorState.isBonded ? 'active' : ''}" 
                                    onclick="toggleBond(true)">Yes</button>
                            <button class="bond-toggle-btn ${!costCalculatorState.isBonded ? 'active' : ''}" 
                                    onclick="toggleBond(false)">No</button>
                        </div>
                    </div>
                    
                    ${costCalculatorState.isBonded ? `
                        <!-- Loan Amount -->
                        <div class="cost-input-group">
                            <label class="cost-label">
                                Loan Amount (R)
                                <button class="cost-info-btn" onclick="showCostInfo('loan-amount')">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </label>
                            <input type="text" class="cost-input" id="loanAmountInput"
                                   value="${formatCurrency(costCalculatorState.loanAmount)}"
                                   oninput="formatNumberInput(this); updateLoanAmount(this.value)"
                                   inputmode="numeric"
                                   placeholder="e.g. 1 350 000">
                        </div>
                        
                        <!-- Loan Term -->
                        <div class="cost-input-group">
                            <label class="cost-label">
                                Loan Term (Years)
                                <button class="cost-info-btn" onclick="showCostInfo('loan-term')">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </label>
                            <select class="cost-input" id="loanTermInput" onchange="updateLoanTerm(this.value)">
                                <option value="10" ${costCalculatorState.loanTerm === 10 ? 'selected' : ''}>10 years</option>
                                <option value="15" ${costCalculatorState.loanTerm === 15 ? 'selected' : ''}>15 years</option>
                                <option value="20" ${costCalculatorState.loanTerm === 20 ? 'selected' : ''}>20 years</option>
                                <option value="25" ${costCalculatorState.loanTerm === 25 ? 'selected' : ''}>25 years</option>
                                <option value="30" ${costCalculatorState.loanTerm === 30 ? 'selected' : ''}>30 years</option>
                            </select>
                        </div>
                        
                        <!-- Interest Rate -->
                        <div class="cost-input-group">
                            <label class="cost-label">
                                Interest Rate (%)
                                <button class="cost-info-btn" onclick="showCostInfo('interest-rate')">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </label>
                            <div class="interest-rate-input">
                                <input type="number" class="cost-input" id="interestRateInput"
                                       value="${costCalculatorState.interestRate}" step="0.25" min="5" max="25"
                                       oninput="updateInterestRate(this.value)">
                                <div class="interest-rate-slider">
                                    <input type="range" id="interestSlider" min="5" max="20" step="0.25"
                                           value="${costCalculatorState.interestRate}"
                                           oninput="updateInterestRate(this.value)">
                                    <div class="slider-labels">
                                        <span>5%</span>
                                        <span>20%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Rates & Taxes -->
                    <div class="cost-input-group">
                        <label class="cost-label">
                            Monthly Rates & Taxes (R)
                            <button class="cost-info-btn" onclick="showCostInfo('rates-taxes')">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </label>
                        <input type="number" class="cost-input" id="ratesTaxesInput"
                               value="${costCalculatorState.ratesTaxes}" min="0"
                               oninput="updateRatesTaxes(this.value)"
                               placeholder="e.g. 2500">
                    </div>
                    
                    <!-- Water & Lights -->
                    <div class="cost-input-group">
                        <label class="cost-label">
                            Monthly Water & Electricity (R)
                            <button class="cost-info-btn" onclick="showCostInfo('water-lights')">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </label>
                        <input type="number" class="cost-input" id="waterLightsInput"
                               value="${costCalculatorState.waterLights}" min="0"
                               oninput="updateWaterLights(this.value)"
                               placeholder="e.g. 1800">
                    </div>
                    
                    ${isComplex ? `
                        <!-- Levies (Complex only) -->
                        <div class="cost-input-group">
                            <label class="cost-label">
                                Monthly Levies (R)
                                <button class="cost-info-btn" onclick="showCostInfo('levies')">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </label>
                            <input type="number" class="cost-input" id="leviesInput"
                                   value="${costCalculatorState.levies}" min="0"
                                   oninput="updateLevies(this.value)"
                                   placeholder="e.g. 1200">
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Calculated Sections (will be updated dynamically) -->
            <div id="calculatedResults">
                <!-- Monthly and once-off sections rendered here -->
            </div>
        </div>
    `;
}

// Update only calculated values without re-rendering inputs
function updateCalculatedValues() {
    const costs = SAPropertyCostCalculator.getCostBreakdown(costCalculatorState);
    const property = appState.currentProperty;
    const isComplex = property?.type === 'complex';
    
    const calculatedResults = document.getElementById('calculatedResults');
    if (calculatedResults) {
        calculatedResults.innerHTML = `
            <!-- Monthly Cost Breakdown -->
            <div class="cost-section-container">
                <div class="cost-section-header" onclick="toggleCostSection('monthly')">
                    <div class="cost-section-title">
                        <i class="fas fa-calendar-alt"></i>
                        <h4>Monthly Cost Breakdown</h4>
                        <div class="cost-section-summary">R ${formatNumber(costs.monthly.total)}/month</div>
                    </div>
                    <div class="cost-section-toggle ${costCalculatorState.sectionsExpanded.monthly ? '' : 'collapsed'}">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="cost-section-content ${costCalculatorState.sectionsExpanded.monthly ? 'expanded' : 'collapsed'}">
                    <div class="cost-breakdown-grid">
                        ${costCalculatorState.isBonded ? `
                            <div class="cost-breakdown-item">
                                <div class="cost-item-info">
                                    <span class="cost-item-label">Bond Installment (${costCalculatorState.loanTerm} years)</span>
                                    <button class="cost-info-btn small" onclick="showCostInfo('bond-installment')">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                </div>
                                <div class="cost-item-amount">R ${formatNumber(costs.monthly.bondRepayment)}</div>
                            </div>
                        ` : ''}
                        
                        <div class="cost-breakdown-item">
                            <div class="cost-item-info">
                                <span class="cost-item-label">Rates & Taxes</span>
                            </div>
                            <div class="cost-item-amount">R ${formatNumber(costs.monthly.ratesTaxes)}</div>
                        </div>
                        
                        <div class="cost-breakdown-item">
                            <div class="cost-item-info">
                                <span class="cost-item-label">Water & Electricity</span>
                            </div>
                            <div class="cost-item-amount">R ${formatNumber(costs.monthly.waterLights)}</div>
                        </div>
                        
                        ${isComplex ? `
                            <div class="cost-breakdown-item">
                                <div class="cost-item-info">
                                    <span class="cost-item-label">Levies</span>
                                </div>
                                <div class="cost-item-amount">R ${formatNumber(costs.monthly.levies)}</div>
                            </div>
                        ` : ''}
                        
                        <div class="cost-breakdown-total">
                            <div class="cost-total-label">Total Monthly Cost</div>
                            <div class="cost-total-amount">R ${formatNumber(costs.monthly.total)}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Once-off Costs with Detailed Breakdown -->
            <div class="cost-section-container">
                <div class="cost-section-header" onclick="toggleCostSection('onceOff')">
                    <div class="cost-section-title">
                        <i class="fas fa-receipt"></i>
                        <h4>Once-off Costs</h4>
                        <div class="cost-section-summary">R ${formatNumber(costs.onceOff.total)}</div>
                    </div>
                    <div class="cost-section-toggle ${costCalculatorState.sectionsExpanded.onceOff ? '' : 'collapsed'}">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="cost-section-content ${costCalculatorState.sectionsExpanded.onceOff ? 'expanded' : 'collapsed'}">
                    <div class="cost-breakdown-grid">
                        
                        ${costCalculatorState.isBonded ? `
                            <!-- Bond Registration Breakdown -->
                            <div class="cost-subsection">
                                <div class="cost-subsection-header">
                                    <span class="subsection-title">Bond Registration Costs</span>
                                    <span class="subsection-total">R ${formatNumber(costs.onceOff.bond.total)}</span>
                                </div>
                                
                                <div class="cost-breakdown-item sub-item">
                                    <div class="cost-item-info">
                                        <span class="cost-item-label">Bond Attorney Fees (incl VAT)</span>
                                        <button class="cost-info-btn small" onclick="showCostInfo('bond-attorney-fees')">
                                            <i class="fas fa-info-circle"></i>
                                        </button>
                                    </div>
                                    <div class="cost-item-amount">R ${formatNumber(costs.onceOff.bond.attorneyFees)}</div>
                                </div>
                                
                                <div class="cost-breakdown-item sub-item">
                                    <div class="cost-item-info">
                                        <span class="cost-item-label">Bank Initiation Fee</span>
                                        <button class="cost-info-btn small" onclick="showCostInfo('bank-initiation')">
                                            <i class="fas fa-info-circle"></i>
                                        </button>
                                    </div>
                                    <div class="cost-item-amount">R ${formatNumber(costs.onceOff.bond.bankInitiation)}</div>
                                </div>
                                
                                <div class="cost-breakdown-item sub-item">
                                    <div class="cost-item-info">
                                        <span class="cost-item-label">Deeds Office Fees</span>
                                        <button class="cost-info-btn small" onclick="showCostInfo('bond-deeds-office')">
                                            <i class="fas fa-info-circle"></i>
                                        </button>
                                    </div>
                                    <div class="cost-item-amount">R ${formatNumber(costs.onceOff.bond.deedsOfficeFees)}</div>
                                </div>
                                
                                <div class="cost-breakdown-item sub-item">
                                    <div class="cost-item-info">
                                        <span class="cost-item-label">Postage, Petties & Other Fees</span>
                                        <button class="cost-info-btn small" onclick="showCostInfo('bond-additional-fees')">
                                            <i class="fas fa-info-circle"></i>
                                        </button>
                                    </div>
                                    <div class="cost-item-amount">R ${formatNumber(costs.onceOff.bond.additionalFees)}</div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Property Transfer Breakdown -->
                        <div class="cost-subsection">
                            <div class="cost-subsection-header">
                                <span class="subsection-title">Property Transfer Costs</span>
                                <span class="subsection-total">R ${formatNumber(costs.onceOff.transfer.total)}</span>
                            </div>
                            
                            <div class="cost-breakdown-item sub-item">
                                <div class="cost-item-info">
                                    <span class="cost-item-label">Transfer Attorney Fees (incl VAT)</span>
                                    <button class="cost-info-btn small" onclick="showCostInfo('transfer-attorney-fees')">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                </div>
                                <div class="cost-item-amount">R ${formatNumber(costs.onceOff.transfer.attorneyFees)}</div>
                            </div>
                            
                            <div class="cost-breakdown-item sub-item">
                                <div class="cost-item-info">
                                    <span class="cost-item-label">Transfer Duty</span>
                                    <button class="cost-info-btn small" onclick="showCostInfo('transfer-duty')">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                </div>
                                <div class="cost-item-amount">R ${formatNumber(costs.onceOff.transfer.transferDuty)}</div>
                            </div>
                            
                            <div class="cost-breakdown-item sub-item">
                                <div class="cost-item-info">
                                    <span class="cost-item-label">Deeds Office Fees</span>
                                    <button class="cost-info-btn small" onclick="showCostInfo('transfer-deeds-office')">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                </div>
                                <div class="cost-item-amount">R ${formatNumber(costs.onceOff.transfer.deedsOfficeFees)}</div>
                            </div>
                            
                            <div class="cost-breakdown-item sub-item">
                                <div class="cost-item-info">
                                    <span class="cost-item-label">Postage, Petties & Other Fees</span>
                                    <button class="cost-info-btn small" onclick="showCostInfo('transfer-additional-fees')">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                </div>
                                <div class="cost-item-amount">R ${formatNumber(costs.onceOff.transfer.additionalFees)}</div>
                            </div>
                        </div>
                        
                        <div class="cost-breakdown-total">
                            <div class="cost-total-label">Total Once-off Costs</div>
                            <div class="cost-total-amount">R ${formatNumber(costs.onceOff.total)}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Cost Summary -->
            <div class="cost-summary-container">
                <div class="cost-summary-grid">
                    <div class="cost-summary-item monthly">
                        <div class="cost-summary-label">Monthly Cost</div>
                        <div class="cost-summary-amount">R ${formatNumber(costs.monthly.total)}</div>
                    </div>
                    <div class="cost-summary-item once-off">
                        <div class="cost-summary-label">Once-off Costs</div>
                        <div class="cost-summary-amount">R ${formatNumber(costs.onceOff.total)}</div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Update functions - no longer re-render entire UI
function updateAskingPrice(value) {
    const numValue = parseFloat(value.replace(/\s/g, '') || 0);
    costCalculatorState.askingPrice = numValue;
    
    // Auto-update loan amount if bonded
    if (costCalculatorState.isBonded && numValue > 0) {
        costCalculatorState.loanAmount = numValue;
        const loanInput = document.getElementById('loanAmountInput');
        if (loanInput) {
            loanInput.value = formatCurrency(costCalculatorState.loanAmount);
        }
    }
    
    updateCalculatedValues();
    saveCalculatorData(appState.currentProperty);
}

function toggleBond(isBonded) {
    costCalculatorState.isBonded = isBonded;
    if (!isBonded) {
        costCalculatorState.loanAmount = 0;
    } else {
        costCalculatorState.loanAmount = costCalculatorState.askingPrice;
    }
    
    // Full re-render needed for bond toggle
    const container = document.getElementById('costCalculatorContent');
    if (container) {
        container.innerHTML = renderCostCalculatorUI();
        updateCalculatedValues();
    }
    saveCalculatorData(appState.currentProperty);
}

function updateLoanAmount(value) {
    costCalculatorState.loanAmount = parseFloat(value.replace(/\s/g, '') || 0);
    updateCalculatedValues();
    saveCalculatorData(appState.currentProperty);
}

function updateLoanTerm(value) {
    costCalculatorState.loanTerm = parseInt(value);
    updateCalculatedValues();
    saveCalculatorData(appState.currentProperty);
}

function updateInterestRate(value) {
    costCalculatorState.interestRate = parseFloat(value);
    
    // Sync slider and input
    const slider = document.getElementById('interestSlider');
    const input = document.getElementById('interestRateInput');
    if (slider && slider !== document.activeElement) slider.value = value;
    if (input && input !== document.activeElement) input.value = value;
    
    updateCalculatedValues();
    saveCalculatorData(appState.currentProperty);
}

function updateRatesTaxes(value) {
    costCalculatorState.ratesTaxes = parseFloat(value || 0);
    updateCalculatedValues();
    saveCalculatorData(appState.currentProperty);
}

function updateWaterLights(value) {
    costCalculatorState.waterLights = parseFloat(value || 0);
    updateCalculatedValues();
    saveCalculatorData(appState.currentProperty);
}

function updateLevies(value) {
    costCalculatorState.levies = parseFloat(value || 0);
    updateCalculatedValues();
    saveCalculatorData(appState.currentProperty);
}

function toggleCostSection(sectionId) {
    costCalculatorState.sectionsExpanded[sectionId] = !costCalculatorState.sectionsExpanded[sectionId];
    updateCalculatedValues();
    saveCalculatorData(appState.currentProperty);
}

// Enhanced info tooltips with all new items
function showCostInfo(infoType) {
    const costInfo = {
        'asking-price': 'The full purchase price of the property before any additional costs.',
        'bond': 'A home loan used to finance the property purchase. Most buyers use bonds to spread payments over 15-30 years.',
        'loan-amount': 'The amount borrowed from the bank. Typically 80-100% of the purchase price, depending on your deposit.',
        'loan-term': 'The number of years to repay the home loan. Shorter terms mean higher monthly payments but less interest paid overall.',
        'interest-rate': 'The annual interest rate on your home loan. The default is SA prime (10.25% as of May 2026). Banks typically offer prime minus 0.5% to 1% for strong applicants with a large deposit, and prime to prime plus 2% for average buyers. Adjust this to match your bank\'s actual offer.',
        'rates-taxes': 'Monthly municipal charges for the property, covering services like water, electricity, refuse collection, and property rates based on your home\'s value.',
        'water-lights': 'Monthly utility costs for water and electricity consumption. Varies by usage and municipal rates.',
        'levies': 'Monthly payments to the body corporate for sectional title properties. Covers maintenance of common areas, building insurance, and communal services.',
        'bond-installment': 'Your monthly home loan repayment, calculated based on loan amount, interest rate, and loan term.',
        'transfer-duty': 'Government tax paid to SARS when buying property. No transfer duty on properties up to R1,210,000. Rates above that: 3% (up to R1,663,800), 6% (up to R2,329,300), 8% (up to R2,994,800), 11% (up to R13,310,000), 13% above R13,310,000. Transfer duty does not apply if the seller is a VAT-registered developer — VAT at 15% applies instead.',
        
        // Bond Registration Breakdown
        'bond-attorney-fees': 'Legal fees charged by the bond attorney to register your home loan with the Deeds Office. Includes professional fees plus 15% VAT. Based on Law Society fee guidelines.',
        'bank-initiation': 'Once-off fee charged by the bank to set up and process your home loan application. Also covers credit checks and loan administration costs. Typically around R6,000.',
        'bond-deeds-office': 'Official government fees paid to the Deeds Office for registering your bond (mortgage) against the property title. Amount is based on your loan value.',
        'bond-additional-fees': 'Additional costs including postage for documents, petty cash expenses, FICA compliance costs, credit bureau checks, and other miscellaneous bond registration expenses.',
        
        // Transfer Breakdown
        'transfer-attorney-fees': 'Legal fees charged by the transfer attorney (conveyancer) to register the property into your name. Includes professional fees plus 15% VAT. Based on Law Society fee guidelines.',
        'transfer-deeds-office': 'Official government fees paid to the Deeds Office for registering the property transfer into your name. Amount is based on the purchase price.',
        'transfer-additional-fees': 'Additional costs including postage for documents, petty cash expenses, FICA compliance, municipal clearance certificate, rates clearance, and other transfer-related expenses.',
        
        // Legacy (for backwards compatibility)
        'transfer-fees': 'Conveyancing costs including attorney fees (Law Society tariff + VAT) and additional fees.',
        'bond-registration': 'Bond registration costs including Deeds Office fees, attorney fees (with VAT), bank initiation fee, and additional fees.',
        'deeds-office': 'Official government fees for registering property transfers and bonds at the Deeds Office.'
    };
    
    const title = infoType.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    showModal(title, costInfo[infoType] || 'Information not available.');
}

// Utility functions
function formatNumber(amount) {
    return Math.round(amount).toLocaleString('en-ZA').replace(/,/g, ' ');
}

function formatNumberInput(input) {
    let value = input.value.replace(/\s/g, '');
    
    if (value && !isNaN(value)) {
        const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        
        const cursorPosition = input.selectionStart;
        const originalLength = input.value.length;
        
        input.value = formatted;
        
        const newLength = formatted.length;
        const spacesAdded = newLength - originalLength;
        input.setSelectionRange(cursorPosition + spacesAdded, cursorPosition + spacesAdded);
    }
}

function formatCurrency(amount) {
    if (!amount || amount === 0) return '';
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Separate state for standalone calculator to prevent conflicts
const standaloneCostCalculatorState = {
    askingPrice: 0,
    isBonded: true,
    loanAmount: 0,
    loanTerm: 20,
    interestRate: 10.25,  // SA prime rate (SARB repo 6.75% + 3.5% margin, May 2026)
    ratesTaxes: 0,
    waterLights: 0,
    levies: 0,
    sectionsExpanded: {
        monthly: false,
        onceOff: false
    }
};

// Initialize standalone cost calculator (no property context)
function initializeStandaloneCostCalculator() {
    // Reset to default values for standalone use
    Object.assign(standaloneCostCalculatorState, {
        askingPrice: 0,
        isBonded: true,
        loanAmount: 0,
        loanTerm: 20,
        interestRate: 10.25,  // SA prime rate (SARB repo 6.75% + 3.5% margin, May 2026)
        ratesTaxes: 0,
        waterLights: 0,
        levies: 0,
        sectionsExpanded: {
            monthly: false,
            onceOff: false
        }
    });
    
    const container = document.getElementById('standaloneCostCalculator');
    if (container) {
        container.innerHTML = renderStandaloneCostCalculatorUI();
        updateCalculatedValuesStandalone();
    }
}

// Render standalone calculator
function renderStandaloneCostCalculatorUI() {
    return `
        <div class="cost-calculator-container">
            <div class="cost-input-section">
                <h4><i class="fas fa-calculator"></i> Property Cost Calculator</h4>
                <div class="cost-form-grid">
                    <!-- Property Type -->
                    <div class="cost-input-group">
                        <label class="cost-label">Property Type</label>
                        <select class="cost-input" id="propertyTypeSelect" onchange="updatePropertyTypeStandalone(this.value)">
                            <option value="house">House</option>
                            <option value="complex">Complex/Flat</option>
                        </select>
                    </div>
                    
                    <!-- Asking Price -->
                    <div class="cost-input-group">
                        <label class="cost-label">
                            Asking Price (R)
                            <button class="cost-info-btn" onclick="showCostInfo('asking-price')">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </label>
                        <input type="text" class="cost-input" id="askingPriceInput" 
                               value="${formatCurrency(standaloneCostCalculatorState.askingPrice)}" 
                               oninput="formatNumberInput(this); updateAskingPriceStandalone(this.value)"
                               inputmode="numeric"
                               placeholder="e.g. 1 500 000">
                    </div>
                    
                    <!-- Bond Selection -->
                    <div class="cost-input-group">
                        <label class="cost-label">
                            Financed with Bond
                            <button class="cost-info-btn" onclick="showCostInfo('bond')">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </label>
                        <div class="bond-toggle">
                            <button class="bond-toggle-btn ${standaloneCostCalculatorState.isBonded ? 'active' : ''}" 
                                    onclick="toggleBondStandalone(true)">Yes</button>
                            <button class="bond-toggle-btn ${!standaloneCostCalculatorState.isBonded ? 'active' : ''}" 
                                    onclick="toggleBondStandalone(false)">No</button>
                        </div>
                    </div>
                    
                    ${standaloneCostCalculatorState.isBonded ? `
                        <!-- Loan Amount -->
                        <div class="cost-input-group">
                            <label class="cost-label">
                                Loan Amount (R)
                                <button class="cost-info-btn" onclick="showCostInfo('loan-amount')">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </label>
                            <input type="text" class="cost-input" id="loanAmountInput"
                                   value="${formatCurrency(standaloneCostCalculatorState.loanAmount)}"
                                   oninput="formatNumberInput(this); updateLoanAmountStandalone(this.value)"
                                   inputmode="numeric"
                                   placeholder="e.g. 1 350 000">
                        </div>
                        
                        <!-- Loan Term -->
                        <div class="cost-input-group">
                            <label class="cost-label">
                                Loan Term (Years)
                                <button class="cost-info-btn" onclick="showCostInfo('loan-term')">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </label>
                            <select class="cost-input" id="loanTermInput" onchange="updateLoanTermStandalone(this.value)">
                                <option value="10" ${standaloneCostCalculatorState.loanTerm === 10 ? 'selected' : ''}>10 years</option>
                                <option value="15" ${standaloneCostCalculatorState.loanTerm === 15 ? 'selected' : ''}>15 years</option>
                                <option value="20" ${standaloneCostCalculatorState.loanTerm === 20 ? 'selected' : ''}>20 years</option>
                                <option value="25" ${standaloneCostCalculatorState.loanTerm === 25 ? 'selected' : ''}>25 years</option>
                                <option value="30" ${standaloneCostCalculatorState.loanTerm === 30 ? 'selected' : ''}>30 years</option>
                            </select>
                        </div>
                        
                        <!-- Interest Rate -->
                        <div class="cost-input-group">
                            <label class="cost-label">
                                Interest Rate (%)
                                <button class="cost-info-btn" onclick="showCostInfo('interest-rate')">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </label>
                            <div class="interest-rate-input">
                                <input type="number" class="cost-input" id="interestRateInputStandalone"
                                       value="${standaloneCostCalculatorState.interestRate}" step="0.25" min="5" max="25"
                                       oninput="updateInterestRateStandalone(this.value)">
                                <div class="interest-rate-slider">
                                    <input type="range" id="interestSliderStandalone" min="5" max="20" step="0.25"
                                           value="${standaloneCostCalculatorState.interestRate}"
                                           oninput="updateInterestRateStandalone(this.value)">
                                    <div class="slider-labels">
                                        <span>5%</span>
                                        <span>20%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Monthly Costs -->
                    <div class="cost-input-group">
                        <label class="cost-label">
                            Monthly Rates & Taxes (R)
                            <button class="cost-info-btn" onclick="showCostInfo('rates-taxes')">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </label>
                        <input type="number" class="cost-input" 
                               value="${standaloneCostCalculatorState.ratesTaxes || ''}" min="0"
                               oninput="updateRatesTaxesStandalone(this.value)" placeholder="e.g. 2500">
                    </div>
                    
                    <div class="cost-input-group">
                        <label class="cost-label">
                            Monthly Water & Electricity (R)
                            <button class="cost-info-btn" onclick="showCostInfo('water-lights')">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </label>
                        <input type="number" class="cost-input" 
                               value="${standaloneCostCalculatorState.waterLights || ''}" min="0"
                               oninput="updateWaterLightsStandalone(this.value)" placeholder="e.g. 1800">
                    </div>
                    
                    <div class="cost-input-group" id="leviesGroupStandalone" style="display: none;">
                        <label class="cost-label">
                            Monthly Levies (R)
                            <button class="cost-info-btn" onclick="showCostInfo('levies')">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </label>
                        <input type="number" class="cost-input" 
                               value="${standaloneCostCalculatorState.levies || ''}" min="0"
                               oninput="updateLeviesStandalone(this.value)" placeholder="e.g. 1200">
                    </div>
                </div>
            </div>
            
            <!-- Calculated Results Section -->
            <div id="calculatedResultsStandalone"></div>
        </div>
    `;
}

// Update calculated values for standalone (same structure as main calculator)
function updateCalculatedValuesStandalone() {
    const costs = SAPropertyCostCalculator.getCostBreakdown(standaloneCostCalculatorState);
    const calculatedResults = document.getElementById('calculatedResultsStandalone');
    if (calculatedResults) {
        calculatedResults.innerHTML = `
            <!-- Monthly Cost Breakdown -->
            <div class="cost-section-container">
                <div class="cost-section-header" onclick="toggleCostSectionStandalone('monthly')">
                    <div class="cost-section-title">
                        <i class="fas fa-calendar-alt"></i>
                        <h4>Monthly Cost Breakdown</h4>
                        <div class="cost-section-summary">R ${formatNumber(costs.monthly.total)}/month</div>
                    </div>
                    <div class="cost-section-toggle ${standaloneCostCalculatorState.sectionsExpanded.monthly ? '' : 'collapsed'}">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="cost-section-content ${standaloneCostCalculatorState.sectionsExpanded.monthly ? 'expanded' : 'collapsed'}">
                    <div class="cost-breakdown-grid">
                        ${standaloneCostCalculatorState.isBonded ? `
                            <div class="cost-breakdown-item">
                                <div class="cost-item-info">
                                    <span class="cost-item-label">Bond Installment (${standaloneCostCalculatorState.loanTerm} years)</span>
                                    <button class="cost-info-btn small" onclick="showCostInfo('bond-installment')">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                </div>
                                <div class="cost-item-amount">R ${formatNumber(costs.monthly.bondRepayment)}</div>
                            </div>
                        ` : ''}
                        
                        <div class="cost-breakdown-item">
                            <div class="cost-item-info">
                                <span class="cost-item-label">Rates & Taxes</span>
                            </div>
                            <div class="cost-item-amount">R ${formatNumber(costs.monthly.ratesTaxes)}</div>
                        </div>
                        
                        <div class="cost-breakdown-item">
                            <div class="cost-item-info">
                                <span class="cost-item-label">Water & Electricity</span>
                            </div>
                            <div class="cost-item-amount">R ${formatNumber(costs.monthly.waterLights)}</div>
                        </div>
                        
                        ${costs.monthly.levies > 0 ? `
                            <div class="cost-breakdown-item">
                                <div class="cost-item-info">
                                    <span class="cost-item-label">Levies</span>
                                </div>
                                <div class="cost-item-amount">R ${formatNumber(costs.monthly.levies)}</div>
                            </div>
                        ` : ''}
                        
                        <div class="cost-breakdown-total">
                            <div class="cost-total-label">Total Monthly Cost</div>
                            <div class="cost-total-amount">R ${formatNumber(costs.monthly.total)}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Once-off Costs with Detailed Breakdown -->
            <div class="cost-section-container">
                <div class="cost-section-header" onclick="toggleCostSectionStandalone('onceOff')">
                    <div class="cost-section-title">
                        <i class="fas fa-receipt"></i>
                        <h4>Once-off Costs</h4>
                        <div class="cost-section-summary">R ${formatNumber(costs.onceOff.total)}</div>
                    </div>
                    <div class="cost-section-toggle ${standaloneCostCalculatorState.sectionsExpanded.onceOff ? '' : 'collapsed'}">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="cost-section-content ${standaloneCostCalculatorState.sectionsExpanded.onceOff ? 'expanded' : 'collapsed'}">
                    <div class="cost-breakdown-grid">
                        
                        ${standaloneCostCalculatorState.isBonded ? `
                            <!-- Bond Registration Breakdown -->
                            <div class="cost-subsection">
                                <div class="cost-subsection-header">
                                    <span class="subsection-title">Bond Registration Costs</span>
                                    <span class="subsection-total">R ${formatNumber(costs.onceOff.bond.total)}</span>
                                </div>
                                
                                <div class="cost-breakdown-item sub-item">
                                    <div class="cost-item-info">
                                        <span class="cost-item-label">Bond Attorney Fees (incl VAT)</span>
                                        <button class="cost-info-btn small" onclick="showCostInfo('bond-attorney-fees')">
                                            <i class="fas fa-info-circle"></i>
                                        </button>
                                    </div>
                                    <div class="cost-item-amount">R ${formatNumber(costs.onceOff.bond.attorneyFees)}</div>
                                </div>
                                
                                <div class="cost-breakdown-item sub-item">
                                    <div class="cost-item-info">
                                        <span class="cost-item-label">Bank Initiation Fee</span>
                                        <button class="cost-info-btn small" onclick="showCostInfo('bank-initiation')">
                                            <i class="fas fa-info-circle"></i>
                                        </button>
                                    </div>
                                    <div class="cost-item-amount">R ${formatNumber(costs.onceOff.bond.bankInitiation)}</div>
                                </div>
                                
                                <div class="cost-breakdown-item sub-item">
                                    <div class="cost-item-info">
                                        <span class="cost-item-label">Deeds Office Fees</span>
                                        <button class="cost-info-btn small" onclick="showCostInfo('bond-deeds-office')">
                                            <i class="fas fa-info-circle"></i>
                                        </button>
                                    </div>
                                    <div class="cost-item-amount">R ${formatNumber(costs.onceOff.bond.deedsOfficeFees)}</div>
                                </div>
                                
                                <div class="cost-breakdown-item sub-item">
                                    <div class="cost-item-info">
                                        <span class="cost-item-label">Postage, Petties & Other Fees</span>
                                        <button class="cost-info-btn small" onclick="showCostInfo('bond-additional-fees')">
                                            <i class="fas fa-info-circle"></i>
                                        </button>
                                    </div>
                                    <div class="cost-item-amount">R ${formatNumber(costs.onceOff.bond.additionalFees)}</div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Property Transfer Breakdown -->
                        <div class="cost-subsection">
                            <div class="cost-subsection-header">
                                <span class="subsection-title">Property Transfer Costs</span>
                                <span class="subsection-total">R ${formatNumber(costs.onceOff.transfer.total)}</span>
                            </div>
                            
                            <div class="cost-breakdown-item sub-item">
                                <div class="cost-item-info">
                                    <span class="cost-item-label">Transfer Attorney Fees (incl VAT)</span>
                                    <button class="cost-info-btn small" onclick="showCostInfo('transfer-attorney-fees')">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                </div>
                                <div class="cost-item-amount">R ${formatNumber(costs.onceOff.transfer.attorneyFees)}</div>
                            </div>
                            
                            <div class="cost-breakdown-item sub-item">
                                <div class="cost-item-info">
                                    <span class="cost-item-label">Transfer Duty</span>
                                    <button class="cost-info-btn small" onclick="showCostInfo('transfer-duty')">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                </div>
                                <div class="cost-item-amount">R ${formatNumber(costs.onceOff.transfer.transferDuty)}</div>
                            </div>
                            
                            <div class="cost-breakdown-item sub-item">
                                <div class="cost-item-info">
                                    <span class="cost-item-label">Deeds Office Fees</span>
                                    <button class="cost-info-btn small" onclick="showCostInfo('transfer-deeds-office')">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                </div>
                                <div class="cost-item-amount">R ${formatNumber(costs.onceOff.transfer.deedsOfficeFees)}</div>
                            </div>
                            
                            <div class="cost-breakdown-item sub-item">
                                <div class="cost-item-info">
                                    <span class="cost-item-label">Postage, Petties & Other Fees</span>
                                    <button class="cost-info-btn small" onclick="showCostInfo('transfer-additional-fees')">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                </div>
                                <div class="cost-item-amount">R ${formatNumber(costs.onceOff.transfer.additionalFees)}</div>
                            </div>
                        </div>
                        
                        <div class="cost-breakdown-total">
                            <div class="cost-total-label">Total Once-off Costs</div>
                            <div class="cost-total-amount">R ${formatNumber(costs.onceOff.total)}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Cost Summary -->
            <div class="cost-summary-container">
                <div class="cost-summary-grid">
                    <div class="cost-summary-item monthly">
                        <div class="cost-summary-label">Monthly Cost</div>
                        <div class="cost-summary-amount">R ${formatNumber(costs.monthly.total)}</div>
                    </div>
                    <div class="cost-summary-item once-off">
                        <div class="cost-summary-label">Once-off Costs</div>
                        <div class="cost-summary-amount">R ${formatNumber(costs.onceOff.total)}</div>
                    </div>
                </div>
            </div>
            
            <div class="financial-disclaimer">
                <div class="disclaimer-box">
                    <h4>
                        <i class="fas fa-info-circle"></i>
                        Important Information
                    </h4>
                    <ul>
                        <li>All calculations are estimates based on current South African regulations</li>
                        <li>Interest rates may vary between banks and depend on your credit profile</li>
                        <li>Budget 8-10% of purchase price for additional costs</li>
                        <li>Consider a 105% bond to finance transfer costs</li>
                        <li>Consult with a mortgage originator for personalized quotes</li>
                    </ul>
                </div>
            </div>
        `;
    }
}

// Enhanced toggle function for standalone
function toggleCostSectionStandalone(sectionId) {
    standaloneCostCalculatorState.sectionsExpanded[sectionId] = !standaloneCostCalculatorState.sectionsExpanded[sectionId];
    updateCalculatedValuesStandalone();
}

// Update standalone functions with separate state
function updateAskingPriceStandalone(value) {
    const numValue = parseFloat(value.replace(/\s/g, '') || 0);
    standaloneCostCalculatorState.askingPrice = numValue;
    
    // Auto-update loan amount if bonded
    if (standaloneCostCalculatorState.isBonded && numValue > 0) {
        standaloneCostCalculatorState.loanAmount = numValue;
        const loanInput = document.getElementById('loanAmountInput');
        if (loanInput) {
            loanInput.value = formatCurrency(standaloneCostCalculatorState.loanAmount);
        }
    }
    
    updateCalculatedValuesStandalone();
}

function toggleBondStandalone(isBonded) {
    standaloneCostCalculatorState.isBonded = isBonded;
    if (!isBonded) {
        standaloneCostCalculatorState.loanAmount = 0;
    } else {
        standaloneCostCalculatorState.loanAmount = standaloneCostCalculatorState.askingPrice;
    }
    
    const container = document.getElementById('standaloneCostCalculator');
    if (container) {
        container.innerHTML = renderStandaloneCostCalculatorUI();
        updateCalculatedValuesStandalone();
    }
}

function updateLoanAmountStandalone(value) {
    standaloneCostCalculatorState.loanAmount = parseFloat(value.replace(/\s/g, '') || 0);
    updateCalculatedValuesStandalone();
}

function updateLoanTermStandalone(value) {
    standaloneCostCalculatorState.loanTerm = parseInt(value);
    updateCalculatedValuesStandalone();
}

function updateInterestRateStandalone(value) {
    standaloneCostCalculatorState.interestRate = parseFloat(value);
    
    // Sync slider and input with unique IDs
    const slider = document.getElementById('interestSliderStandalone');
    const input = document.getElementById('interestRateInputStandalone');
    if (slider && slider !== document.activeElement) slider.value = value;
    if (input && input !== document.activeElement) input.value = value;
    
    updateCalculatedValuesStandalone();
}

function updateRatesTaxesStandalone(value) {
    standaloneCostCalculatorState.ratesTaxes = parseFloat(value || 0);
    updateCalculatedValuesStandalone();
}

function updateWaterLightsStandalone(value) {
    standaloneCostCalculatorState.waterLights = parseFloat(value || 0);
    updateCalculatedValuesStandalone();
}

function updateLeviesStandalone(value) {
    standaloneCostCalculatorState.levies = parseFloat(value || 0);
    updateCalculatedValuesStandalone();
}

function updatePropertyTypeStandalone(type) {
    const leviesGroup = document.getElementById('leviesGroupStandalone');
    if (leviesGroup) {
        leviesGroup.style.display = type === 'complex' ? '' : 'none';
        if (type !== 'complex') {
            standaloneCostCalculatorState.levies = 0;
        }
    }
    updateCalculatedValuesStandalone();
}

// Export standalone functions
window.initializeStandaloneCostCalculator = initializeStandaloneCostCalculator;
window.updateAskingPriceStandalone = updateAskingPriceStandalone;
window.toggleBondStandalone = toggleBondStandalone;
window.updateLoanAmountStandalone = updateLoanAmountStandalone;
window.updateLoanTermStandalone = updateLoanTermStandalone;
window.updateInterestRateStandalone = updateInterestRateStandalone;
window.updateRatesTaxesStandalone = updateRatesTaxesStandalone;
window.updateWaterLightsStandalone = updateWaterLightsStandalone;
window.updateLeviesStandalone = updateLeviesStandalone;
window.updatePropertyTypeStandalone = updatePropertyTypeStandalone;
window.toggleCostSectionStandalone = toggleCostSectionStandalone;

// Export functions
window.initializeCostCalculator = initializeCostCalculator;
window.updateAskingPrice = updateAskingPrice;
window.toggleBond = toggleBond;
window.updateLoanAmount = updateLoanAmount;
window.updateLoanTerm = updateLoanTerm;
window.updateInterestRate = updateInterestRate;
window.updateRatesTaxes = updateRatesTaxes;
window.updateWaterLights = updateWaterLights;
window.updateLevies = updateLevies;
window.toggleCostSection = toggleCostSection;
window.showCostInfo = showCostInfo;
window.formatNumberInput = formatNumberInput;
window.formatCurrency = formatCurrency;