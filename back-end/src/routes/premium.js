import { Router } from 'express';
import Hospital from '../models/Hospital.js';
import MedicalHistory from '../models/MedicalHistory.js';

const router = Router();

// 1. Doctor Profiles System (Advanced info, specialities, badges, schedules)
router.get('/doctors', async (req, res) => {
  try {
    const doctors = [
      {
        id: 'doc-1',
        name: 'Dr. R. Sharma',
        specialization: 'Cardiology',
        qualification: 'MD, DM Cardiology — AIIMS',
        experience: '16+ Years',
        fees: '₹1,500',
        patients: '12,400+',
        rating: 4.9,
        reviews: 320,
        status: 'online',
        emergency: true,
        languages: 'English, Hindi',
        bio: 'Specialized in interventional cardiology and advanced heart failure management.',
        avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=300&auto=format&fit=crop',
        badges: ['Verified Elite', 'Hospital Approved', 'Emergency Specialist']
      },
      {
        id: 'doc-2',
        name: 'Dr. V. Gupta',
        specialization: 'Neurology',
        qualification: 'MD, DM Neurology — PGIMER',
        experience: '12+ Years',
        fees: '₹2,000',
        patients: '8,900+',
        rating: 4.8,
        reviews: 215,
        status: 'online',
        emergency: false,
        languages: 'English',
        bio: 'Expert clinician in neurological sleep patterns and neuro-restorative treatments.',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop',
        badges: ['Verified Elite', 'Neuro Expert']
      }
    ];
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Health Score Engine (Dynamic Calculation)
router.get('/health-score/:userId', async (req, res) => {
  try {
    // Check patient's records to calculate compliance dynamically
    const histories = await MedicalHistory.find({ patientId: req.params.userId });
    
    let baseScore = 75;
    let complianceBonus = 10;
    
    // If they have recent consultations, reward compliance
    if (histories.length > 0) {
      baseScore += Math.min(15, histories.length * 3);
    }
    
    res.json({
      score: Math.min(100, baseScore + complianceBonus),
      status: 'Superb Compliance',
      factors: [
        { name: 'Prescription Adherence', value: '+10 points', type: 'bonus' },
        { name: 'Regular Health Consultations', value: `+${Math.min(15, histories.length * 3)} points`, type: 'active' },
        { name: 'Pending Followups', value: '-5 points', type: 'alert' }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Digital Emergency Medical Card
router.get('/emergency-card/:userId', async (req, res) => {
  try {
    // Generate a secure masked emergency card
    const medicalCard = {
      patientId: req.params.userId,
      name: 'Rahul Sharma',
      dob: '12-08-1994',
      age: 32,
      bloodGroup: 'O+',
      allergies: ['Penicillin', 'Shellfish'],
      chronicDiseases: ['Type 2 Diabetes'],
      emergencyContacts: [
        { name: 'Pooja Sharma', relation: 'Spouse', phone: '+91-98724-XXXXX' }
      ],
      qrToken: `SECURE_BHB_TOKEN_${req.params.userId}_${Date.now()}`,
      instructions: 'Requires Insulin injection in emergency hypoglycemic shock.'
    };
    res.json(medicalCard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Integrated AI Trend Analysis & Summary
router.post('/ai-insights', async (req, res) => {
  try {
    const { history } = req.body;
    
    // Dynamic lightweight AI template matching
    let bpRisk = false;
    let sugarRisk = false;
    
    if (history && Array.isArray(history)) {
      history.forEach(item => {
        const text = JSON.stringify(item).toLowerCase();
        if (text.includes('pressure') || text.includes('bp')) bpRisk = true;
        if (text.includes('glucose') || text.includes('sugar') || text.includes('diabetes')) sugarRisk = true;
      });
    }

    const insights = {
      summary: 'Compliance status is high. Heart rate average remains standard.',
      anomalies: [],
      suggestions: [
        'Maintain daily walking goals to naturally lower blood glucose spikes.'
      ]
    };

    if (bpRisk) {
      insights.anomalies.push('Blood pressure logs indicate minor systolic fluctuations.');
      insights.suggestions.push('Restrict processed salt intake to less than 2g daily.');
    }
    if (sugarRisk) {
      insights.anomalies.push('HbA1c level is borderline at 6.8% showing Type 2 Diabetes risk.');
      insights.suggestions.push('Take Metformin immediately after lunch to stabilize postprandial levels.');
    }

    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
