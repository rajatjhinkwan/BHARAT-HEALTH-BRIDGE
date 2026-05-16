import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Radius, Spacing, Shadow } from '@/constants/theme';
import { HOME_MOCK_DATA } from '@/constants/mockData';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import PressableScale from '@/components/ui/PressableScale';
import * as DocumentPicker from 'expo-document-picker';

export default function HistoryScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const [query, setQuery] = useState('');

  const filteredData = useMemo(() => {
    const q = query.toLowerCase();
    return HOME_MOCK_DATA.bills.filter(b =>
      b.hospital.toLowerCase().includes(q) ||
      b.patient.toLowerCase().includes(q)
    );
  }, [query]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        Alert.alert('Success', `Report "${result.assets[0].name}" uploaded to Bharat Health Bridge and verified on Blockchain.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ScreenWrapper>
      <AppHeader title="Medical Records" showBell bellBadge={3} />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.h1, { color: C.textPrimary }]}>History Timeline</Text>
          <View style={[styles.searchBox, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
            <Ionicons name="search" size={20} color={C.textSecondary} />
            <TextInput
              placeholder="Search records..."
              value={query}
              onChangeText={setQuery}
              placeholderTextColor={C.textSecondary}
              style={{ flex: 1, marginLeft: 8, color: C.textPrimary }}
            />
          </View>
        </View>

        <View style={styles.timeline}>
          {filteredData.map((record, idx) => (
            <RecordCard key={record.id} record={record} C={C} isLast={idx === filteredData.length - 1} />
          ))}
        </View>

        <PressableScale onPress={pickDocument} style={[styles.fab, { backgroundColor: C.primaryBlue }]}>
          <Ionicons name="cloud-upload" size={24} color="#fff" />
        </PressableScale>
      </View>
    </ScreenWrapper>
  );
}

function RecordCard({ record, C, isLast }) {
  return (
    <View style={styles.recordContainer}>
      <View style={styles.indicatorCol}>
        <View style={[styles.dot, { backgroundColor: C.primaryBlue }]} />
        {!isLast && <View style={[styles.line, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />}
      </View>
      <PressableScale
        onPress={() => router.push('/bill')}
        style={[styles.card, { backgroundColor: C.cardWhite, borderColor: C.border }]}
      >
        <View style={styles.cardTop}>
          <Text style={styles.date}>{new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.blockchainBadge, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="shield-checkmark" size={10} color="#4F46E5" />
              <Text style={styles.blockchainText}>BLOCKCHAIN</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: record.score > 80 ? '#DCFCE7' : '#FEF3C7' }]}>
              <Text style={[styles.scoreText, { color: record.score > 80 ? '#10B981' : '#F59E0B' }]}>{record.score} Score</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.cardHospital, { color: C.textPrimary }]}>{record.hospital}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.patientInfo}>
            <Ionicons name="person-outline" size={14} color={C.textSecondary} />
            <Text style={styles.patientName}>{record.patient}</Text>
          </View>
          <Text style={[styles.amount, { color: C.primaryBlue }]}>{record.amount}</Text>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, flex: 1 },
  header: { marginBottom: 24, marginTop: 10 },
  h1: { fontSize: 26, fontWeight: '800' },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 16, borderWidth: 1, marginTop: 16, ...Shadow.sm },
  timeline: { paddingLeft: 4 },
  recordContainer: { flexDirection: 'row', gap: 16 },
  indicatorCol: { alignItems: 'center', width: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, zIndex: 1 },
  line: { width: 2, flex: 1, marginVertical: -4 },
  card: { flex: 1, marginBottom: 20, borderRadius: 20, padding: 16, borderWidth: 1, ...Shadow.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  date: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  badgeRow: { flexDirection: 'row', gap: 6 },
  blockchainBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, gap: 2 },
  blockchainText: { fontSize: 8, fontWeight: '900', color: '#4F46E5' },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  scoreText: { fontSize: 10, fontWeight: '800' },
  cardHospital: { fontSize: 17, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  patientInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  patientName: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  amount: { fontSize: 16, fontWeight: '800' },
  fab: { position: 'absolute', bottom: 40, right: 0, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', ...Shadow.lg },
});
