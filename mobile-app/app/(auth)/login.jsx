import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    Animated, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    Platform,
    Dimensions,
    ActivityIndicator,
    Easing,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import PressableScale from '@/components/ui/PressableScale';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { API_BASE_URL } from '@/constants/api';

const { width, height } = Dimensions.get('window');

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

export default function LoginScreen() {
    const scheme = useColorScheme() ?? 'light';
    const C = Colors[scheme];
    const { login } = useAuth();

    // Form inputs state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // UI interactive states
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null); // 'email', 'password'
    const [loading, setLoading] = useState(false);

    // Staggered premium entrance animations
    const headerFade = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(40)).current;
    
    const inputsFade = useRef(new Animated.Value(0)).current;
    const inputsSlide = useRef(new Animated.Value(30)).current;
    
    const buttonScale = useRef(new Animated.Value(0.9)).current;
    const buttonFade = useRef(new Animated.Value(0)).current;
    
    // Pulse animation for focused inputs glow
    const focusGlowAnim = useRef(new Animated.Value(0)).current;

    // Trigger staggered entrance animations on mount
    useEffect(() => {
        Animated.stagger(150, [
            // 1. Header fades & slides up
            Animated.parallel([
                Animated.timing(headerFade, {
                    toValue: 1,
                    duration: 700,
                    easing: Easing.out(Easing.back(1.5)),
                    useNativeDriver: true,
                }),
                Animated.timing(headerSlide, {
                    toValue: 0,
                    duration: 700,
                    easing: Easing.out(Easing.back(1.5)),
                    useNativeDriver: true,
                })
            ]),
            // 2. Input Fields fade & slide up
            Animated.parallel([
                Animated.timing(inputsFade, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(inputsSlide, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                })
            ]),
            // 3. Login Button fades in & scales to full size
            Animated.parallel([
                Animated.timing(buttonFade, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.spring(buttonScale, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                })
            ]),
        ]).start();
    }, []);

    // Animate glow pulse when field changes focus
    useEffect(() => {
        if (focusedField) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(focusGlowAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.ease,
                        useNativeDriver: false
                    }),
                    Animated.timing(focusGlowAnim, {
                        toValue: 0,
                        duration: 1000,
                        easing: Easing.ease,
                        useNativeDriver: false
                    })
                ])
            ).start();
        } else {
            focusGlowAnim.setValue(0);
        }
    }, [focusedField]);

    // Form validation check
    const isEmailValid = email.includes('@') && email.includes('.');

    const handleLogin = async () => {
        if (!email || !password) {
            triggerHaptic('error');
            Alert.alert('Missing Credentials', 'Please enter both email address and security PIN.');
            return;
        }

        try {
            setLoading(true);
            triggerHaptic('medium');

            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            setLoading(false);
            
            if (response.ok) {
                triggerHaptic('success');
                await login(data);
            } else {
                triggerHaptic('error');
                Alert.alert('Login Failed', data.error || 'Invalid email or password.');
            }
        } catch (err) {
            setLoading(false);
            triggerHaptic('error');
            Alert.alert('Connection Error', 'Unable to reach the server. Please check your network and try again.');
        }
    };

    // Calculate dynamic glowing border color
    const getBorderColor = (fieldName) => {
        if (focusedField === fieldName) {
            return focusGlowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [C.primaryBlue, '#818CF8']
            });
        }
        return C.border;
    };

    return (
        <ScreenWrapper scroll={false}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={[styles.mainContainer, { backgroundColor: C.background }]}>
                    
                    {/* FLOATING PREMIUM GLOW GRAPHICS */}
                    <View style={styles.glowBg}>
                        <LinearGradient 
                            colors={[C.primaryBlue + '18', 'transparent']} 
                            style={styles.circleLeft} 
                        />
                        <LinearGradient 
                            colors={['#818CF812', 'transparent']} 
                            style={styles.circleRight} 
                        />
                    </View>

                    <View style={styles.centerContainer}>
                        {/* HEADER SECTION */}
                        <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
                            <LinearGradient 
                                colors={[C.primaryBlue, '#1E40AF']} 
                                style={[styles.logoBox, Shadow.md]}
                            >
                                <Ionicons name="medical" size={40} color="#fff" />
                                <View style={styles.tricolorBadge}>
                                    <View style={styles.tricolorSaffron} />
                                    <View style={styles.tricolorWhite} />
                                    <View style={styles.tricolorGreen} />
                                </View>
                            </LinearGradient>
                            
                            <Text style={[styles.title, { color: C.textPrimary }]}>BHARAT HEALTH BRIDGE</Text>
                            <Text style={[styles.subtitle, { color: C.textSecondary }]}>
                                India&apos;s Digital Unified EMR & Smart Hospital Ecosystem
                            </Text>
                        </Animated.View>

                        {/* INPUTS AND BUTTON SECTION */}
                        <View style={styles.authBox}>
                            <Animated.View style={{ opacity: inputsFade, transform: [{ translateY: inputsSlide }] }}>
                                <View style={styles.inputGroup}>
                                    
                                    {/* Email Input Label */}
                                    <Text style={[styles.label, { color: C.textSecondary }]}>Email Address</Text>
                                    
                                    <Animated.View 
                                        style={[
                                            styles.inputBox, 
                                            { 
                                                borderColor: getBorderColor('email'), 
                                                backgroundColor: C.cardWhite,
                                                marginBottom: 16 
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
                                            placeholder="patient@example.com"
                                            placeholderTextColor={C.textSecondary + '75'}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            style={[styles.input, { color: C.textPrimary }]}
                                            value={email}
                                            onChangeText={setEmail}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                        {isEmailValid && (
                                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                        )}
                                    </Animated.View>

                                    {/* Password Input Label */}
                                    <Text style={[styles.label, { color: C.textSecondary }]}>Security PIN / Password</Text>
                                    
                                    <Animated.View 
                                        style={[
                                            styles.inputBox, 
                                            { 
                                                borderColor: getBorderColor('password'),
                                                backgroundColor: C.cardWhite, 
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
                                            placeholder="••••••••"
                                            placeholderTextColor={C.textSecondary + '75'}
                                            secureTextEntry={!showPassword}
                                            style={[styles.input, { color: C.textPrimary }]}
                                            value={password}
                                            onChangeText={setPassword}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                        <TouchableOpacity 
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={styles.eyeBtn}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons 
                                                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                                size={20} 
                                                color={C.textSecondary} 
                                            />
                                        </TouchableOpacity>
                                    </Animated.View>
                                </View>
                            </Animated.View>

                            {/* SUBMIT BUTTON */}
                            <Animated.View style={{ opacity: buttonFade, transform: [{ scale: buttonScale }] }}>
                                <PressableScale 
                                    onPress={handleLogin} 
                                    style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
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
                                                <Text style={styles.loginBtnText}>Secure Login</Text>
                                                <Ionicons name="shield-checkmark" size={18} color="#fff" />
                                            </>
                                        )}
                                    </LinearGradient>
                                </PressableScale>

                            </Animated.View>

                            {/* FOOTER SIGNUP NAVIGATION */}
                            <Animated.View style={[styles.footer, { opacity: inputsFade }]}>
                                <Text style={[styles.footerText, { color: C.textSecondary }]}>New to the bridge?</Text>
                                <PressableScale onPress={() => router.push('/signup')}>
                                    <Text style={[styles.signupLink, { color: C.primaryBlue }]}> Create Health ID</Text>
                                </PressableScale>
                            </Animated.View>

                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    mainContainer: { 
        flex: 1, 
        paddingHorizontal: 28, 
        justifyContent: 'center', 
        position: 'relative' 
    },
    centerContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 10
    },
    skipButton: { 
        position: 'absolute', 
        top: Platform.OS === 'ios' ? 56 : 24, 
        right: 0, 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6, 
        paddingVertical: 8, 
        paddingHorizontal: 16, 
        borderRadius: 20, 
        borderWidth: 1.5,
        zIndex: 100,
        ...Shadow.sm
    },
    skipText: { 
        fontSize: 13, 
        fontWeight: '900',
        letterSpacing: 0.5
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
        top: -120, 
        left: -120, 
        width: 280, 
        height: 280, 
        borderRadius: 140 
    },
    circleRight: { 
        position: 'absolute', 
        bottom: -100, 
        right: -100, 
        width: 320, 
        height: 320, 
        borderRadius: 160 
    },

    header: { 
        alignItems: 'center', 
        marginBottom: 40 
    },
    logoBox: { 
        width: 80, 
        height: 80, 
        borderRadius: 24, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: 20,
        position: 'relative'
    },
    tricolorBadge: { 
        position: 'absolute', 
        bottom: -2, 
        flexDirection: 'row', 
        width: 36, 
        height: 4, 
        borderRadius: 2, 
        overflow: 'hidden' 
    },
    tricolorSaffron: { flex: 1, backgroundColor: '#FF9933' },
    tricolorWhite: { flex: 1, backgroundColor: '#FFFFFF' },
    tricolorGreen: { flex: 1, backgroundColor: '#138808' },
    
    title: { 
        fontSize: 21, 
        fontWeight: '900', 
        letterSpacing: 0.5,
        textAlign: 'center'
    },
    subtitle: { 
        fontSize: 12, 
        marginTop: 8, 
        fontWeight: '600', 
        textAlign: 'center', 
        lineHeight: 18, 
        width: '88%' 
    },
    
    authBox: { 
        width: '100%',
        maxWidth: 380 
    },
    inputGroup: { 
        marginBottom: 26 
    },
    label: { 
        fontSize: 10, 
        fontWeight: '800', 
        marginBottom: 8, 
        letterSpacing: 1, 
        textTransform: 'uppercase' 
    },
    
    // Sleek Input layout with Focus border animation
    inputBox: { 
        height: 58, 
        borderWidth: 1.5, 
        borderRadius: 18, 
        paddingHorizontal: 16, 
        flexDirection: 'row', 
        alignItems: 'center',
        ...Shadow.sm 
    },
    input: { 
        flex: 1, 
        fontSize: 15, 
        fontWeight: '700' 
    },
    eyeBtn: { 
        padding: 6 
    },
    
    // Golden-Blue Gradient Login Button
    loginBtn: { 
        height: 58, 
        borderRadius: 18, 
        overflow: 'hidden', 
        marginTop: 6, 
        ...Shadow.md 
    },
    loginBtnDisabled: { 
        opacity: 0.7 
    },
    btnGradient: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8 
    },
    loginBtnText: { 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: '900', 
        letterSpacing: 0.5 
    },
    
    footer: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        marginTop: 26 
    },
    footerText: { 
        fontSize: 13, 
        fontWeight: '600' 
    },
    signupLink: { 
        fontSize: 13, 
        fontWeight: '800' 
    }
});
