/**
 * COMPLETE Assessment Guidance and Report System
 * Professional property inspection guidance covering ALL assessment items
 * Including ALL dropdown features and conditional rooms
 */

console.log('=== COMPLETE ASSESSMENT GUIDANCE SYSTEM LOADING ===');

// Overall score descriptions with detailed guidance
const scoreGuidance = {
    excellent: {
        title: "Excellent Condition",
        description: "Based on your assessment, this property is in excellent condition with no significant issues identified. The majority of items across all categories rated well, indicating a well-maintained property.",
        implications: "A property in excellent condition generally means lower immediate maintenance costs after purchase, a more predictable budget in the first few years, and less disruption settling in. Whether this translates to good value depends on the asking price relative to the market — condition is one important factor among several.",
        buyerAdvice: "The assessment findings suggest this property has been well looked after. It is worth understanding what has contributed to the good condition — the age of major systems like the roof, geyser, and electrical panel, any recent renovations, and the seller's maintenance history all provide useful context. Some buyers choose to commission an independent professional building inspection (typically R2,000–R5,000 depending on property size) for additional assurance, particularly on higher-value purchases. Even in excellent condition, the minor items identified are worth noting for future planning.",
        negotiationAdvice: "Property condition is one input into an offer — market conditions, comparable sales, how long the property has been listed, and your own circumstances all play a role too. The assessment gives you an objective, documented basis for your offer price and for any conversations with the seller about terms, included fixtures, or minor items identified.",
        immediateActions: ["Review comparable recent sales in the area to understand market pricing", "Consider whether an independent building inspection would add value for your peace of mind", "Factor any minor items identified into your first-year maintenance budget", "Clarify which fixtures and fittings are included in the sale"],
        budgetConsiderations: "Routine maintenance for a well-maintained SA property typically runs R10,000–R20,000 per year depending on size and property type. Even in excellent condition, setting aside a contingency for unexpected repairs is good practice — major systems like geysers and electrical panels have finite lifespans regardless of current condition."
    },
    good: {
        title: "Good Condition",
        description: "Based on the assessment ratings, this property is in good overall condition with only minor maintenance needs. The issues identified are manageable and are not expected to significantly affect comfort, safety, or structural integrity.",
        implications: "Good condition properties represent a common and practical choice in the SA market. The items identified are informative rather than alarming — understanding which need attention in the short term versus longer term helps with budgeting and prioritisation after purchase.",
        buyerAdvice: "The assessment has documented specific areas that may need attention. Reviewing these alongside the property's overall attributes — location, size, price, and how it fits your needs — puts them in perspective. Getting indicative quotes for the flagged items before finalising an offer gives a clearer picture of total ownership costs. For first-time buyers, the Issues Requiring Attention section is a practical starting point for conversations with contractors. For experienced buyers, the findings provide a clear basis for planning post-purchase work.",
        negotiationAdvice: "The documented assessment findings provide an objective basis for understanding the property's condition. The identified items can inform your offer or discussions with the seller about repairs or adjustments. How much weight you place on each factor — condition, price, location, and your personal priorities — is a decision based on what matters most to you.",
        immediateActions: ["Get indicative quotes for the items flagged in the Issues Requiring Attention section", "Research comparable recent sales to understand market pricing for the area", "Consider whether any of the flagged items warrant a specialist look before committing", "Clarify what fixtures and fittings are included in the sale"],
        budgetConsiderations: "Budget R15,000–R40,000 in the first year for addressing the identified items and routine maintenance. Once the flagged items are addressed, annual upkeep costs for a well-maintained property of this type typically fall in the range of R15,000–R25,000. Costs vary by property size, age, and type — sectional title properties may have some maintenance costs covered through the body corporate levy."
    },
    fair: {
        title: "Fair Condition",
        description: "Based on the assessment ratings, this property has a number of areas requiring attention. The issues identified will need to be addressed within a reasonable timeframe and should be factored into your total cost of ownership calculations.",
        implications: "Fair condition properties can represent good opportunities for buyers who go in with a clear and realistic understanding of what the work will cost. The key is having accurate information about repair scope and costs relative to the asking price — this assessment is a starting point for that process, not a final determination.",
        buyerAdvice: "The Issues Requiring Attention section of this report details the specific concerns and their priority. Getting written cost estimates from qualified contractors for the major items is an important step — this gives you the clearest picture of total outlay. An independent professional building inspection (R2,000–R5,000) can provide additional detail, particularly for structural, electrical, or plumbing concerns. Understanding the difference between cosmetic issues and structural or system-level issues helps with prioritisation. For first-time buyers, fair condition properties require more careful financial planning than move-in-ready homes. For renovation-minded buyers, they can offer room to add value.",
        negotiationAdvice: "The condition findings in this report, supported by contractor quotes, provide a factual basis for price discussions. Buyers in this situation typically use the gap between the property's current state and its potential value once repairs are done to inform their offer. Every buyer's circumstances, risk tolerance, and priorities differ — having documented, objective findings puts you in a well-informed position for any discussions with the seller.",
        immediateActions: ["Obtain written quotes from qualified contractors for the major items identified", "Consider commissioning an independent professional building inspection for additional detail", "Calculate total estimated costs (purchase price plus repairs) to understand your actual investment", "Research comparable sales in good condition to understand the property's potential value"],
        budgetConsiderations: "Repair costs for fair condition properties vary widely depending on what needs doing. As a broad guide, buyers in this situation often budget R50,000–R120,000 over 12–18 months for necessary repairs. Some issues may be cosmetic while others require specialist tradespeople — professional quotes are the most reliable way to determine actual costs. Renovation loan products are available from SA banks if additional funding is needed."
    },
    poor: {
        title: "Needs Significant Attention",
        description: "Based on the assessment ratings, this property has significant issues across multiple areas. Several items rated poorly, indicating that meaningful investment will be required to bring the property to a comfortable and well-maintained standard.",
        implications: "Properties in this condition carry higher financial and practical complexity than well-maintained homes, but they can also offer greater potential for buyers who are equipped to manage a renovation project. The total cost of ownership — purchase price plus all repair costs — is the critical figure to establish. Understanding the local market value of the property in good condition helps assess whether the numbers make sense for your situation.",
        buyerAdvice: "The Issues Requiring Attention section of this report lists the specific concerns and their priority level. Getting detailed written quotes from qualified contractors and specialists for all major items is an important step before any decision. For complex or structural concerns, engaging a professional building inspector or structural engineer (R2,000–R8,000 depending on scope) provides expert assessment beyond what a walkthrough can determine. Understanding which issues are urgent safety or habitability concerns versus longer-term maintenance items helps with prioritisation and phasing of work. For first-time buyers, it is worth taking additional time to fully understand the scope and cost of work involved. For experienced renovation buyers or investors, the condition may present an opportunity — if the numbers stack up.",
        negotiationAdvice: "Detailed assessment findings and contractor quotes are particularly useful when discussing price for a property in this condition. The gap between the property's current state and its potential value once repaired is the natural foundation for those conversations. There is no single right approach — every buyer's situation, risk appetite, and priorities are different. What matters is that any decision is made with a clear, realistic understanding of the total investment required, not just the purchase price.",
        immediateActions: ["Obtain detailed written quotes from multiple contractors for all major items identified", "Engage a professional building inspector or structural engineer for expert assessment of serious concerns", "Calculate total investment (purchase price plus all repair costs) and compare to market value of similar properties in good condition", "Consult with a financial adviser or mortgage originator if the repair scope affects your affordability"],
        budgetConsiderations: "Major repair and renovation budgets for properties in this condition can range from R100,000 to R300,000+ depending on the scope of work and property size. Building in a contingency is important — renovation projects commonly exceed initial estimates. If the property is uninhabitable during repairs, the cost of alternative accommodation during that period should be factored in. A quantity surveyor or experienced contractor can provide a realistic project estimate before you commit."
    }
};

