/**
 * Home Buyers Guide SA - Professional Help & Guide System
 */

console.log('=== HELP & GUIDE SYSTEM LOADING ===');

// Help system state management
const helpState = {
    view: 'hub',          // 'hub' | 'category' | 'article'
    currentCategory: null,
    currentArticle: null
};

// Professional help content
const helpContent = {
    gettingStarted: {
        title: 'Getting Started',
        icon: 'fa-play-circle',
        color: '#06D6A0',
        description: 'Complete guide to using Home Buyers Guide SA for informed property decisions',
        sections: [
            {
                id: 'overview',
                title: 'Welcome to Home Buyers Guide SA',
                icon: 'fa-home',
                summary: 'What the app does and how it helps buyers, owners, agents and sellers',
                content: `
                    <div class="welcome-banner">
                        <div class="banner-icon">
                            <i class="fas fa-home"></i>
                        </div>
                        <div class="banner-content">
                            <h3>Know Before You Buy</h3>
                            <p>Home Buyers Guide SA empowers you to make informed property decisions through professional-grade assessment tools, detailed reporting, and comprehensive cost analysis.</p>
                        </div>
                    </div>
                    
                    <h4><i class="fas fa-users"></i> Benefits for Everyone</h4>
                    
                    <h5>For Property Buyers</h5>
                    <ul>
                        <li><strong>Avoid Costly Surprises:</strong> Identify potential issues before purchase</li>
                        <li><strong>Negotiation Power:</strong> Use documented findings to negotiate better prices</li>
                        <li><strong>Informed Decisions:</strong> Compare properties with detailed assessments</li>
                        <li><strong>Budget Planning:</strong> Get accurate repair cost estimates</li>
                    </ul>
                    
                    <h5>For Property Owners</h5>
                    <ul>
                        <li><strong>Maintenance Planning:</strong> Identify areas needing attention</li>
                        <li><strong>Property Value:</strong> Document improvements and upgrades</li>
                        <li><strong>Insurance Claims:</strong> Have detailed property condition records</li>
                        <li><strong>Sale Preparation:</strong> Address issues before listing</li>
                    </ul>
                    
                    <h5>For Estate Agents</h5>
                    <ul>
                        <li><strong>Professional Reports:</strong> Provide detailed property assessments to clients</li>
                        <li><strong>Pricing Justification:</strong> Support listing prices with documented conditions</li>
                        <li><strong>Client Confidence:</strong> Demonstrate transparency and professionalism</li>
                        <li><strong>Competitive Advantage:</strong> Offer value-added services</li>
                    </ul>
                    
                    <h5>For Property Sellers</h5>
                    <ul>
                        <li><strong>Accurate Pricing:</strong> Price property based on actual condition</li>
                        <li><strong>Faster Sales:</strong> Address buyer concerns proactively</li>
                        <li><strong>Reduced Negotiations:</strong> Transparent condition disclosure</li>
                        <li><strong>Market Confidence:</strong> Stand out with documented property quality</li>
                    </ul>
                    
                    <h4><i class="fas fa-list-ol"></i> How Home Buyers Guide SA Works</h4>
                    <div class="process-flow">
                        <div class="step-item">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <strong>Add Property Details</strong>
                                <p>Enter property specifications and schedule assessment</p>
                            </div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <strong>Conduct Professional Assessment</strong>
                                <p>Use guided tools to evaluate property condition systematically</p>
                            </div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <strong>Document with Photos</strong>
                                <p>Capture evidence of conditions, faults, and features</p>
                            </div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">4</div>
                            <div class="step-content">
                                <strong>Generate Professional Reports</strong>
                                <p>Receive detailed analysis and recommendations</p>
                            </div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">5</div>
                            <div class="step-content">
                                <strong>Make Informed Decisions</strong>
                                <p>Compare properties and plan your next steps</p>
                            </div>
                        </div>
                    </div>
                `
            },
            {
                id: 'addProperty',
                title: 'Adding & Managing Properties',
                icon: 'fa-plus-circle',
                summary: 'Create a property, choose its type and add the features you need to assess',
                content: `
                    <h4><i class="fas fa-home-plus"></i> Adding a New Property</h4>
                    
                    <h5>1. Access Property Management</h5>
                    <p>Navigate to "My Properties" from the home screen. If this is your first property, you'll see an "Add Property" button prominently displayed.</p>
                    
                    <h5>2. Select Property Type</h5>
                    <p>Choose the appropriate property type — this tailors the questions you're prompted to ask sellers or agents:</p>
                    <ul>
                        <li><strong>House:</strong> Freestanding properties, townhouses, cluster homes</li>
                        <li><strong>Complex/Flat:</strong> Sectional title properties, apartments, condominiums</li>
                    </ul>
                    <div class="tip-box">
                        <i class="fas fa-info-circle"></i>
                        <span>Every property uses the same four assessment categories — Location &amp; Neighbourhood, Exterior, Interior, and Other Features. The property type just adjusts the seller/agent questions, e.g. body corporate and levy questions for complexes and flats.</span>
                    </div>
                    
                    <h5>3. Enter Essential Property Information</h5>
                    <p><strong>Required Information:</strong></p>
                    <ul>
                        <li><strong>Address:</strong> Complete street address for identification</li>
                        <li><strong>Property Type:</strong> Selected in previous step</li>
                    </ul>
                    
                    <p><strong>Additional Details (Recommended):</strong></p>
                    <ul>
                        <li><strong>Specifications:</strong> Bedrooms, bathrooms, parking spaces, size (m²)</li>
                        <li><strong>Financial:</strong> Asking price or expected price range</li>
                        <li><strong>Location Details:</strong> Suburb, complex name (if applicable)</li>
                        <li><strong>Notes:</strong> Special requirements or observations</li>
                    </ul>
                    
                    <h5>4. Add Property Features</h5>
                    <p>Customize your property by adding relevant features that will be included in your assessment:</p>
                    <ul>
                        <li><strong>External Features:</strong> Pool, garden, garage, security systems, solar power</li>
                        <li><strong>Internal Features:</strong> Study, laundry, home theater, additional reception areas</li>
                        <li><strong>Utility Features:</strong> Smart home systems, backup power, borehole, recreational facilities</li>
                    </ul>
                    
                    <h4><i class="fas fa-edit"></i> Editing Property Information</h4>
                    
                    <h5>Accessing Edit Mode</h5>
                    <p>From the property detail view, tap the "Edit Property" button to modify any information or add features discovered during viewings.</p>
                    
                    <h5>Updating Property Details</h5>
                    <p>All existing data is pre-populated for easy editing. You can modify address, specifications, price, and notes at any time. This is particularly useful after property viewings when you have more accurate information.</p>
                    
                    <h5>Managing Features</h5>
                    <p>Use the feature management sections to add or remove rooms and amenities. You can adjust quantities, rename features for clarity (e.g., "Main Bathroom", "Guest Bedroom"), and remove unwanted items with confirmation prompts.</p>
                    
                    <div class="tip-box">
                        <i class="fas fa-lightbulb"></i>
                        <span><strong>Pro Tip:</strong> Don't worry about having complete information initially. You can update all details during or after your property assessment as you discover more about the property.</span>
                    </div>
                `
            },
            {
                id: 'scheduleViewing',
                title: 'Scheduling Your Assessment',
                icon: 'fa-calendar-plus',
                summary: 'Best times to view, how long to allow, and what to bring with you',
                content: `
                    <h4><i class="fas fa-calendar-check"></i> Planning Your Property Assessment</h4>
                    
                    <h5>Setting Assessment Date</h5>
                    <p>Use the "Assessment Date" field when adding or editing a property to schedule your evaluation. This helps you organize multiple property viewings and ensures proper preparation.</p>
                    
                    <h5>Optimal Assessment Timing</h5>
                    <p><strong>Best Time Slots:</strong></p>
                    <ul>
                        <li><strong>Morning (10 AM - 12 PM):</strong> Good natural lighting, fresh perspective</li>
                        <li><strong>Afternoon (2 PM - 4 PM):</strong> Optimal lighting for interior and exterior assessment</li>
                        <li><strong>Avoid Early Morning/Evening:</strong> Poor lighting affects accurate evaluation</li>
                    </ul>
                    
                    <h5>Time Allocation</h5>
                    <ul>
                        <li><strong>Full Property Assessment:</strong> Allow 60-90 minutes to work through every category — location, exterior, interior, and other features</li>
                        <li><strong>Smaller Properties:</strong> 45-60 minutes is often enough for apartments or homes with fewer rooms</li>
                        <li><strong>First-Time Users:</strong> Add 15-30 minutes for familiarization with the checklist and tooltips</li>
                    </ul>
                    
                    <h5>Weather Considerations</h5>
                    <p>Schedule assessments during favorable weather conditions when possible:</p>
                    <ul>
                        <li><strong>Clear Days:</strong> Best for exterior assessments and natural lighting</li>
                        <li><strong>Avoid Heavy Rain:</strong> Difficult to assess roofing, drainage, and outdoor areas</li>
                        <li><strong>Mild Weather:</strong> Comfortable conditions for thorough evaluation</li>
                    </ul>
                    
                    <h4><i class="fas fa-clipboard-list"></i> Pre-Assessment Preparation</h4>
                    
                    <h5>Technical Preparation</h5>
                    <ul>
                        <li>Ensure device is fully charged (80%+ recommended)</li>
                        <li>Verify sufficient storage space for photos</li>
                        <li>Clean camera lens for clear documentation</li>
                        <li>Test camera and flash functionality</li>
                    </ul>
                    
                    <h5>Assessment Tools</h5>
                    <ul>
                        <li>Small flashlight for inspecting dark areas (cupboards, roof spaces)</li>
                        <li>Measuring tape for verification (optional)</li>
                        <li>Business cards for contact exchange</li>
                        <li>Notebook for additional observations</li>
                    </ul>
                    
                    <h5>Calendar Integration</h5>
                    <p>Use the "Add to Calendar" feature to:</p>
                    <ul>
                        <li>Set automatic reminders 30 minutes before assessment</li>
                        <li>Include property address and assessment details</li>
                        <li>Plan travel time and parking logistics</li>
                        <li>Coordinate with estate agents or property contacts</li>
                    </ul>
                `
            },
            {
                id: 'financialCalculator',
                title: 'Financial Calculator',
                icon: 'fa-calculator',
                summary: 'Work out monthly bond costs, utilities and attorney fees for any property',
                content: `
                    <h4><i class="fas fa-calculator"></i> How to Use the Calculator</h4>

                    <p>The calculator has two entry points — tap <strong>Calculator</strong> in the bottom navigation bar to run numbers on any property manually, or open a saved property and tap the calculator icon there to pre-fill the purchase price automatically.</p>

                    <h5>What to Enter</h5>
                    <ul>
                        <li><strong>Purchase Price:</strong> The amount you're offering or considering</li>
                        <li><strong>Loan Amount:</strong> How much you plan to borrow — subtract your deposit from the purchase price</li>
                        <li><strong>Interest Rate:</strong> Defaults to 10.25% (SA prime rate, May 2026). Adjust based on your bank's actual offer — good credit with a 10%+ deposit typically gets prime or prime minus 0.5%</li>
                        <li><strong>Loan Term:</strong> 20 years is standard in SA; shorter terms mean higher monthly payments but less total interest paid</li>
                        <li><strong>Rates & Taxes:</strong> Ask the seller for the current municipal rates amount — it appears on their monthly statement</li>
                        <li><strong>Water & Electricity:</strong> Ask the seller for recent utility bills for a realistic estimate</li>
                        <li><strong>Levies:</strong> For complexes and sectional title — ask the body corporate or estate agent for the current monthly levy</li>
                    </ul>

                    <h4><i class="fas fa-money-bill-wave"></i> Understanding the Once-Off Costs</h4>

                    <p>Beyond your monthly bond repayment, buying property involves significant once-off costs due at registration. The calculator shows these automatically — here's what they are:</p>

                    <div class="process-flow">
                        <div class="step-item">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <strong>Transfer Duty</strong>
                                <p>Tax paid to SARS. No transfer duty on properties up to R1,210,000. Above that it scales from 3% to 13% on the portion in each bracket. Not payable if buying from a VAT-registered developer — VAT is included in the price instead.</p>
                            </div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <strong>Transfer Attorney Fees</strong>
                                <p>Legal fees to transfer the property into your name, calculated on the LSSA tariff scale. For a R2m property expect roughly R41,000 incl VAT; for R5m roughly R76,000 incl VAT.</p>
                            </div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <strong>Bond Registration Fees</strong>
                                <p>Attorney fees to register your home loan at the Deeds Office — separate from the transfer attorney. On a R2m bond expect roughly R41,000 incl VAT; R5m bond roughly R76,000 incl VAT. Plus the bank initiation fee of R6,037.50 (NCA maximum).</p>
                            </div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">4</div>
                            <div class="step-content">
                                <strong>Deeds Office Fees</strong>
                                <p>Statutory government fee to register the transfer and bond. Fixed amounts per price band — for a R2m property/bond these are R1,738 each (transfer and bond registration). Not negotiable.</p>
                            </div>
                        </div>
                    </div>

                    <div class="tip-box">
                        <i class="fas fa-lightbulb"></i>
                        <span><strong>Rule of thumb:</strong> Budget an additional 8–12% of the purchase price for once-off costs on top of your deposit. For a R2m property with a R2m bond, total once-off costs are typically around R130,000. For R5m, expect around R496,000 — the bulk of which is transfer duty (R327,356).</span>
                    </div>

                    <h4><i class="fas fa-chart-line"></i> Using the Calculator to Negotiate</h4>

                    <p>Run the numbers <em>before</em> making an offer, not after. Knowing your total monthly cost (bond + rates + utilities + levies) tells you what you can actually afford — and comparing two properties side-by-side on total monthly cost, not just purchase price, often changes which property looks better value.</p>

                    <p>If the once-off costs are higher than expected, you can sometimes negotiate a reduced purchase price to offset them — your assessment results give you the factual basis for that conversation.</p>
                `
            }
        ]
    },
    
    propertyAssessment: {
        title: 'Property Assessment Guide',
        icon: 'fa-clipboard-check',
        color: '#2E86AB',
        description: 'Professional property evaluation techniques and best practices',
        sections: [
            {
                id: 'assessmentOverview',
                title: 'Assessment System Overview',
                icon: 'fa-info-circle',
                summary: 'How the single assessment flow and 5-point rating system work',
                content: `
                    <h4><i class="fas fa-clipboard-check"></i> Professional Property Evaluation</h4>
                    
                    <p>Home Buyers Guide SA's assessment system guides you through professional-grade property evaluation, helping you identify issues that could cost thousands in repairs and discover features that add significant value.</p>
                    
                    <h5>One Assessment, Four Categories</h5>

                    <p>Every property uses the same complete assessment — there's no "quick" or "detailed" mode to choose. Work through four categories at your own pace, in any order, and your progress is saved automatically:</p>

                    <div class="process-flow">
                        <div class="step-item">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <strong>Location &amp; Neighbourhood</strong>
                                <p>Area safety, amenities, roads and infrastructure, and your daily commute</p>
                            </div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <strong>Exterior Assessment</strong>
                                <p>Structure, roof, walls, windows, doors, gardens, driveways and parking</p>
                            </div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <strong>Interior Assessment</strong>
                                <p>Bedrooms, bathrooms, kitchen, living areas and other indoor rooms</p>
                            </div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">4</div>
                            <div class="step-content">
                                <strong>Other Features</strong>
                                <p>Electrical safety, plumbing, security and any extra features the property has</p>
                            </div>
                        </div>
                    </div>

                    <p><em>You can stop at any point and pick up where you left off — your progress is saved automatically. Your results and report only become available once you've completed 100% of the assessment.</em></p>

                    <h4><i class="fas fa-star"></i> Professional Rating System</h4>
                    
                    <p>Home Buyers Guide SA uses a professional 5-point rating system designed to capture property conditions accurately:</p>
                    
                    <p><strong>⭐ Excellent (5/5)</strong></p>
                    <p>Perfect condition with no faults. Exceeds expectations with premium finishes, recent updates, or exceptional quality. Represents the best possible standard.</p>
                    
                    <p><strong>✅ Good (4/5)</strong></p>
                    <p>Well-maintained with minor wear. Meets expectations with quality finishes. May have very minor cosmetic issues that don't affect functionality.</p>
                    
                    <p><strong>⚠️ Fair (3/5)</strong></p>
                    <p>Functional but showing signs of wear. Some issues present that need attention within 1-2 years. Acceptable but not ideal condition.</p>
                    
                    <p><strong>❌ Poor (2/5)</strong></p>
                    <p>Significant problems requiring immediate attention. In bad shape with repairs needed to meet basic requirements. May affect property value or safety.</p>
                    
                    <p><strong>➖ Not Applicable (N/A)</strong></p>
                    <p>Item not present, not accessible, or not relevant to this property type.</p>

                    <h5>How Your Score Is Calculated</h5>
                    <p>Not every item carries the same weight. Issues that are expensive or dangerous to fix — like foundation problems or electrical hazards — pull the overall score down more than minor cosmetic items. This means a low score is a strong signal that something significant needs attention, while a high score reflects a property that's genuinely in good shape throughout.</p>

                    <div class="tip-box">
                        <i class="fas fa-lightbulb"></i>
                        <span><strong>Assessment Tip:</strong> Use tooltips during assessment for specific guidance on what to look for in each area. Rate based on integrity, finishes, and your requirements.</span>
                    </div>
                `
            },
            {
                id: 'conductingAssessment',
                title: 'Conducting Your Assessment',
                icon: 'fa-search',
                summary: 'A room-by-room walkthrough plan, tooltips and smart photo documentation',
                content: `
                    <h4><i class="fas fa-route"></i> Professional Assessment Process</h4>
                    
                    <h5>Getting Started</h5>
                    <p>Start your assessment from any property in "My Properties", or from "Upcoming Assessments" on the home screen. Work through the checklist at your own pace — ratings save automatically as you go.</p>
                    
                    <h5>Using Assessment Tooltips</h5>
                    <p>Home Buyers Guide SA provides expert guidance through interactive tooltips:</p>
                    <ul>
                        <li><strong>What to Look For:</strong> Specific inspection points for each item</li>
                        <li><strong>Common Issues:</strong> Typical problems to identify in each area</li>
                        <li><strong>Rating Guidance:</strong> How to evaluate condition accurately</li>
                        <li><strong>Cost Implications:</strong> Understanding financial impact of issues</li>
                    </ul>
                    
                    <h5>Working Through the Four Categories</h5>
                    
                    <p><strong>1. Location &amp; Neighbourhood</strong></p>
                    <p>Start by rating the area itself — this sets context for everything else:</p>
                    <ul>
                        <li>Area safety and security feel</li>
                        <li>Proximity to amenities (shops, healthcare, fuel)</li>
                        <li>Roads and infrastructure condition</li>
                        <li>Access and commute times</li>
                    </ul>
                    
                    <p><strong>2. Exterior Assessment</strong></p>
                    <p>Walk the outside of the property to form first impressions and spot structural issues:</p>
                    <ul>
                        <li>Building structure and foundation</li>
                        <li>Roofing condition and gutters</li>
                        <li>External walls and finishes</li>
                        <li>Windows, doors, and security</li>
                        <li>Gardens, driveways, and parking</li>
                    </ul>
                    
                    <p><strong>3. Interior Assessment</strong></p>
                    <p>Move through the property room by room — the app lets you add multiple instances of bedrooms and bathrooms:</p>
                    <ul>
                        <li>Bedrooms: storage, windows, electrical, walls and floors</li>
                        <li>Bathrooms: plumbing, drainage, tiling, ventilation, electrical safety</li>
                        <li>Kitchen: cabinetry, countertops, sink and taps, appliances, plumbing</li>
                        <li>Other living areas: condition, lighting, ventilation</li>
                    </ul>
                    
                    <p><strong>4. Other Features</strong></p>
                    <p>Finish with property-wide systems and any extras:</p>
                    <ul>
                        <li>Electrical safety: DB board, outlets, compliance certificate</li>
                        <li>Plumbing and drainage throughout the property</li>
                        <li>Security systems: alarms, access control</li>
                        <li>Special features: pools, solar systems, smart home technology</li>
                    </ul>
                    
                    <p><em>Categories can be completed in any order, and you can leave and return to a property's assessment whenever you like — your progress is saved automatically.</em></p>
                    
                    <h4><i class="fas fa-camera"></i> Professional Documentation</h4>
                    
                    <h5>Strategic Photo Documentation</h5>
                    <p>Photos serve multiple professional purposes in your property evaluation:</p>
                    
                    <p><strong>Document Issues for Professional Consultation:</strong></p>
                    <ul>
                        <li>Capture structural concerns, water damage, or electrical issues</li>
                        <li>Photograph defects clearly for contractor quotes</li>
                        <li>Document safety hazards for immediate attention</li>
                        <li>Record serial numbers of major appliances</li>
                    </ul>
                    
                    <p><strong>Highlight Exceptional Features:</strong></p>
                    <ul>
                        <li>Document premium finishes and quality installations</li>
                        <li>Capture beautiful views, natural lighting, and spatial flow</li>
                        <li>Record recent renovations and upgrades</li>
                        <li>Photograph unique architectural features</li>
                    </ul>
                    
                    <p><strong>Property Comparison Tool:</strong></p>
                    <ul>
                        <li>Standardized photos for comparing similar properties</li>
                        <li>Visual record of property conditions across your options</li>
                        <li>Reference material for family discussions</li>
                        <li>Evidence for negotiation discussions</li>
                    </ul>
                    
                    <h5>Professional Photo Tips</h5>
                    <ul>
                        <li>Use natural lighting whenever possible</li>
                        <li>Capture wide shots for context, close-ups for detail</li>
                        <li>Include reference objects for scale</li>
                        <li>Take multiple angles of important areas</li>
                        <li>Ensure photos are clear and well-lit</li>
                    </ul>
                    
                    <div class="tip-box">
                        <i class="fas fa-camera"></i>
                        <span><strong>Documentation Strategy:</strong> Take more photos than you think you need. They're invaluable for later review, professional consultations, and comparison discussions.</span>
                    </div>
                `
            },
            {
                id: 'assessmentResults',
                title: 'Understanding Your Results',
                icon: 'fa-chart-bar',
                summary: 'Reading your report, comparing properties and using findings to negotiate',
                content: `
                    <h4><i class="fas fa-clipboard-list"></i> Comprehensive Assessment Reports</h4>
                    
                    <p>Once you've completed 100% of the assessment, your full results become available. Your <strong>Results</strong> button appears on the property card, and a PDF report can be downloaded from the property overview screen.</p>
                    
                    <h5>Reading Your Property Card</h5>
                    <p>Each property in "My Properties" shows your progress at a glance:</p>
                    <ul>
                        <li><strong>Assessment score badge:</strong> Your overall score out of 100, with a condition label (e.g. "Fair Condition")</li>
                        <li><strong>Progress bar:</strong> Shows "Assessment complete" as a percentage across all four categories</li>
                        <li><strong>Reassess:</strong> Jump back into the checklist to add or update ratings</li>
                        <li><strong>Results:</strong> Open the full report for this property</li>
                        <li><strong>View &amp; Edit:</strong> Update the property's details (address, price, features)</li>
                    </ul>
                    
                    <h5>Assessment Report Components</h5>
                    
                    <p><strong>Executive Summary</strong></p>
                    <ul>
                        <li>Overall property score and grade (out of 100)</li>
                        <li>Condition summary and key implications</li>
                        <li>Budget considerations for first year and ongoing</li>
                        <li>Negotiation strategy based on findings</li>
                    </ul>
                    
                    <p><strong>Detailed Assessment Results</strong></p>
                    <ul>
                        <li>Room-by-room and area-by-area ratings</li>
                        <li>Guidance text for each rated item</li>
                        <li>Attention Required callouts for fair and poor items</li>
                        <li>Inspector notes where added</li>
                    </ul>
                    
                    <p><strong>Issues Requiring Attention</strong></p>
                    <ul>
                        <li>Consolidated list of all fair and poor rated items</li>
                        <li>Priority level (high/critical) for each issue</li>
                        <li>Guidance on next steps and estimated costs</li>
                    </ul>
                    
                    <p><strong>Assessment Questions &amp; Seller Responses</strong></p>
                    <ul>
                        <li>Questions you asked the seller during the viewing</li>
                        <li>Space for recording their responses</li>
                        <li>Key items to verify before transfer</li>
                    </ul>
                    
                    <h4><i class="fas fa-balance-scale"></i> Property Comparison Tools</h4>
                    
                    <h5>Multi-Property Analysis</h5>
                    <p>Compare all assessed properties using standardized criteria:</p>
                    <ul>
                        <li><strong>Side-by-Side Scoring:</strong> Compare overall property grades</li>
                        <li><strong>Category Comparison:</strong> Analyse specific areas (kitchen, bathrooms, exterior)</li>
                        <li><strong>Cost Analysis:</strong> Compare total ownership costs including repairs</li>
                        <li><strong>Risk Assessment:</strong> Evaluate potential issues across properties</li>
                    </ul>
                    
                    <h5>Decision Support Features</h5>
                    <ul>
                        <li>Pros and cons summary for each property</li>
                        <li>Investment potential rankings</li>
                        <li>Family/stakeholder sharing capabilities</li>
                        <li>Professional consultation preparation</li>
                    </ul>
                    
                    <h4><i class="fas fa-handshake"></i> Using Results for Negotiations</h4>
                    
                    <h5>For Buyers</h5>
                    <ul>
                        <li>Use documented issues to justify price reductions</li>
                        <li>Present repair cost estimates during negotiations</li>
                        <li>Request seller-funded repairs for major issues</li>
                        <li>Support offer conditions with assessment findings</li>
                    </ul>
                    
                    <h5>For Estate Agents</h5>
                    <ul>
                        <li>Provide transparency to build client trust</li>
                        <li>Use reports to justify listing prices</li>
                        <li>Identify properties with competitive advantages</li>
                        <li>Support client decision-making with data</li>
                    </ul>
                    
                    <h5>For Sellers</h5>
                    <ul>
                        <li>Address issues proactively before listing</li>
                        <li>Use positive findings to justify asking price</li>
                        <li>Prepare for buyer questions and concerns</li>
                        <li>Plan strategic improvements for maximum return</li>
                    </ul>
                    
                    <div class="tip-box">
                        <i class="fas fa-chart-line"></i>
                        <span><strong>Professional Advantage:</strong> Assessment reports provide the documentation and analysis needed for confident property decisions and professional negotiations.</span>
                    </div>
                `
            }
        ]
    }
};

