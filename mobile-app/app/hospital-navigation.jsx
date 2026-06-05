import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking, Alert, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import PressableScale from '@/components/ui/PressableScale';
import { API_BASE_URL } from '@/constants/api';
import { LinearGradient } from 'expo-linear-gradient';

const SERVICE_RADIUS_KM = 50;

export default function HospitalNavigation() {
  const { id, name, lat, lng } = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const mapRef = useRef(null);

  const destLat = parseFloat(lat);
  const destLng = parseFloat(lng);
  const [userLoc, setUserLoc] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setUserLoc({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
        if (id && id !== 'undefined') {
          const res = await fetch(`${API_BASE_URL}/hospitals/${id}`);
          if (res.ok) setHospital(await res.json());
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!mapRef.current || !userLoc || !destLat) return;
    mapRef.current.fitToCoordinates(
      [userLoc, { latitude: destLat, longitude: destLng }],
      { edgePadding: { top: 80, right: 40, bottom: 200, left: 40 }, animated: true }
    );
  }, [userLoc, destLat, destLng]);

  const openGoogleMaps = () => {
    const label = encodeURIComponent(hospital?.name || name || 'Hospital');
    const url = Platform.select({
      ios: `maps://?daddr=${destLat},${destLng}&q=${label}`,
      android: `google.navigation:q=${destLat},${destLng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&destination_place_id=${label}`
      );
    });
  };

  const openUberOla = () => {
    Alert.alert(
      'Navigate',
      'Choose how you want to travel',
      [
        { text: 'Google Maps', onPress: openGoogleMaps },
        {
          text: 'Open in Browser Map',
          onPress: () =>
            Linking.openURL(`https://www.openstreetmap.org/directions?to=${destLat}%2C${destLng}`),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const distanceKm =
    userLoc && destLat
      ? getDistanceKm(userLoc.latitude, userLoc.longitude, destLat, destLng)
      : null;

  const isOutOfRadius = distanceKm != null && distanceKm > SERVICE_RADIUS_KM;

  const routeCoords =
    userLoc && destLat
      ? [userLoc, { latitude: destLat, longitude: destLng }]
      : [{ latitude: destLat, longitude: destLng }];

  const displayName = hospital?.name || name || 'Hospital';

  return (
    <View style={styles.root}>
      <AppHeader title="Hospital Navigation" showBack />

      <View style={styles.mapWrap}>
        {loading ? (
          <ActivityIndicator size="large" color={C.primaryBlue} style={styles.loader} />
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: destLat || 30.0668,
              longitude: destLng || 79.0193,
              latitudeDelta: 0.8,
              longitudeDelta: 0.8,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            {destLat && destLng && (
              <Marker
                coordinate={{ latitude: destLat, longitude: destLng }}
                title={displayName}
                description={hospital?.city || 'Uttarakhand'}
              >
                <View style={styles.destMarker}>
                  <Ionicons name="medical" size={22} color="#fff" />
                </View>
              </Marker>
            )}
            {routeCoords.length > 1 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor={C.primaryBlue}
                strokeWidth={4}
                lineDashPattern={[1]}
              />
            )}
          </MapView>
        )}
      </View>

      <View style={[styles.panel, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
        {isOutOfRadius && (
          <View style={styles.outOfRadiusBanner}>
            <Ionicons name="warning" size={20} color="#B45309" />
            <View style={{ flex: 1 }}>
              <Text style={styles.outOfRadiusTitle}>Outside service radius</Text>
              <Text style={styles.outOfRadiusText}>
                You are {distanceKm.toFixed(1)} km away. This hospital is only reachable within a {SERVICE_RADIUS_KM} km radius for in-app navigation.
              </Text>
            </View>
          </View>
        )}

        <Text style={[styles.hospitalName, { color: C.textPrimary }]} numberOfLines={2}>
          {displayName}
        </Text>
        <Text style={[styles.meta, { color: C.textSecondary }]}>
          {hospital?.district || 'Uttarakhand'}
          {hospital?.city ? ` · ${hospital.city}` : ''}
          {distanceKm != null ? ` · ${distanceKm.toFixed(1)} km away` : ''}
        </Text>

        <PressableScale
          onPress={() => {
            if (isOutOfRadius) {
              Alert.alert(
                'Outside Service Radius',
                `You are ${distanceKm?.toFixed(1)} km away. In-app navigation is only available within ${SERVICE_RADIUS_KM} km of this hospital.`
              );
              return;
            }
            openGoogleMaps();
          }}
          style={[styles.navBtn, isOutOfRadius && { opacity: 0.55 }]}
        >
          <LinearGradient colors={[isOutOfRadius ? '#9CA3AF' : C.primaryBlue, isOutOfRadius ? '#6B7280' : '#2563EB']} style={styles.navGradient}>
            <Ionicons name={isOutOfRadius ? 'location-outline' : 'navigate'} size={22} color="#fff" />
            <Text style={styles.navText}>{isOutOfRadius ? 'Out of Radius' : 'Start Navigation'}</Text>
          </LinearGradient>
        </PressableScale>

        <PressableScale 
          onPress={() => router.push({
            pathname: '/hospital-indoor',
            params: { id: String(id), name: displayName }
          })} 
          style={[styles.indoorBtn, { borderColor: C.primaryBlue, backgroundColor: C.primaryBlue + '08' }]}
        >
          <Ionicons name="footsteps" size={20} color={C.primaryBlue} />
          <Text style={[styles.indoorBtnText, { color: C.primaryBlue }]}>Enter Indoor GPS Map</Text>
        </PressableScale>


      </View>
    </View>
  );
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  destMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...Shadow.md,
  },
  panel: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    marginTop: -16,
    ...Shadow.lg,
  },
  hospitalName: { fontSize: 20, fontWeight: '900' },
  meta: { fontSize: 13, fontWeight: '600', marginTop: 6, marginBottom: 16 },
  navBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  navGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  navText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  indoorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    ...Shadow.sm
  },
  indoorBtnText: {
    fontSize: 15,
    fontWeight: '800'
  },
  outOfRadiusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  outOfRadiusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 4,
  },
  outOfRadiusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 17,
  },
  secondaryRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
});
