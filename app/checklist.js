/**
 * Home Buyers Guide SA - Single Assessment System
 * Updated for South African Property Buyers
 */

console.log('=== HOME BUYERS GUIDE SA ASSESSMENT SYSTEM LOADING ===');

// CRITICAL: Assessment state must be declared first
const assessmentState = {
    currentCategory: 0,
    currentRoom: 0,
    currentInstance: 0,
    scores: {},
    notes: {},
    itemNotes: {},
    searchFilter: '',
    propertyId: null,
    questionResponses: {},
    roomInstances: {},
    categoryExpanded: { exterior: false, interior: false, other: false },
    roomExpanded: {},
    questionsExpanded: false,
    isEditMode: false,
    originalData: null
};

// COMPLETE assessment structure with improved South African context
const assessmentCategories = [
    {
        id: 'location',
        name: 'Location & Neighbourhood',
        icon: 'fa-map-marker-alt',
        color: '#667eea',
        rooms: [
            {
                id: 'area-surroundings',
                name: 'Area & Surroundings',
                allowMultiple: false,
                conditional: false,
                items: [
                    { text: 'Area safety and security feel', info: 'Visit at different times — morning, evening, and weekend. Ask neighbours about crime in the area and check local neighbourhood watch groups. Safe areas hold property value better and affect your daily comfort.' },
                    { text: 'Proximity to amenities', info: 'Check distance to supermarkets, hospitals, clinics, pharmacies, and fuel stations. Convenient access to services affects daily quality of life and resale value.' },
                    { text: 'Roads and infrastructure condition', info: 'Well-maintained roads indicate good municipal investment in the area. Poor infrastructure can signal a declining area and affect your daily commute and vehicle maintenance costs.' },
                    { text: 'Access and commute', info: 'Use Google Maps to check commute times to work during peak hours. Factor in fuel, toll costs, and travel time into your overall monthly budget.' }
                ]
            }
        ]
    },
    {
        id: 'exterior',
        name: 'Exterior Assessment',
        icon: 'fa-home',
        color: '#28A745',
        rooms: [
            {
                id: 'boundary-wall',
                name: 'Boundary Fence/Wall',
                icon: 'fa-border-all',
                allowMultiple: false,
                conditional: false,
                items: [
                    { text: 'Wall/fence structural condition', info: 'Check for cracks, loose bricks, unstable sections, or leaning areas. Poor construction or structural damage is expensive to repair. Insurance typically excludes gradual deterioration - only covers sudden accidents.' },
                    { text: 'Height and security adequacy', info: 'Verify wall/fence height meets security needs (minimum 2.1m recommended in SA). Check compliance with neighbor agreements and municipal bylaws. Upgrading boundary walls later can be costly.' },
                    { text: 'Maintenance and repair needs', info: 'Look for crumbling cement between bricks, gaps in mortar joints, or areas needing re-cementing. Check for peeling paint, rust stains, or faded areas requiring repainting. Assess water damage and drainage issues affecting the wall base. Regular maintenance prevents costly structural problems.' }
                ]
            },
            {
                id: 'gate-entrance',
                name: 'Gate/Entrance',
                icon: 'fa-door-open',
                allowMultiple: false,
                conditional: true,
                items: [
                    { text: 'Gate operation and mechanics', info: 'Test if gate opens and closes smoothly. Listen for grinding noises or struggling motors indicating wear. Check gate alignment and stability. Note any visible damage to tracks or hinges. Automated gate repairs can be costly.' },
					{ text: 'Access control systems', info: 'Test available remotes and keypad if present. Ask how many remotes are included with property. Check intercom functionality. Note which access systems are installed and working.' },
					{ text: 'Safety and security features', info: 'Test obstruction sensors by placing object in gate path. Check if gate stops and reverses safely. Ask about child safety features. Note any missing or damaged safety equipment.' },
					{ text: 'Power and backup systems', info: 'Ask if gate operates during load shedding. Check for battery backup or solar panels. Test manual override if power fails. Note backup systems present - important for daily access reliability.' }
                ]
            },
            {
                id: 'security-safety',
                name: 'Security/Safety',
                icon: 'fa-shield-alt',
                allowMultiple: false,
                conditional: false,
                items: [
                    { text: 'Security system functionality', info: 'Check alarm systems, cameras, beams, and electric fencing present. Test what you can access safely. Ask about monitoring contracts - do they transfer with property? Note which security features are active and working.' },
					{ text: 'Perimeter security', info: 'Assess electric fencing condition, camera placement, and boundary protection. Look for damaged or non-functioning elements. Check if security covers all vulnerable access points. Good security may reduce insurance premiums.' },
					{ text: 'Lighting and visibility', info: 'Check security lighting coverage and motion sensor functionality. Test lights if possible. Assess night-time visibility and dark spots. Good lighting deters crime and improves safety for residents.' },
					{ text: 'Emergency systems', info: 'Ask about panic buttons, armed response, and emergency procedures. Test accessible panic points if safe to do so. Inquire about response times and contract transferability. Important for family safety planning.' }
                ]
            },
            {
                id: 'parking-spaces',
                name: 'Parking',
                icon: 'fa-car',
                allowMultiple: false,
                conditional: false,
                items: [
                    { text: 'Parking surface condition', info: 'Check for cracks, potholes, oil stains, and surface quality. Poor surfaces deteriorate quickly in SA weather. Resurfacing can be costly depending on material used.' },
                    { text: 'Access and maneuvering space', info: 'Evaluate ease of vehicle access, turning radius, and parking convenience. Consider space for larger vehicles (bakkies, SUVs). Inadequate parking reduces property value significantly.' }
                ]
            },
            {
                id: 'garages',
                name: 'Garages',
                icon: 'fa-warehouse',
                allowMultiple: true,
                conditional: true,
                items: [
                    { text: 'Garage door functionality', info: 'Test automatic and manual operation, remote controls, and safety features. Check door age and motor condition. Garage door replacement can be costly. Motors typically last 8-12 years.' },
                    { text: 'Structural condition', info: 'Check garage floor for cracks, oil stains, level surfaces, and proper drainage. Look for roof leaks and wall cracks. Major structural repairs can be costly.' },
                    { text: 'Electrical and storage', info: 'Test power outlets, lighting adequacy, and assess storage solutions. Check for proper electrical installation and compliance certificates. Electrical upgrades can be costly.' }
                ]
            },
            {
                id: 'carports',
                name: 'Carport',
                icon: 'fa-car-side',
                allowMultiple: false,
                conditional: true,
                items: [
                    { text: 'Carport structure and stability', info: 'Check support posts are firmly anchored with no rust, rot, or leaning. Push gently against posts to test stability. Look for cracked welds on steel structures or rot in timber posts. Unstable carports are dangerous in high winds and costly to rebuild.' },
                    { text: 'Carport roof covering condition', info: 'Inspect the roof sheeting or shade netting for rust, holes, sagging, or loose panels. Check for water pooling marks. Damaged carport roofing offers poor protection and replacement sheeting can be costly depending on size and material.' },
                    { text: 'Carport surface and drainage', info: 'Check the parking surface under the carport for cracks, potholes, or poor drainage causing water pooling. Water pooling damages vehicles and surfaces over time. Assess whether rainwater runs off away from the vehicle area and house.' }
                ]
            },
            {
                id: 'exterior-walls',
                name: 'Building Exterior Walls',
                icon: 'fa-building',
                allowMultiple: false,
                conditional: false,
                items: [
                    { text: 'Wall structural integrity', info: 'Check for cracks, paint quality, brick condition, and missing tiles. Minor cracks may indicate settling, but large cracks signal serious structural problems. Major structural repairs can be costly.' },
                    { text: 'Paint and surface condition', info: 'Assess paint condition, weathering, staining, and presentation. Note areas needing maintenance. Exterior painting can be costly. Quality paint lasts 8-12 years in SA climate.' },
                    { text: 'Moisture and water damage', info: 'Look for water stains, dampness, discolouration, and water penetration signs. Damp problems cause health issues and structural damage. Damp proofing can be costly and is not covered by insurance.' },
                    { text: 'Foundation visibility', info: 'Check foundation exposure, cracks, settlement, and structural integrity at ground level. Foundation problems are extremely expensive to fix and may make property uninsurable.' }
                ]
            },
            {
                id: 'gutters',
                name: 'Gutters',
                icon: 'fa-tint',
                allowMultiple: false,
                conditional: true,
                items: [
                    { text: 'Gutter condition and attachment', info: 'Look for loose, sagging, or damaged gutters. Check downpipes are securely attached and not pulling away from walls. Look for rust, holes, or water stains on walls below gutters indicating leaks. Poor gutters cause expensive wall and foundation damage.' },
					{ text: 'Drainage effectiveness', info: 'Check downpipes direct water away from foundations, not toward them. Look for water stains or erosion patterns showing where gutters overflow. Check ground near downpipes for pooling areas or very green grass indicating constant water.' },
					{ text: 'Maintenance and cleaning needs', info: 'Look for visible leaves, debris, or plants growing in gutters. Check if gutters are easily accessible for cleaning or if special equipment needed. Clogged gutters overflow causing wall dampness and foundation problems.' }
                ]
            },
            {
                id: 'roof',
                name: 'Roof',
                icon: 'fa-home',
                allowMultiple: false,
                conditional: false,
                items: [
                    { text: 'Roof surface condition', info: 'Look for missing, cracked, or broken tiles from ground level. Check for moss or algae growth indicating moisture problems. Note any obviously worn or curled tile edges. Ask seller about roof age, recent repairs, and leak history.' },
					{ text: 'Structural integrity', info: 'Look along roof line to check it appears straight with no sagging areas. Ask about any previous leaks, repairs, or structural work. Check gutters for signs of roof problems like granules or tile pieces.' },
					{ text: 'Insulation and energy efficiency', info: 'Ask seller about ceiling insulation — most SA homes use fibreglass batts or rigid foam boards above the ceiling boards. Good insulation keeps rooms cooler in summer and warmer in winter, cutting electricity bills noticeably. Ask for recent electricity bills to gauge usage. No insulation or thin insulation is relatively affordable to add later (R5,000-R15,000 for a typical house).' }
                ]
            },
            {
                id: 'site-drainage',
                name: 'Site Drainage',
                icon: 'fa-water',
                allowMultiple: false,
                conditional: true,
                items: [
                    { text: 'Drainage system effectiveness', info: 'Look for water stains on exterior walls, soft/muddy ground near foundations, moss growth on walls, and check that ground slopes away from buildings. Ask seller about flooding history. Poor drainage damages foundations and costs tens of thousands to fix.' },
					{ text: 'Water flow and runoff patterns', info: 'Check ground slopes away from house, look for erosion channels in garden, and identify low spots where water would collect. Ask about flooding during heavy rains. Flood damage often excluded from insurance and affects property value.' },
					{ text: 'Drain accessibility and maintenance', info: 'Check drains are visible, accessible, and not blocked by plants or debris. Test downpipes direct water away from foundations. Blocked drains cause water backup and flooding - municipal responsibility but can take months to fix.' },
					{ text: 'Foundation protection', info: 'Look for water stains, white mineral deposits, or cracks on foundation walls. Check no standing water areas near foundations. Water damage to foundations extremely expensive and often not covered by insurance.' }
                ]
            },
            {
                id: 'garden-areas',
                name: 'Garden',
                icon: 'fa-seedling',
                allowMultiple: false,
                conditional: true,
                items: [
                    { text: 'Garden size and condition adequate', info: 'Check garden size, maintenance level, and overall condition for your needs. Large gardens need significant ongoing maintenance.' },
                    { text: 'Irrigation system present if needed', info: 'Check for sprinkler system, taps, water access for garden maintenance. Installing irrigation can be costly.' },
                    { text: 'Garden aspect and sunlight good', info: 'South-facing gets most sun in SA. Consider sunlight for plant growth and enjoyment. Aspect affects gardening costs and success.' },
                    { text: 'Maintenance requirements reasonable', info: 'Assess ongoing garden maintenance needs and costs for your budget. Factor in water restrictions and seasonal maintenance requirements.' }
                ]
            },
            {
                id: 'swimming-pool',
                name: 'Pool',
                icon: 'fa-swimming-pool',
                allowMultiple: false,
                conditional: true,
                items: [
                    { text: 'Pool structure and surface condition', info: 'Look for visible cracks in pool walls or floor, missing or loose tiles, staining, or rough surfaces. Check pool edges for damage. Ask seller about recent repairs, leak history, and whether it uses salt or chlorine system.' },
					{ text: 'Pool equipment and filtration', info: 'Ask to see pool pump and filter system running. Check equipment age and condition. Ask when major equipment was last replaced and about electricity costs. Note any rust, leaks, or unusual noises from equipment.' },
					{ text: 'Safety features', info: 'Check pool fence height (minimum 1.2m), self-closing gates that latch properly, and non-slip surfaces around pool. Look for safety equipment like pool covers, rescue hooks, or emergency equipment. Essential if you have children.' },
					{ text: 'Maintenance costs and requirements', info: 'Ask seller about monthly chemical costs, cleaning service costs, and electricity bills. Find out maintenance routine and time commitment. Pool maintenance can be costly monthly - factor this into your budget.' }
                ]
            },
            {
                id: 'water-features',
                name: 'Water Features',
                icon: 'fa-fountain',
                allowMultiple: false,
                conditional: true,
                items: [
                    { text: 'Water circulation and pump systems', info: 'Ask to see pump and filtration system running. Listen for unusual noises, check for leaks around equipment, and ask about electricity costs. Note pump age and condition - ask when last serviced or replaced.' },
					{ text: 'Structural condition', info: 'Look for visible cracks in feature walls or base, check for leaks or water stains around feature. Note any loose stones, damaged tiles, or structural settling. Ask about repair history and winter maintenance.' },
					{ text: 'Maintenance requirements', info: 'Ask seller about cleaning frequency, chemical costs, and maintenance routine. Check current water quality and algae levels. Note accessibility for cleaning and equipment maintenance. Water features require regular upkeep.' },
					{ text: 'Safety and integration', info: 'Check safety features around water feature, especially if you have children or pets. Assess how well integrated with landscaping and garden design. Note lighting for evening safety and feature visibility.' }
                ]
            }
        ]
    },
    {
        id: 'interior',
        name: 'Interior Assessment',
        icon: 'fa-door-open',
        color: '#2E86AB',
        rooms: [
            {
				id: 'bedrooms',
				name: 'Bedrooms',
				icon: 'fa-bed',
				allowMultiple: true,
				conditional: false,
				items: [
					{ text: 'Built-in wardrobes and storage', info: 'Test wardrobe doors, shelving, hanging rails, and interior lighting. Check all mechanisms work smoothly. Built-in wardrobe replacement can be costly.' },
					{ text: 'Windows and natural lighting', info: 'Test window operation, seals, security locks, and natural light quality. Check for proper ventilation and energy efficiency. Window replacement can be costly.' },
					{ text: 'Electrical outlets and lighting', info: 'Test all power outlets, light switches, ceiling fans, and electrical adequacy. Modern bedrooms need multiple outlets. Electrical additions require certified work (can be costly).' },
					{ text: 'Walls and floors - check for cracks, damp, or mould', info: 'Inspect walls and floors for cracks, water stains, damp patches, mould growth, or structural damage. Look for bubbling paint, discolouration, or musty odours which indicate moisture problems. Damp and mould are health hazards and expensive to remediate properly.' }
				]
			},
            {
                id: 'bathrooms',
				name: 'Bathrooms',
				icon: 'fa-bath',
				allowMultiple: true,
				conditional: false,
				items: [
					{ text: 'Plumbing fixtures functionality', info: 'Test toilet flushing - should be strong and consistent. Check if toilet is stable (loose mounting indicates problems). Test shower and tap water pressure. Ensure taps shut off properly without dripping. Poor plumbing affects daily use and repair can be costly.' },
					{ text: 'Drainage - bath, shower, and basin drain quickly', info: 'Run water to test drainage speed - basins should drain in 10-15 seconds, baths in 30 seconds. Listen for gurgling sounds indicating blockages. Slow drainage gets worse over time and can cause flooding. Professional drain clearing can be costly.' },
					{ text: 'Tiling and waterproofing', info: 'Check tiles for cracks or loose sections — water gets behind walls and causes expensive damage. Press the grout (the filler between tiles) gently with your finger — if it crumbles, waterproofing has likely failed and needs re-doing. Look for water stains, discolouration, or tiles that sound hollow when tapped. Failed waterproofing causes structural damage and mould that is expensive to remediate.' },
					{ text: 'Ventilation and moisture control', info: 'Check if the bathroom has a window that opens or a working extractor fan — both remove steam and moisture after showers. Look for mould (black or green spots) in corners, behind the toilet, or on ceiling edges. Musty smells are a warning sign even if mould is not visible. Test the extractor fan — it should start immediately and have decent airflow. Poor ventilation causes mould, peeling paint, and health problems over time.' },
					{ text: 'Electrical safety and lighting', info: 'Test lighting adequacy for daily use and safety. Check all switches work properly. Look for any scorch marks or loose fittings. Bathroom electrical work requires certified electricians and compliance certificates for property transfers.' }
				]
			},
            {
				id: 'kitchen',
				name: 'Kitchen',
				icon: 'fa-utensils',
				allowMultiple: false,
				conditional: false,
				items: [
					{ text: 'Cabinetry and storage', info: 'Test all cabinet doors, drawers, handles, hinges, and organization systems. Check for damage or wear. Kitchen renovations are expensive so functioning cabinets save money.' },
					{ text: 'Countertops and work surfaces', info: 'Check for chips, stains, burns, scratches, and surface integrity. Assess quality and durability. Countertop replacement can be costly depending on material.' },
					{ text: 'Sink and taps functionality', info: 'Test sink taps, check drainage speed, assess water pressure and hot water supply. Check for leaks.' },
					{ text: 'Appliances and electrical', info: 'Turn on the oven and all hob plates (gas or electric) and check every burner heats up properly. Run the dishwasher on a short cycle if possible. Check that extractor fan above the hob works and vents to outside (not just recirculates). Test electrical outlets and under-cabinet lighting. Replacing built-in appliances is costly — if they are faulty, factor the replacement cost into your offer.' },
					{ text: 'Plumbing, drainage, and ventilation', info: 'Check for leaks under sink and around connections - water damage to cabinets can be costly to repair. Test sink drainage speed and kitchen ventilation. Look for water stains indicating hidden leaks. Kitchen plumbing repairs can be costly.' }
				]
			},
            {
				id: 'lounge',
				name: 'Lounge',
				icon: 'fa-couch',
				allowMultiple: false,
				conditional: true,
				items: [
					{ text: 'Room size and layout', info: 'Assess space adequacy, traffic flow, furniture arrangement potential, and overall proportions. Consider if space meets your needs and lifestyle requirements.' },
					{ text: 'Natural lighting and windows', info: 'Check window placement, natural light quality, views, and window operation and security. Good natural light reduces electricity costs and improves quality of life.' },
					{ text: 'Electrical and entertainment setup', info: 'Test outlets for entertainment systems, lighting controls, and electrical adequacy for modern living. Adding electrical outlets can be costly.' },
					{ text: 'Walls and floors - check for cracks, damp, or structural issues', info: 'Inspect walls and floors for cracks, damp patches, mould, or structural damage. Look for water stains, bubbling paint, or uneven floors which indicate serious problems requiring expensive repairs.' }
				]
			},
            {
                id: 'family-tv-rooms',
                name: 'Family/TV Rooms',
                icon: 'fa-tv',
                allowMultiple: true,
                conditional: true,
                items: [
                    { text: 'Entertainment setup capability', info: 'Check room configuration for TV mounting, cable management, and entertainment center adequacy. Consider viewing angles and seating arrangements for family use.' },
                    { text: 'Electrical and connectivity', info: 'Test outlet placement, power adequacy for electronics, WiFi signal strength, and cable connections. Modern entertainment systems need multiple dedicated circuits.' },
                    { text: 'Lighting and acoustics', info: 'Test ambient lighting, dimming controls, room acoustics, and sound insulation from other areas. Good acoustics enhance entertainment experience.' },
                    { text: 'Seating and comfort arrangement', info: 'Assess room layout for comfortable seating, viewing angles, and family gathering space. Consider traffic flow and door placement.' }
                ]
            },
            {
                id: 'dining-room',
                name: 'Dining Room',
                icon: 'fa-chair',
                allowMultiple: true,
                conditional: true,
                items: [
                    { text: 'Room size and dining capacity', info: 'Assess space for dining table, chairs, and comfortable movement. Consider if size accommodates your typical dining needs and entertaining requirements.' },
                    { text: 'Lighting and ambiance', info: 'Check chandelier/pendant lights, dimming controls, natural light, and overall dining atmosphere. Good lighting enhances dining experience and property value.' },
                    { text: 'Connection to kitchen', info: 'Assess convenience of connection to kitchen and service areas for dining functionality. Easy access from kitchen is important for daily use and entertaining.' },
                    { text: 'Built-in features and storage', info: 'Check built-in cabinets, serving hatches, display areas, and dining-specific storage solutions. Built-in features add value and functionality.' }
                ]
            },
			{
				id: 'reception',
				name: 'Reception',
				icon: 'fa-door-open',
				allowMultiple: false,
				conditional: true,
				items: [
					{ text: 'Room size and layout for reception use', info: 'Assess space adequacy for greeting guests, furniture arrangement potential, and suitability for formal entertaining needs.' },
					{ text: 'Natural lighting and ambiance', info: 'Check window placement, natural light quality, and overall atmosphere for creating welcoming first impressions.' },
					{ text: 'Electrical and lighting adequacy', info: 'Test lighting fixtures, dimming controls, and electrical outlets for ambiance control and formal entertaining needs.' },
					{ text: 'Overall condition and presentation', info: 'Assess walls, floors, finishes, and overall presentation quality suitable for impressive guest reception.' }
				]
			},
			{
				id: 'study-office',
				name: 'Study/Office',
				icon: 'fa-laptop',
				allowMultiple: false,
				conditional: true,
				items: [
					{ text: 'Room size and layout for office use', info: 'Check if the room fits a desk and chair comfortably with space to move around. Consider whether the door placement and window position would suit a work-from-home setup. Note if the room is close to high-traffic or noisy areas of the house — this matters for video calls and concentration.' },
					{ text: 'Natural lighting and windows', info: 'Good natural light reduces eye strain during work. Check which direction the window faces — north-facing rooms get consistent light throughout the day in SA. Check if the window creates glare on a screen positioned at the desk. Test the window opens for ventilation.' },
					{ text: 'Electrical outlets and technology', info: 'Count the power outlets — a home office needs at least 4 dedicated outlets for computer, monitor, lamp, phone charger and UPS (backup power device). Check for a fibre or ethernet connection point in the room. Test WiFi signal strength — a study with weak WiFi in a work-from-home setup is a real problem. Ask if fibre has been installed in the street.' },
					{ text: 'Storage and organization', info: 'Check for built-in shelves, cupboards, or desk space. Consider whether the room has enough wall space to add shelving later if needed. A study with no storage often requires costly built-ins to be functional.' }
				]
			},
			{
				id: 'laundry-room',
				name: 'Laundry Room',
				icon: 'fa-tshirt',
				allowMultiple: false,
				conditional: true,
				items: [
					{ text: 'Plumbing connections present', info: 'Check for a cold water inlet tap and a drain point for the washing machine — both should be accessible and not hidden behind fixed cabinetry. Ask if a hot water connection is present (some washing machines need it). Run the taps to check water pressure. Look under the connections for signs of past leaks or water staining on the floor.' },
					{ text: 'Electrical supply adequate', info: 'Check for a dedicated power outlet for the washing machine and, if present, a separate one for the tumble dryer — these should be on their own circuits to prevent tripping the DB board (main electrical box) when running simultaneously. Confirm the room has enough outlets for an iron, dryer, and other appliances without using extension cords.' },
					{ text: 'Space and ventilation adequate', info: 'Check there is enough space to open the washing machine or dryer door fully and move around comfortably. A window or extractor fan is important — dryers generate a lot of moisture and heat. Without ventilation, mould builds up quickly. Check the floor is level and stable for appliances.' },
					{ text: 'Storage and organization', info: 'Check for shelving or cupboard space for laundry detergents, ironing supplies, and linen. A laundry without storage becomes cluttered quickly. Assess whether there is space for a laundry basket and ironing board without blocking access to appliances.' }
				]
			},
			{
				id: 'home-theater',
				name: 'Home Theater',
				icon: 'fa-tv',
				allowMultiple: false,
				conditional: true,
				items: [
					{ text: 'Room acoustics and lighting control', info: 'Clap your hands and listen for echo — a bare room with hard surfaces will echo badly and need acoustic treatment (wall panels or heavy curtains). Check for dimmer switches or separate lighting zones so brightness can be controlled during viewing. A room with no dimming or echo issues is much more functional as a home theater.' },
					{ text: 'Electrical and technology infrastructure', info: 'Check for multiple dedicated power outlets spread around the room — a proper setup needs outlets for TV/projector, sound system, streaming device, and gaming console without daisy-chaining extension cords. Look for HDMI or coax cable conduits, ethernet points, or if cables have been routed through walls. Adding proper cabling after the fact requires opening walls — factor this in if you plan a real setup.' },
					{ text: 'Seating and viewing arrangement', info: 'Check the room dimensions against standard viewing distances — for a 65-inch TV you need at least 2.5m of seating distance. Check where the room\'s focal point (wall or alcove for screen) naturally sits and whether windows on that wall would cause glare. Tiered seating requires raised flooring — check if there is enough ceiling height for this.' },
					{ text: 'Sound insulation and room design', info: 'Ask which rooms are adjacent, above, and below — a home theater next to bedrooms will disturb sleepers. Check the walls and ceiling for any sound insulation already in place. Carpet, heavy curtains, and upholstered seating all help with acoustics. Adding proper sound insulation after the fact requires wall and ceiling work — it is expensive and disruptive.' }
				]
			}
        ]
    },
    {
        id: 'other',
        name: 'Other Features Assessment',
        icon: 'fa-star',
        color: '#6F42C1',
        rooms: [
            {
                id: 'electrical-safety',
                name: 'Electrical Safety',
                icon: 'fa-bolt',
                allowMultiple: false,
                conditional: false,
                items: [
                    { text: 'No electrical hazards or exposed wiring', info: 'Look for exposed wires, burnt or blackened outlets, scorch marks around switches, or smell of burning. Check no wires hanging loose or connections visible. Any electrical hazards are dangerous and expensive to fix safely.' },
					{ text: 'DB board appears neat and properly labeled', info: 'The DB board (Distribution Board) is the main electrical box — usually a grey metal box on a wall — that controls all the electrical circuits in the house. Check it looks professionally installed, has clear labels on each switch (circuit breaker), and shows no signs of rust, scorch marks, or messy wiring. Unlabelled switches or visible burn marks are red flags. Ask the seller to show you the Electrical Certificate of Compliance (CoC) — a legal document required for property transfer proving the electrical installation meets safety standards.' },
					{ text: 'Main electrical outlets working throughout property', info: 'Test several outlets in each room by plugging in phone charger or lamp. Check light switches work properly. Note any dead outlets or flickering lights indicating electrical problems.' },
					{ text: 'Electrical certificate of compliance available', info: 'An Electrical Certificate of Compliance (CoC) is a legal document issued by a certified electrician confirming the property\'s electrical installation is safe and up to standard. It is required by law before a property can be transferred — without it, the transfer cannot proceed. If the seller does not have one, they must obtain it before transfer, which typically costs R2,000-R8,000 depending on what repairs are needed. Ask to see the original certificate and check it is not older than 2 years.' }
                ]
            },
            {
                id: 'solar-power',
                name: 'Solar Power',
                icon: 'fa-sun',
                allowMultiple: false,
                conditional: true,
                items: [
                    { text: 'Solar panel condition and performance', info: 'Check panels for visible cracks, heavy dirt buildup, or shading from trees/buildings. Ask seller about monthly electricity bills with solar and system performance history. Note panel age and any obvious damage.' },
					{ text: 'Inverter and system monitoring', info: 'The inverter is a box (usually wall-mounted near the DB board or in a garage) that converts the DC electricity produced by solar panels into AC electricity your home can use. Ask the seller to show it to you — it should have a display screen showing current power production with no red error lights. Ask about the inverter age and brand (quality brands last 10-15 years). Note whether the system has a monitoring app you can access to track daily solar production. Inverter replacement costs R15,000-R40,000 depending on capacity.' },
					{ text: 'Battery storage system', info: 'Ask how long the batteries keep essential appliances running during a power cut — a quality lithium battery system should handle 4-8 hours of typical household use. Ask if the battery system is owned outright or on a lease/rental agreement — leased systems do not automatically transfer with the property and the new owner must negotiate a new contract. Ask the battery age; lithium batteries typically last 8-12 years. Battery replacement costs R30,000-R80,000+ depending on capacity.' },
					{ text: 'Installation and maintenance', info: 'Ask if system is owned or leased (affects transfer). Check installation looks professional with proper mounting. Ask about warranty coverage, maintenance schedule, and who services the system.' }
                ]
            },
            {
                id: 'backup-power',
                name: 'Backup Power/UPS',
                icon: 'fa-battery-full',
                allowMultiple: false,
                conditional: true,
                items: [
                    { text: 'UPS system functionality', info: 'A UPS (Uninterruptible Power Supply) is a battery backup unit — typically a black or grey box connected between the wall socket and specific appliances — that keeps selected devices running for a short period when power goes out. It is usually sized for lights, WiFi, and a TV rather than the whole house (that would be a full inverter system). Ask what is connected to it and how long it lasts during a power cut. Ask when the internal battery was last replaced — UPS batteries typically need replacement every 3-5 years and cost R500-R2,500 depending on size.' },
					{ text: 'Load management and capacity', info: 'Ask which appliances/lights stay on during power cuts and for how long. Check if system handles your essential needs like lights, fridge, WiFi, security system during load shedding.' },
					{ text: 'Battery condition and maintenance', info: 'Ask about battery age, replacement history, and backup duration. Check for any visible battery swelling, leaks, or corrosion. Ask about maintenance schedule and costs.' },
					{ text: 'System monitoring and control', info: 'Ask to see system display showing battery status and power usage. Check if system has app monitoring or warning alerts. Ask about user manual and technical support.' }
                ]
            },
			{
				id: 'borehole',
				name: 'Borehole',
				icon: 'fa-tint',
				allowMultiple: false,
				conditional: true,
				items: [
					{ text: 'Borehole operational', info: 'Ask the seller to switch on the borehole pump and test water pressure at an outdoor tap or garden tap. Ask about water yield — a good residential borehole should produce at least 500-1,500 litres per hour consistently. Ask about pump age (pumps typically last 5-15 years), servicing history, and electricity costs to run the pump. Also ask if the borehole water has been tested — some boreholes produce water that needs treatment before it is safe to drink. Check if borehole is registered with the municipality as required.' },
					{ text: 'Water quality', info: 'Test water clarity, taste, and smell from borehole taps. Ask about water testing history and any treatment systems. Check if suitable for drinking or household use only.' },
					{ text: 'Equipment condition', info: 'Ask to see pump system and pressure tank. Check equipment age and maintenance history. Ask about electricity costs and pump reliability. Note any unusual noises or vibrations.' }
				]
			},
			{
				id: 'irrigation-systems',
				name: 'Irrigation Systems',
				icon: 'fa-shower',
				allowMultiple: false,
				conditional: true,
				items: [
					{ text: 'Irrigation system effectiveness', info: 'Look for sprinkler heads throughout garden areas and check for dry or over-watered spots indicating poor coverage. Ask seller to demonstrate system if possible and about water usage effectiveness.' },
					{ text: 'System control and automation', info: 'Ask to see irrigation timer and control box. Test if different zones can be activated manually. Ask about programming complexity and seasonal adjustment requirements.' },
					{ text: 'Maintenance and water efficiency', info: 'Ask about cleaning frequency, repair history, and seasonal maintenance needs. Check if sprinkler heads are accessible for cleaning. Ask about ongoing water costs and system reliability.' }
				]
			},
			{
				id: 'water-tank',
				name: 'Water Tank/Storage',
				icon: 'fa-archive',
				allowMultiple: false,
				conditional: true,
				items: [
					{ text: 'Water tank capacity and condition', info: 'Check tank size meets household needs and inspect for cracks, rust, or damage. Ask about tank age and cleaning history. Note tank material and installation quality.' },
					{ text: 'Installation and connections', info: 'Check tank is properly supported and plumbing connections appear professional. Ask about pump system and pressure. Note accessibility for maintenance and cleaning.' },
					{ text: 'Maintenance and cleaning', info: 'Ask when tank was last cleaned and inspected. Check water quality from tank supply. Ask about maintenance schedule and cleaning costs. Note any water discolouration or taste issues.' }
				]
			},
			{
				id: 'gas-installation',
				name: 'Gas Installation',
				icon: 'fa-fire',
				allowMultiple: false,
				conditional: true,
				items: [
					{ text: 'Gas installation safety and compliance', info: 'Check all gas connections look professional — copper or approved flexible pipe, no DIY joins or visible rust. Do a smell test near connections (rotten egg smell means a leak — do not use any switches or flames). Check for visible shut-off valves at each appliance and at the main supply. Gas can be either piped from a municipal supply or from LPG cylinders (large orange or white tanks, usually outside). All gas installations must be done by a certified gas technician. Ask the seller for the Gas Certificate of Compliance (Gas CoC) — required for property transfer if gas is installed. Missing certificate costs R500-R3,000 to obtain.' },
					{ text: 'Gas appliance connections', info: 'Check gas appliance operation and safety. Gas leaks or faulty installations are life-threatening.' },
					{ text: 'Gas meter and supply', info: 'Check gas meter condition, clear access for readings, and adequate supply pressure. Verify municipal gas connection or LPG tank setup is proper and accessible for maintenance.' },
					{ text: 'Gas certificate available', info: 'If the property has any gas installation — piped gas, LPG cylinders, gas hobs, gas water heaters, or gas fireplaces — a Gas Certificate of Compliance (Gas CoC) is required by law before the property can be transferred. It is issued by a certified LP Gas South Africa technician after they inspect and test the installation. Ask the seller for this document. If it is missing or expired, the seller must obtain it before transfer — typically costs R500-R3,000 for inspection and any minor repairs needed to pass.' }
				]
			},
			{
				id: 'outbuildings',
				name: 'Outbuildings',
				icon: 'fa-warehouse',
				allowMultiple: false,
				conditional: true,
				items: [
					{ text: 'Structure appears sound and secure', info: 'Check walls for cracks, bowing, or damp staining. Look at the roof from inside if accessible — check for light coming through (gaps in roof covering), sagging rafters, or water stains on the ceiling indicating leaks. Check the floor for cracks or uneven sections. Try all doors and windows — sticking or gaps indicate settlement or structural movement. Outbuilding structural repairs follow the same costs as a main house and can be substantial.' },
					{ text: 'Access and security adequate', info: 'Check doors, locks, and ease of access for intended use. Security is important for valuable tools and equipment storage.' },
					{ text: 'Size adequate for intended use', info: 'Assess if space meets your needs - storage, workshop, office, living quarters, or entertainment area. Consider ceiling height, room layout, and access for furniture/equipment. Expanding outbuildings requires municipal approval and can be costly.' },
					{ text: 'Electrical supply if needed', info: 'Check for adequate power outlets and lighting for intended use - workshop tools, living appliances, office equipment, or entertainment systems. Adding electrical supply requires certified electrician and municipal compliance certificates.' }
				]
			},
			{
				id: 'internet-fibre',
				name: 'Internet Access/Fibre',
				icon: 'fa-wifi',
				allowMultiple: false,
				conditional: true,
				items: [
				{ text: 'Internet connectivity available', info: 'Test internet speed and reliability. Fibre infrastructure may not be available requiring expensive installation.' },
                { text: 'Network coverage quality', info: 'Test WiFi coverage throughout property. Poor coverage affects modern living and work requirements.' }
				]
			},
			{
				id: 'sports-court',
				name: 'Sports Court',
				icon: 'fa-running',
				allowMultiple: false,
				conditional: true,
				items: [
					{ text: 'Court surface condition', info: 'Walk the entire surface and look for cracks, loose sections, algae growth, or areas that have sunk or lifted. A slippery or uneven surface is a safety hazard. Ask the seller about the surface type and age — hard courts (tarmac, concrete) last 15-25 years with proper care; artificial grass and synthetic surfaces need replacement every 8-12 years. Resurfacing a full tennis court typically costs R40,000-R120,000 depending on surface type.' },
					{ text: 'Equipment and accessories present', info: 'Check that all fixtures included in the sale are present and functional — net posts, nets, basketball hoops, or other sport-specific fittings. Test that posts are secure and not rusting at the base. Ask what is included in the sale versus what the seller is taking. Quality replacement equipment can be expensive and some sports fittings require professional installation.' },
					{ text: 'Court fencing and security', info: 'Walk the perimeter fencing and check for rust, holes, bent posts, or sagging sections. Court fencing takes heavy impact from balls and deteriorates faster than garden fencing. Check gate latches and hinges. Ball containment fencing that is missing sections or badly damaged makes the court unusable — factor replacement costs (R8,000-R30,000 for a full court perimeter) into your assessment.' },
					{ text: 'Access and lighting adequate', info: 'Check the path from the house to the court is safe and well-surfaced, especially if used at night. Test the court lights — they should provide even coverage across the full playing surface without dark spots. Ask about electricity costs for lighting sessions. Professional sports court lighting installation for a full court costs R25,000-R80,000, so check what is already in place works properly before assuming you can add it affordably later.' }
				]
			},
			{
				id: 'smart-home',
				name: 'Smart Home',
				icon: 'fa-home',
				allowMultiple: false,
				conditional: true,
				items: [
				{ text: 'Automation system functionality', info: 'Ask the seller to demonstrate the automation system — this might control lights, blinds, security, or climate from a central panel or phone app. Test a few functions yourself. Ask which app or platform it uses (Google Home, Apple HomeKit, a proprietary brand) and whether the account transfers with the property or needs to be reset. Find out which devices are included in the sale — smart bulbs, switches, and controllers can be expensive to replace if excluded.' },
                { text: 'Smart home integration', info: 'Check how many systems are integrated — lights, security cameras, gate, alarm, and HVAC (heating/cooling) working together from one app is significantly more convenient than separate systems. Ask if the system uses a local hub (works without internet) or is fully cloud-based (stops working if internet is down or provider shuts down service). Ask for all login credentials and manuals to be included in the handover — smart home systems are useless without access details.' }
				]
			},
			{
				id: 'air-conditioning',
				name: 'Air Conditioning',
				icon: 'fa-snowflake',
				allowMultiple: false,
				conditional: true,
				items: [
				{ text: 'AC systems functional', info: 'Switch on every air conditioning unit and let it run for at least 5 minutes. The unit should cool the room noticeably and not make grinding, rattling, or clicking noises. Check that the remote controls work and all settings respond. Note the brand and ask about the unit age — AC units typically last 10-15 years with good servicing. Ask when each unit was last serviced (ideally annually). Replacement of a split unit costs R8,000-R25,000 installed depending on capacity.' },
                { text: 'Temperature control effective', info: 'Set the thermostat to a specific temperature and check the unit maintains it without constantly cycling on and off. Stand in different parts of the room — you should feel consistent cooling or heating without hot or cold spots. Check the thermostat display shows the correct target temperature. Units that struggle to reach set temperature or run continuously are often low on refrigerant gas (a service call fixes this, typically R800-R1,500) or are undersized for the room.' },
                { text: 'Maintenance and age acceptable', info: 'Ask the seller how old each unit is and when it was last professionally serviced. A well-maintained AC unit is serviced annually — the service includes cleaning filters, checking refrigerant levels, and inspecting electrical connections. Ask to see any service records. Look at the indoor unit — the filter grille should be clean, not caked with dust. Dusty, unserviced units work harder, use more electricity, and fail sooner.' }
				]
			},
			{
				id: 'heating-systems',
				name: 'Heating Systems',
				icon: 'fa-thermometer-half',
				allowMultiple: false,
				conditional: true,
				items: [
				{ text: 'Heating system functional', info: 'Test every heater or heating source present — plug-in electric heaters, wall-mounted units, gas heaters, underfloor heating, or fireplace. For underfloor heating, turn it on and wait 10-15 minutes — the floor should feel warm to the touch. For gas heaters, check the flame ignites immediately and burns blue (yellow or orange flames can indicate a combustion problem). For fireplaces, check the flue draws properly by briefly holding a lit match near the opening — smoke should be pulled upward into the chimney.' },
                { text: 'Safety and ventilation good', info: 'Check all heating appliances for obvious safety concerns: no exposed or damaged cables on electric heaters, no smell of gas around gas heaters or fireplaces, no scorch marks on walls near heaters. Gas heaters in enclosed rooms without ventilation are a serious carbon monoxide risk — check for an openable window or vent. For fireplaces, look up the chimney with a torch — you should be able to see daylight, and there should be no significant soot blockage. A blocked chimney or flue is a fire and carbon monoxide hazard.' },
                { text: 'Energy efficiency acceptable', info: 'Ask the seller for recent electricity bills — high winter bills can indicate inefficient heating. Older bar heaters and fan heaters use much more electricity per hour than oil-filled radiators or heat pumps. If the property relies heavily on electric heating, calculate roughly what this adds to your monthly budget. Heat pumps are the most efficient option (3-4x more efficient than bar heaters) but cost R25,000-R60,000 to install. Ask if the property has any solar to offset heating electricity costs.' }
				]
			}
        ]
    }
];


