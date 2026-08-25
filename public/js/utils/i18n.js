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
            en: 'Lumina Transit',
            kn: 'ಲುಮಿನಾ ಟ್ರಾನ್ಸಿಟ್',
            hi: 'लुमिना ट्रांज़िट'
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
        'home.available_buses_to': {
            en: 'Available BMTC Buses to ${dest}',
            kn: '${dest} ಗೆ ಲಭ್ಯವಿರುವ BMTC ಬಸ್‌ಗಳು',
            hi: '${dest} के लिए उपलब्ध BMTC बसें'
        },
        'home.routes_found': {
            en: '${count} routes found',
            kn: '${count} ಮಾರ್ಗಗಳು ಕಂಡುಬಂದಿವೆ',
            hi: '${count} मार्ग मिले'
        },
        'home.change': { en: 'Change', kn: 'ಬದಲಿಸಿ', hi: 'बदलें' },
        'home.arriving_in': {
            en: 'Arriving in ${mins} mins',
            kn: '${mins} ನಿಮಿಷಗಳಲ್ಲಿ ಆಗಮನ',
            hi: '${mins} मिनट में आगमन'
        },
        'home.min_trip': {
            en: '~${mins} min trip',
            kn: '~${mins} ನಿಮಿಷ ಪ್ರಯಾಣ',
            hi: '~${mins} मिनट यात्रा'
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

        // Popular Destination Names
        'dest.kengeri_ttmc': { en: 'Kengeri TTMC', kn: 'ಕೆಂಗೇರಿ TTMC', hi: 'केंगेरी TTMC' },
        'dest.konanakunte_cross': { en: 'Konanakunte Cross', kn: 'ಕೋಣನಕುಂಟೆ ಕ್ರಾಸ್', hi: 'कोनानकुंटे क्रॉस' },
        'dest.banashankari_ttmc': { en: 'Banashankari TTMC', kn: 'ಬನಶಂಕರಿ TTMC', hi: 'बनशंकरी TTMC' },
        'dest.rr_nagar_gate': { en: 'RR Nagar Gate', kn: 'ಆರ್.ಆರ್. ನಗರ ಗೇಟ್', hi: 'आर.आर. नगर गेट' },
        'dest.silk_institute': { en: 'Silk Institute', kn: 'ಸಿಲ್ಕ್ ಇನ್ಸ್ಟಿಟ್ಯೂಟ್', hi: 'सिल्क इंस्टीट्यूट' },
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
            en: '4. Evidence (Photo or Camera)',
            kn: '4. ಪುರಾವೆ (ಫೋಟೋ ಅಥವಾ ಕ್ಯಾಮೆರಾ)',
            hi: '4. साक्ष्य (फोटो या कैमरा)'
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
            en: 'Lumina Transit operates privacy-preserving, verified GPS passenger feedback.',
            kn: 'ಲುಮಿನಾ ಟ್ರಾನ್ಸಿಟ್ ಗೌಪ್ಯತೆ-ಸಂರಕ್ಷಿತ, ಪರಿಶೀಲಿತ GPS ಪ್ರಯಾಣಿಕ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ನಡೆಸುತ್ತದೆ.',
            hi: 'लुमिना ट्रांज़िट गोपनीयता-संरक्षित, सत्यापित GPS यात्री फीडबैक संचालित करता है।'
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
            en: 'Signed into Lumina Transit Bengaluru',
            kn: 'ಲುಮಿನಾ ಟ್ರಾನ್ಸಿಟ್ ಬೆಂಗಳೂರಿಗೆ ಸೈನ್ ಇನ್ ಆಗಿದೆ',
            hi: 'लुमिना ट्रांज़िट बेंगलुरु में साइन इन किया'
        },
        'toast.account_created': { en: 'Account Created!', kn: 'ಖಾತೆ ರಚಿಸಲಾಗಿದೆ!', hi: 'खाता बनाया गया!' },
        'toast.welcome_pts': {
            en: 'Welcome! Earn 50 starter points.',
            kn: 'ಸ್ವಾಗತ! 50 ಆರಂಭಿಕ ಅಂಕಗಳನ್ನು ಗಳಿಸಿ.',
            hi: 'स्वागत! 50 शुरुआती अंक कमाएं।'
        },
        'toast.signed_out': { en: 'Signed Out', kn: 'ಸೈನ್ ಔಟ್ ಆಗಿದೆ', hi: 'साइन आउट हो गया' },
        'toast.signed_out_msg': {
            en: 'You have been signed out of Lumina Transit Bengaluru.',
            kn: 'ನೀವು ಲುಮಿನಾ ಟ್ರಾನ್ಸಿಟ್ ಬೆಂಗಳೂರಿನಿಂದ ಸೈನ್ ಔಟ್ ಆಗಿದ್ದೀರಿ.',
            hi: 'आपको लुमिना ट्रांज़िट बेंगलुरु से साइन आउट कर दिया गया है।'
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

