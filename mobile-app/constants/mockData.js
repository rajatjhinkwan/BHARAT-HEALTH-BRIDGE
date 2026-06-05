export const HOME_MOCK_DATA = {
    user: {
        name: 'Rahul Sharma',
        healthScore: 85,
        location: 'Sector 44, Gurgaon',
        weather: '32°C',
        aqi: 210,
        age: 32,
        bloodGroup: 'O+',
        aadhar: '5432 XXXX 9812',
        insurance: 'HDFC Ergo - Silver Plan',
        chronic: 'Type 2 Diabetes (Managed)',
        lastVisit: '15 March 2026',
        nextCheckup: '25 March 2026'
    },
    activeVisit: {
        hospital: 'Medanta - The Medicity, Gurgaon',
        day: '2 of 3',
        bill: '₹42,800',
        progress: 0.65,
        admissionDate: '18 March 2026',
        room: 'H-402 (Private)',
        timeline: [
            { time: '08:00 AM', event: 'Morning Insulin & Vitals Check', status: 'done' },
            { time: '10:30 AM', event: 'Consultation - Dr. Arvinder Singh', status: 'done' },
            { time: '01:00 PM', event: 'Lab: HbA1c & Lipid Profile', status: 'done' },
            { time: '04:00 PM', event: 'IV Fluids: NS 500ml Started', status: 'active' },
            { time: '07:00 PM', event: 'Physiotherapy Session', status: 'pending' },
        ],
    },
    bills: [
        {
            id: 'b1', hospital: 'Medanta - The Medicity', patient: 'Rahul', date: '2024-03-18',
            amount: '₹42,800', score: 98, status: 'Verified',
            blockchainHash: '0x8f2...b4e2',
            originalBill: '₹42,800', savings: '₹0',
            summary: 'Comprehensive IPD bill for Type 2 Diabetes management. All charges verified against hospital tariff.'
        },
        {
            id: 'b2', hospital: 'Fortis Memorial', patient: 'Father', date: '2024-02-12',
            amount: '₹1,25,000', score: 95, status: 'Verified',
            blockchainHash: '0x3a1...f9a0',
            originalBill: '₹1,25,000', savings: '₹0',
            summary: 'Cardiac procedure bill. Verified under HDFC Ergo Silver Plan.'
        },
        {
            id: 'b3', hospital: 'Clinic One', patient: 'Suhani', date: '2024-01-20',
            amount: '₹2,300', score: 95, status: 'Verified',
            blockchainHash: '0x1c4...d2e8',
            originalBill: '₹2,300', savings: '₹0',
            summary: 'Pediatric consultation and basic screening.'
        },
    ],
    liveBilling: {
        total: '₹42,800',
        lastUpdated: 'Just Now',
        logs: [
            { id: 'l1', item: 'Bed Charges (Semi-Private)', cost: '₹8,000', time: '8:00 AM', category: 'Accommodation', status: 'ok' },
            { id: 'l2', item: 'Consultation Fee - Dr. Singh', cost: '₹2,500', time: '9:30 AM', category: 'Consultation', status: 'ok' },
            { id: 'l3', item: 'Complete Blood Count (CBC)', cost: '₹1,200', time: '10:15 AM', category: 'Lab', status: 'ok' },
            { id: 'l4', item: 'IV Fluids (NS 500ml)', cost: '₹4,620', time: '11:00 AM', category: 'Pharmacy', status: 'ok' },
            { id: 'l5', item: 'Disposable Gown (Kit)', cost: '₹1,500', time: '12:00 PM', category: 'Misc', status: 'ok' },
        ]
    },
    quickActions: [
        { label: 'Navigate', route: '/navigation', icon: 'navigate-outline' },
        { label: 'Scan', route: '/scan', icon: 'scan-outline' },
        { label: 'Hospitals', route: '/hospitals', icon: 'business-outline' },
        { label: 'Book', route: '/booking', icon: 'calendar-outline' },
    ],
    actionGrid: [
        {
            id: 'scan',
            title: 'Scan Prescription',
            subtitle: 'Generic medicine lookup',
            badge: 'Save up to 50%',
            colors: ['#3B82F6', '#2563EB'],
            icon: 'scan',
            route: '/scan'
        },
        {
            id: 'hospital_nav',
            title: 'Hospital Navigation',
            subtitle: 'Indoor ward map',
            badge: 'Interactive',
            colors: ['#10B981', '#059669'],
            icon: 'navigate',
            route: '/navigation'
        },
        {
            id: 'hospitals',
            title: 'Find Hospital',
            subtitle: 'Govt PHC · CHC · District',
            footer: 'Uttarakhand',
            colors: ['#F59E0B', '#D97706'],
            icon: 'medkit',
            route: '/hospitals'
        },
        {
            id: 'booking',
            title: 'Book Doctor',
            subtitle: 'Smart Appointments',
            colors: ['#06B6D4', '#0891B2'],
            icon: 'calendar',
            route: '/booking'
        },
    ],
    notifications: [
        { id: 'n1', title: 'Critical SOS: Blood Donor Found', time: '2m ago', type: 'emergency', unread: true },
        { id: 'n2', title: 'Bill Verified: Medanta The Medicity', time: '1h ago', type: 'bill', unread: true },
        { id: 'n4', title: 'Appointment Confirmed: Dr. Singh', time: '5h ago', type: 'info', unread: false },
        { id: 'n5', title: 'New Lab Report: Lipid Profile', time: '1d ago', type: 'info', unread: false },
    ],
    prescriptions: {
        branded: {
            name: 'Augmentin 625 Duo',
            price: '₹223.50',
            company: 'GSK'
        },
        generic: {
            name: 'Amoxicillin & Potassium Clavulanate',
            price: '₹45.00'
        },
        savings: '₹178.50',
        details: 'Generic medicines contain the same active ingredients as branded ones but are sold at much lower prices because they don\'t involve marketing and branding costs.'
    }
};