// Enhanced property type specific questions with South African context
const importantQuestions = {
    house: [
        {
            id: 'sale-reason',
            question: 'Why is the seller selling the property?',
            info: 'This can reveal issues with the property, area, crime, or neighbors that might not be obvious during viewing.',
            required: true
        },
        {
            id: 'included-in-sale',
            question: 'What\'s included in the sale - exact list with values?',
            info: 'Clarify exactly what fixtures, fittings, appliances and items are included. This affects your offer price and prevents disputes at transfer. Get written confirmation of all included items and their estimated values.',
            required: true
        },
        {
            id: 'recent-repairs',
            question: 'Any major repairs or renovations in the last 3 years?',
            info: 'Recent work might indicate previous problems. Ask for warranties and approval certificates for all work done.',
            required: true
        },
        {
            id: 'utilities-issues',
            question: 'Any ongoing issues with water, electricity, or internet?',
            info: 'Municipal service problems can be expensive and time-consuming to resolve with long waiting times.',
            required: true
        },
        {
            id: 'security-incidents',
            question: 'Any security incidents in the area recently?',
            info: 'Crime levels affect insurance costs, property value, and your safety. Ask about local crime statistics.',
            required: true
        },
        {
            id: 'known-issues',
            question: 'Are there any issues, problems, or defects that I should be aware of?',
            info: 'Sellers are legally required to disclose known defects. This question helps identify potential problems and ensures transparency in the transaction.',
            required: true
        },
        {
            id: 'insect-problems',
            question: 'Any history of pest problems?',
            info: 'Ask about termites, ants, rodents, or other pest issues. Pest control is ongoing expense and some problems like termites cause expensive structural damage.',
            required: false
        },
        {
            id: 'fixtures-staying',
            question: 'What fixtures, fittings, and items are included?',
            info: 'Clarify what stays - air conditioners, light fittings, garden equipment, security equipment. Ask for all keys, remotes, and access codes.',
            required: true
        },
        {
            id: 'warranties-available',
            question: 'Are there any warranties or guarantees available?',
            info: 'Ask for warranties on recent work, appliances, solar panels, geysers. Check if solar panels are leased or owned - affects transfer costs.',
            required: true
        },
        {
            id: 'electrical-certificate',
            question: 'Is there a valid electrical certificate of compliance?',
            info: 'Required by law for property transfer. Without it, transfer can be delayed and you may pay can be costly to obtain one.',
            required: true
        },
        {
            id: 'building-plans',
            question: 'Are approved building plans available for all structures?',
            info: 'All structures must match approved plans. Unapproved alterations cause expensive legal problems and may need to be demolished.',
            required: true
        },
        {
            id: 'gas-certificate',
            question: 'Is there a gas certificate if applicable?',
            info: 'If property has gas installations, gas certificate is required for transfer similar to electrical certificate.',
            required: false
        }
    ],
    complex: [
        {
            id: 'sale-reason',
            question: 'Why is the seller selling the property?',
            info: 'Could reveal issues with the complex, management disputes, difficult neighbors, or ongoing special levies.',
            required: true
        },
        {
            id: 'included-in-sale',
            question: 'What\'s included in the sale - exact list with values?',
            info: 'Clarify exactly what fixtures, fittings, appliances and items are included. This affects your offer price and prevents disputes at transfer. Get written confirmation of all included items and their estimated values.',
            required: true
        },
        {
            id: 'levy-increases',
            question: 'Any recent or planned levy increases or special levies?',
            info: 'Unexpected levy increases can significantly impact affordability. Get last 2 years of levy statements and upcoming budget.',
            required: true
        },
        {
            id: 'body-corporate-issues',
            question: 'Any ongoing disputes or major repairs planned by body corporate?',
            info: 'Body corporate disputes and special levies can be costly and stressful. Check meeting minutes for ongoing issues.',
            required: true
        },
        {
            id: 'building-insurance',
            question: 'Is building insurance up to date and adequate?',
            info: 'Check coverage amounts and ensure body corporate maintains proper insurance. Inadequate insurance affects all owners.',
            required: true
        },
        {
            id: 'utilities-management',
            question: 'How are utilities managed and any ongoing issues?',
            info: 'Water, electricity, and refuse management problems are common in complexes and affect daily living quality.',
            required: true
        },
        {
            id: 'reserve-fund-balance',
            question: 'What\'s the reserve fund balance and is it adequate?',
            info: 'Reserve funds cover major building repairs and maintenance. Inadequate reserves mean future special levies for expensive repairs like roofs, lifts, and structural work. Ask for 10-year maintenance plan and current reserve fund statement.',
            required: true
        },
        {
            id: 'owners-levy-payments',
            question: 'Are all owners up to date with levy payments?',
            info: 'High levels of unpaid levies indicate financial problems in the complex. This leads to cash flow issues, deferred maintenance, and potential special levies. Body corporate can take legal action against defaulting owners, creating ongoing disputes.',
            required: true
        },
        {
            id: 'complex-rules-regulations',
            question: 'Can I view the Complex conduct rules?',
            info: 'Complex conduct rules govern daily living - pet policies, noise restrictions, rental permissions, parking rules, and alteration restrictions. These rules can significantly impact your lifestyle and property value. Some complexes prohibit rentals or have strict pet policies.',
            required: true
        },
        {
            id: 'agm-meetings',
            question: 'When was the last AGM meeting and how often does it happen?',
            info: 'Annual General Meetings are required by law for body corporates. Irregular or poorly attended meetings indicate management problems. AGM minutes reveal ongoing issues, financial decisions, and future plans that affect all owners.',
            required: true
        },
        {
            id: 'audited-financials',
            question: 'Can I see the latest audited financial statements?',
            info: 'Essential to check if body corporate is financially sound. Banks require these for bond approval. Poor finances mean higher levies ahead.',
            required: true
        },
        {
            id: 'levies-statement',
            question: 'Can I see recent levy statements and any special levy history?',
            info: 'Get recent levy certificate showing monthly charges. Very low levies often indicate under-payment and future special levies ahead.',
            required: true
        }
    ]
};


