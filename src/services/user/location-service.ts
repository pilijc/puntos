import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type LocationSubscription = Location.LocationSubscription;

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
}

export interface UserHeading {
  heading: number;
  accuracy?: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
  accuracy?: 'fine' | 'coarse' | 'none';
  scope?: 'whenInUse' | 'always' | 'none';
}

const FRESH_LOCATION_TIMEOUT_MS = 10000;
const WATCH_LOCATION_TIMEOUT_MS = 8000;
const LAST_KNOWN_MAX_AGE_MS = 2 * 60 * 1000;

const toLocationPermissionStatus = (
  response: Location.LocationPermissionResponse
): LocationPermissionStatus => ({
  granted: response.granted,
  canAskAgain: response.canAskAgain,
  status: response.status,
  accuracy: response.android?.accuracy,
  scope: response.ios?.scope,
});

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in METRES
 */
export function calculateDistance(
  lat1: number | null | undefined,
  lon1: number | null | undefined,
  lat2: number | null | undefined,
  lon2: number | null | undefined
): number {
  if (
    !isValidLatitude(lat1) ||
    !isValidLongitude(lon1) ||
    !isValidLatitude(lat2) ||
    !isValidLongitude(lon2)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const R = 6371000; // Earth's radius in metres
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const clampedA = Math.min(1, Math.max(0, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function isValidLatitude(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;
}

/**
 * Request location permissions
 */
export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    const response = await Location.requestForegroundPermissionsAsync();
    return toLocationPermissionStatus(response);
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
    const response = await Location.getForegroundPermissionsAsync();
    return toLocationPermissionStatus(response);
  } catch (error) {
    console.error('[LocationService] Error checking permission:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: Location.PermissionStatus.DENIED,
    };
  }
}

async function ensureLocationPermission(): Promise<LocationPermissionStatus> {
  const permissionStatus = await checkLocationPermission();
  if (permissionStatus.granted || !permissionStatus.canAskAgain) {
    return permissionStatus;
  }

  return requestLocationPermission();
}

const toUserLocation = (loc: { coords: { latitude: number; longitude: number; accuracy?: number | null; heading?: number | null } }): UserLocation => ({
  latitude: loc.coords.latitude,
  longitude: loc.coords.longitude,
  accuracy: loc.coords.accuracy ?? undefined,
  heading: loc.coords.heading ?? undefined,
});

const normalizeHeading = (heading: number): number => ((heading % 360) + 360) % 360;

const toUserHeading = (heading: Location.LocationHeadingObject): UserHeading | null => {
  const rawHeading = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
  if (!Number.isFinite(rawHeading)) return null;

  return {
    heading: normalizeHeading(rawHeading),
    accuracy: heading.accuracy,
  };
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function getRecentLastKnownLocation(): Promise<UserLocation | null> {
  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: LAST_KNOWN_MAX_AGE_MS,
  });

  return lastKnown ? toUserLocation(lastKnown) : null;
}

async function watchForSingleLocation(): Promise<UserLocation | null> {
  let subscription: Location.LocationSubscription | null = null;

  return new Promise<UserLocation | null>((resolve) => {
    let settled = false;
    const finish = (location: UserLocation | null) => {
      if (settled) return;
      settled = true;
      if (subscription) subscription.remove();
      resolve(location);
    };

    const timeout = setTimeout(() => finish(null), WATCH_LOCATION_TIMEOUT_MS);

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 0,
        mayShowUserSettingsDialog: true,
      },
      (position) => {
        clearTimeout(timeout);
        finish(toUserLocation(position));
      },
      () => {
        clearTimeout(timeout);
        finish(null);
      }
    )
      .then((sub) => {
        if (settled) {
          sub.remove();
          return;
        }
        subscription = sub;
      })
      .catch(() => {
        clearTimeout(timeout);
        finish(null);
      });
  });
}

/**
 * Get current user location.
 * Foreground permission is enough for this path. We prefer a fresh high-accuracy fix so Android
 * "Allow only while using the app" and "Ask every time" sessions do not keep using stale cached
 * coordinates. A recent last-known point is used only as a fallback.
 */
export async function getCurrentLocation(): Promise<UserLocation | null> {
  try {
    const permissionStatus = await ensureLocationPermission();
    if (!permissionStatus.granted) return null;

    const current = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: Platform.OS === 'android',
      }).catch(() => null),
      FRESH_LOCATION_TIMEOUT_MS
    );

    if (current) return toUserLocation(current);

    const recentLastKnown = await getRecentLastKnownLocation();
    if (recentLastKnown) return recentLastKnown;

    if (Platform.OS === 'android') {
      const watchedLocation = await watchForSingleLocation();
      if (watchedLocation) return watchedLocation;
    }

    return null;
  } catch {
    try {
      return await getRecentLastKnownLocation();
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
    requestPermission?: boolean;
  }
): Promise<Location.LocationSubscription | null> {
  try {
    const permissionStatus = options?.requestPermission === false
      ? await checkLocationPermission()
      : await ensureLocationPermission();

    if (!permissionStatus.granted) {
      return null;
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: options?.accuracy ?? Location.Accuracy.Highest,
        timeInterval: options?.timeInterval ?? 1000,
        distanceInterval: options?.distanceInterval ?? 0,
        mayShowUserSettingsDialog: Platform.OS === 'android',
      },
      (location) => {
        callback(toUserLocation(location));
      },
      (error) => {
        console.error('[LocationService] Location watch update error:', error);
      }
    );

    return subscription;
  } catch (error) {
    console.error('[LocationService] Error watching location:', error);
    return null;
  }
}

/**
 * Watch device compass heading. Unlike GPS `coords.heading`, this updates when
 * the user turns in place, so map direction indicators can react immediately.
 */
export async function watchHeading(
  callback: (heading: UserHeading) => void,
  options?: {
    requestPermission?: boolean;
  }
): Promise<Location.LocationSubscription | null> {
  try {
    if (Platform.OS === 'web') return null;

    const permissionStatus = options?.requestPermission === false
      ? await checkLocationPermission()
      : await ensureLocationPermission();

    if (!permissionStatus.granted) {
      return null;
    }

    const subscription = await Location.watchHeadingAsync(
      (heading) => {
        const userHeading = toUserHeading(heading);
        if (userHeading) callback(userHeading);
      },
      (error) => {
        console.error('[LocationService] Heading watch update error:', error);
      }
    );

    return subscription;
  } catch (error) {
    console.error('[LocationService] Error watching heading:', error);
    return null;
  }
}

/**
 * Determine if a store is "nearby" based on distance threshold (default: 30 metres)
 */
export function isStoreNearby(
  userLat: number | null | undefined,
  userLon: number | null | undefined,
  storeLat: number | null | undefined,
  storeLon: number | null | undefined,
  thresholdMeters: number = 30
): boolean {
  const distance = calculateDistance(userLat, userLon, storeLat, storeLon);
  return distance <= thresholdMeters;
}
