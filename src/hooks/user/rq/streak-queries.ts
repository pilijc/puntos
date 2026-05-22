import { useQuery } from "@tanstack/react-query";
import { userKeys } from "./query-keys";
import { supabase } from "@/supabase/supabase";
import { getUserStreakByStore } from "@/services/streak-service";
import { logger } from "@/utils/logger";

export function useStreakByStoreQuery(storeId: number | undefined) {
  return useQuery({
    queryKey: userKeys.streakByStore(storeId),
    queryFn: async () => {
      try {
        if (!storeId) return null;
        const { data, error } = await supabase.auth.getSession();
        const user = data?.session?.user;
        if (!user?.id || error) return null;
        return await getUserStreakByStore(user.id, storeId);
      } catch (e) {
        logger.error("[useStreakByStoreQuery] Error:", e);
        return null;
      }
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
