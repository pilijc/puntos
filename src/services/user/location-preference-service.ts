import AsyncStorage from '@react-native-async-storage/async-storage';

const locationManualDisableKey = (userId: string) => `location_manual_disable:${userId}`;

export async function markLocationManuallyDisabled(userId: string): Promise<void> {
  await AsyncStorage.setItem(locationManualDisableKey(userId), 'true');
}

export async function clearLocationManuallyDisabled(userId: string): Promise<void> {
  await AsyncStorage.removeItem(locationManualDisableKey(userId));
}

export async function isLocationManuallyDisabled(userId: string): Promise<boolean> {
  return (await AsyncStorage.getItem(locationManualDisableKey(userId))) === 'true';
}
