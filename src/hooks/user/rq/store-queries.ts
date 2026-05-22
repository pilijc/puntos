import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/supabase";
import { storeKeys } from "./query-keys";
import { getActiveStreakProgramsByStore, getStoresWithEnabledStreaks } from "@/services/stamp-service";
import { logger } from "@/utils/logger";

export function useStoreFeaturesQuery(storeIds: number[]) {
  return useQuery({
    queryKey: storeKeys.features(storeIds),
    queryFn: async () => {
      if (storeIds.length === 0) return new Map();
      const { data, error } = await supabase
        .from("store_feature")
        .select("store_id, stamp_enabled, streak_enabled")
        .in("store_id", storeIds);

      if (error) {
        logger.warn("[StoreFeatures] fetch failed:", error.message);
        return new Map();
      }
      const map = new Map<number, { stamp_enabled: boolean; streak_enabled: boolean }>();
      (data ?? []).forEach((row: any) => {
        map.set(Number(row.store_id), {
          stamp_enabled: row.stamp_enabled === true,
          streak_enabled: row.streak_enabled === true,
        });
      });
      return map;
    },
    enabled: storeIds.length > 0,
  });
}

export function useActiveStreakProgramsQuery(storeIds: number[]) {
  return useQuery({
    queryKey: storeKeys.activeStreakPrograms(storeIds),
    queryFn: async () => {
      if (storeIds.length === 0) return new Map();
      return await getActiveStreakProgramsByStore(storeIds);
    },
    enabled: storeIds.length > 0,
  });
}

export function useEnabledStreaksQuery(storeIds: number[]) {
  return useQuery({
    queryKey: storeKeys.enabledStreaks(storeIds),
    queryFn: async () => {
      if (storeIds.length === 0) return [];
      return await getStoresWithEnabledStreaks(storeIds);
    },
    enabled: storeIds.length > 0,
  });
}
