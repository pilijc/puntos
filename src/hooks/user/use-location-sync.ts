import { useEffect, useRef } from 'react';
import { getCurrentLocation } from '@/services/user/location-service';
import { syncLocationService, clearLocationService } from '@/services/user/settings-service';

//how long before we consider a gps coord stale
const LOCATION_EXPIRY_MS = 3 * 60 * 1000;

//how often we push lastest gps coords to the db
const SYNC_INTERVAL_MS = 60 * 1000;

export function useLocationSync(userId: string | undefined, syncEnabled: boolean) {
    const lastSyncTimeRef = useRef<number | null>(null);
    
    useEffect(() => {
        if (!userId) return;

        //case: loc sharing turned off by user. this is the place that intentionally clears the DB location
        if (!syncEnabled) {
            clearLocationService(userId).catch((e) => {
                console.error('[useLocationSync] Failed to clear location on disable:', e);
            });
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
                }
            } catch (e) {
                console.error('[useLocationSync] Sync failed:', e);
            }
        };

        syncToDB();

        const syncIntervalId = setInterval(syncToDB, SYNC_INTERVAL_MS);

        // EXPIRE WATCHER: checks every 30secs if the last sync was too long ago
        // what if scenario: phone turns off after leaving a store
        // when phone comes back on, if >3mins have passed, clear db location
        const expiryIntervalId = setInterval(async () => {
            if (lastSyncTimeRef.current === null) return;
            
            const timeSinceLastSync = Date.now() - lastSyncTimeRef.current;

            if (timeSinceLastSync > LOCATION_EXPIRY_MS) {
                console.log('[useLocationSync] Location stale. Clearing from DB.');
                try {
                    await clearLocationService(userId);
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