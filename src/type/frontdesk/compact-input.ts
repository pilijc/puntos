import {Animated} from 'react-native';

export interface CompactAmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  isVisible?: boolean;
  showCamera?: boolean;
  isFloating?: boolean;
  scrollY?: Animated.Value;
}