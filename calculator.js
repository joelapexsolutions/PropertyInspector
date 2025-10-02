/**
 * South African Property Cost Calculator - FIXED VERSION
 * Fixes keyboard closing issue and adds loan term + data persistence
 */

// South African Transfer Duty Rates (2024-2025)
const SA_TRANSFER_DUTY_BRACKETS = [
    { min: 0, max: 1100000, rate: 0 },
    { min: 1100001, max: 1512500, rate: 0.03 },
    { min: 1512501, max: 2250000, rate: 0.06 },
    { min: 2250001, max: Infinity, rate: 0.08 }
];

// Cost Calculator State
const costCalculatorState = {
    askingPrice: 0,
    isBonded: true,
    loanAmount: 0,
    loanTerm: 20, // Added loan term field
    interestRate: 11.75,
    ratesTaxes: 0,
    waterLights: 0,
    levies: 0,
    sectionsExpanded: {
        monthly: false,
        onceOff: false
    }
};

// SA Property Cost Calculator
const SAPropertyCostCalculator = {
    
    // Calculate transfer duty based on SA brackets
    calculateTransferDuty(purchasePrice) {
        if (purchasePrice === 0 || !purchasePrice) return 0;
        
        let totalDuty = 0;
        
        for (const bracket of SA_TRANSFER_DUTY_BRACKETS) {
            if (purchasePrice > bracket.min) {
                const taxableAmount = Math.min(purchasePrice, bracket.max) - bracket.min + 1;
                totalDuty += taxableAmount * bracket.rate;
            }
        }
        
        return Math.round(totalDuty);
    },
    
    // Calculate transfer attorney fees (based on SA Law Society guidelines + additional fees)
    calculateTransferFees(purchasePrice) {
        if (purchasePrice === 0 || !purchasePrice) return 0;
        
        let baseFees = 0;
        
        // Law Society tariff for conveyancing
        if (purchasePrice <= 300000) {
            baseFees = purchasePrice * 0.032;
        } else if (purchasePrice <= 600000) {
            baseFees = 9600 + (purchasePrice - 300000) * 0.027;
        } else if (purchasePrice <= 1000000) {
            baseFees = 17700 + (purchasePrice - 600000) * 0.024;
        } else if (purchasePrice <= 2000000) {
            baseFees = 27300 + (purchasePrice - 1000000) * 0.021;
        } else {
            baseFees = 48300 + (purchasePrice - 2000000) * 0.018;
        }
        
        // Add VAT (15%)
        const feesWithVAT = baseFees * 1.15;
        
        // Additional fees (combined)
        const additionalFees = 2600; // Postage, petties, FICA, searches, municipal clearance
        
        return Math.round(feesWithVAT + additionalFees);
    },
    
    // Calculate bond registration costs (comprehensive)
    calculateBondRegistrationCosts(loanAmount) {
        if (loanAmount === 0 || !loanAmount) return 0;
        
        // Deeds Office registration fees
        let deedsOfficeFee = 0;
        if (loanAmount <= 100000) {
            deedsOfficeFee = 750;
        } else if (loanAmount <= 300000) {
            deedsOfficeFee = 1500;
        } else if (loanAmount <= 600000) {
            deedsOfficeFee = 2250;
        } else if (loanAmount <= 1000000) {
            deedsOfficeFee = 3750;
        } else if (loanAmount <= 2000000) {
            deedsOfficeFee = 6000;
        } else {
            deedsOfficeFee = 9000;
        }
        
        // Attorney fees for bond registration
        let attorneyFees = 0;
        if (loanAmount <= 100000) {
            attorneyFees = 5750;
        } else if (loanAmount <= 500000) {
            attorneyFees = 5750 + (loanAmount - 100000) * 0.0345;
        } else if (loanAmount <= 1000000) {
            attorneyFees = 19550 + (loanAmount - 500000) * 0.0115;
        } else if (loanAmount <= 2000000) {
            attorneyFees = 25300 + (loanAmount - 1000000) * 0.0055;
        } else {
            attorneyFees = 30800 + (loanAmount - 2000000) * 0.0044;
        }
        
        // Add VAT to attorney fees (15%)
        attorneyFees = attorneyFees * 1.15;
        
        // Bank initiation fee + Additional fees (combined)
        const bankInitiationFee = 6000;
        const additionalFees = 1700; // Postage, petties, FICA, credit checks
        
        return Math.round(deedsOfficeFee + attorneyFees + bankInitiationFee + additionalFees);
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
    
    // Calculate deeds office fees for property transfer
    calculateDeedsOfficeFees(purchasePrice) {
        if (purchasePrice === 0 || !purchasePrice) return 0;
        
        if (purchasePrice <= 300000) return 750;
        if (purchasePrice <= 600000) return 1500;
        if (purchasePrice <= 1000000) return 2250;
        if (purchasePrice <= 2000000) return 3750;
        if (purchasePrice <= 4000000) return 6000;
        return 9000;
    },
    
    // Get comprehensive cost breakdown
    getCostBreakdown(state) {
        const transferDuty = this.calculateTransferDuty(state.askingPrice);
        const transferFees = this.calculateTransferFees(state.askingPrice);
        const bondCosts = state.isBonded ? this.calculateBondRegistrationCosts(state.loanAmount) : 0;
        const deedsOfficeFees = this.calculateDeedsOfficeFees(state.askingPrice);
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
                transferDuty: transferDuty,
                transferFees: transferFees,
                bondRegistration: bondCosts,
                deedsOfficeFees: deedsOfficeFees,
                total: transferDuty + transferFees + bondCosts + deedsOfficeFees
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
        costCalculatorState.loanAmount = propertyPrice; // Same amount as asking price
    }
    
    const container = document.getElementById('costCalculatorContent');
    if (container) {
        container.innerHTML = renderCostCalculatorUI();
        updateCalculatedValues();
    }
}

// Render the complete cost calculator - FIXED VERSION
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
            
            <!-- Once-off Costs -->
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
                        <div class="cost-breakdown-item">
                            <div class="cost-item-info">
                                <span class="cost-item-label">Transfer Duty</span>
                                <button class="cost-info-btn small" onclick="showCostInfo('transfer-duty')">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </div>
                            <div class="cost-item-amount">R ${formatNumber(costs.onceOff.transferDuty)}</div>
                        </div>
                        
                        <div class="cost-breakdown-item">
                            <div class="cost-item-info">
                                <span class="cost-item-label">Transfer Attorney Fees</span>
                                <button class="cost-info-btn small" onclick="showCostInfo('transfer-fees')">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </div>
                            <div class="cost-item-amount">R ${formatNumber(costs.onceOff.transferFees)}</div>
                        </div>
                        
                        ${costCalculatorState.isBonded ? `
                            <div class="cost-breakdown-item">
                                <div class="cost-item-info">
                                    <span class="cost-item-label">Bond Registration Costs</span>
                                    <button class="cost-info-btn small" onclick="showCostInfo('bond-registration')">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                </div>
                                <div class="cost-item-amount">R ${formatNumber(costs.onceOff.bondRegistration)}</div>
                            </div>
                        ` : ''}
                        
                        <div class="cost-breakdown-item">
                            <div class="cost-item-info">
                                <span class="cost-item-label">Deeds Office Fees</span>
                                <button class="cost-info-btn small" onclick="showCostInfo('deeds-office')">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </div>
                            <div class="cost-item-amount">R ${formatNumber(costs.onceOff.deedsOfficeFees)}</div>
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

// FIXED Update functions - no longer re-render entire UI
function updateAskingPrice(value) {
    const numValue = parseFloat(value.replace(/\s/g, '') || 0);
    costCalculatorState.askingPrice = numValue;
    
    // Auto-update loan amount if bonded
    if (costCalculatorState.isBonded && numValue > 0) {
        costCalculatorState.loanAmount = numValue; // Same amount, not 90%
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

// Enhanced info tooltips
function showCostInfo(infoType) {
    const costInfo = {
        'asking-price': 'The full purchase price of the property before any additional costs.',
        'bond': 'A home loan used to finance the property purchase. Most buyers use bonds to spread payments over 15-30 years.',
        'loan-amount': 'The amount borrowed from the bank. Typically 80-100% of the purchase price, depending on your deposit.',
        'loan-term': 'The number of years to repay the home loan. Shorter terms mean higher monthly payments but less interest paid overall.',
        'interest-rate': 'The annual interest rate on your home loan. Banks may offer rates from prime minus 0.5% to prime plus 2%.',
        'rates-taxes': 'Monthly municipal charges for the property, covering services like water, electricity, refuse collection, and property rates based on your home\'s value.',
        'water-lights': 'Monthly utility costs for water and electricity consumption. Varies by usage and municipal rates.',
        'levies': 'Monthly payments to the body corporate for sectional title properties. Covers maintenance of common areas, building insurance, and communal services.',
        'bond-installment': 'Your monthly home loan repayment, calculated based on loan amount, interest rate, and loan term.',
        'transfer-duty': 'Government tax paid to SARS when buying property. Properties under R1.1 million are exempt. Rates: 3% (R1.1M-R1.5M), 6% (R1.5M-R2.25M), 8% (above R2.25M). Note: Transfer duty can be excluded from the calculation if not applicable, e.g. if the seller is a registered VAT Vendor.',
        'transfer-fees': 'Conveyancing costs including attorney fees (Law Society tariff + VAT) and additional fees covering postage, petties and other application fees.',
        'bond-registration': 'Bond registration costs including Deeds Office fees, attorney fees (with VAT), bank initiation fee (R6,000), and additional fees covering postage, petties and other application fees.',
        'deeds-office': 'Official government fees for registering property transfers and bonds at the Deeds Office, based on property/loan value.'
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
    interestRate: 11.75,
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
        interestRate: 11.75,
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

// Render standalone calculator with exact same structure as main calculator
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

// Fixed updateCalculatedValuesStandalone with complete breakdown sections
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
            
            <!-- Once-off Costs -->
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
                        <div class="cost-breakdown-item">
                            <div class="cost-item-info">
                                <span class="cost-item-label">Transfer Duty</span>
                                <button class="cost-info-btn small" onclick="showCostInfo('transfer-duty')">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </div>
                            <div class="cost-item-amount">R ${formatNumber(costs.onceOff.transferDuty)}</div>
                        </div>
                        
                        <div class="cost-breakdown-item">
                            <div class="cost-item-info">
                                <span class="cost-item-label">Transfer Attorney Fees</span>
                                <button class="cost-info-btn small" onclick="showCostInfo('transfer-fees')">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </div>
                            <div class="cost-item-amount">R ${formatNumber(costs.onceOff.transferFees)}</div>
                        </div>
                        
                        ${standaloneCostCalculatorState.isBonded ? `
                            <div class="cost-breakdown-item">
                                <div class="cost-item-info">
                                    <span class="cost-item-label">Bond Registration Costs</span>
                                    <button class="cost-info-btn small" onclick="showCostInfo('bond-registration')">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                </div>
                                <div class="cost-item-amount">R ${formatNumber(costs.onceOff.bondRegistration)}</div>
                            </div>
                        ` : ''}
                        
                        <div class="cost-breakdown-item">
                            <div class="cost-item-info">
                                <span class="cost-item-label">Deeds Office Fees</span>
                                <button class="cost-info-btn small" onclick="showCostInfo('deeds-office')">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </div>
                            <div class="cost-item-amount">R ${formatNumber(costs.onceOff.deedsOfficeFees)}</div>
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
        standaloneCostCalculatorState.loanAmount = numValue; // Same amount, not 90%
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

// Enhanced cost info function with user-friendly explanations
function showCostInfo(infoType) {
    const costInfo = {
        'asking-price': 'The full purchase price of the property before any additional costs.',
        'bond': 'A home loan used to finance the property purchase. Most buyers use bonds to spread payments over 15-30 years.',
        'loan-amount': 'The amount borrowed from the bank. Typically 80-100% of the purchase price, depending on your deposit.',
        'loan-term': 'The number of years to repay the home loan. Shorter terms mean higher monthly payments but less interest paid overall.',
        'interest-rate': 'The annual interest rate on your home loan. Banks may offer prime minus rates to good clients.',
        'rates-taxes': 'Monthly municipal charges for the property, covering services like water, electricity, refuse collection, and property rates based on your home\'s value.',
        'water-lights': 'Monthly utility costs for water and electricity consumption. Varies by usage and municipal rates.',
        'levies': 'Monthly payments to the body corporate for sectional title properties. Covers maintenance of common areas, building insurance, and communal services.',
        'bond-installment': 'Your monthly home loan repayment, calculated based on loan amount, interest rate, and loan term.',
        'transfer-duty': 'Government tax paid to SARS when buying property. Properties under R1.1 million are exempt from transfer duty. The rate increases on a sliding scale based on the property value.',
        'transfer-fees': 'Legal fees paid to the transferring attorney who registers the property into your name. These costs are regulated by the Law Society and are based on the property value.',
        'bond-registration': 'Legal costs to register your bond at the Deeds Office. This includes attorney fees, registration fees, and bank initiation fees. Only applies if you\'re buying with a home loan.',
        'deeds-office': 'Official government fees charged by the Deeds Office for registering the property transfer and bond. This amount is based on the purchase price and is paid to the registering attorneys.'
    };
    
    const title = infoType.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    showModal(title, costInfo[infoType] || 'Information not available.');
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
