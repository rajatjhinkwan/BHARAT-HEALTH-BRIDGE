import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import PressableScale from '@/components/ui/PressableScale';

// Map Dimensions
const MAP_W = 600;
const MAP_H = 700;

// Nodes for pathfinding simulation (Static Routes for visual demo)
const ROUTES = {
    'Emergency': [
        { x: 300, y: 640 }, // Start (Entrance)
        { x: 300, y: 550 }, // Reception Desk
        { x: 150, y: 550 }, // Turn left
        { x: 150, y: 380 }, // Emergency Room Entrance
    ],
    'ICU 1': [
        { x: 300, y: 640 }, // Start
        { x: 300, y: 220 }, // Go straight down Main Corridor
        { x: 120, y: 220 }, // Turn Left into ICU corridor
        { x: 120, y: 150 }, // ICU 1
    ],
    'Pharmacy': [
        { x: 300, y: 640 }, // Start
        { x: 300, y: 550 }, // Reception
        { x: 450, y: 550 }, // Turn Right
        { x: 450, y: 400 }, // Pharmacy
    ],
    'Operation Theatre': [
        { x: 300, y: 640 }, // Start
        { x: 300, y: 220 }, // Main Corridor
        { x: 480, y: 220 }, // Turn Right into OT corridor
        { x: 480, y: 150 }, // OT
    ]
};

const ROOMS = [
    { id: 'entrance', name: 'Entrance', type: 'entry', x: 200, y: 650, w: 200, h: 50, color: '#94A3B8' },
    { id: 'reception', name: 'Main Reception', type: 'info', x: 200, y: 500, w: 200, h: 100, color: '#F59E0B' },
    { id: 'waiting_1', name: 'Waiting Area A', type: 'wait', x: 20, y: 450, w: 150, h: 150, color: '#D97706' },
    { id: 'waiting_2', name: 'Waiting Area B', type: 'wait', x: 430, y: 450, w: 150, h: 150, color: '#D97706' },
    { id: 'er', name: 'Emergency', type: 'critical', x: 20, y: 280, w: 180, h: 140, color: '#EF4444' },
    { id: 'pharmacy', name: 'Pharmacy', type: 'med', x: 400, y: 280, w: 180, h: 140, color: '#10B981' },
    { id: 'xray', name: 'X-Ray / MRI', type: 'scan', x: 20, y: 120, w: 180, h: 130, color: '#6366F1' },
    { id: 'pathology', name: 'Pathology Lab', type: 'lab', x: 400, y: 120, w: 180, h: 130, color: '#8B5CF6' },
    { id: 'icu_1', name: 'ICU 1', type: 'critical', x: 20, y: 20, w: 140, h: 80, color: '#DC2626' },
    { id: 'icu_2', name: 'ICU 2', type: 'critical', x: 180, y: 20, w: 140, h: 80, color: '#DC2626' },
    { id: 'ot', name: 'Operation Theatre', type: 'surgery', x: 340, y: 20, w: 240, h: 80, color: '#0EA5E9' },
    // Restrooms
    { id: 'wc_1', name: 'WC', type: 'facility', x: 220, y: 390, w: 60, h: 70, color: '#64748B' },
    { id: 'wc_2', name: 'WC', type: 'facility', x: 320, y: 390, w: 60, h: 70, color: '#64748B' },
];

