import { create } from 'zustand';
import { UserLocation } from '@/services/user/location-service';

interface LocationStoreState {
    globalLocation: UserLocation | null;
    setGlobalLocation: (loc: UserLocation | null) => void;
}

export const useLocationStore = create<LocationStoreState>((set) => ({
    globalLocation: null,
    setGlobalLocation: (loc) => set({ globalLocation: loc}),
}));