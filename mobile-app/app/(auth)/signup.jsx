import React, { useState, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator, 
    Platform,
    Alert,
    Dimensions,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import PressableScale from '@/components/ui/PressableScale';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { API_BASE_URL } from '@/constants/api';

const { width } = Dimensions.get('window');

const triggerHaptic = async (type) => {
    try {
        if (type === 'light') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (type === 'medium') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (type === 'success') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (type === 'error') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    } catch (_) {}
};

export default function SignupScreen() {
    const scheme = useColorScheme() ?? 'light';
    const C = Colors[scheme];
    const { login } = useAuth();

    // Inputs state
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [password, setPassword] = useState('');

    // DOB Picker States
    const [showDatePickerModal, setShowDatePickerModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState(1998);
    const [selectedMonth, setSelectedMonth] = useState(5);
    const [selectedDay, setSelectedDay] = useState(15);

    const yearsList = Array.from({ length: 87 }, (_, i) => 2026 - i);
    const monthsList = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const getDaysInMonth = (month, year) => {
        return new Date(year, month, 0).getDate();
    };
    const maxDays = getDaysInMonth(selectedMonth, selectedYear);
    const daysList = Array.from({ length: maxDays }, (_, i) => i + 1);

    const parseDob = (dobString) => {
        let year = 1998;
        let month = 5;
        let day = 15;
        if (dobString && dobString.includes('-')) {
            const parts = dobString.split('-');
            if (parts.length === 3) {
                const y = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10);
                const d = parseInt(parts[2], 10);
                if (!isNaN(y)) year = y;
                if (!isNaN(m)) month = m;
                if (!isNaN(d)) day = d;
            }
        }
        setSelectedYear(year);
        setSelectedMonth(month);
        setSelectedDay(day);
    };

    const handleOpenDatePicker = () => {
        triggerHaptic('light');
        parseDob(dob);
        setShowDatePickerModal(true);
    };

    const handleConfirmDate = () => {
        triggerHaptic('success');
        const formattedMonth = String(selectedMonth).padStart(2, '0');
        const formattedDay = String(selectedDay).padStart(2, '0');
        setDob(`${selectedYear}-${formattedMonth}-${formattedDay}`);
        setShowDatePickerModal(false);
    };

    // Interactive UI states
    const [focusedField, setFocusedField] = useState(null); // 'name', 'dob', 'phone', 'email', 'address', 'password'
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name.trim()) {
            triggerHaptic('error');
            Alert.alert('Missing Field', 'Please enter your full name as per Aadhaar.');
            return;
        }
        if (!dob) {
            triggerHaptic('error');
            Alert.alert('Missing Field', 'Please enter your Date of Birth.');
            return;
        }
        if (!phone.trim()) {
            triggerHaptic('error');
            Alert.alert('Missing Field', 'Please enter your 10-digit mobile number.');
            return;
        }
        const cleanPhone = phone.trim().replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
            triggerHaptic('error');
            Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
            return;
        }
        if (!email.trim()) {
            triggerHaptic('error');
            Alert.alert('Missing Field', 'Please enter your email address.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            triggerHaptic('error');
            Alert.alert('Invalid Email', 'Please enter a valid email address (e.g. name@domain.com).');
            return;
        }
        if (!address.trim()) {
            triggerHaptic('error');
            Alert.alert('Missing Field', 'Please enter your residential address.');
            return;
        }
        if (!password || password.length < 6) {
            triggerHaptic('error');
            Alert.alert('PIN Error', 'Security Password/PIN must be at least 6 characters.');
            return;
        }

        try {
            setLoading(true);
            triggerHaptic('medium');

            const formattedPhone = `+91${cleanPhone}`;

            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: name.trim(), 
                    email: email.trim(), 
                    phone: formattedPhone, 
                    password,
                    dob,
                    address: address.trim(),
                    bloodGroup: bloodGroup || undefined
                })
            });

            const data = await response.json();
            setLoading(false);

            if (response.ok) {
                triggerHaptic('success');
                Alert.alert(
                    '🇮🇳 Verification Link Sent!', 
                    `Namaste ${name.trim()}.\n\nA secure welcome & identity verification email has been successfully dispatched to:\n${email.trim()}\n\nPlease check your email inbox and click the magic link on this device to verify your identity and instantly launch the app.`,
                    [
                        { 
                            text: 'Got it', 
                            onPress: () => {
                                triggerHaptic('light');
                                router.replace('/(auth)/login');
                            }
                        }
                    ]
                );
            } else {
                triggerHaptic('error');
                Alert.alert('Registration Failed', data.error || 'Failed to create your account.');
            }
        } catch (err) {
            setLoading(false);
            triggerHaptic('error');
            console.error('Registration network error:', err);
            Alert.alert(
                'Connection Failure',
                `Unable to reach the server at ${API_BASE_URL}.\n\nIf you are on an emulator, please check that your host server is running and accessible.`,
                [{ text: 'Dismiss' }]
            );
        }
    };

    // Calculate dynamic glowing border color
    const getBorderColor = (fieldName) => {
        return focusedField === fieldName ? C.primaryBlue : C.border;
    };

    return (
        <ScreenWrapper scroll={false}>
            <ScrollView 
                contentContainerStyle={[
                    styles.container, 
                    { 
                        backgroundColor: C.background,
                        flexGrow: 1,
                        justifyContent: 'space-between'
                    }
                ]} 
                showsVerticalScrollIndicator={false}
            >
                {/* FLOATING PREMIUM GLOW GRAPHICS (Tricolor Themed) */}
                <View style={styles.glowBg}>
                    <LinearGradient 
                        colors={['#FF993312', 'transparent']} 
                        style={styles.circleLeft} 
                    />
                    <LinearGradient 
                        colors={['#1388080E', 'transparent']} 
                        style={styles.circleRight} 
                    />
                </View>

                {/* TOP CONTAINER */}
                <View style={{ flex: 1, width: '100%' }}>
                    {/* HEADER SECTION */}
                    <View style={styles.header}>
                        <TouchableOpacity 
                            onPress={() => {
                                triggerHaptic('light');
                                router.back();
                            }} 
                            style={[
                                styles.backBtn, 
                                { 
                                    backgroundColor: scheme === 'dark' ? 'rgba(31, 41, 55, 0.7)' : 'rgba(243, 244, 246, 0.8)', 
                                    borderColor: C.border 
                                }
                            ]}
                        >
                            <Ionicons name="chevron-back" size={20} color={C.primaryBlue} />
                        </TouchableOpacity>
                        
                        <Text style={[styles.title, { color: C.textPrimary }]}>Create Health ID</Text>
                        <Text style={[styles.subtitle, { color: C.textSecondary }]}>
                            Join India&apos;s unified EMR & digital health gateway
                        </Text>
                    </View>

                    {/* FORM INPUTS */}
                    <View style={styles.form}>
                        {/* Full Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: C.textSecondary }]}>Full Name</Text>
                            <View 
                                style={[
                                    styles.inputBox, 
                                    { 
                                        borderColor: getBorderColor('name'),
                                        backgroundColor: C.cardWhite 
                                    }
                                ]}
                            >
                                <Ionicons 
                                    name="person-outline" 
                                    size={20} 
                                    color={focusedField === 'name' ? C.primaryBlue : C.textSecondary} 
                                    style={{ marginRight: 12 }} 
                                />
                                <TextInput
                                    placeholder="As per Aadhaar Card"
                                    placeholderTextColor={C.textSecondary + '70'}
                                    style={[styles.input, { color: C.textPrimary }]}
                                    value={name}
                                    onChangeText={setName}
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Date of Birth Input */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: C.textSecondary }]}>Date of Birth</Text>
                            <TouchableOpacity 
                                onPress={handleOpenDatePicker}
                                style={[
                                    styles.inputBox, 
                                    { 
                                        borderColor: getBorderColor('dob'),
                                        backgroundColor: C.cardWhite 
                                    }
                                ]}
                            >
                                <Ionicons 
                                    name="calendar-outline" 
                                    size={20} 
                                    color={focusedField === 'dob' ? C.primaryBlue : C.textSecondary} 
                                    style={{ marginRight: 12 }} 
                                />
                                <Text style={[styles.input, { color: dob ? C.textPrimary : C.textSecondary + '70', paddingVertical: 16 }]}>
                                    {dob ? dob : 'Select Date of Birth'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Mobile Number Input */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: C.textSecondary }]}>
                                Mobile Number
                            </Text>
                            <View 
                                style={[
                                    styles.inputBox, 
                                    { 
                                        borderColor: getBorderColor('phone'),
                                        backgroundColor: C.cardWhite 
                                    }
                                ]}
                            >
                                <Text style={[styles.prefix, { color: C.textPrimary }]}>+91</Text>
                                <TextInput
                                    placeholder="10 digit number"
                                    placeholderTextColor={C.textSecondary + '70'}
                                    keyboardType="number-pad"
                                    style={[styles.input, { color: C.textPrimary }]}
                                    value={phone}
                                    onChangeText={setPhone}
                                    onFocus={() => setFocusedField('phone')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: C.textSecondary }]}>
                                Email Address
                            </Text>
                            <View 
                                style={[
                                    styles.inputBox, 
                                    { 
                                        borderColor: getBorderColor('email'),
                                        backgroundColor: C.cardWhite 
                                    }
                                ]}
                            >
                                <Ionicons 
                                    name="mail-outline" 
                                    size={20} 
                                    color={focusedField === 'email' ? C.primaryBlue : C.textSecondary} 
                                    style={{ marginRight: 12 }} 
                                />
                                <TextInput
                                    placeholder="name@example.com"
                                    placeholderTextColor={C.textSecondary + '70'}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={[styles.input, { color: C.textPrimary }]}
                                    value={email}
                                    onChangeText={setEmail}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Blood Group Input (Optional) */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: C.textSecondary }]}>Blood Group (Optional)</Text>
                            <View style={styles.bloodGroupRow}>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => {
                                    const selected = bloodGroup === bg;
                                    return (
                                        <TouchableOpacity
                                            key={bg}
                                            onPress={() => {
                                                triggerHaptic('light');
                                                setBloodGroup(selected ? '' : bg);
                                            }}
                                            style={[
                                                styles.bloodGroupBadge,
                                                {
                                                    backgroundColor: selected ? C.primaryBlue : C.cardWhite,
                                                    borderColor: selected ? C.primaryBlue : C.border,
                                                }
                                            ]}
                                        >
                                            <Text 
                                                style={[
                                                    styles.bloodGroupBadgeText, 
                                                    { 
                                                        color: selected ? '#FFF' : C.textPrimary,
                                                        fontWeight: selected ? '900' : '700' 
                                                    }
                                                ]}
                                            >
                                                {bg}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Address Input */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: C.textSecondary }]}>Residential Address</Text>
                            <View 
                                style={[
                                    styles.inputBox, 
                                    { 
                                        borderColor: getBorderColor('address'),
                                        backgroundColor: C.cardWhite,
                                        height: 80,
                                        alignItems: 'flex-start',
                                        paddingTop: 12
                                    }
                                ]}
                            >
                                <Ionicons 
                                    name="home-outline" 
                                    size={20} 
                                    color={focusedField === 'address' ? C.primaryBlue : C.textSecondary} 
                                    style={{ marginRight: 12, marginTop: 2 }} 
                                />
                                <TextInput
                                    placeholder="Street, City, State, ZIP Code"
                                    placeholderTextColor={C.textSecondary + '70'}
                                    style={[styles.input, { color: C.textPrimary, height: '100%', textAlignVertical: 'top' }]}
                                    value={address}
                                    onChangeText={setAddress}
                                    multiline
                                    numberOfLines={3}
                                    onFocus={() => setFocusedField('address')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: C.textSecondary }]}>Security Password / PIN</Text>
                            <View 
                                style={[
                                    styles.inputBox, 
                                    { 
                                        borderColor: getBorderColor('password'),
                                        backgroundColor: C.cardWhite 
                                    }
                                ]}
                            >
                                <Ionicons 
                                    name="lock-closed-outline" 
                                    size={20} 
                                    color={focusedField === 'password' ? C.primaryBlue : C.textSecondary} 
                                    style={{ marginRight: 12 }} 
                                />
                                <TextInput
                                    placeholder="Min 6 characters"
                                    placeholderTextColor={C.textSecondary + '70'}
                                    secureTextEntry
                                    style={[styles.input, { color: C.textPrimary }]}
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* NDHM Secure Verification Info Card */}
                        <View style={[styles.secureCard, { backgroundColor: scheme === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(30, 58, 138, 0.04)', borderColor: scheme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 58, 138, 0.1)' }]}>
                            <Ionicons name="shield-checkmark-outline" size={24} color={C.primaryBlue} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.secureCardTitle, { color: C.textPrimary }]}>NDHM Digital Verification</Text>
                                <Text style={[styles.secureCardText, { color: C.textSecondary }]}>
                                    We will dispatch a secure registration and automatic bypass deep link to your email address. Clicking that link on your device will authenticate your health passport instantly.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* BOTTOM CONTAINER */}
                <View style={styles.bottomWrapper}>
                    {/* SUBMIT BUTTON */}
                    <PressableScale 
                        onPress={handleSignup} 
                        style={[styles.signupBtn, loading && styles.signupBtnDisabled]}
                        disabled={loading}
                    >
                        <LinearGradient 
                            colors={[C.primaryBlue, '#1D4ED8']} 
                            style={styles.btnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.signupBtnText}>Verify & Create</Text>
                                    <Ionicons name="shield-checkmark" size={18} color="#fff" />
                                </>
                            )}
                        </LinearGradient>
                    </PressableScale>

                    <Text style={[styles.terms, { color: C.textSecondary }]}>
                        By creating an account, you agree to India&apos;s NDHM compliance
                        <Text style={{ color: C.primaryBlue }}> Terms of Service </Text>
                        and
                        <Text style={{ color: C.primaryBlue }}> DPDP Privacy Act</Text>.
                    </Text>
                </View>
            </ScrollView>

            {/* Dynamic DOB Custom Picker Modal */}
            {showDatePickerModal && (
                <Modal
                    visible={showDatePickerModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowDatePickerModal(false)}
                >
                    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                        <View style={[styles.modalContent, { backgroundColor: C.cardWhite, borderColor: C.border, padding: 20, maxHeight: 380 }]}>
                            <View style={styles.modalHeader}>
                                <Ionicons name="calendar-outline" size={24} color={C.primaryBlue} />
                                <Text style={[styles.modalTitle, { color: C.textPrimary, fontSize: 18 }]}>Select Date of Birth</Text>
                                <TouchableOpacity onPress={() => {
                                    triggerHaptic('light');
                                    setShowDatePickerModal(false);
                                }} style={styles.modalCloseBtn}>
                                    <Ionicons name="close" size={24} color={C.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={{ flexDirection: 'row', height: 180, gap: 8, marginVertical: 10 }}>
                                {/* Year Scroll */}
                                <View style={{ flex: 1.1, borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: 'hidden', backgroundColor: C.background }}>
                                    <Text style={{ fontSize: 9, fontWeight: '900', color: C.textSecondary, textAlign: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.cardWhite }}>YEAR</Text>
                                    <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
                                        {yearsList.map(y => (
                                            <TouchableOpacity 
                                                key={y} 
                                                onPress={() => {
                                                    triggerHaptic('light');
                                                    setSelectedYear(y);
                                                }}
                                                style={{ paddingVertical: 6, alignItems: 'center', backgroundColor: selectedYear === y ? C.primaryBlue + '20' : 'transparent', borderRadius: 8, marginHorizontal: 4 }}
                                            >
                                                <Text style={{ color: selectedYear === y ? C.primaryBlue : C.textPrimary, fontWeight: selectedYear === y ? '900' : '600', fontSize: 13 }}>{y}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Month Scroll */}
                                <View style={{ flex: 1.4, borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: 'hidden', backgroundColor: C.background }}>
                                    <Text style={{ fontSize: 9, fontWeight: '900', color: C.textSecondary, textAlign: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.cardWhite }}>MONTH</Text>
                                    <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
                                        {monthsList.map((m, idx) => {
                                            const active = selectedMonth === (idx + 1);
                                            return (
                                                <TouchableOpacity 
                                                    key={m} 
                                                    onPress={() => {
                                                        triggerHaptic('light');
                                                        setSelectedMonth(idx + 1);
                                                    }}
                                                    style={{ paddingVertical: 6, alignItems: 'center', backgroundColor: active ? C.primaryBlue + '20' : 'transparent', borderRadius: 8, marginHorizontal: 4 }}
                                                >
                                                    <Text style={{ color: active ? C.primaryBlue : C.textPrimary, fontWeight: active ? '900' : '600', fontSize: 13 }} numberOfLines={1}>{m}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>

                                {/* Day Scroll */}
                                <View style={{ flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: 'hidden', backgroundColor: C.background }}>
                                    <Text style={{ fontSize: 9, fontWeight: '900', color: C.textSecondary, textAlign: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.cardWhite }}>DAY</Text>
                                    <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
                                        {daysList.map(d => (
                                            <TouchableOpacity 
                                                key={d} 
                                                onPress={() => {
                                                    triggerHaptic('light');
                                                    setSelectedDay(d);
                                                }}
                                                style={{ paddingVertical: 6, alignItems: 'center', backgroundColor: selectedDay === d ? C.primaryBlue + '20' : 'transparent', borderRadius: 8, marginHorizontal: 4 }}
                                            >
                                                <Text style={{ color: selectedDay === d ? C.primaryBlue : C.textPrimary, fontWeight: selectedDay === d ? '900' : '600', fontSize: 13 }}>{d}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            <TouchableOpacity 
                                onPress={handleConfirmDate}
                                style={{ backgroundColor: C.primaryBlue, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}
                            >
                                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>Confirm DOB</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { 
        paddingHorizontal: 24, 
        paddingTop: Platform.OS === 'ios' ? 44 : 20,
        paddingBottom: 40,
        minHeight: '100%',
        position: 'relative'
    },
    
    // Background Glow elements
    glowBg: { 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        overflow: 'hidden', 
        zIndex: -1 
    },
    circleLeft: { 
        position: 'absolute', 
        top: -100, 
        left: -100, 
        width: 260, 
        height: 260, 
        borderRadius: 130 
    },
    circleRight: { 
        position: 'absolute', 
        bottom: -80, 
        right: -80, 
        width: 280, 
        height: 280, 
        borderRadius: 140 
    },

    header: { 
        marginBottom: 24,
        marginTop: 10
    },
    backBtn: { 
        width: 38, 
        height: 38, 
        borderRadius: 12,
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: 16,
        borderWidth: 1,
        ...Shadow.sm
    },
    title: { 
        fontSize: 26, 
        fontWeight: '900', 
        letterSpacing: -0.5 
    },
    subtitle: { 
        fontSize: 13, 
        marginTop: 6, 
        fontWeight: '600' 
    },

    form: { 
        width: '100%' 
    },
    inputGroup: { 
        marginBottom: 16 
    },
    label: { 
        fontSize: 10, 
        fontWeight: '800', 
        marginBottom: 8, 
        letterSpacing: 0.8,
        textTransform: 'uppercase' 
    },
    inputBox: { 
        height: 56, 
        borderWidth: 1.5, 
        borderRadius: 16, 
        paddingHorizontal: 16, 
        flexDirection: 'row', 
        alignItems: 'center',
        ...Shadow.sm
    },
    prefix: { 
        fontSize: 15, 
        fontWeight: '700', 
        marginRight: 10 
    },
    input: { 
        flex: 1, 
        fontSize: 15, 
        fontWeight: '700' 
    },
    
    signupBtn: { 
        height: 56, 
        borderRadius: 16, 
        overflow: 'hidden', 
        marginTop: 16,
        ...Shadow.md 
    },
    signupBtnDisabled: { 
        opacity: 0.7 
    },
    btnGradient: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8 
    },
    signupBtnText: { 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: '900', 
        letterSpacing: 0.5 
    },
    terms: { 
        textAlign: 'center', 
        fontSize: 11, 
        marginTop: 24, 
        lineHeight: 18, 
        fontWeight: '600',
        paddingHorizontal: 20
    },
    bottomWrapper: {
        width: '100%',
        marginTop: 'auto', // push to bottom
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    },
    secureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        marginTop: 20,
        marginBottom: 8,
        gap: 14,
        ...Shadow.sm
    },
    secureCardTitle: {
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.3,
        marginBottom: 4,
        textTransform: 'uppercase'
    },
    secureCardText: {
        fontSize: 11,
        fontWeight: '600',
        lineHeight: 16,
        opacity: 0.9
    },
    modalOverlay: { 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 999, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20 
    },
    modalContent: { 
        width: '100%', 
        borderRadius: 28, 
        borderWidth: 1.5, 
        padding: 24, 
        ...Shadow.lg 
    },
    modalHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 20 
    },
    modalTitle: { 
        fontSize: 20, 
        fontWeight: '800', 
        flex: 1, 
        marginLeft: 12 
    },
    modalCloseBtn: { 
        width: 36, 
        height: 36, 
        borderRadius: 18, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    bloodGroupRow: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 8, 
        marginTop: 8 
    },
    bloodGroupBadge: { 
        paddingVertical: 10, 
        paddingHorizontal: 14, 
        borderRadius: 12, 
        borderWidth: 1.5, 
        minWidth: 52, 
        alignItems: 'center', 
        justifyContent: 'center', 
        ...Shadow.sm 
    },
    bloodGroupBadgeText: { 
        fontSize: 13, 
        letterSpacing: 0.2 
    }
});
