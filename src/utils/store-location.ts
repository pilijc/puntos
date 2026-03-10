import { Store } from '@/type/store';
import { calculateDistance, isStoreNearby, UserLocation } from '@/services/location-service';

export interface StoreWithLocation extends Store {
  calculatedDistanceMeters?: number;
  calculatedIsNearby?: boolean;
  distanceMeters: number; // For UI display
  isNearby: boolean; // For filtering
}

/**
 * Enrich store data with calculated distance and nearby status based on user location
 * Stores are returned sorted by distance.
 */
export function enrichStoresWithLocation(
  stores: Store[],
  userLocation: UserLocation | null
): StoreWithLocation[] {
  if (!userLocation) {
    // If no location, return stores with default distance/isNearby values
    return stores.map(store => ({
      ...store,
      calculatedDistanceMeters: 0,
      calculatedIsNearby: false,
      distanceMeters: 0,
      isNearby: false,
    }));
  }

  const enriched = stores.map(store => {
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
        store.radius ?? 30
      );

      return {
        ...store,
        calculatedDistanceMeters: distance,
        calculatedIsNearby: nearby,
        distanceMeters: distance, // Update the distanceMeters for display
        isNearby: nearby, // Update isNearby for filtering
      };
    }

    // Fallback: if somehow a real DB store has no lat/lon
    return {
      ...store,
      calculatedDistanceMeters: Infinity,
      calculatedIsNearby: false,
      distanceMeters: Infinity,
      isNearby: false,
    };
  });

  return enriched.sort((a, b) => a.distanceMeters - b.distanceMeters);
}
