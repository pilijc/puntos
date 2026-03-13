import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface QRRoundedButtonProps {
  onPress?: () => void;
  bottomInset: number;
}

export default function QRRoundedButton({ onPress, bottomInset }: QRRoundedButtonProps) {
  const handlePress = () => {
    // Try multiple ways to open the price modal
    if ((global as any).handleCenterQRButton) {
      (global as any).handleCenterQRButton();
    } else if ((global as any).openPriceModal) {
      (global as any).openPriceModal();
    }
    // Fallback to custom onPress if provided
    else if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.fabContainer, 
        { 
          top: Platform.OS === 'ios' ? -30 : -28 - (bottomInset / 4),
          position: 'absolute',
          left: '50%',
          marginLeft: -35 // Half of the button width to center it
        }
      ]}
    >
      <View style={styles.fab}>
        <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6600',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});