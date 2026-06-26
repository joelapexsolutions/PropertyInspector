/**
 * Home Buyers Guide SA - Website Property Cost Calculator
 * Rates aligned with app cost-calculator.js (June 2026)
 *
 * Transfer Duty: SARS 2025/26–2026/27 (effective 1 April 2025,
 *   confirmed unchanged for 2026/27, Budget 19 Feb 2026)
 * Attorney Fees: LSSA tariff effective 1 August 2025
 * Deeds Office:  1 April 2026 Government Gazette
 * Interest Rate: SA prime 10.25% (SARB repo 6.75% + 3.5%, May 2026)
 */

// ── Transfer Duty Brackets 2025/26–2026/27 ───────────────────────────
// Each entry: lower threshold, upper threshold, marginal rate,
// cumulative base duty already owed at the lower threshold.
const transferDutyBrackets = [
    { min: 0,          max: 1210000,   rate: 0.00, base: 0        },
    { min: 1210001,    max: 1663800,   rate: 0.03, base: 0        },
    { min: 1663801,    max: 2329300,   rate: 0.06, base: 13614    },
    { min: 2329301,    max: 2994800,   rate: 0.08, base: 53544    },
    { min: 2994801,    max: 13310000,  rate: 0.11, base: 106784   },
    { min: 13310001,   max: Infinity,  rate: 0.13, base: 1241456  }
];

// ── Calculator State ──────────────────────────────────────────────────
const calcState = {
    purchasePrice: 0,
    deposit: 0,
    loanAmount: 0,
    interestRate: 10.25,   // SA prime rate as at May 2026
    loanTerm: 20,
    hasBond: true,
    monthlyRates: 0,
    monthlyUtilities: 0,
    sectionsExpanded: {
        monthly: false,
        onceOff: false
    }
};

// ── Init ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    const calcContainer = document.getElementById('propertyCalculator');
    if (calcContainer) {
        renderCalculator();
        calculateAll();
    }
});

// ── Render UI ─────────────────────────────────────────────────────────
function renderCalculator() {
    const container = document.getElementById('propertyCalculator');
    container.innerHTML = `
        <div class="calculator-container">
            <!-- Property Details -->
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

                    <div class="calc-input-group" id="depositGroup" style="${calcState.hasBond ? '' : 'display:none;'}">
                        <label class="calc-label">
                            Deposit Amount (R)
                            <i class="fas fa-info-circle calc-info-icon" title="Cash deposit — typically 10–20%"></i>
                        </label>
                        <input type="text" class="calc-input" id="deposit"
                               placeholder="e.g. 150 000"
                               oninput="handlePriceInput(this, 'deposit')">
                    </div>

                    <div class="calc-input-group" id="loanAmountGroup" style="${calcState.hasBond ? '' : 'display:none;'}">
                        <label class="calc-label">
                            Loan Amount (R)
                            <i class="fas fa-info-circle calc-info-icon" title="Auto-calculated: Purchase Price − Deposit"></i>
                        </label>
                        <input type="text" class="calc-input" id="loanAmount"
                               placeholder="e.g. 1 350 000"
                               oninput="handlePriceInput(this, 'loanAmount')">
                    </div>
                </div>
            </div>

            <!-- Home Loan -->
            <div class="calc-section" id="bondSection">
                <h3><i class="fas fa-university"></i> Home Loan</h3>
                <div class="calc-form-grid">
                    <div class="calc-input-group">
                        <label class="calc-label">Financing with Bond?</label>
                        <div class="calc-toggle">
                            <button class="calc-toggle-btn ${calcState.hasBond ? 'active' : ''}" onclick="toggleBond(true)">Yes</button>
                            <button class="calc-toggle-btn ${!calcState.hasBond ? 'active' : ''}" onclick="toggleBond(false)">No — Cash</button>
                        </div>
                    </div>

                    <div class="calc-input-group" id="loanTermGroup" style="${calcState.hasBond ? '' : 'display:none;'}">
                        <label class="calc-label">Loan Term</label>
                        <select class="calc-select" id="loanTerm" onchange="updateLoanTerm(this.value)">
                            <option value="10">10 years</option>
                            <option value="15">15 years</option>
                            <option value="20" selected>20 years</option>
                            <option value="25">25 years</option>
                            <option value="30">30 years</option>
                        </select>
                    </div>

                    <div class="calc-input-group" id="interestGroup" style="${calcState.hasBond ? '' : 'display:none;'}">
                        <label class="calc-label">
                            Interest Rate: <span id="rateDisplay">10.25%</span>
                            <i class="fas fa-info-circle calc-info-icon" title="SA prime rate is 10.25% (May 2026). Strong applicants may get prime minus 0.5–1%; average buyers prime to prime plus 2%."></i>
                        </label>
                        <div class="calc-slider-group">
                            <input type="range" class="calc-slider" id="interestRate"
                                   min="5" max="20" step="0.25" value="10.25"
                                   oninput="updateInterestRate(this.value)">
                            <div class="slider-labels">
                                <span>5%</span>
                                <span>Prime: 10.25%</span>
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
                            Rates &amp; Taxes (R)
                            <i class="fas fa-info-circle calc-info-icon" title="Monthly municipal charges — ask the seller for their latest rates statement"></i>
                        </label>
                        <input type="number" class="calc-input" id="monthlyRates"
                               placeholder="e.g. 2 500"
                               oninput="updateValue('monthlyRates', this.value)">
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-label">
                            Water &amp; Electricity (R)
                            <i class="fas fa-info-circle calc-info-icon" title="Estimated monthly utilities — ask the seller for recent bills"></i>
                        </label>
                        <input type="number" class="calc-input" id="monthlyUtilities"
                               placeholder="e.g. 1 800"
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
                    <span>Results are estimates. Transfer duty uses SARS 2025/26–2026/27 brackets. Attorney fees use the LSSA tariff effective August 2025. Deeds office fees from the April 2026 Government Gazette. Interest rates vary by bank and credit profile — consult a bond originator for a personalised quote.</span>
                </p>
            </div>
        </div>
    `;
}

