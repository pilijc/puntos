import React, { useMemo } from "react";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity } from "@/tw";
import { ChevronRight, CreditCard } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { isPaidUnlimitedPlan } from "@/services/store-manager/subscription-limits";
import {
  useAuthenticatedUserIdQuery,
  useSubscriptionPlansQuery,
  useManagerSubscriptionQuery,
} from "@/hooks/store-manager/rq/subscription-queries";

export function SubscriptionCard() {
  const { t: translate } = useTranslation();
  const router = useRouter();
  const { data: ownerId, isPending: authPending } = useAuthenticatedUserIdQuery();
  const plansQuery = useSubscriptionPlansQuery(Boolean(ownerId));
  const subQuery = useManagerSubscriptionQuery(ownerId ?? undefined);

  const loading =
    authPending || (Boolean(ownerId) && (plansQuery.isPending || subQuery.isPending));

  const isPro = useMemo(() => {
    if (!ownerId || !plansQuery.data || subQuery.data === undefined) return false;
    const planListForGate = (plansQuery.data ?? [])
      .map((p: any) => ({
        id: Number(p.id),
        slug: p.slug != null ? String(p.slug) : null,
      }))
      .filter((p: any) => Number.isFinite(p.id));
    return isPaidUnlimitedPlan(subQuery.data, planListForGate);
  }, [ownerId, plansQuery.data, subQuery.data]);

  const planLabel = useMemo(
    () =>
      loading
        ? "—"
        : isPro
          ? translate("settings.subscription.proPlan", "Pro Plan")
          : translate("settings.subscription.freePlan", "Free Plan"),
    [isPro, loading, translate],
  );

  return (
    <View className="bg-white dark:bg-darkBackground px-2.5 py-3 overflow-hidden">
      <TouchableOpacity
        onPress={() => router.push("/(store_manager)/subscription")}
        className="flex-row items-center"
        activeOpacity={0.7}
      >
        <View className="h-8 w-8 -mt-0.5 rounded-lg items-center justify-center">
          <CreditCard size={15} color="#FF6600" />
        </View>

        <View className="flex-1 ml-2">
          <Text className="text-md font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
            {translate("settings.subscription.title", "Subscription")}
          </Text>
          <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
            {planLabel}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
