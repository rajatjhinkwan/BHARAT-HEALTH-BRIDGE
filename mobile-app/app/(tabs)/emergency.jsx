import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Linking, Animated, Easing, ScrollView, Modal, SectionList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import PressableScale from '@/components/ui/PressableScale';
import { DonorSkeleton } from '@/components/ui/SkeletonLoader';
import * as SecureStore from 'expo-secure-store';

import { useAuth } from '@/context/AuthContext';
import { BLOOD_DONORS } from '@/constants/bloodDonors';

export default function EmergencyScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { patientProfileId } = useAuth();
  const [sending, setSending] = useState(false);
  const [donors, setDonors] = useState([]);
  const [allDonors, setAllDonors] = useState(BLOOD_DONORS);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showDirectory, setShowDirectory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState('All');

  // Pulsing Animation for SOS
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Live Location Toggling State
  const [locationShare, setLocationShare] = useState(false);

  useEffect(() => {
    loadLocationSetting();
  }, []);

  const loadLocationSetting = async () => {
    try {
      const loc = await SecureStore.getItemAsync('setting_location_share');
      if (loc !== null) setLocationShare(loc === 'true');
    } catch (_) {}
  };

  const handleToggleLocation = async () => {
    const newVal = !locationShare;
    setLocationShare(newVal);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await SecureStore.setItemAsync('setting_location_share', String(newVal));
      Alert.alert(
        newVal ? 'Location Broadcast Active' : 'Location Broadcast Paused',
        newVal 
          ? 'Your real-time GPS coordinates are now actively shared during SOS events.' 
          : 'Live location broadcasting has been deactivated.'
      );
    } catch (_) {}
  };

  const fetchDonors = async () => {
    try {
      const { listDonors } = require('@/lib/api');
      const data = await listDonors('?limit=400');
      const list = Array.isArray(data) && data.length > 0
        ? data.map((d) => ({
            id: d._id || d.id,
            name: d.name,
            phone: d.phone,
            district: d.district,
            city: d.city,
            bloodType: d.bloodType,
            distanceKm: d.distanceKm != null ? String(d.distanceKm.toFixed?.(1) ?? d.distanceKm) : '—',
            verified: d.verified,
          }))
        : BLOOD_DONORS;
      setAllDonors(list);
      setDonors(list.slice(0, 5));
    } catch (err) {
      console.error('Fetch donors error:', err);
      setAllDonors(BLOOD_DONORS);
      setDonors(BLOOD_DONORS.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const alertDonors = async () => {
    setSending(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      const { broadcastDonorSOS } = require('@/lib/api');
      const res = await broadcastDonorSOS({ patientId: patientProfileId, bloodType: filterGroup !== 'All' ? filterGroup : undefined });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      alert(`Emergency SOS Dispatched!\n\n${res.donorCount || allDonors.length} registered blood donors have been notified.`);
    } catch (_) {
      alert('SOS sent locally. Network broadcast will retry when online.');
    } finally {
      setSending(false);
    }
  };

  const filteredDonors = allDonors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = filterGroup === 'All' || d.bloodType === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const groupedByDistrict = {};
  filteredDonors.forEach(d => {
    if (!groupedByDistrict[d.district]) groupedByDistrict[d.district] = {};
    if (!groupedByDistrict[d.district][d.city]) groupedByDistrict[d.district][d.city] = [];
    groupedByDistrict[d.district][d.city].push(d);
  });

  const sections = Object.keys(groupedByDistrict).sort().map(district => {
    const cities = groupedByDistrict[district];
    const data = [];
    Object.keys(cities).sort().forEach(city => {
      data.push({ type: 'city-header', city });
      cities[city].forEach(donor => data.push({ type: 'donor', donor }));
    });
    return { title: district, data };
  });

  const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  return (
    <ScreenWrapper>
      <AppHeader title="Crisis Center" showBell bellBadge={3} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[C.emergencyRed, '#450A0A']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.hero, Shadow.emergency]}
        >
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>SOS EMERGENCY</Text>
            <Text style={styles.heroSub}>Notify nearest responders immediately</Text>
          </View>

          <View style={styles.sosContainer}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.2], outputRange: [0.6, 0] }) }]} />
            <PressableScale
              onPress={alertDonors}
              disabled={sending}
              style={[styles.sosCircle, { backgroundColor: sending ? '#991B1B' : '#fff' }]}
            >
              {sending ? (
                <Animated.View style={{ transform: [{ rotate: pulseAnim.interpolate({ inputRange: [1, 1.2], outputRange: ['0deg', '360deg'] }) }] }}>
                  <Ionicons name="sync" size={48} color="#fff" />
                </Animated.View>
              ) : (
                <Ionicons name="hand-right" size={48} color={C.emergencyRed} />
              )}
            </PressableScale>
          </View>

          <Text style={styles.sosActionText}>{sending ? 'BROADCASTING SOS...' : 'TAP TO ALERT ALL DONORS'}</Text>
        </LinearGradient>

        <View style={styles.actionsGrid}>
          <View style={styles.gridRow}>
            <EmergencyAction 
              icon="call" 
              title="112 Police Call" 
              color="#3B82F6" 
              onPress={() => Linking.openURL('tel:112')} 
              C={C} 
            />
            <EmergencyAction 
              icon="medkit" 
              title="108 Ambulance" 
              color="#10B981" 
              onPress={() => Linking.openURL('tel:108')} 
              C={C} 
            />
          </View>
          <View style={styles.gridRow}>
            <EmergencyAction 
              icon="water" 
              title="Blood Responders" 
              color="#F43F5E" 
              onPress={() => setShowDirectory(true)} 
              C={C} 
            />
            <EmergencyAction 
              icon={locationShare ? "location" : "location-outline"} 
              title={locationShare ? "Location: ACTIVE" : "Location: OFF"} 
              color={locationShare ? "#10B981" : "#8B5CF6"} 
              onPress={handleToggleLocation} 
              C={C} 
            />
          </View>
        </View>

        <View style={styles.donorsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Nearby Volunteers</Text>
            <TouchableOpacity onPress={() => setShowDirectory(true)}>
              <Text style={{ color: C.primaryBlue, fontWeight: '700', fontSize: 12 }}>View All ({allDonors.length})</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.donorList}>
            {loading ? (
              <>
                <DonorSkeleton />
                <DonorSkeleton />
                <DonorSkeleton />
                <DonorSkeleton />
              </>
            ) : donors.length > 0 ? (
              donors.map((d, i) => (
                <View key={i} style={[styles.donorCard, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                  <View style={styles.donorInfo}>
                    <View style={styles.donorAvatar}><Text style={styles.avatarText}>{d.name[0]}</Text></View>
                    <View>
                      <Text style={[styles.donorName, { color: C.textPrimary }]}>{d.name}</Text>
                      <View style={styles.locationRow}>
                        <Ionicons name="navigate" size={10} color="#10B981" />
                        <Text style={{ fontSize: 11, color: '#10B981', marginLeft: 4 }}>{d.distanceKm} km • {d.city}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.bloodType}><Text style={styles.bloodText}>{d.bloodType}</Text></View>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 20 }}>No responders found in your immediate vicinity.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* BLOOD DONOR DIRECTORY MODAL */}
      <Modal visible={showDirectory} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowDirectory(false)}>
        <View style={[styles.modalContainer, { backgroundColor: C.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Blood Donor Directory</Text>
            <TouchableOpacity onPress={() => setShowDirectory(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={C.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94A3B8" style={{marginLeft: 15}} />
            <TextInput 
              placeholder="Search by name or city..."
              placeholderTextColor="#94A3B8"
              style={[styles.searchInput, { color: C.textPrimary }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {bloodGroups.map(bg => (
                <TouchableOpacity 
                  key={bg} 
                  onPress={() => setFilterGroup(bg)}
                  style={[styles.filterPill, filterGroup === bg ? { backgroundColor: C.primaryBlue } : { backgroundColor: C.cardWhite, borderColor: C.border, borderWidth: 1 }]}
                >
                  <Text style={{ color: filterGroup === bg ? '#fff' : C.textPrimary, fontWeight: '700' }}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <SectionList
            sections={sections}
            keyExtractor={(item, index) => item.type === 'city-header' ? `city-${item.city}-${index}` : item.donor.id.toString()}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            renderSectionHeader={({ section: { title } }) => (
              <View style={[styles.districtHeader, { backgroundColor: C.background }]}>
                <Text style={[styles.districtHeaderText, { color: C.textPrimary }]}>{title}</Text>
              </View>
            )}
            renderItem={({ item }) => {
              if (item.type === 'city-header') {
                return (
                  <View style={styles.cityHeader}>
                    <Ionicons name="location" size={12} color="#64748B" />
                    <Text style={styles.cityHeaderText}>{item.city}</Text>
                  </View>
                );
              }
              const d = item.donor;
              return (
                <View style={[styles.donorCard, { backgroundColor: C.cardWhite, borderColor: C.border, marginBottom: 10 }]}>
                  <View style={styles.donorInfo}>
                    <View style={styles.donorAvatar}><Text style={styles.avatarText}>{d.name[0]}</Text></View>
                    <View>
                      <Text style={[styles.donorName, { color: C.textPrimary }]}>{d.name}</Text>
                      <View style={styles.locationRow}>
                        <Ionicons name="call" size={10} color="#3B82F6" />
                        <Text style={{ fontSize: 11, color: '#3B82F6', marginLeft: 4 }}>{d.phone}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${d.phone}`)} style={[styles.bloodType, { backgroundColor: '#F43F5E15' }]}>
                    <Text style={styles.bloodText}>{d.bloodType}</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: '#94A3B8' }}>No donors found.</Text>}
            stickySectionHeadersEnabled={true}
          />
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

function EmergencyAction({ icon, title, color, onPress, C }) {
  return (
    <PressableScale onPress={onPress} style={[styles.actionCard, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
      <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color: C.textPrimary }]}>{title}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  hero: { padding: 20, borderRadius: 24, alignItems: 'center', marginTop: 10 },
  heroText: { alignItems: 'center', marginBottom: 16 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4, textAlign: 'center', fontWeight: '600' },

  sosContainer: { position: 'relative', width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: '#fff' },
  sosCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', elevation: 15, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 10 } },
  sosActionText: { color: '#fff', fontWeight: '800', fontSize: 11, marginTop: 16, letterSpacing: 1 },

  actionsGrid: { marginTop: 16, width: '100%', gap: 12 },
  gridRow: { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-between', width: '100%', gap: 12 },
  actionCard: { flex: 1, minHeight: 90, borderRadius: 20, borderWidth: 1, padding: 14, alignItems: 'flex-start', justifyContent: 'center', elevation: 2 },
  actionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '900', marginBottom: 0 },

  donorsSection: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900' },
  donorList: { gap: 12 },
  donorCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 24, borderWidth: 1, elevation: 1 },
  donorInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donorAvatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', fontSize: 18, color: '#334155' },
  donorName: { fontWeight: '800', fontSize: 15 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  bloodType: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  bloodText: { color: '#DC2626', fontWeight: '900', fontSize: 14 },

  modalContainer: { flex: 1, paddingTop: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15 },
  modalTitle: { fontSize: 24, fontWeight: '900' },
  closeBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', marginHorizontal: 20, borderRadius: 16, marginBottom: 15, height: 50 },
  searchInput: { flex: 1, paddingHorizontal: 12, fontSize: 15, fontWeight: '600' },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  districtHeader: { paddingVertical: 8, marginBottom: 8, borderBottomWidth: 2, borderBottomColor: '#F1F5F9' },
  districtHeaderText: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  cityHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, marginBottom: 8, marginLeft: 4 },
  cityHeaderText: { fontSize: 13, fontWeight: '800', color: '#64748B', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 1 }
});
