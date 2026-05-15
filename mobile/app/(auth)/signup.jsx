import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import PressableScale from '@/components/ui/PressableScale';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { API_BASE_URL } from '@/constants/api';

export default function SignupScreen() {
    const scheme = useColorScheme() ?? 'light';
    const C = Colors[scheme];
    const { login } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleSignup = async () => {
        try {
            const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone: formattedPhone, password })
            });
            const data = await response.json();
            if (response.ok) {
                await login(data);
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (err) {
            alert('Network error. Is the backend running?');
        }
    };

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <PressableScale onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
                    </PressableScale>
                    <Text style={[styles.title, { color: C.textPrimary }]}>Create Health ID</Text>
                    <Text style={styles.subtitle}>Join the secure digital health revolution</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            placeholder="As per Aadhar"
                            style={[styles.inputBox, { borderColor: C.border }]}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mobile Number</Text>
                        <View style={[styles.inputBox, { borderColor: C.border }]}>
                            <Text style={styles.prefix}>+91</Text>
                            <TextInput
                                placeholder="10 digit number"
                                keyboardType="number-pad"
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email (Optional)</Text>
                        <TextInput
                            placeholder="name@example.com"
                            style={[styles.inputBox, { borderColor: C.border }]}
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Security Password</Text>
                        <TextInput
                            placeholder="Min 6 characters"
                            secureTextEntry
                            style={[styles.inputBox, { borderColor: C.border }]}
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <PressableScale onPress={handleSignup} style={styles.signupBtn}>
                        <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.btnGradient}>
                            <Text style={styles.signupBtnText}>Verify & Create</Text>
                            <Ionicons name="shield-checkmark" size={20} color="#fff" />
                        </LinearGradient>
                    </PressableScale>

                    <Text style={styles.terms}>
                        By creating an account, you agree to our
                        <Text style={{ color: '#3B82F6' }}> Terms of Service </Text>
                        and
                        <Text style={{ color: '#3B82F6' }}> Privacy Policy </Text>.
                    </Text>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { padding: 24, paddingTop: 60 },
    header: { marginBottom: 32 },
    backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center', marginBottom: 16 },
    title: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    subtitle: { color: '#64748B', fontSize: 16, marginTop: 4, fontWeight: '500' },
    form: { width: '100%' },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '800', color: '#94A3B8', marginBottom: 8, letterSpacing: 1 },
    inputBox: { height: 60, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
    prefix: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginRight: 12 },
    input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1E293B' },
    signupBtn: { height: 60, borderRadius: 16, overflow: 'hidden', marginTop: 12 },
    btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    signupBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    terms: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 32, lineHeight: 18, fontWeight: '500' }
});
