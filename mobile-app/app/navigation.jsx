import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Animated,
  Easing,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

// --------------------------------------------------------------------------
// 1. PHYSICAL ABSOLUTE GPS DIAGRAM CALIBRATION MATRIX
// --------------------------------------------------------------------------

const CALIBRATION_POINTS = [
  { name: 'A_top_left', lat: 30.410213, lon: 79.316419, x: 80, y: 40 },
  { name: 'A_top_right', lat: 30.410228, lon: 79.316420, x: 520, y: 40 },
  { name: 'A_bottom_left_ext', lat: 30.410191, lon: 79.316426, x: 80, y: 200 },
  { name: 'B_top_left', lat: 30.410208, lon: 79.316411, x: 140, y: 200 },
  { name: 'B_bottom_left', lat: 30.410223, lon: 79.316445, x: 140, y: 360 },
  { name: 'B_top_right', lat: 30.410204, lon: 79.316462, x: 300, y: 200 },
  { name: 'B_bottom_right', lat: 30.410198, lon: 79.316441, x: 300, y: 360 },
  { name: 'C_top_right', lat: 30.410208, lon: 79.316449, x: 520, y: 200 },
  { name: 'C_bottom_right', lat: 30.410159, lon: 79.316428, x: 520, y: 360 }
];

// Multi-point Inverse Distance Weighting (IDW) absolute mapping formula
function mapGPSToScreen(lat, lon) {
  let sumW = 0;
  let sumWX = 0;
  let sumWY = 0;

  for (let i = 0; i < CALIBRATION_POINTS.length; i++) {
    const pt = CALIBRATION_POINTS[i];
    const d = Math.hypot(lat - pt.lat, lon - pt.lon);
    
    if (d < 0.0000001) {
      return { x: pt.x, y: pt.y };
    }

    const w = 1 / (d * d);
    sumW += w;
    sumWX += w * pt.x;
    sumWY += w * pt.y;
  }

  return {
    x: Math.round(sumWX / sumW),
    y: Math.round(sumWY / sumW)
  };
}

function getCurrentRoom(x, y) {
  if (x >= 80 && x <= 520 && y >= 40 && y <= 200) {
    return 'Room A (Upper)';
  }
  if (x >= 140 && x <= 300 && y >= 200 && y <= 360) {
    return 'Room B (Lower Left)';
  }
  if (x >= 300 && x <= 520 && y >= 200 && y <= 360) {
    return 'Room C (Lower Right)';
  }
  return 'Corridor / Transition Area';
}

const ROOMS = {
  room_A: { id: 'room_A', name: 'Room A (Upper)', x: 80, y: 40, w: 440, h: 160, color: 'rgba(139, 92, 246, 0.06)' },
  room_B: { id: 'room_B', name: 'Room B (Lower Left)', x: 140, y: 200, w: 160, h: 160, color: 'rgba(16, 185, 129, 0.06)' },
  room_C: { id: 'room_C', name: 'Room C (Lower Right)', x: 300, y: 200, w: 220, h: 160, color: 'rgba(14, 165, 233, 0.06)' }
};

const DOORS = {
  door_AB: { x: 220, y: 200, name: 'Door A-B' },
  door_AC: { x: 410, y: 200, name: 'Door A-C' },
  door_BC: { x: 300, y: 280, name: 'Door B-C' },
  door_exit: { x: 80, y: 120, name: 'Exit Door' }
};

const NODES = {
  n_room_A: { x: 300, y: 120 },
  n_room_B: { x: 220, y: 280 },
  n_room_C: { x: 410, y: 280 }
};

