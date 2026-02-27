import * as Location from 'expo-location';
import { Platform } from 'react-native';

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

const toUserLocation = (loc: { coords: { latitude: number; longitude: number; accuracy?: number } }): UserLocation => ({
  latitude: loc.coords.latitude,
  longitude: loc.coords.longitude,
  accuracy: loc.coords.accuracy || undefined,
});

/**
 * Get current user location.
 * On Android (including emulator): use last-known first with no accuracy filter (emulator mock
 * can have large accuracy value and was being rejected). Then try "current" with a long
 * max age so the Fused API can return the same cached mock. Never throws; returns null if unavailable.
 */
export async function getCurrentLocation(): Promise<UserLocation | null> {
  try {
    const permissionStatus = await checkLocationPermission();
    if (!permissionStatus.granted) {
      const reqStatus = await requestLocationPermission();
      if (!reqStatus.granted) return null;
    }

    if (Platform.OS === 'android') {
      // 1) No options: accept any age/accuracy so emulator mock isn't filtered out
      const lastKnown = await Location.getLastKnownPositionAsync({});
      if (lastKnown) return toUserLocation(lastKnown);

      // 2) getCurrentPositionAsync often returns null on emulator; try with long max age for cached
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest,
          timeInterval: 300000,
          mayShowUserSettingsDialog: false,
        });
        return toUserLocation(location);
      } catch {
        /* continue to 3 */
      }

      // 3) Emulator may only deliver via watch (like Maps); request one update then unsubscribe
      try {
        let subscription: Location.LocationSubscription | null = null;
        const loc = await new Promise<UserLocation | null>((resolve) => {
          const timeout = setTimeout(() => {
            if (subscription) subscription.remove();
            resolve(null);
          }, 6000);
          Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Lowest, timeInterval: 1000, distanceInterval: 0 },
            (position) => {
              clearTimeout(timeout);
              if (subscription) subscription.remove();
              resolve(toUserLocation(position));
            },
            () => {
              clearTimeout(timeout);
              if (subscription) subscription.remove();
              resolve(null);
            }
          ).then((sub) => {
            subscription = sub;
          }).catch(() => resolve(null));
        });
        if (loc) return loc;
      } catch {
        /* ignore */
      }

      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return toUserLocation(location);
  } catch {
    try {
      const lastKnown = await Location.getLastKnownPositionAsync({});
      if (lastKnown) return toUserLocation(lastKnown);
    } catch {
      /* ignore */
    }
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
