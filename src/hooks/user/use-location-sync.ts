import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentLocation } from '@/services/user/location-service';
import { syncLocationService, clearLocationService } from '@/services/user/settings-service';

//how long before we consider a gps coord stale
const LOCATION_EXPIRY_MS = 3 * 60 * 1000;

//how often we push lastest gps coords to the db
const SYNC_INTERVAL_MS = 60 * 1000;

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
    }, []);

    // --- MAIN SYNC LOGIC ---
    useEffect(() => {
        if (!userId) return;

        //case: loc sharing turned off by user. this is the place that intentionally clears the DB location
        if (!syncEnabled) {
            clearLocationService(userId).catch((e) => {
                console.error('[useLocationSync] Failed to clear location on disable:', e);
            });
            clearSyncTime();
            lastSyncTimeRef.current = null;
            return;
        }

        // case: set the current gps position and save it to the db
        const syncToDB = async () => {
            try {
                const loc = await getCurrentLocation();
                if (loc) {
                    await syncLocationService(userId, loc.latitude, loc.longitude);
                    lastSyncTimeRef.current = Date.now();
                    await saveSyncTime();
                }
            } catch (e) {
                console.error('[useLocationSync] Sync failed:', e);
            }
        };

        // sync immediately on start, then every 60 seconds
        syncToDB();
        const syncIntervalId = setInterval(syncToDB, SYNC_INTERVAL_MS);

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
            clearInterval(syncIntervalId);
            clearInterval(expiryIntervalId);
        };
    }, [syncEnabled, userId]);
}