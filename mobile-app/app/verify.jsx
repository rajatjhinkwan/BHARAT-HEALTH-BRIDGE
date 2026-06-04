import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import { API_BASE_URL } from '@/constants/api';


const triggerHaptic = async (type) => {
    try {
        if (type === 'light') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (type === 'medium') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (type === 'success') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    } catch (_) {}
};

export default function MagicLinkVerifyScreen() {
    const scheme = useColorScheme() ?? 'light';
    const C = Colors[scheme];
    const { login } = useAuth();
    
    const params = useLocalSearchParams();
    const token = params.token;
    const initialName = params.name || 'Patient';

    const [statusText, setStatusText] = useState('Checking secure key...');

    useEffect(() => {
        if (!token) {
            triggerHaptic('error');
            Alert.alert('Invalid Link', 'This magic login link is missing its authentication token.', [
                { text: 'Go to Login', onPress: () => router.replace('/(auth)/login') }
            ]);
            return;
        }

        const verifyAndLogin = async () => {
            try {
                setStatusText('Authenticating secure digital health key...');
                triggerHaptic('light');

                // Fetch full EMR user profile dynamically from the backend using the token
                const response = await fetch(`${API_BASE_URL}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const userData = await response.json();
                
                if (response.ok) {
                    setStatusText(`Namaste, ${userData.name || initialName}! Accessing your EMR vault...`);
                    triggerHaptic('success');
                    
                    // Artificial short delay for a premium transition effect
                    setTimeout(async () => {
                        await login({ token, user: userData });
                        router.replace('/(tabs)');
                    }, 1200);
                } else {
                    triggerHaptic('error');
                    Alert.alert('Verification Failed', userData.error || 'Your magic token has expired or is invalid.', [
                        { text: 'Back to Login', onPress: () => router.replace('/(auth)/login') }
                    ]);
                }
            } catch (err) {
                triggerHaptic('error');
                console.error('Magic link auth error:', err);
                Alert.alert('Network Error', 'Unable to reach the server to verify your magic link.', [
                    { text: 'Go to Login', onPress: () => router.replace('/(auth)/login') }
                ]);
            }
        };

        verifyAndLogin();
    }, [token, initialName, login]);

    return (
        <ScreenWrapper scroll={false}>
            <View style={[styles.container, { backgroundColor: C.background }]}>
                {/* TRICOLOR BACKGROUND GLOW SPHERES */}
                <View style={styles.glowBg}>
                    <LinearGradient 
                        colors={['#FF993315', 'transparent']} 
                        style={styles.circleLeft} 
                    />
                    <LinearGradient 
                        colors={['#13880812', 'transparent']} 
                        style={styles.circleRight} 
                    />
                </View>

                <View style={styles.content}>
                    {/* Pulsating Glowing Shield Logo */}
                    <LinearGradient 
                        colors={[C.primaryBlue, '#1D4ED8']} 
                        style={[styles.logoBox, Shadow.lg]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="shield-checkmark" size={44} color="#FFFFFF" />
                        
                        <View style={styles.tricolorBadge}>
                            <View style={styles.saffron} />
                            <View style={styles.white} />
                            <View style={styles.green} />
                        </View>
                    </LinearGradient>

                    <Text style={[styles.title, { color: C.textPrimary }]}>BHARAT HEALTH BRIDGE</Text>
                    <Text style={[styles.subtitle, { color: C.textSecondary }]}>KYC Digital Magic Link Verification</Text>
                    
                    <View style={[styles.statusBox, { backgroundColor: C.cardWhite, borderColor: C.border, ...Shadow.sm }]}>
                        <ActivityIndicator size="small" color={C.primaryBlue} style={{ marginBottom: 12 }} />
                        <Text style={[styles.statusText, { color: C.textPrimary }]}>{statusText}</Text>
                    </View>
                </View>

                <Text style={[styles.footer, { color: C.textSecondary + '70' }]}>
                    NDHM Secure Single Sign-On compliant
                </Text>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 50,
        paddingHorizontal: 24,
    },
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
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },
    logoBox: {
        width: 96,
        height: 96,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        position: 'relative'
    },
    tricolorBadge: {
        position: 'absolute',
        bottom: -3,
        flexDirection: 'row',
        width: 44,
        height: 5,
        borderRadius: 2.5,
        overflow: 'hidden'
    },
    saffron: { flex: 1, backgroundColor: '#FF9933' },
    white: { flex: 1, backgroundColor: '#FFFFFF' },
    green: { flex: 1, backgroundColor: '#138808' },
    title: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 0.5,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 6,
        textAlign: 'center'
    },
    statusBox: {
        marginTop: 40,
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderRadius: 20,
        borderWidth: 1.5,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 20
    },
    footer: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    }
});