// ── Transfer Duty (SARS cumulative progressive method) ────────────────
function calculateTransferDuty() {
    const price = calcState.purchasePrice;
    if (price <= 0) return 0;
    for (let i = transferDutyBrackets.length - 1; i >= 0; i--) {
        const b = transferDutyBrackets[i];
        if (price >= b.min) {
            return Math.round(b.base + (price - b.min) * b.rate);
        }
    }
    return 0;
}

// ── Transfer Attorney Fees — LSSA tariff effective 1 August 2025 ──────
// Base fees excl. VAT; ceiling bands (rounds UP to next full band)
function calculateTransferFeesBase() {
    const price = calcState.purchasePrice;
    if (price <= 0) return 0;
    let baseFees = 0;
    if (price <= 100000) {
        baseFees = 6640;
    } else if (price <= 500000) {
        const bands = Math.ceil((price - 100000) / 50000);
        baseFees = 6640 + bands * 1060;
    } else if (price <= 1000000) {
        const bands = Math.ceil((price - 500000) / 100000);
        baseFees = 15120 + bands * 2050;
    } else if (price <= 5000000) {
        const bands = Math.ceil((price - 1000000) / 200000);
        baseFees = 25370 + bands * 2050;
    } else {
        const bands = Math.ceil((price - 5000000) / 1000000);
        baseFees = 66370 + bands * 5160;
    }
    return Math.round(baseFees);
}

function calculateTransferFeesBreakdown() {
    if (calcState.purchasePrice <= 0) return { attorneyFees: 0, deedsOfficeFees: 0, additionalFees: 0, total: 0 };
    const baseFees        = calculateTransferFeesBase();
    const feesWithVAT     = Math.round(baseFees * 1.15);
    const additionalFees  = 2200;
    const deedsOfficeFees = calculateTransferDeedsOfficeFees();
    return {
        attorneyFees:    feesWithVAT,
        deedsOfficeFees: deedsOfficeFees,
        additionalFees:  additionalFees,
        total:           feesWithVAT + deedsOfficeFees + additionalFees
    };
}

// ── Transfer Deeds Office Fees — 1 April 2026 Government Gazette ──────
function calculateTransferDeedsOfficeFees() {
    const p = calcState.purchasePrice;
    if (p <= 0)         return 0;
    if (p <= 100000)    return 50;
    if (p <= 200000)    return 114;
    if (p <= 300000)    return 727;
    if (p <= 600000)    return 956;
    if (p <= 800000)    return 1346;
    if (p <= 1000000)   return 1546;
    if (p <= 2000000)   return 1738;
    if (p <= 4000000)   return 2408;
    if (p <= 6000000)   return 2922;
    if (p <= 8000000)   return 3480;
    if (p <= 10000000)  return 4068;
    if (p <= 15000000)  return 4844;
    if (p <= 20000000)  return 5818;
    return 7751;
}

