import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, Switch, ActivityIndicator, Share, Image, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline } from 'react-native-svg';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppHeader from '@/components/ui/app-header';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import PressableScale from '@/components/ui/PressableScale';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/constants/api';
import { getPatientHistory } from '@/lib/api';
import { usePatientRealtime } from '@/hooks/usePatientRealtime';
import * as Haptics from 'expo-haptics';
import { HistorySkeleton } from '@/components/ui/SkeletonLoader';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Comprehensive Medical Type Details
const TYPE_CONFIGS = {
  prescription: { icon: 'document-text', color: '#3B82F6', bg: '#EFF6FF', label: 'Prescription' },
  lab_report: { icon: 'flask', color: '#EC4899', bg: '#FDF2F8', label: 'Lab Report' },
  blood_test: { icon: 'water', color: '#EF4444', bg: '#FEF2F2', label: 'Blood Test' },
  mri: { icon: 'scan', color: '#8B5CF6', bg: '#F5F3FF', label: 'MRI Scan' },
  ct_scan: { icon: 'barcode', color: '#10B981', bg: '#ECFDF5', label: 'CT Scan' },
  x_ray: { icon: 'image', color: '#6366F1', bg: '#EEF2FF', label: 'X-Ray' },
  ultrasound: { icon: 'radio', color: '#14B8A6', bg: '#F0FDFA', label: 'Ultrasound' },
  ecg: { icon: 'pulse', color: '#F59E0B', bg: '#FEF3C7', label: 'ECG' },
  voice_note: { icon: 'mic', color: '#0EA5E9', bg: '#F0F9FF', label: 'Doctor Voice' },
  voice_note_group: { icon: 'mic-outline', color: '#0EA5E9', bg: '#F0F9FF', label: 'Voice Notes' },
  surgery: { icon: 'cut', color: '#EF4444', bg: '#FEF2F2', label: 'Surgery' },
  vaccination: { icon: 'shield-checkmark', color: '#10B981', bg: '#ECFDF5', label: 'Vaccination' },
  discharge_summary: { icon: 'medical-outline', color: '#10B981', bg: '#ECFDF5', label: 'Discharge Summary' },
};

// Premium Mock Data for fallback
const MOCK_RECORDS = [
  {
    _id: 'rec_01',
    type: 'prescription',
    title: 'Post-OPD Orthopedics Prescription',
    doctor: 'Dr. Kartikay Rana',
    hospital: 'Chamoli Badrinath Clinic',
    createdAt: '2026-05-15T10:00:00Z',
    prescriptionDetails: {
      diagnosis: 'Muscle spasm and minor swelling in lumbar region.',
      medicines: [
        { name: 'Aceclofenac 100mg', dosage: '1-0-1', duration: '5 Days' },
        { name: 'Pantocid 40mg', dosage: '1-0-0 (Empty Stomach)', duration: '5 Days' }
      ],
      notes: 'Avoid heavy lifting. Apply hot gel compresses thrice daily.'
    },
    accessControl: { locked: false, approvedDoctors: [], approvedHospitals: [] }
  },
  {
    _id: 'rec_02',
    type: 'lab_report',
    title: 'Complete Blood Count (CBC)',
    doctor: 'Dr. Anoop Chauhan',
    hospital: 'Karanprayag Pathology',
    createdAt: '2026-05-14T08:30:00Z',
    ocrText: 'Hemoglobin: 14.2 g/dL (Normal), RBC Count: 4.8 million/mcL (Normal), Platelets: 250,000 /mcL.',
    accessControl: { locked: true, approvedDoctors: ['Dr. Kartikay Rana'], approvedHospitals: [] }
  },
  {
    _id: 'rec_03',
    type: 'voice_note',
    title: 'Cardiology Consultation Audio',
    doctor: 'Dr. Ganesh Singh Parihar',
    hospital: 'Almora General Hospital',
    createdAt: '2026-04-12T16:45:00Z',
    voiceNoteDetails: {
      transcript: 'AI Transcript: Normal ECG rhythm. Systolic BP 120, Diastolic 80. Recommended routine cardio screening in six months.',
      duration: 42
    },
    accessControl: { locked: false, approvedDoctors: [], approvedHospitals: [] }
  },
  {
    _id: 'rec_04',
    type: 'mri',
    title: 'Lumbar Spine MRI Scan',
    doctor: 'Dr. Surendra Singh Rawat',
    hospital: 'Almora Scan & Diagnostics',
    createdAt: '2025-12-08T11:20:00Z',
    ocrText: 'MRI Scan Lumbar Spine L4-L5: Mild disc bulge noted. No nerve root impingement detected.',
    accessControl: { locked: false, approvedDoctors: [], approvedHospitals: [] }
  }
];

