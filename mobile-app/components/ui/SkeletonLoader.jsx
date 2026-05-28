import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function SkeletonLoader({ style, width, height, borderRadius = 12 }) {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const shimmerColor = scheme === 'dark' ? '#374151' : '#E5E7EB';

  return (
    <Animated.View
      style={[
        {
          width: width || '100%',
          height: height || 20,
          borderRadius: borderRadius,
          backgroundColor: shimmerColor,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

// Premium visual placeholders matching hospital cards
export function HospitalSkeleton() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  return (
    <View style={[styles.card, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          {/* Hospital Name shimmer */}
          <SkeletonLoader height={22} width="85%" style={{ marginBottom: 8 }} />
          {/* City shimmer */}
          <SkeletonLoader height={14} width="50%" />
        </View>
        {/* Rating badge shimmer */}
        <SkeletonLoader height={24} width={48} borderRadius={8} />
      </View>

      <View style={styles.facilitiesRow}>
        <SkeletonLoader height={16} width={60} borderRadius={8} style={{ marginRight: 8 }} />
        <SkeletonLoader height={16} width={80} borderRadius={8} style={{ marginRight: 8 }} />
        <SkeletonLoader height={16} width={70} borderRadius={8} />
      </View>

      <View style={styles.footer}>
        <SkeletonLoader height={18} width="40%" />
        <SkeletonLoader height={28} width={80} borderRadius={14} />
      </View>
    </View>
  );
}

// Premium visual placeholders matching donor cards
export function DonorSkeleton() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  return (
    <View style={[styles.donorCard, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
      <View style={styles.donorInfo}>
        {/* Avatar shimmer */}
        <SkeletonLoader width={48} height={48} borderRadius={16} style={{ marginRight: 16 }} />
        <View style={{ gap: 6 }}>
          {/* Name shimmer */}
          <SkeletonLoader height={16} width={120} />
          {/* City/Distance shimmer */}
          <SkeletonLoader height={12} width={80} />
        </View>
      </View>
      {/* Blood type shimmer */}
      <SkeletonLoader width={44} height={44} borderRadius={12} />
    </View>
  );
}

// Custom StyleSheet for visual representation
const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  facilitiesRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  donorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
  donorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
});

export function HistorySkeleton() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  return (
    <View style={[styles.historyCard, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
      <SkeletonLoader width={42} height={42} borderRadius={14} style={{ marginRight: 12 }} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonLoader height={10} width="30%" />
        <SkeletonLoader height={15} width="80%" />
        <SkeletonLoader height={12} width="55%" />
      </View>
    </View>
  );
}

