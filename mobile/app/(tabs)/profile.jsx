import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Radius, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Image } from 'expo-image';
import PressableScale from '@/components/ui/PressableScale';
import * as ImagePicker from 'expo-image-picker';
import { HOME_MOCK_DATA } from '@/constants/mockData';

import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { user, logout } = useAuth();

  const [avatar, setAvatar] = useState(null);
  const [aadhar, setAadhar] = useState(HOME_MOCK_DATA.user.aadhar);
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [isEditing, setIsEditing] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  };

  return (
    <ScreenWrapper>
      <AppHeader title="Health Passport" showBell bellBadge={3} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
          <View style={styles.cardHeader}>
            <PressableScale onPress={pickImage} style={styles.avatarWrapper}>
              <Image
                source={avatar ? { uri: avatar } : require('@/assets/images/icon.png')}
                style={styles.avatar}
              />
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            </PressableScale>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: C.textPrimary }]}>{user?.name || 'Rahul Sharma'}</Text>
              <Text style={{ color: C.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 2 }}>{HOME_MOCK_DATA.user.bloodGroup} • {HOME_MOCK_DATA.user.age} Years</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={18} color="#10B981" />
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#10B981', marginTop: 4 }}>VERIFIED</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatItem label="Health Score" value={HOME_MOCK_DATA.user.healthScore} color="#3B82F6" />
            <StatItem label="Records" value="24" color="#10B981" />
            <StatItem label="Insurance" value="Active" color="#F59E0B" />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Personal Identity</Text>
            <PressableScale onPress={() => setIsEditing(!isEditing)} style={[styles.editBtn, { backgroundColor: isEditing ? '#10B981' : C.primaryBlue + '15' }]}>
              <Text style={{ color: isEditing ? '#fff' : C.primaryBlue, fontWeight: '800', fontSize: 12 }}>{isEditing ? 'Save Changes' : 'Update Details'}</Text>
            </PressableScale>
          </View>

          <View style={[styles.infoList, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
            <InfoRow icon="card" label="Aadhar ID" value={aadhar} isEditing={isEditing} onChangeText={setAadhar} C={C} />
            <InfoRow icon="call" label="Phone" value={phone} isEditing={isEditing} onChangeText={setPhone} C={C} last />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Medical Background</Text>
          <View style={[styles.infoList, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
            <InfoRow icon="pulse" label="Chronic" value={HOME_MOCK_DATA.user.chronic} C={C} />
            <InfoRow icon="shield" label="Provider" value={HOME_MOCK_DATA.user.insurance} C={C} />
            <InfoRow icon="calendar" label="Last Visit" value={HOME_MOCK_DATA.user.lastVisit} C={C} last />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Settings & Security</Text>
          <View style={[styles.infoList, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
            <SettingsRow icon="notifications-outline" label="Emergency Alerts" value="Enabled" color="#3B82F6" C={C} />
            <SettingsRow icon="finger-print-outline" label="Biometric Unlock" value="Active" color="#10B981" C={C} />
            <SettingsRow icon="eye-outline" label="Data Privacy" value="Strict" color="#8B5CF6" C={C} />
            <SettingsRow icon="cloud-upload-outline" label="Cloud Sync" value="Verified" color="#F59E0B" C={C} last />
          </View>
        </View>

        <PressableScale onPress={logout} style={styles.logoutBtn}>
          <View style={styles.logoutCircle}>
             <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </View>
          <Text style={styles.logoutText}>Logout Securely</Text>
        </PressableScale>
        
        <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>
           <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: '600' }}>Bharat Health Bridge v1.0.4</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function StatItem({ label, value, color }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingsRow({ icon, label, value, color, C, last }) {
  return (
    <PressableScale style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }]}>
      <View style={[styles.rowIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.settingsLabel, { color: C.textPrimary }]}>{label}</Text>
        <Text style={[styles.settingsValue, { color }]}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </PressableScale>
  );
}

function InfoRow({ icon, label, value, isEditing, onChangeText, C, last }) {
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }]}>
      <View style={[styles.rowIcon, { backgroundColor: C.background }]}>
        <Ionicons name={icon} size={18} color={C.primaryBlue} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {isEditing ? (
          <TextInput
            style={[styles.rowValueInput, { color: C.textPrimary }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={`...`}
          />
        ) : (
          <Text style={[styles.rowValue, { color: C.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{value}</Text>
        )}
      </View>
      {!isEditing && <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  profileCard: { padding: 24, borderRadius: 36, borderWidth: 1, ...Shadow.md, marginTop: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 28, backgroundColor: '#F3F4F6' },
  editBadge: { position: 'absolute', bottom: -4, right: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  name: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  verifiedBadge: { marginLeft: 'auto', alignItems: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 10, color: '#6B7280', fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  section: { marginTop: 36 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  editBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 },
  infoList: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 16 },
  rowIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 12, color: '#6B7280', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  rowValue: { fontSize: 16, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: 20 },
  rowValueInput: { fontSize: 16, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: 20, padding: 0 },
  
  settingsLabel: { fontSize: 15, fontWeight: '700' },
  settingsValue: { fontSize: 13, fontWeight: '800', marginRight: 10 },
  
  logoutBtn: { marginVertical: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  logoutCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#EF4444', fontWeight: '900', fontSize: 17 },
});
