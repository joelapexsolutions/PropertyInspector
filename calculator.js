/**
 * Property Inspector - Website Calculator
 * Simplified SA property cost calculator
 */

// Calculator state
const calcState = {
    purchasePrice: 0,
    deposit: 0,
    loanAmount: 0,
    interestRate: 11.75,
    loanTerm: 20,
    hasBond: true,
    monthlyRates: 0,
    monthlyUtilities: 0
};

// SA Transfer Duty Brackets (2024-2025)
const transferDutyBrackets = [
    { min: 0, max: 1100000, rate: 0 },
    { min: 1100001, max: 1512500, rate: 0.03 },
    { min: 1512501, max: 2250000, rate: 0.06 },
    { min: 2250001, max: Infinity, rate: 0.08 }
];

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
                    <span>Results are estimates based on current SA regulations. Consult with financial advisors and attorneys for accurate quotes.</span>
                </p>
            </div>
        </div>
    `;
}

/**
 * Calculate all values
 */
function calculateAll() {
    const results = {
        monthlyBond: calcState.hasBond ? calculateMonthlyBond() : 0,
        transferDuty: calculateTransferDuty(),
        transferFees: calculateTransferFees(),
        bondCosts: calcState.hasBond ? calculateBondCosts() : 0,
        totalOnceCoff: 0,
        totalMonthly: 0
    };
    
    results.totalOnceCoff = results.transferDuty + results.transferFees + results.bondCosts;
    results.totalMonthly = results.monthlyBond + calcState.monthlyRates + calcState.monthlyUtilities;
    
    renderResults(results);
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
 * Calculate transfer duty
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
 * Calculate transfer attorney fees
 */
function calculateTransferFees() {
    if (calcState.purchasePrice <= 0) return 0;
    
    let fees = 0;
    const price = calcState.purchasePrice;
    
    if (price <= 300000) {
        fees = price * 0.032;
    } else if (price <= 600000) {
        fees = 9600 + (price - 300000) * 0.027;
    } else if (price <= 1000000) {
        fees = 17700 + (price - 600000) * 0.024;
    } else if (price <= 2000000) {
        fees = 27300 + (price - 1000000) * 0.021;
    } else {
        fees = 48300 + (price - 2000000) * 0.018;
    }
    
    return Math.round(fees * 1.15 + 2600); // VAT + additional fees
}

/**
 * Calculate bond registration costs
 */
function calculateBondCosts() {
    if (calcState.loanAmount <= 0) return 0;
    
    const loan = calcState.loanAmount;
    let deeds = 0;
    let attorney = 0;
    
    // Deeds office fees
    if (loan <= 100000) deeds = 750;
    else if (loan <= 300000) deeds = 1500;
    else if (loan <= 600000) deeds = 2250;
    else if (loan <= 1000000) deeds = 3750;
    else if (loan <= 2000000) deeds = 6000;
    else deeds = 9000;
    
    // Attorney fees
    if (loan <= 100000) {
        attorney = 5750;
    } else if (loan <= 500000) {
        attorney = 5750 + (loan - 100000) * 0.0345;
    } else if (loan <= 1000000) {
        attorney = 19550 + (loan - 500000) * 0.0115;
    } else if (loan <= 2000000) {
        attorney = 25300 + (loan - 1000000) * 0.0055;
    } else {
        attorney = 30800 + (loan - 2000000) * 0.0044;
    }
    
    attorney = attorney * 1.15; // VAT
    
    return Math.round(deeds + attorney + 6000 + 1700); // + bank fee + additional
}

/**
 * Render results
 */
function renderResults(results) {
    const container = document.getElementById('calcResults');
    container.innerHTML = `
        <h3><i class="fas fa-chart-line"></i> Your Property Costs</h3>
        
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
        
        <div class="calc-breakdown">
            <h4><i class="fas fa-list"></i> Cost Breakdown</h4>
            <ul class="breakdown-list">
                ${calcState.hasBond ? `
                <li class="breakdown-item">
                    <span class="breakdown-label">Monthly Bond Payment</span>
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
        
        <div class="calc-breakdown">
            <h4><i class="fas fa-receipt"></i> Once-off Costs</h4>
            <ul class="breakdown-list">
                <li class="breakdown-item">
                    <span class="breakdown-label">Transfer Duty</span>
                    <span class="breakdown-value">R ${formatNumber(results.transferDuty)}</span>
                </li>
                <li class="breakdown-item">
                    <span class="breakdown-label">Transfer Attorney Fees</span>
                    <span class="breakdown-value">R ${formatNumber(results.transferFees)}</span>
                </li>
                ${calcState.hasBond ? `
                <li class="breakdown-item">
                    <span class="breakdown-label">Bond Registration Costs</span>
                    <span class="breakdown-value">R ${formatNumber(results.bondCosts)}</span>
                </li>
                ` : ''}
                <li class="breakdown-item breakdown-total">
                    <span class="breakdown-label">Total Once-off</span>
                    <span class="breakdown-value">R ${formatNumber(results.totalOnceCoff)}</span>
                </li>
            </ul>
        </div>
    `;
}

/**
 * Handle price input with formatting
 */
function handlePriceInput(input, field) {
    let value = input.value.replace(/\s/g, '');
    
    if (value && !isNaN(value)) {
        calcState[field] = parseFloat(value);
        
        // Auto-calculate loan amount
        if (field === 'purchasePrice' || field === 'deposit') {
            calcState.loanAmount = Math.max(0, calcState.purchasePrice - calcState.deposit);
        }
        
        // Format with spaces
        input.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        calculateAll();
    } else {
        calcState[field] = 0;
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

console.log('✅ Property Calculator Loaded');
