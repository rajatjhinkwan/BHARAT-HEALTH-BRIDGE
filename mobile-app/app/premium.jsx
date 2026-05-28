import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, Animated, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from '@/components/ui/PressableScale';

const { width } = Dimensions.get('window');

// Data Sets for Premium Features
const PREMIUM_DOCTORS = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Johnson',
    specialization: 'Cardiologist',
    qualification: 'MD, FACC - Harvard Medical School',
    experience: '16+ Years',
    fees: '₹1,500',
    patients: '12,400+',
    rating: 4.9,
    reviews: 320,
    status: 'online',
    emergency: true,
    languages: 'English, Hindi',
    bio: 'Specialized in interventional cardiology and advanced heart failure management. Committed to modern, empathetic cardiovascular care.',
    avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'doc-2',
    name: 'Dr. James Wilson',
    specialization: 'Neurologist',
    qualification: 'MD, PhD - Johns Hopkins University',
    experience: '12+ Years',
    fees: '₹2,000',
    patients: '8,900+',
    rating: 4.8,
    reviews: 215,
    status: 'online',
    emergency: false,
    languages: 'English',
    bio: 'Dedicated researcher and expert clinician in neurological sleep patterns and dynamic neuro-restorative treatments.',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop'
  }
];

const PREMIUM_HOSPITALS = [
  {
    id: 'hosp-1',
    name: 'Medanta - The Medicity',
    type: 'Super Speciality',
    doctors: 450,
    beds: 1250,
    icu: 300,
    wait: '15m',
    rating: 4.8,
    address: 'Sector 38, Gurgaon, Haryana',
    banner: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=400&auto=format&fit=crop',
    departments: [
      { name: 'Cardiology', active: 18, queue: 4 },
      { name: 'Neurology', active: 12, queue: 3 },
      { name: 'Pediatrics', active: 22, queue: 7 }
    ]
  }
];

const PREMIUM_TIMELINE = [
  {
    id: 't-1',
    type: 'prescription',
    title: 'Consultation & Prescription',
    doctor: 'Dr. Sarah Johnson',
    hospital: 'Medanta The Medicity',
    date: '18 March 2026',
    color: '#3B82F6',
    icon: 'document-text',
    details: 'Augmentin 625 Duo (Twice a day), Metformin 500mg (Post Lunch)',
    hasVoice: true
  },
  {
    id: 't-2',
    type: 'mri',
    title: 'Brain MRI Scan',
    doctor: 'Dr. James Wilson',
    hospital: 'Max Hospital',
    date: '10 March 2026',
    color: '#8B5CF6',
    icon: 'scan',
    details: 'Report reveals normal cerebral cortex with no acute infarction.'
  },
  {
    id: 't-3',
    type: 'blood',
    title: 'HbA1c & Lipid Profile',
    doctor: 'Dr. Priya Sharma',
    hospital: 'AIIMS Delhi',
    date: '02 Feb 2026',
    color: '#10B981',
    icon: 'water',
    details: 'HbA1c: 6.8% (Borderline Diabetes), Cholesterol: 195 mg/dL (Normal)'
  }
];

const PRESCRIBED_MEDS = [
  { id: 'm-1', name: 'Metformin 500mg', dosage: '1 Tablet', timing: 'After Lunch', completed: true, doctor: 'Dr. S. Johnson' },
  { id: 'm-2', name: 'Atorvastatin 10mg', dosage: '1 Tablet', timing: 'Before Bed', completed: false, doctor: 'Dr. S. Johnson' },
  { id: 'm-3', name: 'Augmentin 625 Duo', dosage: '1 Tablet', timing: 'Morning & Evening', completed: false, doctor: 'Dr. James Wilson' }
];

