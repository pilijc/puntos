import { create } from "zustand";
import { getUserStreaks, UserStreak } from "@/services/streak-service";
import { supabase } from "@/supabase/supabase";
import { logger } from "@/utils/logger";

interface StreaksState {
  streaks: UserStreak[];
  isLoading: boolean;
  error: Error | null;
  hasFetchedOnce: boolean;
  fetchStreaks: () => Promise<void>;
  refetch: () => Promise<void>; 
}

export const useStreaks = create<StreaksState>((set, get) => ({
  streaks: [],
  isLoading: false,
  error: null,
  hasFetchedOnce: false,

  fetchStreaks: async () => {
    logger.debug("[useStreaks] 🚀 Starting fetchStreaks, hasFetchedOnce:", get().hasFetchedOnce);
    
    // Only set loading true if it's the very first fetch, to prevent UI flashes on background refetches
    if (!get().hasFetchedOnce) {
      set({ isLoading: true, error: null });
      logger.debug("[useStreaks] 🔄 First fetch - showing loading state");
    } else {
      set({ error: null });
      logger.debug("[useStreaks] 🔄 Background refetch - silent mode");
    }

    try {
      // getSession() uses the locally cached token — no network round-trip.
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user?.id) {
        logger.warn("[useStreaks] ⚠️ No user found in session");
        set({ streaks: [], isLoading: false, hasFetchedOnce: true });
        return;
      }

      logger.debug("[useStreaks] 👤 Fetching streaks for user:", user.id);
      const data = await getUserStreaks(user.id);
      logger.debug("[useStreaks] 📊 Streaks fetched successfully:", {
        count: data.length,
        streaks: data.map(s => ({
          id: s.id,
          store_name: s.stores?.name,
          streak_days: s.streak_days,
          status: s.status,
        })),
      });
      set({ streaks: data, isLoading: false, hasFetchedOnce: true });
    } catch (e: any) {
      logger.error("[useStreaks] 💥 Error fetching streaks:", e);
      set({ error: e, isLoading: false, hasFetchedOnce: true });
    }
  },

  refetch: async () => {
    logger.debug("[useStreaks] 🔃 Refetch called");
    await get().fetchStreaks();
  },
}));
