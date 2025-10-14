/**
 * Property Inspector - Website Calculator
 * UPDATED VERSION - Matches App Calculator with Fixed Rates
 */

// SA Transfer Duty Brackets (2024-2025) - FIXED
const transferDutyBrackets = [
    { min: 0, max: 1100000, rate: 0 },
    { min: 1100001, max: 1512500, rate: 0.03 },
    { min: 1512501, max: 2100000, rate: 0.044 },  // FIXED from 0.06
    { min: 2100001, max: Infinity, rate: 0.08 }
];

// Calculator state
const calcState = {
    purchasePrice: 0,
    deposit: 0,
    loanAmount: 0,
    interestRate: 11.75,
    loanTerm: 20,
    hasBond: true,
    monthlyRates: 0,
    monthlyUtilities: 0,
    sectionsExpanded: {
        monthly: false,
        onceOff: false
    }
};

/**
 * Initialize calculator on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    const calcContainer = document.getElementById('propertyCalculator');
    if (calcContainer) {
        renderCalculator();
        calculateAll();
    }
});

/**
 * Render calculator UI
 */
function renderCalculator() {
    const container = document.getElementById('propertyCalculator');
    container.innerHTML = `
        <div class="calculator-container">
            <!-- Inputs Section -->
            <div class="calc-section">
                <h3><i class="fas fa-home"></i> Property Details</h3>
                <div class="calc-form-grid">
                    <div class="calc-input-group">
                        <label class="calc-label">
                            Purchase Price (R)
                            <i class="fas fa-info-circle calc-info-icon" title="Total property purchase price"></i>
                        </label>
                        <input type="text" class="calc-input" id="purchasePrice" 
                               placeholder="e.g. 1 500 000" 
                               oninput="handlePriceInput(this, 'purchasePrice')">
                    </div>
                    
                    <div class="calc-input-group">
                        <label class="calc-label">
                            Deposit Amount (R)
                            <i class="fas fa-info-circle calc-info-icon" title="Cash deposit - typically 10-20%"></i>
                        </label>
                        <input type="text" class="calc-input" id="deposit" 
                               placeholder="e.g. 150 000" 
                               oninput="handlePriceInput(this, 'deposit')">
                    </div>
                    
                    <div class="calc-input-group">
                        <label class="calc-label">
                            Loan Amount (R)
                            <i class="fas fa-info-circle calc-info-icon" title="Auto-calculated or enter manually"></i>
                        </label>
                        <input type="text" class="calc-input" id="loanAmount" 
                               placeholder="e.g. 1 350 000"
                               oninput="handlePriceInput(this, 'loanAmount')">
                    </div>
                </div>
            </div>
            
            <!-- Bond Section -->
            <div class="calc-section" id="bondSection">
                <h3><i class="fas fa-university"></i> Home Loan</h3>
                <div class="calc-form-grid">
                    <div class="calc-input-group">
                        <label class="calc-label">Financing with Bond?</label>
                        <div class="calc-toggle">
                            <button class="calc-toggle-btn active" onclick="toggleBond(true)">Yes</button>
                            <button class="calc-toggle-btn" onclick="toggleBond(false)">No</button>
                        </div>
                    </div>
                    
                    <div class="calc-input-group" id="loanTermGroup">
                        <label class="calc-label">Loan Term</label>
                        <select class="calc-select" id="loanTerm" onchange="updateLoanTerm(this.value)">
                            <option value="10">10 years</option>
                            <option value="15">15 years</option>
                            <option value="20" selected>20 years</option>
                            <option value="25">25 years</option>
                            <option value="30">30 years</option>
                        </select>
                    </div>
                    
                    <div class="calc-input-group" id="interestGroup">
                        <label class="calc-label">
                            Interest Rate: <span id="rateDisplay">11.75%</span>
                        </label>
                        <div class="calc-slider-group">
                            <input type="range" class="calc-slider" id="interestRate" 
                                   min="5" max="20" step="0.25" value="11.75"
                                   oninput="updateInterestRate(this.value)">
                            <div class="slider-labels">
                                <span>5%</span>
                                <span>20%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Monthly Costs -->
            <div class="calc-section">
                <h3><i class="fas fa-calendar-alt"></i> Monthly Costs</h3>
                <div class="calc-form-grid">
                    <div class="calc-input-group">
                        <label class="calc-label">
                            Rates & Taxes (R)
                            <i class="fas fa-info-circle calc-info-icon" title="Monthly municipal charges"></i>
                        </label>
                        <input type="number" class="calc-input" id="monthlyRates" 
                               placeholder="e.g. 2500" 
                               oninput="updateValue('monthlyRates', this.value)">
                    </div>
                    
                    <div class="calc-input-group">
                        <label class="calc-label">
                            Water & Electricity (R)
                            <i class="fas fa-info-circle calc-info-icon" title="Estimated monthly utilities"></i>
                        </label>
                        <input type="number" class="calc-input" id="monthlyUtilities" 
                               placeholder="e.g. 1800" 
                               oninput="updateValue('monthlyUtilities', this.value)">
                    </div>
                </div>
            </div>
            
            <!-- Results -->
            <div class="calc-results" id="calcResults"></div>
            
            <!-- Disclaimer -->
            <div class="calc-disclaimer">
                <p>
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Results are estimates based on current SA regulations (2024-2025). Interest rates vary by bank and credit profile. Consult with financial advisors and attorneys for accurate quotes.</span>
                </p>
            </div>
        </div>
    `;
}

