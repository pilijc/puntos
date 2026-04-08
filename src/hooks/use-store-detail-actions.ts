import { addStamp } from "@/services/stamp-service";
import { supabase } from "@/supabase/supabase";
import { useRewardsUiStore } from "@/store/user/rewards-ui-store";
import { useStampRewards } from "@/hooks/use-stamp-rewards";
import { useStamps } from "@/hooks/use-stamps";
import { useCallback } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

export function useStoreDetailActions(storeId?: string) {
  const { t: translate } = useTranslation();
  const {
    isStamping,
    setIsStamping,
    refreshing,
    setRefreshing,
  } = useRewardsUiStore();
  const { refetch: refetchStamps } = useStamps();
  const { refetch: refetchStampRewards } = useStampRewards();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchStamps(), refetchStampRewards()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchStampRewards, refetchStamps, setRefreshing]);

  const handleStamp = useCallback(async () => {
    if (!storeId) return;

    setIsStamping(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        Alert.alert(
          translate("label.error"),
          translate("user.rewards.messages.signInToStamp"),
        );
        return;
      }

      const result = await addStamp(user.id, storeId);
      if (result.success) {
        Alert.alert(
          translate("label.success"),
          translate("user.rewards.messages.stampSuccess"),
        );
        await Promise.all([refetchStamps(), refetchStampRewards()]);
        return;
      }

      if (result.reason === "already_stamped_today") {
        Alert.alert(
          translate("label.notice"),
          translate("user.rewards.messages.alreadyStamped"),
        );
      } else if (result.reason === "already_completed") {
        // ✅ Stamp card fully completed — blocked at the cap
        Alert.alert(
          translate("label.notice"),
          "You've already completed your stamp card for this store! 🎉",
        );
      } else if (result.reason === "stamp_not_enabled") {
        Alert.alert(
          translate("label.notice"),
          translate("user.rewards.messages.stampDisabled"),
        );
      } else {
        Alert.alert(
          translate("label.error"),
          translate("user.rewards.messages.stampFailed"),
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        translate("label.error"),
        translate("label.somethingWentWrong"),
      );
    } finally {
      setIsStamping(false);
    }
  }, [refetchStampRewards, refetchStamps, setIsStamping, storeId, translate]);

  return {
    isStamping,
    refreshing,
    onRefresh,
    handleStamp,
  };
}
