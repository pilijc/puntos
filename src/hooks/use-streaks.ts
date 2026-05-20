import { create } from "zustand";
import { getUserStreaks, UserStreak } from "@/services/streak-service";
import { supabase } from "@/supabase/supabase";

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
    // Only set loading true if it's the very first fetch, to prevent UI flashes on background refetches
    if (!get().hasFetchedOnce) {
      set({ isLoading: true, error: null });
    } else {
      set({ error: null });
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user?.id) {
        set({ streaks: [], isLoading: false, hasFetchedOnce: true });
        return;
      }

      const data = await getUserStreaks(user.id);
      set({ streaks: data, isLoading: false, hasFetchedOnce: true });
    } catch (e: any) {
      console.error("[useStreaks] Error fetching streaks:", e);
      set({ error: e, isLoading: false, hasFetchedOnce: true });
    }
  },

  refetch: async () => {
    await get().fetchStreaks();
  },
}));
