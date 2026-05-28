import { Platform } from 'react-native';

export const Colors = {
  light: {
    primaryBlue: '#1E3A8A',
    secondarySaffron: '#FF9933',
    accentGreen: '#138808',
    emergencyRed: '#DC2626',
    warningYellow: '#F59E0B',
    background: '#F9FAFB',
    cardWhite: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    icon: '#6B7280',
    border: '#E5E7EB',
    successLight: '#DCFCE7',
    errorLight: '#FEE2E2',
    infoLight: '#DBEAFE',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#1E3A8A',
  },
  dark: {
    primaryBlue: '#3B82F6',
    secondarySaffron: '#FF9933',
    accentGreen: '#138808',
    emergencyRed: '#DC2626',
    warningYellow: '#F59E0B',
    background: '#0B0F14',
    cardWhite: '#111827',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    icon: '#9CA3AF',
    border: '#374151',
    successLight: '#064E3B',
    errorLight: '#7F1D1D',
    infoLight: '#1E3A8A',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#FFFFFF',
  },
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 };
export const Radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 1000 };

export const Shadow = {
  sm: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  md: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  lg: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
  xl: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 25, shadowOffset: { width: 0, height: 20 }, elevation: 4 },
  emergency: { shadowColor: '#DC2626', shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
};

export const Fonts = Platform.select({
  ios: { sans: 'Inter', serif: 'Georgia', rounded: 'Inter', mono: 'JetBrainsMono' },
  default: { sans: 'Inter', serif: 'Noto Sans Devanagari', rounded: 'Inter', mono: 'JetBrainsMono' },
});
