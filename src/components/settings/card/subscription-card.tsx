import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { View, Text, TouchableOpacity } from "@/tw";
import { ChevronRight, CreditCard } from "lucide-react-native";
import { getAuthenticatedUserId, getManagerSubscription, getSubscriptionPlans } from "@/services/store-manager/subscription-service";
import { isPaidUnlimitedPlan } from "@/services/store-manager/subscription-limits";

export function SubscriptionCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      const ownerId = await getAuthenticatedUserId();
      if (!ownerId) {
        setIsPro(false);
        return;
      }

      const [plans, managerRow] = await Promise.all([
        getSubscriptionPlans(),
        getManagerSubscription(ownerId),
      ]);

      const planListForGate = (plans ?? [])
        .map((p: any) => ({
          id: Number(p.id),
          slug: p.slug != null ? String(p.slug) : null,
        }))
        .filter((p: any) => Number.isFinite(p.id));

      setIsPro(isPaidUnlimitedPlan(managerRow, planListForGate));
    } catch {
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPlan();
    }, [loadPlan]),
  );

  const planLabel = useMemo(() => (loading ? "—" : isPro ? "Pro Plan" : "Free Plan"), [isPro, loading]);

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
            Subscription
          </Text>
          <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
            {planLabel}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

