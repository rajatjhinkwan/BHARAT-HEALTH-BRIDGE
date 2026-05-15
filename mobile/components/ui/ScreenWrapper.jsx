import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ScrollView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ScreenWrapper({ children, style, scroll = true }) {
    const scheme = useColorScheme() ?? 'light';
    const C = Colors[scheme];

    // Global Entrance Animation
    const translateY = useRef(new Animated.Value(20)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(translateY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
    }, []);

    const content = (
        <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
            {children}
        </Animated.View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: C.background }}>
            <LinearGradient
                colors={scheme === 'light' ? ['#F0F9FF', '#E0F2FE', '#F9FAFB'] : ['#0B0F14', '#1E3A8A', '#0B0F14']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <SafeAreaView style={{ flex: 1 }}>
                {scroll ? (
                    <ScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 140 }}
                    >
                        {content}
                    </ScrollView>
                ) : (
                    <View style={{ flex: 1 }}>
                        {content}
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}
