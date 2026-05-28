import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Linking, Image, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import PressableScale from '@/components/ui/PressableScale';
import { API_BASE_URL } from '@/constants/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function HospitalDetails() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) fetchHospitalDetails();
  }, [id]);

  const fetchHospitalDetails = async () => {
    try {
      if (String(id).startsWith('offline-')) {
        const UTT = require('@/constants/uttarakhandHospitals.json');
        const sno = parseInt(String(id).replace('offline-', ''), 10);
        const row = UTT.find((r) => r.sno === sno);
        if (row) {
          setHospital({
            name: row.name,
            city: row.city,
            district: row.district,
            type: row.type === 'Private' ? 'Private' : 'Govt',
            latitude: row.latitude,
            longitude: row.longitude,
            rating: 4,
            specialties: ['General Medicine'],
            facilities: ['OPD', 'Emergency'],
            emergency_support: true,
            bed_count: 30,
            ICU_count: 2,
            doctors_available: 5,
          });
        }
        return;
      }
      const res = await fetch(`${API_BASE_URL}/hospitals/${id}`);
      const data = await res.json();
      if (res.ok) setHospital(data);
    } catch (err) {
      console.error('Fetch hospital details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (hospital?.contact_phone) {
      Linking.openURL(`tel:${hospital.contact_phone}`);
    } else {
      alert("Phone number not available");
    }
  };

  const handleNavigate = () => {
    if (hospital?.latitude && hospital?.longitude) {
      router.push({
        pathname: '/hospital-navigation',
        params: {
          id: String(id),
          name: hospital.name,
          lat: String(hospital.latitude),
          lng: String(hospital.longitude),
        },
      });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${hospital.name} in ${hospital.city}. They have ${hospital.bed_count} beds available.`,
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primaryBlue} />
      </View>
    );
  }

  if (!hospital) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <Text style={{ color: C.textPrimary }}>Hospital not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: C.primaryBlue }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isEmergency = hospital.emergency_support;

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        
        {/* HEADER BANNER */}
        <View style={styles.headerBanner}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2000&auto=format&fit=crop' }} 
            style={styles.bannerImage} 
          />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.bannerGradient} />
          
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.favBtn} onPress={() => setIsFavorite(!isFavorite)}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#EF4444" : "#fff"} />
          </TouchableOpacity>

          <View style={styles.bannerContent}>
            {isEmergency && (
              <View style={styles.emergencyBadge}>
                <Ionicons name="flash" size={14} color="#fff" />
                <Text style={styles.emergencyText}>24/7 EMERGENCY READY</Text>
              </View>
            )}
            <Text style={styles.title}>{hospital.name}</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitle}>{hospital.type} Hospital</Text>
              <Text style={styles.dot}>•</Text>
              <Ionicons name="star" size={14} color="#FBBF24" />
              <Text style={styles.rating}>{hospital.rating ? hospital.rating.toFixed(1) : 'New'}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.subtitle}>{hospital.city}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* ACTION BUTTONS */}
          <View style={styles.actionRow}>
            <ActionButton icon="call" label="Call" color="#10B981" onPress={handleCall} C={C} />
            <ActionButton icon="navigate" label="Directions" color="#3B82F6" onPress={handleNavigate} C={C} />
            <ActionButton icon="share-social" label="Share" color="#8B5CF6" onPress={handleShare} C={C} />
          </View>

          {/* LIVE STATUS */}
          <View style={[styles.section, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
            <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Live Availability</Text>
            <View style={styles.statsGrid}>
              <LiveStat icon="bed" value={hospital.bed_count || 0} label="General Beds" color="#3B82F6" />
              <LiveStat icon="heart-half" value={hospital.ICU_count || 0} label="ICU Beds" color="#EF4444" />
              <LiveStat icon="people" value={hospital.doctors_available || 0} label="Doctors on Duty" color="#10B981" />
              <LiveStat icon="time" value="~15m" label="ER Wait Time" color="#F59E0B" />
            </View>
          </View>

          {/* SPECIALTIES */}
          <View style={[styles.section, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
            <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Departments & Specialties</Text>
            <View style={styles.chipContainer}>
              {hospital.specialties && hospital.specialties.length > 0 ? (
                hospital.specialties.map((s, i) => (
                  <View key={i} style={[styles.chip, { backgroundColor: C.primaryBlue + '15' }]}>
                    <Text style={{ color: C.primaryBlue, fontWeight: '600' }}>{s}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: C.textSecondary }}>General Medicine</Text>
              )}
            </View>
          </View>

          {/* FACILITIES */}
          <View style={[styles.section, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
            <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Facilities</Text>
            <View style={styles.facilityList}>
              <FacilityItem icon="car" text="24/7 Ambulance Support" active={true} C={C} />
              <FacilityItem icon="water" text="Blood Bank" active={hospital.facilities?.includes('Blood Bank')} C={C} />
              <FacilityItem icon="flask" text="Diagnostic Lab" active={hospital.facilities?.includes('Lab')} C={C} />
              <FacilityItem icon="medkit" text="24/7 Pharmacy" active={hospital.facilities?.includes('Pharmacy')} C={C} />
              <FacilityItem icon="fitness" text="Oxygen Support" active={true} C={C} />
            </View>
          </View>
          
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function ActionButton({ icon, label, color, onPress, C }) {
  return (
    <PressableScale onPress={onPress} style={[styles.actionBtn, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
      <View style={[styles.actionIconWrap, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color: C.textPrimary }]}>{label}</Text>
    </PressableScale>
  );
}

function LiveStat({ icon, value, label, color }) {
  return (
    <View style={styles.liveStat}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

function FacilityItem({ icon, text, active, C }) {
  return (
    <View style={styles.facilityItem}>
      <Ionicons name={icon} size={20} color={active ? C.primaryBlue : '#9CA3AF'} />
      <Text style={[styles.facilityText, { color: active ? C.textPrimary : '#9CA3AF', textDecorationLine: active ? 'none' : 'line-through' }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  
  headerBanner: { height: 300, position: 'relative' },
  bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200 },
  
  backBtn: { position: 'absolute', top: 50, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  favBtn: { position: 'absolute', top: 50, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  
  bannerContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  emergencyBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8, gap: 4 },
  emergencyText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 4 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  dot: { color: 'rgba(255,255,255,0.5)', marginHorizontal: 8 },
  rating: { color: '#FBBF24', fontSize: 14, fontWeight: '800', marginLeft: 4 },

  content: { padding: 20, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#F8FAFC' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 24 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 20, borderWidth: 1, ...Shadow.sm },
  actionIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '700' },

  section: { padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 16, ...Shadow.sm },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  liveStat: { width: '50%', padding: 8, alignItems: 'center' },
  statVal: { fontSize: 24, fontWeight: '900', marginTop: 8, color: '#1E293B' },
  statLbl: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 },

  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },

  facilityList: { gap: 12 },
  facilityItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  facilityText: { fontSize: 15, fontWeight: '600' }
});
