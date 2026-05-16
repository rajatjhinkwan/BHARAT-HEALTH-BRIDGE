import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Radius, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from '@/components/ui/PressableScale';
import { HOME_MOCK_DATA } from '@/constants/mockData';

export default function BillHistory() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const renderBillItem = ({ item }) => (
    <PressableScale style={[styles.billCard, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
      <View style={styles.billHeader}>
        <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
          <Ionicons name="receipt" size={24} color="#3B82F6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.hospitalName, { color: C.textPrimary }]}>{item.hospital}</Text>
          <Text style={styles.billDate}>{item.date} • {item.patient}</Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={[styles.amount, { color: C.textPrimary }]}>{item.amount}</Text>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#10B981" />
            <Text style={styles.statusText}>Verified</Text>
          </View>
        </View>
      </View>
      <View style={styles.billFooter}>
        <View style={styles.blockchainBox}>
          <Ionicons name="shield-checkmark" size={14} color="#64748B" />
          <Text style={styles.hashText}>Hash: {item.blockchainHash}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </View>
    </PressableScale>
  );

  return (
    <ScreenWrapper scroll={false}>
      <AppHeader title="Billing History" showBell bellBadge={3} showBack={true} />
      
      <View style={styles.container}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={styles.statValue}>₹1,70,100</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <Text style={styles.statLabel}>Verified Records</Text>
            <Text style={styles.statValue}>03</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Past Medical Records</Text>
        
        <FlatList
          data={HOME_MOCK_DATA.bills}
          renderItem={renderBillItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>No billing history found</Text>
            </View>
          }
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 24 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, ...Shadow.sm },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  list: { paddingBottom: 100 },
  billCard: { padding: 16, borderRadius: 24, borderWidth: 1, marginBottom: 16, ...Shadow.sm },
  billHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  hospitalName: { fontSize: 16, fontWeight: '800' },
  billDate: { fontSize: 12, color: '#64748B', marginTop: 2 },
  amountBox: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: '800' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#10B981' },
  billFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  blockchainBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hashText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#64748B', fontSize: 16, fontWeight: '600', marginTop: 16 }
});