// Initialize help system
const YOUTUBE_ACADEMY_URL = 'https://www.youtube.com/playlist?list=PLD3VMzEE0ugs';

const WEBSITE_URL = 'https://propertyinspector.site/';

function openHBGWebsite(source) {
    if (window.trackEvent) {
        trackEvent('website_opened', { source: source || 'help_guide' });
    }
    if (window.Android && window.Android.openExternalUrl) {
        window.Android.openExternalUrl(WEBSITE_URL);
    } else {
        window.open(WEBSITE_URL, '_blank');
    }
}

function openYoutubeAcademy(source) {
    if (window.trackEvent) {
        trackEvent('youtube_academy_opened', { source: source || 'help_guide' });
    }
    if (window.Android && window.Android.openExternalUrl) {
        window.Android.openExternalUrl(YOUTUBE_ACADEMY_URL);
    } else {
        window.open(YOUTUBE_ACADEMY_URL, '_blank');
    }
}

// Inject YouTube card CSS
(function() {
    const s = document.createElement('style');
    s.textContent = `
        /* Resource cards — use CSS variables so dark+light both work */
        .help-resource-card {
            display: flex;
            align-items: center;
            gap: 14px;
            margin: 0 16px 10px;
            padding: 14px 16px;
            background: var(--surface) !important;
            border: 0.5px solid var(--border) !important;
            border-radius: 14px;
            cursor: pointer;
            transition: background 0.2s;
            -webkit-tap-highlight-color: transparent;
        }
        .help-resource-card:active { background: var(--surface-2) !important; }
        .help-rc-icon {
            width: 46px; height: 46px; min-width: 46px;
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.3rem; flex-shrink: 0;
        }
        .help-rc-youtube { background: rgba(255,0,0,0.12); color: #ff4444; }
        .help-rc-website { background: rgba(6,214,160,0.12); color: #06D6A0; }
        .help-rc-body { flex: 1; min-width: 0; }
        .help-rc-body strong {
            display: block;
            color: var(--text-1) !important;
            font-size: 0.95rem;
            font-weight: 700;
            margin-bottom: 3px;
        }
        .help-rc-body span {
            color: var(--text-2) !important;
            font-size: 0.8rem;
            line-height: 1.4;
        }
        .help-rc-arrow {
            color: var(--text-3) !important;
            font-size: 0.72rem;
            flex-shrink: 0;
        }
    `;
        document.head.appendChild(s);
})();

