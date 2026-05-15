import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import PressableScale from '@/components/ui/PressableScale';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

import { API_BASE_URL } from '@/constants/api';

export default function LoginScreen() {
    const scheme = useColorScheme() ?? 'light';
    const C = Colors[scheme];
    const { login } = useAuth();

    const [method, setMethod] = useState('phone'); // 'phone' or 'email'
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const body = {};
            if (method === 'phone') {
                if (!phone || phone.length < 10) {
                    alert('Please enter a valid phone number');
                    return;
                }
                if (!password) {
                    alert('Please enter your password');
                    return;
                }
                body.phone = phone.startsWith('+91') ? phone : `+91${phone}`;
                body.password = password;
            } else {
                if (!email || !password) {
                    alert('Please enter email and password');
                    return;
                }
                body.email = email;
                body.password = password;
            }

            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (response.ok) {
                await login(data);
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (err) {
            alert('Network error. Please check your connection.');
        }
    };

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={[styles.logoBox, { backgroundColor: C.primaryBlue + '15' }]}>
                        <Ionicons name="medical" size={40} color={C.primaryBlue} />
                    </View>
                    <Text style={[styles.title, { color: C.textPrimary }]}>Bharat Health Bridge</Text>
                    <Text style={[styles.subtitle, { color: C.textSecondary }]}>Securing Healthcare for 1.4 Billion Indians</Text>
                </View>

                <View style={styles.authBox}>
                    <View style={styles.tabs}>
                        <PressableScale onPress={() => setMethod('phone')} style={[styles.tab, method === 'phone' && styles.tabActive]}>
                            <Text style={[styles.tabText, method === 'phone' && styles.tabTextActive]}>Mobile</Text>
                        </PressableScale>
                        <PressableScale onPress={() => setMethod('email')} style={[styles.tab, method === 'email' && styles.tabActive]}>
                            <Text style={[styles.tabText, method === 'email' && styles.tabTextActive]}>Email</Text>
                        </PressableScale>
                    </View>

                    {method === 'phone' ? (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mobile Number</Text>
                            <View style={[styles.inputBox, { borderColor: C.border, marginBottom: 16 }]}>
                                <Text style={styles.prefix}>+91</Text>
                                <TextInput
                                    placeholder="Enter 10 digit number"
                                    keyboardType="number-pad"
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                />
                            </View>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                placeholder="••••••••"
                                secureTextEntry
                                style={[styles.inputBox, { borderColor: C.border }]}
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>
                    ) : (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                placeholder="name@example.com"
                                style={[styles.inputBox, { borderColor: C.border }]}
                                value={email}
                                onChangeText={setEmail}
                            />
                            <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
                            <TextInput
                                placeholder="••••••••"
                                secureTextEntry
                                style={[styles.inputBox, { borderColor: C.border }]}
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>
                    )}

                    <PressableScale onPress={handleLogin} style={styles.loginBtn}>
                        <LinearGradient colors={[C.primaryBlue, '#2563EB']} style={styles.btnGradient}>
                            <Text style={styles.loginBtnText}>Login to Dashboard</Text>
                            <Ionicons name="shield-checkmark" size={20} color="#fff" />
                        </LinearGradient>
                    </PressableScale>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>New to the bridge?</Text>
                        <PressableScale onPress={() => router.push('/signup')}><Text style={styles.signupLink}> Create Health ID</Text></PressableScale>
                    </View>

                    <PressableScale 
                        style={styles.skipBtn} 
                        onPress={async () => {
                            // Mock login for demo purposes
                            const guestData = {
                                token: 'guest_token',
                                user: { id: 'guest', name: 'Guest User', role: 'patient' }
                            };
                            await login(guestData);
                        }}
                    >
                        <Text style={styles.skipText}>Skip for Demo Access</Text>
                        <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                    </PressableScale>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { padding: 24, paddingTop: 30, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 30 },
    logoBox: { width: 70, height: 70, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    subtitle: { color: '#64748B', fontSize: 13, marginTop: 4, fontWeight: '500', textAlign: 'center' },
    authBox: { width: '100%' },
    tabs: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 20, padding: 6, marginBottom: 24 },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 16 },
    tabActive: { backgroundColor: '#fff', ...Shadow.sm },
    tabText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
    tabTextActive: { color: '#1E293B' },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
    inputBox: { height: 64, borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
    prefix: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginRight: 12 },
    input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1E293B' },
    loginBtn: { height: 60, borderRadius: 18, overflow: 'hidden', marginTop: 10 },
    btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    loginBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
    footerText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
    signupLink: { color: '#3B82F6', fontSize: 14, fontWeight: '800' },
    skipBtn: { marginTop: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.8 },
    skipText: { fontSize: 13, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 }
});