/**
 * Calculate transfer duty - FIXED
 */
function calculateTransferDuty() {
    if (calcState.purchasePrice <= 0) return 0;
    
    let duty = 0;
    for (const bracket of transferDutyBrackets) {
        if (calcState.purchasePrice > bracket.min) {
            const taxable = Math.min(calcState.purchasePrice, bracket.max) - bracket.min + 1;
            duty += taxable * bracket.rate;
        }
    }
    return Math.round(duty);
}

/**
 * Calculate base transfer attorney fees - FIXED
 */
function calculateTransferFeesBase() {
    if (calcState.purchasePrice <= 0) return 0;
    
    let baseFees = 0;
    const price = calcState.purchasePrice;
    
    // Market-aligned transfer attorney fees (2024/2025 rates)
    if (price <= 500000) {
        baseFees = price * 0.026;
    } else if (price <= 1000000) {
        baseFees = 13000 + (price - 500000) * 0.022;
    } else if (price <= 2000000) {
        baseFees = 24000 + (price - 1000000) * 0.0108;  // OPTIMIZED for accuracy
    } else if (price <= 4000000) {
        baseFees = 34800 + (price - 2000000) * 0.0092;
    } else {
        baseFees = 53200 + (price - 4000000) * 0.0075;
    }
    
    return Math.round(baseFees);
}

/**
 * Calculate transfer fees breakdown - FIXED to return zeros when no purchase price
 */
function calculateTransferFeesBreakdown() {
    // Return zeros if no purchase price
    if (calcState.purchasePrice <= 0) {
        return {
            attorneyFees: 0,
            deedsOfficeFees: 0,
            additionalFees: 0,
            total: 0
        };
    }
    
    const baseFees = calculateTransferFeesBase();
    const feesWithVAT = Math.round(baseFees * 1.15);
    const additionalFees = 2200;
    const deedsOfficeFees = calculateDeedsOfficeFees();
    
    return {
        attorneyFees: feesWithVAT,
        deedsOfficeFees: deedsOfficeFees,
        additionalFees: additionalFees,
        total: feesWithVAT + deedsOfficeFees + additionalFees
    };
}

/**
 * Calculate deeds office fees for transfer - FIXED
 */
function calculateDeedsOfficeFees() {
    if (calcState.purchasePrice <= 0) return 0;
    
    const price = calcState.purchasePrice;
    
    if (price <= 600000) return 950;
    if (price <= 1500000) return 1500;
    if (price <= 3000000) return 1650;
    if (price <= 6000000) return 2200;
    if (price <= 10000000) return 3300;
    return 4400;
}

/**
 * Calculate bond registration costs breakdown
 */
