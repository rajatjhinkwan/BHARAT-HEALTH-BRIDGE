import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Radius, Shadow } from '@/constants/theme';

export default function EmergencyBanner({ C, entranceAnims }) {
    const { emergencyScale, emergencyOpacity } = entranceAnims;
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.05, duration: 800, easing: Easing.ease, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.ease, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={{ opacity: emergencyOpacity, transform: [{ scale: Animated.multiply(emergencyScale, pulse) }] }}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/emergency')}>
                    <LinearGradient colors={[C.emergencyRed, '#7F1D1D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.banner, Shadow.emergency]}>
                        <View style={styles.glassOverlay} />
                        <View style={styles.content}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="medical" size={24} color="#fff" />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.title}>EMERGENCY ALERT</Text>
                                <Text style={styles.subtitle}>Blood Needed in Gopeshwar • Tap to Help</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#fff" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, marginVertical: 10 },
    banner: { borderRadius: 20, padding: 16, overflow: 'hidden', position: 'relative' },
    glassOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.1)' },
    content: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    textContainer: { flex: 1 },
    title: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
    subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginTop: 2 },
});
