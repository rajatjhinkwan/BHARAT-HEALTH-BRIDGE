import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import PressableScale from '@/components/ui/PressableScale';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { listHospitals } from '@/lib/api';
import { HospitalSkeleton } from '@/components/ui/SkeletonLoader';
import UTTARAKHAND_HOSPITALS from '@/constants/uttarakhandHospitals.json';

const DISTRICTS = [
  'All',
  'Almora',
  'Bageshwar',
  'Chamoli',
  'Champawat',
  'Dehradun',
  'Haridwar',
  'Nainital',
  'Pauri Garhwal',
  'Pithoragarh',
  'Rudraprayag',
  'Tehri Garhwal',
  'Udham Singh Nagar',
  'Uttarkashi',
];

function mapOfflineRow(row) {
  return {
    _id: `offline-${row.sno}`,
    name: row.name,
    city: row.city,
    district: row.district,
    type: row.type === 'Private' ? 'Private' : 'Govt',
    latitude: row.latitude,
    longitude: row.longitude,
    rating: 4,
    specialties: [],
    emergency_support: /district|chc|civil|base|doon/i.test(row.name),
    bed_count: 20,
    ICU_count: 2,
    doctors_available: 5,
  };
}

export default function HospitalFinder() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingOffline, setUsingOffline] = useState(false);
  const [location, setLocation] = useState(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Nearest');
  const [districtFilter, setDistrictFilter] = useState('All');
  const mapRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);

  const fetchHospitals = async (loc = null) => {
    setLoading(true);
    setError('');
    try {
      let params = 'state=Uttarakhand&limit=200';
      if (emergencyMode) params += '&emergency_support=true';
      if (districtFilter !== 'All') params += `&district=${encodeURIComponent(districtFilter)}`;

      let data = await listHospitals(`?${params}`);
      setUsingOffline(false);

      if (loc && Array.isArray(data)) {
        data = data.map((h) => {
          if (h.latitude != null && h.longitude != null) {
            h.distance = getDistanceFromLatLonInKm(
              loc.latitude,
              loc.longitude,
              h.latitude,
              h.longitude
            );
          } else {
            h.distance = 999;
          }
          return h;
        });
        data.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      }

      setHospitals(data);
    } catch (err) {
      console.warn('Hospital API failed, using offline Uttarakhand list:', err.message);
      let offline = UTTARAKHAND_HOSPITALS.map(mapOfflineRow);
      if (districtFilter !== 'All') {
        offline = offline.filter((h) => h.district === districtFilter);
      }
      if (emergencyMode) offline = offline.filter((h) => h.emergency_support);
      if (loc) {
        offline.forEach((h) => {
          h.distance = getDistanceFromLatLonInKm(loc.latitude, loc.longitude, h.latitude, h.longitude);
        });
        offline.sort((a, b) => a.distance - b.distance);
      }
      setHospitals(offline);
      setUsingOffline(true);
      setError('Server offline — showing saved Uttarakhand hospital directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      let loc = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          loc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: 0.8,
            longitudeDelta: 0.8,
          };
          setLocation(loc);
        } else {
          setLocation({
            latitude: 30.0668,
            longitude: 79.0193,
            latitudeDelta: 1.2,
            longitudeDelta: 1.2,
          });
        }
      } catch {
        setLocation({
          latitude: 30.0668,
          longitude: 79.0193,
          latitudeDelta: 1.2,
          longitudeDelta: 1.2,
        });
      }
      await fetchHospitals(loc);
    })();
  }, []);

  useEffect(() => {
    fetchHospitals(location);
  }, [emergencyMode, districtFilter]);

  const filteredHospitals = useMemo(() => {
    let list = Array.isArray(hospitals) ? [...hospitals] : [];
    const q = query.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (h) =>
          h?.name?.toLowerCase().includes(q) ||
          h?.city?.toLowerCase().includes(q) ||
          h?.district?.toLowerCase().includes(q)
      );
    }
    if (activeFilter === 'Best Rated') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (activeFilter === 'Govt Only') {
      list = list.filter((h) => h?.type === 'Govt');
    } else if (activeFilter === 'Nearest' && list[0]?.distance != null) {
      list.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }
    return list;
  }, [query, hospitals, activeFilter]);

  const sortedHospitals = useMemo(() => {
    let list = [...filteredHospitals];
    if (selectedHospitalId) {
      const idx = list.findIndex((h) => h._id === selectedHospitalId);
      if (idx !== -1) {
        const item = list[idx];
        list.splice(idx, 1);
        list.unshift(item);
      }
    }
    return list;
  }, [filteredHospitals, selectedHospitalId]);

  const toggleEmergency = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setEmergencyMode(!emergencyMode);
  };

  const openNavigation = (h) => {
    const id = h._id || `offline`;
    router.push({
      pathname: '/hospital-navigation',
      params: {
        id: String(id),
        name: h.name,
        lat: String(h.latitude),
        lng: String(h.longitude),
      },
    });
  };

  return (
    <View style={styles.mainContainer}>
      <AppHeader title="Uttarakhand Hospitals" showBack={true} />

      {error ? (
        <View style={[styles.banner, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="cloud-offline-outline" size={18} color="#B45309" />
          <Text style={styles.bannerText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchHospitals(location)} style={[styles.syncRefreshBtn, { backgroundColor: 'rgba(180, 83, 9, 0.1)' }]}>
            <Ionicons name="refresh-outline" size={14} color="#B45309" />
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !usingOffline && !error ? (
        <View style={[styles.banner, { backgroundColor: '#ECFDF5' }]}>
          <Ionicons name="cloud-done-outline" size={18} color="#059669" />
          <Text style={[styles.bannerText, { color: '#047857' }]}>
            ● Live Cloud Sync Active — Connected to Bharat Health Server
          </Text>
          <TouchableOpacity onPress={() => fetchHospitals(location)} style={[styles.syncRefreshBtn, { backgroundColor: 'rgba(4, 120, 87, 0.1)' }]}>
            <Ionicons name="refresh-outline" size={14} color="#047857" />
          </TouchableOpacity>
        </View>
      ) : null}

      {usingOffline ? (
        <View style={[styles.banner, { backgroundColor: '#EFF6FF' }]}>
          <Ionicons name="save-outline" size={18} color="#2563EB" />
          <Text style={[styles.bannerText, { color: '#1D4ED8' }]}>
            ▲ Local Directory Active — {hospitals.length} facilities cached
          </Text>
          <TouchableOpacity onPress={() => fetchHospitals(location)} style={[styles.syncRefreshBtn, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
            <Ionicons name="refresh-outline" size={14} color="#2563EB" />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={[styles.mapContainer, { flex: isMinimized ? 0.78 : 0.4 }]}>
        {location ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={location}
            showsUserLocation
            onRegionChangeStart={() => setIsMinimized(true)}
            onPress={() => setIsMinimized(true)}
          >
            {filteredHospitals.slice(0, 80).map((h) =>
              h.latitude && h.longitude ? (
                <Marker
                  key={String(h._id)}
                  coordinate={{ latitude: h.latitude, longitude: h.longitude }}
                  title={h.name}
                  onPress={() => {
                    setIsMinimized(false);
                    setSelectedHospitalId(h._id);
                    if (mapRef.current) {
                      mapRef.current.animateToRegion({
                        latitude: h.latitude,
                        longitude: h.longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                      }, 600);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.markerWrap,
                      emergencyMode && h.emergency_support ? styles.markerEmergency : null,
                      selectedHospitalId === h._id ? { backgroundColor: C.primaryBlue, transform: [{ scale: 1.2 }] } : null,
                    ]}
                  >
                    <Ionicons name="medical" size={16} color="#fff" />
                  </View>
                </Marker>
              ) : null
            )}
          </MapView>
        ) : (
          <View style={[styles.map, styles.mapPlaceholder]}>
            <ActivityIndicator size="large" color={C.primaryBlue} />
          </View>
        )}

        <View style={styles.mapFloatingTop}>
          <View style={[styles.searchBox, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
            <Ionicons name="search" size={20} color={C.textSecondary} />
            <TextInput
              placeholder="Search hospital, city, district..."
              value={query}
              onChangeText={setQuery}
              style={{ flex: 1, marginLeft: 12, fontSize: 15, color: C.textPrimary }}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
      </View>

      <View style={[styles.bottomSheet, { flex: isMinimized ? 0.22 : 0.6, backgroundColor: C.background }]}>
        {/* Visual Pull Tab Handle for Collapse/Expand toggle */}
        <TouchableOpacity 
          onPress={() => setIsMinimized(!isMinimized)} 
          style={styles.pullTabHandle}
        >
          <View style={[styles.pullTab, { backgroundColor: C.border }]} />
          <Text style={{ fontSize: 10, color: C.textSecondary, fontWeight: '800', marginTop: 4 }}>
            {isMinimized ? "Tap to view full list" : "Tap to expand map view"}
          </Text>
        </TouchableOpacity>

        {!isMinimized && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.districtScroll}>
            {DISTRICTS.map((d) => (
              <PressableScale
                key={d}
                onPress={() => setDistrictFilter(d)}
                style={[
                  styles.pill,
                  districtFilter === d
                    ? { backgroundColor: C.primaryBlue, borderColor: C.primaryBlue }
                    : { backgroundColor: C.cardWhite, borderColor: C.border },
                ]}
              >
                <Text style={[styles.pillText, districtFilter === d && { color: '#fff' }]}>{d}</Text>
              </PressableScale>
            ))}
          </ScrollView>
        )}

        {!isMinimized && (
          <View style={styles.sheetHeader}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              <PressableScale
                onPress={toggleEmergency}
                style={[
                  styles.pill,
                  emergencyMode ? styles.pillEmergency : { backgroundColor: C.cardWhite, borderColor: C.border },
                ]}
              >
                <Ionicons name="warning" size={14} color={emergencyMode ? '#fff' : '#EF4444'} />
                <Text style={[styles.pillText, emergencyMode && { color: '#fff' }]}>Emergency</Text>
              </PressableScale>
              {['Nearest', 'Best Rated', 'Govt Only'].map((f) => (
                <FilterPill key={f} label={f} active={activeFilter === f} onPress={() => setActiveFilter(f)} C={C} />
              ))}
            </ScrollView>
            <Text style={[styles.countLabel, { color: C.textSecondary }]}>
              {filteredHospitals.length} facilities
            </Text>
          </View>
        )}

        {loading ? (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            <HospitalSkeleton />
            {!isMinimized && <HospitalSkeleton />}
            {!isMinimized && <HospitalSkeleton />}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {sortedHospitals.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 20, color: C.textSecondary }}>
                No hospitals match your search.
              </Text>
            ) : (
              (isMinimized ? sortedHospitals.slice(0, 1) : sortedHospitals).map((h) => (
                <HospitalCard
                  key={String(h._id)}
                  h={h}
                  C={C}
                  isSelected={selectedHospitalId === h._id}
                  onDetails={() => {
                    setSelectedHospitalId(h._id);
                    router.push(`/hospital-details?id=${h._id}`);
                  }}
                  onNavigate={() => {
                    setSelectedHospitalId(h._id);
                    openNavigation(h);
                  }}
                />
              ))
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function FilterPill({ label, active, onPress, C }) {
  return (
    <PressableScale
      onPress={onPress}
      style={[
        styles.pill,
        active ? { backgroundColor: C.primaryBlue, borderColor: C.primaryBlue } : { backgroundColor: C.cardWhite, borderColor: C.border },
      ]}
    >
      <Text style={[styles.pillText, active && { color: '#fff' }]}>{label}</Text>
    </PressableScale>
  );
}

function HospitalCard({ h, C, isSelected, onDetails, onNavigate }) {
  const isEmergency = h.emergency_support;
  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: C.cardWhite, 
        borderColor: isSelected ? C.primaryBlue : (isEmergency ? '#FEF2F2' : C.border),
        borderWidth: isSelected ? 2.5 : 1
      }
    ]}>
      <PressableScale onPress={onDetails}>
        <View style={styles.cardHeader}>
          <View style={[styles.hospitalIcon, { backgroundColor: isEmergency ? '#FEF2F2' : C.background }]}>
            <Ionicons name="medical" size={22} color={isEmergency ? '#EF4444' : C.primaryBlue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.breedName, { color: C.textPrimary }]} numberOfLines={2}>
              {h.name}
            </Text>
            <Text style={styles.levelText}>
              {h.type} · {h.district || h.city}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location" size={14} color="#6B7280" />
          <Text style={styles.metaText}>
            {h.distance != null ? `${h.distance.toFixed(1)} km` : h.city}
          </Text>
        </View>
      </PressableScale>
      <View style={styles.cardActions}>
        <PressableScale onPress={onNavigate} style={[styles.navBtn, { backgroundColor: C.primaryBlue }]}>
          <Ionicons name="navigate" size={16} color="#fff" />
          <Text style={styles.navBtnText}>Navigate</Text>
        </PressableScale>
        <PressableScale onPress={onDetails} style={[styles.detailBtn, { borderColor: C.border }]}>
          <Text style={{ color: C.primaryBlue, fontWeight: '700', fontSize: 13 }}>Details</Text>
        </PressableScale>
      </View>
    </View>
  );
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bannerText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#B45309' },
  mapContainer: { flex: 0.4, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  mapPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  markerWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerEmergency: { backgroundColor: '#EF4444' },
  mapFloatingTop: { position: 'absolute', top: 12, left: 12, right: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    ...Shadow.sm,
  },
  bottomSheet: { flex: 0.6, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -12, paddingTop: 8 },
  districtScroll: { paddingHorizontal: 16, marginBottom: 8, maxHeight: 44 },
  sheetHeader: { paddingHorizontal: 16, marginBottom: 8 },
  filterRow: { flexDirection: 'row', gap: 8, paddingRight: 24 },
  countLabel: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  pillEmergency: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  pillText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  card: { borderRadius: 20, padding: 14, borderWidth: 1, ...Shadow.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  hospitalIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  breedName: { fontSize: 15, fontWeight: '800' },
  levelText: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  metaText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  navBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  detailBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  syncRefreshBtn: {
    padding: 6,
    borderRadius: 8,
  },
  pullTabHandle: {
    alignItems: 'center',
    paddingVertical: 6,
    width: '100%',
    marginBottom: 6,
  },
  pullTab: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
});