// ── Bond Registration Costs — LSSA Aug 2025 + April 2026 gazette ──────
function calculateBondCostsBreakdown() {
    const loan = calcState.loanAmount;
    if (loan <= 0) return { attorneyFees: 0, bankInitiation: 0, deedsOfficeFees: 0, additionalFees: 0, total: 0 };

    // Deeds Office bond registration fees — April 2026 gazette
    let deedsOfficeFee = 0;
    if      (loan <= 150000)    deedsOfficeFee = 561;
    else if (loan <= 300000)    deedsOfficeFee = 727;
    else if (loan <= 600000)    deedsOfficeFee = 956;
    else if (loan <= 800000)    deedsOfficeFee = 1346;
    else if (loan <= 1000000)   deedsOfficeFee = 1546;
    else if (loan <= 2000000)   deedsOfficeFee = 1738;
    else if (loan <= 4000000)   deedsOfficeFee = 2408;
    else if (loan <= 6000000)   deedsOfficeFee = 2922;
    else if (loan <= 8000000)   deedsOfficeFee = 3480;
    else if (loan <= 10000000)  deedsOfficeFee = 4068;
    else if (loan <= 15000000)  deedsOfficeFee = 4844;
    else if (loan <= 20000000)  deedsOfficeFee = 5818;
    else if (loan <= 30000000)  deedsOfficeFee = 6781;
    else                        deedsOfficeFee = 9690;

    // Bond attorney fees — LSSA tariff effective 1 August 2025
    let attorneyFeesBase = 0;
    if (loan <= 100000) {
        attorneyFeesBase = 6640;
    } else if (loan <= 500000) {
        const bands = Math.ceil((loan - 100000) / 50000);
        attorneyFeesBase = 6640 + bands * 1060;
    } else if (loan <= 1000000) {
        const bands = Math.ceil((loan - 500000) / 100000);
        attorneyFeesBase = 15120 + bands * 2050;
    } else if (loan <= 5000000) {
        const bands = Math.ceil((loan - 1000000) / 200000);
        attorneyFeesBase = 25370 + bands * 2050;
    } else {
        const bands = Math.ceil((loan - 5000000) / 1000000);
        attorneyFeesBase = 66370 + bands * 5160;
    }
    const attorneyFeesWithVAT = Math.round(attorneyFeesBase * 1.15);

    // Bank initiation fee — NCA maximum (R5,250 + 15% VAT = R6,037.50)
    const bankInitiation = 6037.50;
    const additionalFees = 2000;

    return {
        attorneyFees:    attorneyFeesWithVAT,
        bankInitiation:  bankInitiation,
        deedsOfficeFees: deedsOfficeFee,
        additionalFees:  additionalFees,
        total:           Math.round(attorneyFeesWithVAT + bankInitiation + deedsOfficeFee + additionalFees)
    };
}

// ── Monthly bond repayment ────────────────────────────────────────────
function calculateMonthlyBond() {
    if (calcState.loanAmount <= 0) return 0;
    const monthlyRate  = calcState.interestRate / 100 / 12;
    const numPayments  = calcState.loanTerm * 12;
    const payment = calcState.loanAmount *
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);
    return Math.round(payment);
}

// ── Main calculation ──────────────────────────────────────────────────
function calculateAll() {
    if (calcState.purchasePrice <= 0) { renderEmptyState(); return; }

    const monthlyBond      = calcState.hasBond ? calculateMonthlyBond() : 0;
    const transferDuty     = calculateTransferDuty();
    const transferBreakdown = calculateTransferFeesBreakdown();
    const bondBreakdown    = calcState.hasBond ? calculateBondCostsBreakdown() : { attorneyFees:0, bankInitiation:0, deedsOfficeFees:0, additionalFees:0, total:0 };

    const results = {
        monthlyBond:     monthlyBond,
        transferDuty:    transferDuty,
        transferBreakdown: transferBreakdown,
        bondBreakdown:   bondBreakdown,
        totalOnceOff:    transferDuty + transferBreakdown.total + bondBreakdown.total,
        totalMonthly:    monthlyBond + calcState.monthlyRates + calcState.monthlyUtilities
    };

    renderResults(results);
}

