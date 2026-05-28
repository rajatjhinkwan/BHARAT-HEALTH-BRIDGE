import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated, Switch, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { listDepartments, listDoctors, getDoctorAvailability, bookAppointment } from '@/lib/api';

// Dict of gorgeous premium metadata for each clinical ward
const DEPARTMENT_METADATA = {
  'general-medicine': {
    icon: 'stethoscope',
    color: '#3B82F6', // Cobalt Blue
    bgLight: '#EFF6FF',
    bgDark: '#1E3A8A30',
    desc: 'General health, fevers & regular checkups'
  },
  'cardiology': {
    icon: 'heart-pulse',
    color: '#EF4444', // Red
    bgLight: '#FEF2F2',
    bgDark: '#991B1B30',
    desc: 'Heart care, chest pain, ECG & pressure'
  },
  'neurology': {
    icon: 'brain',
    color: '#8B5CF6', // Purple
    bgLight: '#F5F3FF',
    bgDark: '#5B21B630',
    desc: 'Brain, nerves, stroke & seizures'
  },
  'nephrology': {
    icon: 'kidney',
    color: '#D97706', // Burnt Orange
    bgLight: '#FEF3C7',
    bgDark: '#92400E30',
    desc: 'Kidney care, dialysis & UTI'
  },
  'orthopedics': {
    icon: 'bone',
    color: '#64748B', // Slate
    bgLight: '#F8FAFC',
    bgDark: '#33415530',
    desc: 'Bones, joints, fractures & spine'
  },
  'ent': {
    icon: 'ear-hearing',
    color: '#F59E0B', // Amber
    bgLight: '#FFFBEB',
    bgDark: '#78350F30',
    desc: 'Ear, nose, throat & hearing'
  },
  'dermatology': {
    icon: 'sparkles',
    color: '#14B8A6', // Teal
    bgLight: '#F0FDFA',
    bgDark: '#115E5930',
    desc: 'Skin diseases, acne & hair care'
  },
  'pediatrics': {
    icon: 'baby',
    color: '#EC4899', // Pink
    bgLight: '#FDF2F8',
    bgDark: '#9D174D30',
    desc: 'Child healthcare & vaccinations'
  },
  'gynecology': {
    icon: 'gender-female',
    color: '#D946EF', // Magenta
    bgLight: '#FDF4FF',
    bgDark: '#86198F30',
    desc: 'Women health & prenatal care'
  },
  'psychiatry': {
    icon: 'head-cog-outline',
    color: '#6366F1', // Indigo
    bgLight: '#EEF2FF',
    bgDark: '#3730A330',
    desc: 'Mental health, anxiety & therapy'
  },
  'radiology': {
    icon: 'x-ray',
    color: '#06B6D4', // Cyan
    bgLight: '#ECFEFF',
    bgDark: '#0E749030',
    desc: 'Ultrasound, X-ray, CT & MRI'
  },
  'oncology': {
    icon: 'ribbon',
    color: '#A855F7', // Lavender
    bgLight: '#FAF5FF',
    bgDark: '#6B21A830',
    desc: 'Cancer care & chemotherapy'
  },
  'pulmonology': {
    icon: 'lungs',
    color: '#F97316', // Orange
    bgLight: '#FFF7ED',
    bgDark: '#9A341230',
    desc: 'Lungs, asthma & breathing issues'
  },
  'urology': {
    icon: 'water-outline',
    color: '#0EA5E9', // Sky Blue
    bgLight: '#F0F9FF',
    bgDark: '#07598530',
    desc: 'Urinary tract & prostate health'
  },
  'gastroenterology': {
    icon: 'stomach',
    color: '#10B981', // Green
    bgLight: '#ECFDF5',
    bgDark: '#065F4630',
    desc: 'Stomach, liver & digestion'
  },
  'endocrinology': {
    icon: 'dna',
    color: '#059669', // Emerald
    bgLight: '#F0FDF4',
    bgDark: '#064E3B30',
    desc: 'Diabetes, thyroid & hormones'
  },
  'ophthalmology': {
    icon: 'eye',
    color: '#2563EB', // Blue
    bgLight: '#EFF6FF',
    bgDark: '#1E40AF30',
    desc: 'Eye exams, cataracts & vision'
  },
  'eye-care': {
    icon: 'eye',
    color: '#2563EB', // Blue (compatible fallback for offline)
    bgLight: '#EFF6FF',
    bgDark: '#1E40AF30',
    desc: 'Eye exams, cataracts & vision'
  },
  'emergency': {
    icon: 'ambulance',
    color: '#DC2626', // Crimson
    bgLight: '#FEF2F2',
    bgDark: '#7F1D1D30',
    desc: '24/7 urgent care & trauma'
  }
};

