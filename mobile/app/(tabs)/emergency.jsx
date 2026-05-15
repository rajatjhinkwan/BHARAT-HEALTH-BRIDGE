import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Linking, Animated, Easing, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import PressableScale from '@/components/ui/PressableScale';

import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/api';

export default function EmergencyScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const [sending, setSending] = useState(false);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pulsing Animation for SOS
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const fetchDonors = async () => {
    try {
      const authData = await SecureStore.getItemAsync('auth_data');
      if (!authData) return;
      const { token } = JSON.parse(authData);

      const res = await fetch(`${API_BASE_URL}/emergency/donors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDonors(data);
    } catch (err) {
      console.error('Fetch donors error:', err);
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
      const authData = await SecureStore.getItemAsync('auth_data');
      if (!authData) return;
      const { token } = JSON.parse(authData);

      const res = await fetch(`${API_BASE_URL}/emergency/alert`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bloodType: 'O+', location: 'Current GPS' })
      });

      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        alert('Emergency Response Dispatched! Responders notified.');
      }
    } catch (err) {
      alert('Network error while dispatching SOS');
    } finally {
      setSending(false);
    }
  };

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

          <Text style={styles.sosActionText}>{sending ? 'SIGNALING HELP...' : 'TAP AND HOLD TO ALERT'}</Text>
        </LinearGradient>

        <View style={styles.actionsGrid}>
          <View style={styles.gridRow}>
            <EmergencyAction icon="call" title="112 Police" color="#3B82F6" onPress={() => Linking.openURL('tel:112')} C={C} />
            <View style={{ width: 12 }} />
            <EmergencyAction icon="medkit" title="108 Ambulance" color="#10B981" onPress={() => Linking.openURL('tel:108')} C={C} />
          </View>
          <View style={{ height: 12 }} />
          <View style={styles.gridRow}>
            <EmergencyAction icon="water" title="Blood Bank" color="#F43F5E" onPress={() => { }} C={C} />
            <View style={{ width: 12 }} />
            <EmergencyAction icon="location" title="Trauma Center" color="#8B5CF6" onPress={() => { }} C={C} />
          </View>
        </View>

        <View style={styles.donorsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Nearby Volunteers</Text>
            <Text style={{ color: C.primaryBlue, fontWeight: '700', fontSize: 12 }}>View Map</Text>
          </View>
          <View style={styles.donorList}>
            {donors.length > 0 ? donors.map((d, i) => (
              <View key={i} style={[styles.donorCard, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                <View style={styles.donorInfo}>
                  <View style={styles.donorAvatar}><Text style={styles.avatarText}>{d.name[0]}</Text></View>
                  <View>
                    <Text style={[styles.donorName, { color: C.textPrimary }]}>{d.name}</Text>
                    <View style={styles.locationRow}>
                      <Ionicons name="navigate" size={10} color="#10B981" />
                      <Text style={{ fontSize: 11, color: '#10B981', marginLeft: 4 }}>{d.distanceKm} km • {d.verified ? 'Verified Responder' : 'Available'}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.bloodType}><Text style={styles.bloodText}>{d.bloodType}</Text></View>
              </View>
            )) : (
              <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 20 }}>No responders found in your immediate vicinity.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function EmergencyAction({ icon, title, color, onPress, C }) {
  return (
    <PressableScale onPress={onPress} style={[styles.actionCard, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
      <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color: C.textPrimary }]} numberOfLines={1}>{title}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  hero: { padding: 32, borderRadius: 40, alignItems: 'center', marginTop: 10 },
  heroText: { alignItems: 'center', marginBottom: 30 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 6, textAlign: 'center', fontWeight: '600' },

  sosContainer: { position: 'relative', width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 4, borderColor: '#fff' },
  sosCircle: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', elevation: 15, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 10 } },
  sosActionText: { color: '#fff', fontWeight: '800', fontSize: 12, marginTop: 30, letterSpacing: 1 },

  actionsGrid: { marginTop: 30, display: 'flex', justifyContent: 'start', alignItems: 'center' },
  gridRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionCard: { flex: 1, height: 64, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10, elevation: 2 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '800', flex: 1 },

  donorsSection: { marginTop: 36 },
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
});
