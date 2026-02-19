import * as Location from 'expo-location';
import { Alert } from 'react-native';

/** Re-export so hooks can type the subscription from watchPositionAsync */
export type LocationSubscription = Location.LocationSubscription;

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Request location permissions
 */
export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain: status !== 'denied',
      status,
    };
  } catch (error) {
    console.error('[LocationService] Error requesting permission:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: Location.PermissionStatus.DENIED,
    };
  }
}

/**
 * Check current location permission status
 */
export async function checkLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain: status !== 'denied',
      status,
    };
  } catch (error) {
    console.error('[LocationService] Error checking permission:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: Location.PermissionStatus.DENIED,
    };
  }
}

/**
 * Get current user location
 */
export async function getCurrentLocation(): Promise<UserLocation | null> {
  try {
    const permissionStatus = await checkLocationPermission();
    if (!permissionStatus.granted) {
      console.log('[LocationService] Location permission not granted');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
    };
  } catch (error) {
    console.error('[LocationService] Error getting location:', error);
    return null;
  }
}

/**
 * Watch user location (for real-time updates)
 * Returns a subscription that can be removed with subscription.remove()
 */
export async function watchLocation(
  callback: (location: UserLocation) => void,
  options?: {
    accuracy?: Location.Accuracy;
    timeInterval?: number;
    distanceInterval?: number;
  }
): Promise<Location.LocationSubscription | null> {
  try {
    const permissionStatus = await checkLocationPermission();
    if (!permissionStatus.granted) {
      console.log('[LocationService] Location permission not granted for watching');
      return null;
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: options?.accuracy || Location.Accuracy.Balanced,
        timeInterval: options?.timeInterval || 5000,
        distanceInterval: options?.distanceInterval || 10,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
        });
      }
    );

    return subscription;
  } catch (error) {
    console.error('[LocationService] Error watching location:', error);
    return null;
  }
}

/**
 * Determine if a store is "nearby" based on distance threshold (default: 2 miles)
 */
export function isStoreNearby(
  userLat: number,
  userLon: number,
  storeLat: number,
  storeLon: number,
  thresholdMiles: number = 2.0
): boolean {
  const distance = calculateDistance(userLat, userLon, storeLat, storeLon);
  return distance <= thresholdMiles;
}
