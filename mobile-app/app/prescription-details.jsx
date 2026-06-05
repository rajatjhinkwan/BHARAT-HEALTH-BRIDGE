import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image as RNImage, Platform, ScrollView } from 'react-native';
import { lookupMedicine, saveScannedPrescription } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Radius, Shadow , Colors } from '@/constants/theme';
import { HOME_MOCK_DATA } from '@/constants/mockData';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from '@/components/ui/PressableScale';
import { useLocalSearchParams } from 'expo-router';

import { scanPrescription } from '@/lib/ocr';

export default function PrescriptionDetails() {
    const { imageUri, fileName, isPdf } = useLocalSearchParams();
    const isPdfBool = isPdf === 'true';
    const [loading, setLoading] = useState(!!imageUri);
    const [ocrData, setOcrData] = useState(null);
    const [scanSource, setScanSource] = useState(null);
    const [savedToVault, setSavedToVault] = useState(false);
    const { patientProfileId, user } = useAuth();
    const pId = patientProfileId || user?.patientProfileId;

    const scheme = useColorScheme() ?? 'light';
    const C = Colors[scheme];

    useEffect(() => {
        if (imageUri) {
            performOCR(imageUri, fileName, isPdfBool);
        } else {
            // If no image is provided, we use the mock data as a fallback/demo
            setOcrData(HOME_MOCK_DATA.prescriptions);
            setLoading(false);
        }
    }, [imageUri, fileName, isPdf]);

    const mapMedicineToComparison = async (med) => {
        if (med.branded && med.generic) {
            return med;
        }

        const nameToLookup = med.medicine || med.name || 'Prescribed Medicine';
        try {
            const lookupResult = await lookupMedicine(nameToLookup);
            if (lookupResult?.found) {
                return {
                    branded: lookupResult.branded,
                    generic: lookupResult.generic,
                    savings: lookupResult.savings,
                    details: lookupResult.details,
                    dosage: med.dosage || 'As prescribed',
                    frequency: med.frequency || 'As directed',
                    duration: med.duration || 'As directed',
                };
            }
        } catch (err) {
            console.warn(`Lookup failed for ${nameToLookup}:`, err);
        }

        const brandedPrice = 50.0;
        const genericPrice = 12.5;
        const savingsAmt = brandedPrice - genericPrice;
        return {
            branded: { name: nameToLookup, price: `₹${brandedPrice.toFixed(2)}`, company: 'Prescribed Brand' },
            generic: { name: med.generic_equivalent || `Generic ${nameToLookup}`, price: `₹${genericPrice.toFixed(2)}` },
            savings: `₹${savingsAmt.toFixed(2)}`,
            details: `Dosage: ${med.dosage || 'As prescribed'} · Frequency: ${med.frequency || 'As directed'} · Duration: ${med.duration || 'As directed'}.`,
            dosage: med.dosage || 'As prescribed',
            frequency: med.frequency || 'As directed',
            duration: med.duration || 'As directed',
        };
    };

    const performOCR = async (uri, nameParam, isPdfParam) => {
        setLoading(true);
        setScanSource(null);

        try {
            const { medicines, source } = await scanPrescription(uri, nameParam, isPdfParam);
            setScanSource(source);

            const comparisonList = await Promise.all(medicines.map(mapMedicineToComparison));
            setOcrData(comparisonList);

            if (pId) {
                try {
                    await saveScannedPrescription(pId, comparisonList, uri);
                    setSavedToVault(true);
                } catch (saveErr) {
                    console.warn('Could not save scan to vault:', saveErr);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const fallbackData = {
        branded: { name: 'Demo Medicine', price: '₹450.00', company: 'Cipla' },
        generic: { name: 'Paracetamol Generic', price: '₹35.00' },
        savings: '₹415.00',
        details: 'Showing demo data because processing failed or is taking too long.'
    };

    const comparisonItems = Array.isArray(ocrData)
        ? ocrData
        : (ocrData && typeof ocrData === 'object' && ocrData.branded
            ? [ocrData]
            : (HOME_MOCK_DATA.prescriptions
                ? (Array.isArray(HOME_MOCK_DATA.prescriptions) ? HOME_MOCK_DATA.prescriptions : [HOME_MOCK_DATA.prescriptions])
                : [fallbackData]));

    const totalSavings = comparisonItems.reduce((acc, item) => {
        const valStr = String(item.savings || '0').replace(/[^0-9.]/g, '');
        const val = parseFloat(valStr) || 0;
        return acc + val;
    }, 0);


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

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
                <View style={styles.topBar}>
                    <View style={[styles.tag, { backgroundColor: '#10B98120' }]}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 11 }}>
                            {comparisonItems.length > 1 ? `${comparisonItems.length} MEDICINES IDENTIFIED` : 'MEDICINE IDENTIFIED'}
                        </Text>
                    </View>
                    {scanSource === 'offline' && (
                        <View style={[styles.tag, { backgroundColor: '#8B5CF620', marginLeft: 8 }]}>
                            <Ionicons name="sparkles" size={14} color="#8B5CF6" />
                            <Text style={{ color: '#8B5CF6', fontWeight: '800', fontSize: 11 }}>SMART MATCH</Text>
                        </View>
                    )}
                    {savedToVault && (
                        <View style={[styles.tag, { backgroundColor: '#3B82F620', marginLeft: 8 }]}>
                            <Ionicons name="cloud-done" size={14} color="#3B82F6" />
                            <Text style={{ color: '#3B82F6', fontWeight: '800', fontSize: 11 }}>SAVED TO VAULT</Text>
                        </View>
                    )}
                </View>

                {imageUri && (
                    <View style={styles.previewContainer}>
                        {isPdfBool ? (
                            <View style={[styles.pdfPreviewBox, { backgroundColor: scheme === 'dark' ? '#1F2937' : '#F3F4F6' }]}>
                                <Ionicons name="document-text" size={48} color={C.primaryBlue} />
                                <View style={{ marginLeft: 16, flex: 1 }}>
                                    <Text style={[styles.pdfFileName, { color: C.textPrimary }]} numberOfLines={1}>
                                        {fileName || 'prescription.pdf'}
                                    </Text>
                                    <Text style={{ color: C.textSecondary, fontSize: 12 }}>Digital PDF Prescription</Text>
                                </View>
                            </View>
                        ) : (
                            <RNImage source={{ uri: imageUri }} style={styles.prescriptionPreview} resizeMode="cover" />
                        )}
                        <View style={styles.previewOverlay}>
                            <Text style={styles.previewTag}>{isPdfBool ? 'Uploaded Document' : 'Captured Prescription'}</Text>
                        </View>
                    </View>
                )}

                <Text style={[styles.sectionTitle, { color: C.textPrimary, marginBottom: 12 }]}>Medicine Equivalents</Text>

                {comparisonItems.map((item, idx) => (
                    <View key={idx} style={[styles.comparisonGrid, { marginBottom: 24 }]}>
                        <View style={[styles.medCard, { borderColor: C.border, backgroundColor: C.cardWhite }]}>
                            <Text style={styles.cardLabel}>BRANDED PRESCRIBED</Text>
                            <Text style={[styles.medName, { color: C.textPrimary, fontSize: 18 }]}>{item.branded?.name || 'Prescribed'}</Text>
                            {(item.dosage || item.frequency || item.duration) && (
                                <View style={[styles.doseRow, { backgroundColor: scheme === 'dark' ? '#1F2937' : '#F3F4F6' }]}>
                                    {item.dosage ? (
                                        <View style={styles.doseChip}>
                                            <Text style={[styles.doseLabel, { color: C.textSecondary }]}>Dose</Text>
                                            <Text style={[styles.doseValue, { color: C.textPrimary }]}>{item.dosage}</Text>
                                        </View>
                                    ) : null}
                                    {item.frequency ? (
                                        <View style={styles.doseChip}>
                                            <Text style={[styles.doseLabel, { color: C.textSecondary }]}>Freq</Text>
                                            <Text style={[styles.doseValue, { color: C.textPrimary }]}>{item.frequency}</Text>
                                        </View>
                                    ) : null}
                                    {item.duration ? (
                                        <View style={styles.doseChip}>
                                            <Text style={[styles.doseLabel, { color: C.textSecondary }]}>Duration</Text>
                                            <Text style={[styles.doseValue, { color: C.textPrimary }]}>{item.duration}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            )}
                            <Text style={styles.price}>{item.branded?.price || '₹---'}</Text>
                            <Text style={styles.company}>{item.branded?.company || 'Detected'}</Text>
                        </View>

                        <View style={styles.vsCircle}><Text style={styles.vsText}>VS</Text></View>

                        <View style={[styles.medCard, { borderColor: '#10B981', backgroundColor: scheme === 'dark' ? '#0F1F15' : '#F0FDF4', borderWidth: 2 }]}>
                            <Text style={[styles.cardLabel, { color: '#10B981' }]}>GENERIC EQUIVALENT</Text>
                            <Text style={[styles.medName, { color: C.textPrimary, fontSize: 18 }]}>{item.generic?.name || 'Alternative'}</Text>
                            <Text style={[styles.price, { color: '#10B981' }]}>{item.generic?.price || '₹---'}</Text>
                            <Text style={[styles.company, { color: '#166534' }]}>PMB-JP Gov. Generic</Text>
                        </View>
                        
                        <View style={[styles.detailsBox, { marginTop: 8, padding: 12, backgroundColor: scheme === 'dark' ? '#1F2937' : '#F9FAFB', borderRadius: 16 }]}>
                            <Text style={[styles.detailsText, { color: C.textSecondary, fontSize: 13, lineHeight: 18 }]}>
                                {item.details}
                            </Text>
                        </View>
                    </View>
                ))}

                <PressableScale>
                    <LinearGradient
                        colors={['#111827', '#1F2937']}
                        style={styles.savingsCard}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.savingsIcon}><Ionicons name="sparkles" size={24} color="#F59E0B" /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.savingsLabel}>Total Estimated Savings</Text>
                            <Text style={styles.savingsValue}>Save ₹{totalSavings.toFixed(2)} total</Text>
                        </View>
                        <View style={styles.badge}><Text style={styles.badgeText}>SMART</Text></View>
                    </LinearGradient>
                </PressableScale>

                <View style={[styles.detailsBox, { marginTop: 24, gap: 8 }]}>
                    <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Why Choose Generics?</Text>
                    <Text style={[styles.detailsText, { color: C.textSecondary, fontSize: 14, lineHeight: 20 }]}>
                        Generic drugs are copies of brand-name drugs that have exactly the same dosage, intended use, effects, side effects, route of administration, risks, safety, and strength. They are significantly cheaper (often 70-90% less) because they do not repeat expensive clinical trials or marketing campaigns.
                    </Text>
                </View>

                <PressableScale style={[styles.findBtn, { backgroundColor: C.primaryBlue }]}>
                    <Text style={styles.findBtnText}>Find Nearest Generic Store</Text>
                    <Ionicons name="location" size={20} color="#fff" />
                </PressableScale>
            </ScrollView>

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
    doseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, padding: 10, borderRadius: 12 },
    doseChip: { minWidth: 72 },
    doseLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    doseValue: { fontSize: 13, fontWeight: '800', marginTop: 2 },
    previewContainer: { height: 180, borderRadius: 24, overflow: 'hidden', marginBottom: 24, position: 'relative' },
    prescriptionPreview: { width: '100%', height: '100%' },
    previewOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.5)' },
    previewTag: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
    pdfPreviewBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        height: '100%',
        width: '100%',
    },
    pdfFileName: {
        fontSize: 16,
        fontWeight: '700',
    },
});