export default function HospitalNavigationMap() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const isDark = scheme === 'dark';

  // User position states - default inside Room B
  const [userX, setUserX] = useState(NODES.n_room_B.x);
  const [userY, setUserY] = useState(NODES.n_room_B.y);
  const [userHeading, setUserHeading] = useState(0);

  // REAL GEOLOCATION states
  const [isGPSTracking, setIsGPSTracking] = useState(false);
  const [currentGPS, setCurrentGPS] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const watchSubscriptionRef = useRef(null);

  // Breathing rings animation
  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      })
    ).start();
  }, []);

  // Smooth springs for locator dot
  const animUserX = useRef(new Animated.Value(NODES.n_room_B.x)).current;
  const animUserY = useRef(new Animated.Value(NODES.n_room_B.y)).current;

  useEffect(() => {
    Animated.spring(animUserX, {
      toValue: userX,
      tension: 25,
      friction: 6,
      useNativeDriver: false,
    }).start();
  }, [userX]);

  useEffect(() => {
    Animated.spring(animUserY, {
      toValue: userY,
      tension: 25,
      friction: 6,
      useNativeDriver: false,
    }).start();
  }, [userY]);

  // Compass Heading watcher
  useEffect(() => {
    let headingSubscription;
    const startHeadingWatch = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          headingSubscription = await Location.watchHeadingAsync((data) => {
            if (data && data.trueHeading !== undefined) {
              setUserHeading(Math.round(data.trueHeading));
            } else if (data && data.magneticHeading !== undefined) {
              setUserHeading(Math.round(data.magneticHeading));
            }
          });
        }
      } catch (e) {
        console.warn(e);
      }
    };

    if (Platform.OS !== 'web') {
      startHeadingWatch();
    } else if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const handleOrientation = (e) => {
        let heading = e.webkitCompassHeading;
        if (heading === undefined) {
          heading = e.alpha ? (360 - e.alpha) % 360 : 0;
        }
        if (heading !== null && heading !== undefined) {
          setUserHeading(Math.round(heading));
        }
      };
      window.addEventListener('deviceorientation', handleOrientation, true);
      return () => window.removeEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (headingSubscription) headingSubscription.remove();
    };
  }, []);

  // GPS Watcher
  useEffect(() => {
    const startWatching = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setGpsError('Permission to access location was denied.');
          setIsGPSTracking(false);
          return;
        }

        watchSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 0.5,
          },
          (location) => {
            const { latitude, longitude, heading, accuracy } = location.coords;
            setCurrentGPS({ lat: latitude, lon: longitude });
            setGpsAccuracy(Math.round(accuracy || 0));
            setGpsError(null);

            const screenPos = mapGPSToScreen(latitude, longitude);
            
            // Calc heading
            const prevX = userX;
            const prevY = userY;
            const dx = screenPos.x - prevX;
            const dy = screenPos.y - prevY;
            if (Math.hypot(dx, dy) > 1.5) {
              let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
              if (angle < 0) angle += 360;
              setUserHeading(Math.round(angle));
            } else if (heading !== null && heading !== undefined && !isNaN(heading)) {
              setUserHeading(Math.round(heading));
            }

            setUserX(screenPos.x);
            setUserY(screenPos.y);
          }
        );
      } catch (err) {
        console.error(err);
        setGpsError(err.message);
        setIsGPSTracking(false);
      }
    };

    if (isGPSTracking) {
      startWatching();
    } else {
      if (watchSubscriptionRef.current) {
        watchSubscriptionRef.current.remove();
        watchSubscriptionRef.current = null;
      }
    }

    return () => {
      if (watchSubscriptionRef.current) watchSubscriptionRef.current.remove();
    };
  }, [isGPSTracking]);

  const requestGPSAccess = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextState = !isGPSTracking;
    setIsGPSTracking(nextState);

    if (nextState) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setGpsError('Permission to access location was denied.');
          setIsGPSTracking(false);
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });

        const { latitude, longitude, heading } = pos.coords;
        setCurrentGPS({ lat: latitude, lon: longitude });
        setGpsAccuracy(Math.round(pos.coords.accuracy || 0));
        setGpsError(null);

        const screenPos = mapGPSToScreen(latitude, longitude);
        setUserX(screenPos.x);
        setUserY(screenPos.y);
        if (heading !== null && heading !== undefined && !isNaN(heading)) {
          setUserHeading(Math.round(heading));
        }
      } catch (err) {
        console.warn(err);
        setGpsError(err.message);
      }
    }
  };

  const handleRoomPress = (room) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Smoothly place dot inside room
    const centerX = room.x + room.w / 2;
    const centerY = room.y + room.h / 2;
    setUserX(centerX);
    setUserY(centerY);

    // Mock GPS coordinates
    let mockLat = 30.41021;
    let mockLon = 79.31643;
    if (room.id === 'room_A') {
      mockLat = 30.410215;
      mockLon = 79.316419;
    } else if (room.id === 'room_B') {
      mockLat = 30.410210;
      mockLon = 79.316430;
    } else if (room.id === 'room_C') {
      mockLat = 30.410180;
      mockLon = 79.316435;
    }
    
    setCurrentGPS({ lat: mockLat, lon: mockLon });
    setGpsAccuracy(2);
    setGpsError(null);
  };

  const currentRoomName = getCurrentRoom(userX, userY);

  const getRoomBadgeColor = () => {
    if (currentRoomName.includes('Room B')) return '#10B981';
    if (currentRoomName.includes('Room A')) return '#8B5CF6';
    if (currentRoomName.includes('Room C')) return '#0EA5E9';
    return '#64748B';
  };

  const renderFloorGrid = () => {
    const canvasWidth = width - 40;
    const canvasHeight = canvasWidth * (400 / 600); // 600 width, 400 height aspect ratio
    const scale = canvasWidth / 600; // Scaled exactly to fit 100% of the screen width

    const smoothLeftOffset = (offset) => animUserX.interpolate({
      inputRange: [0, 600],
      outputRange: [offset, 600 * scale + offset]
    });
    const smoothTopOffset = (offset) => animUserY.interpolate({
      inputRange: [0, 400],
      outputRange: [offset, 400 * scale + offset]
    });

    const scale1 = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.3] });
    const opacity1 = pulseAnim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.55, 0.2, 0] });
    const scale2 = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.7] });
    const opacity2 = pulseAnim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.35, 0.1, 0] });

    return (
      <View style={[styles.canvasContainer, { width: canvasWidth, height: canvasHeight, borderColor: C.border, backgroundColor: C.cardWhite, overflow: 'hidden' }]}>
        <View style={{ width: canvasWidth, height: canvasHeight, position: 'relative' }}>
          
          {/* Blueprint Grid Pattern */}
          {Array.from({ length: 12 }).map((_, i) => (
            <React.Fragment key={i}>
              <View style={{ position: 'absolute', left: `${(i * 100) / 12}%`, top: 0, bottom: 0, width: 0.7, backgroundColor: scheme === 'dark' ? '#334155' : '#E2E8F0', opacity: 0.25 }} />
              <View style={{ position: 'absolute', top: `${(i * 100) / 12}%`, left: 0, right: 0, height: 0.7, backgroundColor: scheme === 'dark' ? '#334155' : '#E2E8F0', opacity: 0.25 }} />
            </React.Fragment>
          ))}

          {/* Rooms */}
          {Object.values(ROOMS).map((room) => {
            const isHere = currentRoomName.includes(room.name.split(' ')[0]);
            let roomBg = room.color;
            let roomBorder = C.border;

            if (isHere) {
              if (room.id === 'room_A') {
                roomBg = scheme === 'dark' ? 'rgba(139, 92, 246, 0.12)' : '#F5F3FF';
                roomBorder = '#8B5CF6';
              } else if (room.id === 'room_B') {
                roomBg = scheme === 'dark' ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5';
                roomBorder = '#10B981';
              } else if (room.id === 'room_C') {
                roomBg = scheme === 'dark' ? 'rgba(14, 165, 233, 0.12)' : '#F0F9FF';
                roomBorder = '#0EA5E9';
              }
            }

            return (
              <TouchableOpacity
                key={room.id}
                activeOpacity={0.85}
                onPress={() => handleRoomPress(room)}
                style={[
                  styles.roomBlock,
                  {
                    left: room.x * scale,
                    top: room.y * scale,
                    width: room.w * scale,
                    height: room.h * scale,
                    backgroundColor: roomBg,
                    borderColor: roomBorder,
                    borderWidth: isHere ? 2.5 : 1.5,
                    borderRadius: 20 * scale,
                  }
                ]}
              >
                <Text style={[styles.roomLabel, { color: C.textPrimary, fontSize: 13, fontWeight: '800' }]}>
                  {room.name.split(' ')[0]} {room.name.split(' ')[1]}
                </Text>
                <Text style={{ color: C.textSecondary, fontSize: 9, marginTop: 4, fontWeight: '600' }}>
                  Tap to Walk Here
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Doors */}
          {Object.entries(DOORS).map(([doorId, door]) => {
            let arcStyle = {};
            let doorLeafStyle = {};
            
            if (doorId === 'door_AB') {
              arcStyle = { left: 200 * scale, top: 180 * scale, width: 40 * scale, height: 40 * scale, borderRadius: 20 * scale, borderRightColor: '#F59E0B', borderBottomColor: '#F59E0B' };
              doorLeafStyle = { left: 220 * scale, top: 200 * scale - 2, width: 20 * scale, height: 4 };
            } else if (doorId === 'door_AC') {
              arcStyle = { left: 390 * scale, top: 180 * scale, width: 40 * scale, height: 40 * scale, borderRadius: 20 * scale, borderRightColor: '#F59E0B', borderBottomColor: '#F59E0B' };
              doorLeafStyle = { left: 410 * scale, top: 200 * scale - 2, width: 20 * scale, height: 4 };
            } else if (doorId === 'door_BC') {
              arcStyle = { left: 280 * scale, top: 260 * scale, width: 40 * scale, height: 40 * scale, borderRadius: 20 * scale, borderLeftColor: '#F59E0B', borderBottomColor: '#F59E0B' };
              doorLeafStyle = { left: 300 * scale - 2, top: 280 * scale, width: 4, height: 20 * scale };
            } else if (doorId === 'door_exit') {
              arcStyle = { left: 60 * scale, top: 100 * scale, width: 40 * scale, height: 40 * scale, borderRadius: 20 * scale, borderLeftColor: '#F59E0B', borderBottomColor: '#F59E0B' };
              doorLeafStyle = { left: 60 * scale, top: 120 * scale - 2, width: 20 * scale, height: 4 };
            }

            return (
              <React.Fragment key={doorId}>
                <View style={[styles.doorSwingArc, { position: 'absolute', borderWidth: 1.25, borderStyle: 'dashed', borderColor: 'transparent', ...arcStyle }]} />
                <View style={[styles.doorMarker, { position: 'absolute', backgroundColor: '#F59E0B', ...doorLeafStyle }]}>
                  <Text style={[styles.doorLabel, { color: C.textSecondary }]}>{doorId === 'door_exit' ? 'EXIT' : 'DOOR'}</Text>
                </View>
              </React.Fragment>
            );
          })}

          {/* User locator pulse rings & dot */}
          <Animated.View style={[styles.pulseRing, { left: smoothLeftOffset(-24), top: smoothTopOffset(-24), transform: [{ scale: scale1 }], opacity: opacity1, borderColor: '#0EA5E9' }]} />
          <Animated.View style={[styles.pulseRing, { left: smoothLeftOffset(-18), top: smoothTopOffset(-18), transform: [{ scale: scale2 }], opacity: opacity2, borderColor: '#0EA5E9' }]} />
          <Animated.View style={[styles.trackerDot, { left: smoothLeftOffset(-12), top: smoothTopOffset(-12), backgroundColor: '#0EA5E9', borderColor: '#fff', borderWidth: 2, shadowColor: '#0EA5E9', elevation: 6 }]}>
            <View style={{ transform: [{ rotate: `${userHeading}deg` }], alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="triangle" size={10} color="#fff" style={{ marginTop: -2 }} />
            </View>
          </Animated.View>

        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper style={{ backgroundColor: C.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <AppHeader title="Hospital Wayfinder" showBell bellBadge={2} showBack />

      {/* DYNAMIC ROOM LOCATOR CARD BANNER */}
      <View style={[styles.hudBanner, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
        <View style={styles.hudHeader}>
          <View style={[styles.hudDot, { backgroundColor: getRoomBadgeColor() }]} />
          <Text style={[styles.hudTitle, { color: C.textSecondary }]}>
            LIVE LOCATION TRACKER
          </Text>
          {isGPSTracking && (
            <View style={[styles.distancePill, { backgroundColor: '#0EA5E915' }]}>
              <Text style={{ color: '#0EA5E9', fontSize: 9, fontWeight: '900' }}>
                GPS ACCURACY: {gpsAccuracy || 0}M
              </Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 }}>
          <Ionicons name="location-outline" size={24} color={getRoomBadgeColor()} />
          <View>
            <Text style={{ fontSize: 11, fontWeight: '800', color: C.textSecondary, textTransform: 'uppercase' }}>
              CURRENT ROOM AREA
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '900', color: C.textPrimary }}>
              {currentRoomName}
            </Text>
          </View>
        </View>

        {currentGPS && (
          <View style={[styles.locatorFooter, { borderTopColor: C.border, marginTop: 10 }]}>
            <Ionicons name="location" size={14} color="#EF4444" />
            <Text style={[styles.locatorText, { color: C.textSecondary, fontFamily: 'monospace', fontSize: 10 }]}>
              LAT: {currentGPS.lat.toFixed(6)} | LON: {currentGPS.lon.toFixed(6)}
            </Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Active Hospital Context Banner */}
        <View style={[styles.heroSection, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: C.textPrimary }]}>Indoor Navigation Map</Text>
            <Text style={[styles.heroSubtitle, { color: C.textSecondary }]}>
              Ground Floor Ward Map · Tap rooms on the map to test transitions.
            </Text>
          </View>
          <TouchableOpacity 
            onPress={requestGPSAccess}
            style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: isGPSTracking ? '#0EA5E9' : C.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}
          >
            <Ionicons name="location" size={20} color={isGPSTracking ? '#fff' : C.textSecondary} />
          </TouchableOpacity>
        </View>

        {gpsError && (
          <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: 12, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#EF4444', marginBottom: 12 }}>
            <Text style={{ color: '#EF4444', fontSize: 12 }}>GPS Status: {gpsError}</Text>
          </View>
        )}

        {renderFloorGrid()}

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Header Context banner
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 16,
    ...Shadow.sm,
  },
  heroTitle: { fontSize: 18, fontWeight: '900', marginBottom: 3 },
  heroSubtitle: { fontSize: 11, fontWeight: '600', lineHeight: 16 },

  // Guidance HUD Styling
  hudBanner: { 
    margin: 20, 
    marginTop: 10,
    marginBottom: 10,
    padding: 16, 
    borderRadius: 24, 
    borderWidth: 1, 
    ...Shadow.md 
  },
  hudHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10,
    gap: 8
  },
  hudDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5
  },
  hudTitle: { 
    fontSize: 9, 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  distancePill: { 
    marginLeft: 'auto', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  locatorFooter: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  locatorText: {
    fontSize: 12,
    fontWeight: '600'
  },

  // 2D Blueprint Floor Map Styling
  canvasContainer: {
    alignSelf: 'center',
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    ...Shadow.md
  },
  roomBlock: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    ...Shadow.sm
  },
  roomLabel: {
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.2
  },
  doorMarker: {
    position: 'absolute',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  doorLabel: {
    position: 'absolute',
    fontSize: 7,
    fontWeight: '900',
    top: -12,
    width: 40,
    textAlign: 'center'
  },
  pulseRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: 'transparent',
    zIndex: 18,
  },
  trackerDot: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  doorSwingArc: {
    position: 'absolute',
    opacity: 0.5,
  }
});
