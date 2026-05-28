import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Animated, 
    Dimensions, 
    TouchableOpacity, 
    Easing, 
    Platform,
    Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width, height } = Dimensions.get('window');

const STATUSES = [
    "🩺 Initializing EMR Sync engine...",
    "🛡️ Securing ABHA digital enclave...",
    "🏥 Locating nearby smart hospitals...",
    "⚡ Tuning low-latency clinical feeds...",
    "🔐 Digital Health Passport verified...",
    "🚀 Welcome to the Bharat Health Bridge!"
];

export default function AnimatedSplashScreen({ onFinish }) {
    const scheme = useColorScheme() ?? 'light';
    const C = Colors[scheme];
    const exitedRef = useRef(false);

    const [statusIndex, setStatusIndex] = useState(0);

    // Animated values
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoGlow = useRef(new Animated.Value(0.3)).current;
    const logoRotation = useRef(new Animated.Value(0)).current;
    
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textTranslateY = useRef(new Animated.Value(25)).current;
    
    const barWidth = useRef(new Animated.Value(0)).current;
    
    const statusOpacity = useRef(new Animated.Value(0)).current;
    const statusTranslateY = useRef(new Animated.Value(10)).current;
    
    const containerOpacity = useRef(new Animated.Value(1)).current;
    const containerScale = useRef(new Animated.Value(1)).current;
    
    const skipOpacity = useRef(new Animated.Value(0)).current;

    // Trigger haptics safely
    const triggerHaptic = async (style) => {
        try {
            await Haptics.impactAsync(style);
        } catch (_) {}
    };

    // Staggered Entrance Animations
    useEffect(() => {
        // 1. Spring-in logo + Rotation
        Animated.parallel([
            Animated.spring(logoScale, {
                toValue: 1,
                tension: 40,
                friction: 6,
                useNativeDriver: true
            }),
            Animated.timing(logoRotation, {
                toValue: 1,
                duration: 1000,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true
            })
        ]).start();

        // 2. Loop breathing glow
        Animated.loop(
            Animated.sequence([
                Animated.timing(logoGlow, {
                    toValue: 1,
                    duration: 1400,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true
                }),
                Animated.timing(logoGlow, {
                    toValue: 0.2,
                    duration: 1400,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true
                })
            ])
        ).start();

        // 3. Staggered text & tricolor bar expansion
        Animated.sequence([
            Animated.delay(450),
            Animated.parallel([
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 750,
                    useNativeDriver: true
                }),
                Animated.timing(textTranslateY, {
                    toValue: 0,
                    duration: 750,
                    easing: Easing.out(Easing.back(1)),
                    useNativeDriver: true
                }),
                Animated.timing(barWidth, {
                    toValue: 1,
                    duration: 850,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: false // width animation doesn't support native driver
                })
            ]),
            Animated.parallel([
                Animated.timing(statusOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true
                }),
                Animated.timing(statusTranslateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                }),
                Animated.timing(skipOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true
                })
            ])
        ]).start();
    }, []);

    // Rolling Clinical Status Feed
    useEffect(() => {
        if (statusIndex >= STATUSES.length - 1) {
            // Auto exit 500ms after reaching the final status message
            const timeout = setTimeout(() => {
                triggerExit();
            }, 600);
            return () => clearTimeout(timeout);
        }

        const interval = setInterval(() => {
            // Fade out current message
            Animated.parallel([
                Animated.timing(statusOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
                Animated.timing(statusTranslateY, { toValue: -8, duration: 120, useNativeDriver: true })
            ]).start(() => {
                setStatusIndex(prev => {
                    const next = prev + 1;
                    statusTranslateY.setValue(10);
                    // Fade in next message
                    Animated.parallel([
                        Animated.timing(statusOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                        Animated.timing(statusTranslateY, { toValue: 0, duration: 200, useNativeDriver: true })
                    ]).start();
                    return next;
                });
            });
        }, 450);

        return () => clearInterval(interval);
    }, [statusIndex]);

    const triggerExit = () => {
        if (exitedRef.current) return;
        exitedRef.current = true;

        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

        Animated.parallel([
            Animated.timing(containerOpacity, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true
            }),
            Animated.timing(containerScale, {
                toValue: 1.08,
                duration: 600,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true
            })
        ]).start(() => {
            onFinish();
        });
    };

    // Spin logo 360 deg
    const spinLogo = logoRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    // Expand tricolor bar width
    const interpolateBarWidth = barWidth.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '70%']
    });

    return (
        <Pressable 
            onPress={triggerExit}
            style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}
        >
            <Animated.View 
                style={[
                    styles.container, 
                    { 
                        backgroundColor: scheme === 'dark' ? '#07090C' : '#F3F4F6',
                        opacity: containerOpacity,
                        transform: [{ scale: containerScale }]
                    }
                ]}
            >
                {/* PREMIUM GLOW SPHERES */}
                <View style={styles.glowOverlay}>
                    <LinearGradient 
                        colors={[C.primaryBlue + '1F', 'transparent']} 
                        style={styles.glowTop} 
                    />
                    <LinearGradient 
                        colors={[scheme === 'dark' ? '#818CF812' : '#818CF80F', 'transparent']} 
                        style={styles.glowBottom} 
                    />
                </View>

                {/* SKIP BUTTON */}
                <Animated.View style={[styles.skipContainer, { opacity: skipOpacity }]}>
                    <TouchableOpacity 
                        onPress={(e) => {
                            e.stopPropagation();
                            triggerExit();
                        }}
                        style={[
                            styles.skipButton,
                            { 
                                backgroundColor: scheme === 'dark' ? 'rgba(31, 41, 55, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                                borderColor: C.border 
                            }
                        ]}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.skipText, { color: C.textSecondary }]}>Skip Intro</Text>
                        <Ionicons name="arrow-forward" size={14} color={C.textSecondary} />
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.content}>
                    {/* Pulsating Glowing Circle behind Emblem */}
                    <Animated.View 
                        style={[
                            styles.glowRing, 
                            { 
                                transform: [{ scale: logoScale }],
                                opacity: logoGlow,
                                borderColor: C.primaryBlue + '30',
                                backgroundColor: C.primaryBlue + '0A'
                            }
                        ]}
                    />

                    {/* MEDICAL EMBLEM CONTAINER */}
                    <Animated.View 
                        style={[
                            styles.logoOuter, 
                            { 
                                transform: [
                                    { scale: logoScale },
                                    { rotate: spinLogo }
                                ],
                                backgroundColor: scheme === 'dark' ? '#111827' : '#FFFFFF',
                                borderColor: C.border,
                                ...Shadow.lg
                            }
                        ]}
                    >
                        <LinearGradient 
                            colors={[C.primaryBlue, scheme === 'dark' ? '#1E40AF' : '#1D4ED8']} 
                            style={styles.logoGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="medical" size={48} color="#FFFFFF" />
                        </LinearGradient>

                        {/* Tri-color badge under emblem */}
                        <View style={styles.tricolorBadge}>
                            <View style={styles.saffron} />
                            <View style={styles.white} />
                            <View style={styles.green} />
                        </View>
                    </Animated.View>

                    {/* BRANDING TEXT DETAILS */}
                    <Animated.View 
                        style={{ 
                            alignItems: 'center', 
                            opacity: textOpacity,
                            transform: [{ translateY: textTranslateY }] 
                        }}
                    >
                        <Text style={[styles.title, { color: C.textPrimary }]}>
                            BHARAT HEALTH BRIDGE
                        </Text>
                        
                        {/* Dynamic Tricolor Expanding Accent Bar */}
                        <Animated.View style={[styles.barContainer, { width: interpolateBarWidth }]}>
                            <View style={styles.saffron} />
                            <View style={styles.white} />
                            <View style={styles.green} />
                        </Animated.View>

                        <Text style={[styles.subtitle, { color: C.textSecondary }]}>
                            Digital Unified EMR & Smart Hospital Gateway
                        </Text>
                    </Animated.View>
                </View>

                {/* BOTTOM LOADING & STATUS SECTION */}
                <View style={styles.bottomSection}>
                    <Animated.View 
                        style={[
                            styles.statusBox, 
                            { 
                                opacity: statusOpacity,
                                transform: [{ translateY: statusTranslateY }],
                                backgroundColor: scheme === 'dark' ? 'rgba(17, 24, 39, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                                borderColor: C.border
                            }
                        ]}
                    >
                        <Text style={[styles.statusText, { color: C.textSecondary }]}>
                            {STATUSES[statusIndex]}
                        </Text>
                    </Animated.View>

                    <Text style={[styles.copyright, { color: C.textSecondary + '60' }]}>
                        NDHM & ABHA Compliant • Ministry of Health
                    </Text>
                </View>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    glowOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        overflow: 'hidden'
    },
    glowTop: {
        position: 'absolute',
        top: -150,
        left: -100,
        width: width * 1.5,
        height: height * 0.45,
        borderRadius: 300,
    },
    glowBottom: {
        position: 'absolute',
        bottom: -200,
        right: -100,
        width: width * 1.5,
        height: height * 0.5,
        borderRadius: 300,
    },
    skipContainer: {
        width: '100%',
        alignItems: 'flex-end',
        paddingTop: Platform.OS === 'ios' ? 12 : 6,
    },
    skipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    skipText: {
        fontSize: 12,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    glowRing: {
        position: 'absolute',
        width: 190,
        height: 190,
        borderRadius: 95,
        borderWidth: 1.5,
    },
    logoOuter: {
        width: 104,
        height: 104,
        borderRadius: 32,
        borderWidth: 1.5,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 35,
        position: 'relative',
    },
    logoGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tricolorBadge: {
        position: 'absolute',
        bottom: -3,
        flexDirection: 'row',
        width: 44,
        height: 5,
        borderRadius: 2.5,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: 'transparent'
    },
    barContainer: {
        flexDirection: 'row',
        height: 3,
        borderRadius: 1.5,
        overflow: 'hidden',
        marginVertical: 14,
    },
    saffron: { flex: 1, backgroundColor: '#FF9933' },
    white: { flex: 1, backgroundColor: '#FFFFFF' },
    green: { flex: 1, backgroundColor: '#138808' },
    title: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 0.8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.3,
        opacity: 0.85
    },
    bottomSection: {
        width: '100%',
        alignItems: 'center',
        gap: 20,
    },
    statusBox: {
        paddingVertical: 12,
        paddingHorizontal: 22,
        borderRadius: 20,
        borderWidth: 1,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
        ...Shadow.sm
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.2
    },
    copyright: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    }
});