function calculateBondCostsBreakdown() {
    if (calcState.loanAmount <= 0) return {
        attorneyFees: 0,
        bankInitiation: 0,
        deedsOfficeFees: 0,
        additionalFees: 0,
        total: 0
    };
    
    const loan = calcState.loanAmount;
    let deedsOfficeFee = 0;
    let attorneyFeesBase = 0;
    
    // Deeds office fees
    if (loan <= 100000) deedsOfficeFee = 750;
    else if (loan <= 300000) deedsOfficeFee = 1500;
    else if (loan <= 600000) deedsOfficeFee = 2250;
    else if (loan <= 1000000) deedsOfficeFee = 3750;
    else if (loan <= 2000000) deedsOfficeFee = 6000;
    else deedsOfficeFee = 9000;
    
    // Attorney fees
    if (loan <= 100000) {
        attorneyFeesBase = 5750;
    } else if (loan <= 500000) {
        attorneyFeesBase = 5750 + (loan - 100000) * 0.0345;
    } else if (loan <= 1000000) {
        attorneyFeesBase = 19550 + (loan - 500000) * 0.0115;
    } else if (loan <= 2000000) {
        attorneyFeesBase = 25300 + (loan - 1000000) * 0.0055;
    } else {
        attorneyFeesBase = 30800 + (loan - 2000000) * 0.0044;
    }
    
    const attorneyFeesWithVAT = Math.round(attorneyFeesBase * 1.15);
    const bankInitiation = 6000;
    const additionalFees = 2000;
    
    return {
        attorneyFees: attorneyFeesWithVAT,
        bankInitiation: bankInitiation,
        deedsOfficeFees: deedsOfficeFee,
        additionalFees: additionalFees,
        total: attorneyFeesWithVAT + bankInitiation + deedsOfficeFee + additionalFees
    };
}

/**
 * Calculate monthly bond repayment
 */
