import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity } from "@/tw";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { supabase } from "@/supabase/supabase";
import { getSubscriptionPaymentStatus } from "@/services/store-manager/subscription-service";
import { useTranslation } from "react-i18next";
import { getQueryClient } from "@/lib/query-client";
import { storeManagerKeys } from "@/hooks/store-manager/rq/query-keys";

export default function SubscriptionSuccessScreen() {
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [triesLeft, setTriesLeft] = useState(10);
  const { t: translate } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let remaining = 10;

    async function tick() {
      if (cancelled) return;
      if (remaining <= 0) {
        setVerifying(false);
        setTriesLeft(0);
        return;
      }

      setTriesLeft(remaining);

      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) {
        setVerifying(false);
        return;
      }

      const status = await getQueryClient().fetchQuery({
        queryKey: storeManagerKeys.subscriptionPaymentStatus(userId),
        queryFn: () => getSubscriptionPaymentStatus(userId),
      });
      if (cancelled) return;

      if (status === "paid") {
        setVerifying(false);
        router.replace("/(store_manager)/subscription");
        return;
      }

      remaining -= 1;
      timer = setTimeout(tick, 1500);
    }

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <View className="flex-1 items-center justify-center px-6 bg-white dark:bg-neutral-900">
        <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary text-center">
          {translate("store_manager.subscription.success.title")}
        </Text>
        <Text className="mt-2 text-sm font-poppins text-textSecondary dark:text-darkTextSecondary text-center">
          {verifying ? translate("store_manager.subscription.success.verifying") : translate("store_manager.subscription.success.body")}
        </Text>
        {verifying ? (
          <View className="mt-4 items-center">
            <ActivityIndicator />
            <Text className="mt-2 text-xs font-poppins text-textMuted dark:text-darkTextMuted">
              {translate("store_manager.subscription.success.waitingWebhook", { tries: triesLeft })}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          className="mt-6 px-5 py-3 rounded-xl bg-[#FF6600]"
          activeOpacity={0.85}
          onPress={() => router.replace("/(store_manager)/subscription")}
        >
          <Text className="text-sm font-poppins-semibold text-white">
            {translate("store_manager.subscription.success.back")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