function initializeHelpSystem() {
    console.log('🔧 Initializing Help & Guide System');

    // Initialize scroll-to-top functionality
    initScrollToTop();

    console.log('✅ Help & Guide System initialized');
}

// Scroll to top functionality
function initScrollToTop() {
    // Create scroll to top button
    const scrollButton = document.createElement('button');
    scrollButton.className = 'scroll-to-top';
    scrollButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
    scrollButton.onclick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Add to body
    document.body.appendChild(scrollButton);

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollButton.classList.add('show');
        } else {
            scrollButton.classList.remove('show');
        }
    });
}

// Navigate back functionality (article -> category -> hub)
function navigateBack() {
    if (helpState.view === 'article') {
        openHelpCategory(helpState.currentCategory);
    } else if (helpState.view === 'category') {
        renderHelpScreen();
    } else {
        renderHelpScreen();
    }
}

// Called by the top screen-header back button.
// Steps up within the guide (article -> category -> hub) and only
// leaves the Help screen once the hub is showing.
function helpScreenBack() {
    if (helpState.view === 'hub') {
        if (typeof showScreen === 'function') {
            const prev = window.appState && window.appState.previousScreen;
            showScreen(prev || 'homeScreen');
        }
    } else {
        navigateBack();
    }
}

// Render main help hub
function renderHelpScreen() {
    helpState.view = 'hub';
    helpState.currentCategory = null;
    helpState.currentArticle = null;

    const container = document.getElementById('helpContentContainer');
    if (!container) {
        console.error('Help content container not found');
        return;
    }

    container.innerHTML = `
        <div class="help-main-screen">
            <div class="help-header">
                <div class="help-title">
                    <h2>Help &amp; Guide</h2>
                    <p>Everything you need to get the most out of Home Buyers Guide SA</p>
                </div>
            </div>

            <div class="help-hero">
                <div class="help-hero-icon"><i class="fas fa-graduation-cap"></i></div>
                <div class="help-hero-text">
                    <h3>Learn the app, step by step</h3>
                    <p>Browse short guides on adding properties, running an assessment, and reading your results.</p>
                </div>
            </div>

            <div class="help-section-label"><i class="fas fa-play-circle"></i> Video Tutorials</div>
            <div class="help-resource-card" onclick="openYoutubeAcademy('help_hub')">
                <div class="help-rc-icon help-rc-youtube">
                    <i class="fab fa-youtube"></i>
                </div>
                <div class="help-rc-body">
                    <strong>HBG SA Academy</strong>
                    <span>Step-by-step video lessons on YouTube</span>
                </div>
                <i class="fas fa-external-link-alt help-rc-arrow"></i>
            </div>
            <div class="help-resource-card" onclick="openHBGWebsite('help_hub')">
                <div class="help-rc-icon help-rc-website">
                    <i class="fas fa-globe"></i>
                </div>
                <div class="help-rc-body">
                    <strong>Home Buyers Guide Website</strong>
                    <span>Tips, guides &amp; blog — propertyinspector.site</span>
                </div>
                <i class="fas fa-external-link-alt help-rc-arrow"></i>
            </div>

            <div class="help-section-label">Guides</div>
            <div class="help-categories">
                ${Object.entries(helpContent).map(([key, category]) => `
                    <div class="help-category-card" onclick="openHelpCategory('${key}')">
                        <div class="category-icon">
                            <i class="fas ${category.icon}"></i>
                        </div>
                        <div class="category-content">
                            <h3>${category.title}</h3>
                            <p>${category.description}</p>
                            <span class="section-count">${category.sections.length} guides</span>
                        </div>
                        <div class="category-arrow">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="help-quick-access">
                <div class="help-section-label"><i class="fas fa-bolt"></i> Popular topics</div>
                <div class="quick-links">
                    <div class="quick-link" onclick="openYoutubeAcademy('quick_links')">
                        <div class="quick-link-icon"><i class="fab fa-youtube" style="color:#ff4444"></i></div>
                        <span>Watch video tutorials — HBG SA Academy</span>
                        <i class="fas fa-external-link-alt quick-link-arrow"></i>
                    </div>
                    <div class="quick-link" onclick="openHBGWebsite('quick_links')">
                        <div class="quick-link-icon"><i class="fas fa-globe" style="color:#06D6A0"></i></div>
                        <span>Home Buyers Guide Website</span>
                        <i class="fas fa-external-link-alt quick-link-arrow"></i>
                    </div>
                    <div class="quick-link" onclick="showWelcomeModalManually()">
                        <div class="quick-link-icon"><i class="fas fa-rocket"></i></div>
                        <span>Replay the welcome tutorial</span>
                        <i class="fas fa-chevron-right quick-link-arrow"></i>
                    </div>
                    <div class="quick-link" onclick="openHelpSection('gettingStarted', 'addProperty')">
                        <div class="quick-link-icon"><i class="fas fa-plus-circle"></i></div>
                        <span>Add your first property</span>
                        <i class="fas fa-chevron-right quick-link-arrow"></i>
                    </div>
                    <div class="quick-link" onclick="openHelpSection('propertyAssessment', 'conductingAssessment')">
                        <div class="quick-link-icon"><i class="fas fa-search"></i></div>
                        <span>How to run an assessment</span>
                        <i class="fas fa-chevron-right quick-link-arrow"></i>
                    </div>
                    <div class="quick-link" onclick="openHelpSection('gettingStarted', 'financialCalculator')">
                        <div class="quick-link-icon"><i class="fas fa-calculator"></i></div>
                        <span>Calculate monthly costs</span>
                        <i class="fas fa-chevron-right quick-link-arrow"></i>
                    </div>
                    <div class="quick-link" onclick="openHelpSection('propertyAssessment', 'assessmentResults')">
                        <div class="quick-link-icon"><i class="fas fa-chart-bar"></i></div>
                        <span>Understanding your score</span>
                        <i class="fas fa-chevron-right quick-link-arrow"></i>
                    </div>
                </div>
            </div>
        </div>
    `;

    window.scrollTo(0, 0);
}

// Open a category — shows a list of articles
function openHelpCategory(categoryKey) {
    const category = helpContent[categoryKey];
    if (!category) {
        console.error('Help category not found:', categoryKey);
        return;
    }

    helpState.view = 'category';
    helpState.currentCategory = categoryKey;
    helpState.currentArticle = null;

    const container = document.getElementById('helpContentContainer');
    container.innerHTML = `
        <div class="help-category-view" data-category="${categoryKey}">
            <div class="help-header-with-nav">
                <div class="category-title-section">
                    <div class="category-icon-large">
                        <i class="fas ${category.icon}"></i>
                    </div>
                    <div class="category-info">
                        <h2>${category.title}</h2>
                        <p>${category.description}</p>
                    </div>
                </div>
            </div>

            <div class="help-sections">
                ${category.sections.map((section, index) => `
                    <div class="help-article-card" onclick="openHelpArticle('${categoryKey}', '${section.id}')">
                        <div class="article-index">${index + 1}</div>
                        <div class="article-content">
                            <h3>${section.title}</h3>
                            <p>${section.summary || ''}</p>
                        </div>
                        <div class="category-arrow">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    window.scrollTo(0, 0);
}

// Open a single article — focused reading view
function openHelpArticle(categoryKey, sectionId) {
    const category = helpContent[categoryKey];
    if (!category) {
        console.error('Help category not found:', categoryKey);
        return;
    }

    const articles = category.sections;
    const index = articles.findIndex(s => s.id === sectionId);
    if (index === -1) {
        console.error('Help article not found:', categoryKey, sectionId);
        return;
    }

    const article = articles[index];
    const prevArticle = articles[index - 1] || null;
    const nextArticle = articles[index + 1] || null;

    helpState.view = 'article';
    helpState.currentCategory = categoryKey;
    helpState.currentArticle = sectionId;

    const container = document.getElementById('helpContentContainer');
    container.innerHTML = `
        <div class="help-article-view" data-category="${categoryKey}" data-article="${sectionId}">
            <div class="help-header-with-nav">
                <div class="article-header-text">
                    <span class="article-breadcrumb">${category.title}</span>
                    <h2>${article.title}</h2>
                </div>
            </div>

            <div class="help-article-body">
                <div class="article-progress">Guide ${index + 1} of ${articles.length}</div>
                <div class="article-content-body">
                    ${article.content}
                </div>
            </div>

            <div class="article-nav-footer">
                ${prevArticle ? `
                    <div class="article-nav-btn article-nav-prev" onclick="openHelpArticle('${categoryKey}', '${prevArticle.id}')">
                        <i class="fas fa-arrow-left"></i>
                        <div class="article-nav-text">
                            <span class="article-nav-label">Previous</span>
                            <span class="article-nav-title">${prevArticle.title}</span>
                        </div>
                    </div>
                ` : `<div class="article-nav-spacer"></div>`}
                ${nextArticle ? `
                    <div class="article-nav-btn article-nav-next" onclick="openHelpArticle('${categoryKey}', '${nextArticle.id}')">
                        <div class="article-nav-text">
                            <span class="article-nav-label">Next</span>
                            <span class="article-nav-title">${nextArticle.title}</span>
                        </div>
                        <i class="fas fa-arrow-right"></i>
                    </div>
                ` : `<div class="article-nav-spacer"></div>`}
            </div>

            <div class="back-to-top-container">
                <button class="back-to-top-btn" onclick="window.scrollTo({ top: 0, behavior: 'smooth' })">
                    <i class="fas fa-chevron-up"></i>
                    Back to top
                </button>
            </div>
        </div>
    `;

    window.scrollTo(0, 0);
}

// Open specific help article directly from Quick Start links
function openHelpSection(categoryKey, sectionId) {
    openHelpArticle(categoryKey, sectionId);
}

// Initialize help system on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeHelpSystem();
});

// Export functions for global access
window.initializeHelpSystem = initializeHelpSystem;
window.openYoutubeAcademy = openYoutubeAcademy;
window.openHBGWebsite = openHBGWebsite;
window.renderHelpScreen = renderHelpScreen;
window.openHelpCategory = openHelpCategory;
window.openHelpArticle = openHelpArticle;
window.openHelpSection = openHelpSection;
window.navigateBack = navigateBack;
window.helpScreenBack = helpScreenBack;

console.log('✅ Help & Guide System loaded successfully');