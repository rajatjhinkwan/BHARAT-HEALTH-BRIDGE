import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Radius, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import PressableScale from '@/components/ui/PressableScale';
import { LinearGradient } from 'expo-linear-gradient';

export default function SurgeryCostPredictor() {
    const scheme = useColorScheme() ?? 'light';
    const C = Colors[scheme];
    const [query, setQuery] = useState('');

    const surgeries = [
        { id: '1', name: 'Knee Replacement', avg: '₹2.4L', range: '₹1.8L - ₹4.5L', risk: 'Low' },
        { id: '2', name: 'Cataract Surgery', avg: '₹45k', range: '₹25k - ₹90k', risk: 'Very Low' },
        { id: '3', name: 'Bypass Surgery', avg: '₹4.8L', range: '₹3.5L - ₹9L', risk: 'High' },
        { id: '4', name: 'Hernia Repair', avg: '₹65k', range: '₹40k - ₹1.2L', risk: 'Medium' },
    ];

    const filtered = surgeries.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));

    return (
        <ScreenWrapper>
            <AppHeader title="Cost Estimator" showBell bellBadge={1} showBack={true} />

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <Text style={[styles.title, { color: C.textPrimary }]}>Anticipate Costs</Text>
                    <Text style={styles.sub}>Get AI-driven price predictions based on real hospital data from Bharat Health Bridge.</Text>

                    <View style={[styles.searchBox, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                        <Ionicons name="search" size={20} color={C.textSecondary} />
                        <TextInput
                            placeholder="Search surgery name..."
                            value={query}
                            onChangeText={setQuery}
                            placeholderTextColor={C.textSecondary}
                            style={{ flex: 1, marginLeft: 12, color: C.textPrimary, fontSize: 16 }}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Common Surgeries</Text>
                    {filtered.map(item => (
                        <PressableScale key={item.id} style={[styles.card, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={[styles.surgeryName, { color: C.textPrimary }]}>{item.name}</Text>
                                    <Text style={styles.riskText}>Risk Profile: <Text style={{ fontWeight: '800' }}>{item.risk}</Text></Text>
                                </View>
                                <View style={[styles.tag, { backgroundColor: C.primaryBlue + '15' }]}>
                                    <Text style={{ color: C.primaryBlue, fontWeight: '800', fontSize: 10 }}>AI PREDICTED</Text>
                                </View>
                            </View>

                            <View style={styles.priceRow}>
                                <View>
                                    <Text style={styles.priceLabel}>ESTIMATED AVERAGE</Text>
                                    <Text style={[styles.priceValue, { color: C.primaryBlue }]}>{item.avg}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View>
                                    <Text style={styles.priceLabel}>PRICE RANGE</Text>
                                    <Text style={[styles.rangeValue, { color: C.textPrimary }]}>{item.range}</Text>
                                </View>
                            </View>

                            <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.breakdown}>
                                <Text style={styles.breakdownText}>Compare across 42 local hospitals</Text>
                                <Ionicons name="chevron-forward" size={14} color="#64748B" />
                            </LinearGradient>
                        </PressableScale>
                    ))}
                </View>

                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={24} color="#fff" />
                    <Text style={styles.infoText}>Predictions are based on verified blockchain records and may vary by hospital grade (A/B/C).</Text>
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20 },
    hero: { marginTop: 10, marginBottom: 32 },
    title: { fontSize: 28, fontWeight: '900' },
    sub: { color: '#64748B', fontSize: 14, marginTop: 8, lineHeight: 22 },
    searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 60, borderRadius: 20, borderWidth: 1, marginTop: 24, ...Shadow.sm },
    section: { gap: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
    card: { borderRadius: 28, padding: 20, borderWidth: 1, ...Shadow.sm },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    surgeryName: { fontSize: 19, fontWeight: '800' },
    riskText: { fontSize: 12, color: '#64748B', marginTop: 4 },
    tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 20 },
    priceLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
    priceValue: { fontSize: 24, fontWeight: '900', marginTop: 4 },
    rangeValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },
    divider: { width: 1, height: 40, backgroundColor: 'rgba(0,0,0,0.05)' },
    breakdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12 },
    breakdownText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    infoCard: { backgroundColor: '#1E293B', padding: 20, borderRadius: 24, flexDirection: 'row', gap: 16, marginTop: 32 },
    infoText: { flex: 1, color: '#CBD5E1', fontSize: 12, lineHeight: 18, fontWeight: '500' }
});
