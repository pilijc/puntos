import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import {
  getCurrentLocation,
  checkLocationPermission,
  requestLocationPermission,
  UserLocation,
  LocationPermissionStatus,
  watchLocation,
  LocationSubscription,
} from '@/services/location-service';

export interface UseLocationReturn {
  location: UserLocation | null;
  permissionStatus: LocationPermissionStatus;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  isWatching: boolean;
  startWatching: () => Promise<void>;
  stopWatching: () => void;
}

/**
 * Hook to manage user location state and permissions
 */
export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>({
    granted: false,
    canAskAgain: true,
    status: Location.PermissionStatus.UNDETERMINED,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<LocationSubscription | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  // Check permission status on mount
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const status = await checkLocationPermission();
      setPermissionStatus(status);
      if (status.granted) {
        await refreshLocation();
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check location permission');
      setLoading(false);
    }
  };

  const requestPermission = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await requestLocationPermission();
      setPermissionStatus(status);
      if (status.granted) {
        await refreshLocation();
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request location permission');
      setLoading(false);
    }
  };

  const refreshLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
      } else {
        setError('Unable to get current location');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const startWatching = async () => {
    if (subscription) {
      subscription.remove();
    }
    if (!permissionStatus.granted) {
      await requestPermission();
    }
    if (permissionStatus.granted) {
      const sub = await watchLocation((loc) => {
        setLocation(loc);
      });
      if (sub) {
        setSubscription(sub);
        setIsWatching(true);
      }
    }
  };

  const stopWatching = useCallback(() => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
      setIsWatching(false);
    }
  }, [subscription]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [subscription]);

  return {
    location,
    permissionStatus,
    loading,
    error,
    requestPermission,
    refreshLocation,
    isWatching,
    startWatching,
    stopWatching,
  };
}
