import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Animated, Easing, RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getLiveQueue } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PressableScale from '@/components/ui/PressableScale';
import { usePatientRealtime } from '@/hooks/usePatientRealtime';

const PRIORITY_COLORS = {
  CRITICAL: '#DC2626',
  HIGH: '#F59E0B',
  MEDIUM: '#3B82F6',
  LOW: '#10B981',
};

const STATUS_CONFIG = {
  WAITING: { label: 'Waiting', color: '#F59E0B', icon: 'hourglass-outline', bg: '#FFFBEB' },
  IN_CONSULTATION: { label: 'In Consultation', color: '#3B82F6', icon: 'medkit', bg: '#EFF6FF' },
  COMPLETED: { label: 'Completed', color: '#10B981', icon: 'checkmark-circle', bg: '#ECFDF5' },
};

export default function QueueStatusScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const router = useRouter();
  const { department, patientId, doctorName, appointmentTime } = useLocalSearchParams();
  const { user } = useAuth();

  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();

    // Pulse animation loop for live indicator
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [fadeAnim, pulseAnim, slideAnim]);

  const fetchQueue = useCallback(async () => {
    if (!department) return;
    try {
      const data = await getLiveQueue(department);
      setQueueData(data);
      setError(null);
    } catch (err) {
      console.error('Queue fetch error:', err);
      setError(err.message || 'Failed to load queue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [department]);

  // Initial load + polling every 5s
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  usePatientRealtime(patientId || user?.patientProfileId, {
    onQueueUpdate: fetchQueue,
    onAppointment: fetchQueue,
    onPatientRecord: fetchQueue,
  });

  const onRefresh = () => {
    setRefreshing(true);
    fetchQueue();
  };

  // Derive patient's queue position
  const myPosition = useMemo(() => {
    if (!queueData) return null;

    const allNodes = [
      ...(queueData.waiting || []),
      ...(queueData.inConsultation || []),
      ...(queueData.completed || []),
    ];

    // Find patient by patientId or name match
    const pId = patientId || user?.patientProfileId;
    const pName = user?.name || '';

    let myNode = null;
    if (pId) {
      myNode = allNodes.find(n => String(n.patientId) === String(pId));
    }
    if (!myNode && pName) {
      myNode = allNodes.find(n => n.patientName?.toLowerCase() === pName.toLowerCase());
    }

    if (!myNode) return null;

    const waitingList = queueData.waiting || [];
    const posInWaiting = waitingList.findIndex(n =>
      n.queueId === myNode.queueId || String(n.patientId) === String(myNode.patientId)
    );

    return {
      node: myNode,
      position: posInWaiting >= 0 ? posInWaiting + 1 : null,
      totalWaiting: waitingList.length,
      status: myNode.status,
      token: myNode.tokenNumber,
      estimatedWaitMins: posInWaiting >= 0 ? (posInWaiting) * 12 : 0,
    };
  }, [queueData, patientId, user]);

  const waiting = queueData?.waiting || [];
  const inConsultation = queueData?.inConsultation || [];
  const completed = queueData?.completed || [];
  const currentServing = inConsultation[0] || null;

  if (loading && !queueData) {
    return (
      <ScreenWrapper>
        <AppHeader title="Queue Status" onBack={() => router.back()} />
        <View style={styles.centerFull}>
          <ActivityIndicator size="large" color={C.primaryBlue} />
          <Text style={[styles.loadingText, { color: C.textSecondary }]}>Loading live queue…</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <AppHeader title="Live Queue" onBack={() => router.replace('/(tabs)')} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primaryBlue} />}
      >
        {/* Live Department Header */}
        <Animated.View style={[styles.deptHeader, { backgroundColor: C.cardWhite, borderColor: C.border, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.deptHeaderRow}>
            <View style={[styles.liveDot, { backgroundColor: '#10B981' }]}>
              <Animated.View style={[styles.liveDotPulse, { transform: [{ scale: pulseAnim }] }]} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.deptName, { color: C.textPrimary }]}>{department || 'OPD'}</Text>
              <Text style={[styles.deptSub, { color: C.textSecondary }]}>
                {doctorName ? `${doctorName} · ` : ''}{appointmentTime ? `Slot: ${appointmentTime}` : 'Live Queue'}
              </Text>
            </View>
            <PressableScale onPress={fetchQueue} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={20} color={C.primaryBlue} />
            </PressableScale>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statChip, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="people" size={16} color="#F59E0B" />
              <Text style={[styles.statVal, { color: '#92400E' }]}>{waiting.length}</Text>
              <Text style={[styles.statLabel, { color: '#A16207' }]}>Waiting</Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="medkit" size={16} color="#3B82F6" />
              <Text style={[styles.statVal, { color: '#1E40AF' }]}>{inConsultation.length}</Text>
              <Text style={[styles.statLabel, { color: '#3B82F6' }]}>Active</Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={[styles.statVal, { color: '#065F46' }]}>{completed.length}</Text>
              <Text style={[styles.statLabel, { color: '#10B981' }]}>Done</Text>
            </View>
          </View>
        </Animated.View>

        {error && (
          <View style={[styles.errorBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <PressableScale onPress={fetchQueue}>
              <Text style={styles.retryText}>Retry</Text>
            </PressableScale>
          </View>
        )}

        {/* My Position Card */}
        {myPosition ? (
          <View style={[styles.myPositionCard, {
            backgroundColor: myPosition.status === 'IN_CONSULTATION' ? '#EFF6FF' : myPosition.status === 'COMPLETED' ? '#ECFDF5' : '#FFFBEB',
            borderColor: myPosition.status === 'IN_CONSULTATION' ? '#93C5FD' : myPosition.status === 'COMPLETED' ? '#6EE7B7' : '#FCD34D',
          }]}>
            <View style={styles.myPosHeader}>
              <View style={[styles.myTokenBadge, { backgroundColor: STATUS_CONFIG[myPosition.status]?.color || '#F59E0B' }]}>
                <Text style={styles.myTokenText}>{myPosition.token || '—'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.myPosTitle}>Your Queue Status</Text>
                <View style={[styles.statusPill, { backgroundColor: STATUS_CONFIG[myPosition.status]?.color || '#94A3B8' }]}>
                  <Ionicons name={STATUS_CONFIG[myPosition.status]?.icon || 'time'} size={12} color="#fff" />
                  <Text style={styles.statusPillText}>{STATUS_CONFIG[myPosition.status]?.label || myPosition.status}</Text>
                </View>
              </View>
            </View>

            {myPosition.status === 'WAITING' && myPosition.position && (
              <View style={styles.positionDetails}>
                <View style={styles.positionItem}>
                  <Text style={styles.positionNumber}>{myPosition.position}</Text>
                  <Text style={styles.positionLabel}>Position{'\n'}in Queue</Text>
                </View>
                <View style={[styles.posDivider, { backgroundColor: '#E5E7EB' }]} />
                <View style={styles.positionItem}>
                  <Text style={styles.positionNumber}>~{myPosition.estimatedWaitMins}</Text>
                  <Text style={styles.positionLabel}>Estimated{'\n'}Wait (min)</Text>
                </View>
                <View style={[styles.posDivider, { backgroundColor: '#E5E7EB' }]} />
                <View style={styles.positionItem}>
                  <Text style={styles.positionNumber}>{myPosition.totalWaiting}</Text>
                  <Text style={styles.positionLabel}>Total{'\n'}Waiting</Text>
                </View>
              </View>
            )}

            {myPosition.status === 'IN_CONSULTATION' && (
              <View style={styles.consultingBanner}>
                <MaterialCommunityIcons name="stethoscope" size={24} color="#3B82F6" />
                <Text style={styles.consultingText}>You are currently being seen by the doctor</Text>
              </View>
            )}

            {myPosition.status === 'COMPLETED' && (
              <View style={styles.consultingBanner}>
                <Ionicons name="checkmark-done-circle" size={24} color="#10B981" />
                <Text style={[styles.consultingText, { color: '#065F46' }]}>Your consultation is complete</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.myPositionCard, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
            <View style={styles.noPositionContent}>
              <MaterialCommunityIcons name="account-clock-outline" size={40} color={C.textSecondary} />
              <Text style={[styles.noPositionTitle, { color: C.textPrimary }]}>Checking Your Position…</Text>
              <Text style={[styles.noPositionSub, { color: C.textSecondary }]}>
                Your appointment is confirmed. You will appear in the queue when checked in for today&apos;s session.
              </Text>
            </View>
          </View>
        )}

        {/* Currently Serving */}
        {currentServing && (
          <View style={[styles.servingCard, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
            <View style={styles.servingHeader}>
              <View style={[styles.servingIcon, { backgroundColor: '#EFF6FF' }]}>
                <MaterialCommunityIcons name="stethoscope" size={22} color="#3B82F6" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.servingLabel, { color: C.textSecondary }]}>Currently Serving</Text>
                <Text style={[styles.servingName, { color: C.textPrimary }]}>{currentServing.patientName}</Text>
              </View>
              <View style={[styles.servingTokenBadge, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.servingTokenText}>{currentServing.tokenNumber}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Waiting List */}
        <View style={[styles.sectionCard, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={20} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Waiting Queue</Text>
            <View style={[styles.countBadge, { backgroundColor: '#FFFBEB' }]}>
              <Text style={[styles.countText, { color: '#92400E' }]}>{waiting.length}</Text>
            </View>
          </View>

          {waiting.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={36} color={C.textSecondary} style={{ opacity: 0.4 }} />
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>No patients waiting</Text>
            </View>
          ) : (
            <View style={styles.queueList}>
              {waiting.map((node, idx) => {
                const isMe = myPosition?.node?.queueId === node.queueId;
                const priorityColor = PRIORITY_COLORS[node.priorityLevel] || PRIORITY_COLORS.LOW;

                return (
                  <View
                    key={node.queueId || idx}
                    style={[
                      styles.queueItem,
                      { borderColor: C.border },
                      isMe && { backgroundColor: '#FFFBEB', borderColor: '#FCD34D', borderWidth: 2 },
                    ]}
                  >
                    <View style={styles.queueItemLeft}>
                      <Text style={[styles.queuePosition, { color: C.textSecondary }]}>{idx + 1}</Text>
                      <View style={[styles.queueTokenDot, { backgroundColor: priorityColor }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.queueItemName, { color: C.textPrimary }]} numberOfLines={1}>
                          {isMe ? '⭐ You' : node.patientName}
                        </Text>
                        <Text style={[styles.queueItemMeta, { color: C.textSecondary }]}>
                          {node.tokenNumber} · {node.time}
                        </Text>
                      </View>
                    </View>
                    {isMe && (
                      <View style={[styles.youBadge, { backgroundColor: '#F59E0B' }]}>
                        <Text style={styles.youBadgeText}>YOU</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Completed List (collapsed) */}
        {completed.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Completed Today</Text>
              <View style={[styles.countBadge, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.countText, { color: '#065F46' }]}>{completed.length}</Text>
              </View>
            </View>
            <Text style={[styles.completedSub, { color: C.textSecondary }]}>
              {completed.length} patient{completed.length > 1 ? 's' : ''} seen today in {department}
            </Text>
          </View>
        )}

        {/* Footer CTAs */}
        <View style={styles.footerActions}>
          <PressableScale
            style={[styles.footerBtn, { backgroundColor: C.primaryBlue }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Ionicons name="home" size={18} color="#fff" />
            <Text style={styles.footerBtnText}>Go to Home</Text>
          </PressableScale>
          <PressableScale
            style={[styles.footerBtnOutline, { borderColor: C.border }]}
            onPress={fetchQueue}
          >
            <Ionicons name="refresh" size={18} color={C.primaryBlue} />
            <Text style={[styles.footerBtnOutlineText, { color: C.primaryBlue }]}>Refresh Queue</Text>
          </PressableScale>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centerFull: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 100 },

  // Department Header
  deptHeader: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 16, ...Shadow.sm },
  deptHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  liveDot: { width: 12, height: 12, borderRadius: 6, position: 'relative' },
  liveDotPulse: { position: 'absolute', top: -4, left: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.3)' },
  deptName: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  deptSub: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  refreshBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14 },
  statVal: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '700' },

  // Error
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  errorText: { flex: 1, color: '#991B1B', fontSize: 13, fontWeight: '600' },
  retryText: { color: '#3B82F6', fontWeight: '800', fontSize: 13 },

  // My Position
  myPositionCard: { borderRadius: 24, padding: 20, borderWidth: 2, marginBottom: 16, ...Shadow.md },
  myPosHeader: { flexDirection: 'row', alignItems: 'center' },
  myTokenBadge: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  myTokenText: { color: '#fff', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  myPosTitle: { fontSize: 17, fontWeight: '900', color: '#1E293B', marginBottom: 6 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusPillText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  positionDetails: { flexDirection: 'row', marginTop: 20, alignItems: 'center', justifyContent: 'space-around' },
  positionItem: { alignItems: 'center', flex: 1 },
  positionNumber: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
  positionLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textAlign: 'center', marginTop: 4, lineHeight: 15 },
  posDivider: { width: 1, height: 40 },
  consultingBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)' },
  consultingText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1E40AF' },
  noPositionContent: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  noPositionTitle: { fontSize: 16, fontWeight: '800' },
  noPositionSub: { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 19 },

  // Serving
  servingCard: { borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 16, ...Shadow.sm },
  servingHeader: { flexDirection: 'row', alignItems: 'center' },
  servingIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  servingLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  servingName: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  servingTokenBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  servingTokenText: { color: '#fff', fontSize: 12, fontWeight: '900' },

  // Section
  sectionCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 16, ...Shadow.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  countText: { fontSize: 13, fontWeight: '900' },

  // Queue List
  queueList: { gap: 8 },
  queueItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1 },
  queueItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  queuePosition: { width: 22, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  queueTokenDot: { width: 8, height: 8, borderRadius: 4 },
  queueItemName: { fontSize: 14, fontWeight: '700' },
  queueItemMeta: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  youBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  youBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  // Empty
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  emptyText: { fontSize: 13, fontWeight: '700' },

  // Completed
  completedSub: { fontSize: 13, fontWeight: '600' },

  // Footer
  footerActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  footerBtn: { flex: 1, height: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  footerBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  footerBtnOutline: { flex: 1, height: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5 },
  footerBtnOutlineText: { fontSize: 14, fontWeight: '800' },
});
