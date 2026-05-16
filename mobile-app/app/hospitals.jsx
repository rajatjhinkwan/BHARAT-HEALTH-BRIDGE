import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Radius, Shadow } from '@/constants/theme';
import { HOME_MOCK_DATA } from '@/constants/mockData';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import PressableScale from '@/components/ui/PressableScale';

import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/api';

export default function HospitalFinder() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const [query, setQuery] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const authData = await SecureStore.getItemAsync('auth_data');
      if (!authData) return;
      const { token } = JSON.parse(authData);

      const res = await fetch(`${API_BASE_URL}/hospitals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setHospitals(data);
    } catch (err) {
      console.error('Fetch hospitals error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHospitals = useMemo(() => {
    const q = query.toLowerCase();
    const list = hospitals.length > 0 ? hospitals : HOME_MOCK_DATA.hospitals;
    return list.filter(h =>
      h.name.toLowerCase().includes(q) ||
      (h.level && h.level.toLowerCase().includes(q)) ||
      (h.city && h.city.toLowerCase().includes(q))
    );
  }, [query, hospitals]);

  return (
    <ScreenWrapper>
      <AppHeader title="Care Discovery" showBell bellBadge={3} showBack={true} />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.h1, { color: C.textPrimary }]}>Find Excellence</Text>
          <View style={[styles.searchBox, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
            <Ionicons name="search" size={20} color={C.textSecondary} />
            <TextInput
              placeholder="Hospital name or specialty..."
              value={query}
              onChangeText={setQuery}
              style={{ flex: 1, marginLeft: 12, fontSize: 16 }}
            />
            <PressableScale><Ionicons name="options-outline" size={20} color={C.primaryBlue} /></PressableScale>
          </View>
        </View>

        <View style={styles.filterRow}>
          <FilterPill label="Nearest" active />
          <FilterPill label="Best Rated" />
          <FilterPill label="Low Cost" />
          <FilterPill label="NABH" />
        </View>

        <View style={styles.list}>
          {filteredHospitals.map((h) => (
            <HospitalCard key={h.id} h={h} C={C} />
          ))}
        </View>
      </View>
    </ScreenWrapper>
  );
}

function FilterPill({ label, active }) {
  return (
    <PressableScale style={[styles.pill, active && { backgroundColor: '#3B82F6', borderColor: '#3B82F6' }]}>
      <Text style={[styles.pillText, active && { color: '#fff' }]}>{label}</Text>
    </PressableScale>
  );
}

function HospitalCard({ h, C }) {
  return (
    <PressableScale style={[styles.card, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.hospitalIcon, { backgroundColor: C.background }]}>
          <Ionicons name="business" size={24} color={C.primaryBlue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.breedName, { color: C.textPrimary }]}>{h.name}</Text>
          <Text style={styles.levelText}>{h.level || h.type} • {h.quality || (h.specialties ? h.specialties[0] : 'General')}</Text>
        </View>
        <View style={styles.ratingBox}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingText}>{h.rating || '4.0'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{h.dist || h.city || 'Nearby'}</Text>
          </View>
          <View style={styles.meta}>
            <Ionicons name="wallet-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{h.cost || (h.type === 'Govt' ? 'Free/Low' : 'Private')}</Text>
          </View>
        </View>
        <View style={[styles.bookBtn, { backgroundColor: C.primaryBlue + '15' }]}>
          <Text style={{ color: C.primaryBlue, fontWeight: '700', fontSize: 12 }}>Details</Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  header: { marginBottom: 16, marginTop: 10 },
  h1: { fontSize: 26, fontWeight: '800' },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderRadius: 20, borderWidth: 1, marginTop: 16, ...Shadow.sm },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', backgroundColor: '#fff' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  list: { gap: 16, paddingBottom: 40 },
  card: { borderRadius: 24, padding: 16, borderWidth: 1, ...Shadow.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  hospitalIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  breedName: { fontSize: 17, fontWeight: '800' },
  levelText: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#B45309' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  metaRow: { flexDirection: 'row', gap: 16 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  bookBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }
});