// COMPLETE item guidance with all ratings and cost implications
const itemGuidance = {
    // =================================================================
    // LOCATION & NEIGHBOURHOOD
    // =================================================================

    "Area safety and security feel": {
        excellent: "The area has an excellent safety and security profile. Neighbourhood watch is active, street crime is low relative to comparable areas, and residents report feeling safe. Properties in well-secured areas typically carry lower insurance premiums and retain value better over time. This is one of the most important factors for long-term satisfaction and resale potential.",
        good: "The area has a generally good security feel with reasonable safety levels for the property type. Some vigilance is always recommended in SA, but the neighbourhood does not present obvious elevated risk. Ensure your home security system is adequate and maintain awareness of local neighbourhood watch groups.",
        fair: "The area shows some security concerns — visible signs may include informal settlements nearby, inadequate street lighting, or feedback from residents about incidents. In South Africa this is a significant consideration affecting both your daily safety and property insurance costs. Factor in the cost of upgrading your home security system and verify crime statistics with the local SAPS office before committing.",
        poor: "The area has notable security concerns that need serious consideration. In the South African context, a poor security feel directly affects your quality of life, insurance premiums, property value growth, and resale potential. Visit the area at different times including evenings and weekends. Speak to residents and the local SAPS before making any decision. Factor in significant security upgrade costs if you proceed.",
        issuesRequiringAttention: {
            fair: "Contact the local SAPS community policing forum to understand crime patterns. Check if the area has an active neighbourhood watch and enquire about community security initiatives. These are free resources that provide the most accurate picture.",
            poor: "Obtain official crime statistics from the SAPS community service centre for the specific suburb. Consult with a local property professional who can provide honest guidance on area trajectory. This should be a primary factor in your buying decision."
        }
    },

    "Proximity to amenities": {
        excellent: "Excellent access to all daily amenities — major supermarkets, hospitals or clinics, schools, pharmacies, and fuel stations are within easy reach. This significantly reduces daily commuting costs and time, increases the property's appeal to future buyers, and supports strong resale value.",
        good: "Good access to most essential amenities within a reasonable distance. Minor inconveniences such as a slightly longer drive to a specific service should be weighed against other property benefits. Most daily needs can be met without significant effort.",
        fair: "Some key amenities require a meaningful drive that will add to daily costs and time. Evaluate which services matter most to your lifestyle — for example, distance to work, schools, or medical facilities. Factor additional fuel and time costs into your monthly budget assessment.",
        poor: "Limited access to amenities means significant ongoing costs and inconveniences — multiple long drives weekly for essential services. In addition to the daily impact, this affects the property's appeal to future buyers and may affect resale value. This is a fundamental lifestyle consideration worth weighing carefully against the property's other attributes and your own daily routines.",
        issuesRequiringAttention: {
            fair: "Use Google Maps to map distances to your most-used services. Calculate realistic monthly fuel costs for the routes you would travel regularly — this is a real ongoing cost that should factor into your total budget.",
            poor: "This is a fundamental lifestyle consideration. If poor access to amenities is a concern, carefully compare this property against others in better-located areas before making a decision."
        }
    },

    "Roads and infrastructure condition": {
        excellent: "Roads are well-maintained with good quality surfacing and functioning street infrastructure. This indicates strong municipal investment and management in the area — a positive indicator of the neighbourhood's trajectory. Well-maintained infrastructure also protects vehicle condition and reduces maintenance costs.",
        good: "Roads are in reasonable condition with only minor imperfections typical of most SA suburban roads. The municipality appears to maintain infrastructure adequately. Factor in normal vehicle maintenance as roads are not perfectly smooth.",
        fair: "Some road or infrastructure concerns are visible — potholes, cracked surfaces, or evidence of long-delayed municipal maintenance. This could indicate budget constraints in the local municipality. While individual potholes can be repaired, systemic infrastructure neglect is a long-term concern for property values and daily vehicle wear.",
        poor: "Roads and infrastructure are in poor condition, suggesting significant municipal neglect or inadequate service delivery for the area. In South Africa this is often a precursor to further decline in neighbourhood investment and property values. Budget for higher vehicle maintenance costs and factor the area's service delivery track record into your long-term outlook for the property.",
        issuesRequiringAttention: {
            fair: "Research the local municipality's recent budget and service delivery record online. Check if road repairs are planned. Document the current state with photos in case of any future vehicle damage claims.",
            poor: "Contact the local municipality's public works department to enquire about planned maintenance. Consider how the current infrastructure condition reflects on the area's long-term investment potential."
        }
    },

    "Access and commute": {
        excellent: "Excellent access with convenient commute options for most destinations. Travel times to major business nodes are reasonable, toll costs are manageable, and multiple route options exist to avoid congestion. This is a significant quality-of-life factor that should not be underestimated.",
        good: "Good overall access with reasonable commute times. Some peak-hour congestion may occur but multiple route options help manage daily travel. The commute is manageable for most working schedules and won't significantly impact daily quality of life.",
        fair: "Commute times or costs are noticeable and will have a real daily impact. Consider peak-hour travel times specifically, not just off-peak. Fuel, toll, and vehicle wear costs on a longer commute can add R2,000–R5,000 or more per month compared to a well-located property — factor this into your total monthly cost comparison.",
        poor: "Commute presents a significant daily burden in terms of time and cost. In South Africa, with high fuel prices, e-tolls (where applicable), and frequent traffic congestion on major routes, poor commute access is a material cost and quality-of-life factor. Calculate realistic monthly commuting costs and compare the financial impact against the property price advantage before deciding.",
        issuesRequiringAttention: {
            fair: "Test the commute yourself during actual peak hours before committing. Use Google Maps traffic feature set to your typical departure time for a realistic assessment. Calculate the true monthly cost including fuel, tolls, and vehicle depreciation.",
            poor: "A poor commute from this property versus an alternative will add significant monthly costs. Build a side-by-side comparison of total monthly costs including transport before making a final decision."
        }
    },

    // =================================================================
	// DETAILED ASSESSMENT ITEMS - EXTERIOR
	// =================================================================

	// Boundary Fence/Wall Items
	"Wall/fence structural condition": {
		excellent: "Boundary wall and fence in excellent structural condition throughout — solid, plumb, and well-maintained. No visible cracking, leaning, or loose sections. Good perimeter integrity supports both your security and keeps home insurance straightforward.",
		good: "Good structural condition with only minor cosmetic wear appropriate for the property's age. No structural concerns — any maintenance needed is superficial such as repointing, repainting, or cleaning.",
		fair: "Some structural concerns are visible — this could include sections that have shifted slightly, developed cracks beyond surface level, or show early signs of leaning or foundation movement. This may affect your perimeter security and could be noted by your home insurer. Getting a builder or fencing contractor to assess and quote (usually included free with a quote) is a practical first step.",
		poor: "Significant structural problems are present — loose or collapsed sections, major cracking, severe leaning, or foundations that have failed. This directly affects your day-one security and may affect your home insurance eligibility if perimeter security is deemed inadequate. Get this fully assessed and costed before making an offer.",
		issuesRequiringAttention: {
			fair: "Get 2–3 quotes from reputable builders or fencing contractors — most include a free site assessment with their quote. Minor structural repairs typically range from R2,000 to R15,000. Use contractor pricing to inform your negotiation or post-purchase budget.",
			poor: "Get quotes from 2–3 reputable builders or walling contractors. Minor partial repairs: R5,000–R20,000. Substantial boundary rebuilds: R20,000–R120,000+ depending on material, height, and wall length. A new brick plastered boundary wall typically costs R800–R2,500 per running meter to rebuild. Factor the total into your offer price."
		}
	},

	"Height and security adequacy": {
		excellent: "Boundary height optimal for security and privacy needs while complying with local regulations. Well-designed for both functionality and aesthetic appeal.",
		good: "Good height providing reasonable security and privacy for most residents. Generally adequate for standard security requirements.",
		fair: "Height adequate for basic privacy but consider your security comfort levels and area requirements. Some residents may prefer additional height for enhanced security.",
		poor: "Height may not meet your security or privacy preferences. Consider whether the current height suits your comfort levels and the security context of the area. Raising a boundary wall typically costs R2,000-R4,500 per metre depending on height and material."
	},

	"Maintenance and repair needs": {
		excellent: "Boundary requires minimal maintenance with excellent upkeep evident throughout. Ready for immediate occupation without additional investment.",
		good: "Any minor maintenance needs include pointing or surface work. Normal upkeep requirements manageable within standard property maintenance budgets.",
		fair: "Some maintenance may be required including repointing, repainting, or minor repairs. Consider whether any needs fit your timeline and maintenance comfort levels.",
		poor: "Significant maintenance may be required. Good opportunity for renovation buyers, but consider whether time and cost investment aligns with your priorities and responsibility structure."
	},

	// Gate/Entrance Items (Detailed)
	"Gate operation and mechanics": {
		excellent: "Gate operates flawlessly with smooth manual and automatic operation. All mechanisms function reliably for daily convenience and security.",
		good: "Good gate operation with any minor maintenance being routine servicing. Generally reliable with normal maintenance needs for property age.",
		fair: "Gate functional but may show wear or require attention for peak performance. Consider your tolerance for occasional operational challenges.",
		poor: "Gate operation may be compromised requiring repair or replacement. Consider whether daily access convenience is priority for your lifestyle and factor costs into purchase decision.",
		issuesRequiringAttention: {
			fair: "Gate service from a qualified gate technician is worth arranging — typical service and adjustment: R500–R1,500. This often resolves intermittent issues before they become complete failures.",
			poor: "Get quotes for repair versus replacement from 2–3 gate technicians. Motor repair or replacement: R3,500–R8,000. Complete gate and motor replacement: R8,000–R25,000+. Reliable gate access is a practical daily requirement and worth factoring into your purchase cost planning."
		}
	},

	"Access control systems": {
		excellent: "Comprehensive access control with all systems functioning perfectly including remotes, intercoms, and visitor management - ideal for security-conscious residents.",
		good: "Good access control meeting most security needs with any minor improvements being enhancements rather than necessities.",
		fair: "Basic access control adequate for standard needs. Consider whether current systems meet your security comfort levels and convenience preferences.",
		poor: "Access control systems may need attention or replacement. Evaluate whether enhanced security convenience is important for your lifestyle and budget accordingly."
	},

	"Safety and security features": {
		excellent: "All safety systems functioning perfectly with comprehensive protection features appropriate for family safety and security requirements.",
		good: "Good safety features with any maintenance being routine upkeep. Generally compliant with safety standards for normal family use.",
		fair: "Basic safety features present but improvements could enhance protection depending on your family safety priorities.",
		poor: "Safety systems may need attention for optimal family protection. Consider whether enhanced safety features are priority for your family situation and peace of mind."
	},

	"Power and backup systems": {
		excellent: "Power supply and backup systems working perfectly ensuring reliable gate operation during power outages - essential for SA load shedding context.",
		good: "Good power systems with any maintenance being routine upkeep. Generally reliable with reasonable backup power provision.",
		fair: "Power supply adequate but backup systems may need attention. Consider your tolerance for access interruptions during power outages.",
		poor: "Power or backup system issues may affect reliability during outages. Consider importance of consistent access for your lifestyle and budget for improvements if needed."
	},

	// Security/Safety Items (Detailed)
	"Security system functionality": {
		excellent: "Comprehensive security system with all zones active, current monitoring contracts, and reliable armed response integration. Full property coverage with backup power for uninterrupted protection.",
		good: "Functional security system covering main areas with active monitoring. Most zones operational with reliable response service. Minor component updates may enhance coverage.",
		fair: "Basic security system protecting key areas but some zones may need attention. Consider if coverage meets your family's safety needs and area crime levels.",
		poor: "Security system has significant gaps in coverage or non-functional components. Complete system installation could be costly depending on property size. Get quotes from multiple security companies.",
	},

	"Perimeter security": {
		excellent: "Electric fencing, cameras, and boundary sensors fully operational providing complete perimeter protection. Well-maintained system with effective coverage of all access points.",
		good: "Perimeter protection covers most vulnerable areas with functioning electric fencing or cameras. System provides reasonable deterrent against unauthorized access.",
		fair: "Basic perimeter security present but coverage may have gaps. Electric fencing maintenance R3,000-R8,000 annually. Consider enhancement needs for your security comfort.",
		poor: "Perimeter security has significant weaknesses or non-functioning elements. Electric fencing installation R500-R1,200 per meter, camera systems R8,000-R50,000 depending on coverage needs."
	},

	"Lighting and visibility": {
		excellent: "Comprehensive security lighting with motion sensors covering all areas. Excellent night visibility eliminating dark spots that could conceal intruders.",
		good: "Security lighting covers main areas effectively with most motion sensors working. Generally good visibility for night-time security and movement.",
		fair: "Basic security lighting present but some dark areas may need additional coverage. LED security lighting R200-R800 per light point depending on type and installation.",
		poor: "Inadequate security lighting creates visibility risks and reduces crime deterrent effect. Comprehensive lighting installation R5,000-R20,000 depending on property size and requirements."
	},

	"Emergency systems": {
		excellent: "Panic buttons, emergency contacts, and armed response fully integrated with fast response times. Emergency procedures clear and system regularly tested.",
		good: "Emergency response system functional with reasonable response capability. Panic buttons accessible and monitoring contracts current.",
		fair: "Basic emergency systems present but response capability may be limited. Armed response contracts typically R300-R800 monthly with varying response times.",
		poor: "Emergency systems inadequate or non-functional. Panic button installation R2,000-R8,000, armed response setup and monitoring R300-R800 monthly depending on service level."
	},

	// Parking Items (Detailed)
	"Parking surface condition": {
		excellent: "Parking surfaces in perfect condition with quality materials and professional appearance. No cracks, potholes, or deterioration affecting vehicle protection.",
		good: "Parking surfaces functional with normal wear for age. Minor surface imperfections don't affect daily use or vehicle protection.",
		fair: "Parking surfaces show wear but adequate for daily use. Consider if condition meets your standards for vehicle protection. Resurfacing R200-R400 per square meter.",
		poor: "Parking surfaces have significant deterioration affecting vehicle access and potentially damaging tires or undercarriage. Major resurfacing or reconstruction required R300-R600 per square meter."
	},

	"Access and maneuvering space": {
		excellent: "Generous parking space accommodating various vehicle sizes including SUVs, bakkies, and trailers. Easy maneuvering without tight spaces or obstacles.",
		good: "Adequate parking space for standard vehicles with reasonable maneuvering room. Most vehicles can park comfortably without difficulty.",
		fair: "Parking space adequate for compact to medium vehicles but larger vehicles may have maneuvering challenges. Consider your vehicle types and driving habits.",
		poor: "Limited parking space restricts vehicle options or requires careful maneuvering. May not accommodate larger vehicles or multiple cars comfortably. Expansion difficult and expensive."
	},

	// Garages Items
	"Garage door functionality": {
		excellent: "Garage door operates smoothly with reliable automatic and manual operation. Safety features including obstruction sensors and emergency stops work perfectly.",
		good: "Garage door functions reliably for daily use with normal operational characteristics. Minor maintenance may improve smoothness but operation is dependable.",
		fair: "Garage door operational but may require attention for optimal performance. Motor service R2,000-R5,000, minor repairs R1,000-R3,000 typically resolve issues.",
		poor: "Garage door has operational problems affecting daily convenience and potentially vehicle security. Motor replacement R8,000-R18,000, complete door replacement R10,000-R25,000+.",
		issuesRequiringAttention: {
			fair: "Garage door service recommended for optimal operation. Professional maintenance R2,000-R5,000 improves reliability and extends system life.",
			poor: "Garage door requires major attention for reliable daily use. Get quotes for repair versus replacement. Motor replacement R8,000-R18,000, complete systems R10,000-R25,000+."
		}
	},

	"Structural condition": {
		excellent: "Garage structure sound throughout with level floors, weather-tight walls and roof. Excellent vehicle and storage protection from elements.",
		good: "Garage structure provides reliable protection with minor maintenance needs. Sound construction adequately protects vehicles and stored items.",
		fair: "Garage structure adequate for intended use but some areas may need attention. Minor structural repairs R5,000-R20,000 depending on issues identified.",
		poor: "Garage structural issues including floor problems, roof leaks, or wall damage affecting protection. Major repairs R20,000-R80,000 depending on extent of structural work required."
	},

	"Electrical and storage": {
		excellent: "Comprehensive electrical outlets throughout garage with quality lighting and built-in storage maximizing utility for workshop, charging, or storage needs.",
		good: "Adequate electrical provision with sufficient outlets and lighting for standard garage use. Storage space meets most organizational needs.",
		fair: "Basic electrical and storage adequate for vehicle parking but limited for workshop or extensive storage needs. Electrical upgrades R3,000-R8,000 for enhanced functionality.",
		poor: "Limited electrical outlets and storage restricting garage utility beyond basic vehicle parking. Comprehensive electrical upgrade R5,000-R15,000, storage solutions R3,000-R12,000."
	},

	// Carport Items (Detailed)
	"Carport structure and stability": {
		excellent: "Carport structure is solid and stable with firmly anchored posts, sound welds or joints, and no rust, rot, or movement. Provides reliable long-term vehicle protection with minimal maintenance needs.",
		good: "Carport structure is stable and functional with only minor surface rust or weathering typical of age. Posts are firm and the structure handles wind loads adequately. Routine maintenance will keep it in good order.",
		fair: "Carport structure shows wear that needs attention — surface rust on steel, weathering on timber posts, or minor movement in the structure. Addressing this early prevents more significant deterioration. Rust treatment and repainting R2,000–R6,000; post repairs R3,000–R8,000.",
		poor: "Carport structure has significant problems — leaning or loose posts, advanced rust or rot, or visible instability. Unsafe structures are a hazard in high winds and to vehicles beneath. Major repairs R8,000–R20,000; full carport replacement R15,000–R45,000+ depending on size and materials.",
		issuesRequiringAttention: {
			fair: "Have a builder or carport installer assess the structure when quoting maintenance. Rust treatment, repainting, and minor post repairs typically R2,000–R8,000. Attending to this early avoids structural replacement later.",
			poor: "Get quotes from 2–3 carport installers for repair versus replacement. Structural repairs R8,000–R20,000; new carport installation R15,000–R45,000+ depending on size and materials. Factor this into your offer or maintenance budget."
		}
	},

	"Carport roof covering condition": {
		excellent: "Carport roof covering in excellent condition with no rust, holes, sagging, or loose panels. Water runs off properly and vehicles are well protected from sun and rain.",
		good: "Roof covering functional with minor weathering or surface wear typical of age. Provides reliable protection with only routine maintenance needed.",
		fair: "Roof covering shows wear needing attention — surface rust on sheeting, minor sagging, or a few loose panels. Repairs of R1,500–R5,000 typically restore full protection. Left unattended, water ingress accelerates deterioration.",
		poor: "Roof covering significantly deteriorated — holes, advanced rust, badly sagging or missing panels. Vehicles are not adequately protected. Re-sheeting R5,000–R15,000 depending on carport size and material chosen.",
		issuesRequiringAttention: {
			fair: "Minor sheeting repairs and rust treatment R1,500–R5,000. Attend to loose panels before high winds turn them into a hazard.",
			poor: "Get quotes for re-sheeting the carport roof — typically R5,000–R15,000 depending on size and material (IBR, corrugated, or polycarbonate). Use quotes in price discussions or budget for replacement shortly after purchase."
		}
	},

	"Carport surface and drainage": {
		excellent: "Parking surface under the carport is level and sound with effective drainage carrying rainwater away from vehicles and the house. No pooling, cracking, or erosion visible.",
		good: "Surface in good usable condition with minor cracks or wear typical of age. Drainage functions adequately with no significant pooling under normal rainfall.",
		fair: "Surface or drainage needs attention — cracking, uneven areas, or water pooling after rain. Surface repairs R2,000–R8,000; drainage improvements R3,000–R10,000. Standing water deteriorates both surface and vehicle condition over time.",
		poor: "Surface significantly deteriorated or drainage failing — major cracking, potholes, or persistent water pooling around parked vehicles. Resurfacing R8,000–R25,000 depending on area and material; drainage remediation R5,000–R15,000.",
		issuesRequiringAttention: {
			fair: "Surface patching and drainage improvements typically R2,000–R10,000 combined. Addressing pooling early protects both the surface and vehicles parked on it.",
			poor: "Get quotes for resurfacing (R8,000–R25,000 depending on paving, concrete, or tar) and drainage correction (R5,000–R15,000). Persistent water against the house side also risks foundation damage — factor the full remediation into your negotiation."
		}
	},

	// Building Exterior Walls Items (Detailed)
	"Wall structural integrity": {
		excellent: "Exterior walls show solid construction throughout with no cracking, bulging, or signs of settlement. This is a positive indicator of good original construction and ongoing maintenance — important for long-term structural insurance and resale value.",
		good: "Walls are structurally sound with only minor hairline cracking in plaster or paint — these are typically cosmetic and common in any building that has settled or aged. No structural concerns detected.",
		fair: "Some wall cracks or imperfections are visible. Not all cracks are structural: hairline or surface cracks in plaster are usually cosmetic. Diagonal cracks, stepped cracks running through brickwork, or cracks wider than 3–4mm can indicate foundation movement or structural stress and should be evaluated before you commit. A builder can give a general opinion when quoting; a registered structural engineer provides a more definitive assessment.",
		poor: "Serious wall concerns are present — major cracking, bulging sections, or visible structural movement. This is one of the more significant findings a property can have. Banks may decline or impose conditions on a bond until structural issues are formally assessed and resolved, and insurers may flag unresolved structural defects. Do not proceed without a professional structural assessment.",
		issuesRequiringAttention: {
			fair: "For hairline or surface cracks: a qualified builder's opinion is often sufficient and is usually free when requesting a repair quote. For diagonal, stepped, or wide cracks (3mm+): a registered structural engineer can determine whether the issue needs monitoring or active intervention. Site visit and brief assessment: R1,500–R3,500. Full written structural report: R4,000–R8,000.",
			poor: "A registered structural engineer's assessment is important here — a general builder's opinion is not sufficient for serious structural concerns. Site assessment: R1,500–R3,500; comprehensive written structural report: R4,000–R10,000. Wall repairs range from R20,000 for minor underpinning or crack injection to R500,000+ for major structural intervention. The cost of a professional report is small relative to the financial risk of buying without one."
		}
	},

	"Paint and surface condition": {
		excellent: "Exterior paint and finishes in excellent condition with no peeling, fading, or surface deterioration. Well-maintained exterior surfaces protect the underlying structure from moisture and UV damage, and contribute meaningfully to first impressions and resale value.",
		good: "Paint condition generally good with minor areas where touch-ups would improve appearance. Surface protection is maintained adequately — no structural concerns from the condition of the exterior finish.",
		fair: "Paint showing age with some peeling, fading, or wear that will need attention within 1–2 years. Peeling paint on exterior walls can allow moisture into the substrate if left too long. Exterior painting: R35–R90 per square meter depending on wall preparation and paint quality required.",
		poor: "Paint extensively deteriorated with significant peeling, fading, or surface damage across much of the exterior. Beyond aesthetics, deteriorated exterior paint allows moisture into walls and can accelerate substrate damage. Complete exterior repaint including surface preparation: R45–R130 per square meter. For an average 150m² single-storey home exterior, this typically ranges R25,000–R60,000 depending on wall area, preparation needed, and material costs."
	},

	"Moisture and water damage": {
		excellent: "No moisture penetration or water damage visible anywhere on the exterior walls. Excellent weather sealing and drainage preventing building deterioration from water ingress.",
		good: "No significant moisture issues detected. Minor areas may need attention but no evidence of ongoing water penetration problems.",
		fair: "Some moisture concerns are visible — damp patches, water staining, or efflorescence (white mineral deposits on the wall surface) indicate water is getting in somewhere. Moisture issues worsen over time if the underlying cause is not addressed. A specialist damp inspection identifies the source — whether a leaking pipe, inadequate waterproofing, or drainage issue — before any repair.",
		poor: "Obvious moisture problems are present — significant water staining, visible damp patches, mould growth, or actual water penetrating the walls. These indicate an ongoing source that must be identified and stopped before remediation is useful. Moisture damage can affect plaster, timber, electrical installations, and insulation. In severe cases it creates mould with potential health implications, and banks may flag significant damp in a property valuation.",
		issuesRequiringAttention: {
			fair: "A damp specialist or waterproofing contractor can diagnose the source and extent — most offer a free initial site visit. If investigation requires opening walls, expect R1,500–R4,000. Minor moisture repairs once the source is fixed: R5,000–R20,000. Always fix the source first, then the symptom — doing it in reverse wastes money.",
			poor: "Get a specialist damp inspection to identify the moisture source before getting repair quotes — fixing symptoms without fixing the cause is ineffective. Investigation: R1,500–R4,000. Remediation depending on cause and extent: R10,000–R80,000+. If a leaking pipe is involved, a plumber addresses that separately: R1,000–R8,000."
		}
	},

	"Foundation visibility": {
		excellent: "Visible foundation areas in excellent condition — no cracking, settlement, moisture staining, or structural movement detected. Sound foundations are fundamental to the entire building's integrity and long-term value.",
		good: "Foundation appears structurally sound with only minor cosmetic concerns. No evidence of settlement or structural movement — a positive indicator for the building's structural health and long-term maintenance costs.",
		fair: "Some visible foundation concerns are present — minor cracking, moisture staining, or early signs of movement. In South Africa, clay-rich soils that expand and contract with moisture are a primary cause of foundation movement, particularly in Gauteng, Free State, and parts of KZN. A professional assessment will confirm whether what's visible is cosmetic or needs active attention.",
		poor: "Serious foundation concerns are visible — this is one of the most significant findings a property can have. Foundation problems affect the entire structural integrity of the building and are very costly to remediate. South African banks regularly decline or impose conditions on bonds for properties with unresolved foundation issues, and some insurers limit structural cover where pre-existing defects are present. Do not commit without a professional structural engineering assessment.",
		issuesRequiringAttention: {
			fair: "A registered structural engineer or qualified building inspector can assess the significance of what's visible. Initial site visit and assessment: R1,500–R4,500. Full written foundation report: R4,000–R9,000. If it's cosmetic, you'll have documented peace of mind. If intervention is needed, you'll know the scope before you commit.",
			poor: "Engage a registered structural engineer — this is not a situation for a general builder's opinion. Professional assessment: R2,500–R5,000; comprehensive structural report: R5,000–R12,000. Foundation remediation varies widely by soil type, foundation type, and extent of failure: from R50,000 for minor underpinning to R1,000,000+ for major intervention. Understanding this cost before you buy is essential."
		}
	},

	// Gutters Items (Detailed)
	"Gutter condition and attachment": {
		excellent: "Gutters and downpipes securely attached with no sagging, rust, or damage. Properly installed and maintained gutters direct rainwater away from the building and protect foundations from water accumulation.",
		good: "Gutters generally well-attached with only minor maintenance needs. Water collection and direction away from foundations is functioning adequately — no concerns.",
		fair: "Some gutter repairs needed — loose sections, minor damage, or areas where sagging is affecting water flow. Gutters that don't drain properly allow water to overflow against the building and can contribute to foundation moisture and fascia board rot over time. Gutter repairs: R200–R500 per meter depending on the work needed.",
		poor: "Gutters poorly maintained with loose attachment, significant damage, or inadequate drainage capacity. This allows water to overflow onto walls and against foundations, particularly during heavy Highveld or coastal downpours. Left unaddressed, this contributes to moisture penetration and accelerates deterioration of fascia boards, soffits, and external walls. Gutter replacement: R350–R700 per meter depending on material (aluminium vs PVC vs IBR)."
	},

	"Drainage effectiveness": {
		excellent: "Gutter system effectively collects and directs water away from foundations preventing moisture problems and structural damage.",
		good: "Drainage generally effective with water properly directed away from building. Minor improvements could enhance foundation protection.",
		fair: "Adequate drainage but some areas where water management could be improved. Drainage improvements R5,000-R20,000 depending on modifications needed.",
		poor: "Poor drainage allowing water to pool near foundations or overflow causing potential structural damage. Comprehensive drainage solutions R10,000-R40,000+ depending on requirements."
	},

	"Maintenance and cleaning needs": {
		excellent: "Gutters clean and well-maintained with easy access for future cleaning. Minimal debris buildup affecting drainage performance.",
		good: "Reasonable maintenance level with minor cleaning needed. Accessible for regular maintenance to maintain optimal drainage.",
		fair: "Some cleaning and maintenance needed for optimal performance. Professional cleaning R1,500-R4,000 annually depending on property size and access.",
		poor: "Significant maintenance backlog with blocked gutters affecting drainage performance. Immediate professional cleaning R2,000-R6,000 plus ongoing maintenance program."
	},

	// Roof Items (Detailed)
	"Roof surface condition": {
		excellent: "Roof covering is in excellent condition throughout — no broken or missing tiles, no exposed felt or structure, ridge capping properly bedded, and no rust or damage on metal sheeting. A sound roof reduces risk for both bond approval and insurance, and gives you confidence that no hidden water damage has accumulated in ceilings or structure.",
		good: "Roof condition is good with only minor maintenance needs — perhaps a few slightly loose or cracked tiles, minor ridge capping wear, or small isolated areas to monitor. These are routine maintenance items that don't compromise weather protection overall. Banks and insurers typically raise no concerns with a good-condition roof.",
		fair: "Some roof areas need attention — this could be broken or missing tiles, ridge capping that's cracking or lifting, rust spots on corrugated sheeting, or visible wear in the sarking (felt) where exposed. While weather protection may still be adequate now, roof defects worsen over time through the heat-expansion cycle and hail. Roof condition is an item both lenders and insurers look at closely — defects can affect bond approval terms and insurance conditions.",
		poor: "Significant roof damage is present. In South Africa's climate — intense summer heat, hail, and heavy rain in most regions — a compromised roof allows water penetration that damages ceilings, causes mould, damages electrical fittings, and can progressively affect the roof structure itself. SA banks may decline or impose conditions on a bond until roof issues are resolved, and home insurers may decline to cover damage arising from pre-existing roof defects. This should be thoroughly assessed and costed before you proceed.",
		issuesRequiringAttention: {
			fair: "A professional roof inspection identifies exactly what needs doing before you commit. Inspection cost: R1,500–R3,000. Minor tile repairs and rebedding: R5,000–R20,000. Ridge capping repoint and reseat: R8,000–R25,000. Get 2–3 contractor quotes — use these in your price negotiation or factor into your post-purchase maintenance budget.",
			poor: "Get quotes from 2–3 registered roofing contractors. Ask each whether repair or replacement is the more practical solution for the damage present. Partial tile repair and rebed: R15,000–R50,000. Major partial repair: R50,000–R150,000. Full replacement: R100,000–R350,000+ (varies by roof area, pitch, and material — clay vs concrete tiles vs IBR sheeting). Professional inspection before commissioning work (R1,500–R3,000) helps you understand options and contractor quotes."
		}
	},

	"Structural integrity": {
		excellent: "Roof structure shows excellent integrity with no sagging, damaged trusses, or load-bearing concerns. Sound timber construction supporting the roof covering — no signs of rot, termite damage, or movement.",
		good: "Roof structure sound with no integrity concerns detected. Normal construction characteristics for the building's age and roof type.",
		fair: "Some indicators of roof structure concern are present — this could be slight sagging in the roofline, movement in rafters or trusses, or visible timber that warrants closer inspection. Roof structural issues are important to identify early, as progressive movement leads to more expensive remediation. A roofing contractor can provide a general opinion when quoting surface repairs; a structural engineer provides a more definitive assessment of load-bearing elements.",
		poor: "Serious roof structural concerns are present — significant sagging, damaged or failed trusses, or visible structural movement. This is separate from the roof covering condition and is more serious. Structural failure of a roof is a major repair project, and banks may impose bond conditions where structural defects are documented. Engage a professional with roofing structural experience before proceeding.",
		issuesRequiringAttention: {
			fair: "A roofing contractor can assess visible structural concerns when quoting surface work (usually free). For anything more than minor sagging or isolated damage, a structural engineer or experienced building inspector provides a more reliable assessment: R1,500–R3,500 for a site assessment. Early identification prevents much more expensive intervention later.",
			poor: "Engage a structural engineer experienced with roof structures. Assessment: R2,000–R4,500. Truss repair or partial reconstruction: R20,000–R120,000 depending on extent. Complete roof structure replacement: R150,000–R400,000+. A professional structural report is also important documentation for bond applications and insurance purposes."
		}
	},

	"Insulation and energy efficiency": {
		excellent: "Excellent ceiling insulation providing outstanding temperature control year-round. This directly reduces electricity costs for cooling in summer and heating in winter — a meaningful ongoing financial benefit given SA's consistently rising Eskom tariffs. Well-insulated ceilings are increasingly valued by buyers and can support better energy efficiency ratings.",
		good: "Good insulation that reduces energy costs meaningfully throughout the year. Current provision is adequate and will make a measurable difference to electricity bills, particularly in summer when uninsulated ceiling spaces can reach temperatures above 50°C and transfer that heat directly into living areas.",
		fair: "Some insulation is present but it may be thin, incomplete, or aged. Improving ceiling insulation is one of the most cost-effective home improvements available — it reduces Eskom electricity consumption for cooling and heating, and improves year-round comfort. Installation is typically completed in a single day. Standard glasswool insulation (100–135mm): R50–R120 per square meter installed.",
		poor: "Little or no ceiling insulation is present. Without it, intense summer heat transfers directly into living spaces and heat escapes rapidly in winter — both adding significantly to electricity costs. Given consistent Eskom tariff increases above inflation, this is a growing monthly cost. Installation is straightforward and typically done in one day. Glasswool or polyester insulation (100–135mm thickness): R50–R120 per square meter installed. For a typical 150m² ceiling area, expect R7,500–R18,000. The investment typically pays back in electricity savings within 3–5 years."
	},

	// Site Drainage Items (Detailed)
	"Drainage system effectiveness": {
		excellent: "Comprehensive drainage system effectively managing water flow and preventing accumulation. Professional installation provides solid protection for foundations, landscaping, and the building envelope during heavy rain.",
		good: "Effective drainage managing water flow adequately. Systems provide reasonable protection against water damage to foundations and the building during normal to moderate rainfall events.",
		fair: "Drainage is generally working but some areas could be improved for better protection during heavy rainfall — common in Highveld summer thunderstorms or coastal downpours. Issues could include slow-draining channels, areas where water pools near the structure, or inadequate grading directing water toward the building.",
		poor: "Poor drainage is creating real water management problems — pooling water near the building, slow-draining or partially blocked channels, or inadequate grading directing water toward the structure rather than away from it. Persistent poor drainage is a leading cause of foundation damage and damp penetration in South African homes. Left unaddressed, drainage issues compound into more expensive structural problems over time.",
		issuesRequiringAttention: {
			fair: "A drainage contractor can identify specific issues and recommend solutions — site assessments are usually free when included with a quote. Minor drainage improvements such as additional channels or grading: R5,000–R20,000. More substantial work involving French drains or storm drainage channels: R15,000–R40,000.",
			poor: "Get a drainage or civil contractor to assess the site. Explain what you observe and when (e.g. pooling after rain) to help them diagnose correctly. Comprehensive drainage solutions for residential properties: R25,000–R100,000+ depending on scope and site complexity. This investment protects the building's foundations from far more expensive structural damage later."
		}
	},

	"Water flow and runoff patterns": {
		excellent: "Optimal water flow directing runoff away from all structures with well-considered grading and natural drainage patterns. Good site grading is one of the more underappreciated factors in a property's long-term structural health.",
		good: "Good water flow management with runoff generally directed away from buildings. Minor improvements could enhance protection, but no immediate concerns.",
		fair: "Water flow management could be improved — some areas may have grading that directs water toward the building rather than away from it, or low points where water accumulates after rain. Over time, repeated pooling near the structure contributes to foundation moisture. Site regrading to redirect flow: R5,000–R20,000 depending on scope.",
		poor: "Poor water flow is causing real accumulation problems — water pooling near the building or inadequate grading that channels runoff toward the structure rather than away from it. This is a consistent source of foundation moisture and potential basement or sub-floor damp in affected properties. Site regrading and drainage solutions: R15,000–R70,000+ depending on site complexity and the extent of intervention needed."
	},

	"Drain accessibility and maintenance": {
		excellent: "All drainage systems easily accessible with clear maintenance access ensuring continued effective water management and system longevity.",
		good: "Good drain accessibility facilitating regular maintenance and system monitoring for continued effective operation.",
		fair: "Adequate drain access but improvements could facilitate maintenance. Access improvements R3,000-R10,000 enhance maintenance capability.",
		poor: "Poor drain accessibility complicating maintenance and potentially allowing drainage problems to develop. Access improvements R5,000-R20,000 for proper maintenance."
	},

	"Foundation protection": {
		excellent: "Excellent foundation water protection with comprehensive waterproofing and drainage preventing moisture infiltration. Well-protected foundations significantly extend a building's structural lifespan and reduce the risk of settlement-related wall cracking.",
		good: "Good foundation protection with effective drainage and waterproofing providing solid defence against moisture ingress. No immediate concerns — standard maintenance is sufficient.",
		fair: "Foundation water management could be improved. This may include areas where soil contacts the foundation without waterproofing, inadequate drainage directing water toward the structure, or visible moisture staining at foundation level. In South Africa, sustained moisture against foundations — particularly in clay-heavy soils common across Gauteng, Free State, and KZN — is a primary long-term cause of foundation movement and progressive wall cracking.",
		poor: "Foundation water protection is clearly inadequate, with evidence of moisture intrusion, water pooling against the structure, or absent waterproofing. Sustained moisture exposure causes foundation movement, wall cracking, and structural damage over time. Importantly, ongoing water ingress damage is often specifically excluded from standard South African home insurance policies — meaning remediation costs fall entirely on the owner. This is worth addressing sooner rather than later.",
		issuesRequiringAttention: {
			fair: "A plumber or waterproofing specialist can assess and quote — most provide a free site visit. Bitumen-based waterproofing membrane: R200–R450 per linear meter of foundation. If drainage improvement is also needed, French drain installation: R300–R600 per meter. Factor cost and urgency into your post-purchase maintenance plan.",
			poor: "Get a specialist waterproofing or civil contractor to assess the extent of the problem and recommend whether waterproofing alone is sufficient or whether drainage work is also required. Waterproofing: R250–R500 per meter. Comprehensive drainage solutions: R15,000–R60,000+ depending on scope. Addressing this proactively prevents far more expensive structural remediation later — and protects against insurance exclusions for ongoing water damage."
		}
	},

// Garden Items
"Garden size and condition adequate": {
		excellent: "Well-maintained garden with appropriate size for various lifestyle preferences - perfect for garden enthusiasts or those wanting mature landscaping without overwhelming maintenance.",
		good: "Garden in reasonable condition with manageable size suitable for most buyers who appreciate outdoor space.",
		fair: "Garden condition and size adequate for basic outdoor needs. Consider your gardening interest and maintenance availability - some prefer low-maintenance while others enjoy extensive gardening projects.",
		poor: "Garden needs attention or may not suit your preferences. Perfect for buyers wanting blank canvas for landscaping projects or those preferring minimal garden maintenance. Large overgrown gardens require significant investment (R1,000-R8,000 monthly maintenance) but offer potential for customization."
	},

	"Irrigation system present if needed": {
		excellent: "Efficient irrigation system providing comprehensive coverage - perfect for buyers who want beautiful gardens without intensive watering routines.",
		good: "Good irrigation coverage reducing garden maintenance requirements - suitable for most buyers who appreciate outdoor space.",
		fair: "Basic irrigation present, may need improvements depending on your gardening commitment and water management preferences.",
		poor: "Limited or no irrigation system. Perfect for buyers preferring drought-resistant plants or minimal gardens, but requiring installation (R200-R500 per square meter) if you want lush landscapes."
	},

	"Garden aspect and sunlight good": {
		excellent: "Optimal sun exposure perfect for diverse gardening options from vegetables to flowers, or simply beautiful outdoor living spaces.",
		good: "Good sunlight suitable for most outdoor activities and reasonable plant variety options.",
		fair: "Adequate sunlight for basic outdoor needs. Consider your intended use - casual outdoor activities need less sun than serious gardening.",
		poor: "Limited sunlight restricts plant options but perfect for buyers who prefer shaded outdoor spaces, minimal garden maintenance, or focus on indoor living."
	},

	"Maintenance requirements reasonable": {
		excellent: "Garden currently well-maintained and attractive - only needs regular watering, mowing, and seasonal care to stay looking good.",
		good: "Garden in decent shape with minor touch-ups needed like trimming overgrown areas or replacing a few plants.",
		fair: "Garden needs some work to look its best - overgrown areas, weeds, or neglected sections requiring attention over coming months.",
		poor: "Garden currently neglected and unattractive - needs significant cleanup, replanting, or redesign work to restore appearance. Budget R2,000-R8,000 for small gardens/courtyards, R8,000-R25,000 for medium gardens, or R25,000-R50,000+ for large gardens depending on restoration scope."
	},

// Swimming Pool Items
"Pool structure and surface condition": {
    excellent: "Pool shell and surfaces in pristine condition with no cracks, tile damage, or structural defects. Quality construction with excellent finishes and no signs of settling or deterioration.",
    good: "Pool structure sound with minor surface wear like small tile chips or light staining. No structural cracks detected and overall integrity maintained for pool age.",
    fair: "Some surface issues visible including minor cracks, loose tiles, or surface staining requiring attention. Pool structure appears sound but professional assessment recommended.",
    poor: "Multiple visible issues including cracks, tile damage, or surface problems that need professional evaluation. Pool specialist assessment essential to determine actual repair scope and costs. Repair costs vary widely based on specific findings.",
    issuesRequiringAttention: {
        fair: "Pool surface issues may need professional assessment to determine repair requirements. Pool specialist evaluation R500-R2000, potential repairs R8,000-R25,000 depending on findings.",
        poor: "Major pool structural issues require immediate professional assessment. Get quotes from pool specialists - costs vary R70,000-R300,000+. Consider total repair costs versus property value when making purchase decision."
    }
},

"Pool equipment and filtration": {
    excellent: "All pool equipment including pump, filter, automatic cleaner, and heating systems functioning optimally. Equipment well-maintained with good remaining operational life.",
    good: "Pool equipment operational with normal wear for age. Pump and filtration systems working effectively with minor maintenance needs for continued reliable operation.",
    fair: "Some equipment issues requiring professional attention but basic systems functional. Equipment service or component replacement may be needed soon. Service costs R1000-R4,000+.",
    poor: "Pool equipment largely non-functional or obsolete requiring replacement. Pump replacement R2,500-R4,500+, filters R2,000-R4,000+, heating systems R3,000-R7,000+.",
},

"Safety features": {
    excellent: "Pool safety features appropriate for household needs. Compliant fencing (1.2m+ height) and self-closing gates if required. Non-slip surfaces and safety equipment well-maintained.",
    good: "Safety features adequate for most households. Fencing and gates functional with minor improvements beneficial for enhanced safety if needed for your situation.",
    fair: "Basic safety features present. Consider if current setup meets your household safety requirements based on family composition and usage patterns.",
    poor: "Limited safety features may not meet requirements for households with children or frequent young visitors. Safety fencing R300-R600 per meter, if upgrades needed for your situation."
},

"Maintenance costs and requirements": {
    excellent: "Pool excellently maintained with clean water, balanced chemicals, and optimal equipment operation. Ready for immediate use with minimal ongoing maintenance requirements.",
    good: "Well-maintained pool with good water quality and functioning systems. Routine maintenance program in place with reasonable ongoing costs.",
    fair: "Pool maintenance adequate but some attention needed for optimal condition. Water quality acceptable but equipment or chemical balance may need professional attention.",
    poor: "Poor pool maintenance with water quality issues, algae growth, or equipment neglect. Immediate professional intervention required. Monthly pool service R800-R3,000 depending on size and service level."
},

// Water Features Items
"Water circulation and pump systems": {
    excellent: "Water feature circulation and pumps functioning perfectly with efficient operation and reliable water movement throughout feature.",
    good: "Good circulation with minor maintenance beneficial for optimal performance and continued attractive water feature operation.",
    fair: "Adequate circulation but improvements may enhance water feature attractiveness and operational efficiency.",
    poor: "Circulation issues affecting water feature functionality and appeal. Pump replacement R3,000-R15,000 depending on feature complexity and size."
},

"Structural condition": {
    excellent: "Water feature structure in excellent condition with no damage, leaks, or stability concerns requiring immediate attention.",
    good: "Good structural condition with minor maintenance needs but no concerns affecting water feature safety or functionality.",
    fair: "Some structural issues requiring attention but water feature remains functional. Consider repair importance for continued enjoyment.",
    poor: "Structural problems affecting water feature safety and operation. Major repairs R10,000-R50,000+ depending on feature size and complexity."
},

"Maintenance requirements": {
    excellent: "Water feature maintenance very reasonable with efficient design and equipment minimizing ongoing care requirements and costs.",
    good: "Reasonable maintenance needs with manageable ongoing care suitable for most buyers who appreciate water features.",
    fair: "Maintenance requirements moderate but consider your interest in water feature care against aesthetic and relaxation benefits.",
    poor: "High maintenance requirements making water feature expensive to maintain (R1,000-R3,000 monthly). Consider ongoing costs against enjoyment value."
},

"Safety and integration": {
    excellent: "Water feature safely integrated with excellent safety measures and harmonious landscape design enhancing property appeal.",
    good: "Good safety and integration with minor improvements beneficial for enhanced security and aesthetic appeal.",
    fair: "Adequate safety but improvements may benefit family safety and landscape integration depending on your family situation.",
    poor: "Safety integration concerns requiring attention for family safety and insurance liability considerations around water features."
},

// =================================================================
// ASSESSMENT ITEMS - INTERIOR
// =================================================================

// Bedroom Items
"Built-in wardrobes and storage": {
    excellent: "Built-in wardrobes in excellent condition with quality hardware and efficient storage maximizing bedroom organization potential.",
    good: "Good wardrobe condition with minor adjustments beneficial but generally functional storage meeting most organizational needs.",
    fair: "Wardrobes functional but some issues requiring attention. Consider whether storage capacity and organization meets your specific wardrobe requirements.",
    poor: "Storage functionality significantly compromised with broken components. If you have extensive clothing storage needs or prefer organized storage, budget R6,000+ for repairs or R15,000-R35,000 for replacement per bedroom.",
},

"Windows and natural lighting": {
    excellent: "Windows in excellent condition providing optimal natural lighting, security, and energy efficiency enhancing bedroom comfort significantly.",
    good: "Good window condition with minor maintenance needs. Natural lighting adequate for comfortable daily bedroom use.",
    fair: "Windows functional but attention beneficial for optimal operation and lighting. Consider whether current condition meets your comfort and security standards.",
    poor: "Window issues affecting security, operation, or energy efficiency. Replacement R5,000-R15,000 per window. Consider importance for bedroom comfort and security.",
},

"Electrical outlets and lighting": {
    excellent: "Excellent electrical provision with adequate outlets positioned conveniently throughout bedroom, quality lighting fixtures, and no visible damage to switches, plates, or wiring. All outlets function safely with proper grounding, providing comprehensive electrical capacity for modern bedroom needs including charging devices, lamps, and equipment.",
    good: "Good electrical provision with sufficient outlets for standard bedroom needs and functioning lighting. Minor cosmetic issues like scuffed switch plates or outdated fixtures don't affect safety or functionality. Most buyers find this adequate for daily use including basic devices and lighting needs.",
    fair: "Basic electrical provision meets essential needs but additional outlets would improve convenience depending on your technology use patterns and lifestyle. Some outlets may be poorly positioned or lighting fixtures may need updating. Minor electrical damage like cracked switch plates or loose outlets should be addressed for safety and aesthetics.",
    poor: "Limited electrical provision significantly restricts modern bedroom functionality with insufficient outlets, poor lighting, or visible electrical damage including burn marks, exposed wiring, or non-functioning outlets. If you use multiple devices, need bedside charging convenience, or require adequate lighting for reading/work, this will frustrate daily use. Professional electrical upgrades R5,000-R15,000+ per bedroom, with additional costs for damage repair and safety compliance.",
},

"Walls and floors - check for cracks, damp, or mould": {
    excellent: "Walls and floors in pristine condition with quality finishes, attractive tiles or flooring, and excellent workmanship. No structural concerns, moisture issues, or maintenance needs - ready for immediate enjoyment.",
    good: "Good condition with appealing finishes and only minor cosmetic wear that doesn't affect structural integrity or health. Most buyers appreciate the overall quality and presentation.",
    fair: "Acceptable condition but some visible issues like minor cracks, worn finishes, or early moisture signs need attention. Consider whether current appearance meets your standards and factor repair costs into your timeline.",
    poor: "Significant problems including structural cracks, obvious damp/mould, or poor finishes affecting both safety and aesthetics. If you have health sensitivities or prefer move-in ready conditions, this requires immediate attention. Professional assessment and treatment R10,000-R100,000+ depending on severity."
},

// Bathroom Items
"Plumbing fixtures functionality": {
    excellent: "All bathroom plumbing fixtures including taps, shower, and toilet functioning perfectly with excellent water pressure, temperature control, and reliable operation. Toilet flushes efficiently with stable mounting and no leaks. Everything operates smoothly for comfortable daily use.",
    good: "Good plumbing function across all fixtures with minor issues easily managed through routine maintenance. Toilet operates well with only minor adjustments needed. No significant problems affecting daily bathroom comfort and functionality.",
    fair: "Some plumbing issues requiring professional attention but basic functionality maintained. May include inconsistent pressure, minor toilet issues like loose mounting or flushing inefficiency, or temperature control problems. Consider your tolerance for these inconveniences and factor repair costs into your budget.",
    poor: "Multiple plumbing problems significantly affecting daily use including poor pressure, temperature issues, toilet instability, major leaks, or frequent blockages. If you or your family use the bathroom heavily, these issues will be particularly frustrating daily. Professional repairs R10,000-R40,000+ including potential water damage remediation and toilet replacement. Consider whether comprehensive plumbing renovation fits your budget and timeline.",
},

"Drainage - bath, shower, and basin drain quickly": {
    excellent: "All bathroom drainage working perfectly with rapid clearing and no blockage concerns affecting daily use.",
    good: "Good drainage with minor slow clearing easily managed through routine maintenance without affecting bathroom functionality.",
    fair: "Some drainage issues requiring professional attention but basic function maintained for daily bathroom use.",
    poor: "Very slow or blocked drainage causing water to pool during use. Most cases are simple blockages costing R500-R2,000 to clear. Serious pipe or sewage issues can reach R3,000-R8,000+."
},

"Tiling and waterproofing": {
    excellent: "Bathroom tiling and waterproofing in perfect condition providing excellent protection against moisture damage throughout.",
    good: "Good tiling condition with minor grout maintenance beneficial but waterproofing adequate for continued bathroom protection.",
    fair: "Some tiling attention needed but waterproofing adequate with professional maintenance for continued effective moisture protection.",
    poor: "Cracked or loose tiles with water damage or mould. Small area repairs R3,000-R10,000. Multiple walls or full shower R15,000-R30,000. Complete bathroom only if severe damage throughout."
},

"Ventilation and moisture control": {
    excellent: "Excellent bathroom ventilation preventing moisture problems with efficient systems ensuring healthy bathroom environment.",
    good: "Good ventilation with minor improvements beneficial for enhanced moisture control and continued bathroom health.",
    fair: "Adequate ventilation but improvements beneficial for optimal moisture management depending on your family's bathroom use patterns.",
    poor: "Inadequate ventilation will cause ongoing mould and moisture problems, especially in SA's humid climate. Essential if family members have respiratory issues. DIY mould cleaning R50-R500. Professional mould removal R500-R2,000. Extractor fan installation R1,500-R3,000. Severe cases with structural damage R5,000-R10,000+."
},

"Electrical safety and lighting": {
    excellent: "Bathroom electrical completely safe and compliant with excellent lighting provision meeting all safety and functionality requirements.",
    good: "Good electrical safety with minor improvements beneficial for enhanced bathroom functionality and continued safe operation.",
    fair: "Electrical adequate but some safety or functionality improvements beneficial depending on your bathroom safety standards.",
    poor: "Electrical safety concerns warranting professional evaluation. Bathroom electrical upgrades R2,000-R8,000+ for safe daily use."
},

// Kitchen Items
"Cabinetry and storage": {
    excellent: "All kitchen cabinets and drawers operate smoothly with quality hardware. Doors align perfectly, close securely, and hardware feels solid. This indicates good maintenance and quality installation.",
    good: "Most cabinets function well with only 1-2 doors needing minor adjustments. Hardware is solid but may benefit from tightening. This is normal wear for most properties.",
    fair: "Several cabinet doors don't close flush or drawers require extra effort to open/close. Hardware shows wear but still functions. You'll want to factor minor repairs into your timeline - typically R2,000-R5,000 for hardware adjustments.",
    poor: "Multiple cabinets have broken hinges, doors won't stay closed, or drawers are stuck/falling off tracks. This significantly impacts daily cooking and indicates deferred maintenance. Minor repairs (few hinges, hardware tightening) R500-R2,000. Moderate repairs (multiple hinges, drawer slides) R2,000-R5,000. Extensive repairs (many cabinets affected) R5,000-R12,000. Consider if repairs fit your renovation budget or if full kitchen replacement is needed.",
},

"Countertops and work surfaces": {
    excellent: "Countertops are in pristine condition with no damage, stains, or wear. Material appears high-quality and will serve your needs for many years without replacement.",
		good: "Minor surface scratches or light stains that don't affect your cooking needs. This is typical wear that most buyers can live with - consider if it matches your standards.",
		fair: "Visible wear including deeper scratches, stains, or small chips. Still functional but you may want to plan for replacement within 2-3 years if aesthetics matter to you. Consider your cooking habits and standards.",
		poor: "Significant damage including large chips, cracks, burns, or stains that affect food preparation hygiene. Immediate replacement recommended if you cook frequently. Budget R1,500-R5,000 for laminate (3-5sqm kitchen), R5,000-R15,000 for standard granite, R10,000-R25,000 for premium stone, depending on kitchen size and material choice.",
},

"Sink and taps functionality": {
		excellent: "Kitchen sink and taps work perfectly with strong, consistent water pressure and temperature control. No operational issues that would affect your daily cooking routine.",
		good: "Good functionality with adequate pressure for most cooking needs. Minor issues like slight drips are easily fixed and don't impact daily use.",
		fair: "Water pressure adequate for basic needs but may be frustrating if you cook frequently or need to fill large pots quickly. Consider if this matches your cooking style and family size.",
		poor: "Poor pressure significantly affects cooking efficiency, or major leaks risk damaging cabinets underneath. Simple tap repairs (washers, aerator) R350-R1,000. Tap replacement R800-R2,500. Multiple fixtures needing attention R2,000-R5,000. If leaks have damaged cabinets, add R2,000-R8,000 for cabinet repairs. If you cook frequently, these issues will be frustrating daily."
	},

"Appliances and electrical": {
    excellent: "All kitchen appliances and electrical systems functioning perfectly with adequate provision for comprehensive modern cooking needs.",
    good: "Good appliance and electrical function with minor maintenance beneficial for optimal kitchen performance and cooking convenience.",
    fair: "Some appliance or electrical attention needed but basic kitchen functionality maintained for daily cooking requirements.",
    poor: "Major appliance or electrical problems affecting kitchen safety and functionality. Simple appliance repairs R600-R1,500. Kitchen electrical upgrades R3,000-R10,000. Comprehensive appliance replacement and electrical overhaul R15,000-R30,000+."
},

"Plumbing, drainage, and ventilation": {
    excellent: "No signs of water leaks or damage anywhere in kitchen. All connections are dry and secure - indicates good maintenance and no immediate concerns.",
	good: "No active leaks, only minor signs that don't indicate serious problems. This represents normal wear for most properties.",
	fair: "Minor moisture signs or small leaks that need attention to prevent bigger problems. Early intervention now prevents expensive damage later.",
	poor: "Active leaks or existing water damage visible. This creates ongoing structural damage risk and potential mould problems. Requires immediate professional attention. Minor leak repairs R500-R1,500. Water damage to cabinets R2,000-R8,000. Extensive water damage with mould remediation R10,000-R30,000+ depending on extent. Consider if you're prepared for this expense and timeline."
},

// Lounge Items
"Room size and layout": {
    excellent: "Excellent room proportions providing optimal space for furniture arrangement and family activities with flexible layout options.",
    good: "Good room size with practical layout suitable for comfortable family living and reasonable entertaining possibilities.",
    fair: "Room size adequate but layout may present challenges for optimal furniture arrangement depending on your family size and lifestyle.",
    poor: "Room size or layout limitations requiring consideration of your actual living needs and family activity requirements."
},

"Natural lighting and windows": {
    excellent: "Excellent natural lighting with optimal window placement providing bright, welcoming atmosphere throughout the day.",
    good: "Good natural lighting with adequate illumination for comfortable daily activities and reasonable energy efficiency benefits.",
    fair: "Adequate lighting but improvements may enhance room ambiance and reduce electricity costs depending on your lighting preferences.",
    poor: "Limited natural lighting affecting room usability and energy costs. Window improvements R5,000-R20,000+ per window for enhanced lighting."
},

"Electrical and entertainment setup": {
    excellent: "Excellent electrical provision supporting comprehensive entertainment systems with adequate circuits and outlets for modern living needs.",
    good: "Good electrical setup meeting standard entertainment and modern living requirements with reasonable functionality.",
    fair: "Adequate electrical but improvements may enhance entertainment capability and convenience depending on your technology needs.",
    poor: "Limited electrical provision restricting entertainment options and modern living convenience. Upgrades R5,000-R15,000+ for comprehensive improvement."
},

"Walls and floors - check for cracks, damp, or structural issues": {
    excellent: "Walls and floors in perfect condition with no structural, moisture, or maintenance concerns detected throughout living area.",
    good: "Good condition with only minor cosmetic issues not affecting structural integrity or habitability of living space.",
    fair: "Some issues requiring monitoring but not immediately critical to structural safety or daily living comfort.",
    poor: "Serious problems requiring professional assessment for structural integrity and habitability. Structural engineer assessment R2,000-R8,000+. Minor crack and damp repairs R2,000-R8,000. Moderate structural or damp issues R8,000-R25,000. Severe structural problems R20,000-R60,000+ depending on severity."
},

// Family/TV Rooms Items
"Entertainment setup capability": {
    excellent: "Excellent room layout with optimal TV placement options, comfortable viewing angles from multiple seating positions, and space for flexible furniture arrangement. Room proportions work well for family gatherings and daily TV viewing.",
    good: "Good room setup with practical TV placement and adequate viewing angles for family use. Most families find the layout comfortable for daily entertainment and gatherings.",
    fair: "Basic room layout adequate for standard TV viewing but furniture arrangement may require planning for optimal family comfort. Consider whether the space suits your family's viewing habits and gathering style.",
    poor: "Room layout challenges may limit comfortable TV viewing or family seating arrangements. If your family enjoys frequent movie nights or gatherings around the TV, modifications may be needed to achieve comfortable viewing for everyone."
},

"Electrical and connectivity": {
    excellent: "Comprehensive electrical provision with multiple outlets positioned for modern entertainment systems, gaming, and device charging needs.",
	good: "Good electrical setup meeting most families' entertainment needs including TV, basic sound system, and device charging.",
	fair: "Basic electrical adequate for simple entertainment setup. Consider your technology use - gamers and home theater enthusiasts may want additional outlets.",
	poor: "Limited electrical may restrict your entertainment options if you have comprehensive systems, gaming setups, or multiple device charging needs. Electrical upgrades R5,000-R15,000."
},

"Lighting and acoustics": {
    excellent: "Excellent lighting control and acoustics providing optimal entertainment ambiance with quality sound characteristics throughout room.",
    good: "Good lighting and acoustics with minor improvements beneficial for enhanced entertainment experience and viewing comfort.",
    fair: "Adequate lighting and acoustics but improvements may significantly enhance entertainment quality depending on your viewing preferences.",
    poor: "Limited lighting control and acoustics affecting entertainment experience. Basic improvements R2,000-R15,000, extensive work R20,000-R40,000+."
},

"Seating and comfort arrangement": {
    excellent: "Excellent room layout supporting comfortable seating arrangements with optimal viewing angles for various entertainment activities.",
    good: "Good seating capability with practical arrangement for comfortable family entertainment and viewing activities.",
    fair: "Adequate seating arrangement but modifications may improve comfort and viewing experience depending on your family entertainment patterns.",
    poor: "Limited seating arrangement or space restricting comfortable entertainment use. Layout modifications needed for optimal family viewing."
},

// =================================================================
// OTHER FEATURES - Can be added via dropdowns
// =================================================================

// Dining Room Items
"Room size and dining capacity": {
    excellent: "Excellent dining room size providing ample space for dining furniture and comfortable entertaining with flexible arrangement options.",
    good: "Good room size with adequate space for family dining and occasional entertaining suitable for most family sizes.",
    fair: "Room size adequate for basic dining needs but may limit larger gatherings depending on your entertaining preferences and family size.",
    poor: "Compact dining space requiring consideration of your actual dining needs and entertaining frequency against available space."
},

"Lighting and ambiance": {
    excellent: "Excellent dining lighting with quality fixtures creating optimal ambiance for dining and entertaining activities.",
    good: "Good dining lighting with minor improvements beneficial for enhanced dining atmosphere and entertaining capability.",
    fair: "Adequate lighting but improvements may significantly enhance dining experience depending on your entertaining and ambiance preferences.",
    poor: "Limited lighting affecting dining ambiance and entertaining capability. Lighting improvements R2,000-R10,000+ for enhanced dining experience."
},

"Connection to kitchen": {
    excellent: "Excellent kitchen connection providing convenient service access for daily dining and entertaining with efficient food transport.",
    good: "Good kitchen connection with practical service access suitable for comfortable daily dining and reasonable entertaining needs.",
    fair: "Adequate kitchen connection but some inconvenience in serving and cleanup depending on your meal service preferences.",
    poor: "Limited kitchen connection affecting meal service efficiency and entertaining convenience for daily dining activities."
},

"Built-in features and storage": {
    excellent: "Excellent built-in dining features and storage providing optimal functionality and convenience for dining and entertaining activities.",
    good: "Good built-in features with minor additions beneficial for enhanced dining functionality and storage convenience.",
    fair: "Adequate built-in features but additional storage or functionality may improve dining experience depending on your entertaining needs.",
    poor: "Limited built-in features restricting dining functionality and convenience. Additions beneficial for optimal dining room utility."
},

// Reception Items
"Room size and layout for reception use": {
    excellent: "Excellent reception area with optimal proportions for greeting guests and formal entertaining with impressive presentation.",
    good: "Good reception area with adequate space and practical layout suitable for guest reception and formal occasions.",
    fair: "Reception area adequate but layout may require arrangement optimization depending on your formal entertaining frequency and guest reception needs.",
    poor: "Compact reception area requiring consideration of your formal entertaining needs and guest reception priorities."
},

"Natural lighting and ambiance": {
    excellent: "Excellent natural lighting and ambiance creating welcoming atmosphere for guest reception with impressive first impressions.",
    good: "Good lighting and ambiance with minor improvements beneficial for enhanced guest reception and formal entertaining atmosphere.",
    fair: "Adequate ambiance but lighting improvements may enhance guest reception depending on your formal entertaining standards.",
    poor: "Limited lighting and ambiance affecting guest reception quality. Improvements needed for impressive formal entertaining atmosphere."
},

"Electrical and lighting adequacy": {
    excellent: "Excellent electrical provision and lighting control providing optimal reception area functionality with quality ambiance control.",
    good: "Good electrical and lighting with minor improvements beneficial for enhanced reception capability and ambiance control.",
    fair: "Adequate electrical but improvements may enhance reception functionality depending on your formal entertaining electrical needs.",
    poor: "Limited electrical provision restricting reception area functionality. Upgrades R3,000-R10,000+ for optimal formal entertaining capability."
},

"Overall condition and presentation": {
    excellent: "Reception area in excellent condition with quality presentation suitable for impressive formal guest reception.",
    good: "Good condition with minor improvements beneficial for enhanced guest reception and formal entertaining presentation.",
    fair: "Acceptable condition but improvements may enhance guest reception depending on your formal entertaining standards.",
    poor: "Condition affects guest reception quality. Renovation needed for impressive formal entertaining capability."
},

// Study/Office Items
"Room size and layout for office use": {
    excellent: "Excellent office proportions providing optimal workspace for productive work-from-home activities with efficient layout possibilities.",
    good: "Good office space with practical layout suitable for comfortable work and productivity requirements.",
    fair: "Office size adequate but layout optimization may improve work productivity depending on your home office needs and work patterns.",
    poor: "Compact office space requiring consideration of your actual work-from-home requirements and productivity needs."
},

"Natural lighting and windows": {
    excellent: "Excellent natural lighting with optimal window placement providing ideal work environment lighting and energy efficiency.",
    good: "Good natural lighting with adequate window provision for comfortable daily work activities and reasonable lighting conditions.",
    fair: "Adequate lighting but improvements may enhance work environment and reduce eye strain depending on your work lighting preferences.",
    poor: "Limited natural lighting affecting work productivity and comfort. Window improvements needed for optimal home office environment."
},

"Electrical outlets and technology": {
    excellent: "Excellent electrical provision with comprehensive outlets and technology support for modern home office equipment and connectivity needs.",
    good: "Good electrical provision meeting standard office equipment and technology requirements with adequate power and outlet positioning.",
    fair: "Adequate electrical but additional outlets may improve office functionality depending on your equipment needs and technology requirements.",
    poor: "Limited electrical provision restricting modern office functionality. Upgrades R3,000-R10,000+ for contemporary home office needs."
},

"Storage and organization": {
    excellent: "Excellent built-in storage and organization features providing optimal office efficiency and professional workspace organization.",
    good: "Good storage provision with minor additions beneficial for enhanced office organization and workspace efficiency.",
    fair: "Adequate storage but additional organization features may improve office productivity depending on your work organization needs.",
    poor: "Limited storage restricting office functionality and organization. Storage solutions needed for productive home office environment."
},

// Laundry Room Items
"Plumbing connections present": {
    excellent: "All necessary plumbing professionally installed with excellent provision for comprehensive laundry equipment and maintenance access.",
    good: "Good plumbing connections with proper installation meeting standard laundry equipment needs with reasonable access.",
    fair: "Adequate plumbing but some improvements may enhance laundry functionality depending on your equipment preferences and laundry routines.",
    poor: "Limited plumbing connections restricting laundry equipment options. Professional installation R5,000-R15,000+ needed for comprehensive laundry functionality."
},

"Electrical supply adequate": {
    excellent: "Excellent electrical supply with proper circuits and optimal outlet positioning for all modern laundry equipment including high-efficiency machines.",
    good: "Good electrical provision meeting standard laundry equipment power requirements with adequate outlet positioning and circuit capacity.",
    fair: "Adequate electrical but additional circuits or outlets may improve laundry functionality depending on your equipment efficiency preferences.",
    poor: "Limited electrical supply restricting modern laundry equipment options. Professional upgrades R3,000-R8,000+ for optimal laundry room functionality."
},

"Space and ventilation adequate": {
    excellent: "Excellent laundry room proportions and ventilation providing optimal working environment with effective moisture control.",
    good: "Good space and ventilation with minor improvements beneficial for enhanced laundry comfort and moisture management.",
    fair: "Adequate space and ventilation but improvements may enhance working comfort depending on your laundry activity levels.",
    poor: "Limited space or ventilation creating working challenges. Improvements needed for comfortable laundry activities and moisture control."
},

"Storage and organization": {
    excellent: "Excellent storage and organization features providing optimal laundry room efficiency with comprehensive storage solutions.",
    good: "Good storage provision with minor additions beneficial for enhanced laundry organization and efficiency.",
    fair: "Adequate storage but additional organization features may improve laundry efficiency depending on your laundry organization preferences.",
    poor: "Limited storage restricting laundry room functionality. Storage solutions needed for efficient laundry management and organization."
},

// Home Theater Items
"Room acoustics and lighting control": {
    excellent: "Excellent acoustics and lighting control providing optimal home theater experience with professional-quality sound and ambiance management.",
    good: "Good acoustics and lighting with minor improvements beneficial for enhanced theater experience and viewing quality.",
    fair: "Adequate acoustics and lighting but professional improvements may significantly enhance theater quality depending on your entertainment standards.",
    poor: "Limited acoustics and lighting control restricting theater experience. Professional improvements R15,000-R50,000+ for quality home theater environment."
},

"Electrical and technology infrastructure": {
    excellent: "Excellent electrical and technology infrastructure supporting comprehensive home theater systems with optimal connectivity and power management.",
    good: "Good electrical and technology support with minor upgrades beneficial for enhanced theater capability and equipment support.",
    fair: "Adequate infrastructure but improvements may enhance home theater technology support depending on your entertainment system requirements.",
    poor: "Limited electrical and technology infrastructure restricting theater capability. Comprehensive upgrades R10,000-R30,000+ for modern home theater systems."
},

"Seating and viewing arrangement": {
    excellent: "Excellent seating configuration with optimal viewing angles providing ideal theater experience for all seating positions.",
    good: "Good seating arrangement with practical viewing angles suitable for comfortable theater use and family entertainment.",
    fair: "Adequate seating but modifications may improve viewing experience depending on your theater comfort and viewing preferences.",
    poor: "Limited seating arrangement restricting theater enjoyment. Layout modifications needed for optimal viewing experience and comfort."
},

"Sound insulation and room design": {
    excellent: "Excellent sound insulation preventing noise transfer with optimal room design supporting superior theater acoustics.",
    good: "Good sound control with minor improvements beneficial for enhanced theater experience and noise management.",
    fair: "Adequate sound control but improvements may enhance theater quality and reduce noise transfer depending on your acoustic preferences.",
    poor: "Limited sound insulation affecting theater experience and creating noise concerns. Professional acoustic treatment R20,000-R80,000+ for optimal theater environment."
},

// =================================================================
// ELECTRICAL SAFETY ITEMS (Other Features Category)
// =================================================================

"No electrical hazards or exposed wiring": {
    excellent: "All electrical installations completely safe with no hazards detected and full compliance with safety standards throughout property.",
    good: "Electrical system safe with only minor improvements needed for optimal safety compliance and continued reliable operation.",
    fair: "Some electrical concerns requiring professional attention but no immediate safety hazards detected in current installation.",
    poor: "Serious electrical hazards including exposed wiring, burnt outlets, or dangerous installations creating immediate safety threats. This is fire and electrocution risk requiring emergency attention. Minor repairs R1,000-R3,000. Major electrical work R8,000-R20,000+. COC certificate R750-R2,500 essential before occupation.",
    issuesRequiringAttention: {
        fair: "Electrical safety assessment recommended for continued compliance and safety assurance. Professional evaluation typically R2,000-R5,000+.",
        poor: "Critical electrical hazards warranting prompt professional evaluation. Comprehensive electrical safety work R8,000-R20,000+ recommended before occupation."
    }
},

"DB board appears neat and properly labeled": {
    excellent: "Distribution board professionally installed with clear labeling and neat wiring meeting all safety and compliance standards.",
    good: "DB board in good condition with mostly proper installation and labeling meeting safety requirements with minor improvements beneficial.",
    fair: "DB board acceptable but labeling improvements and minor safety upgrades recommended for optimal electrical management.",
    poor: "DB board installation indicates electrical compliance concerns affecting property transfer requirements and safety standards. Professional assessment R2,000-R5,000+ for compliance."
},

"Main electrical outlets working throughout property": {
    excellent: "All electrical outlets functioning perfectly throughout property with adequate capacity meeting modern electrical safety and functionality requirements.",
    good: "Most outlets working well with minor electrical maintenance needed for optimal function and continued safe operation.",
    fair: "Most outlets functional but some electrical attention beneficial for complete functionality and safety compliance.",
    poor: "Multiple electrical outlets not working properly affecting daily functionality and indicating potential electrical safety concerns. Professional assessment worth considering."
},

"Electrical certificate of compliance available": {
    excellent: "Current electrical certificate of compliance (COC) is available with all electrical work properly certified and documented. This satisfies the legal requirement for property transfer in South Africa and confirms the installation was assessed as safe at the time of issue.",
    good: "Electrical COC is available with only minor updates that may be needed. Generally compliant with legal transfer requirements — confirm with the seller and your conveyancing attorney what specific updates, if any, are required before transfer.",
    fair: "A certificate exists but updates may be needed to reflect recent work or meet current standards. A valid COC is a legal requirement for property transfer in SA — the seller is obligated to provide one. Clarify with the seller and your attorney exactly what is needed and who covers the cost before signing.",
    poor: "No electrical COC is available. A valid certificate of compliance is a legal requirement for property transfer in South Africa — a property cannot be transferred without one. The seller is legally obligated to provide it. COC from a registered electrician: R750–R2,500 for an inspection and certificate. If installation defects are found that require repair before certification, add R1,500–R20,000+ depending on what's found. Ensure this is clearly addressed in your offer to purchase."
},

// =================================================================
// SOLAR POWER ITEMS (Other Features Category)
// =================================================================

"Solar panel condition and performance": {
    excellent: "Solar panels in perfect condition with optimal performance and excellent energy production efficiency meeting all power generation expectations.",
    good: "Good panel condition with minor cleaning or maintenance beneficial for continued optimal performance and energy production.",
    fair: "Panels functional but professional assessment and maintenance may improve efficiency and energy production output.",
    poor: "Solar panel damage or performance issues affecting energy production. Professional evaluation worth noting as replacement costs R50,000-R150,000+ depending on system size.",
    issuesRequiringAttention: {
        fair: "Solar panel maintenance recommended for optimal energy production. Professional cleaning and assessment typically R3,000-R8,000.",
        poor: "Solar panel replacement may be required for effective energy production. Professional assessment worth considering as investment R50,000-R150,000+ depending on system requirements."
    }
},

"Inverter and system monitoring": {
    excellent: "Inverter functioning perfectly with excellent system monitoring providing comprehensive performance tracking and reliable power conversion.",
    good: "Good inverter function with minor improvements beneficial for enhanced monitoring and continued reliable solar power conversion.",
    fair: "Inverter working but may need replacement planning or monitoring attention for optimal solar power utilization.",
    poor: "Inverter failed or monitoring non-functional preventing effective solar power utilization. Replacement essential (R15,000-R40,000) for solar system functionality.",
    issuesRequiringAttention: {
        fair: "Inverter maintenance or replacement planning recommended. Inverters typically require replacement every 8-12 years at R15,000-R40,000.",
        poor: "Inverter replacement essential for solar system functionality. Investment R15,000-R40,000+ required for continued solar power benefits."
    }
},

"Battery storage system": {
    excellent: "Battery storage functioning perfectly with excellent capacity providing reliable backup power for load shedding protection.",
    good: "Good battery performance with minor maintenance beneficial for continued optimal backup power capability and system longevity.",
    fair: "Battery system functional but capacity or maintenance attention may improve backup power reliability and duration.",
    poor: "Battery system failed or degraded providing inadequate backup power protection. Replacement essential (R40,000-R150,000) for load shedding protection.",
    issuesRequiringAttention: {
        fair: "Battery system maintenance or replacement planning recommended. Lithium batteries typically last 8-15 years requiring R30,000-R100,000 replacement.",
        poor: "Battery system replacement essential for backup power capability. Investment R30,000-R100,000+ required for load shedding protection."
    }
},

"Installation and maintenance": {
    excellent: "Solar installation professionally completed with excellent maintenance history and proper documentation ensuring continued reliable operation.",
    good: "Good installation quality with minor maintenance improvements beneficial for continued system longevity and performance.",
    fair: "Installation adequate but maintenance attention may improve system performance and longevity depending on system age and condition.",
    poor: "Installation quality or maintenance concerns affecting system performance and safety. Professional assessment needed for optimal operation."
},

// =================================================================
// BACKUP POWER/UPS ITEMS (Other Features Category)
// =================================================================

"UPS system functionality": {
    excellent: "UPS system functioning perfectly providing comprehensive backup power with excellent capacity for load shedding protection.",
    good: "Good UPS performance with minor maintenance beneficial for continued optimal backup power capability and reliability.",
    fair: "UPS working but capacity or component attention may improve backup power reliability during outages.",
    poor: "UPS non-functional during load shedding providing no backup power protection. Essential for modern living requiring replacement R25,000-R80,000+.",
    issuesRequiringAttention: {
        fair: "UPS system maintenance or upgrade recommended for enhanced backup power reliability. Professional improvements typically R10,000-R30,000.",
        poor: "UPS system replacement essential for backup power capability during frequent load shedding. Investment R15,000-R50,000+ for comprehensive backup power."
    }
},

"Load management and capacity": {
    excellent: "Excellent load management with optimal capacity supporting essential appliances during outages with comprehensive backup power coverage.",
    good: "Good load management with adequate capacity for most backup power requirements during typical outage durations.",
    fair: "Adequate load management but capacity may limit backup power effectiveness depending on your essential power requirements during outages.",
    poor: "Limited load management or capacity restricting backup power effectiveness during outages. System upgrades needed for adequate protection."
},

"Battery condition and maintenance": {
    excellent: "UPS batteries in excellent condition with optimal performance and proper maintenance ensuring reliable backup power duration.",
    good: "Good battery condition with minor maintenance beneficial for extended battery life and continued reliable performance.",
    fair: "Battery condition adequate but replacement planning may be needed for continued optimal backup power reliability.",
    poor: "UPS batteries failed or degraded providing inadequate backup power duration. Battery replacement needed (R2,000-R15,000+) for system functionality."
},

"System monitoring and control": {
    excellent: "Excellent UPS monitoring and control providing comprehensive system management with performance tracking and optimization capabilities.",
    good: "Good monitoring with minor improvements beneficial for enhanced system management and backup power optimization.",
    fair: "Basic monitoring adequate but improvements may enhance system management depending on your backup power management preferences.",
    poor: "Limited monitoring restricting system management and optimization capabilities for effective backup power management."
},

// =================================================================
// BOREHOLE ITEMS (Other Features Category)
// =================================================================

"Borehole operational": {
    excellent: "Borehole fully operational with excellent water quality and reliable flow rate providing comprehensive water security for property needs.",
    good: "Good borehole operation with minor maintenance beneficial for continued optimal water supply and quality assurance.",
    fair: "Borehole operational but attention to flow, quality, or equipment may improve water supply reliability and performance.",
    poor: "Borehole system problems affecting water supply reliability. Professional assessment worth noting as new borehole costs R30,000-R100,000+ for water security.",
    issuesRequiringAttention: {
        fair: "Borehole maintenance recommended for optimal water supply reliability. Professional service typically R10,000-R25,000.",
        poor: "Borehole system requires major attention for reliable water supply. Repairs or replacement R20,000-R100,000+ for water security."
    }
},

"Water quality": {
    excellent: "Excellent water quality meeting all standards with optimal flow rate supporting comprehensive property water requirements efficiently.",
    good: "Good water quality and flow with minor improvements beneficial for enhanced water supply reliability and quality assurance.",
    fair: "Adequate water quality and flow but improvements may enhance water supply performance depending on your water quality and volume requirements.",
    poor: "Water quality or flow concerns affecting supply reliability. Professional assessment and treatment needed for safe and adequate water supply."
},

"Equipment condition": {
    excellent: "Borehole pump and pressure system functioning perfectly providing reliable water supply with excellent pressure throughout property.",
    good: "Good pump performance with minor maintenance beneficial for continued optimal water supply reliability and pressure consistency.",
    fair: "Pump working but attention may improve water supply performance depending on your water pressure and reliability expectations.",
    poor: "Pump system problems affecting water supply reliability. Pump replacement typically R7,000-R20,000+ for borehole functionality."
},

// =================================================================
// IRRIGATION SYSTEMS ITEMS (Other Features Category)
// =================================================================

"Irrigation system effectiveness": {
    excellent: "Irrigation system highly effective providing comprehensive coverage with excellent water efficiency supporting healthy landscape throughout property.",
    good: "Good irrigation effectiveness with minor improvements beneficial for enhanced coverage and continued efficient water management.",
    fair: "Irrigation adequate but zone attention or efficiency improvements may enhance plant health depending on your landscaping priorities.",
    poor: "Irrigation system largely ineffective requiring comprehensive restoration. System overhaul typically R20,000-R60,000 for effective landscape maintenance.",
    issuesRequiringAttention: {
        fair: "Irrigation maintenance recommended for optimal landscape health. Professional improvements typically R5,000-R15,000.",
        poor: "Irrigation system overhaul needed for effective landscape maintenance. Comprehensive restoration R20,000-R60,000+ for property landscaping."
    }
},

"System control and automation": {
    excellent: "Excellent irrigation control and automation providing optimal watering schedules with efficient water management and convenience.",
    good: "Good control system with minor improvements beneficial for enhanced automation and water efficiency management.",
    fair: "Basic control adequate but automation improvements may enhance water management depending on your irrigation convenience preferences.",
    poor: "Limited control system restricting irrigation effectiveness and water management. Control upgrades needed for optimal irrigation management."
},

"Maintenance and water efficiency": {
    excellent: "Irrigation system well-maintained with excellent water efficiency and minimal maintenance requirements ensuring cost-effective landscape management.",
    good: "Good maintenance with minor improvements beneficial for enhanced water efficiency and reduced ongoing maintenance requirements.",
    fair: "Adequate maintenance but improvements may enhance water efficiency and system longevity depending on your water management priorities.",
    poor: "Maintenance concerns causing water waste and system inefficiency. Professional maintenance needed for optimal water management and cost control."
},

// =================================================================
// WATER TANK/STORAGE ITEMS (Other Features Category)
// =================================================================

"Water tank capacity and condition": {
    excellent: "Water tank in excellent condition with optimal capacity providing reliable water storage and backup supply for property needs.",
    good: "Good tank condition with adequate capacity and minor maintenance beneficial for continued optimal water storage capability.",
    fair: "Tank functional but capacity or condition attention may improve water storage reliability depending on your water security priorities.",
    poor: "Tank problems affecting water storage capability. Tank replacement typically R8,000-R25,000 depending on capacity requirements for water security.",
    issuesRequiringAttention: {
        fair: "Water tank maintenance or capacity evaluation recommended for continued reliability. Professional service typically R5,000-R15,000.",
        poor: "Water tank replacement needed for adequate water storage capability. Investment R8,000-R25,000+ for water security and backup supply."
    }
},

"Installation and connections": {
    excellent: "Water tank professionally installed with excellent connections and optimal integration with property water systems ensuring reliable operation.",
    good: "Good installation with minor improvements beneficial for enhanced water system integration and continued reliable performance.",
    fair: "Installation adequate but improvements may enhance water system performance depending on your water management and reliability requirements.",
    poor: "Installation quality concerns affecting water system performance. Professional reinstallation typically R7,000-R20,000+ for optimal water system integration."
},

"Maintenance and cleaning": {
    excellent: "Water tank properly maintained with regular cleaning and excellent water quality management ensuring healthy water supply.",
    good: "Good maintenance level with minor improvements beneficial for continued water quality and tank longevity.",
    fair: "Basic maintenance adequate but enhanced cleaning may improve water quality and system life depending on your water quality standards.",
    poor: "Maintenance concerns affecting water quality and health safety. Professional cleaning and maintenance R2,000-R5,000+ for safe water supply."
},

// =================================================================
// GAS INSTALLATION (Other Features Category)
// =================================================================

"Gas installation safety and compliance": {
    excellent: "Gas installation fully compliant with safety regulations and professionally installed with current certificates ensuring safe operation.",
    good: "Good gas installation with minor maintenance needed but maintaining full safety compliance and reliable operation.",
    fair: "Gas installation adequate but safety improvements or compliance updates may be beneficial within reasonable timeframe.",
    poor: "Gas installation compliance or safety concerns warranting professional evaluation. Gas safety work R7,000-R20,000+ for safe operation."
},

"Gas appliance connections": {
    excellent: "All gas appliances properly connected with quality fittings and professional installation ensuring safe and efficient operation.",
    good: "Good gas connections with minor maintenance beneficial for continued optimal safety and appliance performance.",
    fair: "Gas connections adequate but improvements may enhance safety and appliance performance depending on your safety standards.",
    poor: "Gas connection concerns affecting safety and appliance operation. Professional gas work R2,000-R10,000+ for safe operation."
},

"Gas meter and supply": {
    excellent: "Gas meter and supply system in excellent condition with proper installation and clear access ensuring reliable gas supply.",
    good: "Good gas supply with minor improvements beneficial for continued system optimization and maintenance access.",
    fair: "Gas supply adequate but improvements may enhance performance or maintenance access depending on your gas usage requirements.",
    poor: "Gas supply concerns affecting appliance performance and access. Professional gas utility work may be needed for optimal supply."
},

"Gas certificate available": {
    excellent: "Current gas certificate of compliance is available with all gas work properly certified and documented. This meets the legal requirement for property transfer in South Africa where gas installations are present.",
    good: "Gas COC is available with minor updates needed but generally compliant with legal transfer requirements. Confirm with the seller and your attorney what, if anything, needs to be addressed before transfer.",
    fair: "A gas certificate exists but may need updating. A valid gas COC is a legal requirement for transfer where a gas installation is present — the seller must provide one. Clarify what updates are needed and who covers the cost.",
    poor: "No gas certificate of compliance is available. Where a gas installation exists, a valid gas COC is required for legal property transfer in South Africa. The seller is responsible for providing one. Gas COC from a registered gas practitioner: R750–R1,500. If repairs are needed for certification: add R1,000–R15,000+ depending on what's found. Ensure this is addressed in your offer to purchase."
},

// =================================================================
// OUTBUILDINGS(Other Features Category)
// =================================================================

	"Structure appears sound and secure": {
		excellent: "Excellent structural condition with sound construction and weather-tight envelope. Structure appears well-maintained and suitable for your intended use whether accommodation, workspace, or other purposes.",
		good: "Good structural condition with minor maintenance needs but generally sound construction. Structure appears suitable for most intended uses with normal wear appropriate for age.",
		fair: "Structure adequate but showing some wear or minor issues that should be addressed for optimal use. Consider whether current condition suits your intended purpose and timeline.",
		poor: "Structural issues need attention including potential roof, wall, or foundation problems. Evaluate whether renovation investment aligns with your intended use and budget. Repairs typically R15,000-R60,000 depending on extent of issues."
	},

	"Access and security adequate": {
		excellent: "Excellent access arrangements with convenient entry and appropriate security features for the structure's intended use and your privacy needs.",
		good: "Good access with reasonable security measures. Entry convenient for daily use with adequate privacy and security for most purposes.",
		fair: "Basic access adequate for intended use but improvements may enhance convenience or security depending on your specific requirements and comfort levels.",
		poor: "Access challenges or security limitations may affect usability depending on your intended use. Consider whether current arrangements suit your needs or if improvements are worthwhile for your purposes."
	},

	"Size adequate for intended use": {
		excellent: "Spacious outbuilding with generous room for your intended use - whether accommodation, workspace, hobbies, or other purposes. Size allows for comfortable use and organization.",
		good: "Good size with adequate space for most intended uses. Room dimensions work well for various purposes with reasonable comfort and functionality.",
		fair: "Size adequate for basic use but may require careful planning depending on your specific needs. Consider whether dimensions suit your intended activities and comfort requirements.",
		poor: "Compact structure that may limit some uses but could be perfect for buyers with specific space needs or those preferring smaller, more manageable additional buildings."
	},
	
	"Electrical supply if needed": {
    excellent: "Excellent electrical provision with comprehensive outlets, proper circuits, and current compliance certificates suitable for any intended use - workshop, storage, or living accommodation.",
    good: "Good electrical supply with adequate provision for most uses. Minor improvements may enhance functionality but current setup meets standard residential or workshop requirements.",
    fair: "Basic electrical present but upgrades may improve utility depending on intended use. Consider whether current provision suits your workshop, storage, or accommodation needs.",
    poor: "Limited or no electrical supply restricting outbuilding functionality for any intended use. Professional electrical installation R8,000-R25,000+ required for workshop capabilities, security lighting, or habitable accommodation."
},

// =================================================================
// INTERNET ACCESS/FIBRE (Other Features Category)
// =================================================================

"Internet connectivity available": {
    excellent: "High-speed internet connectivity available with multiple service provider options ensuring excellent coverage and reliability.",
    good: "Good internet availability with adequate speeds and reliable service provider options meeting modern connectivity needs.",
    fair: "Basic internet available but speeds or provider options may be limited depending on your connectivity requirements.",
    poor: "Limited or no internet connectivity affecting modern home and work requirements. Fibre infrastructure may require installation investment."
},

"Network coverage quality": {
    excellent: "Excellent mobile network coverage from all major providers with strong signal strength ensuring reliable communication throughout property.",
    good: "Good network coverage with reliable signal from most providers and adequate indoor reception for standard communication needs.",
    fair: "Network coverage adequate but may have weak spots or limited provider choice depending on your communication requirements.",
    poor: "Limited network coverage affecting communication reliability. Signal boosters (R3,000-R10,000+) may be needed for adequate mobile connectivity."
},

// =================================================================
// SPORTS COURT (Other Features Category)
// =================================================================

"Court surface condition": {
    excellent: "Sports court surface in excellent condition with proper drainage and quality markings providing optimal playing experience for intended sport.",
    good: "Good court surface with minor maintenance needed but fully playable and safe for regular recreational use.",
    fair: "Court surface showing wear but adequate for recreational play. Maintenance may improve playing conditions depending on your activity level.",
    poor: "Court surface needs attention for safe play. Resurfacing typically R30,000-R80,000 depending on court type. Consider playing frequency against improvement investment."
},

"Equipment and accessories present": {
    excellent: "Sports court equipment in excellent condition with quality sport-specific accessories properly maintained for optimal playing experience.",
    good: "Good court equipment with minor replacements beneficial but adequate for regular recreational play.",
    fair: "Court equipment functional but replacements may enhance playing experience depending on your activity level and equipment standards.",
    poor: "Court equipment needs attention for optimal play. Equipment replacement R5,000-R25,000 depending on sport requirements."
},

"Court fencing and security": {
    excellent: "Sports court properly fenced with excellent security and ball containment ensuring safe play and property protection.",
    good: "Good court fencing with minor maintenance needed but adequate security and ball containment for recreational use.",
    fair: "Court fencing adequate but improvements may enhance ball containment and security depending on your playing frequency.",
    poor: "Fencing concerns affecting ball containment and security. Fencing replacement R200-R500 per meter essential for court functionality."
},

"Access and lighting adequate": {
    excellent: "Excellent court access with comprehensive lighting enabling safe play at all times and convenient entry to court area.",
    good: "Good access and lighting with minor improvements beneficial for enhanced court usability and safety.",
    fair: "Adequate access and lighting but improvements may enhance court utilization depending on your playing schedule.",
    poor: "Limited access or lighting restricting court use. Lighting installation R10,000-R40,000+ for comprehensive court functionality."
},

// =================================================================
// SMART HOME (Other Features Category)
// =================================================================

"Smart home integration": {
    excellent: "Comprehensive smart home system with excellent integration of lighting, security, climate, and entertainment systems providing advanced convenience.",
    good: "Good smart home features with most systems integrated and functioning reliably for enhanced convenience and automation.",
    fair: "Basic smart home features present but system expansion or integration improvements may enhance convenience depending on your technology preferences.",
    poor: "Smart home systems non-functional or outdated affecting convenience and property value. Modern installation R25,000-R100,000+ depending on desired complexity."
},

"Automation system functionality": {
    excellent: "Home automation systems functioning perfectly with reliable scheduling, remote access, and voice control providing comprehensive convenience.",
    good: "Good automation with minor improvements beneficial for enhanced functionality and user experience.",
    fair: "Automation systems working but updates or programming may improve performance depending on your automation preferences and lifestyle.",
    poor: "Automation systems largely non-functional limiting smart home benefits. System updates or replacement R10,000-R50,000+ for comprehensive automation."
},

// =================================================================
// AIR CONDITIONING (Other Features Category)
// =================================================================

"AC systems functional": {
    excellent: "Air conditioning system in excellent condition with efficient operation providing comprehensive property cooling and optimal comfort.",
    good: "Good AC system with minor maintenance needed but adequate cooling and reasonable efficiency for comfortable living.",
    fair: "AC system functional but service or attention may improve performance and efficiency depending on your cooling comfort requirements.",
    poor: "Air conditioning system inadequate or failed affecting comfort significantly. System replacement R10,000-R40,000+ per unit beneficial for SA climate comfort."
},

"Maintenance and age acceptable": {
    excellent: "AC system well-maintained with recent service history and appropriate age for continued reliable operation and efficiency.",
    good: "Good maintenance level with reasonable age providing continued reliable operation with normal service requirements.",
    fair: "System maintenance adequate but service attention or replacement planning may be beneficial depending on system age and performance.",
    poor: "Maintenance concerns or advanced age indicating replacement planning needed. AC systems typically last 10-15 years with proper maintenance."
},

"Temperature control effective": {
    excellent: "Excellent temperature control with even cooling throughout property and responsive operation providing optimal comfort management.",
    good: "Good temperature control with minor variations but generally effective cooling distribution and responsive operation.",
    fair: "Temperature control adequate but improvements may enhance comfort distribution depending on your climate control preferences.",
    poor: "Limited temperature control affecting comfort significantly with uneven cooling or ineffective operation throughout property."
},

// =================================================================
// HEATING SYSTEMS (Other Features Category)
// =================================================================

"Heating system functional": {
    excellent: "Heating system functioning perfectly with efficient operation providing comprehensive property heating and optimal winter comfort.",
    good: "Good heating system with minor maintenance needed but adequate warmth and reasonable efficiency for comfortable living.",
    fair: "Heating functional but attention may improve performance or efficiency depending on your heating comfort requirements and energy preferences.",
    poor: "Heating system inadequate or failed affecting winter comfort. Replacement cost depends on type — electric heaters R500-R3,000 each, heat pumps R25,000-R60,000, underfloor heating R800-R1,500 per square metre."
},

"Safety and ventilation good": {
    excellent: "Heating system is safe to use with no exposed elements, damaged cords, or ventilation concerns. Any gas heating has proper flue or ventilation in place. Safe for daily winter use.",
    good: "Heating is generally safe with only minor wear, such as a worn cord or slightly loose fitting. No immediate safety concerns, but keep an eye on these items.",
    fair: "Some safety or ventilation concerns are present — for example, an electric heater with a frayed cord, a gas heater without adequate ventilation, or a fireplace/flue that needs cleaning. These should be addressed before regular use, especially in enclosed rooms.",
    poor: "Significant safety concerns identified — exposed heating elements, damaged cords, blocked or missing flues on gas appliances, or a fireplace/chimney that hasn't been swept in years. Gas heaters used without proper ventilation are a carbon monoxide risk and have caused fatalities in South African homes during winter. Have any gas appliance inspected and serviced before use (typically R500-R1,500), and have chimneys/flues swept (R500-R1,200) before lighting fires.",
    issuesRequiringAttention: {
        fair: "Address minor safety items before the next cold spell — replace worn cords (R100-R300), reseat loose fittings, or book a chimney sweep (R500-R1,200) if there's visible soot buildup.",
        poor: "Treat this as a safety priority, not just a maintenance item. Gas appliance safety checks cost R500-R1,500 and protect against carbon monoxide poisoning — a real risk in sealed-up winter rooms. Electric heater replacement R500-R3,000 is often cheaper and safer than repairing a damaged unit."
    }
},

"Energy efficiency acceptable": {
    excellent: "Heating system highly energy efficient with excellent ratings providing optimal comfort with minimal operating costs and environmental impact.",
    good: "Good energy efficiency with reasonable operating costs and acceptable environmental impact for comfortable heating.",
    fair: "Energy efficiency adequate but improvements may reduce operating costs and environmental impact depending on your energy priorities.",
    poor: "Poor energy efficiency with high operating costs making heating expensive and environmentally unfriendly for daily comfort. Older bar heaters and fan heaters cost significantly more to run than heat pumps or oil-filled radiators — factor this into your winter electricity budget."
}
};

