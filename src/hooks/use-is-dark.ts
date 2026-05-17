import { useColorScheme } from 'react-native';
import { useAppearanceStore } from '@/store/appearance-store';

export function useIsDark(): boolean {
  const nativeColorScheme = useColorScheme();
  const theme = useAppearanceStore((s) => s.theme);
  return theme === 'dark' || (theme === 'system' && nativeColorScheme === 'dark');
}
