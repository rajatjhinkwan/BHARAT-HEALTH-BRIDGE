import React, { useEffect, useMemo, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, Alert } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AppHeader from '@/components/ui/app-header';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import { HOME_MOCK_DATA } from '@/constants/mockData';

import GreetingSection from '@/components/home/GreetingSection';
import EmergencyBanner from '@/components/home/EmergencyBanner';
import QuickActions from '@/components/home/QuickActions';
import ActionGrid from '@/components/home/ActionGrid';
import { useAuth } from '@/context/AuthContext';
import { usePatientRealtime } from '@/hooks/usePatientRealtime';

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { user: authUser, dashboard, patientProfileId, refreshDashboard } = useAuth();
  const pId = patientProfileId || authUser?.patientProfileId;

  const displayUser = useMemo(() => {
    if (dashboard?.patient) {
      return {
        name: dashboard.patient.patientName || authUser?.name,
        bloodGroup: dashboard.patient.bloodGroup || '—',
        healthScore: 85,
        location: 'Uttarakhand',
        nextCheckup: dashboard.upcomingAppointments?.[0]
          ? `${dashboard.upcomingAppointments[0].appointmentDate} ${dashboard.upcomingAppointments[0].appointmentTime}`
          : 'No upcoming visit',
      };
    }
    return authUser || HOME_MOCK_DATA.user;
  }, [dashboard, authUser]);

  const activeVisit = useMemo(() => {
    const next = dashboard?.upcomingAppointments?.[0];
    if (!next) return HOME_MOCK_DATA.activeVisit;
    return {
      hospital: next.doctorName ? `Appointment with ${next.doctorName}` : 'Upcoming OPD',
      day: next.department || 'OPD',
      bill: next.status || 'BOOKED',
      progress: 0.2,
      admissionDate: next.appointmentDate,
      room: next.appointmentTime,
      timeline: [
        { time: next.appointmentTime, event: next.reason || 'Consultation', status: 'pending' },
      ],
    };
  }, [dashboard]);

  usePatientRealtime(pId, {
    onPrescription: () => {
      refreshDashboard();
      Alert.alert('Prescription Ready', 'A new prescription from your doctor is available in History.');
    },
    onAppointment: () => {
      refreshDashboard();
      Alert.alert('Appointment Update', 'Your appointment status was updated.');
    },
  });

  const headerY = useRef(new Animated.Value(-50)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const greetX = useRef(new Animated.Value(-30)).current;
  const greetOpacity = useRef(new Animated.Value(0)).current;
  const namasteLetters = useMemo(() => 'Namaste'.split('').map(() => new Animated.Value(0)), []);
  const emergencyScale = useRef(new Animated.Value(0.7)).current;
  const emergencyOpacity = useRef(new Animated.Value(0)).current;
  const gridAnims = useMemo(() => Array.from({ length: 6 }, () => ({ y: new Animated.Value(60), s: new Animated.Value(0.8), o: new Animated.Value(0) })), []);
  const liveX = useRef(new Animated.Value(150)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(50),
      Animated.parallel([
        Animated.timing(headerY, { toValue: 0, duration: 400, easing: Easing.back(1.5), useNativeDriver: true }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(greetX, { toValue: 0, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(greetOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.stagger(30, namasteLetters.map(v =>
        Animated.spring(v, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
      )),
      Animated.parallel([
        Animated.timing(progress, { toValue: 0.85, duration: 600, easing: Easing.linear, useNativeDriver: false }),
        Animated.spring(emergencyScale, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(emergencyOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.stagger(60, gridAnims.map(a =>
        Animated.parallel([
          Animated.timing(a.y, { toValue: 0, duration: 300, easing: Easing.back(1.2), useNativeDriver: true }),
          Animated.timing(a.s, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(a.o, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      )),
      Animated.spring(liveX, { toValue: 0, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const entranceAnims = {
    greetX, greetOpacity, namasteLetters, progress,
    emergencyScale, emergencyOpacity,
    gridAnims, liveX
  };

  return (
    <ScreenWrapper>
      <Animated.View style={{ transform: [{ translateY: headerY }], opacity: headerOpacity }}>
        <AppHeader showBell bellBadge={dashboard?.recentPrescriptions?.length || 0} />
      </Animated.View>

      <GreetingSection C={C} user={displayUser} entranceAnims={entranceAnims} />
      <EmergencyBanner C={C} entranceAnims={entranceAnims} />
      <QuickActions C={C} actions={HOME_MOCK_DATA.quickActions} />
      <ActionGrid C={C} gridAnims={gridAnims} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({});