// Rest of the existing helper functions remain the same...
function hasFeature(property, featureId) {
    if (!property || !property.features) return false;
    
    for (const [category, features] of Object.entries(property.features)) {
        if (Array.isArray(features) && features.some(f => f.id === featureId)) {
            return true;
        }
    }
    return false;
}

function getRoomCount(property, roomId) {
    switch (roomId) {
        case 'bedrooms':
            return parseInt(property.bedrooms) || 1;
        case 'bathrooms':
            return Math.ceil(parseFloat(property.bathrooms)) || 1;
        case 'parking-spaces':
            return parseInt(property.parking) || 1;
        case 'garages':
            return parseInt(property.parking) || 1;
        default:
            return 1;
    }
}

function generateRoomName(baseName, index, total) {
    if (baseName === 'Bedrooms' && index === 0 && total > 1) {
        return 'Main Bedroom';
    } else if (baseName === 'Bedrooms') {
        return `Bedroom ${index + 1}`;
    } else if (baseName === 'Bathrooms' && index === 0) {
        return 'Main Bathroom';
    } else if (baseName === 'Bathrooms') {
        return `Bathroom ${index + 1}`;
    } else if (total > 1) {
        return `${baseName} ${index + 1}`;
    }
    return baseName;
}

function getRoomNameFromId(roomId) {
    const idToNameMap = {
        'bedrooms': 'Bedrooms',
        'bathrooms': 'Bathrooms',
        'kitchen': 'Kitchen',
        'lounge': 'Lounge',
        'family-tv-rooms': 'Family/TV Rooms',
        'dining-room': 'Dining Room',
        'reception': 'Reception',
        'study-office': 'Study/Office',
        'laundry-room': 'Laundry Room',
        'home-theater': 'Home Theater',
        'boundary-wall': 'Boundary Fence/Wall',
        'gate-entrance': 'Gate/Entrance',
        'security-safety': 'Security/Safety',
        'parking-spaces': 'Parking',
        'garages': 'Garages',
        'carports': 'Carport',
        'exterior-walls': 'Building Exterior Walls',
        'gutters': 'Gutters',
        'roof': 'Roof',
        'site-drainage': 'Site Drainage',
        'garden-areas': 'Garden',
        'swimming-pool': 'Pool',
        'water-features': 'Water Features',
        'solar-power': 'Solar Power',
        'backup-power': 'Backup Power/UPS',
        'borehole': 'Borehole',
        'irrigation-systems': 'Irrigation Systems',
        'water-tank': 'Water Tank/Storage',
        'gas-installation': 'Gas Installation',
        'outbuildings': 'Outbuildings',
        'internet-fibre': 'Internet Access/Fibre',
        'sports-court': 'Sports Court',
        'smart-home': 'Smart Home',
        'air-conditioning': 'Air Conditioning',
        'heating-systems': 'Heating Systems',
    };
    
    return idToNameMap[roomId] || roomId.charAt(0).toUpperCase() + roomId.slice(1).replace(/-/g, ' ');
}

function initializeCategorizedRoomInstances(property) {
    // NEVER clear existing instances - only add missing ones
    if (!assessmentState.roomInstances) {
        assessmentState.roomInstances = {};
    }
    
    // Load saved room instances first (PRESERVE all existing data)
    if (property.roomInstances) {
        console.log('🔄 Preserving saved room instances:', Object.keys(property.roomInstances));
        // Merge saved instances with current state (don't overwrite)
        Object.keys(property.roomInstances).forEach(roomId => {
            if (!assessmentState.roomInstances[roomId]) {
                assessmentState.roomInstances[roomId] = JSON.parse(JSON.stringify(property.roomInstances[roomId]));
            }
        });
    }
    
    assessmentCategories.forEach(category => {
        category.rooms.forEach(room => {
            // Only create instances for non-conditional rooms that don't exist
            if (!room.conditional && !assessmentState.roomInstances[room.id]) {
                if (room.allowMultiple) {
                    let count = getRoomCount(property, room.id);
                    assessmentState.roomInstances[room.id] = [];
                    
                    for (let i = 0; i < count; i++) {
                        assessmentState.roomInstances[room.id].push({
                            id: `${room.id}_${i}_${Date.now()}`, // UNIQUE IDs
                            name: generateRoomName(room.name, i, count),
                            customName: ''
                        });
                    }
                } else {
                    assessmentState.roomInstances[room.id] = [{
                        id: `${room.id}_${Date.now()}`, // UNIQUE ID
                        name: room.name,
                        customName: ''
                    }];
                }
            }
        });
    });
    
    console.log('✅ Detailed room instances preserved/initialized:', Object.keys(assessmentState.roomInstances));
}


function reconstructDetailedRoomInstancesFromData(assessmentData, property) {
    const reconstructedInstances = {};
    
    Object.keys(assessmentData).forEach(instanceId => {
        let baseRoomId = instanceId;
        
        // Handle different ID patterns for detailed assessment
        if (instanceId.includes('_')) {
            const parts = instanceId.split('_');
            baseRoomId = parts[0];
        }
        
        // Find the room definition
        const roomDef = assessmentCategories.flatMap(cat => cat.rooms).find(r => r.id === baseRoomId);
        
        if (roomDef) {
            if (!reconstructedInstances[baseRoomId]) {
                reconstructedInstances[baseRoomId] = [];
            }
            
            const instanceName = roomDef.allowMultiple ? 
                generateRoomName(roomDef.name, reconstructedInstances[baseRoomId].length, 1) : 
                roomDef.name;
            
            reconstructedInstances[baseRoomId].push({
                id: instanceId,
                name: instanceName,
                customName: ''
            });
            
            console.log(`🔧 Reconstructed detailed room instance: ${baseRoomId} -> ${instanceId}`);
        }
    });
    
    return reconstructedInstances;
}

function updateAssessmentHeader() {
    const property = appState.currentProperty;
    if (!property) return;
    document.getElementById('assessmentPropertyAddress').textContent = property.address || 'Property Assessment';
    document.getElementById('assessmentPropertyType').textContent =
        `${property.type} • ${property.bedrooms || 'N/A'} bed • ${property.bathrooms || 'N/A'} bath`;
    updateResultsButton();
}


function updateProgressBar() {
    const property = appState.currentProperty;
    if (!property) return;
    const overallProgress = calculateAccurateProgress();
    const progressFill = document.getElementById('assessmentProgress');
    const progressText = document.getElementById('progressText');
    if (progressFill) progressFill.style.width = overallProgress + '%';
    if (progressText) progressText.textContent = `${overallProgress}% Complete`;
    property.progress = overallProgress;
    const idx = appState.properties.findIndex(p => p.id === property.id);
    if (idx !== -1) appState.properties[idx].progress = overallProgress;
    updateResultsButton();
}


