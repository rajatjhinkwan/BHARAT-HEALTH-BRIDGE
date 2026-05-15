import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Shadow } from '@/constants/theme';
import { HOME_MOCK_DATA } from '@/constants/mockData';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import PressableScale from '@/components/ui/PressableScale';

import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/api';

export default function LiveBilling() {
    const scheme = useColorScheme() ?? 'light';
    const C = Colors[scheme];
    const [billingData, setBillingData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchLiveBilling();
    }, []);

    const fetchLiveBilling = async () => {
        try {
            const authData = await SecureStore.getItemAsync('auth_data');
            if (!authData) return;
            const { token } = JSON.parse(authData);

            const res = await fetch(`${API_BASE_URL}/bills/live`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setBillingData(data);
        } catch (err) {
            console.error('Fetch live billing error:', err);
        } finally {
            setLoading(false);
        }
    };

    const b = billingData || HOME_MOCK_DATA.liveBilling;

    return (
        <ScreenWrapper>
            <AppHeader title="Real-time Audit" showBell bellBadge={3} showBack={true} />

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={['#0F172A', '#1E293B']}
                    style={styles.hero}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                    <View style={styles.heroTop}>
                        <View>
                            <Text style={styles.heroLabel}>SMART AUDITED TOTAL</Text>
                            <Text style={styles.total}>{b.total}</Text>
                        </View>
                        <View style={styles.savingsBadge}>
                            <Text style={styles.savingsBadgeText}>SAVE {b.potentialSavings}</Text>
                        </View>
                    </View>

                    <View style={styles.originalRow}>
                        <Text style={styles.originalLabel}>Hospital Accrued:</Text>
                        <Text style={styles.originalValue}>{b.originalTotal}</Text>
                    </View>

                    <View style={styles.infoBar}>
                        <View style={styles.infoItem}>
                            <Ionicons name="time" size={14} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.infoText}>{b.lastUpdated}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoItem}>
                            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                            <Text style={[styles.infoText, { color: '#10B981' }]}>Live Audit Active</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.logSection}>
                    <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Live Spend Audit Log</Text>
                    <View style={styles.logList}>
                        {b.logs.map((log) => (
                            <View key={log.id} style={[styles.logCard, { backgroundColor: C.cardWhite, borderColor: log.status !== 'ok' ? (log.status === 'red-flag' ? '#EF4444' : '#F59E0B') : C.border }]}>
                                <View style={styles.logMain}>
                                    <View style={[styles.logIconBox, { backgroundColor: log.status !== 'ok' ? 'rgba(0,0,0,0.03)' : '#EFF6FF' }]}>
                                        <Ionicons name={categoryIcon(log.category)} size={20} color={log.status === 'red-flag' ? '#EF4444' : C.primaryBlue} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.itemName, { color: C.textPrimary }]}>{log.item}</Text>
                                        <Text style={styles.category}>{log.category} • {log.time}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.cost, { color: C.textPrimary, textDecorationLine: log.status !== 'ok' ? 'line-through' : 'none', opacity: log.status !== 'ok' ? 0.5 : 1 }]}>{log.cost}</Text>
                                        {log.status === 'ok' && <Ionicons name="checkmark-circle" size={16} color="#10B981" />}
                                    </View>
                                </View>
                                {log.flag && (
                                    <View style={[styles.flagBanner, { backgroundColor: log.status === 'red-flag' ? '#FEF2F2' : '#FFFBEB' }]}>
                                        <Ionicons name="warning" size={14} color={log.status === 'red-flag' ? '#EF4444' : '#D97706'} />
                                        <Text style={[styles.flagText, { color: log.status === 'red-flag' ? '#B91C1C' : '#92400E' }]}>{log.flag}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                <PressableScale style={[styles.auditBtn, { backgroundColor: C.primaryBlue }]} onPress={() => router.push('/bill')}>
                    <Text style={styles.auditBtnText}>Get Detailed Audit Report</Text>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                </PressableScale>
                <View style={{ height: 100 }} />
            </ScrollView>
        </ScreenWrapper>
    );
}

function categoryIcon(cat) {
    switch (cat) {
        case 'Accommodation': return 'bed-outline';
        case 'Consultation': return 'person-outline';
        case 'Pharmacy': return 'medkit-outline';
        case 'Lab': return 'flask-outline';
        default: return 'receipt-outline';
    }
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20 },
    hero: { padding: 24, borderRadius: 32, ...Shadow.lg, marginTop: 10 },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    heroLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    total: { color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 4 },
    savingsBadge: { backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    savingsBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
    originalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
    originalLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
    originalValue: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '700', textDecorationLine: 'line-through' },
    infoBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700' },
    divider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
    logSection: { marginTop: 32 },
    sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
    logList: { gap: 12 },
    logCard: { padding: 16, borderRadius: 24, borderWidth: 1, ...Shadow.sm },
    logMain: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    logIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    itemName: { fontSize: 16, fontWeight: '800' },
    category: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    cost: { fontSize: 16, fontWeight: '800' },
    flagBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 10, borderRadius: 12 },
    flagText: { fontSize: 11, fontWeight: '800' },
    auditBtn: { marginTop: 32, height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 40, ...Shadow.sm },
    auditBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
