import { create } from "zustand";
import { getUserStamps, StampProgress } from "@/services/stamp-service";
import { supabase } from "@/supabase/supabase";

interface StampsState {
  stamps: StampProgress[];
  isLoading: boolean;
  error: Error | null;
  hasFetchedOnce: boolean;
  fetchStamps: () => Promise<void>;
  refetch: () => Promise<void>; 
}

export const useStamps = create<StampsState>((set, get) => ({
  stamps: [],
  isLoading: false,
  error: null,
  hasFetchedOnce: false,

  fetchStamps: async () => {
    // Only set loading true if it's the very first fetch, to prevent UI flashes on background refetches
    if (!get().hasFetchedOnce) {
      set({ isLoading: true, error: null });
    } else {
      set({ error: null });
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        set({ stamps: [], isLoading: false, hasFetchedOnce: true });
        return;
      }

      const data = await getUserStamps(user.id);
      set({ stamps: data, isLoading: false, hasFetchedOnce: true });
    } catch (e: any) {
      set({ error: e, isLoading: false, hasFetchedOnce: true });
    }
  },

  refetch: async () => {
    await get().fetchStamps();
  },
}));
