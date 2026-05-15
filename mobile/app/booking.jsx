import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';

// Data
const DEPARTMENTS = [
    { id: 'cardiology', name: 'Cardiology', icon: 'heart', desc: 'Heart & vascular care' },
    { id: 'neurology', name: 'Neurology', icon: 'brain', desc: 'Brain & nervous system' },
    { id: 'orthopedics', name: 'Orthopedics', icon: 'body', desc: 'Bones & joints' },
    { id: 'pediatrics', name: 'Pediatrics', icon: 'happy', desc: 'Child healthcare' },
    { id: 'ent', name: 'ENT', icon: 'ear', desc: 'Ear, nose & throat' },
    { id: 'dermatology', name: 'Dermatology', icon: 'color-palette', desc: 'Skin conditions' },
    { id: 'ophthalmology', name: 'Eye Care', icon: 'eye', desc: 'Vision & eye health' },
    { id: 'gastroenterology', name: 'Gastroenterology', icon: 'restaurant', desc: 'Digestive system' }
];

const DOCTORS = [
    { id: 1, name: 'Dr. Sarah Johnson', dept: 'cardiology', exp: '15 years', rating: 4.9, available: 3, nextSlot: '10:30 AM' },
    { id: 2, name: 'Dr. Michael Chen', dept: 'cardiology', exp: '12 years', rating: 4.8, available: 1, nextSlot: '2:00 PM' },
    { id: 3, name: 'Dr. Emily Williams', dept: 'cardiology', exp: '8 years', rating: 4.7, available: 5, nextSlot: '9:00 AM' },
    { id: 4, name: 'Dr. James Wilson', dept: 'neurology', exp: '20 years', rating: 4.9, available: 2, nextSlot: '11:00 AM' },
    { id: 5, name: 'Dr. Priya Sharma', dept: 'orthopedics', exp: '10 years', rating: 4.8, available: 4, nextSlot: '10:00 AM' }
];

const SYMPTOMS = [
    { id: 'chest-pain', name: 'Chest Pain', icon: 'heart-disarm' },
    { id: 'breath-shortness', name: 'Shortness of Breath', icon: 'water' },
    { id: 'headache', name: 'Severe Headache', icon: 'fitness' },
    { id: 'fever', name: 'Fever', icon: 'thermometer' },
    { id: 'dizziness', name: 'Dizziness', icon: 'sync' },
    { id: 'fatigue', name: 'Extreme Fatigue', icon: 'bed' },
    { id: 'nausea', name: 'Nausea/Vomiting', icon: 'pizza' },
    { id: 'pain', name: 'Joint Pain', icon: 'body' }
];

const URGENCIES = [
    { id: 'routine', label: 'Routine Checkup', desc: 'Non-urgent, regular visit', icon: 'checkmark-circle-outline', color: '#10B981' },
    { id: 'priority', label: 'Priority', desc: 'Moderate discomfort', icon: 'alert-circle-outline', color: '#F59E0B' },
    { id: 'emergency', label: 'Emergency', desc: 'Severe pain/urgent care', icon: 'warning-outline', color: '#EF4444', isEmergency: true }
];

const TIMESLOTS = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM'
];

