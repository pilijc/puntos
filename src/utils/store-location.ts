import { StoreItem } from '@/data/rewards';
import { calculateDistance, isStoreNearby, UserLocation } from '@/services/location-service';

export interface StoreWithLocation extends StoreItem {
  latitude?: number;
  longitude?: number;
  calculatedDistanceMiles?: number;
  calculatedIsNearby?: boolean;
}

/**
 * Enrich store data with calculated distance and nearby status based on user location
 */
export function enrichStoresWithLocation(
  stores: StoreItem[],
  userLocation: UserLocation | null,
  nearbyThresholdMiles: number = 2.0
): StoreWithLocation[] {
  if (!userLocation) {
    // If no location, return stores with original distance/isNearby values
    return stores.map(store => ({
      ...store,
      calculatedDistanceMiles: store.distanceMiles,
      calculatedIsNearby: store.isNearby,
    }));
  }

  return stores.map(store => {
    // If store has lat/lon from database, use it; otherwise use mock data
    const storeLat = (store as any).latitude;
    const storeLon = (store as any).longitude;

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
        latitude: storeLat,
        longitude: storeLon,
        calculatedDistanceMiles: distance,
        calculatedIsNearby: nearby,
        distanceMiles: distance, // Update the distanceMiles for display
        isNearby: nearby, // Update isNearby for filtering
      };
    }

    // Fallback: use existing mock data if no lat/lon
    return {
      ...store,
      calculatedDistanceMiles: store.distanceMiles,
      calculatedIsNearby: store.isNearby,
    };
  });
}
