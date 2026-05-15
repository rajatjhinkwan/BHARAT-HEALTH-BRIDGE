import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image as RNImage, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Radius, Shadow } from '@/constants/theme';
import { HOME_MOCK_DATA } from '@/constants/mockData';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from '@/components/ui/PressableScale';
import { useLocalSearchParams } from 'expo-router';

import { OCR_BASE_URL } from '@/constants/api';

export default function PrescriptionDetails() {
    const { imageUri } = useLocalSearchParams();
    const [loading, setLoading] = useState(!!imageUri);
    const [ocrData, setOcrData] = useState(null);
    const [error, setError] = useState(null);

    const scheme = useColorScheme() ?? 'light';
    const C = Colors[scheme];

    useEffect(() => {
        if (imageUri) {
            performOCR(imageUri);
        } else {
            // If no image is provided, we use the mock data as a fallback/demo
            setOcrData(HOME_MOCK_DATA.prescriptions);
            setLoading(false);
        }
    }, [imageUri]);

    const performOCR = async (uri) => {
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: uri,
                name: 'prescription.jpg',
                type: 'image/jpeg',
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30s

            const response = await fetch(`${OCR_BASE_URL}/ocr`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Server responded with an error');

            const result = await response.json();
            if (result.status === 'success') {
                const medicines = result.data;
                const firstMed = (Array.isArray(medicines) ? medicines[0] : medicines) || {};
                
                setOcrData({
                    branded: {
                        name: firstMed.medicine || "Prescribed Medicine",
                        price: "₹---",
                        company: "Detected"
                    },
                    generic: {
                        name: firstMed.generic_equivalent || "Searching...",
                        price: "₹---"
                    },
                    savings: "Calculating...",
                    details: `Prescribed Dosage: ${firstMed.dosage || 'As per advice'}. Frequency: ${firstMed.frequency || 'N/A'}. Duration: ${firstMed.duration || 'As directed'}.`
                });
            } else {
                setError('Failed to process prescription image.');
                setOcrData(HOME_MOCK_DATA.prescriptions);
            }
        } catch (e) {
            console.error('OCR Error:', e);
            if (e.name === 'AbortError') {
                setError('Request timed out. The AI model is taking longer than expected. Using demo data.');
            } else {
                setError(`Network Error: ${e.message}. Using demo data.`);
            }
            setOcrData(HOME_MOCK_DATA.prescriptions);
        } finally {
            setLoading(false);
        }
    };

    const fallbackData = {
        branded: { name: 'Demo Medicine', price: '₹450', company: 'Cipla' },
        generic: { name: 'Paracetamol Generic', price: '₹35' },
        savings: '₹415',
        details: 'Showing demo data because processing failed or is taking too long.'
    };

    const p = {
        branded: ocrData?.branded || HOME_MOCK_DATA.prescriptions?.branded || fallbackData.branded,
        generic: ocrData?.generic || HOME_MOCK_DATA.prescriptions?.generic || fallbackData.generic,
        savings: ocrData?.savings || HOME_MOCK_DATA.prescriptions?.savings || fallbackData.savings,
        details: ocrData?.details || HOME_MOCK_DATA.prescriptions?.details || fallbackData.details
    };

    if (loading) {
        return (
            <ScreenWrapper>
                <AppHeader title="Analyzing..." showBack={true} />
                <View style={[styles.center, { backgroundColor: C.background }]}>
                    <ActivityIndicator size="large" color={C.primaryBlue} />
                    <Text style={[styles.loadingText, { color: C.textPrimary }]}>Processing your prescription...</Text>
                    <Text style={styles.loadingSub}>This might take a few moments as we identify medicines and find generic alternatives.</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <AppHeader title="Prescription Analysis" showBell bellBadge={3} showBack={true} />

            <View style={styles.container}>
                {error && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="warning" size={20} color="#EF4444" />
                        <Text style={styles.errorText}>{error} (Showing Demo Data)</Text>
                    </View>
                )}

                <View style={styles.topBar}>
                    <View style={[styles.tag, { backgroundColor: '#10B98120' }]}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 11 }}>MEDICINE IDENTIFIED</Text>
                    </View>
                </View>

                {imageUri && (
                    <View style={styles.previewContainer}>
                        <RNImage source={{ uri: imageUri }} style={styles.prescriptionPreview} resizeMode="cover" />
                        <View style={styles.previewOverlay}>
                            <Text style={styles.previewTag}>Captured Prescription</Text>
                        </View>
                    </View>
                )}

                <View style={styles.comparisonGrid}>
                    <View style={[styles.medCard, { borderColor: C.border, backgroundColor: C.cardWhite }]}>
                        <Text style={styles.cardLabel}>BRANDED PRESCRIBED</Text>
                        <Text style={[styles.medName, { color: C.textPrimary }]}>{p.branded.name}</Text>
                        <Text style={styles.price}>{p.branded.price}</Text>
                        <Text style={styles.company}>{p.branded.company} Pharmaceuticals</Text>
                    </View>

                    <View style={styles.vsCircle}><Text style={styles.vsText}>VS</Text></View>

                    <View style={[styles.medCard, { borderColor: '#10B981', backgroundColor: '#F0FDF4', borderWidth: 2 }]}>
                        <Text style={[styles.cardLabel, { color: '#10B981' }]}>GENERIC EQUIVALENT</Text>
                        <Text style={[styles.medName, { color: '#111827' }]}>{p.generic.name}</Text>
                        <Text style={[styles.price, { color: '#10B981' }]}>{p.generic.price}</Text>
                        <Text style={[styles.company, { color: '#166534' }]}>PMB-JP Gov. Generic</Text>
                    </View>
                </View>


                <PressableScale>
                    <LinearGradient
                        colors={['#111827', '#1F2937']}
                        style={styles.savingsCard}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.savingsIcon}><Ionicons name="sparkles" size={24} color="#F59E0B" /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.savingsLabel}>Estimated Savings</Text>
                            <Text style={styles.savingsValue}>Save {p.savings} per strip</Text>
                        </View>
                        <View style={styles.badge}><Text style={styles.badgeText}>SMART</Text></View>
                    </LinearGradient>
                </PressableScale>

                <View style={styles.detailsBox}>
                    <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Why choose generic?</Text>
                    <Text style={[styles.detailsText, { color: C.textSecondary }]}>{p.details}</Text>
                </View>

                <PressableScale style={[styles.findBtn, { backgroundColor: C.primaryBlue }]}>
                    <Text style={styles.findBtnText}>Find Nearest Generic Store</Text>
                    <Ionicons name="location" size={20} color="#fff" />
                </PressableScale>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20 },
    topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 0 },
    h1: { fontSize: 24, fontWeight: '800' },
    tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    comparisonGrid: { gap: 16, marginBottom: 24 },
    medCard: { padding: 16, borderRadius: 24, borderWidth: 1, position: 'relative' },
    cardLabel: { fontSize: 10, fontWeight: '800', color: '#6B7280', letterSpacing: 1 },
    medName: { fontSize: 20, fontWeight: '800', marginTop: 8 },
    price: { fontSize: 16, fontWeight: '700', marginTop: 4 },
    company: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    vsCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', zIndex: 1, marginVertical: -16 },
    vsText: { color: '#fff', fontSize: 10, fontWeight: '900' },
    savingsCard: { padding: 20, borderRadius: 28, flexDirection: 'row', alignItems: 'center', gap: 16, ...Shadow.lg },
    savingsIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,158,11,0.2)', alignItems: 'center', justifyContent: 'center' },
    savingsLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
    savingsValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
    badge: { backgroundColor: '#3B82F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
    detailsBox: { marginTop: 32, gap: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800' },
    detailsText: { fontSize: 15, lineHeight: 22 },
    findBtn: { marginTop: 40, height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 40 },
    findBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: { fontSize: 20, fontWeight: '800', marginTop: 24, textAlign: 'center' },
    loadingSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 12, lineHeight: 20 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
    errorText: { color: '#B91C1C', fontSize: 12, fontWeight: '600' },
    previewContainer: { height: 180, borderRadius: 24, overflow: 'hidden', marginBottom: 24, position: 'relative' },
    prescriptionPreview: { width: '100%', height: '100%' },
    previewOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.5)' },
    previewTag: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
});
