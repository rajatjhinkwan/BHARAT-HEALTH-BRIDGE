import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/theme';
import PressableScale from '@/components/ui/PressableScale';

export default function GreetingSection({ C, user, entranceAnims }) {
    const { greetX, greetOpacity, namasteLetters, progress } = entranceAnims;

    const floatingY = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatingY, { toValue: -5, duration: 2000, easing: Easing.ease, useNativeDriver: true }),
                Animated.timing(floatingY, { toValue: 0, duration: 2000, easing: Easing.ease, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.section}>
            <Animated.View style={[styles.greetingContainer, { transform: [{ translateX: greetX }], opacity: greetOpacity }]}>
                <View style={styles.namasteRow}>
                    {'Namaste'.split('').map((ch, i) => {
                        const v = namasteLetters[i] || new Animated.Value(1);
                        const ty = v.interpolate({ inputRange: [0, 1], outputRange: [15, 0] });
                        const op = v;
                        return (
                            <Animated.Text key={i} style={[styles.h1, { color: C.textPrimary, transform: [{ translateY: ty }], opacity: op }]}>{ch}</Animated.Text>
                        );
                    })}
                    <Text style={[styles.h1, { color: C.textPrimary, fontWeight: '800' }]}>{`, ${user?.name || 'Bharat User'}`}</Text>
                </View>
                <Text style={[styles.subtitle, { color: C.textSecondary }]}>Your health dashboard is live.</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: { paddingHorizontal: 20, paddingVertical: 10 },
    greetingContainer: { marginBottom: 20 },
    namasteRow: { flexDirection: 'row', alignItems: 'baseline' },
    h1: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
    subtitle: { fontSize: 16, marginTop: 4, fontWeight: '500', opacity: 0.8 },
    scoreSection: { backgroundColor: 'rgba(255,255,255,0.5)', padding: 15, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    weatherBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, elevation: 1 },
    progressContainer: { marginTop: 10 },
    scoreValue: { fontSize: 36, fontWeight: '800', lineHeight: 40 },
    scoreTotal: { fontSize: 14, fontWeight: '500', opacity: 0.5 },
    progressBar: { height: 10, borderRadius: 99, overflow: 'hidden', marginTop: 12 },
    progressFillWrapper: { height: '100%', borderRadius: 99, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 99 },
    searchBox: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 20, paddingLeft: 16, paddingRight: 6, height: 50 },
    searchInput: { flex: 1, fontSize: 16, fontWeight: '500' },
    searchMic: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    caption: { fontSize: 12, letterSpacing: 1.2 },
    small: { fontSize: 12, fontWeight: '600' },
});
