import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Platform } from "react-native";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { View, Text } from "@/tw";
import { useSubscriptionConfigStore } from "@/store/super-admin/subscription-config";
import { useSuperAdminStoresStore } from "@/store/super-admin/super-admin-stores-store";
import { AdminStoreRow } from "@/services/store-service";
import { CircleDollarSign, AlertTriangle, CalendarDays } from "lucide-react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Toggle } from "@/components/toggle";
import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import { Modal } from "@/components/modal";
import { supabase } from "@/supabase/supabase";
import { upsertManagerSubscriptionByOwner } from "@/services/store-manager/subscription-service";

export default function SubscriptionConfig() {
  const { t: translate } = useTranslation();
  const config = useSubscriptionConfigStore();
  const { stores, fetchStores } = useSuperAdminStoresStore();

  const [limit, setLimit] = useState(config.FREE_STORES_LIMIT.toString());
  const [price, setPrice] = useState(config.SUBSCRIPTION_PRICE_PHP.toString());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase.from("manager_subscriptions").select("*");
    if (!error && data) {
      setSubscriptions(data);
      config.setEnforcedOwners(data.filter((s) => s.is_enforced).map((s) => s.owner_id));
    }
  };

  React.useEffect(() => {
    fetchStores();
    fetchSubscriptions();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    config.updateLimit(parseInt(limit, 10));
    config.updatePrice(parseFloat(price));

    try {
      const overLimitOwnerIds = new Set(ownersOverLimit.map((m) => m.owner_id));
      const enabledOwners = config.enforced_owner_ids.filter((id) => overLimitOwnerIds.has(id));
      const disabledOwners = [...overLimitOwnerIds].filter(
        (id) => !config.enforced_owner_ids.includes(id),
      );

      for (const ownerId of enabledOwners) {
        const { error } = await upsertManagerSubscriptionByOwner(ownerId, {
          is_enforced: true,
          payment_status: "unpaid",
        });
        if (error) console.error("Error upserting manager subscription:", error.message);
      }

      for (const ownerId of disabledOwners) {
        const { error } = await supabase
          .from("manager_subscriptions")
          .update({ is_enforced: false })
          .eq("owner_id", ownerId);
        if (error) console.error("Error clearing enforcement:", error.message);
      }
    } catch (e) {
      console.error(e);
    }

    setIsSaving(false);
    setShowSuccessModal(true);
    fetchSubscriptions();
  };

  const subscribedManagers = React.useMemo(() => {
    return subscriptions.map((sub) => {
      const store = stores.find((s) => s.owner_id === sub.owner_id);
      return {
        ...sub,
        display_name: store?.owner_name || sub.owner_id,
      };
    });
  }, [subscriptions, stores]);

  const ownersOverLimit = React.useMemo(() => {
    const ownerStoreMap: Record<
      string,
      { owner_id: string; owner_name: string; activeCount: number; stores: AdminStoreRow[] }
    > = {};
    stores.forEach((s) => {
      if (!s.owner_id) return;
      if (!ownerStoreMap[s.owner_id]) {
        ownerStoreMap[s.owner_id] = {
          owner_id: s.owner_id,
          owner_name: s.owner_name || "Unknown",
          activeCount: 0,
          stores: [],
        };
      }
      const isActive = s.status === "active" || s.is_active;
      if (isActive) ownerStoreMap[s.owner_id].activeCount += 1;
      if (s.status === "pending_review" || !s.status) ownerStoreMap[s.owner_id].stores.push(s);
    });

    return Object.values(ownerStoreMap).filter(
      (item) => item.activeCount >= config.FREE_STORES_LIMIT && item.stores.length > 0,
    );
  }, [stores, config.FREE_STORES_LIMIT]);

  return (
    <ScreenWrapper className="flex-1 bg-backgroundMuted dark:bg-darkBackground">

      {/* ── Header ── */}
      {/* ── Main Header (Uniform Style) ── */}
      <View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-6 py-3">
        <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary py-1">{translate("super_admin.subscription.title")}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-slate-100 dark:border-neutral-800 p-4 mb-4">
          <View className="flex-row items-center justify-between bg-slate-50 dark:bg-darkBackgroundMuted rounded-xl p-4 border border-slate-100 dark:border-neutral-700 mb-4">
            <View className="flex-1 pr-4">
              <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-darkTextPrimary">{translate("super_admin.subscription.config.enforce")}</Text>
              <Text className="text-[10px] font-poppins text-slate-500 dark:text-darkTextMuted leading-4 mt-1">
                Require Store Managers to pay after exceeding the free store limit.
              </Text>
            </View>
            <Toggle size="sm" value={config.ENFORCE_SUBSCRIPTION} onValueChange={config.toggleEnforce} />
          </View>

          <View className="flex-row items-center gap-2 mb-3">
            <CircleDollarSign size={16} color="#FF6600" />
            <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100">{translate("super_admin.subscription.config.parameters")}</Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField
                label={translate("super_admin.subscription.config.limitLabel")}
                value={limit}
                onChangeText={setLimit}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <TextField
                label={translate("super_admin.subscription.config.priceLabel")}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {subscribedManagers.length > 0 && (
          <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-slate-100 dark:border-neutral-800 p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <CalendarDays size={16} color="#10B981" />
              <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100">{translate("super_admin.subscription.config.managerSubs")}</Text>
            </View>

            <Text className="text-[10px] font-poppins text-slate-500 dark:text-darkTextMuted leading-4 mb-4 px-0.5">
              Billing state per store manager (owner).
            </Text>

            <View className="bg-slate-50 dark:bg-darkBackgroundMuted rounded-xl border border-slate-100 dark:border-neutral-800 px-4">
              {subscribedManagers.map((sub, i) => {
                const isLast = i === subscribedManagers.length - 1;
                const isPaid = sub.payment_status === "paid";
                return (
                  <View
                    key={sub.id ?? sub.owner_id}
                    className={`py-3 ${!isLast ? "border-b border-slate-200 dark:border-neutral-700" : ""}`}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text
                        className="text-[13px] font-poppins-medium text-slate-800 dark:text-slate-100"
                        numberOfLines={1}
                      >
                        {sub.display_name}
                      </Text>
                      <View
                        className={`px-2 py-0.5 rounded-full ${isPaid ? "bg-emerald-100/50 border border-emerald-200" : "bg-red-100/50 border border-red-200"}`}
                      >
                        <Text
                          className={`text-[8px] font-poppins-bold uppercase tracking-wider ${isPaid ? "text-emerald-700" : "text-red-700"}`}
                        >
                          {translate("label." + (sub.payment_status || "unpaid"))}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-[10px] font-poppins-medium text-slate-500 dark:text-darkTextMuted">
                        {sub.display_name}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {ownersOverLimit.length > 0 && (
          <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-slate-100 dark:border-neutral-800 p-4 mb-4">
            <View className="flex-row items-center justify-between mb-2 pr-5">
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={16} color="#EF4444" />
                <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100">{translate("super_admin.subscription.config.exceededManagers")}</Text>
              </View>
              <Toggle
                size="sm"
                value={(() => {
                  const ids = ownersOverLimit.map((m) => m.owner_id);
                  return (
                    ids.length > 0 && ids.every((id) => config.enforced_owner_ids.includes(id))
                  );
                })()}
                onValueChange={(val) => {
                  const ids = ownersOverLimit.map((m) => m.owner_id);
                  if (val) {
                    const newIds = Array.from(new Set([...config.enforced_owner_ids, ...ids]));
                    config.setEnforcedOwners(newIds);
                  } else {
                    config.setEnforcedOwners(
                      config.enforced_owner_ids.filter((id) => !ids.includes(id)),
                    );
                  }
                }}
              />
            </View>

            <Text className="text-[10px] font-poppins text-slate-500 dark:text-darkTextMuted leading-4 mb-4 px-0.5">
              {translate("super_admin.subscription.config.exceededDetail", { limit: config.FREE_STORES_LIMIT })}
            </Text>

            {ownersOverLimit.map((manager, idx) => (
              <View
                key={manager.owner_id}
                className={idx < ownersOverLimit.length - 1 ? "mb-4" : ""}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-poppins-bold text-slate-700 dark:text-slate-200 text-xs tracking-wider uppercase ml-0.5">
                    {manager.owner_name}{" "}
                    <Text className="font-poppins-medium text-[#FF6600] text-[10px]">
                      ({manager.activeCount} Active)
                    </Text>
                  </Text>
                  <Toggle
                    size="sm"
                    value={config.enforced_owner_ids.includes(manager.owner_id)}
                    onValueChange={(v) => config.toggleOwnerEnforcement(manager.owner_id, v)}
                  />
                </View>

                <View className="bg-slate-50 dark:bg-darkBackgroundMuted rounded-xl border border-slate-100 dark:border-neutral-800 px-4">
                  {manager.stores.map((s, i) => {
                    const isLast = i === manager.stores.length - 1;
                    return (
                      <View
                        key={s.id}
                        className={`py-3 ${!isLast ? "border-b border-slate-200 dark:border-neutral-700" : ""}`}
                      >
                        <Text
                          className="text-[13px] font-poppins-medium text-slate-800 dark:text-slate-100"
                          numberOfLines={1}
                        >
                          {s.name}
                        </Text>
                        <Text className="text-[9px] font-poppins text-slate-400 uppercase tracking-widest mt-0.5">
                          {s.status ? s.status.replace("_", " ") : "NOT SPECIFIED"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="items-center mt-2">
          <Button
            variant="primary"
            label={isSaving ? translate("super_admin.subscription.config.saving") : translate("super_admin.subscription.config.save")}
            icon="Save"
            onPress={handleSave}
            disabled={isSaving}
          />
        </View>
      </ScrollView>

      <Modal
        visible={showSuccessModal}
        title={translate("super_admin.subscription.config.successTitle")}
        onClose={() => setShowSuccessModal(false)}
        showCloseButton={false}
        buttons={[{ label: translate("label.ok"), variant: "success", onPress: () => setShowSuccessModal(false) }]}
      >
        <View className="items-center justify-center pt-2 pb-4">
          <View className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-800">
            <MaterialIcons name="check" size={32} color="#10B981" />
          </View>
          <Text className="text-sm leading-6 font-poppins text-slate-500 dark:text-slate-400 text-center px-2">
            Subscription configuration has been saved. Enforcement applies per store manager.
          </Text>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
