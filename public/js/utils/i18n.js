/**
 * Lumina Transit - Internationalization (i18n) Module
 * Supports: English (en), Kannada (kn), Hindi (hi)
 */
const I18n = {
    currentLang: 'en',
    supportedLangs: [
        { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
        { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
        { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' }
    ],

    translations: {
        // ============================
        // APP SHELL & NAVIGATION
        // ============================
        'app.name': {
            en: 'SMART TRANSIT',
            kn: 'ಸ್ಮಾರ್ಟ್ ಟ್ರಾನ್ಸಿಟ್',
            hi: 'स्मार्ट ट्रांजिट'
        },
        'app.tagline': {
            en: 'Real-Time Crowd Intelligence',
            kn: 'ನೈಜ-ಸಮಯ ಜನಸಮೂಹ ಬುದ್ಧಿಮತ್ತೆ',
            hi: 'रीयल-टाइम भीड़ बुद्धिमत्ता'
        },
        'app.subtitle': {
            en: 'Bengaluru Smart Transit & Crowd Intelligence',
            kn: 'ಬೆಂಗಳೂರು ಸ್ಮಾರ್ಟ್ ಟ್ರಾನ್ಸಿಟ್ ಮತ್ತು ಜನಸಮೂಹ ಬುದ್ಧಿಮತ್ತೆ',
            hi: 'बेंगलुरु स्मार्ट ट्रांज़िट और भीड़ बुद्धिमत्ता'
        },

        // Bottom Navigation
        'nav.home': { en: 'Home', kn: 'ಮುಖಪುಟ', hi: 'होम' },
        'nav.trips': { en: 'Trips', kn: 'ಪ್ರಯಾಣ', hi: 'यात्रा' },
        'nav.ranks': { en: 'Ranks', kn: 'ಶ್ರೇಣಿ', hi: 'रैंक' },
        'nav.report': { en: 'Report', kn: 'ದೂರು', hi: 'रिपोर्ट' },
        'nav.profile': { en: 'Profile', kn: 'ಪ್ರೊಫೈಲ್', hi: 'प्रोफ़ाइल' },

        // ============================
        // HOME VIEW
        // ============================
        'home.search_placeholder': {
            en: 'Enter destination along Route 378 (e.g. Kengeri TTMC, Banashankari)...',
            kn: 'ಮಾರ್ಗ 378 ರ ಗಮ್ಯಸ್ಥಾನವನ್ನು ನಮೂದಿಸಿ (ಉದಾ. ಕೆಂಗೇರಿ, ಬನಶಂಕರಿ)...',
            hi: 'रूट 378 पर गंतव्य दर्ज करें (जैसे केंगेरी, बनशंकरी)...'
        },
        'home.popular_destinations': {
            en: 'Popular BMTC Destinations',
            kn: 'ಜನಪ್ರಿಯ BMTC ಗಮ್ಯಸ್ಥಾನಗಳು',
            hi: 'लोकप्रिय BMTC गंतव्य'
        },
        'home.tap_to_find': {
            en: 'Tap to find buses',
            kn: 'ಬಸ್ ಹುಡುಕಲು ಒತ್ತಿ',
            hi: 'बस खोजने के लिए टैप करें'
        },
        'home.route_available': {
            en: 'Route ${num} Available',
            kn: 'ಮಾರ್ಗ ${num} ಲಭ್ಯವಿದೆ',
            hi: 'मार्ग ${num} उपलब्ध'
        },
        'home.track_join': {
            en: 'Track & Join Queue',
            kn: 'ಟ್ರ್ಯಾಕ್ ಮತ್ತು ಸರದಿ ಸೇರಿ',
            hi: 'ट्रैक करें और कतार में शामिल हों'
        },
        'home.no_buses': {
            en: 'No direct buses found',
            kn: 'ನೇರ ಬಸ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
            hi: 'कोई सीधी बस नहीं मिली'
        },
        'home.try_nearby': {
            en: 'Try selecting a nearby Bengaluru stop.',
            kn: 'ಹತ್ತಿರದ ಬೆಂಗಳೂರು ನಿಲ್ದಾಣವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.',
            hi: 'पास का बेंगलुरु स्टॉप चुनें।'
        },
        'home.choose_other': {
            en: 'Choose Other',
            kn: 'ಬೇರೆ ಆಯ್ಕೆ ಮಾಡಿ',
            hi: 'अन्य चुनें'
        },
        'home.satellite': { en: 'Satellite', kn: 'ಉಪಗ್ರಹ', hi: 'उपग्रह' },
        'home.roadmap': { en: 'Map', kn: 'ನಕ್ಷೆ', hi: 'नक्शा' },
        'home.map_label': {
            en: 'Google Maps (Bengaluru)',
            kn: 'ಗೂಗಲ್ ಮ್ಯಾಪ್ (ಬೆಂಗಳೂರು)',
            hi: 'गूगल मैप (बेंगलुरु)'
        },
        'home.route_calculated': {
            en: 'Route Calculated',
            kn: 'ಮಾರ್ಗ ಲೆಕ್ಕ ಹಾಕಲಾಗಿದೆ',
            hi: 'मार्ग गणना की गई'
        },
        'home.all_corridor_stops': {
            en: 'All Route 378 Corridor Stops (${count})',
            kn: 'ಎಲ್ಲಾ ಮಾರ್ಗ 378 ಕಾರಿಡಾರ್ ನಿಲ್ದಾಣಗಳು (${count})',
            hi: 'सभी रूट 378 कॉरिडोर स्टॉप्स (${count})'
        },
        'home.tap_any_stop': {
            en: 'Tap any stop',
            kn: 'ಯಾವುದೇ ನಿಲ್ದಾಣವನ್ನು ಒತ್ತಿ',
            hi: 'किसी भी स्टॉप पर टैप करें'
        },
        'home.matching_stops': {
            en: 'Matching Route Stops (${count})',
            kn: 'ಹೊಂದಿಕೆಯಾಗುವ ಮಾರ್ಗ ನಿಲ್ದಾಣಗಳು (${count})',
            hi: 'मैचिंग रूट स्टॉप्स (${count})'
        },
        'home.tap_to_choose': {
            en: 'Tap to choose',
            kn: 'ಆಯ್ಕೆ ಮಾಡಲು ಒತ್ತಿ',
            hi: 'चुनने के लिए टैप करें'
        },
        'home.route_direct': {
            en: 'Route 378 Direct',
            kn: 'ಮಾರ್ಗ 378 ನೇರ',
            hi: 'रूट 378 डायरेक्ट'
        },
        'home.hub': {
            en: 'HUB',
            kn: 'ಹಬ್',
            hi: 'हब'
        },
        'home.major_hub': {
            en: 'Major Hub',
            kn: 'ಪ್ರಮುಖ ಹಬ್',
            hi: 'प्रमुख हब'
        },
        'home.available_buses_to': {
            en: 'Available Buses to ${dest}',
            kn: '${dest} ಗೆ ಲಭ್ಯವಿರುವ ಬಸ್‌ಗಳು',
            hi: '${dest} के लिए उपलब्ध बसें'
        },
        'home.nearest_bus_stop': {
            en: 'Nearest Bus Stop to Board',
            kn: 'ಹತ್ತಿರದ ಹತ್ತುವ ಬಸ್ ನಿಲ್ದಾಣ',
            hi: 'निकटतम बोर्डिंग बस स्टॉप'
        },
        'home.walk_to_stop': {
            en: 'Walk ${dist} (~${mins} mins)',
            kn: 'ನಡೆಯಿರಿ ${dist} (~${mins} ನಿಮಿಷ)',
            hi: 'पैदल चलें ${dist} (~${mins} मिनट)'
        },
        'home.board_bus_here': {
            en: 'Board Bus 378 here to reach ${dest}',
            kn: '${dest} ತಲುಪಲು ಇಲ್ಲಿ ಬಸ್ 378 ಹತ್ತಿ',
            hi: '${dest} पहुँचने के लिए यहाँ बस 378 पकड़ें'
        },
        'home.already_at_nearest': {
            en: 'You are at this bus stop • Ready to board!',
            kn: 'ನೀವು ಈ ಬಸ್ ನಿಲ್ದಾಣದಲ್ಲಿದ್ದೀರಿ • ಹತ್ತಲು ಸಿದ್ಧ!',
            hi: 'आप इस बस स्टॉप पर हैं • चढ़ने के लिए तैयार!'
        },
        'home.quick_destinations': {
            en: 'Popular Route 378 Destinations',
            kn: 'ಪ್ರಮುಖ ರೂಟ್ 378 ತಾಣಗಳು',
            hi: 'लोकप्रिय रूट 378 गंतव्य'
        },
        'home.enlarge_map': {
            en: 'Enlarge Map',
            kn: 'ನಕ್ಷೆ ದೊಡ್ಡದಾಗಿಸಿ',
            hi: 'नक्शा बड़ा करें'
        },
        'home.start_walkthrough': {
            en: 'Start Walkthrough',
            kn: 'ನಡಿಗೆ ಮಾರ್ಗದರ್ಶನ ಪ್ರಾರಂಭಿಸಿ',
            hi: 'वॉकिंग नेविगेशन शुरू करें'
        },
        'home.end_walkthrough': {
            en: 'End Walkthrough',
            kn: 'ಮಾರ್ಗದರ್ಶನ ಮುಕ್ತಾಯ',
            hi: 'नेविगेशन समाप्त करें'
        },
        'home.live_walk_nav': {
            en: 'Live Walking Navigation',
            kn: 'ಲೈವ್ ನಡಿಗೆ ಮಾರ್ಗದರ್ಶನ',
            hi: 'लाइव वॉकिंग नेविगेशन'
        },
        'home.best_bus_recommendation': {
            en: 'Best Bus to Board for You',
            kn: 'ನಿಮಗಾಗಿ ಅತ್ಯುತ್ತಮ ಬಸ್ ಶಿಫಾರಸು',
            hi: 'आपके लिए सबसे उपयुक्त बस'
        },
        'home.best_choice': {
            en: 'BEST CHOICE',
            kn: 'ಅತ್ಯುತ್ತಮ ಆಯ್ಕೆ',
            hi: 'सर्वोत्तम विकल्प'
        },
        'home.fastest_arrival': {
            en: 'FASTEST ARRIVAL',
            kn: 'ವೇಗವಾಗಿ ತಲುಪುವ ಬಸ್',
            hi: 'सबसे तेज़ आगमन'
        },
        'home.comfort_choice': {
            en: 'MOST SEATS AVAILABLE',
            kn: 'ಹೆಚ್ಚು ಆಸನಗಳು ಲಭ್ಯ',
            hi: 'अधिक सीटें उपलब्ध'
        },
        'home.arrived_at_stop': {
            en: 'You have arrived at ${stop}!',
            kn: 'ನೀವು ${stop} ಗೆ ತಲುಪಿದ್ದೀರಿ!',
            hi: 'आप ${stop} पर पहुँच गए हैं!'
        },
        'home.close_map': {
            en: 'Normal Size',
            kn: 'ಸಾಮಾನ್ಯ ಗಾತ್ರ',
            hi: 'सामान्य आकार'
        },
        'home.change_stop': {
            en: 'Change Stop',
            kn: 'ನಿಲ್ದಾಣ ಬದಲಿಸಿ',
            hi: 'स्टॉप बदलें'
        },
        'home.buses_active': {
            en: '${count} Route 378 buses active',
            kn: '${count} ಮಾರ್ಗ 378 ಬಸ್‌ಗಳು ಸಕ್ರಿಯವಾಗಿವೆ',
            hi: '${count} रूट 378 बसें सक्रिय हैं'
        },
        'home.min_trip_clean': {
            en: '${mins} min trip',
            kn: '${mins} ನಿಮಿಷ ಪ್ರಯಾಣ',
            hi: '${mins} मिनट यात्रा'
        },
        'home.no_matching_stops': {
            en: 'No stops matching "${query}"',
            kn: '"${query}" ಗೆ ಹೊಂದಿಕೆಯಾಗುವ ನಿಲ್ದಾಣಗಳಿಲ್ಲ',
            hi: '"${query}" से मेल खाता कोई स्टॉप नहीं मिला'
        },
        'home.try_searching_hint': {
            en: 'Try searching for stops along Route 378 like "Kengeri", "Hosa Road", "Uttarahalli", "PES", or "Silk Institute".',
            kn: 'ಮಾರ್ಗ 378 ರ ನಿಲ್ದಾಣಗಳನ್ನು ಹುಡುಕಿ: "ಕೆಂಗೇರಿ", "ಹೊಸ ರಸ್ತೆ", "ಉತ್ತರಹಳ್ಳಿ", "ಪಿಇಎಸ್", ಅಥವಾ "ಸಿಲ್ಕ್ ಇನ್ಸ್ಟಿಟ್ಯೂಟ್".',
            hi: 'रूट 378 पर स्टॉप खोजें जैसे "केंगेरी", "होसा रोड", "उत्तराहल्ली", "पीईएस", या "सिल्क इंस्टीट्यूट"।'
        },
        'dest.electronic_city': { en: 'Electronic City', kn: 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ', hi: 'इलेक्ट्रॉनिक सिटी' },
        'dest.kengeri_satellite': { en: 'Kengeri Satellite Town', kn: 'ಕೆಂಗೇರಿ ಸ್ಯಾಟಲೈಟ್ ಟೌನ್', hi: 'केंगेरी सैटेलाइट टाउन' },
        'home.next_stop_waitlist': {
            en: 'Next Stop Waitlist:',
            kn: 'ಮುಂದಿನ ನಿಲ್ದಾಣ ಕಾಯುವ ಪಟ್ಟಿ:',
            hi: 'अगले स्टॉप की प्रतीक्षा सूची:'
        },
        'home.waiting': {
            en: '${count} waiting',
            kn: '${count} ಕಾಯುತ್ತಿದ್ದಾರೆ',
            hi: '${count} प्रतीक्षा में'
        },
        'home.seat_chance': {
            en: 'Next+1: ${pct}% Seat Chance',
            kn: 'ಮುಂದಿನ+1: ${pct}% ಆಸನ ಅವಕಾಶ',
            hi: 'अगला+1: ${pct}% सीट मौका'
        },

        // Route 378 Popular Destination Names
        'dest.kengeri_ttmc': { en: 'Kengeri TTMC', kn: 'ಕೆಂಗೇರಿ TTMC', hi: 'केंगेरी TTMC' },
        'dest.rr_nagar_gate': { en: 'RR Nagar Gate', kn: 'ಆರ್.ಆರ್. ನಗರ ಗೇಟ್', hi: 'आर.आर. नगर गेट' },
        'dest.uttarahalli': { en: 'Uttarahalli', kn: 'ಉತ್ತರಹಳ್ಳಿ', hi: 'उत्तराहल्ली' },
        'dest.konanakunte_cross': { en: 'Konanakunte Cross', kn: 'ಕೋಣನಕುಂಟೆ ಕ್ರಾಸ್', hi: 'कोनानकुंटे क्रॉस' },
        'dest.silk_institute': { en: 'Silk Institute', kn: 'ಸಿಲ್ಕ್ ಇನ್ಸ್ಟಿಟ್ಯೂಟ್', hi: 'सिल्क इंस्टीट्यूट' },
        'dest.gottigere': { en: 'Gottigere (Bannerghatta Rd)', kn: 'ಗೊಟ್ಟಿಗೆರೆ (ಬನ್ನೇರುಘಟ್ಟ ರಸ್ತೆ)', hi: 'गोट्टीगेरे (बन्नेरघट्टा रोड)' },
        'dest.hosa_road': { en: 'Hosa Road', kn: 'ಹೊಸ ರಸ್ತೆ', hi: 'होसा रोड' },
        'dest.electronic_city': { en: 'Electronic City', kn: 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ', hi: 'इलेक्ट्रॉनिक सिटी' },
        'dest.kengeri_satellite': { en: 'Kengeri Satellite Town', kn: 'ಕೆಂಗೇರಿ ಸ್ಯಾಟಲೈಟ್ ಟೌನ್', hi: 'केंगेरी सैटेलाइट टाउन' },

        // Crowd Levels
        'crowd.plenty_seats': {
            en: '🟢 Plenty of Seats',
            kn: '🟢 ಸಾಕಷ್ಟು ಆಸನಗಳು',
            hi: '🟢 काफ़ी सीटें'
        },
        'crowd.standing_room': {
            en: '🟡 Standing Room',
            kn: '🟡 ನಿಲ್ಲುವ ಜಾಗ',
            hi: '🟡 खड़े होने की जगह'
        },
        'crowd.very_crowded': {
            en: '🔴 Very Crowded',
            kn: '🔴 ತುಂಬಾ ಜನಸಂದಣಿ',
            hi: '🔴 बहुत भीड़'
        },
        'crowd.low': { en: 'Low Crowd', kn: 'ಕಡಿಮೆ ಜನಸಂದಣಿ', hi: 'कम भीड़' },
        'crowd.medium': { en: 'Med Crowd', kn: 'ಮಧ್ಯಮ ಜನಸಂದಣಿ', hi: 'मध्यम भीड़' },
        'crowd.high': { en: 'High Crowd', kn: 'ಅಧಿಕ ಜನಸಂದಣಿ', hi: 'अधिक भीड़' },
        'home.low_crowd': { en: 'Low Crowd', kn: 'ಕಡಿಮೆ ಜನಸಂದಣಿ', hi: 'कम भीड़' },
        'home.med_crowd': { en: 'Med Crowd', kn: 'ಮಧ್ಯಮ ಜನಸಂದಣಿ', hi: 'मध्यम भीड़' },
        'home.high_crowd': { en: 'High Crowd', kn: 'ಅಧಿಕ ಜನಸಂದಣಿ', hi: 'अधिक भीड़' },
        'low_crowd': { en: 'Low Crowd', kn: 'ಕಡಿಮೆ ಜನಸಂದಣಿ', hi: 'कम भीड़' },
        'med_crowd': { en: 'Med Crowd', kn: 'ಮಧ್ಯಮ ಜನಸಂದಣಿ', hi: 'मध्यम भीड़' },
        'high_crowd': { en: 'High Crowd', kn: 'ಅಧಿಕ ಜನಸಂದಣಿ', hi: 'अधिक भीड़' },

        // ============================
        // AUTH VIEW
        // ============================
        'auth.sign_in': { en: 'Sign In', kn: 'ಸೈನ್ ಇನ್', hi: 'साइन इन' },
        'auth.register': { en: 'Register', kn: 'ನೋಂದಣಿ', hi: 'रजिस्टर' },
        'auth.email': { en: 'Email Address', kn: 'ಇಮೇಲ್ ವಿಳಾಸ', hi: 'ईमेल पता' },
        'auth.password': { en: 'Password', kn: 'ಪಾಸ್‌ವರ್ಡ್', hi: 'पासवर्ड' },
        'auth.full_name': { en: 'Full Name', kn: 'ಪೂರ್ಣ ಹೆಸರು', hi: 'पूरा नाम' },
        'auth.sign_in_btn': {
            en: 'Sign In to Bengaluru Transit',
            kn: 'ಬೆಂಗಳೂರು ಟ್ರಾನ್ಸಿಟ್‌ಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ',
            hi: 'बेंगलुरु ट्रांज़िट में साइन इन करें'
        },
        'auth.create_account': {
            en: 'Create Commuter Account',
            kn: 'ಪ್ರಯಾಣಿಕ ಖಾತೆ ರಚಿಸಿ',
            hi: 'यात्री खाता बनाएं'
        },
        'auth.quick_access': { en: 'Quick Access', kn: 'ತ್ವರಿತ ಪ್ರವೇಶ', hi: 'त्वरित पहुँच' },
        'auth.quick_demo': {
            en: 'Quick Demo Login (Karthik R.)',
            kn: 'ತ್ವರಿತ ಡೆಮೊ ಲಾಗಿನ್ (ಕಾರ್ತಿಕ್ ಆರ್.)',
            hi: 'त्वरित डेमो लॉगिन (कार्तिक आर.)'
        },
        'auth.signing_in': { en: 'Signing in...', kn: 'ಸೈನ್ ಇನ್ ಆಗುತ್ತಿದೆ...', hi: 'साइन इन हो रहा है...' },
        'auth.registering': { en: 'Registering...', kn: 'ನೋಂದಣಿ ಆಗುತ್ತಿದೆ...', hi: 'पंजीकरण हो रहा है...' },

        // ============================
        // TRIPS VIEW
        // ============================
        'trips.select_bus': {
            en: 'Select Active Bus',
            kn: 'ಸಕ್ರಿಯ ಬಸ್ ಆಯ್ಕೆ ಮಾಡಿ',
            hi: 'सक्रिय बस चुनें'
        },
        'trips.live_gps': {
            en: 'Live GPS tracking & Next-Stop Waitlist Intelligence',
            kn: 'ಲೈವ್ GPS ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ಮುಂದಿನ-ನಿಲ್ದಾಣ ಕಾಯುವ ಪಟ್ಟಿ',
            hi: 'लाइव GPS ट्रैकिंग और अगले-स्टॉप प्रतीक्षा सूची'
        },
        'trips.refresh': { en: 'Refresh', kn: 'ರಿಫ್ರೆಶ್', hi: 'रीफ़्रेश' },
        'trips.on_time': { en: 'On Time', kn: 'ಸಮಯಕ್ಕೆ ಸರಿ', hi: 'समय पर' },
        'trips.delay': {
            en: '+${mins}m delay',
            kn: '+${mins}ನಿ ವಿಳಂಬ',
            hi: '+${mins}मि विलंब'
        },
        'trips.onboard': {
            en: '${count}/${total} onboard',
            kn: '${count}/${total} ಒಳಗೆ',
            hi: '${count}/${total} सवार'
        },
        'trips.tracking_route': {
            en: 'Tracking Route ${num}',
            kn: 'ಮಾರ್ಗ ${num} ಟ್ರ್ಯಾಕ್ ಮಾಡಲಾಗುತ್ತಿದೆ',
            hi: 'मार्ग ${num} ट्रैक हो रहा है'
        },
        'trips.outbound': { en: 'Outbound Route', kn: 'ಹೊರಹೋಗುವ ಮಾರ್ಗ', hi: 'बाहर जाने का मार्ग' },
        'trips.inbound': { en: 'Inbound Route', kn: 'ಒಳಬರುವ ಮಾರ್ಗ', hi: 'अंदर आने का मार्ग' },
        'trips.connecting': {
            en: 'Connecting live telemetry...',
            kn: 'ಲೈವ್ ಟೆಲಿಮೆಟ್ರಿ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...',
            hi: 'लाइव टेलीमेट्री कनेक्ट हो रही है...'
        },
        'trips.retrieving': {
            en: 'Retrieving real-time bus & waitlist telemetry...',
            kn: 'ನೈಜ-ಸಮಯ ಬಸ್ ಮತ್ತು ಕಾಯುವ ಪಟ್ಟಿ ಮಾಹಿತಿ ಪಡೆಯಲಾಗುತ್ತಿದೆ...',
            hi: 'रीयल-टाइम बस और प्रतीक्षा सूची डेटा प्राप्त हो रहा है...'
        },
        'trips.unable_load': {
            en: 'Unable to load active trips',
            kn: 'ಸಕ್ರಿಯ ಪ್ರಯಾಣಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ',
            hi: 'सक्रिय यात्राएं लोड करने में असमर्थ'
        },
        'trips.next': { en: 'Next:', kn: 'ಮುಂದಿನ:', hi: 'अगला:' },
        'trips.next_stop_arrival': { en: 'Next Stop Arrival', kn: 'ಮುಂದಿನ ನಿಲ್ದಾಣ ಆಗಮನ', hi: 'अगले स्टॉप आगमन' },
        'trips.bus_crowd': { en: 'BUS CROWD:', kn: 'ಬಸ್ ಜನಸಂದಣಿ:', hi: 'बस भीड़:' },
        'trips.bus_passengers': { en: 'Bus Passengers:', kn: 'ಬಸ್ ಪ್ರಯಾಣಿಕರು:', hi: 'बस यात्री:' },
        'trips.you_are_waiting': { en: 'You are on the Waiting List', kn: 'ನೀವು ಕಾಯುವ ಪಟ್ಟಿಯಲ್ಲಿದ್ದೀರಿ', hi: 'आप प्रतीक्षा सूची में हैं' },
        'trips.leave_queue': { en: 'Leave Queue', kn: 'ಸರದಿ ಬಿಡಿ', hi: 'कतार छोड़ें' },
        'trips.live_crowd_breakdown': { en: 'LIVE CROWD INTELLIGENCE BREAKDOWN', kn: 'ಲೈವ್ ಜನಸಂದಣಿ ಬುದ್ಧಿಮತ್ತೆ ವಿವರ', hi: 'लाइव भीड़ बुद्धिमत्ता विवरण' },
        'trips.join_stop_queue': { en: 'Join Stop Queue', kn: 'ನಿಲ್ದಾಣ ಸರದಿ ಸೇರಿ', hi: 'स्टॉप कतार में शामिल हों' },
        'trips.people_in_bus': { en: '1. People In The Bus', kn: '1. ಬಸ್‌ನಲ್ಲಿರುವ ಜನರು', hi: '1. बस में लोग' },
        'trips.onboard_label': { en: 'On-Board', kn: 'ಒಳಗೆ', hi: 'सवार' },
        'trips.people_waiting_stop': { en: '2. People Waiting At Stop', kn: '2. ನಿಲ್ದಾಣದಲ್ಲಿ ಕಾಯುತ್ತಿರುವ ಜನರು', hi: '2. स्टॉप पर प्रतीक्षा कर रहे लोग' },
        'trips.route_stops_progress': { en: 'Route Stops & Live Progress', kn: 'ಮಾರ್ಗ ನಿಲ್ದಾಣಗಳು ಮತ್ತು ಲೈವ್ ಪ್ರಗತಿ', hi: 'रूट स्टॉप्स और लाइव प्रगति' },
        'trips.deboard_alarm': { en: 'Deboard Alarm', kn: 'ಇಳಿಯುವ ಎಚ್ಚರಿಕೆ', hi: 'उतरने का अलार्म' },
        'trips.choose_stop': { en: '-- Choose Stop --', kn: '-- ನಿಲ್ದಾಣ ಆಯ್ಕೆಮಾಡಿ --', hi: '-- स्टॉप चुनें --' },
        'trips.im_boarding': { en: "I'm Boarding", kn: 'ನಾನು ಹತ್ತುತ್ತಿದ್ದೇನೆ', hi: 'मैं चढ़ रहा हूँ' },
        'trips.boarded': { en: 'Boarded ✓', kn: 'ಹತ್ತಲಾಗಿದೆ ✓', hi: 'चढ़ गए ✓' },
        'trips.at_stop': { en: 'AT STOP', kn: 'ನಿಲ್ದಾಣದಲ್ಲಿದೆ', hi: 'स्टॉप पर' },
        'trips.waiting': {
            en: '${count} waiting',
            kn: '${count} ಕಾಯುತ್ತಿದ್ದಾರೆ',
            hi: '${count} प्रतीक्षा में'
        },
        'trips.seat_chance': {
            en: 'Next+1: ${pct}% seat chance',
            kn: 'ಮುಂದಿನ+1: ${pct}% ಆಸನ ಅವಕಾಶ',
            hi: 'अगला+1: ${pct}% सीट मौका'
        },

        // ============================
        // GAMIFICATION VIEW
        // ============================
        'ranks.title': {
            en: 'Commuter Ranks',
            kn: 'ಪ್ರಯಾಣಿಕ ಶ್ರೇಣಿಗಳು',
            hi: 'यात्री रैंक'
        },
        'ranks.loading': {
            en: 'Loading commuter metrics and local rank...',
            kn: 'ಪ್ರಯಾಣಿಕ ಮೆಟ್ರಿಕ್ಸ್ ಮತ್ತು ಸ್ಥಳೀಯ ಶ್ರೇಣಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
            hi: 'यात्री मेट्रिक्स और स्थानीय रैंक लोड हो रही है...'
        },
        'ranks.total_points': { en: 'Total Points', kn: 'ಒಟ್ಟು ಅಂಕಗಳು', hi: 'कुल अंक' },
        'ranks.pts': { en: 'pts', kn: 'ಅಂಕ', hi: 'अंक' },
        'ranks.to_next_tier': {
            en: '${pts} to Next Tier',
            kn: 'ಮುಂದಿನ ಹಂತಕ್ಕೆ ${pts}',
            hi: 'अगले स्तर तक ${pts}'
        },
        'ranks.top_tier': { en: 'Top Tier Commuter', kn: 'ಅಗ್ರ ಶ್ರೇಣಿ ಪ್ರಯಾಣಿಕ', hi: 'शीर्ष स्तर यात्री' },
        'ranks.day_streak': {
            en: '${days} Day Streak',
            kn: '${days} ದಿನ ಸ್ಟ್ರೀಕ್',
            hi: '${days} दिन की स्ट्रीक'
        },
        'ranks.keep_reporting': {
            en: 'Keep reporting to earn 2x multiplier!',
            kn: '2x ಗುಣಕ ಪಡೆಯಲು ರಿಪೋರ್ಟ್ ಮಾಡುತ್ತಿರಿ!',
            hi: '2x गुणक पाने के लिए रिपोर्ट करते रहें!'
        },
        'ranks.your_badges': { en: 'Your Badges', kn: 'ನಿಮ್ಮ ಬ್ಯಾಡ್ಜ್‌ಗಳು', hi: 'आपके बैज' },
        'ranks.early_bird': { en: 'Early Bird', kn: 'ಮುಂಜಾನೆ ಪಕ್ಷಿ', hi: 'सुबह की चिड़िया' },
        'ranks.crowd_watcher': { en: 'Crowd Watcher', kn: 'ಜನಸಮೂಹ ವೀಕ್ಷಕ', hi: 'भीड़ निरीक्षक' },
        'ranks.verified_hero': { en: 'Verified Hero', kn: 'ಪರಿಶೀಲಿತ ಹೀರೋ', hi: 'सत्यापित हीरो' },
        'ranks.local_rank': { en: 'Local Rank', kn: 'ಸ್ಥಳೀಯ ಶ್ರೇಣಿ', hi: 'स्थानीय रैंक' },
        'ranks.ends_in': { en: 'Ends in 2d', kn: '2ದಿ ನಲ್ಲಿ ಮುಕ್ತಾಯ', hi: '2 दिन में समाप्ति' },
        'ranks.recent_contributions': { en: 'Recent Contributions', kn: 'ಇತ್ತೀಚಿನ ಕೊಡುಗೆಗಳು', hi: 'हाल के योगदान' },
        'ranks.reported_delay': {
            en: 'Reported Delay on Route 378',
            kn: 'ಮಾರ್ಗ 378 ರಲ್ಲಿ ವಿಳಂಬ ವರದಿ',
            hi: 'मार्ग 378 पर विलंब रिपोर्ट'
        },
        'ranks.updated_crowd': {
            en: 'Updated Bus Crowd Level',
            kn: 'ಬಸ್ ಜನಸಂದಣಿ ಮಟ್ಟ ನವೀಕರಿಸಲಾಗಿದೆ',
            hi: 'बस भीड़ स्तर अपडेट किया'
        },
        'ranks.verified_stop': {
            en: 'Verified Stop Location',
            kn: 'ನಿಲ್ದಾಣ ಸ್ಥಳ ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
            hi: 'स्टॉप स्थान सत्यापित किया'
        },
        'ranks.hours_ago': { en: '2 hours ago', kn: '2 ಗಂಟೆಗಳ ಹಿಂದೆ', hi: '2 घंटे पहले' },
        'ranks.yesterday': { en: 'Yesterday', kn: 'ನಿನ್ನೆ', hi: 'कल' },
        'ranks.days_ago': { en: '2 days ago', kn: '2 ದಿನಗಳ ಹಿಂದೆ', hi: '2 दिन पहले' },
        'ranks.sign_in_prompt': {
            en: 'Sign in to track points, unlock badges and climb the leaderboards.',
            kn: 'ಅಂಕಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು, ಬ್ಯಾಡ್ಜ್‌ಗಳನ್ನು ಅನ್‌ಲಾಕ್ ಮಾಡಲು ಸೈನ್ ಇನ್ ಮಾಡಿ.',
            hi: 'अंक ट्रैक करने, बैज अनलॉक करने के लिए साइन इन करें।'
        },
        'ranks.sign_in_now': { en: 'Sign In Now', kn: 'ಈಗ ಸೈನ್ ಇನ್ ಮಾಡಿ', hi: 'अभी साइन इन करें' },
        'ranks.join_network': {
            en: 'Join the Lumina Commuter Network',
            kn: 'ಲುಮಿನಾ ಪ್ರಯಾಣಿಕ ನೆಟ್‌ವರ್ಕ್ ಸೇರಿ',
            hi: 'लुमिना यात्री नेटवर्क से जुड़ें'
        },
        'ranks.join_desc': {
            en: 'Earn points, unlock transit badges, and climb the local leaderboards by verifying live bus crowd conditions.',
            kn: 'ಲೈವ್ ಬಸ್ ಜನಸಂದಣಿ ಪರಿಶೀಲಿಸುವ ಮೂಲಕ ಅಂಕಗಳನ್ನು ಗಳಿಸಿ, ಬ್ಯಾಡ್ಜ್‌ಗಳನ್ನು ಅನ್‌ಲಾಕ್ ಮಾಡಿ.',
            hi: 'लाइव बस भीड़ सत्यापित करके अंक कमाएं, बैज अनलॉक करें।'
        },
        'ranks.sign_in_register': { en: 'Sign In / Register', kn: 'ಸೈನ್ ಇನ್ / ನೋಂದಣಿ', hi: 'साइन इन / रजिस्टर' },
        'ranks.top_contributors': { en: 'Top Community Contributors', kn: 'ಅಗ್ರ ಸಮುದಾಯ ಕೊಡುಗೆದಾರರು', hi: 'शीर्ष समुदाय योगदानकर्ता' },
        'ranks.live_standings': { en: 'Live Standings', kn: 'ಲೈವ್ ಸ್ಥಾನಗಳು', hi: 'लाइव स्थिति' },

        // ============================
        // COMPLAINTS VIEW
        // ============================
        'report.title': {
            en: 'Report an Incident',
            kn: 'ಘಟನೆಯನ್ನು ವರದಿ ಮಾಡಿ',
            hi: 'घटना की रिपोर्ट करें'
        },
        'report.subtitle': {
            en: 'Continuous crowd feedback & evidence verification',
            kn: 'ನಿರಂತರ ಜನಸಮೂಹ ಪ್ರತಿಕ್ರಿಯೆ ಮತ್ತು ಪುರಾವೆ ಪರಿಶೀಲನೆ',
            hi: 'निरंतर भीड़ प्रतिक्रिया और साक्ष्य सत्यापन'
        },
        'report.earn_points': {
            en: 'Earn +15 Points for Valid Reports',
            kn: 'ಮಾನ್ಯ ವರದಿಗಳಿಗೆ +15 ಅಂಕಗಳನ್ನು ಗಳಿಸಿ',
            hi: 'वैध रिपोर्ट के लिए +15 अंक कमाएं'
        },
        'report.include_photo': {
            en: 'Include photo evidence to expedite transit authority investigations.',
            kn: 'ಟ್ರಾನ್ಸಿಟ್ ತನಿಖೆಗಳನ್ನು ತ್ವರಿತಗೊಳಿಸಲು ಫೋಟೋ ಪುರಾವೆಗಳನ್ನು ಸೇರಿಸಿ.',
            hi: 'जांच में तेजी लाने के लिए फोटो साक्ष्य शामिल करें।'
        },
        'report.step1': {
            en: '1. Select Incident Category',
            kn: '1. ಘಟನೆ ವರ್ಗವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ',
            hi: '1. घटना श्रेणी चुनें'
        },
        'report.step2': {
            en: '2. Incident Description',
            kn: '2. ಘಟನೆ ವಿವರಣೆ',
            hi: '2. घटना विवरण'
        },
        'report.step3': {
            en: '3. Severity Level',
            kn: '3. ತೀವ್ರತೆ ಮಟ್ಟ',
            hi: '3. गंभीरता स्तर'
        },
        'report.step4': {
            en: '4. Evidence (Camera)',
            kn: '4. ಪುರಾವೆ (ಕ್ಯಾಮೆರಾ)',
            hi: '4. साक्ष्य (कैमरा)'
        },
        'report.describe': {
            en: 'Describe what happened (e.g. Bus #WP-ND-4521 dangerously packed with open doors at Bambalapitiya)',
            kn: 'ಏನಾಯಿತು ಎಂದು ವಿವರಿಸಿ (ಉದಾ. ಬಸ್ ಅಪಾಯಕಾರಿಯಾಗಿ ತುಂಬಿತ್ತು)',
            hi: 'क्या हुआ वर्णन करें (जैसे बस खतरनाक रूप से भरी हुई थी)'
        },
        // Severity
        'severity.low': { en: 'Low - Minor Inconvenience', kn: 'ಕಡಿಮೆ - ಸಣ್ಣ ಅಸೌಕರ್ಯ', hi: 'कम - मामूली असुविधा' },
        'severity.medium': { en: 'Medium - Significant Discomfort', kn: 'ಮಧ್ಯಮ - ಗಮನಾರ್ಹ ಅಸೌಕರ್ಯ', hi: 'मध्यम - महत्वपूर्ण असुविधा' },
        'severity.high': { en: 'High - Dangerous Overcrowding', kn: 'ಅಧಿಕ - ಅಪಾಯಕಾರಿ ಜನಸಂದಣಿ', hi: 'उच्च - खतरनाक भीड़' },
        'severity.critical': { en: 'Critical - Immediate Safety Risk', kn: 'ತುರ್ತು - ತಕ್ಷಣ ಸುರಕ್ಷತೆ ಅಪಾಯ', hi: 'गंभीर - तत्काल सुरक्षा जोखिम' },
        // Categories
        'cat.overcrowding': { en: 'Overcrowding', kn: 'ಅಧಿಕ ಜನಸಂದಣಿ', hi: 'अत्यधिक भीड़' },
        'cat.delay': { en: 'Severe Delay', kn: 'ತೀವ್ರ ವಿಳಂಬ', hi: 'गंभीर विलंब' },
        'cat.safety': { en: 'Safety Hazard', kn: 'ಸುರಕ್ಷತೆ ಅಪಾಯ', hi: 'सुरक्षा खतरा' },
        'cat.cleanliness': { en: 'Cleanliness', kn: 'ಸ್ವಚ್ಛತೆ', hi: 'स्वच्छता' },
        'cat.driver_behavior': { en: 'Driver Issue', kn: 'ಚಾಲಕ ಸಮಸ್ಯೆ', hi: 'चालक समस्या' },
        'cat.other': { en: 'Other Issue', kn: 'ಇತರ ಸಮಸ್ಯೆ', hi: 'अन्य समस्या' },

        'report.snap_photo': { en: 'Snap Photo', kn: 'ಫೋಟೋ ತೆಗೆಯಿರಿ', hi: 'फोटो लें' },
        'report.open_camera': { en: 'Open Camera', kn: 'ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ', hi: 'कैमरा खोलें' },
        'report.upload_photo': { en: 'Upload Photo', kn: 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ', hi: 'फोटो अपलोड करें' },
        'report.submit': {
            en: 'Submit Report (+15 Pts)',
            kn: 'ವರದಿ ಸಲ್ಲಿಸಿ (+15 ಅಂಕ)',
            hi: 'रिपोर्ट जमा करें (+15 अंक)'
        },
        'report.submitting': { en: 'Submitting...', kn: 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...', hi: 'जमा हो रही है...' },
        'report.history': {
            en: 'My Incident History',
            kn: 'ನನ್ನ ಘಟನೆ ಇತಿಹಾಸ',
            hi: 'मेरा घटना इतिहास'
        },
        'report.loading_history': {
            en: 'Loading past reports...',
            kn: 'ಹಿಂದಿನ ವರದಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
            hi: 'पिछली रिपोर्ट लोड हो रही हैं...'
        },
        'report.no_reports': {
            en: 'No incidents reported yet.',
            kn: 'ಇನ್ನೂ ಯಾವುದೇ ಘಟನೆ ವರದಿ ಆಗಿಲ್ಲ.',
            hi: 'अभी तक कोई घटना रिपोर्ट नहीं हुई।'
        },
        'report.sign_in_history': {
            en: 'Sign in to view your submission history.',
            kn: 'ನಿಮ್ಮ ಸಲ್ಲಿಕೆ ಇತಿಹಾಸ ನೋಡಲು ಸೈನ್ ಇನ್ ಮಾಡಿ.',
            hi: 'अपना सबमिशन इतिहास देखने के लिए साइन इन करें।'
        },

        // ============================
        // PROFILE VIEW
        // ============================
        'profile.loading': {
            en: 'Loading passenger profile...',
            kn: 'ಪ್ರಯಾಣಿಕ ಪ್ರೊಫೈಲ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
            hi: 'यात्री प्रोफ़ाइल लोड हो रही है...'
        },
        'profile.guest': { en: 'Guest Commuter', kn: 'ಅತಿಥಿ ಪ್ರಯಾಣಿಕ', hi: 'अतिथि यात्री' },
        'profile.guest_desc': {
            en: 'Sign in to access personalized journey telemetry, real-time proactive alerts, and badge achievements.',
            kn: 'ವೈಯಕ್ತಿಕ ಪ್ರಯಾಣ ಟೆಲಿಮೆಟ್ರಿ ಮತ್ತು ನೈಜ-ಸಮಯ ಎಚ್ಚರಿಕೆಗಳಿಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.',
            hi: 'व्यक्तिगत यात्रा टेलीमेट्री और रीयल-टाइम अलर्ट के लिए साइन इन करें।'
        },
        'profile.sign_in_create': {
            en: 'Sign In / Create Account',
            kn: 'ಸೈನ್ ಇನ್ / ಖಾತೆ ರಚಿಸಿ',
            hi: 'साइन इन / खाता बनाएं'
        },
        'profile.notifications': {
            en: 'Notifications & Proactive Alerts',
            kn: 'ಅಧಿಸೂಚನೆಗಳು ಮತ್ತು ಎಚ್ಚರಿಕೆಗಳು',
            hi: 'सूचनाएं और सक्रिय अलर्ट'
        },
        'profile.mark_all_read': {
            en: 'Mark All Read',
            kn: 'ಎಲ್ಲವನ್ನೂ ಓದಿದೆ ಎಂದು ಗುರುತಿಸಿ',
            hi: 'सभी पढ़ा हुआ चिह्नित करें'
        },
        'profile.no_notifications': {
            en: 'No notifications at the moment.',
            kn: 'ಈ ಸಮಯದಲ್ಲಿ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ.',
            hi: 'इस समय कोई सूचना नहीं है।'
        },
        'profile.theme': {
            en: 'Map & UI Theme Mode',
            kn: 'ಮ್ಯಾಪ್ ಮತ್ತು UI ಥೀಮ್ ಮೋಡ್',
            hi: 'मैप और UI थीम मोड'
        },
        'profile.light_mode': { en: 'Google Maps', kn: 'ಗೂಗಲ್ ಮ್ಯಾಪ್', hi: 'गूगल मैप' },
        'profile.light_desc': { en: 'Clean Light Mode', kn: 'ಶುಭ್ರ ಲೈಟ್ ಮೋಡ್', hi: 'साफ़ लाइट मोड' },
        'profile.dark_mode': { en: 'Lumina Dark', kn: 'ಲುಮಿನಾ ಡಾರ್ಕ್', hi: 'लुमिना डार्क' },
        'profile.dark_desc': { en: 'High-Contrast HUD', kn: 'ಹೈ-ಕಾಂಟ್ರಾಸ್ಟ್ HUD', hi: 'हाई-कंट्रास्ट HUD' },
        'profile.theme_light_label': { en: 'Google Maps Light', kn: 'ಗೂಗಲ್ ಮ್ಯಾಪ್ ಲೈಟ್', hi: 'गूगल मैप लाइट' },
        'profile.theme_dark_label': { en: 'Lumina Dark HUD', kn: 'ಲುಮಿನಾ ಡಾರ್ಕ್ HUD', hi: 'लुमिना डार्क HUD' },
        'profile.account_settings': { en: 'Account Settings', kn: 'ಖಾತೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳು', hi: 'खाता सेटिंग्स' },
        'profile.privacy_note': {
            en: 'SMART TRANSIT operates privacy-preserving, verified GPS passenger feedback.',
            kn: 'ಸ್ಮಾರ್ಟ್ ಟ್ರಾನ್ಸಿಟ್ ಗೌಪ್ಯತೆ-ಸಂರಕ್ಷಿತ, ಪರಿಶೀಲಿತ GPS ಪ್ರಯಾಣಿಕ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ನಡೆಸುತ್ತದೆ.',
            hi: 'स्मार्ट ट्रांजिट गोपनीयता-संरक्षित, सत्यापित GPS यात्री फीडबैक संचालित करता है।'
        },
        'profile.sign_out': { en: 'Sign Out', kn: 'ಸೈನ್ ಔಟ್', hi: 'साइन आउट' },

        // Language Settings
        'profile.language': { en: 'Language', kn: 'ಭಾಷೆ', hi: 'भाषा' },
        'profile.language_desc': {
            en: 'Choose your preferred language for the app interface.',
            kn: 'ಅಪ್ಲಿಕೇಶನ್ ಇಂಟರ್ಫೇಸ್‌ಗಾಗಿ ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.',
            hi: 'ऐप इंटरफ़ेस के लिए अपनी पसंदीदा भाषा चुनें।'
        },

        // ============================
        // TOAST / NOTIFICATIONS
        // ============================
        'toast.welcome_back': { en: 'Welcome back!', kn: 'ಮತ್ತೆ ಸ್ವಾಗತ!', hi: 'वापसी का स्वागत!' },
        'toast.signed_in': {
            en: 'Signed into SMART TRANSIT Bengaluru',
            kn: 'ಸ್ಮಾರ್ಟ್ ಟ್ರಾನ್ಸಿಟ್ ಬೆಂಗಳೂರಿಗೆ ಸೈನ್ ಇನ್ ಆಗಿದೆ',
            hi: 'स्मार्ट ट्रांजिट बेंगलुरु में साइन इन किया'
        },
        'toast.account_created': { en: 'Account Created!', kn: 'ಖಾತೆ ರಚಿಸಲಾಗಿದೆ!', hi: 'खाता बनाया गया!' },
        'toast.welcome_pts': {
            en: 'Welcome! Earn 50 starter points.',
            kn: 'ಸ್ವಾಗತ! 50 ಆರಂಭಿಕ ಅಂಕಗಳನ್ನು ಗಳಿಸಿ.',
            hi: 'स्वागत! 50 शुरुआती अंक कमाएं।'
        },
        'toast.signed_out': { en: 'Signed Out', kn: 'ಸೈನ್ ಔಟ್ ಆಗಿದೆ', hi: 'साइन आउट हो गया' },
        'toast.signed_out_msg': {
            en: 'You have been signed out of SMART TRANSIT Bengaluru.',
            kn: 'ನೀವು ಸ್ಮಾರ್ಟ್ ಟ್ರಾನ್ಸಿಟ್ ಬೆಂಗಳೂರಿನಿಂದ ಸೈನ್ ಔಟ್ ಆಗಿದ್ದೀರಿ.',
            hi: 'आपको स्मार्ट ट्रांजिट बेंगलुरु से साइन आउट कर दिया गया है।'
        },
        'toast.report_submitted': {
            en: 'Report Submitted!',
            kn: 'ವರದಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!',
            hi: 'रिपोर्ट जमा हो गई!'
        },
        'toast.report_msg': {
            en: 'Earned +15 Points. Transit operators notified for investigation.',
            kn: '+15 ಅಂಕಗಳನ್ನು ಗಳಿಸಲಾಗಿದೆ. ತನಿಖೆಗಾಗಿ ನಿರ್ವಾಹಕರಿಗೆ ತಿಳಿಸಲಾಗಿದೆ.',
            hi: '+15 अंक कमाए। जांच के लिए परिवहन ऑपरेटरों को सूचित किया।'
        },
        'toast.desc_required': {
            en: 'Description Required',
            kn: 'ವಿವರಣೆ ಅವಶ್ಯಕ',
            hi: 'विवरण आवश्यक'
        },
        // User Levels & Badges
        'level.contributor': { en: 'Level 4: Contributor', kn: 'ಹಂತ 4: ಕೊಡುಗೆದಾರ', hi: 'स्तर 4: योगदानकर्ता' },
        'level.novice': { en: 'Level 1: Novice', kn: 'ಹಂತ 1: ಅನನುಭವಿ', hi: 'स्तर 1: नौसिखिया' },
        'level.commuter': { en: 'Level 2: Commuter', kn: 'ಹಂತ 2: ಪ್ರಯಾಣಿಕ', hi: 'स्तर 2: यात्री' },
        'level.explorer': { en: 'Level 3: Explorer', kn: 'ಹಂತ 3: ಅನ್ವೇಷಕ', hi: 'स्तर 3: अन्वेषक' },
        'level.master': { en: 'Level 5: Master', kn: 'ಹಂತ 5: ಮಾಸ್ಟರ್', hi: 'स्तर 5: मास्टर' },

        // Notifications
        'notif.delay_title': { en: 'Delay Alert', kn: 'ವಿಳಂಬ ಎಚ್ಚರಿಕೆ', hi: 'विलंब चेतावनी' },
        'notif.dest_title': { en: 'Destination Approaching', kn: 'ಗಮ್ಯಸ್ಥಾನ ಸಮೀಪಿಸುತ್ತಿದೆ', hi: 'गंतव्य निकट आ रहा है' },
        'notif.points_title': { en: 'Bonus Points', kn: 'ಬೋನಸ್ ಅಂಕಗಳು', hi: 'बोनस अंक' },

        // Popular Destinations & Stops
        'dest.kengeri_ttmc': { en: 'Kengeri TTMC', kn: 'ಕೆಂಗೇರಿ TTMC', hi: 'केंगेरी TTMC' },
        'dest.konanakunte_cross': { en: 'Konanakunte Cross', kn: 'ಕೋಣನಕುಂಟೆ ಕ್ರಾಸ್', hi: 'कोणनकुंटे क्रॉस' },
        'dest.banashankari_ttmc': { en: 'Banashankari TTMC', kn: 'ಬನಶಂಕರಿ TTMC', hi: 'बनशंकरी TTMC' },
        'dest.rr_nagar_gate': { en: 'RR Nagar Gate', kn: 'ಆರ್.ಆರ್ ನಗರ ಗೇಟ್', hi: 'आरआर नगर गेट' },
        'dest.silk_institute': { en: 'Silk Institute', kn: 'ಸಿಲ್ಕ್ ಇನ್‌ಸ್ಟಿಟ್ಯೂಟ್', hi: 'सिल्क इंस्टीट्यूट' },
        'dest.kengeri_satellite': { en: 'Kengeri Satellite Town', kn: 'ಕೆಂಗೇರಿ ಸ್ಯಾಟಲೈಟ್ ಟೌನ್', hi: 'केंगेरी सैटेलाइट टाउन' },

        'toast.desc_required_msg': {
            en: 'Please describe the incident',
            kn: 'ದಯವಿಟ್ಟು ಘಟನೆಯನ್ನು ವಿವರಿಸಿ',
            hi: 'कृपया घटना का वर्णन करें'
        },
        'toast.all_read': {
            en: 'All notifications marked as read',
            kn: 'ಎಲ್ಲಾ ಅಧಿಸೂಚನೆಗಳನ್ನು ಓದಿದೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ',
            hi: 'सभी सूचनाएं पढ़ा हुआ चिह्नित की गईं'
        },
        'toast.lang_changed': {
            en: 'Language changed',
            kn: 'ಭಾಷೆ ಬದಲಾಯಿಸಲಾಗಿದೆ',
            hi: 'भाषा बदल दी गई'
        },
        'toast.lang_selected': {
            en: 'English selected',
            kn: 'ಕನ್ನಡ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ',
            hi: 'हिन्दी भाषा का चयन किया गया'
        }
    },

    init() {
        const saved = localStorage.getItem('lumina_lang');
        if (saved && (saved === 'en' || saved === 'kn' || saved === 'hi')) {
            this.currentLang = saved;
        }
    },

    /**
     * Get translated string for key
     * @param {string} key - Translation key
     * @param {object} vars - Optional variables to interpolate (e.g. { mins: 5 })
     * @returns {string}
     */
    t(key, vars = {}) {
        const entry = this.translations[key];
        if (!entry) return key;

        let text = entry[this.currentLang] || entry['en'] || key;

        // Interpolate ${var} placeholders
        Object.entries(vars).forEach(([k, v]) => {
            text = text.replace(new RegExp('\\$\\{' + k + '\\}', 'g'), v);
        });

        return text;
    },

    /**
     * Translate dynamic text (e.g., from DB or API payload)
     */
    translateDynamic(text) {
        if (!text || typeof text !== 'string') return text;
        if (this.currentLang === 'en') return text;

        const dynamicDict = {
            'Delay Alert': { kn: 'ವಿಳಂಬ ಎಚ್ಚರಿಕೆ', hi: 'विलंब चेतावनी' },
            'Destination Approaching': { kn: 'ಗಮ್ಯಸ್ಥಾನ ಸಮೀಪಿಸುತ್ತಿದೆ', hi: 'गंतव्य निकट आ रहा है' },
            'Points Awarded': { kn: 'ಅಂಕಗಳನ್ನು ನೀಡಲಾಗಿದೆ', hi: 'अंक प्रदान किए गए' },
            'Bonus Points': { kn: 'ಬೋನಸ್ ಅಂಕಗಳು', hi: 'बोनस अंक' },
            'Level 4: Contributor': { kn: 'ಹಂತ 4: ಕೊಡುಗೆದಾರ', hi: 'स्तर 4: योगदानकर्ता' },
            'Level 1: Novice': { kn: 'ಹಂತ 1: ಅನನುಭವಿ', hi: 'स्तर 1: नौसिखिया' },
            'Level 2: Commuter': { kn: 'ಹಂತ 2: ಪ್ರಯಾಣಿಕ', hi: 'स्तर 2: यात्री' },
            'Level 3: Explorer': { kn: 'ಹಂತ 3: ಅನ್ವೇಷಕ', hi: 'स्तर 3: अन्वेषक' },
            'Level 5: Master': { kn: 'ಹಂತ 5: ಮಾಸ್ಟರ್', hi: 'स्तर 5: मास्टर' },
            'Low Crowd': { kn: 'ಕಡಿಮೆ ಜನಸಂದಣಿ', hi: 'कम भीड़' },
            'Med Crowd': { kn: 'ಮಧ್ಯಮ ಜನಸಂದಣಿ', hi: 'मध्यम भीड़' },
            'High Crowd': { kn: 'ಅಧಿಕ ಜನಸಂದಣಿ', hi: 'अधिक भीड़' },
            'On Time': { kn: 'ಸಮಯಕ್ಕೆ ಸರಿ', hi: 'समय पर' },
            'Clean Light Mode': { kn: 'ಶುಭ್ರ ಲೈಟ್ ಮೋಡ್', hi: 'साफ़ लाइट मोड' },
            'High-Contrast HUD': { kn: 'ಹೈ-ಕಾಂಟ್ರಾಸ್ಟ್ HUD', hi: 'हाई-कंट्रास्ट HUD' }
        };

        if (dynamicDict[text] && dynamicDict[text][this.currentLang]) {
            return dynamicDict[text][this.currentLang];
        }

        // Pattern matching for notifications
        if (text.includes('delay') || text.includes('delayed')) {
            if (this.currentLang === 'kn') return text.replace('is delayed by', 'ವಿಳಂಬವಾಗಿದೆ:').replace('mins', 'ನಿಮಿಷ');
            if (this.currentLang === 'hi') return text.replace('is delayed by', 'विलंबित है:').replace('mins', 'मिनट');
        }

        return text;
    },

    stopTranslations: {
        'Bangalore University Gate': { kn: 'ಬೆಂಗಳೂರು ವಿಶ್ವವಿದ್ಯಾಲಯ ಗೇಟ್', hi: 'बैंगलोर विश्वविद्यालय गेट' },
        'Electronic City Toll Gate / Phase 1': { kn: 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ ಟೋಲ್ ಗೇಟ್ / ಹಂತ 1', hi: 'इलेक्ट्रॉनिक सिटी टोल गेट / फेज 1' },
        'Electronic City Toll Gate': { kn: 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ ಟೋಲ್ ಗೇಟ್', hi: 'इलेक्ट्रॉनिक सिटी टोल गेट' },
        'Electronic City Wipro Gate': { kn: 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ ವಿಪ್ರೋ ಗೇಟ್', hi: 'इलेक्ट्रॉनिक सिटी विप्रो गेट' },
        'Electronic City': { kn: 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ', hi: 'इलेक्ट्रॉनिक सिटी' },
        'Gottigere (Bannerghatta Rd)': { kn: 'ಗೊಟ್ಟಿಗೆರೆ (ಬನ್ನೇರುಘಟ್ಟ ರಸ್ತೆ)', hi: 'गोट्टीगेरे (बन्नेरघट्टा रोड)' },
        'Gottigere': { kn: 'ಗೊಟ್ಟಿಗೆರೆ', hi: 'गोट्टीगेरे' },
        'Hosa Road Junction': { kn: 'ಹೊಸ ರಸ್ತೆ ಜಂಕ್ಷನ್', hi: 'होसा रोड जंक्शन' },
        'Hosa Road': { kn: 'ಹೊಸ ರಸ್ತೆ', hi: 'होसा रोड' },
        'Kengeri Satellite Town': { kn: 'ಕೆಂಗೇರಿ ಸ್ಯಾಟಲೈಟ್ ಟೌನ್', hi: 'केंगेरी सैटेलाइट टाउन' },
        'Kengeri TTMC / Bus Terminal': { kn: 'ಕೆಂಗೇರಿ TTMC / ಬಸ್ ನಿಲ್ದಾಣ', hi: 'केंगेरी TTMC / बस टर्मिनल' },
        'Kengeri TTMC': { kn: 'ಕೆಂಗೇರಿ TTMC', hi: 'केंगेरी TTMC' },
        'Kengeri': { kn: 'ಕೆಂಗೇರಿ', hi: 'केंगेरी' },
        'Konanakunte Cross': { kn: 'ಕೋಣನಕುಂಟೆ ಕ್ರಾಸ್', hi: 'कोनानकुंटे क्रॉस' },
        'Konappana Agrahara': { kn: 'ಕೋಣಪ್ಪನ ಅಗ್ರಹಾರ', hi: 'कोनप्पना अग्रहारा' },
        'PES University (Ring Road)': { kn: 'ಪಿಇಎಸ್ ವಿಶ್ವವಿದ್ಯಾಲಯ (ರಿಂಗ್ ರಸ್ತೆ)', hi: 'पीईएस विश्वविद्यालय (रिंग रोड)' },
        'PES University': { kn: 'ಪಿಇಎಸ್ ವಿಶ್ವವಿದ್ಯಾಲಯ', hi: 'पीईएस विश्वविद्यालय' },
        'Rajarajeshwari Nagar Gate': { kn: 'ರಾಜರಾಜೇಶ್ವರಿ ನಗರ ಗೇಟ್', hi: 'राजारामेश्वरी नगर गेट' },
        'RR Nagar Gate': { kn: 'ಆರ್.ಆರ್. ನಗರ ಗೇಟ್', hi: 'आर.ಆರ್. नगर गेट' },
        'Silk Institute (Kanakapura Rd)': { kn: 'ಸಿಲ್ಕ್ ಇನ್ಸ್ಟಿಟ್ಯೂಟ್ (ಕನಕಪುರ ರಸ್ತೆ)', hi: 'सिल्क इंस्टीट्यूट (कनकपुरा रोड)' },
        'Silk Institute': { kn: 'ಸಿಲ್ಕ್ ಇನ್ಸ್ಟಿಟ್ಯೂಟ್', hi: 'सिल्क इंस्टीट्यूट' },
        'Uttarahalli / Channasandra': { kn: 'ಉತ್ತರಹಳ್ಳಿ / ಚನ್ನಸಂದ್ರ', hi: 'उत्तराहल्ली / चन्नसंद्रा' },
        'Uttarahalli': { kn: 'ಉತ್ತರಹಳ್ಳಿ', hi: 'उत्तराहल्ली' },
        'Banashankari Bus Station': { kn: 'ಬನಶಂಕರಿ ಬಸ್ ನಿಲ್ದಾಣ', hi: 'बनशंकरी बस स्टैंड' },
        'Banashankari': { kn: 'ಬನಶಂಕರಿ', hi: 'बनशंकरी' },
        'Jayanagar 4th Block': { kn: 'ಜಯನಗರ 4ನೇ ಬ್ಲಾಕ್', hi: 'जयनगर 4th ब्लॉक' },
        'BTM Layout Water Tank': { kn: 'ಬಿಟಿಎಂ ಲೇಔಟ್ ವಾಟರ್ ಟ್ಯಾಂಕ್', hi: 'बीटीएम लेआउट वाटर टैंक' },
        'Silk Board Junction': { kn: 'ಸಿಲ್ಕ್ ಬೋರ್ಡ್ ಜಂಕ್ಷನ್', hi: 'सिल्क बोर्ड जंक्शन' },
        'Majestic (Kempegowda Bus Station)': { kn: 'ಮೆಜೆಸ್ಟಿಕ್ (ಕೆಂಪೇಗೌಡ ಬಸ್ ನಿಲ್ದಾಣ)', hi: 'मैजेस्टिक (केम्पेगौड़ा बस स्टेशन)' },
        'Kempegowda Bus Station (Majestic)': { kn: 'ಕೆಂಪೇಗೌಡ ಬಸ್ ನಿಲ್ದಾಣ (ಮೆಜೆಸ್ಟಿಕ್)', hi: 'केम्पेगौड़ा बस स्टेशन (मैजेस्टिक)' }
    },

    translateStop(name) {
        if (!name) return '';
        if (this.currentLang === 'en') return name;

        // Exact match
        if (this.stopTranslations[name] && this.stopTranslations[name][this.currentLang]) {
            return this.stopTranslations[name][this.currentLang];
        }

        // Partial match
        for (const [enName, trans] of Object.entries(this.stopTranslations)) {
            if (name.toLowerCase().includes(enName.toLowerCase()) || enName.toLowerCase().includes(name.toLowerCase())) {
                if (trans[this.currentLang]) return trans[this.currentLang];
            }
        }

        return name;
    },

    setLang(langCode) {
        if (langCode === 'en' || langCode === 'kn' || langCode === 'hi') {
            this.currentLang = langCode;
            localStorage.setItem('lumina_lang', langCode);
        }
    },

    getLang() {
        return this.currentLang;
    },

    getLangName() {
        const lang = this.supportedLangs.find(l => l.code === this.currentLang);
        return lang ? lang.native : 'English';
    },

    getLangShort() {
        const map = { en: 'EN', kn: 'ಕನ್ನಡ', hi: 'हिन्दी' };
        return map[this.currentLang] || 'EN';
    },

    nextLang() {
        const order = ['en', 'kn', 'hi'];
        const idx = order.indexOf(this.currentLang);
        const next = order[(idx + 1) % order.length];
        this.setLang(next);
        return next;
    }
};

// Initialize on load
I18n.init();

