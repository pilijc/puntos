import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDistance, getCurrentLocation, UserLocation, watchLocation, LocationSubscription } from '@/services/user/location-service';
import { syncLocationService, clearLocationService } from '@/services/user/settings-service';
import { useLocationStore } from '@/store/user/location-store';

//how long before we consider a gps coord stale
const LOCATION_EXPIRY_MS = 3 * 60 * 1000;

//how often we push latest gps coords to the db while the app is active
const LIVE_SYNC_INTERVAL_MS = 30000;

// Avoid rewriting the same coordinate if the provider emits a duplicate fix.
const MIN_SYNC_DISTANCE_METERS = 30;

const LAST_SYNC_KEY = 'location_last_sync_time';

// save the current time to the phone's local storage
async function saveSyncTime(): Promise<void> {
    try {
        await AsyncStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
    } catch (e) {
        console.error('[useLocationSync] Failed to save sync time:', e);
    }
}

// returns a number (timestamp in ms) or null if never synced.
async function readSyncTime(): Promise<number | null> {
    try {
        const value = await AsyncStorage.getItem(LAST_SYNC_KEY);
        return value != null ? Number(value) : null;
    } catch (e) {
        console.error('[useLocationSync] Failed to read sync time:', e);
        return null;
    }
}

// remove the saved sync time (used when we intentionally clear location)
async function clearSyncTime(): Promise<void> {
    try {
        await AsyncStorage.removeItem(LAST_SYNC_KEY);
    } catch (e) {
        console.error('[useLocationSync] Failed to clear sync time:', e);
    }
}

export function useLocationSync(userId: string | undefined, syncEnabled: boolean) {
    const lastSyncTimeRef = useRef<number | null>(null);
    const lastSyncedLocationRef = useRef<UserLocation | null>(null);
    const syncInFlightRef = useRef(false);
    const pendingLocationRef = useRef<UserLocation | null>(null);
    const locationWatchRef = useRef<LocationSubscription | null>(null);
    const setGlobalLocation = useLocationStore((state) => state.setGlobalLocation);

    // when the hook first mounts (app just opened), read the persisted timestamp
    // from AsyncStorage and check immediately if the location is already stale.
    useEffect(() => {
        if (!userId || !syncEnabled) return;

        const checkOnStartup = async () => {
            const savedTime = await readSyncTime();

            if (savedTime === null) {
                return;
            }

            lastSyncTimeRef.current = savedTime;

            const timeSinceLastSync = Date.now() - savedTime;

            if (timeSinceLastSync > LOCATION_EXPIRY_MS) {
                console.log('[useLocationSync] Stale location detected on startup. Clearing from DB.');
                try {
                    await clearLocationService(userId);
                    await clearSyncTime();
                    lastSyncTimeRef.current = null;
                } catch (e) {
                    console.error('[useLocationSync] Failed to clear stale location on startup:', e);
                }
            }
        };

        checkOnStartup();
    }, [syncEnabled, userId]);

    // --- MAIN SYNC LOGIC ---
    useEffect(() => {
        if (!userId) return;

        //case: loc sharing turned off by user. this is the place that intentionally clears the DB location
        if (!syncEnabled) {
            locationWatchRef.current?.remove();
            locationWatchRef.current = null;
            lastSyncedLocationRef.current = null;
            pendingLocationRef.current = null;
            syncInFlightRef.current = false;
            clearLocationService(userId).catch((e) => {
                console.error('[useLocationSync] Failed to clear location on disable:', e);
            });
            clearSyncTime();
            lastSyncTimeRef.current = null;
            return;
        }

        let cancelled = false;

        const stopLocationWatch = () => {
            locationWatchRef.current?.remove();
            locationWatchRef.current = null;
        };

        const shouldSyncLocation = (loc: UserLocation) => {
            const now = Date.now();
            const lastSyncTime = lastSyncTimeRef.current;
            const lastLocation = lastSyncedLocationRef.current;

            if (lastSyncTime !== null && now - lastSyncTime < LIVE_SYNC_INTERVAL_MS) {
                return false;
            }

            if (!lastLocation) {
                return true;
            }

            const distanceMeters = calculateDistance(
                lastLocation.latitude,
                lastLocation.longitude,
                loc.latitude,
                loc.longitude,
            );

            return distanceMeters >= MIN_SYNC_DISTANCE_METERS;
        };

        const syncLocation = async (loc: UserLocation, force = false) => {
            setGlobalLocation(loc);

            if (!force && !shouldSyncLocation(loc)) {
                return;
            }

            if (syncInFlightRef.current) {
                pendingLocationRef.current = loc;
                return;
            }

            syncInFlightRef.current = true;
            try {
                await syncLocationService(userId, loc.latitude, loc.longitude);
                lastSyncedLocationRef.current = loc;
                lastSyncTimeRef.current = Date.now();
                await saveSyncTime();
            } catch (e) {
                console.error('[useLocationSync] Sync failed:', e);
            } finally {
                syncInFlightRef.current = false;

                const pending = pendingLocationRef.current;
                pendingLocationRef.current = null;
                if (pending && !cancelled) {
                    syncLocation(pending);
                }
            }
        };

        const startLiveSync = async () => {
            stopLocationWatch();

            const current = await getCurrentLocation();
            if (current && !cancelled) {
                await syncLocation(current, true);
            }

            if (cancelled) return;

            const subscription = await watchLocation(
                (loc) => {
                    syncLocation(loc);
                },
                {
                    accuracy: Location.Accuracy.Highest,
                    timeInterval: LIVE_SYNC_INTERVAL_MS,
                    distanceInterval: 0,
                    requestPermission: true,
                },
            );

            if (cancelled) {
                subscription?.remove();
                return;
            }

            locationWatchRef.current = subscription;
        };

        startLiveSync();

        const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                startLiveSync();
            } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                stopLocationWatch();
            }
        });

        // EXPIRE WATCHER: checks every 30secs if the last sync was too long ago
        // what if scenario: phone turns off after leaving a store
        // when phone comes back on, if >3mins have passed, clear db location
        const expiryIntervalId = setInterval(async () => {
            let lastSyncTime = lastSyncTimeRef.current;

            // Fallback: re-read from storage if the in-memory ref was somehow reset
            if (lastSyncTime === null) {
                lastSyncTime = await readSyncTime();
                if (lastSyncTime !== null) {
                    lastSyncTimeRef.current = lastSyncTime;
                }
            }

            if (lastSyncTime === null) return; // Truly never synced

            const timeSinceLastSync = Date.now() - lastSyncTime;

            if (timeSinceLastSync > LOCATION_EXPIRY_MS) {
                console.log('[useLocationSync] Location stale. Clearing from DB.');
                try {
                    await clearLocationService(userId);
                    await clearSyncTime();
                    lastSyncTimeRef.current = null;
                } catch (e) {
                    console.error('[useLocationSync] Failed to clear stale location:', e);
                }
            }
        }, 30 * 1000);

        return () => {
            cancelled = true;
            appStateSubscription.remove();
            stopLocationWatch();
            clearInterval(expiryIntervalId);
        };
    }, [setGlobalLocation, syncEnabled, userId]);
}
