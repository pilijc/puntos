
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function CustomTabBarButton({ onPress, bottomInset }: { onPress?: () => void, bottomInset: number }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.fabContainer, 
        { top: Platform.OS === 'ios' ? -30 : -28 - (bottomInset / 4) }
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