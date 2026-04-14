import React, { useState } from "react";
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

export default function SubscriptionConfig() {
  const config = useSubscriptionConfigStore();
  const { stores, fetchStores } = useSuperAdminStoresStore();

  const [limit, setLimit] = useState(config.FREE_STORES_LIMIT.toString());
  const [price, setPrice] = useState(config.SUBSCRIPTION_PRICE_PHP.toString());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase.from('store_subscriptions').select('*');
    if (!error && data) {
      setSubscriptions(data);
      config.setEnforcedStores(data.filter(s => s.is_enforced).map(s => s.store_id));
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
      const targetStores = ownersOverLimit.flatMap(manager => manager.stores).filter(s => s.owner_id);
      const enabledStores = targetStores.filter(s => config.enforced_stores_ids.includes(s.id));
      const disabledStores = targetStores.filter(s => !config.enforced_stores_ids.includes(s.id));

      // Upsert only the enabled stores
      if (enabledStores.length > 0) {
        const recordsToUpsert = enabledStores.map(s => ({
          store_id: s.id,
          owner_id: s.owner_id,
          is_enforced: true,
          amount_paid: parseFloat(price),
          payment_status: 'unpaid',
        }));
        const { error } = await supabase
          .from('store_subscriptions')
          .upsert(recordsToUpsert, { onConflict: 'store_id' });
        if (error) console.error("Error upserting subscriptions:", error.message);
      }

      // Delete disabled stores from store_subscriptions
      if (disabledStores.length > 0) {
        const idsToDelete = disabledStores.map(s => s.id);
        const { error } = await supabase
          .from('store_subscriptions')
          .delete()
          .in('store_id', idsToDelete);
        if (error) console.error("Error deleting subscriptions:", error.message);
      }
    } catch (e) {
      console.error(e);
    }

    setIsSaving(false);
    setShowSuccessModal(true);
    fetchSubscriptions();
  };

  const subscribedStores = React.useMemo(() => {
    return subscriptions.map(sub => {
      const store = stores.find(s => s.id === sub.store_id);
      return {
        ...sub,
        store_name: store?.name || "Unknown Store",
        owner_name: store?.owner_name || "Unknown Owner",
      };
    });
  }, [subscriptions, stores]);

  const ownersOverLimit = React.useMemo(() => {
    const ownerStoreMap: Record<string, { owner_name: string; activeCount: number; stores: AdminStoreRow[] }> = {};
    stores.forEach(s => {
      if (!s.owner_id) return;
      if (!ownerStoreMap[s.owner_id]) {
        ownerStoreMap[s.owner_id] = { owner_name: s.owner_name || "Unknown", activeCount: 0, stores: [] };
      }
      const isActive = s.status === "active" || s.is_active;
      if (isActive) ownerStoreMap[s.owner_id].activeCount += 1;
      if (s.status === "pending_review" || !s.status) ownerStoreMap[s.owner_id].stores.push(s);
    });

    return Object.values(ownerStoreMap)
      .filter(item => item.activeCount >= config.FREE_STORES_LIMIT && item.stores.length > 0);
  }, [stores, config.FREE_STORES_LIMIT]);

  const toggleStoreEnforcement = (storeId: number, requireSub: boolean) => {
    config.toggleStoreEnforcement(storeId, requireSub);
  };

  return (
    <ScreenWrapper className="flex-1 bg-backgroundMuted dark:bg-darkBackground">

      {/* ── Header ── */}
      <View className="bg-white dark:bg-darkBackgroundMuted border-b border-slate-100 dark:border-darkBorder px-5 py-4 flex-row items-center gap-2">
        <CircleDollarSign size={20} color="#0F172A" className="dark:color-white" />
        <Text className="text-base font-poppins-bold text-slate-900 dark:text-darkTextPrimary">
          Subscription
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Parameters card ── */}
        <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-slate-100 dark:border-neutral-800 p-4 mb-4">

          {/* Enforce toggle row */}
          <View className="flex-row items-center justify-between bg-slate-50 dark:bg-darkBackgroundMuted rounded-xl p-4 border border-slate-100 dark:border-neutral-700 mb-4">
            <View className="flex-1 pr-4">
              <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-darkTextPrimary">
                Enforce Subscription
              </Text>
              <Text className="text-[10px] font-poppins text-slate-500 dark:text-darkTextMuted leading-4 mt-1">
                Require Store Managers to pay after exceeding the specified limit of active stores.
              </Text>
            </View>
            <Toggle size="sm" value={config.ENFORCE_SUBSCRIPTION} onValueChange={config.toggleEnforce} />
          </View>

          {/* Section label */}
          <View className="flex-row items-center gap-2 mb-3">
            <CircleDollarSign size={16} color="#FF6600" />
            <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100">
              Subscription Parameters
            </Text>
          </View>

          {/* Numeric inputs */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField
                label="Free Stores Limit"
                value={limit}
                onChangeText={setLimit}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <TextField
                label="Price (PHP)"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* ── Stores with Subscriptions ── */}
        {subscribedStores.length > 0 && (
          <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-slate-100 dark:border-neutral-800 p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <CalendarDays size={16} color="#10B981" />
              <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100">
                Stores with Subscriptions
              </Text>
            </View>

            <Text className="text-[10px] font-poppins text-slate-500 dark:text-darkTextMuted leading-4 mb-4 px-0.5">
              Stores currently monitored under the subscription policy.
            </Text>

            <View className="bg-slate-50 dark:bg-darkBackgroundMuted rounded-xl border border-slate-100 dark:border-neutral-800 px-4">
              {subscribedStores.map((sub, i) => {
                const isLast = i === subscribedStores.length - 1;
                const isPaid = sub.payment_status === 'paid';
                return (
                  <View
                    key={sub.id || sub.store_id}
                    className={`py-3 ${!isLast ? "border-b border-slate-200 dark:border-neutral-700" : ""}`}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-[13px] font-poppins-medium text-slate-800 dark:text-slate-100" numberOfLines={1}>
                        {sub.store_name}
                      </Text>
                      <View className={`px-2 py-0.5 rounded-full ${isPaid ? 'bg-emerald-100/50 border border-emerald-200' : 'bg-red-100/50 border border-red-200'}`}>
                        <Text className={`text-[8px] font-poppins-bold uppercase tracking-wider ${isPaid ? 'text-emerald-700' : 'text-red-700'}`}>
                          {sub.payment_status || 'unpaid'}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[10px] font-poppins-medium text-slate-500 dark:text-darkTextMuted">
                        {sub.owner_name}
                      </Text>
                      {isPaid && sub.current_period_end && (
                        <Text className="text-[9px] font-poppins text-slate-400 mt-1">
                          Ends: {new Date(sub.current_period_end).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Exceeded managers card ── */}
        {ownersOverLimit.length > 0 && (
          <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-slate-100 dark:border-neutral-800 p-4 mb-4">

            <View className="flex-row items-center justify-between mb-2 pr-5">
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={16} color="#EF4444" />
                <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100">
                  Exceeded Store Managers
                </Text>
              </View>
              <Toggle
                size="sm"
                value={(() => {
                  const allStores = ownersOverLimit.flatMap(m => m.stores);
                  return allStores.length > 0 && allStores.every(s => config.enforced_stores_ids.includes(s.id));
                })()}
                onValueChange={(val) => {
                  const allStores = ownersOverLimit.flatMap(m => m.stores);
                  if (val) {
                    const newIds = allStores.map(s => s.id).filter(id => !config.enforced_stores_ids.includes(id));
                    if(newIds.length > 0) config.setEnforcedStores([...config.enforced_stores_ids, ...newIds]);
                  } else {
                    const idsToRemove = allStores.map(s => s.id);
                    config.setEnforcedStores(config.enforced_stores_ids.filter(id => !idsToRemove.includes(id)));
                  }
                }}
              />
            </View>

            <Text className="text-[10px] font-poppins text-slate-500 dark:text-darkTextMuted leading-4 mb-4 px-0.5">
              The following managers have reached or exceeded the {config.FREE_STORES_LIMIT} store limit.
              You may manually bypass the restriction for individual stores here.
            </Text>

            {ownersOverLimit.map((manager, idx) => (
              <View
                key={manager.owner_name}
                className={idx < ownersOverLimit.length - 1 ? "mb-4" : ""}
              >
                <Text className="font-poppins-bold text-slate-700 dark:text-slate-200 text-xs tracking-wider uppercase ml-0.5 mb-2">
                  {manager.owner_name}{" "}
                  <Text className="font-poppins-medium text-[#FF6600] text-[10px]">
                    ({manager.activeCount} Active)
                  </Text>
                </Text>

                <View className="bg-slate-50 dark:bg-darkBackgroundMuted rounded-xl border border-slate-100 dark:border-neutral-800 px-4">
                  {manager.stores.map((s, i) => {
                    const isEnforced = config.enforced_stores_ids.includes(s.id);
                    const isLast = i === manager.stores.length - 1;
                    return (
                      <View
                        key={s.id}
                        className={`flex-row items-center justify-between py-3 ${!isLast ? "border-b border-slate-200 dark:border-neutral-700" : ""}`}
                      >
                        <View className="flex-1 pr-3">
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
                        <Toggle
                          size="sm"
                          value={isEnforced}
                          onValueChange={(val) => toggleStoreEnforcement(s.id, val)}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Save button ── */}
        <View className="items-center mt-2">
          <Button
            variant="primary"
            label={isSaving ? "Saving..." : "Save Configurations"}
            icon="Save"
            onPress={handleSave}
            disabled={isSaving}
          />
        </View>

      </ScrollView>

      {/* ── Success modal ── */}
      <Modal
        visible={showSuccessModal}
        title="Successfully Saved!"
        onClose={() => setShowSuccessModal(false)}
        showCloseButton={false}
        buttons={[{ label: "Okay", variant: "success", onPress: () => setShowSuccessModal(false) }]}
      >
        <View className="items-center justify-center pt-2 pb-4">
          <View className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-800">
            <MaterialIcons name="check" size={32} color="#10B981" />
          </View>
          <Text className="text-sm leading-6 font-poppins text-slate-500 dark:text-slate-400 text-center px-2">
            Your subscription configuration limits, pricing, and restrictions have been globally enforced across the platform.
          </Text>
        </View>
      </Modal>

    </ScreenWrapper>
  );
}