// Professional recommendations based on rating combinations
const recommendationTemplates = {
    structural_urgent: {
        priority: "urgent",
        title: "Structural Issues Requiring Immediate Attention",
        description: "Structural problems identified that could affect property safety and value.",
        action: "Obtain professional structural engineer assessment before proceeding with purchase."
    },
    safety_critical: {
        priority: "critical", 
        title: "Safety-Critical Systems Need Repair",
        description: "Essential safety systems (electrical, plumbing, security) require immediate professional attention.",
        action: "Address safety issues before occupancy. Budget for professional repairs and compliance certificates."
    },
    maintenance_moderate: {
        priority: "moderate",
        title: "Routine Maintenance and Repairs",
        description: "Standard maintenance items that should be addressed within 6-12 months.",
        action: "Plan maintenance schedule and budget. Consider negotiating with seller for completion before transfer."
    },
    cosmetic_low: {
        priority: "low",
        title: "Cosmetic and Comfort Improvements", 
        description: "Items affecting aesthetics and comfort but not safety or functionality.",
        action: "Address as budget and time allow. Good opportunity for personal customization."
    }
};

// Cost estimation guidelines
const costGuidelines = {
    kitchen_renovation: {
        basic: { min: 80000, max: 150000, description: "Basic kitchen refresh with existing layout" },
        moderate: { min: 150000, max: 300000, description: "Mid-range renovation with some layout changes" },
        premium: { min: 300000, max: 600000, description: "High-end kitchen with full renovation" }
    },
    bathroom_renovation: {
        basic: { min: 40000, max: 80000, description: "Basic bathroom refresh" },
        moderate: { min: 80000, max: 160000, description: "Full bathroom renovation" },
        premium: { min: 160000, max: 300000, description: "Luxury bathroom renovation" }
    },
    electrical_work: {
        minor: { min: 5000, max: 15000, description: "Minor electrical repairs and updates" },
        moderate: { min: 15000, max: 50000, description: "Partial electrical system upgrade" },
        major: { min: 50000, max: 150000, description: "Complete electrical system overhaul" }
    },
    plumbing_work: {
        minor: { min: 3000, max: 10000, description: "Minor plumbing repairs" },
        moderate: { min: 10000, max: 35000, description: "Significant plumbing repairs" },
        major: { min: 35000, max: 100000, description: "Major plumbing system replacement" }
    },
    roof_work: {
        repair: { min: 20000, max: 80000, description: "Roof repairs and maintenance" },
        partial: { min: 80000, max: 200000, description: "Partial roof replacement" },
        complete: { min: 200000, max: 500000, description: "Complete roof replacement" }
    }
};