// ── Render empty state ────────────────────────────────────────────────
function renderEmptyState() {
    document.getElementById('calcResults').innerHTML = `
        <div class="calc-empty-state">
            <div class="empty-state-icon"><i class="fas fa-calculator"></i></div>
            <h3>Enter Property Details Above</h3>
            <p>Fill in the purchase price to see your full cost breakdown</p>
        </div>
    `;
}

// ── Render results ────────────────────────────────────────────────────
function renderResults(r) {
    document.getElementById('calcResults').innerHTML = `
        <h3><i class="fas fa-chart-line"></i> Your Property Costs</h3>

        <div class="results-grid">
            <div class="result-card primary">
                <div class="result-label">Total Monthly</div>
                <div class="result-amount">R ${formatNumber(r.totalMonthly)}</div>
                <div class="result-description">per month</div>
            </div>
            <div class="result-card">
                <div class="result-label">Once-off Costs</div>
                <div class="result-amount">R ${formatNumber(r.totalOnceOff)}</div>
                <div class="result-description">at purchase</div>
            </div>
            ${calcState.hasBond ? `
            <div class="result-card">
                <div class="result-label">Bond Repayment</div>
                <div class="result-amount">R ${formatNumber(r.monthlyBond)}</div>
                <div class="result-description">${calcState.loanTerm} years @ ${calcState.interestRate}%</div>
            </div>` : ''}
        </div>

        <!-- Monthly breakdown -->
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
                        <span class="breakdown-label">Bond Payment (${calcState.loanTerm} yrs @ ${calcState.interestRate}%)</span>
                        <span class="breakdown-value">R ${formatNumber(r.monthlyBond)}</span>
                    </li>` : ''}
                    <li class="breakdown-item">
                        <span class="breakdown-label">Rates &amp; Taxes</span>
                        <span class="breakdown-value">R ${formatNumber(calcState.monthlyRates)}</span>
                    </li>
                    <li class="breakdown-item">
                        <span class="breakdown-label">Water &amp; Electricity</span>
                        <span class="breakdown-value">R ${formatNumber(calcState.monthlyUtilities)}</span>
                    </li>
                    <li class="breakdown-item breakdown-total">
                        <span class="breakdown-label">Total Monthly Cost</span>
                        <span class="breakdown-value">R ${formatNumber(r.totalMonthly)}</span>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Once-off breakdown -->
        <div class="calc-breakdown">
            <div class="breakdown-header" onclick="toggleSection('onceOff')">
                <h4><i class="fas fa-receipt"></i> Once-off Costs Breakdown</h4>
                <div class="breakdown-toggle ${calcState.sectionsExpanded.onceOff ? '' : 'collapsed'}">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
            <div class="breakdown-content ${calcState.sectionsExpanded.onceOff ? 'expanded' : 'collapsed'}">

                ${calcState.hasBond && r.bondBreakdown.total > 0 ? `
                <div class="breakdown-subsection">
                    <div class="subsection-header">
                        <span class="subsection-title">Bond Registration Costs</span>
                        <span class="subsection-total">R ${formatNumber(r.bondBreakdown.total)}</span>
                    </div>
                    <ul class="breakdown-list sub-list">
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">Bond Attorney Fees (incl VAT)
                                <i class="fas fa-info-circle calc-info-icon" title="LSSA tariff Aug 2025 — legal fees to register your bond at the Deeds Office"></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(r.bondBreakdown.attorneyFees)}</span>
                        </li>
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">Bank Initiation Fee
                                <i class="fas fa-info-circle calc-info-icon" title="NCA maximum: R5,250 + 15% VAT = R6,037.50"></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(r.bondBreakdown.bankInitiation)}</span>
                        </li>
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">Deeds Office Fees
                                <i class="fas fa-info-circle calc-info-icon" title="Government gazette April 2026 — fee to register your bond at the Deeds Office"></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(r.bondBreakdown.deedsOfficeFees)}</span>
                        </li>
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">Postage, Petties &amp; Other
                                <i class="fas fa-info-circle calc-info-icon" title="Postage, FICA compliance, credit checks, and miscellaneous disbursements"></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(r.bondBreakdown.additionalFees)}</span>
                        </li>
                    </ul>
                </div>` : ''}

                <div class="breakdown-subsection">
                    <div class="subsection-header">
                        <span class="subsection-title">Property Transfer Costs</span>
                        <span class="subsection-total">R ${formatNumber(r.transferBreakdown.total + r.transferDuty)}</span>
                    </div>
                    <ul class="breakdown-list sub-list">
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">Transfer Attorney Fees (incl VAT)
                                <i class="fas fa-info-circle calc-info-icon" title="LSSA tariff Aug 2025 — legal fees to transfer property into your name"></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(r.transferBreakdown.attorneyFees)}</span>
                        </li>
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">Transfer Duty (SARS)
                                <i class="fas fa-info-circle calc-info-icon" title="SARS 2025/26–2026/27: exempt under R1,210,000; 3% to R1,663,800; 6% to R2,329,300; 8% to R2,994,800; 11% to R13,310,000; 13% above"></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(r.transferDuty)}</span>
                        </li>
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">Deeds Office Fees
                                <i class="fas fa-info-circle calc-info-icon" title="Government gazette April 2026 — fee to register the property transfer"></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(r.transferBreakdown.deedsOfficeFees)}</span>
                        </li>
                        <li class="breakdown-item sub-item">
                            <span class="breakdown-label">Postage, Petties &amp; Other
                                <i class="fas fa-info-circle calc-info-icon" title="Postage, FICA, municipal clearance certificate, rates clearance, and miscellaneous costs"></i>
                            </span>
                            <span class="breakdown-value">R ${formatNumber(r.transferBreakdown.additionalFees)}</span>
                        </li>
                    </ul>
                </div>

                <ul class="breakdown-list">
                    <li class="breakdown-item breakdown-total">
                        <span class="breakdown-label">Total Once-off Costs</span>
                        <span class="breakdown-value">R ${formatNumber(r.totalOnceOff)}</span>
                    </li>
                </ul>
            </div>
        </div>
    `;
}

// ── UI helpers ────────────────────────────────────────────────────────
function toggleSection(id) {
    calcState.sectionsExpanded[id] = !calcState.sectionsExpanded[id];
    calculateAll();
}

function handlePriceInput(input, field) {
    let value = input.value.replace(/\s/g, '');
    if (value && !isNaN(value)) {
        calcState[field] = parseFloat(value);
        if (field === 'purchasePrice' || field === 'deposit') {
            const auto = Math.max(0, calcState.purchasePrice - calcState.deposit);
            calcState.loanAmount = auto;
            const el = document.getElementById('loanAmount');
            if (el) el.value = auto > 0 ? formatNumber(auto) : '';
        }
        input.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        calculateAll();
    } else {
        calcState[field] = 0;
        if (field === 'purchasePrice' || field === 'deposit') {
            const auto = Math.max(0, calcState.purchasePrice - calcState.deposit);
            calcState.loanAmount = auto;
            const el = document.getElementById('loanAmount');
            if (el) el.value = auto > 0 ? formatNumber(auto) : '';
        }
        calculateAll();
    }
}

function toggleBond(hasBond) {
    calcState.hasBond = hasBond;
    document.querySelectorAll('.calc-toggle-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === (hasBond ? 0 : 1));
    });
    ['depositGroup','loanAmountGroup','loanTermGroup','interestGroup'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = hasBond ? '' : 'none';
    });
    if (!hasBond) {
        calcState.deposit = 0; calcState.loanAmount = 0;
        ['deposit','loanAmount'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    } else if (calcState.purchasePrice > 0) {
        calcState.loanAmount = Math.max(0, calcState.purchasePrice - calcState.deposit);
        const el = document.getElementById('loanAmount');
        if (el && calcState.loanAmount > 0) el.value = formatNumber(calcState.loanAmount);
    }
    calculateAll();
}

function updateInterestRate(value) {
    calcState.interestRate = parseFloat(value);
    document.getElementById('rateDisplay').textContent = value + '%';
    calculateAll();
}

function updateLoanTerm(value) {
    calcState.loanTerm = parseInt(value);
    calculateAll();
}

function updateValue(field, value) {
    calcState[field] = parseFloat(value) || 0;
    calculateAll();
}

function formatNumber(num) {
    return Math.round(num).toLocaleString('en-ZA').replace(/,/g, ' ');
}

console.log('✅ Website Calculator loaded — rates aligned with app (June 2026)');