function calculateMonthlyBond() {
    if (calcState.loanAmount <= 0) return 0;
    
    const monthlyRate = calcState.interestRate / 100 / 12;
    const numPayments = calcState.loanTerm * 12;
    
    const payment = calcState.loanAmount * 
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
        (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    return Math.round(payment);
}

/**
 * Calculate all values and render - FIXED to show empty state when no inputs
 */
function calculateAll() {
    // Show empty state if no purchase price
    if (calcState.purchasePrice <= 0) {
        renderEmptyState();
        return;
    }
    
    const monthlyBond = calcState.hasBond ? calculateMonthlyBond() : 0;
    const transferDuty = calculateTransferDuty();
    const transferBreakdown = calculateTransferFeesBreakdown();
    const bondBreakdown = calcState.hasBond ? calculateBondCostsBreakdown() : {
        attorneyFees: 0,
        bankInitiation: 0,
        deedsOfficeFees: 0,
        additionalFees: 0,
        total: 0
    };
    
    const results = {
        monthlyBond: monthlyBond,
        transferDuty: transferDuty,
        transferBreakdown: transferBreakdown,
        bondBreakdown: bondBreakdown,
        totalOnceCoff: transferDuty + transferBreakdown.total + bondBreakdown.total,
        totalMonthly: monthlyBond + calcState.monthlyRates + calcState.monthlyUtilities
    };
    
    renderResults(results);
}

/**
 * Render empty state when no inputs
 */
function renderEmptyState() {
    const container = document.getElementById('calcResults');
    container.innerHTML = `
        <div class="calc-empty-state">
            <div class="empty-state-icon">
                <i class="fas fa-calculator"></i>
            </div>
            <h3>Enter Property Details Above</h3>
            <p>Fill in the purchase price to calculate your property costs</p>
        </div>
    `;
}

/**
 * Render results with detailed breakdown
 */
function renderResults(results) {
    const container = document.getElementById('calcResults');
    container.innerHTML = `
        <h3><i class="fas fa-chart-line"></i> Your Property Costs</h3>
        
        <!-- Summary Cards -->
        <div class="results-grid">
            <div class="result-card primary">
                <div class="result-label">Total Monthly</div>
                <div class="result-amount">R ${formatNumber(results.totalMonthly)}</div>
                <div class="result-description">per month</div>
            </div>
            
            <div class="result-card">
                <div class="result-label">Once-off Costs</div>
                <div class="result-amount">R ${formatNumber(results.totalOnceCoff)}</div>
                <div class="result-description">at purchase</div>
            </div>
            
            ${calcState.hasBond ? `
            <div class="result-card">
                <div class="result-label">Bond Repayment</div>
                <div class="result-amount">R ${formatNumber(results.monthlyBond)}</div>
                <div class="result-description">${calcState.loanTerm} years</div>
            </div>
            ` : ''}
        </div>
        
        <!-- Monthly Breakdown -->
        <div class="calc-breakdown">
            <div class="breakdown-header" onclick="toggleSection('monthly')">
                <h4><i class="fas fa-calendar-alt"></i> Monthly Cost Breakdown</h4>
                <div class="breakdown-toggle ${calcState.sectionsExpanded.monthly ? '' : 'collapsed'}">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
            <div class="breakdown-content ${calcState.sectionsExpanded.monthly ? 'expanded' : 'collapsed'}">
                <ul class="breakdown-list">
                    ${calcState.hasBond ? `
                    <li class="breakdown-item">
                        <span class="breakdown-label">Bond Payment (${calcState.loanTerm} years)</span>
                        <span class="breakdown-value">R ${formatNumber(results.monthlyBond)}</span>
                    </li>
                    ` : ''}
                    <li class="breakdown-item">
                        <span class="breakdown-label">Rates & Taxes</span>
                        <span class="breakdown-value">R ${formatNumber(calcState.monthlyRates)}</span>
                    </li>
                    <li class="breakdown-item">
                        <span class="breakdown-label">Water & Electricity</span>
                        <span class="breakdown-value">R ${formatNumber(calcState.monthlyUtilities)}</span>
                    </li>
                    <li class="breakdown-item breakdown-total">
                        <span class="breakdown-label">Total Monthly Cost</span>
                        <span class="breakdown-value">R ${formatNumber(results.totalMonthly)}</span>
                    </li>
                </ul>
            </div>
        </div>
        
        <!-- Once-off Costs with Detailed Breakdown -->
        <div class="calc-breakdown">
            <div class="breakdown-header" onclick="toggleSection('onceOff')">
                <h4><i class="fas fa-receipt"></i> Once-off Costs Breakdown</h4>
                <div class="breakdown-toggle ${calcState.sectionsExpanded.onceOff ? '' : 'collapsed'}">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
            <div class="breakdown-content ${calcState.sectionsExpanded.onceOff ? 'expanded' : 'collapsed'}">
                
                ${calcState.hasBond && results.bondBreakdown.total > 0 ? `
                <!-- Bond Registration Costs Subsection -->
                <div class="breakdown-subsection">
                    <div class="subsection-header">
                        <span class="subsection-title">Bond Registration Costs</span>
                        <span class="subsection-total">R ${formatNumber(results.bondBreakdown.total)}</span>
                    </div>
                    <ul class="breakdown-list sub-list">
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">
                                Bond Attorney Fees (incl VAT)
                                <i class="fas fa-info-circle calc-info-icon" title="Legal fees to register your bond with the Deeds Office"></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(results.bondBreakdown.attorneyFees)}</span>
                        </li>
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">
                                Bank Initiation Fee
                                <i class="fas fa-info-circle calc-info-icon" title="Bank fee to set up and process your home loan"></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(results.bondBreakdown.bankInitiation)}</span>
                        </li>
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">
                                Deeds Office Fees
                                <i class="fas fa-info-circle calc-info-icon" title="Government fees for bond registration"></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(results.bondBreakdown.deedsOfficeFees)}</span>
                        </li>
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">
                                Postage, Petties & Other Fees
                                <i class="fas fa-info-circle calc-info-icon" title="Additional costs: postage, FICA, credit checks, etc."></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(results.bondBreakdown.additionalFees)}</span>
                        </li>
                    </ul>
                </div>
                ` : ''}
                
                <!-- Property Transfer Costs Subsection -->
                <div class="breakdown-subsection">
                    <div class="subsection-header">
                        <span class="subsection-title">Property Transfer Costs</span>
                        <span class="subsection-total">R ${formatNumber(results.transferBreakdown.total + results.transferDuty)}</span>
                    </div>
                    <ul class="breakdown-list sub-list">
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">
                                Transfer Attorney Fees (incl VAT)
                                <i class="fas fa-info-circle calc-info-icon" title="Legal fees to transfer property into your name"></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(results.transferBreakdown.attorneyFees)}</span>
                        </li>
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">
                                Transfer Duty
                                <i class="fas fa-info-circle calc-info-icon" title="Government tax on property transfer. Rates: 0% (under R1.1M), 3% (R1.1M-R1.5M), 4.4% (R1.5M-R2.1M), 8% (above R2.1M)"></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(results.transferDuty)}</span>
                        </li>
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">
                                Deeds Office Fees
                                <i class="fas fa-info-circle calc-info-icon" title="Government fees for property registration"></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(results.transferBreakdown.deedsOfficeFees)}</span>
                        </li>
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">
                                Postage, Petties & Other Fees
                                <i class="fas fa-info-circle calc-info-icon" title="Additional costs: postage, FICA, municipal clearance, etc."></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(results.transferBreakdown.additionalFees)}</span>
                        </li>
                    </ul>
                </div>
                
                <ul class="breakdown-list">
                    <li class="breakdown-item breakdown-total">
                        <span class="breakdown-label">Total Once-off Costs</span>
                        <span class="breakdown-value">R ${formatNumber(results.totalOnceCoff)}</span>
                    </li>
                </ul>
            </div>
        </div>
    `;
}