// Single function definition (remove all duplicates)
function getItemGuidanceWithRating(itemText, rating) {
    console.log('=== GUIDANCE DEBUG ===');
    console.log('Getting guidance for item:', itemText);
    console.log('Rating requested:', rating);
    
    const guidance = itemGuidance[itemText];
    console.log('Guidance object found:', !!guidance);
    
    if (!guidance) {
        console.warn('NO GUIDANCE FOUND for item:', itemText);
        console.log('Available items:', Object.keys(itemGuidance).slice(0, 10));
        return {
            description: `Item rated as ${rating}`,
            issuesRequiringAttention: null
        };
    }
    
    console.log('Available ratings for this item:', Object.keys(guidance));
    const description = guidance[rating];
    console.log('Description found for rating:', !!description);
    
    const result = {
        description: description || `No specific guidance for ${rating} rating`,
        issuesRequiringAttention: guidance.issuesRequiringAttention?.[rating] || null
    };
    
    console.log('Final result:', result);
    console.log('=== END GUIDANCE DEBUG ===');
    
    return result;
}

// Export guidance data (clean single export)
window.assessmentGuidance = {
    scoreGuidance,
    itemGuidance,
    recommendationTemplates,
    costGuidelines,
    getItemGuidanceWithRating
};

console.log('📋 Enhanced Assessment Guidance System loaded successfully');