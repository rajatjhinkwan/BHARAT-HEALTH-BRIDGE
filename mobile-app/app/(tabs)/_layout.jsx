import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const { dashboard, user } = useAuth();

  let avatarUrl = dashboard?.patient?.profileImage || user?.avatar || null;
  if (avatarUrl && avatarUrl.startsWith('http://localhost:4000')) {
    const { API_BASE_URL } = require('@/constants/api');
    const apiHost = API_BASE_URL.replace(/\/api\/?$/, '');
    avatarUrl = avatarUrl.replace('http://localhost:4000', apiHost);
  }

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: palette.primaryBlue,
      tabBarInactiveTintColor: '#94A3B8',
      headerShown: false,
      tabBarStyle: {
        backgroundColor: palette.cardWhite,
        borderTopWidth: 0,
        height: 70,
        paddingBottom: 12,
        paddingTop: 8,
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        borderRadius: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '700'
      },
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Home',
        tabBarIcon: ({ color, focused }) => (
          <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
        )
      }} />
      <Tabs.Screen name="history" options={{
        title: 'History',
        tabBarIcon: ({ color, focused }) => (
          <TabIcon name={focused ? 'receipt' : 'receipt-outline'} color={color} focused={focused} />
        )
      }} />
      <Tabs.Screen name="emergency" options={{
        title: 'SOS',
        tabBarIcon: ({ color, focused }) => (
          <TabIcon name={focused ? 'medical' : 'medical-outline'} color={color} focused={focused} isSpecial />
        )
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color, focused }) => (
          <TabIcon 
            name={focused ? 'person-circle' : 'person-circle-outline'} 
            color={color} 
            focused={focused} 
            profileImage={avatarUrl}
          />
        )
      }} />
    </Tabs>
  );
}

function TabIcon({ name, color, focused, isSpecial, profileImage }) {
  if (isSpecial) {
    return (
      <View style={[styles.specialIcon, { backgroundColor: '#DC2626' }]}>
        <Ionicons name={name} size={24} color="#fff" />
      </View>
    );
  }
  if (profileImage) {
    return (
      <View style={[
        focused ? styles.activeDot : null,
        {
          borderWidth: focused ? 2 : 1,
          borderColor: focused ? color : '#94A3B8',
          borderRadius: 13,
          overflow: 'hidden',
          width: 26,
          height: 26,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#E2E8F0'
        }
      ]}>
        <Image
          source={{ uri: profileImage }}
          style={{ width: '100%', height: '100%', borderRadius: 11 }}
        />
      </View>
    );
  }
  return (
    <View style={focused ? styles.activeDot : null}>
      <Ionicons name={name} size={24} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    padding: 2,
  },
  specialIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -35,
    borderWidth: 6,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  }
});