const FALLBACK_DOCTORS = [
  { id: 'DOC-GEN-123', name: 'Dr. Rahul Negi', dept: 'general-medicine', exp: '10 years', rating: 4.8, available: 4, nextSlot: '10:00 AM', employeeId: 'DOC-GEN-123' },
  { id: 'DOC-CARD-123', name: 'Dr. Anoop Chauhan', dept: 'cardiology', exp: '15 years', rating: 4.9, available: 3, nextSlot: '10:30 AM', employeeId: 'DOC-CARD-123' },
  { id: 'DOC-NEUR-123', name: 'Dr. Rajat Jhinkwan', dept: 'neurology', exp: '12 years', rating: 4.9, available: 2, nextSlot: '2:00 PM', employeeId: 'DOC-NEUR-123' },
  { id: 'DOC-NEPH-123', name: 'Dr. Deepak Bhandari', dept: 'nephrology', exp: '11 years', rating: 4.7, available: 2, nextSlot: '11:00 AM', employeeId: 'DOC-NEPH-123' },
  { id: 'DOC-ORTH-123', name: 'Dr. Kartikay Jhinkwan', dept: 'orthopedics', exp: '14 years', rating: 4.8, available: 5, nextSlot: '9:00 AM', employeeId: 'DOC-ORTH-123' }
];

const TIMESLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30'
];

const SYMPTOMS = [
  { id: 'chest-pain', name: 'Chest Pain', icon: 'heart' },
  { id: 'breath-shortness', name: 'Shortness of Breath', icon: 'water' },
  { id: 'headache', name: 'Severe Headache', icon: 'fitness' },
  { id: 'fever', name: 'Fever', icon: 'thermometer' },
  { id: 'dizziness', name: 'Dizziness', icon: 'sync' },
  { id: 'fatigue', name: 'Extreme Fatigue', icon: 'bed' },
  { id: 'nausea', name: 'Nausea/Vomiting', icon: 'alert-circle' },
  { id: 'pain', name: 'Joint Pain', icon: 'body' }
];