export default function BookingScreen() {
    const scheme = useColorScheme() ?? 'light';
    const C = Colors[scheme];

    // State
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedDept, setSelectedDept] = useState(null);
    const [searchDept, setSearchDept] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isDonor, setIsDonor] = useState(false);
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [selectedUrgency, setSelectedUrgency] = useState(null);
    const [details, setDetails] = useState('');

    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: (currentStep - 1) * 33.33,
            duration: 300,
            useNativeDriver: false
        }).start();
    }, [currentStep]);

    const handleNext = () => {
        if (currentStep === 1 && !selectedDept) return alert('Please select a department');
        if (currentStep === 2 && !selectedDoctor) return alert('Please select a doctor');
        if (currentStep === 3 && !selectedSlot) return alert('Please select a time slot');

        if (currentStep < 4) {
            setCurrentStep(c => c + 1);
        } else {
            // Confirm Booking
            alert('Appointment Confirmed!');
            router.push('/');
        }
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(c => c - 1);
        else router.back();
    };

    const toggleSymptom = (id) => {
        setSelectedSymptoms(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const changeDate = (days) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + days);
        setCurrentDate(d);
        setSelectedSlot(null);
    };

    const filteredDepts = DEPARTMENTS.filter(d => d.name.toLowerCase().includes(searchDept.toLowerCase()));
    const filteredDoctors = DOCTORS.filter(d => d.dept === selectedDept);

    // Derived
    const deptObj = DEPARTMENTS.find(d => d.id === selectedDept);
    const docObj = DOCTORS.find(d => d.id === selectedDoctor);

    return (
        <ScreenWrapper>
            <AppHeader title="Book Appointment" onBack={handleBack} />

            {/* Progress Indicator */}
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
                
                {/* STEP 1: Department */}
                {currentStep === 1 && (
                    <View style={styles.section}>
                        <View style={[styles.card, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                            <View style={[styles.cardHeader, { borderBottomColor: C.border }]}>
                                <View style={[styles.iconBox, { backgroundColor: C.primaryBlue + '20' }]}><Ionicons name="medical" size={24} color={C.primaryBlue} /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Select Department</Text>
                                    <Text style={[styles.cardSub, { color: C.textSecondary }]}>Choose the specialty for your visit</Text>
                                </View>
                            </View>
                            <View style={styles.cardBody}>
                                <View style={[styles.searchBox, { borderColor: C.border, backgroundColor: C.background }]}>
                                    <Ionicons name="search" size={20} color={C.textSecondary} />
                                    <TextInput 
                                        style={[styles.searchInput, { color: C.textPrimary }]} 
                                        placeholder="Search departments..." 
                                        placeholderTextColor={C.textSecondary}
                                        value={searchDept}
                                        onChangeText={setSearchDept}
                                    />
                                </View>



                                <View style={styles.grid}>
                                    {filteredDepts.map(d => {
                                        const isSelected = selectedDept === d.id;
                                        return (
                                            <TouchableOpacity 
                                                key={d.id} 
                                                style={[styles.gridItem, { backgroundColor: isSelected ? C.primaryBlue + '15' : C.background, borderColor: isSelected ? C.primaryBlue : C.border }]}
                                                onPress={() => setSelectedDept(d.id)}
                                                activeOpacity={0.7}
                                            >
                                                {isSelected && <View style={[styles.checkBadge, { backgroundColor: C.primaryBlue }]}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
                                                <Ionicons name={d.icon} size={32} color={isSelected ? C.primaryBlue : C.textSecondary} style={{ marginBottom: 10 }} />
                                                <Text style={[styles.gridText, { color: isSelected ? C.primaryBlue : C.textPrimary }]}>{d.name}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* STEP 2: Doctor */}
                {currentStep === 2 && (
                    <View style={styles.section}>
                        <View style={[styles.card, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                            <View style={[styles.cardHeader, { borderBottomColor: C.border }]}>
                                <View style={[styles.iconBox, { backgroundColor: C.primaryBlue + '20' }]}><Ionicons name="person" size={24} color={C.primaryBlue} /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Choose Your Doctor</Text>
                                    <Text style={[styles.cardSub, { color: C.textSecondary }]}>Available specialists in {deptObj?.name}</Text>
                                </View>
                            </View>
                            <View style={styles.cardBody}>
                                {filteredDoctors.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Text style={{ fontSize: 40, marginBottom: 10 }}>👨‍⚕️</Text>
                                        <Text style={{ color: C.textPrimary, fontSize: 16, fontWeight: '600' }}>No doctors available today.</Text>
                                        <Text style={{ color: C.textSecondary, marginTop: 5 }}>Please try another department.</Text>
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
                                                    <View style={[styles.docAvatar, { backgroundColor: C.primaryBlue }]}><Text style={styles.avatarText}>{d.name.split(' ').map(n=>n[0]).join('')}</Text></View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[styles.docName, { color: C.textPrimary }]}>{d.name}</Text>
                                                        <Text style={[styles.docMeta, { color: C.textSecondary }]}>⭐ {d.rating} • {d.exp} • Next: {d.nextSlot}</Text>
                                                    </View>
                                                    <View style={[styles.availBadge, { backgroundColor: d.available < 2 ? '#F59E0B' : '#10B981' }]}>
                                                        <Text style={styles.availText}>{d.available} left</Text>
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

                {/* STEP 3: Time Slot */}
                {currentStep === 3 && (
                    <View style={styles.section}>
                        <View style={[styles.donorBanner, { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }]}>
                            <Text style={{ fontSize: 32 }}>🩸</Text>
                            <View style={{ flex: 1, marginHorizontal: 10 }}>
                                <Text style={{ color: '#92400E', fontWeight: '800', fontSize: 16 }}>Are you a Blood Donor?</Text>
                                <Text style={{ color: '#A16207', fontSize: 12, marginTop: 2 }}>Donors get priority queues & reserved slots!</Text>
                            </View>
                            <Switch value={isDonor} onValueChange={setIsDonor} trackColor={{ false: '#D1D5DB', true: '#F59E0B' }} thumbColor="#fff" />
                        </View>

                        <View style={[styles.card, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                            <View style={[styles.cardHeader, { borderBottomColor: C.border }]}>
                                <View style={[styles.iconBox, { backgroundColor: C.primaryBlue + '20' }]}><Ionicons name="calendar" size={24} color={C.primaryBlue} /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Select Time Slot</Text>
                                    <Text style={[styles.cardSub, { color: C.textSecondary }]}>30-minute appointments</Text>
                                </View>
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.dateNav}>
                                    <TouchableOpacity style={[styles.navBtn, { borderColor: C.border }]} onPress={() => changeDate(-1)}><Ionicons name="chevron-back" size={20} color={C.textPrimary} /></TouchableOpacity>
                                    <Text style={[styles.dateText, { color: C.textPrimary }]}>{currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                                    <TouchableOpacity style={[styles.navBtn, { borderColor: C.border }]} onPress={() => changeDate(1)}><Ionicons name="chevron-forward" size={20} color={C.textPrimary} /></TouchableOpacity>
                                </View>

                                <View style={styles.slotsGrid}>
                                    {TIMESLOTS.map((time, idx) => {
                                        const isBooked = [2, 5, 8, 11].includes(idx);
                                        const isDonorSlot = [1, 4, 7, 10].includes(idx);
                                        const isDisabled = isBooked || (isDonorSlot && !isDonor);
                                        const isSelected = selectedSlot === time;

                                        return (
                                            <TouchableOpacity
                                                key={time}
                                                disabled={isDisabled}
                                                onPress={() => setSelectedSlot(time)}
                                                style={[styles.slotItem, 
                                                    isSelected ? { backgroundColor: C.primaryBlue, borderColor: C.primaryBlue } 
                                                    : isDisabled && isBooked ? { backgroundColor: C.background, borderColor: C.border, opacity: 0.5 }
                                                    : isDisabled && isDonorSlot ? { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', opacity: 0.6 }
                                                    : isDonorSlot && !isBooked ? { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }
                                                    : { backgroundColor: C.background, borderColor: C.border }
                                                ]}
                                            >
                                                {isDonorSlot && !isBooked && !isSelected && <Ionicons name="star" size={10} color="#F59E0B" style={{ position: 'absolute', top: 4, right: 4 }} />}
                                                <Text style={[styles.slotTime, { color: isSelected ? '#fff' : isDisabled ? C.textSecondary : C.textPrimary }]}>{time}</Text>
                                                {isDonorSlot && !isBooked && <Text style={[styles.slotSub, { color: isSelected ? '#rgba(255,255,255,0.8)' : '#A16207' }]}>Donor Slot</Text>}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* STEP 4: Confirm */}
                {currentStep === 4 && (
                    <View style={styles.section}>
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <View style={styles.successCheck}>
                                <Ionicons name="checkmark" size={40} color="#fff" />
                            </View>
                            <Text style={[styles.h1, { color: C.textPrimary }]}>Ready to Confirm!</Text>
                            <Text style={[styles.subText, { color: C.textSecondary }]}>Review your appointment details below</Text>
                        </View>

                        <View style={[styles.card, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                            <View style={[styles.cardHeader, { borderBottomColor: C.border }]}>
                                <View style={[styles.iconBox, { backgroundColor: C.primaryBlue + '20' }]}><Ionicons name="list" size={24} color={C.primaryBlue} /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Appointment Summary</Text>
                                    <Text style={[styles.cardSub, { color: C.textSecondary }]}>Please verify all details are correct</Text>
                                </View>
                            </View>
                            <View style={styles.cardBody}>
                                <View style={[styles.summaryBox, { backgroundColor: C.background, borderColor: C.border }]}>
                                    <View style={[styles.summaryRow, { borderBottomColor: C.border }]}><Text style={[styles.sumLabel, { color: C.textSecondary }]}>Department</Text><Text style={[styles.sumVal, { color: C.textPrimary }]}>{deptObj?.name}</Text></View>
                                    <View style={[styles.summaryRow, { borderBottomColor: C.border }]}><Text style={[styles.sumLabel, { color: C.textSecondary }]}>Doctor</Text><Text style={[styles.sumVal, { color: C.textPrimary }]}>{docObj?.name}</Text></View>
                                    <View style={[styles.summaryRow, { borderBottomColor: C.border }]}><Text style={[styles.sumLabel, { color: C.textSecondary }]}>Date & Time</Text><Text style={[styles.sumVal, { color: C.textPrimary }]}>{currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}, {selectedSlot}</Text></View>
                                    <View style={[styles.summaryRow, { backgroundColor: '#FFFBEB', marginHorizontal: -15, paddingHorizontal: 15, borderBottomColor: C.border }]}>
                                        <Text style={[styles.sumLabel, { color: '#92400E' }]}>Queue Position</Text>
                                        <View style={styles.queueBadge}><Text style={styles.queueText}>⭐ {isDonor ? 'Priority #3 (Donor)' : 'Standard #8'}</Text></View>
                                    </View>
                                    <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}><Text style={[styles.sumLabel, { color: C.textSecondary }]}>Est. Wait</Text><Text style={[styles.sumVal, { color: '#10B981', fontWeight: '800' }]}>{isDonor ? '~25 mins' : '~45 mins'}</Text></View>
                                </View>

                                {isDonor && (
                                    <View style={styles.donorThanks}>
                                        <Text style={styles.donorThanksTitle}>🩸 Donor Priority Active</Text>
                                        <Text style={styles.donorThanksDesc}>As an active blood donor, you've been moved ahead in the queue. Thank you for saving lives!</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                )}

            </ScrollView>

            <View style={[styles.footer, { backgroundColor: C.cardWhite, borderTopColor: C.border }]}>
                {currentStep > 1 && (
                    <TouchableOpacity style={[styles.btn, { backgroundColor: C.background, borderColor: C.border, borderWidth: 1 }]} onPress={handleBack}>
                        <Text style={[styles.btnText, { color: C.textPrimary }]}>Back</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.btn, styles.btnPrimary, { backgroundColor: currentStep === 4 ? '#DC2626' : C.primaryBlue, flex: 2 }]} onPress={handleNext}>
                    <Text style={[styles.btnText, { color: '#fff' }]}>{currentStep === 4 ? 'Confirm Appointment ✓' : 'Continue →'}</Text>
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    content: { padding: 16, paddingBottom: 100 },
    progressContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, elevation: 4, position: 'relative' },
    progressLine: { position: 'absolute', height: 3, top: 35, left: 30, right: 30, zIndex: 1 },
    progressFill: { position: 'absolute', height: 3, top: 35, left: 30, zIndex: 2 },
    stepItem: { alignItems: 'center', zIndex: 3, paddingHorizontal: 5, backgroundColor: 'transparent' },
    stepCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    stepNum: { fontSize: 13, fontWeight: '700' },
    stepLabel: { fontSize: 10, fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },

    section: { marginBottom: 20 },
    card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', elevation: 2 },
    cardHeader: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, alignItems: 'center', gap: 12 },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 18, fontWeight: '800' },
    cardSub: { fontSize: 13, fontWeight: '500', marginTop: 2 },
    cardBody: { padding: 16 },

    searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, height: 48, marginBottom: 16, gap: 10 },
    searchInput: { flex: 1, fontSize: 15 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: '31%', padding: 16, borderRadius: 12, borderWidth: 2, alignItems: 'center', position: 'relative' },
    gridText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
    checkBadge: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

    aiBox: { borderRadius: 12, padding: 16, marginBottom: 20 },
    aiHeader: { flexDirection: 'row', marginBottom: 12 },
    aiBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    aiBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    aiTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 },
    aiRecInner: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#60A5FA' },
    aiDeptText: { color: '#60A5FA', fontSize: 15, fontWeight: '700', marginBottom: 4 },
    aiDescText: { color: '#fff', fontSize: 13, opacity: 0.9, lineHeight: 18 },

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
    slotTime: { fontSize: 14, fontWeight: '700' },
    slotSub: { fontSize: 10, fontWeight: '600', marginTop: 2 },

    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    sympGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    sympChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, gap: 8 },
    sympText: { fontSize: 14, fontWeight: '600' },
    urgencyCard: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 2, alignItems: 'center' },
    urgencyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    urgencyDesc: { fontSize: 13, fontWeight: '500' },
    textArea: { borderWidth: 1, borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top' },

    successCheck: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 16, elevation: 4 },
    h1: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
    subText: { fontSize: 14, fontWeight: '500' },
    summaryBox: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 5 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    sumLabel: { fontSize: 14, fontWeight: '500' },
    sumVal: { fontSize: 14, fontWeight: '800' },
    queueBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    queueText: { color: '#92400E', fontSize: 12, fontWeight: '800' },
    donorThanks: { backgroundColor: '#FEF3C7', padding: 15, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#F59E0B', marginTop: 16 },
    donorThanksTitle: { color: '#92400E', fontWeight: '800', marginBottom: 4 },
    donorThanksDesc: { color: '#A16207', fontSize: 12, lineHeight: 18 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 16, paddingBottom: 24, gap: 12, borderTopWidth: 1, elevation: 8 },
    btn: { flex: 1, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    btnPrimary: { elevation: 4 },
    btnText: { fontSize: 16, fontWeight: '700' }
});
