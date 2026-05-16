import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Radius } from '@/constants/theme';
import { HOME_MOCK_DATA } from '@/constants/mockData';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import PressableScale from '@/components/ui/PressableScale';

export default function NotificationsScreen() {
    const scheme = useColorScheme() ?? 'light';
    const C = Colors[scheme];

    return (
        <ScreenWrapper>
            <AppHeader title="Notifications" showBack={true} />

            <View style={styles.list}>
                {HOME_MOCK_DATA.notifications.map((n, idx) => (
                    <NotificationCard key={n.id} n={n} C={C} />
                ))}
            </View>
        </ScreenWrapper>
    );
}

function NotificationCard({ n, C }) {
    const getIcon = () => {
        switch (n.type) {
            case 'emergency': return { name: 'alert-circle', color: '#DC2626', bg: '#FEE2E2' };
            case 'bill': return { name: 'receipt', color: '#10B981', bg: '#DCFCE7' };
            default: return { name: 'notifications', color: '#3B82F6', bg: '#DBEAFE' };
        }
    };

    const icon = getIcon();

    return (
        <PressableScale style={[styles.card, { backgroundColor: n.unread ? 'rgba(255,255,255,0.7)' : 'transparent', borderBottomColor: 'rgba(0,0,0,0.05)' }]}>
            <View style={[styles.iconBox, { backgroundColor: icon.bg }]}>
                <Ionicons name={icon.name} size={20} color={icon.color} />
            </View>
            <View style={styles.content}>
                <Text style={[styles.notifTitle, { color: C.textPrimary, fontWeight: n.unread ? '700' : '500' }]}>{n.title}</Text>
                <Text style={[styles.time, { color: C.textSecondary }]}>{n.time}</Text>
            </View>
            {n.unread && <View style={[styles.unreadDot, { backgroundColor: C.primaryBlue }]} />}
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
    backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: '800' },
    list: { paddingHorizontal: 20 },
    card: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 16, borderBottomWidth: 1, paddingHorizontal: 10, borderRadius: Radius.lg },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1 },
    notifTitle: { fontSize: 15, lineHeight: 20 },
    time: { fontSize: 12, marginTop: 4 },
    unreadDot: { width: 8, height: 8, borderRadius: 4 },
});