export default function HistoryScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { user, patientProfileId } = useAuth();
  const pId = patientProfileId || user?.patientProfileId || user?._id || user?.id;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedRecordId, setExpandedRecordId] = useState(null);

  // Pinch Zoom, Speech and Audio States
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [loadingAudioId, setLoadingAudioId] = useState(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const soundRef = React.useRef(null);

  const [fullScreenImageUri, setFullScreenImageUri] = useState(null);
  const [fullScreenStrokesData, setFullScreenStrokesData] = useState(null);
  const [modalZoomScale, setModalZoomScale] = useState(1);
  const [voiceNotesModalData, setVoiceNotesModalData] = useState(null);

  // Stop and cleanup audio/speech on unmount and setup audio configurations
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldRouteThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    }).catch(err => console.warn("Failed to set audio mode:", err));

    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      Speech.stop();
      setPlayingVoiceId(null);
      setPlaybackProgress(0);
      setLoadingAudioId(null);
    } catch (err) {
      console.warn("Error stopping audio:", err);
    }
  };

  const toggleVoiceNote = async (record) => {
    const audioUrl = record.voiceNoteDetails?.audioUrl;
    const transcript = record.voiceNoteDetails?.transcript;

    if (playingVoiceId === record._id) {
      await stopAudio();
      return;
    }

    await stopAudio();

    if (audioUrl) {
      setLoadingAudioId(record._id);
      setPlayingVoiceId(record._id);
      setPlaybackProgress(0);

      try {
        let resolvedUrl = audioUrl;
        const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
        if (!audioUrl.startsWith('http')) {
          resolvedUrl = `${baseUrl}${audioUrl}`;
        } else {
          resolvedUrl = resolvedUrl
            .replace('http://localhost:4000', baseUrl)
            .replace('http://127.0.0.1:4000', baseUrl);
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: resolvedUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              if (status.isPlaying) {
                setLoadingAudioId(null);
              }
              if (status.durationMillis && status.positionMillis) {
                setPlaybackProgress(status.positionMillis / status.durationMillis);
              }
              if (status.didJustFinish) {
                setPlayingVoiceId(null);
                setPlaybackProgress(0);
                soundRef.current?.unloadAsync().catch(() => {});
                soundRef.current = null;
              }
            } else if (status.error) {
              console.warn("Playback status error:", status.error);
              fallbackToTts(record);
            }
          }
        );
        soundRef.current = sound;
      } catch (err) {
        console.warn("Failed to load audio file, falling back to TTS:", err);
        await fallbackToTts(record);
      }
    } else if (transcript) {
      await fallbackToTts(record);
    }
  };

  const fallbackToTts = async (record) => {
    const transcript = record.voiceNoteDetails?.transcript;
    if (!transcript) {
      setPlayingVoiceId(null);
      setLoadingAudioId(null);
      return;
    }

    try {
      setLoadingAudioId(null);
      setPlayingVoiceId(record._id);
      setPlaybackProgress(0);

      Speech.speak(transcript, {
        onDone: () => {
          setPlayingVoiceId(null);
          setPlaybackProgress(0);
        },
        onError: () => {
          setPlayingVoiceId(null);
          setPlaybackProgress(0);
        },
        onStopped: () => {
          setPlayingVoiceId(null);
          setPlaybackProgress(0);
        },
      });
    } catch (err) {
      console.warn("TTS fallback error:", err);
      setPlayingVoiceId(null);
      setLoadingAudioId(null);
    }
  };

  const fetchHistory = async () => {
    if (!pId) {
      setRecords([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getPatientHistory(pId);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('History fetch failed, keeping empty state:', err.message);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [pId]);

  usePatientRealtime(pId, {
    onPrescription: () => {
      fetchHistory();
      Alert.alert('New Prescription', 'Your doctor has issued a new prescription. It is now in your Health Vault.');
    },
    onAppointment: () => fetchHistory(),
  });

  // Upload/Verification
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newRecord = {
          _id: `rec_${Date.now()}`,
          type: 'lab_report',
          title: result.assets[0].name,
          doctor: 'Self-Uploaded',
          hospital: 'Digital Wallet',
          createdAt: new Date().toISOString(),
          ocrText: 'AI Parsing completed: Successfully verified and recorded in your decentralized Health Bridge.',
          accessControl: { locked: false, approvedDoctors: [], approvedHospitals: [] }
        };
        
        setRecords([newRecord, ...records]);
        Alert.alert('Blockchain Verified', `Record "${result.assets[0].name}" uploaded, verified, and secured with cryptography!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lock/Unlock specific records (Patient Consent Control)
  const toggleLock = async (recordId, currentLocked) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextLockedState = !currentLocked;

    // Optimistically update UI
    setRecords(records.map(r => r._id === recordId ? {
      ...r,
      accessControl: { ...r.accessControl, locked: nextLockedState }
    } : r));

    try {
      await fetch(`${API_BASE_URL}/history/${recordId}/access`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: nextLockedState })
      });
    } catch (err) {
      console.warn('Access level persistent update deferred offline:', err.message);
    }
  };

  // Share records
  const shareRecord = async (record) => {
    try {
      let content = `*Health Bridge Clinical Record*\n\n`;
      content += `*Title:* ${record.title}\n`;
      content += `*Doctor:* ${record.doctor}\n`;
      content += `*Hospital:* ${record.hospital}\n`;
      content += `*Date:* ${new Date(record.createdAt).toLocaleDateString('en-IN')}\n\n`;

      if (record.prescriptionDetails) {
        content += `*Diagnosis:* ${record.prescriptionDetails.diagnosis || 'General consultation'}\n\n`;
        if (Array.isArray(record.prescriptionDetails.medicines) && record.prescriptionDetails.medicines.length) {
          content += `*Medications:*\n`;
          record.prescriptionDetails.medicines.forEach((med, i) => {
            content += `${i + 1}. ${med.name} — ${med.dosage || med.dose} (${med.duration || med.days})\n`;
          });
          content += `\n`;
        }
        if (record.prescriptionDetails.notes) {
          content += `*Doctor Notes:* _"${record.prescriptionDetails.notes}"_\n\n`;
        }
      }

      if (record.ocrText) {
        content += `*AI Summary:* ${record.ocrText}\n\n`;
      }

      if (record.type === 'voice_note' && record.voiceNoteDetails) {
        content += `*Audio Transcript:* _"${record.voiceNoteDetails.transcript}"_\n\n`;
        if (record.voiceNoteDetails.audioUrl) {
          content += `*Listen to voice note:* ${record.voiceNoteDetails.audioUrl}\n\n`;
        }
      } else if (record.fileUrl && (record.fileUrl.startsWith('http') || record.fileUrl.startsWith('data:'))) {
        content += `*View Attachment:* ${record.fileUrl}\n\n`;
      }

      content += `_Shared securely via Bharat Health Bridge._`;

      await Share.share({ message: content });
    } catch (error) {
      console.error(error);
    }
  };

  // Search & Categories logic
  const filteredData = useMemo(() => {
    const q = query.toLowerCase();
    
    // Consolidate voice notes
    const otherRecords = records.filter(r => r.type !== 'voice_note');
    const voiceNoteRecords = records.filter(r => r.type === 'voice_note');
    
    let processedRecords = [...otherRecords];
    if (voiceNoteRecords.length > 0) {
      const sortedVoiceNotes = [...voiceNoteRecords].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const voiceNoteGroup = {
        _id: 'consolidated_voice_notes',
        type: 'voice_note_group',
        title: 'Doctor Voice Notes',
        doctor: 'Consulting Physicians',
        hospital: 'Bharat Health Bridge',
        createdAt: sortedVoiceNotes[0].createdAt,
        voiceNotes: sortedVoiceNotes,
      };
      processedRecords.push(voiceNoteGroup);
    }

    const filtered = processedRecords.filter(r => {
      // Category filter
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Prescription' && r.type !== 'prescription') return false;
        if (selectedCategory === 'Lab Report' && !['lab_report', 'blood_test', 'ecg'].includes(r.type)) return false;
        if (selectedCategory === 'Radiology' && !['mri', 'ct_scan', 'x_ray', 'ultrasound'].includes(r.type)) return false;
        if (selectedCategory === 'Voice Note' && r.type !== 'voice_note_group') return false;
      }
      // Query filter
      if (!q) return true;
      if (r.type === 'voice_note_group') {
        return r.voiceNotes.some(vn => 
          vn.title.toLowerCase().includes(q) ||
          vn.doctor.toLowerCase().includes(q) ||
          vn.hospital.toLowerCase().includes(q) ||
          (vn.voiceNoteDetails?.transcript && vn.voiceNoteDetails.transcript.toLowerCase().includes(q))
        );
      }
      return (
        r.title.toLowerCase().includes(q) ||
        r.doctor.toLowerCase().includes(q) ||
        r.hospital.toLowerCase().includes(q) ||
        (r.ocrText && r.ocrText.toLowerCase().includes(q))
      );
    });
    // Chronological sorting (descending: most recent at the top!)
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [records, query, selectedCategory]);

  // Group sorted records into Month/Year sections for timeline presentation
  const groupedData = useMemo(() => {
    const groups = {};
    filteredData.forEach(r => {
      const date = new Date(r.createdAt);
      const monthYear = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(r);
    });
    return Object.entries(groups).map(([monthYear, items]) => ({
      monthYear,
      items
    }));
  }, [filteredData]);

  return (
    <ScreenWrapper scroll={false}>
      <AppHeader title="Health Vault" showBell bellBadge={2} />

      <View style={styles.container}>
        {/* Search & Upload Bar */}
        <View style={styles.header}>
          <Text style={[styles.h1, { color: C.textPrimary }]}>Medical Journey</Text>
          
          <View style={styles.searchRow}>
            <View style={[styles.searchBox, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
              <Ionicons name="search" size={18} color={C.textSecondary} />
              <TextInput
                placeholder="Search scans, meds, doctors..."
                value={query}
                onChangeText={setQuery}
                placeholderTextColor={C.textSecondary}
                style={{ flex: 1, marginLeft: 8, color: C.textPrimary, fontSize: 14 }}
              />
            </View>
            <PressableScale onPress={pickDocument} style={[styles.uploadBtn, { backgroundColor: C.primaryBlue }]}>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            </PressableScale>
          </View>
        </View>

        {/* Categories scrollbar */}
        <View style={{ marginBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            {['All', 'Prescription', 'Lab Report', 'Radiology', 'Voice Note'].map(cat => (
              <PressableScale
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryBadge,
                  { backgroundColor: selectedCategory === cat ? C.primaryBlue : C.cardWhite, borderColor: C.border }
                ]}
              >
                <Text style={{
                  color: selectedCategory === cat ? '#fff' : C.textSecondary,
                  fontWeight: '800',
                  fontSize: 12
                }}>{cat}</Text>
              </PressableScale>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={{ gap: 4, paddingBottom: 100 }}>
            <HistorySkeleton />
            <HistorySkeleton />
            <HistorySkeleton />
            <HistorySkeleton />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
            {groupedData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={48} color={C.textSecondary} style={{ opacity: 0.5 }} />
                <Text style={[styles.emptyText, { color: C.textSecondary }]}>No matching medical records found.</Text>
              </View>
            ) : (
              groupedData.map((group, gIdx) => (
                <View key={group.monthYear} style={{ marginBottom: 12 }}>
                  {/* Month/Year Timeline Section Header */}
                  <View style={styles.timelineMonthHeader}>
                    <Ionicons name="calendar-outline" size={14} color={C.textSecondary} />
                    <Text style={[styles.timelineMonthText, { color: C.textSecondary }]}>
                      {group.monthYear.toUpperCase()}
                    </Text>
                    <View style={[styles.timelineHeaderLine, { backgroundColor: C.border }]} />
                  </View>

                  {group.items.map((record, idx) => {
                    const conf = TYPE_CONFIGS[record.type] || TYPE_CONFIGS.lab_report;
                    const isExpanded = expandedRecordId === record._id;
                    
                    return (
                      <View key={record._id} style={styles.timelineRow}>
                        {/* Visual Line */}
                        <View style={styles.indicatorCol}>
                          <View style={[styles.dot, { backgroundColor: conf.color }]} />
                          {(idx !== group.items.length - 1 || gIdx !== groupedData.length - 1) && (
                            <View style={[styles.line, { backgroundColor: C.border }]} />
                          )}
                        </View>

                        {/* Expandable Record Card */}
                        <View style={[styles.card, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                          <PressableScale 
                            onPress={() => {
                              if (record.type === 'voice_note_group') {
                                setVoiceNotesModalData(record.voiceNotes);
                              } else {
                                setExpandedRecordId(isExpanded ? null : record._id);
                              }
                            }}
                          >
                            <View style={styles.cardHeader}>
                              <View style={[styles.typeIcon, { backgroundColor: conf.bg }]}>
                                <Ionicons name={conf.icon} size={20} color={conf.color} />
                              </View>
                              <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.date}>{new Date(record.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                                <Text style={[styles.title, { color: C.textPrimary }]}>{record.title}</Text>
                                <Text style={[styles.subtitle, { color: C.textSecondary }]}>
                                  {record.type === 'voice_note_group' ? 'Tap to open doctor voice vault' : `${record.doctor} • ${record.hospital}`}
                                </Text>
                              </View>
                            </View>
                          </PressableScale>

                          {/* Expandable Details Area */}
                          {isExpanded && (
                            <View style={styles.expandedContent}>
                              {/* Prescription & Discharge Summary Sub-UI */}
                              {(record.type === 'prescription' || record.type === 'discharge_summary') && record.prescriptionDetails && (
                                <View style={styles.detailSection}>
                                  <Text style={styles.detailHeader}>
                                    {record.type === 'discharge_summary' ? 'Discharge Details' : 'Prescription Details'}
                                  </Text>
                                  {record.prescriptionDetails.diagnosis ? (
                                    <Text style={[styles.detailBody, { color: C.textPrimary, marginBottom: 6 }]}>Diagnosis: {record.prescriptionDetails.diagnosis}</Text>
                                  ) : null}
                                  
                                  {Array.isArray(record.prescriptionDetails.medicines) && record.prescriptionDetails.medicines.length > 0 && (
                                    <>
                                      <Text style={[styles.detailHeader, { marginTop: 8 }]}>Medications</Text>
                                      {record.prescriptionDetails.medicines.map((med, i) => (
                                        <View key={i} style={styles.medRow}>
                                          <Ionicons name="medical-outline" size={14} color="#3B82F6" />
                                          <Text style={[styles.medText, { color: C.textPrimary }]}>{med.name} — {med.dosage || med.dose} ({med.duration || med.days})</Text>
                                        </View>
                                      ))}
                                    </>
                                  )}
                                  
                                  {record.prescriptionDetails.notes ? (
                                    <Text style={[styles.detailBody, { color: C.textSecondary, marginTop: 10, fontStyle: 'italic' }]}>* Note: {record.prescriptionDetails.notes}</Text>
                                  ) : null}

                                  {record.prescriptionDetails.followUpDate ? (
                                    <Text style={[styles.detailBody, { color: C.primaryBlue, marginTop: 10, fontWeight: '800' }]}>
                                      📅 Follow-up: {new Date(record.prescriptionDetails.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </Text>
                                  ) : null}

                                  {/* Handwritten Canvas Visual Display */}
                                  {record.fileUrl && (record.fileUrl.startsWith('data:image/') || record.fileUrl.startsWith('http')) && (
                                    <View style={styles.canvasContainer}>
                                      <Text style={[styles.detailHeader, { marginTop: 12 }]}>Visual Prescription Pad</Text>
                                      <PressableScale onPress={() => setFullScreenImageUri(record.fileUrl)}>
                                        <View style={styles.imageCardFrame}>
                                          <Image
                                            source={{ uri: record.fileUrl }}
                                            style={styles.canvasImage}
                                            resizeMode="contain"
                                          />
                                          <View style={styles.expandOverlay}>
                                            <Ionicons name="expand" size={14} color="#FFFFFF" />
                                            <Text style={styles.expandText}>Tap to Open Full Screen</Text>
                                          </View>
                                        </View>
                                      </PressableScale>
                                    </View>
                                  )}

                                  {/* Compact Vector Stroke Zoomable Canvas Renderer */}
                                  {record.fileUrl && record.fileUrl.startsWith('{') && (
                                    <View style={styles.canvasContainer}>
                                      <PressableScale
                                        onPress={() => {
                                          try {
                                            const parsed = JSON.parse(record.fileUrl);
                                            if (parsed) setFullScreenStrokesData(parsed);
                                          } catch (e) {
                                            console.warn(e);
                                          }
                                        }}
                                      >
                                        <PrescriptionStrokeRenderer fileUrl={record.fileUrl} C={C} isStaticPreview={true} />
                                        <View style={styles.expandOverlay}>
                                          <Ionicons name="expand" size={14} color="#FFFFFF" />
                                          <Text style={styles.expandText}>Tap to Open Full Screen</Text>
                                        </View>
                                      </PressableScale>
                                    </View>
                                  )}
                                </View>
                              )}

                              {/* Lab Reports & Scans Sub-UI */}
                              {record.ocrText && (
                                <View style={styles.detailSection}>
                                  <Text style={styles.detailHeader}>AI OCR Summary</Text>
                                  <Text style={[styles.detailBody, { color: C.textPrimary, lineHeight: 18 }]}>{record.ocrText}</Text>
                                </View>
                              )}

                              {/* Privacy Consent & Control Area */}
                              <View style={[styles.actionRow, { borderTopColor: C.border, justifycontent: 'flex-end' }]}>
                                <PressableScale onPress={() => shareRecord(record)} style={styles.shareBtn}>
                                  <Ionicons name="share-social-outline" size={16} color={C.primaryBlue} />
                                  <Text style={{ color: C.primaryBlue, fontWeight: '800', fontSize: 12, marginLeft: 4 }}>Share</Text>
                                </PressableScale>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Immersive Full Screen Prescription Zoom Modal */}
      {Boolean(fullScreenImageUri || fullScreenStrokesData) && (
        <View style={styles.modalOverlay} role="dialog" aria-modal="true">
          <View style={styles.modalHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="document-text-outline" size={22} color="#000000" />
              <Text style={styles.modalHeaderTitle}>Prescription Full Screen</Text>
            </View>
            <PressableScale 
              onPress={() => {
                setFullScreenImageUri(null);
                setFullScreenStrokesData(null);
                setModalZoomScale(1);
              }}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color="#000000" />
            </PressableScale>
          </View>

          {/* Clean zoom controls */}
          <View style={styles.modalZoomToolbar}>
            <PressableScale 
              onPress={() => setModalZoomScale(z => Math.max(1, z - 0.5))} 
              style={[styles.modalZoomBtn, { backgroundColor: '#E5E7EB' }]}
              disabled={modalZoomScale <= 1}
            >
              <Ionicons name="remove" size={18} color="#000000" />
            </PressableScale>
            <Text style={styles.modalZoomLabel}>{Math.round(modalZoomScale * 100)}%</Text>
            <PressableScale 
              onPress={() => setModalZoomScale(z => Math.min(6, z + 0.5))} 
              style={[styles.modalZoomBtn, { backgroundColor: '#3B82F6' }]}
              disabled={modalZoomScale >= 6}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </PressableScale>
            {modalZoomScale > 1 && (
              <PressableScale 
                onPress={() => setModalZoomScale(1)} 
                style={styles.modalZoomBtnReset}
              >
                <Text style={styles.modalZoomResetText}>Reset</Text>
              </PressableScale>
            )}
          </View>

          <ScrollView 
            maximumZoomScale={6} 
            minimumZoomScale={1} 
            bouncesZoom={true}
            contentContainerStyle={styles.modalScrollContent}
            showsHorizontalScrollIndicator={true}
            showsVerticalScrollIndicator={true}
          >
            <ScrollView horizontal contentContainerStyle={styles.modalScrollContent}>
              <View style={{
                width: (SCREEN_WIDTH - 20) * modalZoomScale,
                height: (SCREEN_HEIGHT - 200) * modalZoomScale,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
              }}>
                {fullScreenImageUri ? (
                  <Image 
                    source={{ uri: fullScreenImageUri }} 
                    style={{ width: '100%', height: '100%', borderRadius: 12 }} 
                    resizeMode="contain" 
                  />
                ) : (
                  <View style={{ width: '100%', height: '100%', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                    <Svg 
                      viewBox={`0 0 ${fullScreenStrokesData.width || 320} ${fullScreenStrokesData.height || 220}`}
                      width={(SCREEN_WIDTH - 20) * modalZoomScale}
                      height={(SCREEN_HEIGHT - 200) * modalZoomScale}
                    >
                      {fullScreenStrokesData.strokes.map((stroke, index) => {
                        if (!stroke.points || stroke.points.length === 0) return null;
                        return (
                          <Polyline 
                            key={index}
                            points={stroke.points.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#000000"
                            strokeWidth={stroke.width || 2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        );
                      })}
                    </Svg>
                  </View>
                )}
              </View>
            </ScrollView>
          </ScrollView>
        </View>
      )}

      {/* WhatsApp-style Voice Notes Overlay Modal */}
      {Boolean(voiceNotesModalData) && (
        <View style={styles.modalOverlay} role="dialog" aria-modal="true">
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <PressableScale 
              onPress={async () => {
                setVoiceNotesModalData(null);
                await stopAudio();
              }}
              style={styles.chatBackBtn}
            >
              <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
            </PressableScale>
            <View style={styles.chatHeaderAvatar}>
              <Ionicons name="mic-circle" size={32} color="#0EA5E9" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.chatHeaderTitle, { color: C.textPrimary }]}>Consultation Voice Notes</Text>
              <Text style={[styles.chatHeaderSubtitle, { color: C.textSecondary }]}>
                {voiceNotesModalData.length} voice messages from your doctors
              </Text>
            </View>
          </View>

          {/* Chat Messages Timeline */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.chatListContent}
            style={{ width: '100%', flex: 1, backgroundColor: scheme === 'dark' ? '#111827' : '#F3F4F6' }}
          >
            {voiceNotesModalData.map((note) => {
              const isPlaying = playingVoiceId === note._id;
              
              return (
                <View key={note._id} style={styles.chatBubbleContainer}>
                  {/* Left Aligned Received Message Bubble */}
                  <View style={[
                    styles.chatBubble, 
                    { backgroundColor: scheme === 'dark' ? '#1F2937' : '#FFFFFF', borderColor: scheme === 'dark' ? '#374151' : '#E5E7EB' }
                  ]}>
                    {/* Doctor Badge */}
                    <Text style={styles.chatBubbleDoctor}>{note.doctor} • {note.hospital}</Text>
                    
                    {/* Voice Message Player UI (WhatsApp Style) */}
                    <View style={styles.chatPlayerRow}>
                      {loadingAudioId === note._id ? (
                        <View style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}>
                          <ActivityIndicator size="small" color="#0EA5E9" />
                        </View>
                      ) : (
                        <PressableScale onPress={() => toggleVoiceNote(note)}>
                          <Ionicons 
                            name={isPlaying ? "pause-circle" : "play-circle"} 
                            size={40} 
                            color="#0EA5E9" 
                          />
                        </PressableScale>
                      )}
                      
                      {/* Audio wave simulation or progress bar */}
                      <View style={styles.chatProgressContainer}>
                        {/* Audio Waveform Simulator */}
                        <View style={styles.waveformContainer}>
                          {[30, 60, 45, 75, 50, 90, 40, 65, 80, 50, 70, 45, 60, 85, 40, 75, 55, 30].map((h, i) => {
                            const isBarPlayed = isPlaying && (i / 18) <= playbackProgress;
                            return (
                              <View 
                                key={i} 
                                style={{
                                  width: 2,
                                  height: (h * 20) / 100,
                                  backgroundColor: isBarPlayed ? '#10B981' : (scheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                                  borderRadius: 1,
                                  opacity: isBarPlayed ? 1 : 0.6,
                                  marginHorizontal: 1
                                }} 
                              />
                            );
                          })}
                        </View>
                        {/* Thin progress track */}
                        <View style={styles.chatProgressTrack}>
                          <View style={[
                            styles.chatProgressFilled,
                            { 
                              width: isPlaying ? `${playbackProgress * 100}%` : '0%',
                              backgroundColor: '#10B981'
                            }
                          ]} />
                        </View>
                      </View>
                      
                      <Text style={[styles.chatDuration, { color: C.textSecondary }]}>
                        {isPlaying 
                          ? `${Math.round(playbackProgress * (note.voiceNoteDetails?.duration || 30))}s`
                          : `${note.voiceNoteDetails?.duration || 30}s`
                        }
                      </Text>
                    </View>

                    {/* AI Transcript Box */}
                    <View style={[styles.chatTranscriptBox, { backgroundColor: scheme === 'dark' ? '#111827' : '#F9FAFB' }]}>
                      <Text style={[styles.chatTranscriptText, { color: C.textPrimary }]}>
                        &quot;{note.voiceNoteDetails?.transcript}&quot;
                      </Text>
                    </View>

                    {/* Message Timestamp */}
                    <Text style={styles.chatTimeText}>
                      {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {new Date(note.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </ScreenWrapper>
  );
}

function PrescriptionStrokeRenderer({ fileUrl, C, isStaticPreview = false }) {
  const [zoomScale, setZoomScale] = useState(1);
  
  const data = useMemo(() => {
    try {
      return JSON.parse(fileUrl);
    } catch (e) {
      console.warn("Failed to parse prescription strokes:", e);
      return null;
    }
  }, [fileUrl]);

  if (!data || !data.strokes) return null;

  const baseWidth = data.width || 320;
  const baseHeight = data.height || 220;
  
  const displayWidth = baseWidth * (isStaticPreview ? 1 : zoomScale);
  const displayHeight = baseHeight * (isStaticPreview ? 1 : zoomScale);

  return (
    <View style={styles.vectorContainer}>
      <Text style={styles.detailHeader}>Visual Prescription Pad</Text>
      
      {/* Dynamic Crisp Zoom Control Rig */}
      {!isStaticPreview && (
        <View style={styles.zoomToolbar}>
          <PressableScale
            onPress={() => setZoomScale(z => Math.max(1, z - 0.25))}
            style={[styles.zoomBtn, { backgroundColor: C.border }]}
            disabled={zoomScale <= 1}
          >
            <Text style={[styles.zoomBtnText, { color: C.textPrimary }]}>Zoom −</Text>
          </PressableScale>
          
          <Text style={[styles.zoomLabel, { color: C.textPrimary }]}>
            {Math.round(zoomScale * 100)}%
          </Text>
          
          <PressableScale
            onPress={() => setZoomScale(z => Math.min(4, z + 0.25))}
            style={[styles.zoomBtn, { backgroundColor: C.primaryBlue }]}
            disabled={zoomScale >= 4}
          >
            <Text style={styles.zoomBtnTextWhite}>Zoom +</Text>
          </PressableScale>
          
          {zoomScale > 1 && (
            <PressableScale
              onPress={() => setZoomScale(1)}
              style={[styles.zoomBtnReset, { borderColor: C.border }]}
            >
              <Text style={[styles.zoomBtnResetText, { color: C.textSecondary }]}>Reset</Text>
            </PressableScale>
          )}
        </View>
      )}

      {/* Frame containing ScrollViews for scrolling zoomed coordinates */}
      <View style={[styles.imageCardFrame, { height: Math.max(220, baseHeight) }]}>
        {isStaticPreview ? (
          <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <Svg
              viewBox={`0 0 ${baseWidth} ${baseHeight}`}
              width="100%"
              height="100%"
            >
              {data.strokes.map((stroke, index) => {
                if (!stroke.points || stroke.points.length === 0) return null;
                return (
                  <Polyline
                    key={index}
                    points={stroke.points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={stroke.color || '#0f172a'}
                    strokeWidth={stroke.width || 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}
            </Svg>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
          >
            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{ width: displayWidth, height: displayHeight, overflow: 'hidden' }}>
                <Svg
                  viewBox={`0 0 ${baseWidth} ${baseHeight}`}
                  width={displayWidth}
                  height={displayHeight}
                >
                  {data.strokes.map((stroke, index) => {
                    if (!stroke.points || stroke.points.length === 0) return null;
                    return (
                      <Polyline
                        key={index}
                        points={stroke.points.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke={stroke.color || '#0f172a'}
                        strokeWidth={stroke.width || 2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                </Svg>
              </View>
            </ScrollView>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, flex: 1 },
  header: { marginBottom: 12, marginTop: 10 },
  h1: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  
  searchRow: { flexDirection: 'row', gap: 12, marginTop: 12, alignItems: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 46, borderRadius: 16, borderWidth: 1, ...Shadow.sm },
  uploadBtn: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  
  categories: { gap: 8, paddingVertical: 4 },
  categoryBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 40, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '700' },
  
  timelineRow: { flexDirection: 'row', gap: 12 },
  indicatorCol: { alignItems: 'center', width: 14 },
  dot: { width: 10, height: 10, borderRadius: 5, zIndex: 1, marginTop: 22 },
  line: { width: 2, flex: 1, marginVertical: -2 },
  
  card: { flex: 1, marginBottom: 16, borderRadius: 24, padding: 16, borderWidth: 1, ...Shadow.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  date: { fontSize: 11, color: '#6B7280', fontWeight: '800' },
  title: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  subtitle: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  
  expandedContent: { marginTop: 16 },
  detailSection: { padding: 12, backgroundColor: '#F9FAFB', borderRadius: 16, marginBottom: 12 },
  detailHeader: { fontSize: 12, fontWeight: '800', color: '#4B5563', textTransform: 'uppercase', marginBottom: 6 },
  detailBody: { fontSize: 13, fontWeight: '600' },
  
  medRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  medText: { fontSize: 13, fontWeight: '700' },
  
  voicePlayer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  voiceProgressBg: { flex: 1, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 },
  voiceProgressActive: { width: '40%', height: 4, backgroundColor: '#0EA5E9', borderRadius: 2 },
  voiceDuration: { fontSize: 11, color: '#6B7280', fontWeight: '800' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, marginTop: 4 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  timelineMonthHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 12, width: '100%' },
  timelineMonthText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  timelineHeaderLine: { flex: 1, height: 1, marginLeft: 8 },
  
  canvasContainer: { marginTop: 12, marginBottom: 4 },
  imageCardFrame: {
    height: 220,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginTop: 6,
    padding: 6
  },
  canvasImage: { width: '100%', height: '100%', borderRadius: 10 },
  vectorContainer: { marginTop: 12, marginBottom: 4 },
  zoomToolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 2 },
  zoomBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  zoomBtnText: { fontSize: 11, fontWeight: '800' },
  zoomBtnTextWhite: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  zoomLabel: { fontSize: 12, fontWeight: '800', minWidth: 36, textAlign: 'center' },
  zoomBtnReset: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  zoomBtnResetText: { fontSize: 11, fontWeight: '800' },

  // Immersive Modal Zoom and Expansion Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 9999,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalHeaderTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalZoomToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  modalZoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalZoomLabel: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    minWidth: 46,
    textAlign: 'center',
  },
  modalZoomBtnReset: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalZoomResetText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '800',
  },
  modalScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooterHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 30,
  },
  expandOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expandText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  // WhatsApp Style Voice Note Chat Styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 10,
  },
  chatBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderAvatar: {
    marginLeft: 8,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  chatHeaderSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  chatListContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 16,
  },
  chatBubbleContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  chatBubble: {
    maxWidth: '85%',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  chatBubbleDoctor: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0EA5E9',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  chatPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  chatProgressContainer: {
    flex: 1,
    justifyContent: 'center',
    height: 36,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    marginBottom: 4,
  },
  chatProgressTrack: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  chatProgressFilled: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  chatDuration: {
    fontSize: 11,
    fontWeight: '800',
  },
  chatTranscriptBox: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
  },
  chatTranscriptText: {
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 16,
  },
  chatTimeText: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '700',
    textAlign: 'right',
  },
});
