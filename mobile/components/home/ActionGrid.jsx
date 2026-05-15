import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import PressableScale from '@/components/ui/PressableScale';
import { HOME_MOCK_DATA } from '@/constants/mockData';

export default function ActionGrid({ C, gridAnims }) {
    const items = HOME_MOCK_DATA.actionGrid;

    return (
        <View style={styles.grid}>
            {items.map((item, idx) => (
                <Animated.View
                    key={item.id}
                    style={[
                        styles.gridItem,
                        {
                            opacity: gridAnims[idx].o,
                            transform: [
                                { translateY: gridAnims[idx].y },
                                { scale: gridAnims[idx].s }
                            ]
                        }
                    ]}
                >
                    <PressableScale
                        activeOpacity={0.9}
                        onPress={() => router.push(item.route)}
                        style={{ flex: 1 }}
                    >
                        <LinearGradient colors={item.colors} style={styles.cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                            <View style={styles.cardTop}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name={item.icon} size={24} color="#fff" />
                                </View>
                                {item.alert && <View style={styles.alertDot} />}
                            </View>

                            <View style={styles.cardBody}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={styles.cardSub}>{item.subtitle}</Text>
                            </View>

                            <View style={styles.cardFooter}>
                                {item.badge ? (
                                    <View style={styles.badge}><Text style={styles.badgeText}>{item.badge}</Text></View>
                                ) : item.footer ? (
                                    <Text style={styles.footerText}>{item.footer}</Text>
                                ) : null}
                                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
                            </View>
                        </LinearGradient>
                    </PressableScale>
                </Animated.View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, gap: 12, marginTop: 10 },
    gridItem: { width: '47.5%', minHeight: 180 },
    cardGradient: { flex: 1, borderRadius: 28, padding: 18, justifyContent: 'space-between', elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    alertDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#fff' },
    cardTitle: { color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 20 },
    cardSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 4, fontWeight: '600' },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    footerText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' }
});