// Helper function to get category progress as percentage
function getCategoryProgressPercent(category) {
    let totalItems = 0;
    let completedItems = 0;
    
    console.log(`=== CATEGORY PROGRESS: ${category.name} ===`);
    
    category.rooms.forEach(room => {
        const instances = assessmentState.roomInstances[room.id] || [];
        
        console.log(`Room: ${room.name}, Instances: ${instances.length}, Items per instance: ${room.items.length}`);
        
        if (instances.length > 0) {
            instances.forEach((instance, idx) => {
                const roomScores = assessmentState.scores[instance.id] || {};
                let instanceCompleted = 0;
                
                room.items.forEach(item => {
                    totalItems++;
                    if (roomScores[item.text] && 
                        roomScores[item.text].rating && 
                        roomScores[item.text].rating !== '' &&
                        roomScores[item.text].rating !== 'select') {
                        completedItems++;
                        instanceCompleted++;
                    }
                });
                
                console.log(`  Instance ${idx + 1} (${instance.name}): ${instanceCompleted}/${room.items.length} complete`);
            });
        }
    });
    
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    console.log(`CATEGORY TOTAL: ${completedItems}/${totalItems} = ${progress}%`);
    
    return progress;
}

// FIXED: Overall accurate progress calculation
function calculateAccurateProgress() {
    let totalPct = 0, count = 0;
    assessmentCategories.forEach(category => {
        const deg = getCategoryProgress(category);
        totalPct += Math.round(deg / 3.6);
        count++;
    });
    return count > 0 ? Math.round(totalPct / count) : 0;
}


// New function to handle UI updates with retry logic
function updateProgressBarUI(progressPercent) {
    // Try multiple times to ensure DOM elements are found and updated
    let attempts = 0;
    const maxAttempts = 3;
    
    function attemptUpdate() {
        attempts++;
        
        // Try multiple possible selectors for progress elements
        const progressSelectors = [
            '#assessmentProgress',
            '.assessment-progress-fill',
            '[class*="progress-fill"]',
            '[id*="progress"]'
        ];
        
        const textSelectors = [
            '#progressText',
            '.progress-text',
            '[class*="progress-text"]'
        ];
        
        let progressUpdated = false;
        let textUpdated = false;
        
        // Update progress bar fill
        for (const selector of progressSelectors) {
            const progressElement = document.querySelector(selector);
            if (progressElement) {
                progressElement.style.width = progressPercent + '%';
                progressUpdated = true;
                console.log(`✅ Progress bar updated via selector: ${selector}`);
                break;
            }
        }
        
        // Update progress text
        for (const selector of textSelectors) {
            const textElement = document.querySelector(selector);
            if (textElement) {
                textElement.textContent = `${progressPercent}% Complete`;
                textUpdated = true;
                console.log(`✅ Progress text updated via selector: ${selector}`);
                break;
            }
        }
        
        // If elements not found and we haven't exceeded max attempts, try again
        if ((!progressUpdated || !textUpdated) && attempts < maxAttempts) {
            console.log(`⚠️ Progress UI elements not found, retrying... (attempt ${attempts})`);
            setTimeout(attemptUpdate, 100);
            return;
        }
        
        if (!progressUpdated || !textUpdated) {
            console.warn('❌ Could not find progress UI elements after', attempts, 'attempts');
            console.log('Available elements with "progress" in ID or class:');
            document.querySelectorAll('[id*="progress"], [class*="progress"]').forEach(el => {
                console.log(' -', el.tagName, el.id, el.className);
            });
        }
    }
    
    attemptUpdate();
}

// Assessment control functions

// Clear the entire assessment for the current property (with confirmation)
function clearCurrentAssessment() {
    const property = appState.currentProperty;
    if (!property) {
        showModal('Error', 'No property found to clear.');
        return;
    }

    showModal('Clear Assessment?', `
        <div class="warning-modal-content">
            <div class="warning-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <p><strong>Clear this entire assessment?</strong></p>
            <p>All ratings, notes, photo links, question responses and the property score will be permanently removed. This cannot be undone.</p>
        </div>
    `, () => {
        // Reset in-memory assessment state
        assessmentState.scores = {};
        assessmentState.notes = {};
        assessmentState.itemNotes = {};
        assessmentState.questionResponses = {};
        assessmentState.roomInstances = {};
        assessmentState.categoryExpanded = { exterior: false, interior: false, other: false };
        assessmentState.roomExpanded = {};
        assessmentState.questionsExpanded = false;

        // Reset persisted property fields
        property.assessments = {};
        property.roomNotes = {};
        property.questionResponses = {};
        property.roomInstances = {};
        property.progress = 0;
        property.score = null;
        property.assessedAt = null;

        // Rebuild default room instances for this property type
        initializeCategorizedRoomInstances(property);

        // Persist the cleared state
        saveCurrentAssessmentProgress();

        // Refresh the UI
        try { updateProgressBar(); } catch (e) {}
        try { initializeCategorizedAssessmentUI(); } catch (e) {}
        const resultsBtnContainer = document.getElementById('assessmentResultsButtonContainer');
        if (resultsBtnContainer) resultsBtnContainer.style.display = 'none';

        showSuccess('Assessment cleared. You can start fresh.');
    }, 'Clear Assessment', null, 'Keep Assessment');
}
window.clearCurrentAssessment = clearCurrentAssessment;

function saveAssessmentChanges() {
    showModal('Save Changes?', `
        <div class="save-modal-content">
            <div class="save-icon"><i class="fas fa-save"></i></div>
            <p><strong>Save your assessment changes?</strong></p>
            <p>This will update your property assessment results and scores.</p>
        </div>
    `, () => {
        const property = appState.currentProperty;
        if (!property) { showModal('Error', 'No property found to save changes to.'); return; }
        saveCurrentAssessmentProgress();
        try {
            if (window.calculatePropertyScore) {
                const scoreData = window.calculatePropertyScore(property);
                if (scoreData && scoreData.overall) {
                    property.score = scoreData.overall;
                    property.assessedAt = new Date().toISOString();
                    const idx = appState.properties.findIndex(p => p.id === property.id);
                    if (idx !== -1) {
                        appState.properties[idx].score = scoreData.overall;
                        appState.properties[idx].assessedAt = property.assessedAt;
                    }
                }
            }
            if (window.saveAssessmentsToIndexedDB) window.saveAssessmentsToIndexedDB([property]);
            saveAppData();
            updatePropertyCount();
            showSuccess('Assessment changes saved successfully!');
            updateProgressBar();
            renderCategorizedNavigationWithQuestions();
        } catch (error) {
            console.error('Error saving assessment:', error);
            showModal('Error', 'Failed to save assessment changes. Please try again.');
        }
    }, 'Save Changes', null, 'Cancel');
}


function cancelAssessmentChanges() {
    showModal('Cancel Changes?', `
        <div class="cancel-modal-content">
            <div class="cancel-icon">
                <i class="fas fa-times-circle"></i>
            </div>
            <p><strong>Cancel your changes?</strong></p>
            <p>All unsaved changes will be lost and the assessment will return to its previous state.</p>
        </div>
    `, () => {
        // Reload the property data to reset changes
        const property = appState.currentProperty;
        if (property) {
            // Reset assessment state to saved values
            
                assessmentState.propertyId = property.id;
                assessmentState.scores = property.assessments || {};
                assessmentState.notes = property.roomNotes || {};
                assessmentState.itemNotes = property.itemNotes || {};
                assessmentState.questionResponses = property.questionResponses || {};
            
            
            // Refresh the display
            
                renderCategorizedNavigationWithQuestions();
            
            
            updateProgressBar();
            showSuccess('Changes cancelled - assessment restored');
        }
    }, 'Yes, Cancel Changes', null, 'Keep Editing');
}

function getTotalAssessmentItems() {
    let total = 0;
    Object.keys(assessmentState.roomInstances).forEach(roomId => {
        const room = assessmentCategories.flatMap(c => c.rooms).find(r => r.id === roomId);
        if (room) {
            assessmentState.roomInstances[roomId]
                .filter(inst => inst && inst.id)
                .forEach(() => { total += room.items.length; });
        }
    });
    return total;
}


function getCompletedAssessmentItems() {
    let completed = 0;
    
    // Use SAME logic as category progress - just count Object.keys length
    Object.keys(assessmentState.roomInstances).forEach(roomId => {
        const instances = assessmentState.roomInstances[roomId] || [];
        instances.forEach(instance => {
            if (instance && instance.id) {
                const roomScores = assessmentState.scores[instance.id];
                if (roomScores) {
                    // FIXED: Use same counting as category functions
                    completed += Object.keys(roomScores).length;
                }
            }
        });
    });
    
    console.log('Completed items calculated:', completed);
    return completed;
}

function startAssessment(propertyId) {
    console.log('=== START ASSESSMENT CALLED ===', propertyId);
    const property = getProperty(propertyId);
    if (!property) {
        console.error('Property not found for assessment:', propertyId);
        showModal('Error', 'Property not found');
        return;
    }
    window.pendingAssessmentProperty = propertyId;
    const hasSeenGuide = localStorage.getItem('hasSeenAssessmentGuide');
    if (!hasSeenGuide || hasSeenGuide !== 'true') {
        setTimeout(() => {
            if (window.showAssessmentGuide) {
                window.showAssessmentGuide();
            } else {
                initializeDetailedAssessment(property);
            }
        }, 100);
    } else {
        setTimeout(() => { initializeDetailedAssessment(property); }, 100);
    }
}





// Proceed to assessment after guide (or directly)


function initializeDetailedAssessment(property) {
    console.log('🔄 Initializing detailed assessment for:', property.id);
    
    // Don't clear existing state - preserve it
    const existingScores = JSON.parse(JSON.stringify(property.assessments || {}));
    const existingNotes = JSON.parse(JSON.stringify(property.roomNotes || {}));
    const existingQuestions = JSON.parse(JSON.stringify(property.questionResponses || {}));
    const existingRoomInstances = JSON.parse(JSON.stringify(property.roomInstances || {})); // CHANGED: Use detailedRoomInstances
    
    // CRITICAL FIX: If room instances are missing but assessment data exists, reconstruct them
	let finalRoomInstances = existingRoomInstances;

	if (Object.keys(existingRoomInstances).length === 0 && Object.keys(existingScores).length > 0) {
		console.log('🔧 RECONSTRUCTING detailed room instances from assessment data to prevent data loss');
		finalRoomInstances = reconstructDetailedRoomInstancesFromData(existingScores, property);
	} else {
		// Initialize room instances first
		initializeCategorizedRoomInstances(property);
		
		// Merge existing with initialized (don't overwrite)
		Object.keys(existingRoomInstances).forEach(roomId => {
			if (existingRoomInstances[roomId] && existingRoomInstances[roomId].length > 0) {
				assessmentState.roomInstances[roomId] = existingRoomInstances[roomId];
			}
		});
		finalRoomInstances = assessmentState.roomInstances;
	}

	assessmentState.roomInstances = finalRoomInstances;
	
	// Ensure all non-conditional rooms have instances  
	assessmentCategories.forEach(category => {
		category.rooms.forEach(room => {
			if (!room.conditional && (!assessmentState.roomInstances[room.id] || assessmentState.roomInstances[room.id].length === 0)) {
				if (room.allowMultiple) {
					let count = getRoomCount(property, room.id);
					assessmentState.roomInstances[room.id] = [];
					for (let i = 0; i < count; i++) {
						assessmentState.roomInstances[room.id].push({
							id: `${room.id}_${i}`,
							name: generateRoomName(room.name, i, count),
							customName: ''
						});
					}
				} else {
					assessmentState.roomInstances[room.id] = [{
						id: room.id,
						name: room.name,
						customName: ''
					}];
				}
			}
		});
	});
    
    // Now restore assessment data
    Object.assign(assessmentState, {
        propertyId: property.id,
        currentCategory: 0,
        currentRoom: 0,
        currentInstance: 0,
        scores: existingScores,
        notes: existingNotes,
        itemNotes: JSON.parse(JSON.stringify(property.itemNotes || {})),
        questionResponses: existingQuestions,
            categoryExpanded: { exterior: false, interior: false, other: false },
        roomExpanded: {}
    });
    
    appState.currentProperty = property;
    
    if (window.photoManager) {
        photoManager.loadPhotosForProperty(property);
    }
    
    showScreen('propertyAssessmentScreen');
    initializeCategorizedAssessmentUI();
    
    console.log('✅ Detailed assessment initialized with existing data:', {
        scores: Object.keys(assessmentState.scores).length,
        notes: Object.keys(assessmentState.notes).length,
        roomInstances: Object.keys(assessmentState.roomInstances).length
    });
}

function initializeCategorizedAssessmentUI() {
    updateAssessmentHeader();
    updateProgressBar();
    renderCategorizedNavigationWithQuestions();
    
    // FIXED: Initialize photo previews after rendering
    setTimeout(() => {
        initializeAllPhotoPreviewsDetailed();
    }, 200);
    
    // Show empty state with enhanced guide
    document.getElementById('assessmentForm').innerHTML = `
        <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
            <i class="fas fa-hand-pointer" style="font-size: 2rem; margin-bottom: 15px; display: block;"></i>
            <h3>Select a category above to begin assessment</h3>
            <p>Choose Exterior, Interior, or Other Features, then select a room to assess</p>
            <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 15px;">
                <h4 style="color: var(--success-green); margin-bottom: 10px;">
                    <i class="fas fa-lightbulb"></i> Assessment Guide
                </h4>
                <p style="font-size: 0.9rem; line-height: 1.5;">
                    This assessment is based on professional property inspection guidelines. 
                    Each item includes guidance to help you make informed decisions.
                    ${appState.currentProperty?.type === 'complex' ? 
                        'As this is a sectional title property, pay special attention to common areas and body corporate matters.' : 
                        'As this is a freestanding house, assess both interior and exterior thoroughly.'}
                </p>
            </div>
        </div>
    `;
}

// New function to initialize all photo previews for detailed assessment
function initializeAllPhotoPreviewsDetailed() {
    if (!window.photoManager) return;
    
    // Initialize photo previews for all visible assessment items
    assessmentCategories.forEach(category => {
        category.rooms.forEach(room => {
            const instances = assessmentState.roomInstances[room.id] || [];
            instances.forEach(instance => {
                room.items.forEach(item => {
                    photoManager.updatePhotoPreview(instance.id, item.text);
                });
            });
        });
    });
}


