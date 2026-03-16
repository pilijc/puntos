import { useCallback } from "react";
import { Alert } from "react-native";
import { useRewardsUiStore } from "@/store/rewards-ui-store";
import { useRewardsDataStore } from "@/store/rewards-data-store";
import { useStamps } from "@/hooks/use-stamps";
import { useStampRewards } from "@/hooks/use-stamp-rewards";
import { addStamp } from "@/services/stamp-service";
import { supabase } from "@/supabase/supabase";
import { getHasStampedToday } from "@/utils/store-helpers";

export function useRewardsActions() {
  const { 
    setIsStamping, 
    setRefreshing, 
    rewardSort, 
    rewardPointsOrder,
  } = useRewardsUiStore();
  
  const { fetchBackendRewards } = useRewardsDataStore();
  const { stamps, refetch: refetchStamps } = useStamps();
  const { refetch: refetchStampRewards } = useStampRewards();

  const handleRefresh = useCallback(async (storeId?: string) => {
    setRefreshing(true);
    try {
      const promises: Promise<any>[] = [refetchStamps(), refetchStampRewards()];
      
      // If we are on a store details page, also refresh backend rewards
      if (storeId) {
        promises.push(fetchBackendRewards({ 
          storeId, 
          sortBy: rewardSort, 
          pointsOrder: rewardPointsOrder 
        }));
      }

      await Promise.all(promises);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [setRefreshing, refetchStamps, refetchStampRewards, fetchBackendRewards, rewardSort, rewardPointsOrder]);

  const handleStamp = useCallback(async (storeId: string) => {
    setIsStamping(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        Alert.alert("Error", "You must be logged in to collect stamps.");
        return;
      }

      const result = await addStamp(user.id, storeId);
      if (result.success) {
        Alert.alert("Success!", "Stamp collected successfully!");
        await handleRefresh(storeId);
      } else {
        const messages: Record<string, string> = {
          already_stamped_today: "You have already collected a stamp today at this store.",
          stamp_not_enabled: "Stamping is currently disabled for this store.",
          not_nearby: "You must be near the store to collect a stamp."
        };
        Alert.alert("Notice", messages[result.reason || ""] || "Failed to collect stamp.");
      }
    } catch (error) {
      console.error("Stamping failed:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setIsStamping(false);
    }
  }, [setIsStamping, handleRefresh]);

  const hasStampedToday = useCallback((storeId: number) => {
    const stampProgress = stamps.find(s => Number(s.store_id) === storeId);
    return getHasStampedToday(stampProgress?.last_stamp_at);
  }, [stamps]);

  return {
    handleRefresh,
    handleStamp,
    hasStampedToday,
  };
}
