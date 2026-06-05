import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, Alert, ActivityIndicator } from 'react-native';
import { useCameraPermissions, CameraView } from 'expo-camera';
import { Image } from 'expo-image';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from '@/components/ui/PressableScale';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';


export default function ScanPrescription() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [isPdf, setIsPdf] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
        setFileName(asset.fileName || 'prescription.jpg');
        setIsPdf(false);
      }
    } catch (err) {
      console.warn('Failed to pick image from gallery:', err);
      Alert.alert('Error', 'Failed to pick image from gallery.');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
        setFileName(asset.name || 'prescription.pdf');
        const isPdfFile = asset.mimeType === 'application/pdf' || asset.name?.toLowerCase().endsWith('.pdf');
        setIsPdf(isPdfFile);
      }
    } catch (err) {
      console.warn('Failed to pick document:', err);
      Alert.alert('Error', 'Failed to pick document.');
    }
  };


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
  }, [photoUri, permission, scanAnim]);

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primaryBlue} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {!photoUri ? (
        <View style={{ flex: 1 }}>
          {permission.granted ? (
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
            </View>
          ) : (
            <View style={[styles.center, { backgroundColor: C.background }]}>
              <LinearGradient colors={[scheme === 'dark' ? '#111827' : '#F0F9FF', scheme === 'dark' ? '#1F2937' : '#E0F2FE']} style={StyleSheet.absoluteFill} />
              
              <View style={styles.hudTop}>
                <PressableScale onPress={() => router.back()} style={[styles.hudBtn, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                  <Ionicons name="close" size={28} color={C.textPrimary} />
                </PressableScale>
                <Text style={[styles.hudTitle, { color: C.textPrimary }]}>Prescription Scan</Text>
                <View style={{ width: 44 }} />
              </View>

              <View style={styles.permissionIcon}>
                <Ionicons name="camera-outline" size={60} color={C.primaryBlue} />
              </View>
              <Text style={[styles.title, { color: C.textPrimary }]}>Camera Access Disabled</Text>
              <Text style={[styles.sub, { color: C.textSecondary, marginBottom: 20 }]}>
                Allow camera access to scan prescriptions, or directly select files and screenshots below.
              </Text>
              <PressableScale style={[styles.btnPrimary, { backgroundColor: C.primaryBlue, marginTop: 10 }]} onPress={requestPermission}>
                <Text style={styles.btnText}>Enable Camera</Text>
              </PressableScale>
            </View>
          )}

          <View style={styles.hudBottom}>
            <PressableScale style={styles.galleryBtn} onPress={pickImage}>
              <Ionicons name="images-outline" size={24} color="#fff" />
            </PressableScale>

            <PressableScale
              style={[styles.shutterOuter, !permission.granted && { opacity: 0.3 }]}
              disabled={!permission.granted}
              onPress={async () => {
                if (!cameraRef.current) return;
                try {
                  const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
                  setPhotoUri(photo?.uri ?? null);
                  setFileName('captured_prescription.jpg');
                  setIsPdf(false);
                } catch (error) {
                  Alert.alert('Scan Error', 'Failed to capture prescription image. Please try again.');
                }
              }}
            >
              <View style={styles.shutterInner} />
            </PressableScale>

            <PressableScale style={styles.galleryBtn} onPress={pickDocument}>
              <Ionicons name="document-text-outline" size={24} color="#fff" />
            </PressableScale>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: C.background }}>
          {isPdf ? (
            <View style={[styles.pdfPreviewMain, { backgroundColor: C.background }]}>
              <View style={styles.pdfIconWrapper}>
                <Ionicons name="document-text" size={80} color={C.primaryBlue} />
              </View>
              <Text style={[styles.pdfFileNameText, { color: C.textPrimary }]} numberOfLines={2}>
                {fileName || 'prescription.pdf'}
              </Text>
              <Text style={[styles.pdfFileSub, { color: C.textSecondary }]}>
                PDF Document ready to upload
              </Text>
            </View>
          ) : (
            <Image source={{ uri: photoUri }} style={styles.preview} contentFit="contain" />
          )}

          <View style={[styles.previewFooter, { backgroundColor: C.cardWhite, borderTopColor: C.border }]}>
            <Text style={[styles.confirmTitle, { color: C.textPrimary }]}>
              {isPdf ? 'Use this document?' : 'Is the text clear?'}
            </Text>
            <Text style={[styles.confirmSub, { color: C.textSecondary }]}>
              {isPdf
                ? 'Make sure this PDF contains medicine names and doses.'
                : 'Make sure the medicine names and dosages are clearly visible.'}
            </Text>
            <View style={styles.previewActions}>
              <PressableScale
                style={[styles.btnSec, { borderColor: C.border, backgroundColor: scheme === 'dark' ? '#1F2937' : '#F9FAFB' }]}
                onPress={() => setPhotoUri(null)}
              >
                <Text style={[styles.btnSecText, { color: C.textPrimary }]}>
                  {isPdf ? 'Cancel' : 'Retake'}
                </Text>
              </PressableScale>
              <PressableScale
                style={[styles.btnPrimary, { backgroundColor: C.primaryBlue, flex: 1, marginTop: 0 }]}
                onPress={() => router.push({
                  pathname: '/prescription-details',
                  params: {
                    imageUri: photoUri,
                    fileName: fileName || (isPdf ? 'prescription.pdf' : 'prescription.jpg'),
                    isPdf: isPdf ? 'true' : 'false'
                  }
                })}
              >
                <Text style={styles.btnText}>{isPdf ? 'Use Document' : 'Use Photo'}</Text>
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
  btnPrimary: { marginTop: 32, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center', justifyContent: 'center' },
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
  previewFooter: { padding: 32, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, borderTopWidth: 1 },
  confirmTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  confirmSub: { textAlign: 'center', marginBottom: 24, lineHeight: 22, fontSize: 15 },
  previewActions: { flexDirection: 'row', gap: 16 },
  btnSec: { flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnSecText: { fontWeight: '800', fontSize: 16 },
  backLink: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 4 },
  pdfPreviewMain: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  pdfIconWrapper: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(59, 130, 246, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  pdfFileNameText: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginHorizontal: 20 },
  pdfFileSub: { fontSize: 14, marginTop: 8, textAlign: 'center' }
});