// Helper to convert "09:00" to "9:00 AM"
function format24to12(time24) {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${ampm}`;
}

const INITIAL_DEPTS = [
  'General Medicine', 'Cardiology', 'Neurology', 'Nephrology', 'Orthopedics', 'ENT'
].map(name => {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const meta = DEPARTMENT_METADATA[id] || {
    icon: 'medical-bag',
    color: '#4B5563',
    bgLight: '#F3F4F6',
    bgDark: '#37415130',
    desc: 'OPD specialist consultation'
  };
  return {
    id,
    name,
    icon: meta.icon,
    color: meta.color,
    bgLight: meta.bgLight,
    bgDark: meta.bgDark,
    desc: meta.desc
  };
});

export default function BookingScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { patientProfileId, refreshDashboard } = useAuth();

  const [departments, setDepartments] = useState(INITIAL_DEPTS);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState(TIMESLOTS.map((t) => ({ time: t, available: true })));
  const [doctorCounts, setDoctorCounts] = useState({});
  const [booking, setBooking] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDept, setSelectedDept] = useState(null);
  const [searchDept, setSearchDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const getMinBookingDate = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (3600000 * 5.5));
    const hour = istDate.getHours();
    if (hour >= 16) {
      istDate.setDate(istDate.getDate() + 1);
    }
    istDate.setHours(0, 0, 0, 0);
    return istDate;
  };

  const [currentDate, setCurrentDate] = useState(() => getMinBookingDate());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDonor, setIsDonor] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [details, setDetails] = useState('');

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep - 1) * 33.33,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [currentStep, progressAnim]);

  // Load departments and compute dynamic doctor counts per department from live backend
  useEffect(() => {
    listDepartments()
      .then((depts) => {
        if (Array.isArray(depts) && depts.length) {
          setDepartments(depts.map((name) => {
            const id = name.toLowerCase().replace(/\s+/g, '-');
            const meta = DEPARTMENT_METADATA[id] || {
              icon: 'medical-bag',
              color: '#4B5563',
              bgLight: '#F3F4F6',
              bgDark: '#37415130',
              desc: 'OPD specialist consultation'
            };
            return {
              id,
              name,
              icon: meta.icon,
              color: meta.color,
              bgLight: meta.bgLight,
              bgDark: meta.bgDark,
              desc: meta.desc
            };
          }));
        }
      })
      .catch((err) => console.warn('Could not fetch departments list:', err));

    listDoctors()
      .then((list) => {
        if (Array.isArray(list)) {
          const counts = {};
          list.forEach((doc) => {
            if (doc.department) {
              const id = doc.department.toLowerCase().replace(/\s+/g, '-');
              counts[id] = (counts[id] || 0) + 1;
            }
          });
          setDoctorCounts(counts);
        }
      })
      .catch((err) => console.warn('Could not fetch doctor counts:', err));
  }, []);

  // Fetch doctors for selected department
  useEffect(() => {
    if (!selectedDept) return;
    const deptObj = departments.find((d) => d.id === selectedDept);
    const deptName = deptObj?.name || selectedDept;

    listDoctors(deptName)
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setDoctors(list.map((d) => ({
            id: d.employeeId,
            name: d.name,
            dept: selectedDept,
            exp: d.specialization || 'Clinical Specialist',
            rating: 4.8,
            available: d.availabilityStatus === 'AVAILABLE' ? 3 : 0,
            nextSlot: '10:00 AM',
            employeeId: d.employeeId
          })));
        } else {
          setDoctors([]);
        }
      })
      .catch(() => setDoctors([]));
  }, [selectedDept, departments]);

  // Fetch real-time slot availability for chosen doctor
  useEffect(() => {
    if (!selectedDoctor || currentStep < 3) return;
    const doc = doctors.find((d) => d.id === selectedDoctor) || FALLBACK_DOCTORS.find((d) => d.id === selectedDoctor);
    if (!doc?.employeeId) return;

    const dateStr = currentDate.toISOString().split('T')[0];
    getDoctorAvailability(doc.employeeId, dateStr)
      .then((res) => {
        if (res && Array.isArray(res.slots)) {
          setSlots(res.slots.map((s) => ({
            time: s.time,
            available: s.available
          })));
        } else {
          // Fallback slots if API does not return slots
          setSlots(TIMESLOTS.map(t => ({ time: t, available: true })));
        }
      })
      .catch(() => {
        setSlots(TIMESLOTS.map(t => ({ time: t, available: true })));
      });
  }, [selectedDoctor, currentDate, currentStep, doctors]);

  const handleNext = async () => {
    if (currentStep === 1 && !selectedDept) return Alert.alert('Select Department', 'Please choose a clinical department.');
    if (currentStep === 2 && !selectedDoctor) return Alert.alert('Select Doctor', 'Please choose a specialist.');
    if (currentStep === 3 && !selectedSlot) return Alert.alert('Select Time Slot', 'Please choose an appointment slot.');

    if (currentStep < 4) {
      setCurrentStep(c => c + 1);
      return;
    }

    if (!patientProfileId) {
      return Alert.alert('Profile Required', 'Please log in with a patient account to book appointments.');
    }

    const doc = doctors.find((d) => d.id === selectedDoctor) || FALLBACK_DOCTORS.find((d) => d.id === selectedDoctor);
    const deptObj = departments.find((d) => d.id === selectedDept);
    const deptName = deptObj?.name || 'General Medicine';

    // Safely format time slot to 24H "HH:mm" for the backend engine
    let appointmentTime = '09:00';
    if (selectedSlot) {
      if (selectedSlot.includes(':')) {
        const [timePart, ampm] = selectedSlot.split(' ');
        const [hStr, mStr] = timePart.split(':');
        let hour = parseInt(hStr, 10);
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
        appointmentTime = `${String(hour).padStart(2, '0')}:${mStr}`;
      } else {
        appointmentTime = selectedSlot;
      }
    }

    setBooking(true);
    try {
      await bookAppointment({
        patientId: patientProfileId,
        doctorId: doc?.employeeId || doc?.id || selectedDoctor,
        department: deptName,
        appointmentDate: currentDate.toISOString().split('T')[0],
        appointmentTime,
        reason: details || selectedSymptoms.join(', ') || 'OPD Consultation'
      });
      
      await refreshDashboard();
      Alert.alert(
        'Appointment Confirmed',
        'Your appointment is booked successfully. Redirecting to live queue…',
        [
          {
            text: 'View Queue',
            onPress: () => {
              router.replace({
                pathname: '/queue-status',
                params: {
                  department: deptName,
                  patientId: patientProfileId,
                  doctorName: doc?.name || 'Doctor',
                  appointmentTime: appointmentTime,
                },
              });
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Booking Failed', err.message || 'Could not complete appointment booking. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
    else router.back();
  };

  const toggleSymptom = (name) => {
    setSelectedSymptoms(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const changeDate = (days) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    d.setHours(0, 0, 0, 0);

    const minDate = getMinBookingDate();
    if (d.getTime() < minDate.getTime()) {
      return; // Block past date selection
    }

    const maxDate = new Date(minDate);
    maxDate.setDate(maxDate.getDate() + 7);
    if (d.getTime() > maxDate.getTime()) {
      return; // Block selecting more than 7 days ahead
    }

    setCurrentDate(d);
    setSelectedSlot(null);
  };

  const filteredDepts = departments.filter(d => d.name.toLowerCase().includes(searchDept.toLowerCase()));
  const filteredDoctors = doctors.length ? doctors : FALLBACK_DOCTORS.filter(d => d.dept === selectedDept);

  const deptObj = departments.find(d => d.id === selectedDept);
  const docObj = filteredDoctors.find(d => d.id === selectedDoctor);

  return (
    <ScreenWrapper>
      <AppHeader title="Book Appointment" onBack={handleBack} />

      {/* Modern Horizontal Steps Progress Indicator */}
      <View style={[styles.progressContainer, { backgroundColor: C.cardWhite }]}>
        <View style={[styles.progressLine, { backgroundColor: C.border }]} />
        <Animated.View style={[styles.progressFill, { backgroundColor: C.primaryBlue, width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />

        {[1, 2, 3, 4].map(step => {
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;
          return (
            <View key={step} style={styles.stepItem}>
              <View style={[styles.stepCircle,
                isActive ? { backgroundColor: C.primaryBlue, borderColor: C.cardWhite, borderWidth: 3, elevation: 2 }
                : isCompleted ? { backgroundColor: '#10B981', borderColor: C.cardWhite, borderWidth: 3 }
                : { backgroundColor: C.border, borderColor: C.cardWhite, borderWidth: 3 }
              ]}>
                {isCompleted ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={[styles.stepNum, { color: isActive ? '#fff' : C.textSecondary }]}>{step}</Text>}
              </View>
              <Text style={[styles.stepLabel, { color: isActive ? C.primaryBlue : C.textSecondary }]}>
                {['Dept', 'Doctor', 'Time', 'Confirm'][step - 1]}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* STEP 1: Premium Redesigned Department Grid */}
        {currentStep === 1 && (
          <View style={styles.section}>
            <View style={[styles.card, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: C.border }]}>
                <View style={[styles.iconBox, { backgroundColor: C.primaryBlue + '15' }]}>
                  <MaterialCommunityIcons name="hospital-building" size={24} color={C.primaryBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Select Clinical Ward</Text>
                  <Text style={[styles.cardSub, { color: C.textSecondary }]}>Choose a department for your specialized consultation</Text>
                </View>
              </View>
              
              <View style={styles.cardBody}>
                {/* Search box */}
                <View style={[styles.searchBox, { borderColor: C.border, backgroundColor: C.background }]}>
                  <Ionicons name="search" size={20} color={C.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: C.textPrimary }]}
                    placeholder="Search clinical specialties..."
                    placeholderTextColor={C.textSecondary}
                    value={searchDept}
                    onChangeText={setSearchDept}
                  />
                </View>

                {/* Gorgeous, colorful, dynamic 2-column grid */}
                <View style={styles.grid2Col}>
                  {filteredDepts.map(d => {
                    const isSelected = selectedDept === d.id;
                    const themeBg = scheme === 'light' ? d.bgLight : d.bgDark;
                    const activeDocs = doctorCounts[d.id] || 0;

                    return (
                      <TouchableOpacity
                        key={d.id}
                        style={[
                          styles.gridCard,
                          {
                            backgroundColor: isSelected ? d.color + '22' : themeBg,
                            borderColor: isSelected ? d.color : C.border,
                            borderWidth: isSelected ? 2.5 : 1
                          }
                        ]}
                        onPress={() => setSelectedDept(d.id)}
                        activeOpacity={0.8}
                      >
                        {/* Icon and Selection Dot */}
                        <View style={styles.cardTopRow}>
                          <View style={[styles.iconContainer, { backgroundColor: isSelected ? d.color : d.color + '15' }]}>
                            <MaterialCommunityIcons
                              name={d.icon}
                              size={24}
                              color={isSelected ? '#FFFFFF' : d.color}
                            />
                          </View>
                          {isSelected ? (
                            <View style={[styles.selectIndicator, { backgroundColor: d.color }]}>
                              <Ionicons name="checkmark" size={11} color="#fff" />
                            </View>
                          ) : (
                            <View style={[styles.selectIndicatorEmpty, { borderColor: C.border }]} />
                          )}
                        </View>

                        {/* Title */}
                        <Text style={[styles.cardTitleText, { color: C.textPrimary }]} numberOfLines={1}>
                          {d.name}
                        </Text>

                        {/* Description subtitle */}
                        <Text style={[styles.cardDescText, { color: C.textSecondary }]} numberOfLines={2}>
                          {d.desc}
                        </Text>

                        {/* Dynamic Count Badge */}
                        <View style={[styles.countPill, { backgroundColor: activeDocs > 0 ? '#DCFCE7' : C.border }]}>
                          <Text style={[styles.countText, { color: activeDocs > 0 ? '#15803D' : C.textSecondary }]}>
                            {activeDocs > 0 ? `🟢 ${activeDocs} Doctor${activeDocs > 1 ? 's' : ''}` : '⚪ No active docs'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* STEP 2: Doctor list selection */}
        {currentStep === 2 && (
          <View style={styles.section}>
            <View style={[styles.card, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: C.border }]}>
                <View style={[styles.iconBox, { backgroundColor: C.primaryBlue + '15' }]}>
                  <MaterialCommunityIcons name="doctor" size={24} color={C.primaryBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Choose Specialist</Text>
                  <Text style={[styles.cardSub, { color: C.textSecondary }]}>Available practitioners in {deptObj?.name}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                {filteredDoctors.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>👨‍⚕️</Text>
                    <Text style={{ color: C.textPrimary, fontSize: 16, fontWeight: '700' }}>No specialists registered.</Text>
                    <Text style={{ color: C.textSecondary, marginTop: 5, textAlign: 'center' }}>We couldn&apos;t find active doctors in this ward. Try another department.</Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {filteredDoctors.map(d => {
                      const isSelected = selectedDoctor === d.id;
                      return (
                        <TouchableOpacity
                          key={d.id}
                          style={[styles.docCard, { backgroundColor: isSelected ? C.primaryBlue + '10' : C.background, borderColor: isSelected ? C.primaryBlue : C.border }]}
                          onPress={() => setSelectedDoctor(d.id)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.docAvatar, { backgroundColor: deptObj?.color || C.primaryBlue }]}>
                            <Text style={styles.avatarText}>{d.name.split(' ').filter(n => n.toLowerCase() !== 'dr.').map(n => n[0]).join('') || 'DR'}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.docName, { color: C.textPrimary }]}>{d.name}</Text>
                            <Text style={[styles.docMeta, { color: C.textSecondary }]}>⭐ {d.rating} • {d.exp} • Next: {d.nextSlot}</Text>
                          </View>
                          <View style={[styles.availBadge, { backgroundColor: d.available > 0 ? '#10B981' : '#EF4444' }]}>
                            <Text style={styles.availText}>{d.available > 0 ? 'Online' : 'Offline'}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* STEP 3: Real-time time slot selector */}
        {currentStep === 3 && (
          <View style={styles.section}>
            {/* Blood donor banner */}
            <View style={[styles.donorBanner, { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }]}>
              <Text style={{ fontSize: 32 }}>🩸</Text>
              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <Text style={{ color: '#92400E', fontWeight: '800', fontSize: 15 }}>Are you an active Blood Donor?</Text>
                <Text style={{ color: '#A16207', fontSize: 12, marginTop: 2 }}>Unlock reserved donor-priority queues & VIP clinical slots!</Text>
              </View>
              <Switch value={isDonor} onValueChange={setIsDonor} trackColor={{ false: '#D1D5DB', true: '#F59E0B' }} thumbColor="#fff" />
            </View>

            <View style={[styles.card, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: C.border }]}>
                <View style={[styles.iconBox, { backgroundColor: C.primaryBlue + '15' }]}>
                  <MaterialCommunityIcons name="calendar-clock" size={24} color={C.primaryBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Choose Appointment Time</Text>
                  <Text style={[styles.cardSub, { color: C.textSecondary }]}>Select from live slots retrieved from doctor schedule</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                {/* Date navigator */}
                <View style={styles.dateNav}>
                  {(() => {
                    const minDate = getMinBookingDate();
                    const isBackDisabled = currentDate.getTime() <= minDate.getTime();
                    return (
                      <TouchableOpacity 
                        style={[styles.navBtn, { borderColor: C.border, opacity: isBackDisabled ? 0.3 : 1 }]} 
                        disabled={isBackDisabled} 
                        onPress={() => changeDate(-1)}
                      >
                        <Ionicons name="chevron-back" size={20} color={C.textPrimary} />
                      </TouchableOpacity>
                    );
                  })()}
                  <Text style={[styles.dateText, { color: C.textPrimary }]}>{currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                  {(() => {
                    const minDate = getMinBookingDate();
                    const maxDate = new Date(minDate);
                    maxDate.setDate(maxDate.getDate() + 7);
                    const isForwardDisabled = currentDate.getTime() >= maxDate.getTime();
                    return (
                      <TouchableOpacity 
                        style={[styles.navBtn, { borderColor: C.border, opacity: isForwardDisabled ? 0.3 : 1 }]} 
                        disabled={isForwardDisabled} 
                        onPress={() => changeDate(1)}
                      >
                        <Ionicons name="chevron-forward" size={20} color={C.textPrimary} />
                      </TouchableOpacity>
                    );
                  })()}
                </View>

                {/* Slots grid */}
                <View style={styles.slotsGrid}>
                  {slots.map((s, idx) => {
                    const time12 = format24to12(s.time) || s.time;
                    const isDonorSlot = idx % 4 === 1;
                    const isBooked = !s.available;
                    const isDisabled = isBooked || (isDonorSlot && !isDonor);
                    const isSelected = selectedSlot === s.time || selectedSlot === time12;

                    return (
                      <TouchableOpacity
                        key={s.time || idx}
                        disabled={isDisabled}
                        onPress={() => setSelectedSlot(time12)}
                        style={[styles.slotItem,
                          isSelected ? { backgroundColor: C.primaryBlue, borderColor: C.primaryBlue }
                          : isDisabled && isBooked ? { backgroundColor: C.background, borderColor: C.border, opacity: 0.5 }
                          : isDisabled && isDonorSlot ? { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', opacity: 0.6 }
                          : isDonorSlot && !isBooked ? { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }
                          : { backgroundColor: C.background, borderColor: C.border }
                        ]}
                      >
                        {isDonorSlot && !isBooked && !isSelected && <Ionicons name="star" size={10} color="#F59E0B" style={{ position: 'absolute', top: 4, right: 4 }} />}
                        <Text style={[styles.slotTime, { color: isSelected ? '#fff' : isDisabled ? C.textSecondary : C.textPrimary }]}>{time12}</Text>
                        {isDonorSlot && !isBooked && <Text style={[styles.slotSub, { color: isSelected ? 'rgba(255,255,255,0.8)' : '#A16207' }]}>Donor Slot</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Symptoms / Notes section */}
            <View style={{ marginTop: 20 }}>
              <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>What symptoms are you experiencing?</Text>
              <View style={styles.sympGrid}>
                {SYMPTOMS.map((symp) => {
                  const isSelected = selectedSymptoms.includes(symp.name);
                  return (
                    <TouchableOpacity
                      key={symp.id}
                      style={[styles.sympChip, { backgroundColor: isSelected ? C.primaryBlue + '15' : C.background, borderColor: isSelected ? C.primaryBlue : C.border }]}
                      onPress={() => toggleSymptom(symp.name)}
                    >
                      <Ionicons name={symp.icon} size={16} color={isSelected ? C.primaryBlue : C.textSecondary} />
                      <Text style={[styles.sympText, { color: isSelected ? C.primaryBlue : C.textPrimary }]}>{symp.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sectionTitle, { color: C.textPrimary, marginTop: 20 }]}>Additional Details</Text>
              <TextInput
                style={[styles.textArea, { borderColor: C.border, color: C.textPrimary, backgroundColor: C.cardWhite }]}
                placeholder="Write any symptoms or history details for the physician..."
                placeholderTextColor={C.textSecondary}
                value={details}
                onChangeText={setDetails}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        )}

        {/* STEP 4: Confirm Booking details */}
        {currentStep === 4 && (
          <View style={styles.section}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={styles.successCheck}>
                <Ionicons name="shield-checkmark" size={40} color="#fff" />
              </View>
              <Text style={[styles.h1, { color: C.textPrimary }]}>Verify Details</Text>
              <Text style={[styles.subText, { color: C.textSecondary }]}>Confirm your clinical consultation slot</Text>
            </View>

            <View style={[styles.card, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: C.border }]}>
                <View style={[styles.iconBox, { backgroundColor: C.primaryBlue + '15' }]}>
                  <MaterialCommunityIcons name="clipboard-text" size={24} color={C.primaryBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Summary of Appointment</Text>
                  <Text style={[styles.cardSub, { color: C.textSecondary }]}>Please make sure all details match your requirement</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={[styles.summaryBox, { backgroundColor: C.background, borderColor: C.border }]}>
                  <View style={[styles.summaryRow, { borderBottomColor: C.border }]}>
                    <Text style={[styles.sumLabel, { color: C.textSecondary }]}>Department</Text>
                    <Text style={[styles.sumVal, { color: C.textPrimary }]}>{deptObj?.name}</Text>
                  </View>
                  <View style={[styles.summaryRow, { borderBottomColor: C.border }]}>
                    <Text style={[styles.sumLabel, { color: C.textSecondary }]}>Doctor</Text>
                    <Text style={[styles.sumVal, { color: C.textPrimary }]}>{docObj?.name}</Text>
                  </View>
                  <View style={[styles.summaryRow, { borderBottomColor: C.border }]}>
                    <Text style={[styles.sumLabel, { color: C.textSecondary }]}>Date & Time</Text>
                    <Text style={[styles.sumVal, { color: C.textPrimary }]}>{currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {selectedSlot}</Text>
                  </View>
                  <View style={[styles.summaryRow, { backgroundColor: '#FFFBEB', marginHorizontal: -15, paddingHorizontal: 15, borderBottomColor: C.border }]}>
                    <Text style={[styles.sumLabel, { color: '#92400E' }]}>Queue Priority</Text>
                    <View style={styles.queueBadge}><Text style={styles.queueText}>{isDonor ? '⭐ Donor Priority #3' : 'Standard Queue'}</Text></View>
                  </View>
                  <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                    <Text style={[styles.sumLabel, { color: C.textSecondary }]}>Est. Wait Time</Text>
                    <Text style={[styles.sumVal, { color: '#10B981', fontWeight: '800' }]}>{isDonor ? '~15 mins' : '~40 mins'}</Text>
                  </View>
                </View>

                {isDonor && (
                  <View style={styles.donorThanks}>
                    <Text style={styles.donorThanksTitle}>🩸 Donor Priority Active</Text>
                    <Text style={styles.donorThanksDesc}>Thank you for your active donations. BHB fast-tracks active blood donors to appreciate your life-saving service.</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Persistent Footer Panel */}
      <View style={[styles.footer, { backgroundColor: C.cardWhite, borderTopColor: C.border }]}>
        {currentStep > 1 && (
          <TouchableOpacity style={[styles.btn, { backgroundColor: C.background, borderColor: C.border, borderWidth: 1 }]} onPress={handleBack}>
            <Text style={[styles.btnText, { color: C.textPrimary }]}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.btn, styles.btnPrimary, { backgroundColor: currentStep === 4 ? '#10B981' : C.primaryBlue, flex: 2 }]} 
          onPress={handleNext}
          disabled={booking}
        >
          {booking ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.btnText, { color: '#fff' }]}>{currentStep === 4 ? 'Confirm Appointment ✓' : 'Continue →'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 110 },
  progressContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 18, elevation: 4, position: 'relative' },
  progressLine: { position: 'absolute', height: 3, top: 35, left: 35, right: 35, zIndex: 1 },
  progressFill: { position: 'absolute', height: 3, top: 35, left: 35, zIndex: 2 },
  stepItem: { alignItems: 'center', zIndex: 3, paddingHorizontal: 5, backgroundColor: 'transparent' },
  stepCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 13, fontWeight: '700' },
  stepLabel: { fontSize: 10, fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },

  section: { marginBottom: 20 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', elevation: 2 },
  cardHeader: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  cardSub: { fontSize: 12, fontWeight: '500', marginTop: 2, lineHeight: 16 },
  cardBody: { padding: 16 },

  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, height: 48, marginBottom: 16, gap: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  
  // Premium 2-Column Select Department Grid Styling
  grid2Col: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  gridCard: { 
    width: '48%', 
    borderRadius: 16, 
    padding: 14, 
    marginBottom: 4, 
    borderWidth: 1, 
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconContainer: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  selectIndicator: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  selectIndicatorEmpty: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  cardTitleText: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  cardDescText: { fontSize: 11, fontWeight: '500', lineHeight: 14, height: 28, marginBottom: 10 },
  countPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  countText: { fontSize: 9.5, fontWeight: '700' },

  docCard: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 2, alignItems: 'center', gap: 16 },
  docAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  docName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  docMeta: { fontSize: 12, fontWeight: '600' },
  availBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  availText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyState: { alignItems: 'center', padding: 30 },

  donorBanner: { padding: 16, borderRadius: 16, borderWidth: 2, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dateNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navBtn: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 18, fontWeight: '800' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotItem: { width: '31%', paddingVertical: 12, borderRadius: 8, borderWidth: 2, alignItems: 'center', position: 'relative' },
  slotTime: { fontSize: 13, fontWeight: '700' },
  slotSub: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  sympGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sympChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, gap: 8 },
  sympText: { fontSize: 14, fontWeight: '600' },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top' },

  successCheck: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 16, elevation: 4 },
  h1: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subText: { fontSize: 14, fontWeight: '500' },
  summaryBox: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  sumLabel: { fontSize: 14, fontWeight: '500' },
  sumVal: { fontSize: 14, fontWeight: '800' },
  queueBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  queueText: { color: '#92400E', fontSize: 11, fontWeight: '800' },
  donorThanks: { backgroundColor: '#FEF3C7', padding: 15, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#F59E0B', marginTop: 16 },
  donorThanksTitle: { color: '#92400E', fontWeight: '800', marginBottom: 4 },
  donorThanksDesc: { color: '#A16207', fontSize: 12, lineHeight: 18 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 16, paddingBottom: 24, gap: 12, borderTopWidth: 1, elevation: 8 },
  btn: { flex: 1, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { elevation: 4 },
  btnText: { fontSize: 16, fontWeight: '700' }
});