export default function PremiumSuiteScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const router = useRouter();

  // Screen State
  const [activeTab, setActiveTab] = useState('summary'); // summary, tracker, records, booking
  const [showQRModal, setShowQRModal] = useState(false);
  const [showMedicalCard, setShowMedicalCard] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(PREMIUM_DOCTORS[0]);
  const [streak, setStreak] = useState(6);
  const [showChat, setShowChat] = useState(false);
  const [chatText, setChatText] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'system', text: 'Namaste! I am your AI Health Assistant. Ask me anything about your prescriptions, reports, or symptoms.' }
  ]);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Animation hooks
  const cardScale = useRef(new Animated.Value(1)).current;
  const qrRotate = useRef(new Animated.Value(0)).current;

  // Custom Functions
  const handleSOS = () => {
    Animated.sequence([
      Animated.timing(cardScale, { toValue: 1.1, duration: 150, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 1, duration: 150, useNativeDriver: true })
    ]).start(() => {
      alert("🚨 CRITICAL SOS ACTIVATED! Emergency contacts and coordinates dispatched to nearest trauma center!");
    });
  };

  const handleAskAI = () => {
    if (!chatText.trim()) return;
    const userQuery = chatText;
    setChatMessages(prev => [...prev, { role: 'user', text: userQuery }]);
    setChatText('');
    
    // Simple mock responses based on queries
    setTimeout(() => {
      let reply = "Based on your clinical record, that medication is safe to consume. Please maintain consistency.";
      if (userQuery.toLowerCase().includes('blood') || userQuery.toLowerCase().includes('mri')) {
        reply = "Your HbA1c stands at 6.8% showing a borderline diabetic risk. I recommend restricting simple sugars and repeating the checkup next month.";
      } else if (userQuery.toLowerCase().includes('metformin')) {
        reply = "Metformin helps manage insulin sensitivity. Take it strictly after meals to prevent gastric discomfort.";
      }
      setChatMessages(prev => [...prev, { role: 'system', text: reply }]);
    }, 1000);
  };

  return (
    <ScreenWrapper>
      <AppHeader title="Premium Health Wallet" showBack={true} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* PREMIUM HEALTH SCORE HEADER (GLASSMORPHIC EFFECT) */}
        <LinearGradient colors={[C.primaryBlue + '30', 'transparent']} style={[styles.premiumHeaderCard, { borderColor: C.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.premiumBadge, { color: C.primaryBlue }]}>★ GOLD ECOSYSTEM MEMBER</Text>
            <Text style={[styles.patientName, { color: C.textPrimary }]}>Rahul Sharma</Text>
            <Text style={[styles.patientSub, { color: C.textSecondary }]}>Unique ID: BHB-Gurgaon-5432</Text>
          </View>
          <View style={styles.healthScoreContainer}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.scoreCircle}>
              <Text style={styles.scoreText}>85</Text>
              <Text style={styles.scoreLabel}>Health</Text>
            </LinearGradient>
          </View>
        </LinearGradient>

        {/* QUICK TAB NAVIGATOR */}
        <View style={styles.tabRow}>
          {[
            { id: 'summary', label: 'Ecosystem', icon: 'heart-outline' },
            { id: 'tracker', label: 'Pill Tracker', icon: 'alarm-outline' },
            { id: 'records', label: 'Timeline', icon: 'calendar-outline' },
            { id: 'booking', label: 'Physicians', icon: 'people-outline' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, activeTab === tab.id ? { backgroundColor: C.primaryBlue } : { backgroundColor: C.cardWhite, borderColor: C.border }]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons name={tab.icon} size={18} color={activeTab === tab.id ? '#fff' : C.textSecondary} />
              <Text style={[styles.tabLabel, activeTab === tab.id ? { color: '#fff' } : { color: C.textSecondary }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MAIN CONTROLLER */}
        {activeTab === 'summary' && (
          <View style={styles.tabContent}>
            
            {/* DIGITAL EMERGENCY MEDICAL CARD ACCORDION */}
            <PressableScale style={[styles.accordionCard, { backgroundColor: C.cardWhite, borderColor: '#FCA5A5' }]} onPress={() => setShowMedicalCard(!showMedicalCard)}>
              <View style={styles.accordionHeader}>
                <Ionicons name="medical-sharp" size={24} color="#EF4444" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.accordionTitle, { color: C.textPrimary }]}>Digital Emergency Medical Card</Text>
                  <Text style={[styles.accordionSub, { color: C.textSecondary }]}>Click to preview SOS Medical Identity</Text>
                </View>
                <Ionicons name={showMedicalCard ? "chevron-up" : "chevron-down"} size={20} color={C.textSecondary} />
              </View>
              
              {showMedicalCard && (
                <View style={[styles.medicalCardBody, { borderTopColor: C.border }]}>
                  <View style={styles.cardHeaderWrap}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.cardBoldText}>Rahul Sharma</Text>
                      <Text style={styles.cardLabelText}>DOB: 12-08-1994 (32 Years)</Text>
                      <Text style={styles.cardLabelText}>Aadhaar: XXXX XXXX 9812</Text>
                    </View>
                    <View style={[styles.bloodBadge, { backgroundColor: '#FEF2F2' }]}>
                      <Text style={styles.bloodText}>O+</Text>
                    </View>
                  </View>

                  <View style={styles.medicalVitalsGrid}>
                    <View style={styles.vitalRow}><Text style={styles.vitalLabel}>Allergies:</Text><Text style={styles.vitalVal}>Penicillin, Shellfish</Text></View>
                    <View style={styles.vitalRow}><Text style={styles.vitalLabel}>Chronic:</Text><Text style={styles.vitalVal}>Type 2 Diabetes (Managed)</Text></View>
                    <View style={styles.vitalRow}><Text style={styles.vitalLabel}>Emergency Contact:</Text><Text style={styles.vitalVal}>Pooja Sharma (Spouse) - 98724XXXXX</Text></View>
                    <View style={styles.vitalRow}><Text style={styles.vitalLabel}>Instructions:</Text><Text style={styles.vitalVal}>Requires Insulin injection in emergency hypoglycemic shock</Text></View>
                  </View>

                  <View style={styles.medicalCardFooter}>
                    <TouchableOpacity style={[styles.miniBtn, { backgroundColor: C.primaryBlue }]} onPress={() => setShowQRModal(true)}>
                      <Ionicons name="qr-code-outline" size={14} color="#fff" />
                      <Text style={styles.miniBtnText}>Doctor Scan QR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.miniBtn, { backgroundColor: '#10B981' }]} onPress={() => alert('PDF downloaded locally!')}>
                      <Ionicons name="download-outline" size={14} color="#fff" />
                      <Text style={styles.miniBtnText}>Save E-Card PDF</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </PressableScale>

            {/* AI HEALTH INTEGRATED TREND WIDGET */}
            <LinearGradient colors={['#4F46E5', '#312E81']} style={styles.aiSummaryCard}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={20} color="#60A5FA" />
                <Text style={styles.aiTitle}>AI Health Summary Engine</Text>
                <View style={styles.aiTag}><Text style={styles.aiTagText}>ACTIVE ANALYSES</Text></View>
              </View>
              <Text style={styles.aiIntroText}>Our AI parsed 3 uploaded medical reports & prescriptions. Trend signals:</Text>
              
              <View style={styles.aiBulletGrid}>
                <View style={styles.bulletRow}>
                  <Ionicons name="alert-circle" size={16} color="#FBBF24" />
                  <Text style={styles.bulletText}>Blood Pressure showed minor systolic fluctuations on 15-March logs.</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                  <Text style={styles.bulletText}>HbA1c lowered from 7.1% to 6.8% showing superb compliance to Metformin.</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Ionicons name="time" size={16} color="#60A5FA" />
                  <Text style={styles.bulletText}>Recommend scheduling follow-up Lipid Profile with Dr. Sarah by 25-March.</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.askAiBtn} onPress={() => setShowChat(true)}>
                <Ionicons name="chatbox-ellipses-outline" size={16} color="#fff" />
                <Text style={styles.askAiText}>Ask AI Coach Explanations</Text>
              </TouchableOpacity>
            </LinearGradient>

            {/* HEALTH SCORE COMPLIANCE SUGGESTIONS */}
            <View style={[styles.section, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
              <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>How to hit 95 Health Score?</Text>
              <View style={{ gap: 10 }}>
                <View style={styles.suggestionRow}>
                  <View style={[styles.checkCircle, { backgroundColor: '#FFFBEB' }]}><Ionicons name="flame" size={16} color="#F59E0B" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sugTitle, { color: C.textPrimary }]}>Log Metformin for 4 more days</Text>
                    <Text style={[styles.sugDesc, { color: C.textSecondary }]}>Maintains your medicine streak bonus</Text>
                  </View>
                  <Text style={styles.sugVal}>+10 pts</Text>
                </View>
                <View style={styles.suggestionRow}>
                  <View style={[styles.checkCircle, { backgroundColor: '#EEF2FF' }]}><Ionicons name="calendar" size={16} color="#4F46E5" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sugTitle, { color: C.textPrimary }]}>Attend Dr. Sarah checkup</Text>
                    <Text style={[styles.sugDesc, { color: C.textSecondary }]}>Bridges active consult status</Text>
                  </View>
                  <Text style={styles.sugVal}>+15 pts</Text>
                </View>
              </View>
            </View>

            {/* FAMILY MEMBER HEALTH MANAGER */}
            <View style={[styles.section, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
              <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Linked Family Profiles</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                <View style={[styles.familyCard, { borderColor: C.border }]}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop' }} style={styles.familyAvatar} />
                  <Text style={[styles.familyTitle, { color: C.textPrimary }]}>Pooja Sharma</Text>
                  <Text style={[styles.familyRelation, { color: C.textSecondary }]}>Spouse • A+</Text>
                  <View style={styles.familyStatusActive}><Text style={styles.familyStatusText}>Active Plan</Text></View>
                </View>
                <View style={[styles.familyCard, { borderColor: C.border }]}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop' }} style={styles.familyAvatar} />
                  <Text style={[styles.familyTitle, { color: C.textPrimary }]}>Shyam Sharma</Text>
                  <Text style={[styles.familyRelation, { color: C.textSecondary }]}>Father • O-</Text>
                  <View style={[styles.familyStatusActive, { backgroundColor: '#EF4444' }]}><Text style={styles.familyStatusText}>Elderly Care</Text></View>
                </View>
              </ScrollView>
            </View>

            {/* MULTI-HOSPITAL CONNECTIONS */}
            <View style={[styles.section, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
              <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Unified Health Network (3 Connected)</Text>
              <Text style={[styles.accordionSub, { color: C.textSecondary, marginBottom: 12 }]}>Your central ID allows instant report access across these networks:</Text>
              <View style={styles.hospitalBadgesGrid}>
                <View style={styles.hospBadge}><Text style={styles.hospBadgeText}>🏥 Medanta Super Specialty</Text></View>
                <View style={styles.hospBadge}><Text style={styles.hospBadgeText}>🏛️ AIIMS Central Delhi</Text></View>
                <View style={styles.hospBadge}><Text style={styles.hospBadgeText}>🚑 Max Health System</Text></View>
              </View>
            </View>

          </View>
        )}

        {/* PILL TRACKER TAB */}
        {activeTab === 'tracker' && (
          <View style={styles.tabContent}>
            
            {/* PILL STREAK RING */}
            <View style={[styles.streakWidget, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
              <View style={styles.streakHeader}>
                <Ionicons name="flame" size={32} color="#EF4444" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.streakTitle, { color: C.textPrimary }]}>{streak} Day Medication Streak!</Text>
                  <Text style={[styles.streakSub, { color: C.textSecondary }]}>Keep checking off to maintain your bonus score</Text>
                </View>
                <TouchableOpacity onPress={() => setStreak(s => s + 1)} style={styles.streakAdd}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>+1 Day</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.progressBarBG, { backgroundColor: C.background }]}>
                <View style={[styles.progressBarFill, { width: '85%' }]} />
              </View>
            </View>

            {/* SMART MEDICINE LIST */}
            <View style={{ gap: 12 }}>
              {PRESCRIBED_MEDS.map((med, idx) => (
                <View key={med.id} style={[styles.medicineCard, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                  <View style={[styles.medIconWrap, { backgroundColor: idx === 0 ? '#EFF6FF' : idx === 1 ? '#EEF2FF' : '#ECFDF5' }]}>
                    <Ionicons name="medkit" size={24} color={idx === 0 ? '#3B82F6' : idx === 1 ? '#4F46E5' : '#10B981'} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.medName, { color: C.textPrimary }]}>{med.name}</Text>
                    <Text style={[styles.medMeta, { color: C.textSecondary }]}>{med.dosage} • {med.timing}</Text>
                    <Text style={[styles.medDoc, { color: C.primaryBlue }]}>Prescribed by: {med.doctor}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.checkedBox, med.completed ? { backgroundColor: '#10B981', borderColor: '#10B981' } : { borderColor: C.border }]}
                    onPress={() => {
                      med.completed = !med.completed;
                      setStreak(s => med.completed ? s + 1 : Math.max(0, s - 1));
                    }}
                  >
                    {med.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'records' && (
          <View style={styles.tabContent}>
            
            {/* RECORD SEARCH */}
            <View style={[styles.searchBoxWrap, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
              <Ionicons name="search" size={20} color={C.textSecondary} />
              <TextInput placeholder="Search timeline by doctor, prescription..." placeholderTextColor={C.textSecondary} style={[styles.searchInput, { color: C.textPrimary }]} />
            </View>

            {/* DYNAMIC TIMELINE SCROLL */}
            <View style={styles.timelineContainer}>
              {PREMIUM_TIMELINE.map((item, idx) => (
                <View key={item.id} style={styles.timelineRow}>
                  
                  {/* Left Line */}
                  <View style={styles.lineLeft}>
                    <View style={[styles.timelineIcon, { backgroundColor: item.color }]}>
                      <Ionicons name={item.icon} size={16} color="#fff" />
                    </View>
                    {idx < PREMIUM_TIMELINE.length - 1 && <View style={[styles.vertLine, { backgroundColor: C.border }]} />}
                  </View>

                  {/* Right Record Card */}
                  <View style={[styles.timelineCard, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                    <View style={styles.tCardHeader}>
                      <Text style={[styles.tCardDate, { color: C.textSecondary }]}>{item.date}</Text>
                      <View style={[styles.tCardBadge, { backgroundColor: item.color + '15' }]}><Text style={[styles.tCardBadgeText, { color: item.color }]}>{item.type.toUpperCase()}</Text></View>
                    </View>
                    <Text style={[styles.tCardTitle, { color: C.textPrimary }]}>{item.title}</Text>
                    <Text style={[styles.tCardDesc, { color: C.textSecondary }]}>{item.details}</Text>
                    <Text style={[styles.tCardProvider, { color: C.textSecondary }]}>{item.doctor} • {item.hospital}</Text>

                    {/* Integrated Rich Consultation Details */}
                    <View style={[styles.notesContainer, { backgroundColor: C.background }]}>
                      <Text style={[styles.notesLabel, { color: C.textPrimary }]}>📜 Clinical Notes</Text>
                      <Text style={[styles.notesBody, { color: C.textSecondary }]}>Checked vitals. Sugars managed well. Advised avoiding processed carbs. Recheck HbA1c in 4 weeks.</Text>
                    </View>

                    {/* SPEECH TRANSCRIPTION CONSULT PLAYER */}
                    {item.hasVoice && (
                      <View style={[styles.voicePlayer, { backgroundColor: C.background }]}>
                        <TouchableOpacity style={[styles.playBtn, { backgroundColor: C.primaryBlue }]} onPress={() => setVoicePlaying(!voicePlaying)}>
                          <Ionicons name={voicePlaying ? "pause" : "play"} size={16} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={[styles.voiceTitle, { color: C.textPrimary }]}>Voice Session Recording</Text>
                          <Text style={[styles.voiceSub, { color: C.textSecondary }]}>{voicePlaying ? "Playing audio memo..." : "0:45 min • Tap to play transcript"}</Text>
                        </View>
                      </View>
                    )}

                    {voicePlaying && item.hasVoice && (
                      <View style={[styles.transcriptBox, { borderColor: C.border }]}>
                        <Text style={[styles.transcriptTitle, { color: C.primaryBlue }]}>🗣️ Transcript (AI Transcribed):</Text>
                        <Text style={[styles.transcriptText, { color: C.textSecondary }]}>&quot;Alright Rahul, looking at your blood report your insulin spikes have gone down slightly. Continue the morning walking regime and we will keep the Metformin dosage unchanged. Take care.&quot;</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* BOOKING/PHYSICIANS TAB */}
        {activeTab === 'booking' && (
          <View style={styles.tabContent}>
            
            {/* LIVE WAITING QUEUE TICKER */}
            <LinearGradient colors={['#FEF3C7', '#FFFBEB']} style={[styles.queueTicker, { borderColor: '#F59E0B' }]}>
              <View style={styles.tickerHeader}>
                <Ionicons name="hourglass" size={24} color="#D97706" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: '#92400E', fontWeight: '800', fontSize: 16 }}>Live Queue: Room #4 (General Medicine)</Text>
                  <Text style={{ color: '#A16207', fontSize: 12, marginTop: 2 }}>Dr. Sarah Johnson • Current Token: #14 (You are #18)</Text>
                </View>
              </View>
              <View style={styles.tickerStatusRow}>
                <Text style={{ color: '#D97706', fontWeight: '800' }}>Approx Wait Time: ~20 mins</Text>
                <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>PRIORITY PASS</Text>
                </View>
              </View>
            </LinearGradient>

            {/* HOSPITAL DEPARTMENTS SYSTEM */}
            <View style={styles.departmentGrid}>
              {[
                { name: 'Cardiology', count: 18, active: 12, icon: 'heart', color: '#EF4444' },
                { name: 'Neurology', count: 12, active: 8, icon: 'brain', color: '#8B5CF6' },
                { name: 'Pediatrics', count: 24, active: 16, icon: 'happy', color: '#3B82F6' },
                { name: 'Orthopedics', count: 10, active: 6, icon: 'body', color: '#10B981' }
              ].map(dept => (
                <View key={dept.name} style={[styles.deptBlock, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                  <View style={[styles.deptIconWrap, { backgroundColor: dept.color + '15' }]}>
                    <Ionicons name={dept.icon} size={22} color={dept.color} />
                  </View>
                  <Text style={[styles.deptName, { color: C.textPrimary }]}>{dept.name}</Text>
                  <Text style={[styles.deptStats, { color: C.textSecondary }]}>{dept.active} on duty • {dept.count} doctors</Text>
                </View>
              ))}
            </View>

            {/* PREMIUM DOCTORS SYSTEM */}
            <Text style={[styles.sectionTitle, { color: C.textPrimary, marginTop: 20 }]}>Available Elite Medical Staff</Text>
            <View style={{ gap: 16 }}>
              {PREMIUM_DOCTORS.map(doc => (
                <View key={doc.id} style={[styles.doctorPremiumCard, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                  <View style={styles.docPremiumHeader}>
                    <Image source={{ uri: doc.avatar }} style={styles.docPremiumAvatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.docPremiumName, { color: C.textPrimary }]}>{doc.name}</Text>
                        <Ionicons name="checkmark-circle" size={16} color="#3B82F6" style={{ marginLeft: 4 }} />
                      </View>
                      <Text style={[styles.docPremiumSub, { color: C.textSecondary }]}>{doc.specialization} • {doc.experience}</Text>
                      <Text style={[styles.docPremiumQual, { color: C.textSecondary }]}>{doc.qualification}</Text>
                    </View>
                  </View>

                  <Text style={[styles.docPremiumBio, { color: C.textSecondary }]} numberOfLines={2}>{doc.bio}</Text>

                  <View style={styles.docStatsPremiumGrid}>
                    <View style={styles.docStatMini}><Text style={[styles.docMiniVal, { color: C.textPrimary }]}>⭐ {doc.rating}</Text><Text style={styles.docMiniLabel}>Rating</Text></View>
                    <View style={styles.docStatMini}><Text style={[styles.docMiniVal, { color: C.textPrimary }]}>{doc.patients}</Text><Text style={styles.docMiniLabel}>Patients</Text></View>
                    <View style={styles.docStatMini}><Text style={[styles.docMiniVal, { color: C.textPrimary }]}>{doc.fees}</Text><Text style={styles.docMiniLabel}>Consult Fee</Text></View>
                  </View>

                  <View style={[styles.slotsGridWrap, { borderTopColor: C.border }]}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.textSecondary, marginBottom: 8 }}>Available Slots Today:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {['10:30 AM', '11:00 AM', '02:30 PM', '04:00 PM'].map(time => (
                        <TouchableOpacity
                          key={time}
                          style={[styles.miniSlotItem, selectedSlot === time ? { backgroundColor: C.primaryBlue } : { backgroundColor: C.background, borderColor: C.border }]}
                          onPress={() => setSelectedSlot(time)}
                        >
                          <Text style={[styles.miniSlotText, selectedSlot === time ? { color: '#fff' } : { color: C.textPrimary }]}>{time}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <TouchableOpacity
                    style={[styles.bookingCommitBtn, { backgroundColor: C.primaryBlue }]}
                    onPress={() => {
                      if (!selectedSlot) return alert("Please select a slot first!");
                      alert(`Appointment Booked successfully with ${doc.name} at ${selectedSlot}!`);
                      setSelectedSlot(null);
                    }}
                  >
                    <Text style={styles.bookingCommitText}>Book Premium Consultation</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      {/* FLOATING SOS EMERGENCY QUICK ACTION BAR (ALWAYS PERSISTENT AT BOTTOM) */}
      <View style={[styles.sosFloatBar, { backgroundColor: C.cardWhite, borderTopColor: C.border }]}>
        <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
          <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.sosGradient}>
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={styles.sosText}>ACTIVATE SOS EMERGENCY</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* QR IDENTITY DECRYPTED DIALOG */}
      <Modal visible={showQRModal} transparent={true} animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.qrModalCard, { backgroundColor: C.cardWhite }]}>
            <Text style={[styles.qrTitle, { color: C.textPrimary }]}>Your Decrypted Patient Access QR</Text>
            <Text style={[styles.qrSub, { color: C.textSecondary }]}>Allow hospital reception or doctors to scan this for secure timeline authorization</Text>
            
            <View style={styles.qrContainerBG}>
              <Ionicons name="qr-code" size={200} color="#1E293B" />
            </View>

            <Text style={styles.qrTimeCounter}>⏱ Temporary Access Token: Expiring in 2:45 mins</Text>

            <TouchableOpacity style={[styles.closeModalBtn, { backgroundColor: C.primaryBlue }]} onPress={() => setShowQRModal(false)}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI ASSISTANT CHAT DIALOG OVERLAY */}
      <Modal visible={showChat} transparent={true} animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.chatModalCard, { backgroundColor: C.cardWhite }]}>
            <View style={styles.chatHeader}>
              <Ionicons name="sparkles" size={20} color="#3B82F6" />
              <Text style={[styles.chatTitle, { color: C.textPrimary }]}>AI Clinical Advisor</Text>
              <TouchableOpacity onPress={() => setShowChat(false)} style={{ marginLeft: 'auto' }}>
                <Ionicons name="close" size={24} color={C.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.chatScroll} contentContainerStyle={{ gap: 10 }}>
              {chatMessages.map((msg, idx) => (
                <View key={idx} style={[styles.chatBubble, msg.role === 'user' ? styles.bubbleUser : [styles.bubbleSystem, { backgroundColor: C.background }]]}>
                  <Text style={[styles.chatBubbleText, msg.role === 'user' ? { color: '#fff' } : { color: C.textPrimary }]}>{msg.text}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.chatInputRow}>
              <TextInput
                placeholder="Ask about reports, Metformin warnings..."
                placeholderTextColor={C.textSecondary}
                value={chatText}
                onChangeText={setChatText}
                style={[styles.chatInput, { color: C.textPrimary, borderColor: C.border }]}
              />
              <TouchableOpacity style={[styles.chatSendBtn, { backgroundColor: C.primaryBlue }]} onPress={handleAskAI}>
                <Ionicons name="send" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 120 },
  
  premiumHeaderCard: { borderRadius: 24, padding: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerLeft: { flex: 1 },
  premiumBadge: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 },
  patientName: { fontSize: 22, fontWeight: '900' },
  patientSub: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  
  healthScoreContainer: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden' },
  scoreCircle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scoreText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  scoreLabel: { color: '#fff', fontSize: 10, fontWeight: '700' },

  tabRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4, elevation: 1 },
  tabLabel: { fontSize: 10, fontWeight: '800' },

  tabContent: { gap: 16 },

  accordionCard: { borderRadius: 20, padding: 16, borderWidth: 2, overflow: 'hidden', ...Shadow.sm },
  accordionHeader: { flexDirection: 'row', alignItems: 'center' },
  accordionTitle: { fontSize: 15, fontWeight: '800' },
  accordionSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  medicalCardBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  cardHeaderWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardHeaderLeft: { flex: 1 },
  cardBoldText: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  cardLabelText: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '600' },
  bloodBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#EF4444' },
  bloodText: { fontSize: 18, fontWeight: '900', color: '#EF4444' },

  medicalVitalsGrid: { gap: 8, marginBottom: 16 },
  vitalRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingBottom: 6 },
  vitalLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },
  vitalVal: { fontSize: 12, fontWeight: '600', color: '#1E293B', flex: 0.7, textAlign: 'right' },
  
  medicalCardFooter: { flexDirection: 'row', gap: 10 },
  miniBtn: { flex: 1, height: 40, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  miniBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  aiSummaryCard: { borderRadius: 24, padding: 20, ...Shadow.md },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiTitle: { color: '#fff', fontSize: 17, fontWeight: '900', flex: 1 },
  aiTag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  aiTagText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  aiIntroText: { color: '#93C5FD', fontSize: 12, fontWeight: '600', marginBottom: 12 },
  aiBulletGrid: { gap: 10, marginBottom: 16 },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bulletText: { color: '#fff', fontSize: 13, flex: 1, lineHeight: 18, fontWeight: '500' },
  askAiBtn: { backgroundColor: 'rgba(255,255,255,0.15)', height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  askAiText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  section: { padding: 20, borderRadius: 24, borderWidth: 1, ...Shadow.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingBottom: 10 },
  checkCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sugTitle: { fontSize: 14, fontWeight: '800' },
  sugDesc: { fontSize: 11, fontWeight: '600' },
  sugVal: { fontSize: 13, fontWeight: '800', color: '#10B981' },

  familyCard: { width: 140, padding: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  familyAvatar: { width: 60, height: 60, borderRadius: 30, marginBottom: 8 },
  familyTitle: { fontSize: 13, fontWeight: '800' },
  familyRelation: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  familyStatusActive: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  familyStatusText: { color: '#065F46', fontSize: 9, fontWeight: '800' },

  hospitalBadgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hospBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  hospBadgeText: { color: '#1E40AF', fontSize: 12, fontWeight: '700' },

  streakWidget: { borderRadius: 20, padding: 16, borderWidth: 1, ...Shadow.sm },
  streakHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  streakTitle: { fontSize: 16, fontWeight: '800' },
  streakSub: { fontSize: 11, fontWeight: '500', marginTop: 2, flex: 0.8 },
  streakAdd: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  progressBarBG: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#EF4444', borderRadius: 4 },

  medicineCard: { borderRadius: 16, padding: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', ...Shadow.sm },
  medIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  medName: { fontSize: 15, fontWeight: '800' },
  medMeta: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  medDoc: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  checkedBox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  searchBoxWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  timelineContainer: { borderLeftWidth: 2, borderLeftColor: 'rgba(0,0,0,0.05)', marginLeft: 10, paddingLeft: 16, gap: 16 },
  timelineRow: { position: 'relative' },
  lineLeft: { position: 'absolute', left: -27, top: 4, alignItems: 'center' },
  timelineIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  vertLine: { width: 2, height: 200, marginTop: 4 },
  timelineCard: { borderRadius: 18, padding: 16, borderWidth: 1, ...Shadow.sm },
  tCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tCardDate: { fontSize: 11, fontWeight: '700' },
  tCardBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tCardBadgeText: { fontSize: 9, fontWeight: '800' },
  tCardTitle: { fontSize: 15, fontWeight: '800' },
  tCardDesc: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  tCardProvider: { fontSize: 11, fontWeight: '600', marginTop: 8 },

  notesContainer: { borderRadius: 10, padding: 12, marginTop: 12 },
  notesLabel: { fontSize: 12, fontWeight: '800' },
  notesBody: { fontSize: 12, fontWeight: '600', marginTop: 4, lineHeight: 16 },

  voicePlayer: { borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  playBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  voiceTitle: { fontSize: 13, fontWeight: '800' },
  voiceSub: { fontSize: 11, fontWeight: '600' },
  
  transcriptBox: { borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, padding: 10, marginTop: 10 },
  transcriptTitle: { fontSize: 12, fontWeight: '800' },
  transcriptText: { fontSize: 12, fontWeight: '600', marginTop: 4, lineHeight: 18, fontStyle: 'italic' },

  queueTicker: { borderRadius: 20, padding: 16, borderWidth: 1, gap: 12, marginBottom: 16 },
  tickerHeader: { flexDirection: 'row', alignItems: 'center' },
  tickerStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  departmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  deptBlock: { width: '47.5%', padding: 16, borderRadius: 18, borderWidth: 1, ...Shadow.sm },
  deptIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  deptName: { fontSize: 14, fontWeight: '800' },
  deptStats: { fontSize: 11, fontWeight: '600', marginTop: 4 },

  doctorPremiumCard: { borderRadius: 22, padding: 16, borderWidth: 1, marginBottom: 16, ...Shadow.sm },
  docPremiumHeader: { flexDirection: 'row', alignItems: 'center' },
  docPremiumAvatar: { width: 64, height: 64, borderRadius: 32 },
  docPremiumName: { fontSize: 16, fontWeight: '800' },
  docPremiumSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  docPremiumQual: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  docPremiumBio: { fontSize: 12, fontWeight: '500', marginTop: 12, lineHeight: 18 },
  docStatsPremiumGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingBottom: 16 },
  docStatMini: { flex: 1, alignItems: 'center' },
  docMiniVal: { fontSize: 15, fontWeight: '800' },
  docMiniLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 },
  
  slotsGridWrap: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 16 },
  miniSlotItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  miniSlotText: { fontSize: 12, fontWeight: '800' },
  bookingCommitBtn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  bookingCommitText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  sosFloatBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 72, padding: 12, borderTopWidth: 1, elevation: 8 },
  sosButton: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  sosGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sosText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  qrModalCard: { width: '90%', borderRadius: 24, padding: 24, alignItems: 'center' },
  qrTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  qrSub: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 8, lineHeight: 18 },
  qrContainerBG: { padding: 16, backgroundColor: '#F8FAFC', borderRadius: 16, marginVertical: 20 },
  qrTimeCounter: { fontSize: 12, fontWeight: '800', color: '#EF4444' },
  closeModalBtn: { width: '100%', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20 },

  chatModalCard: { width: '90%', height: '70%', borderRadius: 24, padding: 20 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingBottom: 12 },
  chatTitle: { fontSize: 16, fontWeight: '850', marginLeft: 8 },
  chatScroll: { flex: 1, marginVertical: 12 },
  chatBubble: { padding: 12, borderRadius: 16, maxWidth: '80%', marginBottom: 8 },
  bubbleUser: { backgroundColor: '#3B82F6', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  bubbleSystem: { alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  chatBubbleText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  chatInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  chatInput: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 14 },
  chatSendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' }
});