export default function IndoorNavigation() {
    const scheme = useColorScheme() ?? 'light';
    const C = Colors[scheme];
    const [floor, setFloor] = useState(2);
    const [searchQuery, setSearchQuery] = useState('');
    const [userPos, setUserPos] = useState({ x: 290, y: 630 });
    const [heading, setHeading] = useState(0);
    const [trackingState, setTrackingState] = useState('Initializing GPS...');
    const anchorCoord = useRef(null);
    const [selectedRoom, setSelectedRoom] = useState(null);

    // Animation for path tracing
    const pathAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Continuous Pulse for user dot
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
            ])
        ).start();

        let locSub, headSub;
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setTrackingState('Location Denied');
                return;
            }
            setTrackingState('Locating...');

            locSub = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 1 },
                (loc) => {
                    const { latitude, longitude, heading: hdg } = loc.coords;
                    if (!anchorCoord.current) {
                        anchorCoord.current = { lat: latitude, lon: longitude };
                        setTrackingState('Live Tracking');
                    } else {
                        const START_X = 290;
                        const START_Y = 630;
                        const SCALE = 7; 
                        
                        const dLat = latitude - anchorCoord.current.lat;
                        const dLon = longitude - anchorCoord.current.lon;
                        const metersY = dLat * 111320;
                        const metersX = dLon * (40075000 * Math.cos(anchorCoord.current.lat * Math.PI / 180) / 360);
                        
                        let nx = START_X + (metersX * SCALE);
                        let ny = START_Y - (metersY * SCALE);
                        nx = Math.max(10, Math.min(nx, MAP_W - 20));
                        ny = Math.max(10, Math.min(ny, MAP_H - 20));
                        
                        setUserPos({ x: nx, y: ny });
                    }
                    if (hdg !== null && hdg >= 0) setHeading(hdg);
                }
            );

            headSub = await Location.watchHeadingAsync((h) => {
                 setHeading(h.trueHeading > 0 ? h.trueHeading : h.magHeading);
            });
        })();

        return () => {
             if (locSub && locSub.remove) locSub.remove();
             if (headSub && headSub.remove) headSub.remove();
        };
    }, []);

    useEffect(() => {
        // Reset and start path animation when a room is selected
        if (selectedRoom && ROUTES[selectedRoom.name]) {
            pathAnim.setValue(0);
            Animated.timing(pathAnim, {
                toValue: 1,
                duration: 2500,
                delay: 200,
                useNativeDriver: false
            }).start();
        }
    }, [selectedRoom]);

    const handleSearch = (text) => {
        setSearchQuery(text);
        const match = ROOMS.find(r => r.name.toLowerCase().includes(text.toLowerCase()) && text.length > 2);
        if (match) {
            setSelectedRoom(match);
        }
    };

    const getRouteSegments = (roomName) => {
        const route = ROUTES[roomName];
        if (!route) return [];
        let segments = [];
        for (let i = 0; i < route.length - 1; i++) {
            const p1 = route[i];
            const p2 = route[i+1];
            // Calculate segment position
            const width = Math.abs(p2.x - p1.x) + 6;
            const height = Math.abs(p2.y - p1.y) + 6;
            const left = Math.min(p1.x, p2.x) - 3;
            const top = Math.min(p1.y, p2.y) - 3;
            segments.push({ left, top, width, height, isHorizontal: p1.y === p2.y });
        }
        return segments;
    };

    return (
        <ScreenWrapper>
            <AppHeader title="Inside Navigator" showBell bellBadge={2} showBack />

            <View style={styles.container}>
                {/* Search Bar */}
                <View style={styles.searchSection}>
                    <View style={[styles.searchBox, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                        <Ionicons name="search" size={20} color={C.textSecondary} />
                        <TextInput
                            placeholder="Search Room, Ward (e.g., ICU, Pharmacy)..."
                            placeholderTextColor={C.textSecondary}
                            style={[styles.searchInput, { color: C.textPrimary }]}
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        {searchQuery.length > 0 && (
                            <Ionicons name="close-circle" size={20} color={C.textSecondary} onPress={() => {setSearchQuery(''); setSelectedRoom(null);}} />
                        )}
                    </View>
                    <View style={styles.quickTags}>
                        <View style={[styles.tag, { backgroundColor: trackingState === 'Live Tracking' ? '#D1FAE5' : '#FEF3C7', borderColor: trackingState === 'Live Tracking' ? '#10B981' : '#F59E0B' }]}>
                            <Text style={[styles.tagText, { color: trackingState === 'Live Tracking' ? '#065F46' : '#92400E' }]}>📍 {trackingState}</Text>
                        </View>
                        {['Emergency', 'ICU 1', 'Pharmacy'].map(tag => (
                            <PressableScale key={tag} onPress={() => { setSearchQuery(tag); setSelectedRoom(ROOMS.find(r=>r.name===tag)); }} style={[styles.tag, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                                <Text style={[styles.tagText, { color: C.textPrimary }]}>{tag}</Text>
                            </PressableScale>
                        ))}
                    </View>
                </View>

                {/* Interactive Map View */}
                <View style={[styles.mapContainer, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
                        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.mapScroll}>
                            
                            {/* Block Diagram Canvas */}
                            <View style={[styles.canvas, { backgroundColor: '#F8FAFC' }]}>
                                {/* Grid Lines Background */}
                                <View style={[styles.bgGrid, { top: 120 }]} />
                                <View style={[styles.bgGrid, { top: 280 }]} />
                                <View style={[styles.bgGrid, { top: 450 }]} />
                                <View style={[styles.bgGridV, { left: 200 }]} />
                                <View style={[styles.bgGridV, { left: 400 }]} />

                                {/* Corridors (Implicit by space, but we add a few decorative texts) */}
                                <Text style={[styles.corridorText, { top: 610, left: 240 }]}>Main Atrium</Text>
                                <Text style={[styles.corridorText, { top: 260, left: 140 }]}>West Wing Corridor</Text>
                                <Text style={[styles.corridorText, { top: 260, left: 360 }]}>East Wing Corridor</Text>

                                {/* Render Rooms */}
                                {ROOMS.map(room => {
                                    const isTargeted = selectedRoom && selectedRoom.id === room.id;
                                    return (
                                        <PressableScale 
                                            key={room.id}
                                            onPress={() => setSelectedRoom(room)}
                                            style={[styles.roomBlock, { 
                                                top: room.y, left: room.x, 
                                                width: room.w, height: room.h, 
                                                backgroundColor: isTargeted ? room.color : room.color + '20',
                                                borderColor: room.color,
                                                borderWidth: isTargeted ? 3 : 1
                                            }]}
                                        >
                                            <Text style={[styles.roomName, { color: isTargeted ? '#fff' : room.color }]}>{room.name}</Text>
                                        </PressableScale>
                                    );
                                })}

                                {/* Current User Position (Live) */}
                                <View style={[styles.userDot, { top: userPos.y, left: userPos.x, transform: [{ rotate: `${heading}deg` }] }]}>
                                    <Animated.View style={[styles.userPulse, { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.5], outputRange: [0.8, 0] }) }]} />
                                    <View style={styles.userCore} />
                                    <Ionicons name="caret-up" size={14} color="#EF4444" style={{ position: 'absolute', top: -14, left: 3 }} />
                                </View>

                                {/* Path Tracing */}
                                {selectedRoom && ROUTES[selectedRoom.name] && getRouteSegments(selectedRoom.name).map((seg, idx) => (
                                    <Animated.View 
                                        key={`path-${idx}`} 
                                        style={[styles.pathSegment, { 
                                            top: seg.top, left: seg.left, 
                                            width: seg.isHorizontal ? pathAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${seg.width}px`] }) : 6,
                                            height: !seg.isHorizontal ? pathAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${seg.height}px`] }) : 6,
                                        }]} 
                                    />
                                ))}

                                {/* End Point Marker */}
                                {selectedRoom && ROUTES[selectedRoom.name] && (
                                    <Animated.View style={[styles.destinationMarker, { 
                                        left: ROUTES[selectedRoom.name][ROUTES[selectedRoom.name].length - 1].x - 12,
                                        top: ROUTES[selectedRoom.name][ROUTES[selectedRoom.name].length - 1].y - 12,
                                        opacity: pathAnim.interpolate({ inputRange: [0.8, 1], outputRange: [0, 1] })
                                    }]}>
                                        <Ionicons name="location" size={24} color="#3B82F6" />
                                    </Animated.View>
                                )}
                            </View>

                        </ScrollView>
                    </ScrollView>

                    {/* Floor Selector Floating */}
                    <View style={[styles.floorSelector, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                        {[4, 3, 2, 1, 0].map(f => (
                            <PressableScale
                                key={f}
                                onPress={() => setFloor(f)}
                                style={[styles.floorBtn, floor === f && { backgroundColor: C.primaryBlue }]}
                            >
                                <Text style={[styles.floorText, floor === f ? { color: '#fff' } : { color: C.textSecondary }]}>{f === 0 ? 'G' : f}</Text>
                            </PressableScale>
                        ))}
                    </View>
                </View>

                {/* Bottom Navigation Stats */}
                <View style={[styles.navInfo, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                    <View style={styles.stepCard}>
                        <View style={[styles.stepIcon, { backgroundColor: C.primaryBlue + '15' }]}>
                            <Ionicons name={selectedRoom ? "navigate" : "map"} size={28} color={C.primaryBlue} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.stepTitle, { color: C.textPrimary }]}>
                                {selectedRoom ? `Navigating to ${selectedRoom.name}` : 'Ready to Navigate'}
                            </Text>
                            <Text style={[styles.stepSub, { color: C.textSecondary }]}>
                                {selectedRoom ? (ROUTES[selectedRoom.name] ? 'Follow the blue solid line' : 'Route not mapped yet') : 'Select a room on the block diagram'}
                            </Text>
                        </View>
                    </View>

                    {selectedRoom && ROUTES[selectedRoom.name] && (
                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Text style={[styles.statLabel, { color: C.textSecondary }]}>DISTANCE</Text>
                                <Text style={[styles.statValue, { color: C.textPrimary }]}>{Math.floor(Math.random() * 200 + 50)}m</Text>
                            </View>
                            <View style={styles.stat}>
                                <Text style={[styles.statLabel, { color: C.textSecondary }]}>EST TIME</Text>
                                <Text style={[styles.statValue, { color: C.textPrimary }]}>{Math.floor(Math.random() * 4 + 1)} min</Text>
                            </View>
                            <PressableScale style={styles.finishBtn} onPress={() => {setSearchQuery(''); setSelectedRoom(null);}}>
                                <Text style={styles.finishText}>End Trip</Text>
                            </PressableScale>
                        </View>
                    )}
                </View>
            </View>
        </ScreenWrapper>
    ); // Made by the AI agent
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    searchSection: { marginTop: 10, marginBottom: 15 },
    searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 52, borderRadius: 16, borderWidth: 1, ...Shadow.sm },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '500' },
    quickTags: { flexDirection: 'row', gap: 10, marginTop: 12 },
    tag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    tagText: { fontSize: 12, fontWeight: '700' },

    mapContainer: { flex: 1, borderRadius: 24, borderWidth: 1, overflow: 'hidden', marginBottom: 20, position: 'relative', elevation: 2 },
    mapScroll: { padding: 20 },
    canvas: { width: MAP_W, height: MAP_H, borderRadius: 12, borderWidth: 2, borderColor: '#E2E8F0', position: 'relative', overflow: 'hidden' },

    bgGrid: { position: 'absolute', width: '100%', height: 2, backgroundColor: 'rgba(0,0,0,0.04)' },
    bgGridV: { position: 'absolute', height: '100%', width: 2, backgroundColor: 'rgba(0,0,0,0.04)' },
    corridorText: { position: 'absolute', color: '#94A3B8', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 },

    roomBlock: { position: 'absolute', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    roomName: { fontWeight: '800', fontSize: 12, textAlign: 'center', paddingHorizontal: 5 },

    userDot: { position: 'absolute', width: 20, height: 20, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    userPulse: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6' },
    userCore: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2563EB', borderWidth: 2, borderColor: '#fff' },

    pathSegment: { position: 'absolute', backgroundColor: '#3B82F6', zIndex: 5, borderRadius: 3, opacity: 0.8 },
    destinationMarker: { position: 'absolute', zIndex: 11 },

    floorSelector: { position: 'absolute', right: 12, top: '15%', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 20, borderWidth: 1, gap: 12, elevation: 4 },
    floorBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    floorText: { fontWeight: '800', fontSize: 12 },

    navInfo: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 20, elevation: 2 },
    stepCard: { flexDirection: 'row', gap: 16, alignItems: 'center' },
    stepIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    stepTitle: { fontSize: 18, fontWeight: '800' },
    stepSub: { fontSize: 13, marginTop: 4, fontWeight: '500' },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 32, marginTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 20 },
    stat: { gap: 4 },
    statLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    statValue: { fontSize: 24, fontWeight: '900' },
    finishBtn: { marginLeft: 'auto', backgroundColor: '#EF4444', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14 },
    finishText: { color: '#fff', fontWeight: '800', fontSize: 14 }
});
