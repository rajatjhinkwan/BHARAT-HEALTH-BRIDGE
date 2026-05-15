import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/theme';
import { router } from 'expo-router';
import PressableScale from '@/components/ui/PressableScale';

export default function ActiveVisitCard({ C, visit, entranceAnims }) {
    const { liveX } = entranceAnims;

    return (
        <Animated.View style={[styles.card, { backgroundColor: C.cardWhite, borderColor: C.border, transform: [{ translateX: liveX }] }]}>
            <View style={styles.header}>
                <View style={styles.titleGroup}>
                    <Text style={[styles.title, { color: C.textPrimary }]}>Active Care</Text>
                    <Text style={[styles.subtitle, { color: C.textSecondary }]}>{visit.hospital}</Text>
                </View>
                <LiveIndicator />
            </View>

            <View style={styles.content}>
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Text style={[styles.statLabel, { color: C.textSecondary }]}>DURATION</Text>
                        <Text style={[styles.statValue, { color: C.textPrimary }]}>Day {visit.day.split(' ')[0]}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: C.border }]} />
                    <PressableScale style={styles.stat} onPress={() => router.push('/bill')}>
                        <Text style={[styles.statLabel, { color: C.textSecondary }]}>TOTAL BILL</Text>
                        <Text style={[styles.statValue, { color: C.primaryBlue }]}>{visit.bill}</Text>
                    </PressableScale>
                </View>

                <View style={styles.timeline}>
                    {visit.timeline.slice(0, 2).map((item, idx) => (
                        <View key={idx} style={styles.timelineItem}>
                            <View style={[styles.dot, { backgroundColor: idx === 0 ? C.primaryBlue : C.border }]} />
                            <Text style={[styles.timelineText, { color: idx === 0 ? C.textPrimary : C.textSecondary }]}>{item.event}</Text>
                            <Text style={[styles.time, { color: C.textSecondary }]}>{item.time}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <PressableScale
                style={[styles.button, { backgroundColor: C.primaryBlue }]}
                onPress={() => router.push('/bill')}
            >
                <Text style={styles.buttonText}>View Billing History</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
            </PressableScale>
        </Animated.View>
    );
}

function LiveIndicator() {
    const opacity = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.liveBadge}>
            <Animated.View style={[styles.liveDot, { opacity }]} />
            <Text style={styles.liveText}>LIVE</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { marginHorizontal: 20, marginVertical: 15, borderRadius: 24, padding: 20, borderWidth: 1, elevation: 4 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    titleGroup: { flex: 1 },
    title: { fontSize: 20, fontWeight: '800' },
    subtitle: { fontSize: 13, fontWeight: '600', marginTop: 2 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DC2626' },
    liveText: { fontSize: 10, fontWeight: '800', color: '#DC2626' },
    content: { marginTop: 20 },
    statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    stat: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    statValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },
    divider: { width: 1, height: 30 },
    timeline: { marginTop: 15, gap: 12 },
    timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    timelineText: { flex: 1, fontSize: 13, fontWeight: '600' },
    time: { fontSize: 12, fontWeight: '500' },
    button: { marginTop: 20, height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
