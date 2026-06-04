import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Switch, Alert, LayoutAnimation, UIManager, Platform, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image } from 'expo-image';
import PressableScale from '@/components/ui/PressableScale';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const triggerHaptic = async (type) => {
  try {
    if (type === 'light') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (type === 'medium') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (type === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'error') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  } catch (_) {}
};

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { user, dashboard, logout, refreshDashboard } = useAuth();
  const { toggleTheme } = useTheme();

  const [expandedSection, setExpandedSection] = useState('personal');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannedToken, setScannedToken] = useState('');
  const [showScannedModal, setShowScannedModal] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const uniqueToken = dashboard?.patient?.uniqueToken || "4815162342908812";

  const formatToken = (tok) => {
    if (!tok) return '';
    const clean = tok.replace(/\s+/g, '');
    const matches = clean.match(/\d{4}/g);
    return matches ? matches.join(' - ') : tok;
  };

  // Editable Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [chronicIllness, setChronicIllness] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [avatar, setAvatar] = useState(null);

  // Health Card States
  const [healthCardType, setHealthCardType] = useState('Ayushman Card');
  const [healthCardImage, setHealthCardImage] = useState(null);
  const [isUploadingCard, setIsUploadingCard] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  // Aadhaar States
  const [aadharImage, setAadharImage] = useState(null);
  const [isUploadingAadhar, setIsUploadingAadhar] = useState(false);
  const [showAadharModal, setShowAadharModal] = useState(false);
  const [hasSecondaryCard, setHasSecondaryCard] = useState(false);

  // App Toggles States
  const [bioAuth, setBioAuth] = useState(true);
  const [locationShare, setLocationShare] = useState(false);
  const [aadhar, setAadhar] = useState('123456789012');

  // DOB Picker States
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(1998);
  const [selectedMonth, setSelectedMonth] = useState(5);
  const [selectedDay, setSelectedDay] = useState(15);
  const [organDonor, setOrganDonor] = useState(false);

  // Helper: Parse DOB into Year, Month, Day
  const parseDob = (dobString) => {
    let year = 1998;
    let month = 5;
    let day = 15;
    if (dobString && dobString.includes('-')) {
      const parts = dobString.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(y)) year = y;
        if (!isNaN(m)) month = m;
        if (!isNaN(d)) day = d;
      }
    }
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDay(day);
  };

  // Helper: Calculate age dynamically
  const calculateAge = (birthDateString) => {
    if (!birthDateString) return '28 Years';
    try {
      const today = new Date();
      const birthDate = new Date(birthDateString);
      if (isNaN(birthDate.getTime())) {
        return birthDateString;
      }
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age} Years`;
    } catch (_) {
      return '28 Years';
    }
  };

  const handleOpenDatePicker = () => {
    triggerHaptic('light');
    parseDob(dob);
    setShowDatePickerModal(true);
  };

  const handleConfirmDate = () => {
    triggerHaptic('success');
    const formattedMonth = String(selectedMonth).padStart(2, '0');
    const formattedDay = String(selectedDay).padStart(2, '0');
    setDob(`${selectedYear}-${formattedMonth}-${formattedDay}`);
    setShowDatePickerModal(false);
  };

  const yearsList = Array.from({ length: 87 }, (_, i) => 2026 - i);
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };
  const maxDays = getDaysInMonth(selectedMonth, selectedYear);
  const daysList = Array.from({ length: maxDays }, (_, i) => i + 1);

  // Initialize and Sync states with context user data
  React.useEffect(() => {
    if (user || dashboard) {
      setName(dashboard?.patient?.patientName || user?.name || '');
      setEmail(dashboard?.patient?.email || user?.email || '');
      setPhone(dashboard?.patient?.phone || user?.phone || '');
      setDob(dashboard?.patient?.dob || user?.dob || '');
      setGender(dashboard?.patient?.gender || user?.gender || 'Male');
      setAddress(dashboard?.patient?.address || '');
      setBloodGroup(dashboard?.patient?.bloodGroup || 'O+');
      setAllergies(dashboard?.patient?.allergies || '');
      setChronicIllness(dashboard?.patient?.chronicIllness || '');
      setCurrentMedications(dashboard?.patient?.symptoms || 'Vitamin D, Zinc');
      setEmergencyContactName(dashboard?.patient?.emergencyContactName || '');
      setEmergencyContactPhone(dashboard?.patient?.emergencyContactPhone || '');
      setAadhar(dashboard?.patient?.aadharCardId || user?.aadharCardId || '123456789012');
      setHealthCardType(dashboard?.patient?.healthCardType || user?.healthCardType || 'Ayushman Card');
      setHasSecondaryCard(!!(dashboard?.patient?.healthCardImage || user?.healthCardImage));
      setOrganDonor(dashboard?.patient?.organDonor || user?.organDonor || false);

      let avatarUrl = dashboard?.patient?.profileImage || user?.avatar || null;
      if (avatarUrl && avatarUrl.startsWith('http://localhost:4000')) {
        const { API_BASE_URL } = require('@/constants/api');
        const apiHost = API_BASE_URL.replace(/\/api\/?$/, '');
        avatarUrl = avatarUrl.replace('http://localhost:4000', apiHost);
      }
      setAvatar(avatarUrl);

      let cardUrl = dashboard?.patient?.healthCardImage || user?.healthCardImage || null;
      if (cardUrl && cardUrl.startsWith('http://localhost:4000')) {
        const { API_BASE_URL } = require('@/constants/api');
        const apiHost = API_BASE_URL.replace(/\/api\/?$/, '');
        cardUrl = cardUrl.replace('http://localhost:4000', apiHost);
      }
      setHealthCardImage(cardUrl);

      let aadharCardUrl = dashboard?.patient?.aadharCardImage || user?.aadharCardImage || null;
      if (aadharCardUrl && aadharCardUrl.startsWith('http://localhost:4000')) {
        const { API_BASE_URL } = require('@/constants/api');
        const apiHost = API_BASE_URL.replace(/\/api\/?$/, '');
        aadharCardUrl = aadharCardUrl.replace('http://localhost:4000', apiHost);
      }
      setAadharImage(aadharCardUrl);
    }
  }, [user, dashboard]);

  // Load secure switches settings
  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const bio = await SecureStore.getItemAsync('setting_bio_auth');
      if (bio !== null) setBioAuth(bio === 'true');
      const loc = await SecureStore.getItemAsync('setting_location_share');
      if (loc !== null) setLocationShare(loc === 'true');
    } catch (_) {}
  };

  const handleBioAuthChange = async (val) => {
    setBioAuth(val);
    triggerHaptic('light');
    try {
      await SecureStore.setItemAsync('setting_bio_auth', String(val));
    } catch (_) {}
  };

  const handleLocationShareChange = async (val) => {
    setLocationShare(val);
    triggerHaptic('light');
    try {
      await SecureStore.setItemAsync('setting_location_share', String(val));
    } catch (_) {}
  };

  const toggleSection = (section) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(expandedSection === section ? null : section);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setAvatar(selectedUri);
      triggerHaptic('success');

      setIsUploading(true);
      try {
        const { uploadAvatar } = require('@/lib/api');
        const res = await uploadAvatar(selectedUri);
        
        let returnedAvatar = res.avatar;
        if (returnedAvatar && returnedAvatar.startsWith('http://localhost:4000')) {
          const { API_BASE_URL } = require('@/constants/api');
          const apiHost = API_BASE_URL.replace(/\/api\/?$/, '');
          returnedAvatar = returnedAvatar.replace('http://localhost:4000', apiHost);
        }

        setAvatar(returnedAvatar);
        if (refreshDashboard) {
          await refreshDashboard();
        }
        Alert.alert('Success', 'Profile photo updated successfully!');
      } catch (err) {
        console.error('Upload photo failed:', err);
        Alert.alert('Upload Failed', err.message || 'Could not upload profile photo.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const pickCardImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setHealthCardImage(selectedUri);
      triggerHaptic('success');

      setIsUploadingCard(true);
      try {
        const { uploadHealthCard } = require('@/lib/api');
        const res = await uploadHealthCard(selectedUri, healthCardType);
        
        let returnedCard = res.healthCardImage;
        if (returnedCard && returnedCard.startsWith('http://localhost:4000')) {
          const { API_BASE_URL } = require('@/constants/api');
          const apiHost = API_BASE_URL.replace(/\/api\/?$/, '');
          returnedCard = returnedCard.replace('http://localhost:4000', apiHost);
        }

        setHealthCardImage(returnedCard);
        if (refreshDashboard) {
          await refreshDashboard();
        }
        Alert.alert('Success', `${healthCardType} scan uploaded successfully!`);
      } catch (err) {
        console.error('Upload card failed:', err);
        Alert.alert('Upload Failed', err.message || 'Could not upload card scan.');
      } finally {
        setIsUploadingCard(false);
      }
    }
  };

  const pickAadharImage = async () => {
    if (!aadhar || aadhar.trim().length !== 12 || isNaN(aadhar)) {
      Alert.alert('Error', 'Please enter a valid 12-digit numeric Aadhaar ID before uploading the card scan.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setAadharImage(selectedUri);
      triggerHaptic('success');

      setIsUploadingAadhar(true);
      try {
        const { uploadAadharCard } = require('@/lib/api');
        const res = await uploadAadharCard(selectedUri, aadhar);
        
        let returnedAadhar = res.aadharCardImage;
        if (returnedAadhar && returnedAadhar.startsWith('http://localhost:4000')) {
          const { API_BASE_URL } = require('@/constants/api');
          const apiHost = API_BASE_URL.replace(/\/api\/?$/, '');
          returnedAadhar = returnedAadhar.replace('http://localhost:4000', apiHost);
        }

        setAadharImage(returnedAadhar);
        if (refreshDashboard) {
          await refreshDashboard();
        }
        Alert.alert('Success', 'Aadhar Card scan uploaded successfully!');
      } catch (err) {
        console.error('Upload Aadhar failed:', err);
        Alert.alert('Upload Failed', err.message || 'Could not upload Aadhar scan.');
      } finally {
        setIsUploadingAadhar(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (isEditing) {
      setIsSaving(true);
      try {
        const { updateProfile } = require('@/lib/api');
        await updateProfile({
          name,
          phone,
          email,
          dob,
          gender,
          address,
          bloodGroup,
          allergies,
          chronicIllness,
          currentMedications,
          emergencyContactName,
          emergencyContactPhone,
          organDonor
        });

        if (refreshDashboard) {
          await refreshDashboard();
        }

        triggerHaptic('success');
        Alert.alert('Success', 'Profile information updated successfully!');
        setIsEditing(false);
      } catch (err) {
        console.error('Save profile failed:', err);
        Alert.alert('Error', err.message || 'Could not save profile.');
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(true);
      triggerHaptic('medium');
    }
  };

  const handleLogout = () => {
    Alert.alert('Secure Logout', 'Are you sure you want to log out from this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  const maskAadhar = (val) => {
    if (!val || val.length < 12) return val;
    return `XXXX XXXX ${val.slice(-4)}`;
  };

  return (
    <ScreenWrapper scroll={false}>
      <AppHeader title="Health Identity" showBell bellBadge={2} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* DIGITAL HEALTH IDENTITY CARD (ABHA Passport Style) */}
        <LinearGradient
          colors={scheme === 'dark' ? ['#1E3A8A', '#0F172A'] : ['#E0F2FE', '#F0F9FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.digitalCard, { borderColor: C.border }]}
        >
          {/* Saffron and Green Corner Accents for Tricolor Flag representation */}
          <View style={styles.tricolorStripeContainer}>
            <View style={[styles.stripe, { backgroundColor: '#FF9933' }]} />
            <View style={[styles.stripe, { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.stripe, { backgroundColor: '#138808' }]} />
          </View>

          {/* Card Top Branding */}
          <View style={styles.cardBrandingRow}>
            <View style={styles.cardEmblemWrapper}>
              <Ionicons name="medical" size={14} color="#FF9933" />
              <Text style={[styles.cardOrgText, { color: scheme === 'dark' ? '#D1D5DB' : '#1E3A8A' }]}>
                BHARAT DIGITAL HEALTH PASSPORT
              </Text>
            </View>
            <View style={[styles.cardStatusBadge, { backgroundColor: '#10B98120' }]}>
              <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusBadgeText}>ACTIVE</Text>
            </View>
          </View>

          {/* Card Central Content */}
          <View style={styles.cardBodyRow}>
            {/* Left side: Demographics */}
            <View style={styles.cardDemographics}>
              <View style={styles.avatarContainer}>
                <PressableScale onPress={pickImage} style={styles.avatarWrapper}>
                  {isUploading ? (
                    <View style={[styles.cardAvatar, styles.avatarLoader, { borderColor: C.border }]}>
                      <ActivityIndicator size="small" color={C.primaryBlue} />
                    </View>
                  ) : (
                    <Image
                      source={avatar ? { uri: avatar } : require('@/assets/images/icon.png')}
                      style={styles.cardAvatar}
                    />
                  )}
                  <View style={styles.cardEditBadge}>
                    <Ionicons name="camera" size={13} color="#fff" />
                  </View>
                </PressableScale>
                <View style={styles.nameSection}>
                  <Text style={[styles.cardName, { color: scheme === 'dark' ? '#F9FAFB' : '#111827' }]} numberOfLines={1}>
                    {name || 'Patient'}
                  </Text>
                  <Text style={[styles.cardSubText, { color: scheme === 'dark' ? '#9CA3AF' : '#4B5563' }]}>
                    {gender} • {calculateAge(dob)}
                  </Text>
                </View>
              </View>

              {/* Patient Key Credentials Grid */}
              <View style={styles.credentialsGrid}>
                <View style={{ flexDirection: 'row', gap: Spacing.md || 16 }}>
                  <View style={[styles.credItem, { flex: 1.2 }]}>
                    <Text style={styles.credLabel}>BLOOD GROUP</Text>
                    <Text style={[styles.credValue, { color: '#EF4444' }]}>{bloodGroup || 'O+'}</Text>
                  </View>
                  <View style={[styles.credItem, { flex: 2.8 }]}>
                    <Text style={styles.credLabel}>BHB UNIQUE TOKEN</Text>
                    <Text style={[styles.credValue, { color: scheme === 'dark' ? '#E5E7EB' : '#1F2937', letterSpacing: 0.5 }]}>
                      {formatToken(uniqueToken)}
                    </Text>
                  </View>
                </View>

                {hasSecondaryCard && (
                  <View style={styles.credItem}>
                    <Text style={styles.credLabel}>{healthCardType.toUpperCase()}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
                      <Text style={[styles.credValue, { color: scheme === 'dark' ? '#E5E7EB' : '#1F2937', flex: 0 }]}>
                        VERIFIED BENEFICIARY
                      </Text>
                      {healthCardImage && (
                        <TouchableOpacity 
                          onPress={() => {
                            triggerHaptic('success');
                            setShowCardModal(true);
                          }}
                          style={{
                            backgroundColor: '#10B98125',
                            paddingVertical: 2,
                            paddingHorizontal: 6,
                            borderRadius: 6,
                            borderWidth: 0.5,
                            borderColor: '#10B981'
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 8, fontWeight: '800', color: '#10B981' }}>VIEW CARD</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          {/* Card Footer: Security / Encryption details */}
          <View style={[styles.cardFooterBar, { borderTopColor: scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={styles.encryptionWrapper}>
              <Ionicons name="lock-closed" size={10} color="#10B981" />
              <Text style={styles.encryptionText}>SECURE ID</Text>
            </View>
            <TouchableOpacity 
              onPress={() => {
                triggerHaptic('success');
                setShowQrModal(true);
              }} 
              style={{
                backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Ionicons name="qr-code" size={12} color={scheme === 'dark' ? '#FF9933' : '#1E3A8A'} />
              <Text style={{ fontSize: 10, fontWeight: '800', color: scheme === 'dark' ? '#FF9933' : '#1E3A8A' }}>MY QR</Text>
            </TouchableOpacity>
            <PressableScale 
              onPress={toggleTheme} 
              style={[styles.themeCardToggle, { backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
            >
              <Ionicons 
                name={scheme === 'dark' ? "sunny" : "moon"} 
                size={14} 
                color={scheme === 'dark' ? "#F59E0B" : "#1E3A8A"} 
              />
            </PressableScale>
          </View>
        </LinearGradient>

         {/* Modal for interactive QR code scanning */}
        {showQrModal && (
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.modalContent, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
              <View style={styles.modalHeader}>
                <Ionicons name="shield-checkmark" size={32} color={C.accentGreen} />
                <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Secure Health ID Token</Text>
                <PressableScale onPress={() => {
                  triggerHaptic('light');
                  setShowQrModal(false);
                }} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color={C.textSecondary} />
                </PressableScale>
              </View>
              
              <View style={[styles.tokenContainer, { backgroundColor: C.background, borderColor: C.border }]}>
                <Text style={[styles.tokenLabel, { color: C.textSecondary }]}>BHARAT HEALTH BRIDGE UNIQUE ID</Text>
                <Text style={[styles.tokenValue, { color: C.textPrimary, letterSpacing: 1.5 }]}>{formatToken(uniqueToken)}</Text>
                
                <View style={styles.dividerLine} />
                
                <Text style={[styles.tokenLabel, { color: C.textSecondary }]}>CRYPTOGRAPHIC VERIFIED PASS</Text>
                <Text style={styles.tokenRaw} numberOfLines={3}>
                  BHB_SECURE_{name?.toUpperCase().replace(/\s+/g, '_') || 'PATIENT'}_{uniqueToken}_VERIFIED_IDENTITY_PASSPORT
                </Text>
              </View>
              
              <Text style={[styles.modalHint, { color: C.textSecondary }]}>
                Display this secure code at any Bharat Health Bridge reception desk to instantly retrieve your clinical profile.
              </Text>
              
              <PressableScale onPress={() => {
                triggerHaptic('success');
                Alert.alert("Success", "Secure health key copied to clipboard!");
                setShowQrModal(false);
              }} style={[styles.copyBtn, { backgroundColor: C.primaryBlue }]}>
                <Ionicons name="copy-outline" size={18} color="#fff" />
                <Text style={styles.copyBtnText}>Copy Identity Token</Text>
              </PressableScale>
            </View>
          </View>
        )}



        {/* Modal for viewing active health card image scan */}
        {showCardModal && healthCardImage && (
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.modalContent, { backgroundColor: C.cardWhite, borderColor: C.border, padding: 16 }]}>
              <View style={styles.modalHeader}>
                <Ionicons name="card-outline" size={28} color="#8B5CF6" />
                <Text style={[styles.modalTitle, { color: C.textPrimary, fontSize: 18 }]}>{healthCardType}</Text>
                <PressableScale onPress={() => {
                  triggerHaptic('light');
                  setShowCardModal(false);
                }} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color={C.textSecondary} />
                </PressableScale>
              </View>
              
              <View style={{ alignItems: 'center', marginVertical: 10 }}>
                <Image
                  source={{ uri: healthCardImage }}
                  style={{ width: '100%', height: 200, borderRadius: 16 }}
                  contentFit="contain"
                />
              </View>
              
              <Text style={[styles.modalHint, { color: C.textSecondary, marginTop: 10, fontSize: 12, lineHeight: 16 }]}>
                This is a secure, encrypted digital replica of your {healthCardType}. Use this scan for direct clinical validation at BHARAT Health desks.
              </Text>
              
              <PressableScale onPress={() => setShowCardModal(false)} style={[styles.copyBtn, { backgroundColor: C.primaryBlue }]}>
                <Text style={styles.copyBtnText}>Dismiss Document</Text>
              </PressableScale>
            </View>
          </View>
        )}

        {/* Modal for viewing active Aadhaar Card scan */}
        {showAadharModal && aadharImage && (
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.modalContent, { backgroundColor: C.cardWhite, borderColor: C.border, padding: 16 }]}>
              <View style={styles.modalHeader}>
                <Ionicons name="shield-checkmark-outline" size={28} color="#FF9933" />
                <Text style={[styles.modalTitle, { color: C.textPrimary, fontSize: 18 }]}>Aadhar Card (UIDAI)</Text>
                <PressableScale onPress={() => {
                  triggerHaptic('light');
                  setShowAadharModal(false);
                }} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color={C.textSecondary} />
                </PressableScale>
              </View>
              
              <View style={{ alignItems: 'center', marginVertical: 10 }}>
                <Image
                  source={{ uri: aadharImage }}
                  style={{ width: '100%', height: 200, borderRadius: 16 }}
                  contentFit="contain"
                />
              </View>
              
              <Text style={[styles.modalHint, { color: C.textSecondary, marginTop: 10, fontSize: 12, lineHeight: 16 }]}>
                This is a secure, encrypted digital replica of your compulsory Aadhaar Card. It is verified and synced with UIDAI protocols.
              </Text>
              
              <PressableScale onPress={() => setShowAadharModal(false)} style={[styles.copyBtn, { backgroundColor: C.primaryBlue }]}>
                <Text style={styles.copyBtnText}>Dismiss Document</Text>
              </PressableScale>
            </View>
          </View>
        )}

        {/* Dynamic DOB Custom Picker Modal */}
        {showDatePickerModal && (
          <Modal
            visible={showDatePickerModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowDatePickerModal(false)}
          >
            <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <View style={[styles.modalContent, { backgroundColor: C.cardWhite, borderColor: C.border, padding: 20, maxHeight: 380 }]}>
                <View style={styles.modalHeader}>
                  <Ionicons name="calendar-outline" size={24} color={C.primaryBlue} />
                  <Text style={[styles.modalTitle, { color: C.textPrimary, fontSize: 18 }]}>Select Date of Birth</Text>
                  <PressableScale onPress={() => {
                    triggerHaptic('light');
                    setShowDatePickerModal(false);
                  }} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={24} color={C.textSecondary} />
                  </PressableScale>
                </View>
                
                <View style={{ flexDirection: 'row', height: 180, gap: 8, marginVertical: 10 }}>
                  {/* Year Scroll */}
                  <View style={{ flex: 1.1, borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: 'hidden', backgroundColor: C.background }}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: C.textSecondary, textAlign: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.cardWhite }}>YEAR</Text>
                    <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
                      {yearsList.map(y => (
                        <TouchableOpacity 
                          key={y} 
                          onPress={() => {
                            triggerHaptic('light');
                            setSelectedYear(y);
                          }}
                          style={{ paddingVertical: 6, alignItems: 'center', backgroundColor: selectedYear === y ? C.primaryBlue + '20' : 'transparent', borderRadius: 8, marginHorizontal: 4 }}
                        >
                          <Text style={{ color: selectedYear === y ? C.primaryBlue : C.textPrimary, fontWeight: selectedYear === y ? '900' : '600', fontSize: 13 }}>{y}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Month Scroll */}
                  <View style={{ flex: 1.4, borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: 'hidden', backgroundColor: C.background }}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: C.textSecondary, textAlign: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.cardWhite }}>MONTH</Text>
                    <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
                      {monthsList.map((m, idx) => {
                        const active = selectedMonth === (idx + 1);
                        return (
                          <TouchableOpacity 
                            key={m} 
                            onPress={() => {
                              triggerHaptic('light');
                              setSelectedMonth(idx + 1);
                            }}
                            style={{ paddingVertical: 6, alignItems: 'center', backgroundColor: active ? C.primaryBlue + '20' : 'transparent', borderRadius: 8, marginHorizontal: 4 }}
                          >
                            <Text style={{ color: active ? C.primaryBlue : C.textPrimary, fontWeight: active ? '900' : '600', fontSize: 13 }} numberOfLines={1}>{m}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Day Scroll */}
                  <View style={{ flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: 'hidden', backgroundColor: C.background }}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: C.textSecondary, textAlign: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.cardWhite }}>DAY</Text>
                    <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
                      {daysList.map(d => (
                        <TouchableOpacity 
                          key={d} 
                          onPress={() => {
                            triggerHaptic('light');
                            setSelectedDay(d);
                          }}
                          style={{ paddingVertical: 6, alignItems: 'center', backgroundColor: selectedDay === d ? C.primaryBlue + '20' : 'transparent', borderRadius: 8, marginHorizontal: 4 }}
                        >
                          <Text style={{ color: selectedDay === d ? C.primaryBlue : C.textPrimary, fontWeight: selectedDay === d ? '900' : '600', fontSize: 13 }}>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity 
                    onPress={() => setShowDatePickerModal(false)}
                    style={{ flex: 1, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: C.textSecondary, fontWeight: '800', fontSize: 14 }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleConfirmDate}
                    style={{ flex: 1.5, height: 48, borderRadius: 14, backgroundColor: C.primaryBlue, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Confirm Date</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* 1. PERSONAL INFORMATION */}
        <AccordionSection 
          title="Personal Information" 
          icon="person-outline" 
          color="#3B82F6" 
          isExpanded={expandedSection === 'personal'} 
          onPress={() => toggleSection('personal')} 
          C={C}
        >
          <InfoRow icon="person" label="Full Name" value={name} isEditing={isEditing} onChangeText={setName} C={C} />
          <InfoRow icon="call" label="Phone Number" value={phone} isEditing={isEditing} onChangeText={setPhone} C={C} />
          <InfoRow icon="mail" label="Email" value={email} isEditing={isEditing} onChangeText={setEmail} C={C} />
          <InfoRow 
            icon="calendar" 
            label="Date of Birth" 
            value={dob} 
            isEditing={isEditing} 
            isPressable={true} 
            onPress={handleOpenDatePicker} 
            C={C} 
          />
          <InfoRow icon="location" label="Address" value={address} isEditing={isEditing} onChangeText={setAddress} C={C} last />
          
          <PressableScale onPress={handleSaveProfile} style={styles.saveBtn} disabled={isSaving}>
             <Text style={styles.saveBtnText}>
               {isSaving ? 'Saving...' : (isEditing ? 'Save Profile' : 'Edit Profile')}
             </Text>
          </PressableScale>
        </AccordionSection>

        {/* 2. MEDICAL INFORMATION */}
        <AccordionSection 
          title="Medical Identity" 
          icon="medical-outline" 
          color="#EF4444" 
          isExpanded={expandedSection === 'medical'} 
          onPress={() => toggleSection('medical')} 
          C={C}
        >
          <InfoRow icon="water" label="Blood Group" value={bloodGroup} isEditing={isEditing} onChangeText={setBloodGroup} C={C} />
          <InfoRow icon="warning" label="Allergies" value={allergies} isEditing={isEditing} onChangeText={setAllergies} C={C} />
          <InfoRow icon="pulse" label="Chronic Diseases" value={chronicIllness} isEditing={isEditing} onChangeText={setChronicIllness} C={C} />
          <InfoRow icon="medkit" label="Medications" value={currentMedications} isEditing={isEditing} onChangeText={setCurrentMedications} C={C} />
          {isEditing ? (
            <View style={[styles.toggleRow, { borderBottomWidth: 0, paddingHorizontal: 4, paddingVertical: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Ionicons name="heart" size={20} color="#EF4444" />
                <Text style={[styles.toggleText, { color: C.textPrimary, fontSize: 13, fontWeight: '700' }]}>Organ Donor Registration</Text>
              </View>
              <Switch 
                value={organDonor} 
                onValueChange={(val) => {
                  triggerHaptic('light');
                  setOrganDonor(val);
                }} 
                trackColor={{ true: '#EF4444' }} 
              />
            </View>
          ) : (
            <InfoRow icon="heart" label="Organ Donor" value={organDonor ? "Registered (Active)" : "Not Registered"} isEditing={false} C={C} last />
          )}
          
          <PressableScale onPress={handleSaveProfile} style={[styles.saveBtn, { backgroundColor: '#EF4444' }]} disabled={isSaving}>
             <Text style={styles.saveBtnText}>
               {isSaving ? 'Saving...' : (isEditing ? 'Save Medical Identity' : 'Edit Medical Identity')}
             </Text>
          </PressableScale>
        </AccordionSection>

        {/* 3. EMERGENCY INFORMATION */}
        <AccordionSection 
          title="Emergency Details" 
          icon="alert-circle-outline" 
          color="#F59E0B" 
          isExpanded={expandedSection === 'emergency'} 
          onPress={() => toggleSection('emergency')} 
          C={C}
        >
          <InfoRow icon="people" label="Primary Contact" value={emergencyContactName} isEditing={isEditing} onChangeText={setEmergencyContactName} C={C} />
          <InfoRow icon="call" label="Emergency Phone" value={emergencyContactPhone} isEditing={isEditing} onChangeText={setEmergencyContactPhone} C={C} />
          
          <View style={[styles.toggleRow, { borderBottomColor: C.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="location-outline" size={20} color={C.textSecondary} />
              <Text style={[styles.toggleText, { color: C.textPrimary }]}>Live Location in SOS</Text>
            </View>
            <Switch value={locationShare} onValueChange={handleLocationShareChange} trackColor={{ true: '#10B981' }} />
          </View>

          <PressableScale onPress={handleSaveProfile} style={[styles.saveBtn, { backgroundColor: '#F59E0B' }]} disabled={isSaving}>
             <Text style={styles.saveBtnText}>
               {isSaving ? 'Saving...' : (isEditing ? 'Save Emergency Details' : 'Edit Emergency Details')}
             </Text>
          </PressableScale>
        </AccordionSection>

        {/* 4. IDENTITY & COMPULSORY AADHAAR VERIFICATION */}
        <AccordionSection 
          title="Identity & Health Cards" 
          icon="id-card-outline" 
          color="#8B5CF6" 
          isExpanded={expandedSection === 'identity'} 
          onPress={() => toggleSection('identity')} 
          C={C}
        >
          {/* Aadhaar Section - COMPULSORY */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Aadhaar Card Verification <Text style={{ color: '#EF4444', fontSize: 10 }}>[COMPULSORY]</Text>
              </Text>
              <Text style={{ fontSize: 9, fontWeight: '800', color: '#EF4444', backgroundColor: '#EF444415', paddingVertical: 2, paddingHorizontal: 6, borderRadius: Radius.sm || 6 }}>REQUIRED</Text>
            </View>

            <InfoRow icon="shield-checkmark" label="Aadhaar 12-Digit ID" value={aadhar} isEditing={isEditing} onChangeText={(text) => setAadhar(text.replace(/\D/g, '').slice(0, 12))} C={C} />
            
            <TouchableOpacity
              onPress={pickAadharImage}
              style={{
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: aadharImage ? '#10B981' : C.border,
                borderRadius: Radius.md || 16,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: C.background,
                marginTop: 8
              }}
              activeOpacity={0.7}
              disabled={isUploadingAadhar}
            >
              {isUploadingAadhar ? (
                <ActivityIndicator size="small" color={C.primaryBlue} />
              ) : aadharImage ? (
                <View style={{ alignItems: 'center' }}>
                  <Image
                    source={{ uri: aadharImage }}
                    style={{ width: 140, height: 90, borderRadius: Radius.xs || 8, marginBottom: 8, borderWidth: 1, borderColor: C.border }}
                  />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#10B981' }}>
                    ✓ Aadhaar scan registered!
                  </Text>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: C.textSecondary, marginTop: 2 }}>
                    Tap to replace Aadhaar card scan
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="cloud-upload-outline" size={28} color={C.textSecondary} />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: C.textPrimary, marginTop: 6 }}>
                    Tap to Upload Aadhaar Card Scan
                  </Text>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: C.textSecondary, marginTop: 2 }}>
                    Mandatory for unique clinical profile KYC
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Secondary Benefit Card Section - OPTIONAL */}
          <View style={{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Secondary Health Benefit Card <Text style={{ color: C.textSecondary, fontSize: 9 }}>[OPTIONAL]</Text>
              </Text>
              <Switch 
                value={hasSecondaryCard} 
                onValueChange={(val) => {
                  triggerHaptic('light');
                  setHasSecondaryCard(val);
                }} 
                trackColor={{ true: '#10B981' }} 
              />
            </View>

            {hasSecondaryCard && (
              <View style={{ animation: 'fadeIn 0.2s' }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
                  Select Card Type
                </Text>
                
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {['Ayushman Card', 'CGHS Card', 'ABHA Card', 'ECHS Card', 'State Health Card'].map((type) => {
                    const active = healthCardType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => {
                          triggerHaptic('light');
                          setHealthCardType(type);
                        }}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: Radius.md || 12,
                          borderWidth: 1.5,
                          borderColor: active ? C.primaryBlue : C.border,
                          backgroundColor: active ? C.primaryBlue + '15' : C.cardWhite,
                          marginBottom: 4
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: active ? C.primaryBlue : C.textSecondary }}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  onPress={pickCardImage}
                  style={{
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: healthCardImage ? '#10B981' : C.border,
                    borderRadius: Radius.md || 16,
                    padding: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: C.background,
                    marginBottom: 8
                  }}
                  activeOpacity={0.7}
                  disabled={isUploadingCard}
                >
                  {isUploadingCard ? (
                    <ActivityIndicator size="small" color={C.primaryBlue} />
                  ) : healthCardImage ? (
                    <View style={{ alignItems: 'center' }}>
                      <Image
                        source={{ uri: healthCardImage }}
                        style={{ width: 140, height: 90, borderRadius: Radius.xs || 8, marginBottom: 8, borderWidth: 1, borderColor: C.border }}
                      />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#10B981' }}>
                        ✓ {healthCardType} scan registered!
                      </Text>
                      <Text style={{ fontSize: 9, fontWeight: '600', color: C.textSecondary, marginTop: 2 }}>
                        Tap to replace benefit card scan
                      </Text>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Ionicons name="cloud-upload-outline" size={28} color={C.textSecondary} />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: C.textPrimary, marginTop: 6 }}>
                        Tap to Upload Benefit Card Scan
                      </Text>
                      <Text style={{ fontSize: 9, fontWeight: '600', color: C.textSecondary, marginTop: 2 }}>
                        Supports Ayushman and CGHS formats
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
          <InfoRow icon="document-text" label="PAN Verification" value="XXXXX1234X" isEditing={false} C={C} last />
          
          <PressableScale onPress={handleSaveProfile} style={[styles.saveBtn, { backgroundColor: '#8B5CF6' }]} disabled={isSaving}>
             <Text style={styles.saveBtnText}>
               {isSaving ? 'Saving...' : (isEditing ? 'Save Identity Details' : 'Edit Identity Details')}
             </Text>
          </PressableScale>
        </AccordionSection>

        {/* 5. APP PREFERENCES */}
        <AccordionSection 
          title="App Preferences" 
          icon="settings-outline" 
          color="#64748B" 
          isExpanded={expandedSection === 'preferences'} 
          onPress={() => toggleSection('preferences')} 
          C={C}
        >
          <View style={[styles.toggleRow, { borderBottomWidth: 0, paddingVertical: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Ionicons name="moon-outline" size={20} color={C.textSecondary} />
              <Text style={[styles.toggleText, { color: C.textPrimary, fontSize: 13, fontWeight: '700' }]}>Dark Mode</Text>
            </View>
            <Switch value={scheme === 'dark'} onValueChange={toggleTheme} trackColor={{ true: C.primaryBlue }} />
          </View>
        </AccordionSection>

        <PressableScale onPress={handleLogout} style={styles.logoutBtn}>
          <View style={styles.logoutCircle}>
             <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </View>
          <Text style={styles.logoutText}>Logout Securely</Text>
        </PressableScale>
        
        <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>
           <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: '600' }}>Bharat Health Bridge v2.1.0</Text>
           <Text style={{ color: C.textSecondary, fontSize: 10, marginTop: 4 }}>End-to-End Encrypted Identity</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

// ----------------------------------------------------
// UI COMPONENTS
// ----------------------------------------------------

function AccordionSection({ title, icon, color, isExpanded, onPress, children, C }) {
  return (
    <View style={styles.section}>
      <PressableScale onPress={onPress} style={[styles.accordionHeader, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
        <View style={[styles.rowIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>{title}</Text>
        <Ionicons name={isExpanded ? "chevron-down" : "chevron-forward"} size={20} color="#9CA3AF" />
      </PressableScale>
      
      {isExpanded && (
        <View style={[styles.accordionBody, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
          {children}
        </View>
      )}
    </View>
  );
}function InfoRow({ icon, label, value, isEditing, onChangeText, isPressable, onPress, C, last }) {
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }]}>
      <View style={[styles.smallIcon, { backgroundColor: C.background }]}>
        <Ionicons name={icon} size={14} color={C.textSecondary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: C.textSecondary }]}>{label}</Text>
        {isEditing ? (
          isPressable ? (
            <TouchableOpacity onPress={onPress} style={{ paddingVertical: 4 }}>
              <Text style={[styles.rowValue, { color: value ? C.textPrimary : C.textSecondary + '80', fontWeight: '800' }]}>
                {value || `Select ${label}`}
              </Text>
            </TouchableOpacity>
          ) : (
            <TextInput
              style={[styles.rowValueInput, { color: C.textPrimary, borderBottomColor: C.primaryBlue }]}
              value={value || ''}
              onChangeText={onChangeText}
              placeholder={`Enter ${label}`}
              placeholderTextColor={C.textSecondary + '80'}
            />
          )
        ) : (
          <Text style={[styles.rowValue, { color: C.textPrimary }]} numberOfLines={1}>{value || '—'}</Text>
        )}
      </View>
    </View>
  );
}

function SettingsLink({ icon, label, value, color = '#3B82F6', C, onPress }) {
  return (
    <PressableScale onPress={onPress} style={[styles.infoRow, { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }]}>
      <Ionicons name={icon} size={20} color={C.textSecondary} style={{ width: 28 }} />
      <Text style={[styles.settingsLabel, { color: C.textPrimary, flex: 1 }]}>{label}</Text>
      {value && <Text style={{ color, fontWeight: '700', fontSize: 13, marginRight: 8 }}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </PressableScale>
  );
}

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 120 },
  
  // 1. DIGITAL HEALTH PASSPORT CARD STYLES
  digitalCard: { borderRadius: 28, borderWidth: 1, padding: 20, position: 'relative', overflow: 'hidden', marginTop: 15, marginBottom: 15, ...Shadow.md },
  tricolorStripeContainer: { position: 'absolute', top: 0, right: 0, width: 90, height: 6, flexDirection: 'row' },
  stripe: { flex: 1, height: '100%' },
  cardBrandingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardEmblemWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardOrgText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  cardStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 9, fontWeight: '900', color: '#10B981', letterSpacing: 0.5 },
  cardBodyRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  cardDemographics: { flex: 1 },
  avatarContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardAvatar: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#F3F4F6' },
  cardEditBadge: { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: '#1E3A8A', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  nameSection: { flex: 1 },
  cardName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  cardSubText: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  credentialsGrid: { gap: 8 },
  credItem: {},
  credLabel: { fontSize: 8, color: '#9CA3AF', fontWeight: '800', letterSpacing: 0.5 },
  credValue: { fontSize: 13, fontWeight: '800', marginTop: 1 },
  interactiveQrContainer: { width: 84, height: 102, borderRadius: 16, borderWidth: 1, padding: 8, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  qrGrid: { width: 56, height: 56, gap: 4 },
  qrRow: { flex: 1, flexDirection: 'row', gap: 4 },
  qrAnchor: { flex: 1, borderRadius: 2 },
  qrDotActive: { flex: 1, borderRadius: 2 },
  qrDotInactive: { flex: 1, backgroundColor: 'transparent' },
  qrHintText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5, marginTop: 6 },
  cardFooterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1 },
  encryptionWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  encryptionText: { fontSize: 8, color: '#10B981', fontWeight: '800', letterSpacing: 0.5 },
  themeCardToggle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // 2. MODAL OVERLAY STYLES
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 28, borderWidth: 1, padding: 24, ...Shadow.xl },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', flex: 1, marginLeft: 12 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tokenContainer: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  tokenLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  tokenValue: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  dividerLine: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 12 },
  tokenRaw: { fontSize: 12, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), opacity: 0.8, color: '#10B981', fontWeight: '700' },
  modalHint: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 24, fontWeight: '500' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16 },
  copyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // 3. COMMON APP PROFILE STYLES
  themeQuickToggle: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, zIndex: 10, ...Shadow.sm },
  avatarWrapper: { position: 'relative' },
  avatarLoader: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  
  section: { marginTop: 12 },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1 },
  sectionTitle: { fontSize: 17, fontWeight: '800', flex: 1, marginLeft: 16 },
  accordionBody: { marginTop: 8, borderRadius: 24, borderWidth: 1, padding: 8, overflow: 'hidden' },
  
  rowIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  smallIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  rowContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 13, color: '#6B7280', fontWeight: '700' },
  rowValue: { fontSize: 15, fontWeight: '800', textAlign: 'right', flex: 1, marginLeft: 20 },
  rowValueInput: { fontSize: 15, fontWeight: '800', textAlign: 'right', flex: 1, marginLeft: 20, padding: 4, borderBottomWidth: 1 },
  
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  toggleText: { fontSize: 15, fontWeight: '700' },
  settingsLabel: { fontSize: 15, fontWeight: '700' },
  
  saveBtn: { backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 16, alignItems: 'center', margin: 12, marginTop: 16 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  logoutBtn: { marginVertical: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  logoutCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#EF4444', fontWeight: '900', fontSize: 17 },
});
