import { View, Text, StyleSheet, Animated, Easing, Modal } from 'react-native';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import PressableScale from './PressableScale';

export default function AppHeader({ title, showBell = false, bellBadge = 0, showBack = false }) {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const [menuOpen, setMenuOpen] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (menuOpen) {
      Animated.timing(slide, { toValue: 1, duration: 300, easing: Easing.out(Easing.back(1)), useNativeDriver: true }).start();
    } else {
      Animated.timing(slide, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [menuOpen]);

  return (
    <View style={[styles.header, { borderBottomColor: 'rgba(0,0,0,0.05)', backgroundColor: 'transparent' }]}>
      {showBack ? (
        <PressableScale
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: C.cardWhite }]}
        >
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </PressableScale>
      ) : (
        <PressableScale
          accessibilityLabel="Open menu"
          onPress={() => setMenuOpen(true)}
          style={[styles.iconBtn, { backgroundColor: C.cardWhite }]}
        >
          <Ionicons name="menu" size={24} color={C.textPrimary} />
        </PressableScale>
      )}

      <View style={styles.center}>
        <Text style={[styles.logoText, { color: C.textPrimary }]}>{title ?? 'Bharat Health'}</Text>
      </View>

      {showBell ? (
        <PressableScale
          style={[styles.iconBtn, { backgroundColor: C.cardWhite }]}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={22} color={C.textPrimary} />
          {bellBadge > 0 ? (
            <View style={[styles.badge, { backgroundColor: C.emergencyRed }]}>
              <Text style={styles.badgeText}>{bellBadge}</Text>
            </View>
          ) : null}
        </PressableScale>
      ) : (
        <View style={{ width: 40 }} />
      )}

      <Modal visible={menuOpen} transparent animationType="none" onRequestClose={() => setMenuOpen(false)}>
        <MenuPanel C={C} slide={slide} onClose={() => setMenuOpen(false)} />
      </Modal>
    </View>
  );
}

function MenuPanel({ C, slide, onClose }) {
  const translate = slide.interpolate({ inputRange: [0, 1], outputRange: [-300, 0] });
  const opacity = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const items = [
    { icon: 'home-outline', label: 'Home', to: '/(tabs)' },
    { icon: 'people-outline', label: 'Family ecosystem', to: '/family' },
    { icon: 'time-outline', label: 'Medical History', to: '/history' },
    { icon: 'medkit-outline', label: 'Emergency Help', to: '/emergency' },
    { icon: 'settings-outline', label: 'My Passport & Settings', to: '/profile' },
  ];

  return (
    <View style={styles.modalOverlay}>
      <Animated.View style={[styles.backdrop, { opacity }]} onTouchStart={onClose} />
      <Animated.View style={[styles.menuDrawer, { backgroundColor: C.cardWhite, transform: [{ translateX: translate }] }]}>
        <View style={styles.menuHeader}>
          <Text style={[styles.menuTitle, { color: C.textPrimary }]}>Menu</Text>
          <PressableScale onPress={onClose}><Ionicons name="close" size={24} color={C.textSecondary} /></PressableScale>
        </View>
        <View style={styles.menuList}>
          {items.map((it) => (
            <PressableScale key={it.label} style={styles.menuItem} onPress={() => { onClose(); router.push(it.to); }}>
              <View style={[styles.menuIcon, { backgroundColor: C.background }]}>
                <Ionicons name={it.icon} size={20} color={C.primaryBlue} />
              </View>
              <Text style={[styles.menuLabel, { color: C.textPrimary }]}>{it.label}</Text>
            </PressableScale>
          ))}
        </View>
        <View style={styles.menuFooter}>
          <Text style={{ color: C.textSecondary, fontSize: 12 }}>Bharat Health Bridge v1.0</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  center: { flex: 1, alignItems: 'center' },
  logoText: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  badge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  modalOverlay: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  menuDrawer: { width: 280, height: '100%', padding: 24, elevation: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10 },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  menuTitle: { fontSize: 24, fontWeight: '800' },
  menuList: { flex: 1, gap: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 16 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 16, fontWeight: '600' },
  menuFooter: { paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }
});
