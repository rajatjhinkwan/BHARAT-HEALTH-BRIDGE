import React from 'react';
import { ScrollView, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Radius, Shadow } from '@/constants/theme';

export default function QuickActions({ C, actions }) {
    return (
        <View style={styles.section}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {actions.map((x, i) => (
                    <TouchableOpacity key={i} onPress={() => router.push(x.route)} activeOpacity={0.8}>
                        <View style={[styles.pill, { backgroundColor: C.cardWhite, borderColor: C.border }]}>
                            <View style={[styles.iconBox, { backgroundColor: x.label === 'Emergency' ? C.errorLight : C.infoLight }]}>
                                <Ionicons name={x.icon} size={18} color={x.label === 'Emergency' ? C.emergencyRed : C.primaryBlue} />
                            </View>
                            <Text style={[styles.pillText, { color: C.textPrimary }]}>{x.label}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    section: { marginVertical: 15 },
    scrollContent: { paddingHorizontal: 20, gap: 12 },
    pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, gap: 8, elevation: 1 },
    iconBox: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    pillText: { fontSize: 13, fontWeight: '700' },
});