function renderCategorizedNavigationWithQuestions() {
    const container = document.getElementById('roomNavigation');
    container.style.display = 'block';

    // ── Assessment search/filter ──
    const searchQ = (assessmentState.searchFilter || '').trim().toLowerCase();
    const roomMatchesSearch = (room) => !searchQ ||
        room.name.toLowerCase().includes(searchQ) ||
        room.items.some(it => it.text.toLowerCase().includes(searchQ));
    const categoryHasSearchMatch = (category) => category.rooms.some(r => {
        const inst = assessmentState.roomInstances[r.id] || [];
        if (r.conditional && inst.length === 0) return false;
        return roomMatchesSearch(r);
    });

    container.innerHTML = `
        <div class="assessment-search-bar">
            <i class="fas fa-search assessment-search-icon"></i>
            <input type="text" id="assessSearchInput" class="assessment-search-input"
                   placeholder="Search items to assess..." value="${(assessmentState.searchFilter || '').replace(/"/g, '&quot;')}"
                   oninput="onAssessmentSearch(this.value)">
            ${searchQ ? `<button class="assessment-search-clear" onclick="clearAssessmentSearch()" title="Clear search"><i class="fas fa-times"></i></button>` : ''}
        </div>
        ${searchQ ? renderSearchSuggestions(searchQ) : ''}
        <div class="assessment-categories">
            ${assessmentCategories.map((category, categoryIndex) => (searchQ && !categoryHasSearchMatch(category)) ? '' : `
                <div class="assessment-category">
                    <div class="category-header" onclick="toggleCategory('${category.id}')">
                        <div class="category-title">
                            <div class="category-icon" style="background: ${category.color}">
                                <i class="fas ${category.icon}"></i>
                            </div>
                            <span class="category-name">${category.name}</span>
                            ${(() => {
                                const pct = Math.round(getCategoryProgress(category) / 3.6);
                                const r = 16;
                                const circ = 2 * Math.PI * r;
                                const dash = (pct / 100) * circ;
                                const ringColor = pct === 100 ? '#1d9e75' : category.color;
                                return `<div class="category-progress ${pct === 100 ? 'complete' : ''}">
                                    <svg viewBox="0 0 40 40" width="40" height="40">
                                        <circle cx="20" cy="20" r="${r}" fill="none" stroke="rgba(128,144,160,0.22)" stroke-width="3.5"/>
                                        ${pct > 0 ? `<circle cx="20" cy="20" r="${r}" fill="none" stroke="${ringColor}" stroke-width="3.5" stroke-dasharray="${dash.toFixed(1)} ${(circ - dash).toFixed(1)}" stroke-linecap="round" transform="rotate(-90 20 20)"/>` : ''}
                                    </svg>
                                    <span class="category-progress-text">${pct}%</span>
                                </div>`;
                            })()}
                        </div>
                        <div class="category-toggle ${assessmentState.categoryExpanded[category.id] ? '' : 'collapsed'}">
                            <i class="fas fa-chevron-down"></i>
                        </div>
                    </div>
                    
                    ${(searchQ ? true : assessmentState.categoryExpanded[category.id]) ? `
                        <div class="category-expanded-content">
                            ${category.rooms.map(room => {
                                const instances = assessmentState.roomInstances[room.id] || [];
                                const roomExpanded = assessmentState.roomExpanded?.[room.id] || false;
                                
                                // Search filter: hide rooms that don't match
                                if (searchQ && !roomMatchesSearch(room)) {
                                    return '';
                                }
                                
                                // FIXED: Show all non-conditional rooms, even if instances are missing
                                if (room.conditional && instances.length === 0) {
                                    return '';
                                }
                                
                                // FIXED: Create instances for non-conditional rooms if missing
                                if (!room.conditional && instances.length === 0) {
                                    console.warn(`Creating missing instances for non-conditional room: ${room.id}`);
                                    if (room.allowMultiple) {
                                        let count = getRoomCount(appState.currentProperty, room.id);
                                        assessmentState.roomInstances[room.id] = [];
                                        for (let i = 0; i < count; i++) {
                                            assessmentState.roomInstances[room.id].push({
                                                id: `${room.id}_${i}`,
                                                name: generateRoomName(room.name, i, count),
                                                customName: ''
                                            });
                                        }
                                    } else {
                                        assessmentState.roomInstances[room.id] = [{
                                            id: room.id,
                                            name: room.name,
                                            customName: ''
                                        }];
                                    }
                                    
                                    // Re-render to show the newly created instances
                                    setTimeout(() => renderCategorizedNavigationWithQuestions(), 100);
                                    return '';
                                }
                                
                                return `
                                    <div class="room-section" id="roomSection_${room.id}">
                                        ${!room.allowMultiple && instances.length === 1 ? `
                                            <!-- SINGLE INSTANCE: header bar IS the expand button, no repeated name button -->
                                            <div class="room-header-bar room-header-clickable ${isRoomInstanceCompleted(instances[0].id) ? 'room-header-done' : ''}"
                                                 onclick="switchToRoomInstance('${category.id}', '${room.id}', 0)">
                                                <div class="room-title-section">
                                                    <i class="fas ${room.icon}"></i>
                                                    <h4>${room.name}</h4>
                                                    ${isRoomInstanceCompleted(instances[0].id) ? '<i class="fas fa-check-circle room-done-tick"></i>' : ''}
                                                </div>
                                                <div class="room-controls">
                                                    ${room.conditional ? `
                                                        <button class="delete-room-instance-btn" onclick="event.stopPropagation(); removeAddedDetailFeature('${room.id}')" title="Remove">
                                                            <i class="fas fa-times"></i>
                                                        </button>
                                                    ` : ''}
                                                    <div class="room-expand-indicator">
                                                        <i class="fas ${assessmentState.roomExpanded?.[room.id] ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        ` : `
                                            <!-- MULTI INSTANCE: clickable header with chevron, pills shown inside expanded content -->
                                            <div class="room-header-bar room-header-clickable ${instances.every(inst => isRoomInstanceCompleted(inst.id)) ? 'room-header-done' : ''}"
                                                 onclick="switchToRoomInstance('${category.id}', '${room.id}', ${(() => { const ci = instances.findIndex((inst, ii) => isCurrentRoom(categoryIndex, room.id, ii)); return ci >= 0 ? ci : 0; })()})">
                                                <div class="room-title-section">
                                                    <i class="fas ${room.icon}"></i>
                                                    <h4>${room.name}</h4>
                                                    ${instances.every(inst => isRoomInstanceCompleted(inst.id)) ? '<i class="fas fa-check-circle room-done-tick"></i>' : ''}
                                                </div>
                                                <div class="room-controls">
                                                    ${room.conditional ? `
                                                        <button class="delete-room-instance-btn" onclick="event.stopPropagation(); removeAddedDetailFeature('${room.id}')" title="Remove">
                                                            <i class="fas fa-times"></i>
                                                        </button>
                                                    ` : ''}
                                                    <div class="room-expand-indicator">
                                                        <i class="fas ${roomExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
                                                    </div>
                                                </div>
                                            </div>
                                            ${roomExpanded ? `
                                                <div class="room-instances-panel">
                                                    <div class="room-instances-selector">
                                                        ${instances.map((instance, instanceIndex) => {
                                                            const isActive = isCurrentRoom(categoryIndex, room.id, instanceIndex);
                                                            const isCompleted = isRoomInstanceCompleted(instance.id);
                                                            return `
                                                                <div class="room-instance-wrapper">
                                                                    <button class="room-instance-btn ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}"
                                                                            onclick="event.stopPropagation(); switchToRoomInstance('${category.id}', '${room.id}', ${instanceIndex})">
                                                                        <span class="instance-name">${instance.customName || instance.name}</span>
                                                                        ${isCompleted ? '<i class="fas fa-check-circle room-done-icon"></i>' : ''}
                                                                    </button>
                                                                    ${room.conditional ? `
                                                                        <button class="delete-room-instance-btn" onclick="event.stopPropagation(); removeAddedDetailFeature('${room.id}')" title="Remove">
                                                                            <i class="fas fa-times"></i>
                                                                        </button>
                                                                    ` : instances.length > 1 ? `
                                                                        <button class="delete-room-instance-btn" onclick="event.stopPropagation(); removeRoomInstance('${room.id}', ${instanceIndex})" title="Remove">
                                                                            <i class="fas fa-times"></i>
                                                                        </button>
                                                                    ` : ''}
                                                                </div>
                                                            `;
                                                        }).join('')}
                                                        ${room.allowMultiple ? `
                                                            <button class="add-room-btn" onclick="event.stopPropagation(); addRoomInstance('${room.id}')">
                                                                <i class="fas fa-plus"></i>
                                                            </button>
                                                        ` : ''}
                                                    </div>
                                                </div>
                                            ` : ''}
                                        `}
                                        
                                        ${roomExpanded ? `
                                            ${instances.map((instance, instanceIndex) => {
                                                const isActive = isCurrentRoom(categoryIndex, room.id, instanceIndex);
                                                if (!isActive) return '';
                                                
                                                return `
                                                    <div class="assessment-content" id="assessmentContent_${instance.id}">
                                                        ${room.allowMultiple ? `
                                                            <div class="custom-name-section">
                                                                <label>Custom Name:</label>
                                                                <input type="text" class="room-name-input" 
                                                                       value="${instance.customName}" 
                                                                       placeholder="e.g. Main Bathroom, Guest Bedroom"
                                                                       onchange="updateRoomName('${instance.id}', this.value)">
                                                            </div>
                                                        ` : ''}
                                                        
                                                        <div class="assessment-items">
                                                            ${room.items.map((item, index) => `
                                                                <div class="assessment-item" id="assessmentItem_${instance.id}_${index}">
                                                                    <div class="item-question">
                                                                        <span class="question-text">${item.text}</span>
                                                                        <button class="info-btn" onclick="showItemInfo('${item.info}')" title="Assessment Guide">
                                                                            <i class="fas fa-info-circle"></i>
                                                                        </button>
                                                                    </div>
                                                                    
                                                                    <div class="item-rating">
                                                                        <select class="rating-dropdown" onchange="setRating('${instance.id}', '${item.text}', this.value)">
                                                                            <option value="">Select rating...</option>
                                                                            <option value="excellent:4" ${getRatingSelected(instance.id, item.text, 'excellent')}>⭐ Excellent (5/5)</option>
                                                                            <option value="good:3" ${getRatingSelected(instance.id, item.text, 'good')}>✅ Good (4/5)</option>
                                                                            <option value="fair:2" ${getRatingSelected(instance.id, item.text, 'fair')}>⚠️ Fair (3/5)</option>
                                                                            <option value="poor:1" ${getRatingSelected(instance.id, item.text, 'poor')}>❌ Poor (2/5)</option>
                                                                            <option value="na:0" ${getRatingSelected(instance.id, item.text, 'na')}>➖ N/A</option>
                                                                        </select>
                                                                    </div>
                                                                    
                                                                    <div class="item-photos">
                                                                        <div class="photo-actions">
                                                                            <button class="photo-btn capture-btn" onclick="capturePhoto('${instance.id}', '${item.text}')">
                                                                                <i class="fas fa-camera"></i> Add Photo
                                                                            </button>
                                                                            <button class="photo-btn note-btn ${getItemNote(instance.id, item.text) ? 'has-note' : ''}" onclick="toggleNoteArea(this)">
                                                                                <i class="fas fa-pencil-alt"></i> Note
                                                                            </button>
                                                                        </div>
                                                                        <div class="item-note-area" style="display:${getItemNote(instance.id, item.text) ? 'block' : 'none'};">
                                                                            <div class="voice-listening" style="display:none;">
                                                                                <span class="voice-dot"></span>
                                                                                <span class="voice-listening-text">Listening&hellip; speak now</span>
                                                                                <button class="voice-stop-btn" onclick="stopVoiceCapture()">
                                                                                    <i class="fas fa-stop"></i> Stop
                                                                                </button>
                                                                            </div>
                                                                            <div class="note-input-row">
                                                                                <textarea class="item-note-textarea" rows="2" placeholder="Add note for this item..." oninput="onItemNoteInput('${instance.id}', '${item.text}', this.value)" onchange="updateItemNote('${instance.id}', '${item.text}', this.value)">${getItemNote(instance.id, item.text)}</textarea>
                                                                                <button class="voice-mic-btn" onclick="startVoiceInto(this, '${instance.id}', '${item.text}')" title="Speak your note">
                                                                                    <i class="fas fa-microphone"></i>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div class="photo-preview" id="photos_${instance.id}_${item.text.replace(/\s+/g, '_').replace(/[^\w]/g, '')}"></div>
                                                                    </div>
                                                                </div>
                                                            `).join('')}
                                                        </div>
                                                        
														<div class="room-completion-section">
															<div class="completion-status">
																<div class="completion-progress">
																	<div class="completion-bar">
																		<div class="completion-fill" style="width: ${getRoomCompletionStatus(room.id).completionPercent}%"></div>
																	</div>
																	<span class="completion-text">
																		${getRoomCompletionStatus(room.id).completedItems}/${getRoomCompletionStatus(room.id).totalItems} items complete
																	</span>
																</div>
															</div>
															
															<div class="done-button-container">
																<button class="done-button ${getRoomCompletionStatus(room.id).isComplete ? 'complete' : 'incomplete'}" 
																		onclick="completeAndCollapseRoom('${room.id}')">
																	<i class="fas ${getRoomCompletionStatus(room.id).isComplete ? 'fa-check-circle' : 'fa-arrow-up'}"></i>
																	${getRoomCompletionStatus(room.id).isComplete ? 'Done - Next Section' : 'Save & Continue'}
																</button>
															</div>
														</div>
                                                    </div>
                                                `;
                                            }).join('')}
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                            
                            ${(category.id === 'other' && !searchQ) ? `
                                <div class="add-other-features-section">
                                    <h4><i class="fas fa-plus-circle"></i> Add Additional Features</h4>
                                    <div class="add-feature-controls">
                                        <select class="feature-dropdown" id="otherFeatureDropdown_${category.id}">
                                            <option value="">Select feature to add...</option>
                                            ${getAvailableOtherFeatures().map(feature => `
                                                <option value="${feature.id}">${feature.name}</option>
                                            `).join('')}
                                        </select>
                                        <button class="add-feature-btn" onclick="addOtherFeature('${category.id}')">
                                            <i class="fas fa-plus"></i> Add Feature
                                        </button>
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${(category.id === 'exterior' && !searchQ) ? `
                                <div class="add-other-features-section">
                                    <h4><i class="fas fa-plus-circle"></i> Add Additional Exterior Features</h4>
                                    <div class="add-feature-controls">
                                        <select class="feature-dropdown" id="exteriorFeatureDropdown_${category.id}">
                                            <option value="">Select feature to add...</option>
                                            ${getAvailableExteriorFeatures().map(feature => `
                                                <option value="${feature.id}">${feature.name}</option>
                                            `).join('')}
                                        </select>
                                        <button class="add-feature-btn" onclick="addExteriorFeature('${category.id}')">
                                            <i class="fas fa-plus"></i> Add Feature
                                        </button>
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${(category.id === 'interior' && !searchQ) ? `
                                <div class="add-other-features-section">
                                    <h4><i class="fas fa-plus-circle"></i> Add Additional Interior Features</h4>
                                    <div class="add-feature-controls">
                                        <select class="feature-dropdown" id="interiorFeatureDropdown_${category.id}">
                                            <option value="">Select feature to add...</option>
                                            ${getAvailableInteriorFeatures().map(feature => `
                                                <option value="${feature.id}">${feature.name}</option>
                                            `).join('')}
                                        </select>
                                        <button class="add-feature-btn" onclick="addInteriorFeature('${category.id}')">
                                            <i class="fas fa-plus"></i> Add Feature
                                        </button>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        
        ${searchQ ? '' : renderQuestionsSection(appState.currentProperty)}
    `;
    
    // Repopulate photo previews after every re-render (render wipes the containers)
    if (window.photoManager) {
        setTimeout(() => initializeAllPhotoPreviewsDetailed(), 50);
    }
    
    // Hide mic buttons if this device has no voice support
    if (!isVoiceAvailable()) {
        container.querySelectorAll('.voice-mic-btn').forEach(b => b.style.display = 'none');
    }
}


// ═══════════════════ ASSESSMENT SEARCH / FILTER ═══════════════════

let __assessSearchDebounce = null;

function onAssessmentSearch(value) {
    assessmentState.searchFilter = value;
    clearTimeout(__assessSearchDebounce);
    __assessSearchDebounce = setTimeout(() => {
        applySearchAutoExpand();
        renderCategorizedNavigationWithQuestions();
        const inp = document.getElementById('assessSearchInput');
        if (inp) {
            inp.focus();
            const len = inp.value.length;
            try { inp.setSelectionRange(len, len); } catch (e) {}
        }
    }, 250);
}

function clearAssessmentSearch() {
    assessmentState.searchFilter = '';
    renderCategorizedNavigationWithQuestions();
}

// If exactly one room matches the search, open it automatically
function applySearchAutoExpand() {
    const q = (assessmentState.searchFilter || '').trim().toLowerCase();
    if (!q) return;
    const matches = [];
    assessmentCategories.forEach((cat, ci) => {
        cat.rooms.forEach((room, ri) => {
            const inst = assessmentState.roomInstances[room.id] || [];
            if (room.conditional && inst.length === 0) return;
            const hit = room.name.toLowerCase().includes(q) ||
                        room.items.some(it => it.text.toLowerCase().includes(q));
            if (hit) matches.push({ ci, ri, room });
        });
    });
    if (matches.length === 1) {
        const m = matches[0];
        assessmentState.currentCategory = m.ci;
        assessmentState.currentRoom = m.ri;
        assessmentState.currentInstance = 0;
        if (!assessmentState.roomExpanded) assessmentState.roomExpanded = {};
        assessmentState.roomExpanded[m.room.id] = true;
        assessmentState.categoryExpanded[assessmentCategories[m.ci].id] = true;
    }
}

// Suggest additional features that match the search but aren't in the assessment yet
function renderSearchSuggestions(q) {
    const suggestions = [];
    assessmentCategories.forEach(cat => {
        cat.rooms.forEach(room => {
            const inst = assessmentState.roomInstances[room.id] || [];
            if (room.conditional && inst.length === 0 && room.name.toLowerCase().includes(q)) {
                suggestions.push({ room, categoryName: cat.name });
            }
        });
    });

    // Check whether anything visible matched
    const anyVisibleMatch = assessmentCategories.some(cat => cat.rooms.some(room => {
        const inst = assessmentState.roomInstances[room.id] || [];
        if (room.conditional && inst.length === 0) return false;
        return room.name.toLowerCase().includes(q) ||
               room.items.some(it => it.text.toLowerCase().includes(q));
    }));

    let html = '';
    suggestions.forEach(s => {
        html += `
            <div class="search-suggestion-card">
                <div class="search-suggestion-icon"><i class="fas ${s.room.icon || 'fa-star'}"></i></div>
                <div class="search-suggestion-info">
                    <div class="search-suggestion-name">${s.room.name}</div>
                    <div class="search-suggestion-sub">Additional feature &mdash; not in this assessment yet</div>
                </div>
                <button class="search-suggestion-add" onclick="confirmAddFeatureFromSearch('${s.room.id}')">
                    <i class="fas fa-plus"></i> Add
                </button>
            </div>`;
    });

    if (!anyVisibleMatch && suggestions.length === 0) {
        html += `
            <div class="search-no-results">
                <i class="fas fa-search"></i>
                <span>No items match "<strong>${q.replace(/</g, '&lt;')}</strong>"</span>
            </div>`;
    }
    return html;
}

function confirmAddFeatureFromSearch(roomId) {
    let foundRoom = null;
    assessmentCategories.forEach(cat => cat.rooms.forEach(r => { if (r.id === roomId) foundRoom = r; }));
    if (!foundRoom) return;
    showModal(
        'Add Feature',
        `<div class="info-modal-content">
            <div class="info-icon" style="color: var(--success-green);"><i class="fas ${foundRoom.icon || 'fa-star'}"></i></div>
            <p>Add <strong>${foundRoom.name}</strong> to this assessment?</p>
            <p style="font-size: 0.85em; opacity: 0.75;">It will be added to the checklist and filtered so you can assess it right away.</p>
        </div>`,
        () => addFeatureFromSearch(roomId),
        'Yes, Add',
        () => {},
        'Cancel'
    );
}

function addFeatureFromSearch(roomId) {
    if (assessmentState.roomInstances[roomId]) return;
    let foundRoom = null, foundCatIndex = -1, foundRoomIndex = -1;
    assessmentCategories.forEach((cat, ci) => cat.rooms.forEach((r, ri) => {
        if (r.id === roomId) { foundRoom = r; foundCatIndex = ci; foundRoomIndex = ri; }
    }));
    if (!foundRoom) return;

    assessmentState.roomInstances[roomId] = [{
        id: roomId,
        name: foundRoom.name,
        customName: ''
    }];

    // Focus the new feature: expand its category + room, keep it filtered
    assessmentState.currentCategory = foundCatIndex;
    assessmentState.currentRoom = foundRoomIndex;
    assessmentState.currentInstance = 0;
    if (!assessmentState.roomExpanded) assessmentState.roomExpanded = {};
    assessmentState.roomExpanded[roomId] = true;
    assessmentState.categoryExpanded[assessmentCategories[foundCatIndex].id] = true;
    assessmentState.searchFilter = foundRoom.name;

    saveCurrentAssessmentProgress();
    renderCategorizedNavigationWithQuestions();
    updateProgressBar();
    if (typeof showSuccess === 'function') showSuccess(`${foundRoom.name} added!`);
}

function renderQuestionsSection(property) {
    const propertyType = property.type === 'complex' ? 'complex' : 'house';
    const questions = importantQuestions[propertyType] || [];
    
    if (questions.length === 0) return '';
    
    const qCount = questions.length;
    return `
        <div class="questions-section ${assessmentState.questionsExpanded ? 'open' : ''}">
            <div class="questions-header" onclick="toggleQuestions()">
                <div class="questions-header-icon"><i class="fas fa-question-circle"></i></div>
                <div class="questions-header-info">
                    <h3>Important Questions</h3>
                    <p>Key questions to ask about this ${propertyType}</p>
                </div>
                <div class="questions-header-count">${qCount}</div>
                <i class="fas fa-chevron-down questions-chevron"></i>
            </div>
            
            ${assessmentState.questionsExpanded ? `
                <div class="questions-list">
                    ${questions.map(q => `
                        <div class="question-item ${q.required ? 'required' : ''}">
                            <div class="question-header">
                                <h5>${q.question} ${q.required ? '<span class="required-marker">*</span>' : ''}</h5>
                                <button class="question-info-btn" onclick="showQuestionInfo('${q.info}')" title="More Info">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </div>
                            <div class="question-response">
                                <div class="voice-listening" style="display:none;">
                                    <span class="voice-dot"></span>
                                    <span class="voice-listening-text">Listening&hellip; speak now</span>
                                    <button class="voice-stop-btn" onclick="stopVoiceCapture()">
                                        <i class="fas fa-stop"></i> Stop
                                    </button>
                                </div>
                                <div class="note-input-row">
                                    <textarea class="question-textarea" 
                                              placeholder="Record the response here..."
                                              onchange="updateQuestionResponse('${q.id}', this.value)">${assessmentState.questionResponses[q.id] || ''}</textarea>
                                    <button class="voice-mic-btn" onclick="startVoiceIntoQuestion(this, '${q.id}')" title="Speak the response">
                                        <i class="fas fa-microphone"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// UTILITY FUNCTIONS
function isCurrentRoom(categoryIndex, roomId, instanceIndex) {
    const currentCategory = assessmentCategories[assessmentState.currentCategory];
    const currentRoom = currentCategory?.rooms?.[assessmentState.currentRoom];
    
    return categoryIndex === assessmentState.currentCategory && 
           currentRoom?.id === roomId && 
           assessmentState.currentInstance === instanceIndex;
}


function getCategoryProgress(category) {
    let totalItems = 0;
    let completedItems = 0;
    
    category.rooms.forEach(room => {
        const instances = assessmentState.roomInstances[room.id] || [];
        
        // FIXED: Only count actual instances that exist, not expected instances
        if (instances.length > 0) {
            instances.forEach(instance => {
                totalItems += room.items.length;
                const roomScores = assessmentState.scores[instance.id] || {};
                completedItems += Object.keys(roomScores).filter(key => 
                    roomScores[key].rating && 
                    roomScores[key].rating !== '' && 
                    roomScores[key].rating !== 'select'
                ).length;
            });
        }
    });
    
    return totalItems > 0 ? (completedItems / totalItems) * 360 : 0;
}


function getQuestionsProgress() {
    const property = appState.currentProperty;
    if (!property) return 0;
    
    const propertyType = property.type === 'complex' ? 'complex' : 'house';
    const questions = importantQuestions[propertyType] || [];
    
    const answered = questions.filter(q => assessmentState.questionResponses[q.id] && 
                                          assessmentState.questionResponses[q.id].trim()).length;
    
    return questions.length > 0 ? (answered / questions.length) * 360 : 0;
}

function getRatingSelected(instanceId, itemText, rating) {
    const roomScores = assessmentState.scores[instanceId];
    if (roomScores && roomScores[itemText] && roomScores[itemText].rating === rating) {
        return 'selected';
    }
    return '';
}

// INTERACTION FUNCTIONS
function toggleCategory(categoryId) {
    const wasExpanded = assessmentState.categoryExpanded[categoryId];
    
    // Collapse all other categories
    Object.keys(assessmentState.categoryExpanded).forEach(catId => {
        if (catId !== categoryId) {
            assessmentState.categoryExpanded[catId] = false;
        }
    });
    
    assessmentState.categoryExpanded[categoryId] = !wasExpanded;
    
    if (wasExpanded) {
        document.getElementById('assessmentForm').innerHTML = `
            <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                <i class="fas fa-hand-pointer" style="font-size: 2rem; margin-bottom: 15px; display: block;"></i>
                <h3>Select a category above to begin assessment</h3>
                <p>Choose Exterior, Interior, or Other Features, then select a room to assess</p>
            </div>
        `;
    }
    
    renderCategorizedNavigationWithQuestions();
    
    // Auto-scroll to expanded category — offset for sticky app-top-bar
    if (!wasExpanded) {
        setTimeout(() => {
            const categoryElement = document.querySelector(`[onclick="toggleCategory('${categoryId}')"]`);
            if (categoryElement) {
                const stickyHeader = document.querySelector('.app-top-bar');
                const offset = (stickyHeader ? stickyHeader.offsetHeight : 60) + 8;
                const top = categoryElement.getBoundingClientRect().top
                          + (window.pageYOffset || document.documentElement.scrollTop)
                          - offset;
                window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
            }
        }, 100);
    }
}


function toggleQuestions() {
    assessmentState.questionsExpanded = !assessmentState.questionsExpanded;
    
    
        renderCategorizedNavigationWithQuestions();
    
}

function switchToRoomInstance(categoryId, roomId, instanceIndex) {
    
    
    // Enhanced detailed assessment room switching
    const categoryIndex = assessmentCategories.findIndex(c => c.id === categoryId);
    const roomIndex = assessmentCategories[categoryIndex].rooms.findIndex(r => r.id === roomId);
    
    const isSameRoom = assessmentState.currentCategory === categoryIndex && 
                      assessmentState.currentRoom === roomIndex && 
                      assessmentState.currentInstance === instanceIndex;
    
    if (isSameRoom) {
        if (!assessmentState.roomExpanded) assessmentState.roomExpanded = {};
        assessmentState.roomExpanded[roomId] = !assessmentState.roomExpanded[roomId];
    } else {
        assessmentState.currentCategory = categoryIndex;
        assessmentState.currentRoom = roomIndex;
        assessmentState.currentInstance = instanceIndex;
        
        if (!assessmentState.roomExpanded) assessmentState.roomExpanded = {};
        assessmentState.roomExpanded[roomId] = true;
    }
    
    renderCategorizedNavigationWithQuestions();
    updateProgressBar();
    
    // FIXED: Initialize photo previews for the opened room
    setTimeout(() => {
        if (assessmentState.roomExpanded[roomId]) {
            const instances = assessmentState.roomInstances[roomId] || [];
            const instance = instances[instanceIndex];
            if (instance) {
                const room = assessmentCategories[categoryIndex].rooms[roomIndex];
                room.items.forEach(item => {
                    if (window.photoManager) {
                        photoManager.updatePhotoPreview(instance.id, item.text);
                    }
                });
                
                // Scroll so the CATEGORY heading stays visible — offset for sticky app-top-bar
                const categoryHeader = document.querySelector(`[onclick="toggleCategory('${categoryId}')"]`);
                if (categoryHeader) {
                    const stickyHeader = document.querySelector('.app-top-bar');
                    const offset = (stickyHeader ? stickyHeader.offsetHeight : 60) + 8;
                    const top = categoryHeader.getBoundingClientRect().top
                              + (window.pageYOffset || document.documentElement.scrollTop)
                              - offset;
                    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
                }
            }
        }
    }, 200);
}


function setRating(instanceId, itemText, value) {
    console.log('🎯 Setting rating for instance:', instanceId, 'item:', itemText, 'value:', value);
    
    if (!instanceId || instanceId === 'undefined') {
        console.error('❌ Invalid instanceId:', instanceId);
        return;
    }
    
    if (!value || value === '') {
        if (assessmentState.scores[instanceId]) {
            delete assessmentState.scores[instanceId][itemText];
            console.log('❌ Removed rating for:', instanceId, itemText);
            
            if (Object.keys(assessmentState.scores[instanceId]).length === 0) {
                delete assessmentState.scores[instanceId];
            }
        }
    } else {
        const [rating, score] = value.split(':');
        
        if (!assessmentState.scores[instanceId]) {
            assessmentState.scores[instanceId] = {};
        }
        
        assessmentState.scores[instanceId][itemText] = {
            rating: rating,
            score: parseInt(score)
        };
        console.log('✅ Added rating for instance:', instanceId, 'item:', itemText, 'rating:', rating, 'score:', score);
    }
    
    // Force immediate progress bar update
    const overallProgress = calculateAccurateProgress();
    
    const progressFill = document.getElementById('assessmentProgress');
    const progressText = document.getElementById('progressText');
    
    if (progressFill) {
        progressFill.style.width = overallProgress + '%';
    }
    
    if (progressText) {
        progressText.textContent = `${overallProgress}% Complete`;
    }
    
    // Update stored progress then immediately refresh results button visibility
    const currentProperty = appState.currentProperty;
    if (currentProperty) {
        currentProperty.progress = overallProgress;
        const pidx = appState.properties.findIndex(p => p.id === currentProperty.id);
        if (pidx !== -1) appState.properties[pidx].progress = overallProgress;
        updateResultsButton();
    }
    
    // FIXED: Update category progress circles with more robust selector
    const categories = assessmentCategories;
    const categoryProgressElements = document.querySelectorAll('.category-progress');
    
    categories.forEach((category, index) => {
        const categoryProgress = getCategoryProgress(category);
        
        const progressPercent = Math.round(categoryProgress / 3.6);
        const categoryProgressElement = categoryProgressElements[index];
        
        if (categoryProgressElement) {
            // Rebuild the SVG progress ring in place
            const r = 16;
            const circ = 2 * Math.PI * r;
            const dash = (progressPercent / 100) * circ;
            const ringColor = progressPercent === 100 ? '#1d9e75' : category.color;
            categoryProgressElement.classList.toggle('complete', progressPercent === 100);
            categoryProgressElement.innerHTML = `
                <svg viewBox="0 0 40 40" width="40" height="40">
                    <circle cx="20" cy="20" r="${r}" fill="none" stroke="rgba(128,144,160,0.22)" stroke-width="3.5"/>
                    ${progressPercent > 0 ? `<circle cx="20" cy="20" r="${r}" fill="none" stroke="${ringColor}" stroke-width="3.5" stroke-dasharray="${dash.toFixed(1)} ${(circ - dash).toFixed(1)}" stroke-linecap="round" transform="rotate(-90 20 20)"/>` : ''}
                </svg>
                <span class="category-progress-text">${progressPercent}%</span>`;
        }
    });
    
    // Update room completion progress immediately
    const roomId = findRoomIdForInstance(instanceId);
    if (roomId) {
        const completionStatus = getRoomCompletionStatus(roomId);
        
        const completionFill = document.querySelector('.completion-fill');
        if (completionFill) {
            completionFill.style.width = completionStatus.completionPercent + '%';
        }
        
        const completionText = document.querySelector('.completion-text');
        if (completionText) {
            completionText.textContent = `${completionStatus.completedItems}/${completionStatus.totalItems} items complete`;
        }
        
        const doneButton = document.querySelector('.done-button');
        if (doneButton) {
            doneButton.className = `done-button ${completionStatus.isComplete ? 'complete' : 'incomplete'}`;
            doneButton.innerHTML = `<i class="fas ${completionStatus.isComplete ? 'fa-check-circle' : 'fa-arrow-up'}"></i>
                ${completionStatus.isComplete ? 'Done - Next Section' : 'Save & Continue'}`;
        }
    }
    
    saveCurrentAssessmentProgress();
    
    setTimeout(() => {
        updateRoomInstanceVisuals(instanceId);
    }, 100);
}

function findRoomIdForInstance(instanceId) {
    for (const [roomId, instances] of Object.entries(assessmentState.roomInstances)) {
        if (instances.some(instance => instance.id === instanceId)) {
            return roomId;
        }
    }
    return null;
}

function updateRoomName(instanceId, customName) {
    Object.values(assessmentState.roomInstances).forEach(instances => {
        if (Array.isArray(instances)) {
            instances.forEach(instance => {
                if (instance.id === instanceId) {
                    instance.customName = customName;
                }
            });
        }
    });
    
    // IMMEDIATE save
    saveCurrentAssessmentProgress();
}

function updateRoomNotes(instanceId, notes) {
    assessmentState.notes[instanceId] = notes;
    
    // Update button styling
    const addNotesBtn = document.querySelector(`button[onclick="toggleRoomNotes('${instanceId}')"]`);
    if (addNotesBtn) {
        if (notes && notes.trim()) {
            addNotesBtn.classList.add('has-notes');
        } else {
            addNotesBtn.classList.remove('has-notes');
        }
    }
    
    // IMMEDIATE save
    saveCurrentAssessmentProgress();
}

function updateQuestionResponse(questionId, response) {
    assessmentState.questionResponses[questionId] = response;
    
    // IMMEDIATE save
    saveCurrentAssessmentProgress();
}

function toggleRoomNotes(instanceId) {
    const notesContainer = document.getElementById(`notes_${instanceId}`);
    if (notesContainer) {
        notesContainer.classList.toggle('show');
        
        // FIXED: Ensure proper focus and styling
        if (notesContainer.classList.contains('show')) {
            const textarea = notesContainer.querySelector('.room-notes-textarea');
            if (textarea) {
                setTimeout(() => textarea.focus(), 100);
            }
        }
    }
}


function getItemNote(instanceId, itemText) {
    return (assessmentState.itemNotes && assessmentState.itemNotes[instanceId] && assessmentState.itemNotes[instanceId][itemText]) || '';
}

function updateItemNote(instanceId, itemText, value) {
    if (!assessmentState.itemNotes) assessmentState.itemNotes = {};
    if (!assessmentState.itemNotes[instanceId]) assessmentState.itemNotes[instanceId] = {};
    if (value && value.trim()) {
        assessmentState.itemNotes[instanceId][itemText] = value.trim();
    } else {
        delete assessmentState.itemNotes[instanceId][itemText];
        if (Object.keys(assessmentState.itemNotes[instanceId]).length === 0) {
            delete assessmentState.itemNotes[instanceId];
        }
    }
    const property = appState.currentProperty;
    if (property) {
        property.itemNotes = { ...assessmentState.itemNotes };
    }
    // Persist immediately — notes must survive app restarts and appear in PDFs
    saveCurrentAssessmentProgress();
}

// Debounced live-save while typing, so notes persist even without blur
let __itemNoteDebounce = {};
function onItemNoteInput(instanceId, itemText, value) {
    const key = instanceId + '|' + itemText;
    clearTimeout(__itemNoteDebounce[key]);
    __itemNoteDebounce[key] = setTimeout(() => updateItemNote(instanceId, itemText, value), 600);
}

// ═══════════════════ VOICE NOTES (on-device speech-to-text, nothing recorded) ═══════════════════
// Voice input is transcription only — the microphone audio is never saved to the phone.

let __voiceTarget = null; // { instanceId, itemText, container, before, after, insertPos }
let __voiceAvailable = null;

function isVoiceAvailable() {
    if (__voiceAvailable !== null) return __voiceAvailable;
    try {
        __voiceAvailable = typeof Android !== 'undefined' &&
            typeof Android.startVoiceNote === 'function' &&
            (typeof Android.isVoiceNoteAvailable !== 'function' || Android.isVoiceNoteAvailable());
    } catch (e) { __voiceAvailable = false; }
    return __voiceAvailable;
}

// Note button: open/close the note input directly, ready to type
function toggleNoteArea(btn) {
    const wrap = btn.closest('.item-photos');
    if (!wrap) return;
    const noteArea = wrap.querySelector('.item-note-area');
    if (!noteArea) return;

    const isHidden = noteArea.style.display === 'none' || noteArea.style.display === '';
    if (isHidden) {
        noteArea.style.display = 'block';
        // Hide the mic if this device has no voice support (e.g. browser testing)
        const mic = noteArea.querySelector('.voice-mic-btn');
        if (mic && !isVoiceAvailable()) mic.style.display = 'none';
        const ta = noteArea.querySelector('.item-note-textarea');
        if (ta) setTimeout(() => ta.focus(), 80);
    } else {
        stopVoiceCapture();
        noteArea.style.display = 'none';
    }
}

// Mic button: dictate into the note at the current cursor position
function startVoiceInto(btn, instanceId, itemText) {
    const noteArea = btn.closest('.item-note-area');
    if (!noteArea) return;
    const ta = noteArea.querySelector('.item-note-textarea');
    if (!ta) return;

    const value = ta.value || '';
    let pos = value.length;
    try {
        if (typeof ta.selectionStart === 'number' && document.activeElement === ta) {
            pos = ta.selectionStart;
        }
    } catch (e) {}

    __voiceTarget = {
        instanceId: instanceId,
        itemText: itemText,
        container: noteArea,
        before: value.slice(0, pos),
        after: value.slice(pos),
        insertPos: pos
    };

    const indicator = noteArea.querySelector('.voice-listening');
    if (indicator) {
        indicator.style.display = 'flex';
        indicator.querySelector('.voice-listening-text').textContent = 'Starting microphone\u2026';
    }
    btn.classList.add('mic-active');

    try { Android.startVoiceNote(); }
    catch (e) { onVoiceNoteError('error'); }
}

// Mic button on an Important Question: dictate into that response field
function startVoiceIntoQuestion(btn, questionId) {
    const container = btn.closest('.question-response');
    if (!container) return;
    const ta = container.querySelector('.question-textarea');
    if (!ta) return;

    const value = ta.value || '';
    let pos = value.length;
    try {
        if (typeof ta.selectionStart === 'number' && document.activeElement === ta) {
            pos = ta.selectionStart;
        }
    } catch (e) {}

    __voiceTarget = {
        mode: 'question',
        questionId: questionId,
        container: container,
        before: value.slice(0, pos),
        after: value.slice(pos),
        insertPos: pos
    };

    const indicator = container.querySelector('.voice-listening');
    if (indicator) {
        indicator.style.display = 'flex';
        indicator.querySelector('.voice-listening-text').textContent = 'Starting microphone\u2026';
    }
    btn.classList.add('mic-active');

    try { Android.startVoiceNote(); }
    catch (e) { onVoiceNoteError('error'); }
}

function stopVoiceCapture() {
    try { if (typeof Android !== 'undefined' && Android.stopVoiceNote) Android.stopVoiceNote(); } catch (e) {}
}

// Light polish, aware of where the text is being inserted
function polishVoiceText(text, before, after) {
    let t = (text || '').trim();
    if (!t) return '';
    const b = (before || '').trimEnd();
    // Capitalise if starting the note or following the end of a sentence
    if (b === '' || /[.!?]$/.test(b)) {
        t = t.charAt(0).toUpperCase() + t.slice(1);
    }
    t = t.replace(/\bi\b/g, 'I');
    t = t.replace(/\bdb board\b/gi, 'DB board');
    t = t.replace(/\bcoc\b/gi, 'COC');
    t = t.replace(/\bdiy\b/gi, 'DIY');
    // Full stop only when the dictation ends the note
    if ((after || '').trim() === '' && t.split(/\s+/).length > 2 && !/[.!?]$/.test(t)) t += '.';
    return t;
}

function joinVoiceParts(before, inserted, after) {
    let b = before || '';
    if (b && !/\s$/.test(b) && inserted) b += ' ';
    let a = after || '';
    if (a && !/^\s/.test(a) && inserted) a = ' ' + a;
    return b + inserted + a;
}

function clearVoiceUI(target) {
    const ind = target.container.querySelector('.voice-listening');
    if (ind) ind.style.display = 'none';
    const mic = target.container.querySelector('.voice-mic-btn');
    if (mic) mic.classList.remove('mic-active');
}

// ── Callbacks from the native speech recognizer ──
window.onVoiceNoteListening = function() {
    if (!__voiceTarget) return;
    const ind = __voiceTarget.container.querySelector('.voice-listening');
    if (ind) ind.querySelector('.voice-listening-text').textContent = 'Listening\u2026 speak now';
};

function getVoiceTextarea(target) {
    return target.container.querySelector(
        target.mode === 'question' ? '.question-textarea' : '.item-note-textarea'
    );
}

window.onVoiceNotePartial = function(text) {
    if (!__voiceTarget) return;
    const ta = getVoiceTextarea(__voiceTarget);
    if (!ta) return;
    ta.value = joinVoiceParts(__voiceTarget.before, text, __voiceTarget.after);
};

window.onVoiceNoteResult = function(text) {
    if (!__voiceTarget) return;
    const target = __voiceTarget;
    __voiceTarget = null;
    clearVoiceUI(target);

    const polished = polishVoiceText(text, target.before, target.after);
    const ta = getVoiceTextarea(target);

    if (!polished) {
        if (ta) ta.value = target.before + target.after;
        return;
    }

    const finalText = joinVoiceParts(target.before, polished, target.after);
    if (ta) {
        ta.value = finalText;
        // Place the cursor right after the dictated text, ready to continue
        try {
            const caret = joinVoiceParts(target.before, polished, '').length;
            ta.focus();
            ta.setSelectionRange(caret, caret);
        } catch (e) {}
    }

    if (target.mode === 'question') {
        updateQuestionResponse(target.questionId, finalText);
    } else {
        updateItemNote(target.instanceId, target.itemText, finalText);
    }
    if (typeof trackEvent === 'function') { try { trackEvent('voice_note_captured'); } catch (e) {} }
};

window.onVoiceNoteError = function(kind) {
    if (!__voiceTarget) return;
    const target = __voiceTarget;
    __voiceTarget = null;
    clearVoiceUI(target);

    const ta = getVoiceTextarea(target);
    if (ta) ta.value = target.before + target.after;

    let msg = 'Voice input failed \u2014 you can type instead.';
    if (kind === 'no_speech') msg = 'No speech detected \u2014 tap the mic to try again.';
    if (kind === 'permission' || kind === 'permission_denied') msg = 'Microphone permission is needed for voice input.';
    if (kind === 'unavailable') msg = 'Voice input is not available on this device.';
    if (typeof showError === 'function') showError(msg);
    else if (typeof showSuccess === 'function') showSuccess(msg);
};

function toggleItemNote(btn) {
    const noteArea = btn.closest('.item-photos').querySelector('.item-note-area');
    if (!noteArea) return;
    const isHidden = noteArea.style.display === 'none' || noteArea.style.display === '';
    noteArea.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
        const ta = noteArea.querySelector('.item-note-textarea');
        if (ta) setTimeout(() => ta.focus(), 80);
    }
}
function showItemInfo(info) {
    showModal('Assessment Guide', info);
}

function showQuestionInfo(info) {
    showModal('Question Information', info);
}


function initializePhotoPreviewsForActiveRoom() {
    if (!window.photoManager) return;
    
    const currentCategory = assessmentCategories[assessmentState.currentCategory];
    if (currentCategory) {
        const currentRoom = currentCategory.rooms[assessmentState.currentRoom];
        if (currentRoom) {
            const activeInstance = assessmentState.roomInstances[currentRoom.id]?.[assessmentState.currentInstance];
            if (activeInstance) {
                currentRoom.items.forEach(item => {
                    photoManager.updatePhotoPreview(activeInstance.id, item.text);
                });
            }
        }
    }
}

function addRoomInstance(roomId) {
    if (!assessmentState.roomInstances[roomId]) {
        assessmentState.roomInstances[roomId] = [];
    }
    
    const instances = assessmentState.roomInstances[roomId];
    const newIndex = instances.length;
    const roomName = getRoomNameFromId(roomId);
    
    instances.push({
        id: `${roomId}_${newIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // FIXED: Unique ID
        name: generateRoomName(roomName, newIndex, instances.length + 1),
        customName: ''
    });
    
    
        renderCategorizedNavigationWithQuestions();
    
    
    updateProgressBar();
	saveCurrentAssessmentProgress();
}

function removeRoomInstance(roomId, instanceIndex) {
    if (!assessmentState.roomInstances[roomId] || assessmentState.roomInstances[roomId].length <= 1) {
        return; // Don't remove if it's the only instance
    }
    
    const instance = assessmentState.roomInstances[roomId][instanceIndex];
    if (!instance) return;
    
    // Remove the instance
    assessmentState.roomInstances[roomId].splice(instanceIndex, 1);
    
    // Remove any scores, notes and photos for this instance
    delete assessmentState.scores[instance.id];
    delete assessmentState.notes[instance.id];
    if (assessmentState.itemNotes) delete assessmentState.itemNotes[instance.id];
    if (window.photoManager && appState.currentProperty) {
        photoManager.deletePhotosForInstance(appState.currentProperty.id, instance.id);
    }
    
    // Update instance names for remaining instances
    assessmentState.roomInstances[roomId].forEach((inst, idx) => {
        const roomName = getRoomNameFromId(roomId);
        inst.name = generateRoomName(roomName, idx, assessmentState.roomInstances[roomId].length);
    });
    
    // FIXED: Force immediate progress recalculation
    updateProgressBar();
    
    // Re-render navigation
    
        renderCategorizedNavigationWithQuestions();
    
    
    saveCurrentAssessmentProgress();
}


function getAvailableOtherFeatures() {
    const currentFeatures = Object.keys(assessmentState.roomInstances);
    const allOtherFeatures = [
        { id: 'solar-power', name: 'Solar Power' },
        { id: 'backup-power', name: 'Backup Power/UPS' },
        { id: 'borehole', name: 'Borehole' },
        { id: 'irrigation-systems', name: 'Irrigation Systems' },
        { id: 'water-tank', name: 'Water Tank/Storage' },
        { id: 'gas-installation', name: 'Gas Installation' },
        { id: 'outbuildings', name: 'Outbuildings' },
        { id: 'internet-fibre', name: 'Internet Access/Fibre' },
        { id: 'sports-court', name: 'Sports Court' },
        { id: 'smart-home', name: 'Smart Home' },
        { id: 'air-conditioning', name: 'Air Conditioning' },
        { id: 'heating-systems', name: 'Heating Systems' }
    ];
    
    return allOtherFeatures.filter(feature => !currentFeatures.includes(feature.id));
}

function getAvailableExteriorFeatures() {
    const currentFeatures = Object.keys(assessmentState.roomInstances);
    const allExteriorFeatures = [
        { id: 'gate-entrance', name: 'Gate/Entrance' },
        { id: 'garages', name: 'Garage' },
        { id: 'carports', name: 'Carport' },
        { id: 'gutters', name: 'Gutters' },
        { id: 'site-drainage', name: 'Site Drainage' },
        { id: 'garden-areas', name: 'Garden' },
        { id: 'swimming-pool', name: 'Swimming Pool' },
        { id: 'water-features', name: 'Water Features' }
    ];
    
    return allExteriorFeatures.filter(feature => !currentFeatures.includes(feature.id));
}

function getAvailableInteriorFeatures() {
    const currentFeatures = Object.keys(assessmentState.roomInstances);
    const allInteriorFeatures = [
        { id: 'lounge', name: 'Lounge' },
        { id: 'family-tv-rooms', name: 'Family/TV Rooms' },
        { id: 'dining-room', name: 'Dining Room' },
        { id: 'reception', name: 'Reception' },
        { id: 'study-office', name: 'Study/Office' },
        { id: 'laundry-room', name: 'Laundry Room' },
        { id: 'home-theater', name: 'Home Theater' }
    ];
    
    return allInteriorFeatures.filter(feature => !currentFeatures.includes(feature.id));
}


// Helper function to get proper icons
function getFeatureIcon(featureId) {
    const iconMap = {
    };
    return iconMap[featureId] || 'fa-star';
}


// FIXED: Updated feature icon mapping with consistent naming


function addOtherFeature(categoryId) {
    const dropdown = document.getElementById(`otherFeatureDropdown_${categoryId}`);
    if (!dropdown || !dropdown.value) {
        showModal('Add Feature', `
            <div class="info-modal-content">
                <div class="info-icon"><i class="fas fa-info-circle"></i></div>
                <p>Please select a feature to add.</p>
            </div>
        `);
        return;
    }
    
    const selectedValue = dropdown.value;
    const selectedText = dropdown.options[dropdown.selectedIndex].text;
    
   const quickFeatureId = `quick_${selectedValue}`;
if (assessmentState.roomInstances[quickFeatureId] || assessmentState.roomInstances[selectedValue]) {
        showModal('Feature Already Added', `
            <div class="warning-modal-content">
                <div class="warning-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <p><strong>${selectedText}</strong> is already in this assessment.</p>
            </div>
        `);
        dropdown.value = '';
        return;
    }
    
    // Create room if it doesn't exist in assessmentCategories
    let room = assessmentCategories.find(cat => cat.id === 'other')?.rooms.find(r => r.id === selectedValue);
    
    if (!room) {
        // Create room definition for missing features
        room = {
            id: selectedValue,
            name: selectedText,
            icon: 'fa-star',
            allowMultiple: false,
            conditional: true,
            items: getDetailedFeatureItems(selectedValue)
        };
        
        const otherCategory = assessmentCategories.find(cat => cat.id === 'other');
        if (otherCategory) {
            otherCategory.rooms.push(room);
        }
    }
    
    assessmentState.roomInstances[selectedValue] = [{
        id: selectedValue,
        name: room.name,
        customName: ''
    }];
    
    dropdown.value = '';
    
    // Save immediately
    saveCurrentAssessmentProgress();
    
    renderCategorizedNavigationWithQuestions();
    updateProgressBar();
    showSuccess(`${room.name} added!`);
}

function addExteriorFeature(categoryId) {
    const dropdown = document.getElementById(`exteriorFeatureDropdown_${categoryId}`);
    const selectedValue = dropdown.value;
    
    if (!selectedValue) {
        showModal('Add Feature', `
            <div class="info-modal-content">
                <div class="info-icon"><i class="fas fa-info-circle"></i></div>
                <p>Please select a feature to add.</p>
            </div>
        `);
        return;
    }
    
    const selectedText = dropdown.options[dropdown.selectedIndex].text;
    
    if (assessmentState.roomInstances[selectedValue]) {
        showModal('Feature Already Added', `
            <div class="warning-modal-content">
                <div class="warning-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <p><strong>${selectedText}</strong> is already in this assessment.</p>
            </div>
        `);
        dropdown.value = '';
        return;
    }
    
    const room = assessmentCategories.find(cat => cat.id === 'exterior')?.rooms.find(r => r.id === selectedValue);
    if (!room) {
        console.error('Room definition not found for:', selectedValue);
        return;
    }
    
    assessmentState.roomInstances[selectedValue] = [{
        id: selectedValue,
        name: room.name,
        customName: ''
    }];
    
    dropdown.value = '';
    
    const property = appState.currentProperty;
    if (property) {
        property.roomInstances = { ...assessmentState.roomInstances };
        property.assessments = { ...assessmentState.scores };
        
        const propertyIndex = appState.properties.findIndex(p => p.id === property.id);
        if (propertyIndex !== -1) {
            appState.properties[propertyIndex] = { ...property };
        }
        
        saveAppData();
        if (window.saveAssessmentsToIndexedDB) {
            window.saveAssessmentsToIndexedDB([property]);
        }
    }
    
    renderCategorizedNavigationWithQuestions();
    updateProgressBar();
    showSuccess(`${room.name} added!`);
}

function addInteriorFeature(categoryId) {
    const dropdown = document.getElementById(`interiorFeatureDropdown_${categoryId}`);
    if (!dropdown || !dropdown.value) {
        showModal('Add Feature', `
            <div class="info-modal-content">
                <div class="info-icon"><i class="fas fa-info-circle"></i></div>
                <p>Please select a feature to add.</p>
            </div>
        `);
        return;
    }
    
    const selectedValue = dropdown.value;
    const selectedText = dropdown.options[dropdown.selectedIndex].text;
    
    if (assessmentState.roomInstances[selectedValue]) {
        showModal('Feature Already Added', `
            <div class="warning-modal-content">
                <div class="warning-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <p><strong>${selectedText}</strong> is already in this assessment.</p>
            </div>
        `);
        dropdown.value = '';
        return;
    }
    
    // Create room if it doesn't exist
    let room = assessmentCategories.find(cat => cat.id === 'interior')?.rooms.find(r => r.id === selectedValue);
    
    if (!room) {
        room = {
            id: selectedValue,
            name: selectedText,
            icon: 'fa-door-open',
            allowMultiple: false,
            conditional: true,
            items: getDetailedFeatureItems(selectedValue)
        };
        
        const interiorCategory = assessmentCategories.find(cat => cat.id === 'interior');
        if (interiorCategory) {
            interiorCategory.rooms.push(room);
        }
    }
    
    assessmentState.roomInstances[selectedValue] = [{
        id: selectedValue,
        name: room.name,
        customName: ''
    }];
    
    dropdown.value = '';
    
    // Save immediately
    saveCurrentAssessmentProgress();
    
    renderCategorizedNavigationWithQuestions();
    updateProgressBar();
    showSuccess(`${room.name} added!`);
}

function ensureDetailedRoomInstances(property) {
    const rooms = ['kitchen', 'bathrooms', 'bedrooms', 'boundary-wall', 'security-safety'];
    
    rooms.forEach(roomId => {
        if (!property.roomInstances[roomId]) {
            const room = assessmentCategories.flatMap(c => c.rooms).find(r => r.id === roomId);
            if (room?.allowMultiple) {
                const count = getRoomCount(property, roomId);
                property.roomInstances[roomId] = Array.from({length: count}, (_, i) => ({
                    id: `${roomId}_${i}`,
                    name: generateRoomName(room.name, i, count),
                    customName: ''
                }));
            } else if (room) {
                property.roomInstances[roomId] = [{id: roomId, name: room.name, customName: ''}];
            }
        }
    });
}

function ensureQuickRoomInstances(property) {
    const rooms = ['external-security', 'structural-first', 'kitchen-quick', 'bathrooms-quick', 'bedrooms-quick'];
    
    rooms.forEach(roomId => {
        if (!property.roomInstances[roomId]) {
            const room = assessmentCategories.flatMap(c => c.rooms).find(r => r.id === roomId);
            if (room) {
                if (room.allowMultiple) {
                    const count = getRoomCount(property, roomId);
                    property.roomInstances[roomId] = Array.from({length: count}, (_, i) => ({
                        id: `${roomId}_${i}`,
                        name: generateRoomName(room.name, i, count),
                        customName: ''
                    }));
                } else {
                    property.roomInstances[roomId] = [{id: roomId, name: room.name, customName: ''}];
                }
            }
        }
    });
}

// Clear assessment report state
function clearAssessmentReportState() {
    // Reset any report-related state if needed
    console.log('Assessment report state cleared');
}

function toggleRoomSection(roomId) {
    if (!assessmentState.roomExpanded) assessmentState.roomExpanded = {};
    assessmentState.roomExpanded[roomId] = !assessmentState.roomExpanded[roomId];
    
    
        renderCategorizedNavigationWithQuestions();
    
}

// Custom confirm modal using existing modal system
function showConfirmModal(title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') {
    showModal(title, `
        <div class="confirm-modal-content">
            <div class="confirm-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <p>${message}</p>
        </div>
    `, () => {
        onConfirm();
    }, confirmText, null, cancelText);
}

function removeAddedDetailFeature(roomId) {
    showModal('Remove Feature?', `
        <div class="confirm-modal-content">
            <div class="confirm-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <p><strong>Are you sure you want to remove this feature?</strong></p>
            <p>This action cannot be undone.</p>
        </div>
    `, () => {
        // Capture instance ids BEFORE deleting, so their photos can be removed too
        const removedInstanceIds = (assessmentState.roomInstances[roomId] || []).map(inst => inst.id);
        
        delete assessmentState.roomInstances[roomId];
        
        Object.keys(assessmentState.scores).forEach(instanceId => {
            if (instanceId === roomId || instanceId.startsWith(roomId + '_')) {
                delete assessmentState.scores[instanceId];
            }
        });
        
        Object.keys(assessmentState.notes).forEach(instanceId => {
            if (instanceId === roomId || instanceId.startsWith(roomId + '_')) {
                delete assessmentState.notes[instanceId];
            }
        });
        
        if (assessmentState.itemNotes) {
            Object.keys(assessmentState.itemNotes).forEach(instanceId => {
                if (instanceId === roomId || instanceId.startsWith(roomId + '_')) {
                    delete assessmentState.itemNotes[instanceId];
                }
            });
        }
        
        // Delete the removed feature's photos (memory + IndexedDB) so they
        // disappear from the assessment and never appear in exported PDFs
        if (window.photoManager && appState.currentProperty) {
            removedInstanceIds.forEach(instId => {
                photoManager.deletePhotosForInstance(appState.currentProperty.id, instId);
            });
        }
        
        const property = appState.currentProperty;
        if (property) {
            property.roomInstances = { ...assessmentState.roomInstances };
            property.assessments = { ...assessmentState.scores };
            property.roomNotes = { ...assessmentState.notes };
        property.itemNotes = { ...assessmentState.itemNotes };
            
            const propertyIndex = appState.properties.findIndex(p => p.id === property.id);
            if (propertyIndex !== -1) {
                appState.properties[propertyIndex] = { ...property };
            }
            
            saveAppData();
            if (window.saveAssessmentsToIndexedDB) {
                window.saveAssessmentsToIndexedDB([property]);
            }
        }
        
        renderCategorizedNavigationWithQuestions();
        updateProgressBar();
        showSuccess('Feature removed');
    }, 'Remove', null, 'Cancel');
}

// Get available assessment types for a property


function getTotalQuickItems(property) {
    // Count total possible items in quick assessment
    let total = 0;
    assessmentCategories.forEach(category => {
        category.rooms.forEach(room => {
            if (!room.conditional || (property.roomInstances && property.roomInstances[room.id])) {
                const instances = property.roomInstances?.[room.id] || [{ id: room.id }];
                instances.forEach(() => {
                    total += room.items.length;
                });
            }
        });
    });
    return total;
}

function getTotalDetailedItems(property) {
    // Count total possible items in detailed assessment
    let total = 0;
    assessmentCategories.forEach(category => {
        category.rooms.forEach(room => {
            if (!room.conditional || (property.roomInstances && property.roomInstances[room.id])) {
                const instances = property.roomInstances?.[room.id] || [{ id: room.id }];
                instances.forEach(() => {
                    total += room.items.length;
                });
            }
        });
    });
    return total;
}

// Helper function to track which category a room was added to
function getRoomCategory(roomId) {
    // Check which category this room was originally added to
    for (const category of assessmentCategories) {
        if (category.rooms.find(r => r.id === roomId)) {
            return category.id;
        }
    }
    return null;
}

function forceSaveAssessment() {
    const property = appState.currentProperty;
    if (!property) return;
    
    console.log('🔄 Force saving assessment...');
    
    // Update property with current state
    
        property.assessments = { ...assessmentState.scores };
        property.roomNotes = { ...assessmentState.notes };
        property.itemNotes = { ...assessmentState.itemNotes };
        property.questionResponses = { ...assessmentState.questionResponses };
    
    
    property.roomInstances = { ...assessmentState.roomInstances };
    property.updatedAt = new Date().toISOString();
    
    // Update in properties array
    const propertyIndex = appState.properties.findIndex(p => p.id === property.id);
    if (propertyIndex !== -1) {
        appState.properties[propertyIndex] = { ...property };
    }
    
    // Save to storage
    saveAppData();
    
    if (window.saveAssessmentsToIndexedDB) {
        window.saveAssessmentsToIndexedDB([property]);
    }
    
    console.log('✅ Assessment saved');
}

function renderAssessmentResultsButton() {
    const property = appState.currentProperty;
    if (!property) return '';
    
    const progress = calculateAssessmentProgress(property);
    const currentProgress = (typeof progress === 'object' ? (progress.quick || progress.detailed || 0) : progress) || 0;
    
    if (currentProgress >= 100) {
        return `
            <button class="assessment-results-btn primary-button" onclick="viewAssessmentResults('${property.id}')" style="margin-right: 10px;">
                <i class="fas fa-chart-line"></i> View Assessment Results
            </button>
        `;
    }
    
    return '';
}

function saveCurrentAssessmentProgress() {
    const property = appState.currentProperty;
    if (!property) {
        console.warn('No property found to save to');
        return;
    }
    
    // GUARD: never write one property's assessment session onto another property.
    // assessmentState belongs to exactly one property (tagged at load time).
    if (assessmentState.propertyId && assessmentState.propertyId !== property.id) {
        console.warn('Save skipped: assessment session belongs to a different property');
        return;
    }
    
    console.log('Saving assessment progress for:', property.id);
    
    const updates = {
        updatedAt: new Date().toISOString()
    };
    
    // Single assessment — store all data to unified fields
    updates.assessments = JSON.parse(JSON.stringify(assessmentState.scores));
    updates.roomNotes = JSON.parse(JSON.stringify(assessmentState.notes));
    updates.itemNotes = JSON.parse(JSON.stringify(assessmentState.itemNotes || {}));
    updates.questionResponses = JSON.parse(JSON.stringify(assessmentState.questionResponses));
    updates.roomInstances = JSON.parse(JSON.stringify(assessmentState.roomInstances));
    updates.progress = calculateAccurateProgress();
    
    Object.assign(property, updates);
    
    // Force recalculate score after every save
    forceRecalculatePropertyScore(property);
    
    const propertyIndex = appState.properties.findIndex(p => p.id === property.id);
    if (propertyIndex !== -1) {
        Object.assign(appState.properties[propertyIndex], property);
    }
    
    saveAppData();
    
    if (window.saveAssessmentsToIndexedDB) {
        window.saveAssessmentsToIndexedDB([property]);
    }

    // Analytics: fire on 25/50/75% milestones and once at 100%
    if (window.trackEvent) {
        const prog = Math.round(updates.progress);
        if (prog >= 100 && !property._completionTracked) {
            property._completionTracked = true;
            trackEvent('assessment_completed', {
                property_id: property.id,
                property_address: property.address || 'unknown',
                score: property.score || 0
            });
        } else if (prog > 0 && prog < 100) {
            const milestone = Math.floor(prog / 25) * 25;
            if (milestone > 0 && property._lastMilestone !== milestone) {
                property._lastMilestone = milestone;
                trackEvent('assessment_in_progress', {
                    property_id: property.id,
                    progress_percent: prog,
                    milestone: milestone
                });
            }
        }
    }
}


function removeQuickRoomInstance(roomId, instanceIndex) {
    if (!assessmentState.roomInstances[roomId] || assessmentState.roomInstances[roomId].length <= 1) {
        return; // Don't remove if it's the only instance
    }
    
    const instance = assessmentState.roomInstances[roomId][instanceIndex];
    if (!instance) return;
    
    // Remove the instance
    assessmentState.roomInstances[roomId].splice(instanceIndex, 1);
    
    // Remove any scores and notes for this instance
    delete assessmentState.scores[instance.id];
    delete assessmentState.notes[instance.id];
    
    // Update instance names for remaining instances
    assessmentState.roomInstances[roomId].forEach((inst, idx) => {
        const roomName = getRoomNameFromId(roomId);
        inst.name = generateRoomName(roomName, idx, assessmentState.roomInstances[roomId].length);
    });
    
    // FIXED: Force immediate progress recalculation
    updateProgressBar();
    
    // Re-render navigation
    renderQuickAssessmentNavigation();
    
    saveCurrentAssessmentProgress();
}

// 5. Add function to add quick room instances
function addQuickRoomInstance(roomId) {
    if (!assessmentState.roomInstances[roomId]) {
        assessmentState.roomInstances[roomId] = [];
    }
    
    const instances = assessmentState.roomInstances[roomId];
    const newIndex = instances.length;
    const roomName = getRoomNameFromId(roomId);
    
    // Use simple indexed ID pattern (like detailed assessment)
	const instanceId = instances.length > 0 ? `${roomId}_${newIndex}` : roomId;

	instances.push({
		id: instanceId,
		name: generateRoomName(roomName, newIndex, instances.length + 1),
		customName: ''
	});
    
    renderQuickAssessmentNavigation();
	updateProgressBar();
    saveCurrentAssessmentProgress();
}

function forceRecalculatePropertyScore(property) {
    console.log('=== FORCE RECALCULATE SCORES ===');
    delete property.calculatedScore;
    delete property.lastScoreCalculation;

    if (property.assessments && Object.keys(property.assessments).length > 0) {
        console.log('Recalculating assessment score...');
        const scoreData = window.calculatePropertyScore(property);
        if (scoreData) {
            property.score = scoreData.overall;
            console.log('Score calculated:', scoreData.overall);
        }
    }
}

function getRoomCategoryId(roomId) {
    if (roomId.includes('security') || roomId.includes('pool') || roomId.includes('garden') || roomId.includes('water-features')) {
        return 'first_impressions';
    }
    if (roomId.includes('lounge') || roomId.includes('dining') || roomId.includes('reception') || roomId.includes('study') || roomId.includes('laundry') || roomId.includes('theater')) {
        return 'living_areas';
    }
    return 'other_features_quick';
}

window.removeQuickRoomInstance = removeQuickRoomInstance;
window.addQuickRoomInstance = addQuickRoomInstance;
window.forceRecalculatePropertyScore = forceRecalculatePropertyScore;

// Export the helper function
window.getRoomCategory = getRoomCategory;

// Export functions
window.getAvailableAssessmentTypes = getAvailableAssessmentTypes;

window.clearAssessmentReportState = clearAssessmentReportState;

// Export functions
window.startAssessment = startAssessment;
window.initializeDetailedAssessment = initializeDetailedAssessment;
window.toggleCategory = toggleCategory;
window.toggleQuestions = toggleQuestions;
window.switchToRoomInstance = switchToRoomInstance;
window.setRating = setRating;
window.updateRoomName = updateRoomName;
window.updateRoomNotes = updateRoomNotes;
window.updateQuestionResponse = updateQuestionResponse;
window.toggleRoomNotes = toggleRoomNotes;
window.showItemInfo = showItemInfo;
window.showQuestionInfo = showQuestionInfo;
window.addRoomInstance = addRoomInstance;
window.removeRoomInstance = removeRoomInstance;
window.addOtherFeature = addOtherFeature;
window.onAssessmentSearch = onAssessmentSearch;
window.clearAssessmentSearch = clearAssessmentSearch;
window.confirmAddFeatureFromSearch = confirmAddFeatureFromSearch;
window.updateItemNote = updateItemNote;
window.onItemNoteInput = onItemNoteInput;
window.toggleItemNote = toggleItemNote;
window.toggleNoteArea = toggleNoteArea;
window.startVoiceInto = startVoiceInto;
window.startVoiceIntoQuestion = startVoiceIntoQuestion;
window.stopVoiceCapture = stopVoiceCapture;
window.addFeatureFromSearch = addFeatureFromSearch;
window.addExteriorFeature = addExteriorFeature;
window.addInteriorFeature = addInteriorFeature;
window.getAvailableOtherFeatures = getAvailableOtherFeatures;
window.getAvailableExteriorFeatures = getAvailableExteriorFeatures;
window.getAvailableInteriorFeatures = getAvailableInteriorFeatures;
window.getRoomNameFromId = getRoomNameFromId;
window.assessmentState = assessmentState;
window.toggleRoomSection = toggleRoomSection;
window.showConfirmModal = showConfirmModal;

window.removeAddedDetailFeature = removeAddedDetailFeature;
window.saveAssessmentChanges = saveAssessmentChanges;
window.cancelAssessmentChanges = cancelAssessmentChanges;
window.getRoomCategory = getRoomCategory;
window.updateProgressBarUI = updateProgressBarUI;
window.calculateAccurateProgress = calculateAccurateProgress;
window.getCategoryProgressPercent = getCategoryProgressPercent;
window.forceSaveAssessment = forceSaveAssessment;
window.updateRoomInstanceVisuals = updateRoomInstanceVisuals;
window.isCurrentAssessmentComplete = isCurrentAssessmentComplete;
window.updateResultsButton = updateResultsButton;
window.viewCurrentAssessmentResults = viewCurrentAssessmentResults;
window.importantQuestions = importantQuestions;

// FIXED: Update visual indicators for a specific room instance
function updateRoomInstanceVisuals(instanceId) {
    const button = document.querySelector(`button[onclick*="${instanceId}"]`);
    if (!button) return;
    
    const isCompleted = isRoomInstanceCompleted(instanceId);
    
    // Remove existing state classes
    button.classList.remove('completed');
    
    // Add completed class if all items are rated (no tick icon needed)
    if (isCompleted) {
        button.classList.add('completed');
    }
}

// FIXED: Enhanced completion checking - only count valid ratings
function isRoomInstanceCompleted(instanceId) {
    const roomScores = assessmentState.scores[instanceId];
    if (!roomScores) return false;
    
    // Find the room definition to get expected item count
    const categories = assessmentCategories;
    let expectedItemCount = 0;
    
    // Find the room in categories
    for (const category of categories) {
        for (const room of category.rooms) {
            const instances = assessmentState.roomInstances[room.id] || [];
            const instance = instances.find(inst => inst.id === instanceId);
            if (instance) {
                expectedItemCount = room.items.length;
                break;
            }
        }
        if (expectedItemCount > 0) break;
    }
    
    // Count valid ratings
    const completedItems = Object.keys(roomScores).filter(itemText => {
        const score = roomScores[itemText];
        return score && 
               score.rating && 
               score.rating !== '' && 
               score.rating !== 'select' &&
               score.rating !== 'Select rating...';
    }).length;
    
    const isComplete = expectedItemCount > 0 && completedItems >= expectedItemCount;
    
    console.log(`Room ${instanceId} completion:`, {
        expectedItemCount,
        completedItems,
        isComplete
    });
    
    return isComplete;
}

// FIXED: Check if current assessment is 100% complete
function isCurrentAssessmentComplete() {
    const property = appState.currentProperty;
    if (!property) return false;
    
    // FIXED: Use stored progress from property
    const progress = property.progress || 0;
    
    return progress >= 100;
}

// FIXED: Update results button visibility
function updateResultsButton() {
    const container = document.getElementById('assessmentResultsButtonContainer');
    const button = document.getElementById('assessmentResultsButton');
    
    if (!container || !button) return;
    
    const isComplete = isCurrentAssessmentComplete();
    
    if (isComplete) {
        container.style.display = 'block';
        button.innerHTML = `<i class="fas fa-chart-line"></i> View Assessment Results`;
    } else {
        container.style.display = 'none';
    }
}

// FIXED: View current assessment results
function viewCurrentAssessmentResults() {
    const property = appState.currentProperty;
    if (!property || !isCurrentAssessmentComplete()) {
        showModal('Assessment Incomplete', 'Please complete 100% of the assessment before viewing results.');
        return;
    }
    
    // Save current progress before viewing results
    saveCurrentAssessmentProgress();
    
    // Navigate to results screen
    showScreen('assessmentResultsScreen');
    if (window.initializeAssessmentResults) {
        window.initializeAssessmentResults();
    }
}


// DEBUG: Add this function to help diagnose issues
function debugProgressCalculation() {
    console.log('=== PROGRESS DEBUG ===');
    console.log('Assessment mode:', 'assessment');
    console.log('Room instances:', assessmentState.roomInstances);
    
    const categories = assessmentCategories;
    
    categories.forEach(category => {
        console.log(`\nCATEGORY: ${category.name}`);
        category.rooms.forEach(room => {
            const instances = assessmentState.roomInstances[room.id] || [];
            console.log(`  ROOM: ${room.name} (${room.items.length} items per instance)`);
            console.log(`  Instances: ${instances.length}`);
            
            instances.forEach((instance, idx) => {
                const scores = assessmentState.scores[instance.id] || {};
                const completedCount = Object.keys(scores).filter(key => 
                    scores[key].rating && 
                    scores[key].rating !== '' && 
                    scores[key].rating !== 'select'
                ).length;
                console.log(`    Instance ${idx + 1} (${instance.id}): ${completedCount}/${room.items.length} items completed`);
            });
        });
    });
}

// Export for manual debugging
window.debugProgressCalculation = debugProgressCalculation;

/**
 * Complete current room/feature and collapse it
 */
function completeAndCollapseRoom(roomId) {
    saveCurrentAssessmentProgress();
    if (!assessmentState.roomExpanded) assessmentState.roomExpanded = {};
    assessmentState.roomExpanded[roomId] = false;
    renderCategorizedNavigationWithQuestions();
    const roomName = getRoomNameFromId(roomId);
    showSuccess(`${roomName} completed!`);
    setTimeout(() => {
        const btn = document.querySelector(`[onclick*="switchToRoomInstance"][onclick*="${roomId}"]`);
        if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
}


function findNextIncompleteRoom(currentRoomId) {
    let foundCurrent = false;
    for (const category of assessmentCategories) {
        for (const room of category.rooms) {
            const instances = assessmentState.roomInstances[room.id] || [];
            if (instances.length === 0) continue;
            if (foundCurrent) {
                if (!instances.every(inst => isRoomInstanceCompleted(inst.id)))
                    return { roomId: room.id, categoryId: category.id, roomName: room.name };
            }
            if (room.id === currentRoomId) foundCurrent = true;
        }
    }
    return null;
}


function getRoomCompletionStatus(roomId) {
    const instances = assessmentState.roomInstances[roomId] || [];
    let totalItems = 0, completedItems = 0;
    const roomDef = assessmentCategories.flatMap(c => c.rooms).find(r => r.id === roomId);
    if (roomDef && instances.length > 0) {
        instances.forEach(inst => {
            totalItems += roomDef.items.length;
            const scores = assessmentState.scores[inst.id] || {};
            roomDef.items.forEach(item => {
                if (scores[item.text]?.rating && scores[item.text].rating !== '' && scores[item.text].rating !== 'select')
                    completedItems++;
            });
        });
    }
    const completionPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    return { totalItems, completedItems, completionPercent, isComplete: completionPercent >= 100 };
}


// Export the new functions
window.completeAndCollapseRoom = completeAndCollapseRoom;
window.findNextIncompleteRoom = findNextIncompleteRoom;
window.getRoomCompletionStatus = getRoomCompletionStatus;

console.log('🚀 Enhanced Two-Tier Assessment System loaded successfully');