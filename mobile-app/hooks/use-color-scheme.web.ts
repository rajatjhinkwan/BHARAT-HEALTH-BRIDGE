import { useTheme } from '@/context/ThemeContext';

export function useColorScheme() {
  try {
    const { theme } = useTheme();
    return theme;
  } catch (e) {
    return 'light';
  }
}

