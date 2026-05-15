import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { useCameraPermissions, CameraView } from 'expo-camera';
import { Image } from 'expo-image';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from '@/components/ui/PressableScale';

export default function ScanPrescription() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [photoUri, setPhotoUri] = useState(null);

  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!photoUri && permission?.granted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [photoUri, permission]);

  if (!permission || !permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <LinearGradient colors={['#F0F9FF', '#E0F2FE']} style={StyleSheet.absoluteFill} />
        <View style={styles.permissionIcon}><Ionicons name="camera" size={60} color={C.primaryBlue} /></View>
        <Text style={[styles.title, { color: C.textPrimary }]}>Camera Access Required</Text>
        <Text style={styles.sub}>Allow camera access to analyze prescriptions and find generic alternatives.</Text>
        <PressableScale style={[styles.btnPrimary, { backgroundColor: C.primaryBlue }]} onPress={requestPermission}>
          <Text style={styles.btnText}>Enable Camera</Text>
        </PressableScale>
        <PressableScale onPress={() => router.back()} style={styles.backLink}>
          <Ionicons name="chevron-back" size={16} color={C.textSecondary} />
          <Text style={{ color: C.textSecondary, fontWeight: '700' }}>Back to Home</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {!photoUri ? (
        <View style={{ flex: 1 }}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />

          <View style={styles.hudTop}>
            <PressableScale onPress={() => router.back()} style={styles.hudBtn}>
              <Ionicons name="close" size={28} color="#fff" />
            </PressableScale>
            <Text style={styles.hudTitle}>Prescription Scan</Text>
            <PressableScale style={styles.hudBtn}>
              <Ionicons name="flash-off" size={24} color="#fff" />
            </PressableScale>
          </View>

          <View style={styles.scannerWrapper}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
            <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 240] }) }] }]}>
              <LinearGradient colors={['transparent', 'rgba(59, 130, 246, 0.5)', 'transparent']} style={{ flex: 1 }} />
            </Animated.View>
          </View>

          <View style={styles.hudBottom}>
            <PressableScale style={styles.galleryBtn}>
              <Ionicons name="images-outline" size={24} color="#fff" />
            </PressableScale>
            <PressableScale
              style={styles.shutterOuter}
              onPress={async () => {
                if (!cameraRef.current) return;
                const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
                setPhotoUri(photo?.uri ?? null);
              }}
            >
              <View style={styles.shutterInner} />
            </PressableScale>
            <View style={{ width: 44 }} />
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: C.background }}>
          <Image source={{ uri: photoUri }} style={styles.preview} contentFit="contain" />
          <View style={styles.previewFooter}>
            <Text style={[styles.confirmTitle, { color: C.textPrimary }]}>Is the text clear?</Text>
            <Text style={{ color: C.textSecondary, textAlign: 'center', marginBottom: 24 }}>Make sure the medicine names and dosages are visible.</Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <PressableScale style={[styles.btnSec, { borderColor: C.border }]} onPress={() => setPhotoUri(null)}>
                <Text style={[styles.btnSecText, { color: C.textPrimary }]}>Retake</Text>
              </PressableScale>
              <PressableScale 
                style={[styles.btnPrimary, { backgroundColor: C.primaryBlue, flex: 1, marginTop: 0 }]} 
                onPress={() => router.push({ pathname: '/prescription-details', params: { imageUri: photoUri } })}
              >
                <Text style={styles.btnText}>Use Photo</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  permissionIcon: { width: 120, height: 120, borderRadius: 40, backgroundColor: 'rgba(59, 130, 246, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  sub: { textAlign: 'center', color: '#6B7280', marginTop: 12, lineHeight: 22 },
  btnPrimary: { marginTop: 32, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  camera: { flex: 1 },
  hudTop: { position: 'absolute', top: 60, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  hudBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  hudTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scannerWrapper: { position: 'absolute', top: '25%', alignSelf: 'center', width: width * 0.8, height: 260 },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 30, height: 30, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#fff', borderTopLeftRadius: 16 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 30, height: 30, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#fff', borderTopRightRadius: 16 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 30, height: 30, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#fff', borderBottomLeftRadius: 16 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#fff', borderBottomRightRadius: 16 },
  scanLine: { height: 20, width: '100%' },
  hudBottom: { position: 'absolute', bottom: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40 },
  shutterOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', padding: 4 },
  shutterInner: { flex: 1, borderRadius: 36, backgroundColor: '#fff' },
  galleryBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  preview: { width: '100%', flex: 1, backgroundColor: '#000' },
  previewFooter: { padding: 32, backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32 },
  confirmTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  btnSec: { flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  btnSecText: { fontWeight: '800', fontSize: 16 },
  backLink: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 4 }
});