/**
 * Toggle section expand/collapse
 */
function toggleSection(sectionId) {
    calcState.sectionsExpanded[sectionId] = !calcState.sectionsExpanded[sectionId];
    calculateAll();
}

/**
 * Handle price input with formatting - FIXED for editable loan amount
 */
function handlePriceInput(input, field) {
    let value = input.value.replace(/\s/g, '');
    
    if (value && !isNaN(value)) {
        calcState[field] = parseFloat(value);
        
        // Auto-calculate loan amount ONLY if user is changing purchase price or deposit
        // Don't override if user manually edits loan amount
        if (field === 'purchasePrice' || field === 'deposit') {
            const autoLoanAmount = Math.max(0, calcState.purchasePrice - calcState.deposit);
            
            // Only update if loan amount input is empty or hasn't been manually changed
            const loanAmountInput = document.getElementById('loanAmount');
            if (loanAmountInput && (loanAmountInput.value === '' || calcState.loanAmount === 0)) {
                calcState.loanAmount = autoLoanAmount;
                loanAmountInput.value = autoLoanAmount > 0 ? formatNumber(autoLoanAmount) : '';
            }
        }
        
        // Format with spaces
        input.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        calculateAll();
    } else {
        calcState[field] = 0;
        
        // Clear loan amount if purchase price is cleared
        if (field === 'purchasePrice') {
            calcState.loanAmount = 0;
            const loanAmountInput = document.getElementById('loanAmount');
            if (loanAmountInput) {
                loanAmountInput.value = '';
            }
        }
        
        calculateAll();
    }
}

/**
 * Toggle bond financing
 */
function toggleBond(hasBond) {
    calcState.hasBond = hasBond;
    
    const buttons = document.querySelectorAll('.calc-toggle-btn');
    buttons.forEach((btn, i) => {
        btn.classList.toggle('active', i === (hasBond ? 0 : 1));
    });
    
    // Show/hide bond fields
    const loanGroup = document.getElementById('loanTermGroup');
    const interestGroup = document.getElementById('interestGroup');
    
    if (loanGroup && interestGroup) {
        loanGroup.style.display = hasBond ? 'flex' : 'none';
        interestGroup.style.display = hasBond ? 'flex' : 'none';
    }
    
    calculateAll();
}

/**
 * Update interest rate
 */
function updateInterestRate(value) {
    calcState.interestRate = parseFloat(value);
    document.getElementById('rateDisplay').textContent = value + '%';
    calculateAll();
}

/**
 * Update loan term
 */
function updateLoanTerm(value) {
    calcState.loanTerm = parseInt(value);
    calculateAll();
}

/**
 * Update generic value
 */
function updateValue(field, value) {
    calcState[field] = parseFloat(value) || 0;
    calculateAll();
}

/**
 * Format number with spaces
 */
function formatNumber(num) {
    return Math.round(num).toLocaleString('en-ZA').replace(/,/g, ' ');
}

console.log('✅ Property Calculator Loaded (Updated Version with Fixed Rates)');
