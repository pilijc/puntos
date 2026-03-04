import { Store } from '@/type/store';
import { calculateDistance, isStoreNearby, UserLocation } from '@/services/location-service';

export interface StoreWithLocation extends Store {
  calculatedDistanceMiles?: number;
  calculatedIsNearby?: boolean;
  distanceMiles: number; // For UI display
  isNearby: boolean; // For filtering
}

/**
 * Enrich store data with calculated distance and nearby status based on user location
 */
export function enrichStoresWithLocation(
  stores: Store[],
  userLocation: UserLocation | null,
  nearbyThresholdMiles: number = 2.0
): StoreWithLocation[] {
  if (!userLocation) {
    // If no location, return stores with default distance/isNearby values
    return stores.map(store => ({
      ...store,
      calculatedDistanceMiles: 0,
      calculatedIsNearby: false,
      distanceMiles: 0,
      isNearby: false,
    }));
  }

  return stores.map(store => {
    // We expect Store to have latitude and longitude
    const storeLat = store.latitude;
    const storeLon = store.longitude;

    if (storeLat != null && storeLon != null) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        storeLat,
        storeLon
      );
      const nearby = isStoreNearby(
        userLocation.latitude,
        userLocation.longitude,
        storeLat,
        storeLon,
        nearbyThresholdMiles
      );

      return {
        ...store,
        calculatedDistanceMiles: distance,
        calculatedIsNearby: nearby,
        distanceMiles: distance, // Update the distanceMiles for display
        isNearby: nearby, // Update isNearby for filtering
      };
    }

    // Fallback: if somehow a real DB store has no lat/lon
    return {
      ...store,
      calculatedDistanceMiles: 0,
      calculatedIsNearby: false,
      distanceMiles: 0,
      isNearby: false,
    };
  });
}
