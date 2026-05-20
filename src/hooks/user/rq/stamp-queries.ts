import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/supabase";
import { stampKeys } from "./query-keys";
import {
  getUserStamps,
  getStampEventsForStore,
  getUserStampEvents,
  getUserRewardRedemptions,
  getActiveStampProgramRewards,
} from "@/services/stamp-service";

export function useStampsQuery(userId?: string) {
  return useQuery({
    queryKey: stampKeys.userStamps(userId ?? "unknown"),
    queryFn: async () => {
      if (!userId) return [];
      return await getUserStamps(userId);
    },
    enabled: !!userId,
  });
}

export function useStampEventsQuery(userId?: string, storeId?: number) {
  return useQuery({
    queryKey: stampKeys.events(userId ?? "unknown", storeId),
    queryFn: async () => {
      if (!userId) return [];
      if (storeId) {
        return await getStampEventsForStore(userId, storeId);
      }
      return await getUserStampEvents(userId);
    },
    enabled: !!userId,
  });
}

export function useRewardRedemptionsQuery(userId?: string, storeId?: number) {
  return useQuery({
    queryKey: stampKeys.redemptions(userId ?? "unknown", storeId),
    queryFn: async () => {
      if (!userId) return [];
      return await getUserRewardRedemptions(userId, storeId);
    },
    enabled: !!userId,
  });
}

export function useActiveStampProgramsQuery(storeIds: number[]) {
  return useQuery({
    queryKey: stampKeys.activePrograms(storeIds),
    queryFn: async () => {
      if (storeIds.length === 0) return [];
      return await getActiveStampProgramRewards(storeIds);
    },
    enabled: storeIds.length > 0,
  });
}
