import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, useColorScheme, ActivityIndicator, Switch } from "react-native";
import { View, Text, TouchableOpacity, ScrollView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getQRConfig, toggleQREnabled, deleteQRConfig } from "@/services/store-manager/qr-service";
import { Modal, type ModalButton } from "@/components/modal";
import { Button } from "@/components/button";
import { Toggle } from "@/components/toggle";
type QRConfig = Awaited<ReturnType<typeof getQRConfig>>;

export default function QRIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [config, setConfig] = useState<QRConfig>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await getQRConfig(storeId);
      console.log("data", data);
      setConfig(data);
    } catch {
      setConfig(null);
    }
  }, [storeId]);

  useEffect(() => {
    setLoading(true);
    fetchConfig().finally(() => setLoading(false));
  }, [fetchConfig]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConfig();
    setRefreshing(false);
  }, [fetchConfig]);

  const handleToggleEnabled = async () => {
    if (!config || toggling) return;
    setToggling(true);
    try {
      const next = !config.qr_enabled;
      await toggleQREnabled(storeId, next);
      setConfig((prev) => prev ? { ...prev, qr_enabled: next } : prev);
    } catch {
      setModal({
        title: "Error",
        message: "Failed to update QR status. Please try again.",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
      });
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = () => {
    setModal({
      title: "Delete Configuration",
      message: "This will remove all QR purchase rules and disable QR earning for this store. This cannot be undone.",
      buttons: [
        { label: "Cancel", onPress: () => setModal(null), variant: "secondary" },
        {
          label: "Delete",
          variant: "primary",
          onPress: async () => {
            setModal(null);
            setDeleting(true);
            try {
              await deleteQRConfig(storeId);
              setConfig(null);
            } catch {
              setModal({
                title: "Error",
                message: "Failed to delete configuration. Please try again.",
                buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
              });
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

	console.log("config", config);

  return (
    <View className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />

      <View
        className="bg-background dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <View className="flex-row items-center px-2">
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/(store_manager)/view-store/[id]", params: { id: storeId } })}
            className="w-10 h-10 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={22} color={isDark ? "#F1F5F9" : "#0F172A"} />
          </TouchableOpacity>

          <View className="flex-1 items-center justify-center -ml-10">
            <Text className="text-md font-poppins-bold text-textPrimary dark:text-textPrimary">
                Scan Purchase
            </Text>
            <Text className="text-xs font-poppins text-textMuted dark:text-textMuted -mt-1">
              Loyalty points on QR scan
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FF6600"]}
            tintColor="#FF6600"
          />
        }
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#FF6600" />
            <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 mt-3">
              Loading configuration...
            </Text>
          </View>
        ) : !config ? (
          <View className="mx-4 bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 px-4 py-14 items-center gap-y-2">
            <View className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950 items-center justify-center mb-2">
              <MaterialIcons name="qr-code-scanner" size={28} color="#FF6600" />
            </View>
            <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-200">
              Not configured yet
            </Text>
            <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 text-center px-6">
              Set up how customers earn loyalty points when they scan your store QR code.
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(store_manager)/qr/configure-qr",
                  params: { storeId },
                })
              }
              className="mt-3 bg-primary px-6 py-2.5 rounded-xl flex-row items-center gap-x-1.5"
              activeOpacity={0.85}
            >
              <MaterialIcons name="add" size={15} color="#fff" />
              <Text className="text-xs font-poppins-semibold text-white">Configure Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-y-3 mx-4">

            <View className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 px-4 py-3.5 flex-row items-center gap-x-3">
              <View className={`w-10 h-10 rounded-xl items-center justify-center ${config.qr_enabled ? "bg-green-50 dark:bg-green-950" : "bg-slate-100 dark:bg-neutral-700"}`}>
                <MaterialIcons
                  name={config.qr_enabled ? "qr-code-scanner" : "qr-code"}
                  size={20}
                  color={config.qr_enabled ? "#22C55E" : "#94A3B8"}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-poppins-bold text-slate-800 dark:text-slate-100">
                  {config.qr_enabled ? "Enabled" : "Disabled"}
                </Text>
                <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                  {config.qr_enabled ? "Customers can earn points via QR scan" : "QR earning is currently disabled"}
                </Text>
              </View>
              {toggling ? (
                <ActivityIndicator size="small" color="#FF6600" />
              ) : (
									<Toggle
                  value={config.qr_enabled}
                  onValueChange={handleToggleEnabled}
									size="xs"
                />
              )}
            </View>

            <View className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 overflow-hidden">
							<View className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-neutral-700 ">
                <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                  Earnings Type
                </Text>
                <Text className="text-sm font-poppins-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  {config.earning_type === "percentage" ? "Percentage" : "Fixed"}
                </Text>
              </View>

							<View className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-neutral-700">
                <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                  How customers earn points
                </Text>
                <Text className="text-sm font-poppins-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  {config.earning_type === "percentage"
                    ? `Earn ${config.percentage ?? 0}% of every ₱${config.base_amount ?? 0} spent`
                    : `Earn ${config.fixed_points ?? 0} pts per transaction`}
                </Text>
              </View>

              {config.earning_type === "percentage" ? (
                <View className="flex-row">
                  <View className="flex-1 px-4 py-3 border-r border-slate-100 dark:border-neutral-700">
                    <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Rate</Text>
                    <Text className="text-base font-poppins-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {config.percentage ?? 0}%
                    </Text>
                  </View>
                  <View className="flex-1 px-4 py-3">
                    <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Per</Text>
                    <Text className="text-base font-poppins-bold text-primary dark:text-primary mt-0.5">
                      ₱{config.base_amount ?? 0}
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="flex-row">
                  <View className="flex-1 px-4 py-3 border-r border-slate-100 dark:border-neutral-700">
                    <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Points</Text>
                    <Text className="text-base font-poppins-bold text-primary dark:text-primary mt-0.5">
                      {config.fixed_points ?? 0} pts
                    </Text>
                  </View>
                  <View className="flex-1 px-4 py-3">
                    <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Min. Spend</Text>
                    <Text className="text-base font-poppins-bold text-primary dark:text-primary mt-0.5">
                      {config.minimum_spend != null && config.minimum_spend > 0
                        ? `₱${config.minimum_spend}`
                        : "None"}
                    </Text>
                  </View>
                </View>
              )}

              <View className="border-t border-slate-100 dark:border-neutral-700 px-4 py-3 flex-row items-center justify-between">
                <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                  Max points per transaction
                </Text>
                <Text className="text-sm font-poppins-bold text-primary dark:text-primary">
                  {config.max_points_per_txn != null ? `${config.max_points_per_txn} pts` : "No cap"}
                </Text>
              </View>

              {config.updated_at && (
                <View className="border-t border-slate-100 dark:border-neutral-700 px-4 py-2.5 flex-row items-center gap-x-1.5">
                  <MaterialIcons name="update" size={12} color="#94A3B8" />
                  <Text className="text-[10px] font-poppins text-slate-400 dark:text-slate-500">
                    Last updated {formatDate(config.updated_at)}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row">
              <View className="flex-1 pr-1">
                <Button
                  label="Edit "
                  onPress={() =>
                    router.push({
                      pathname: "/(store_manager)/qr/configure-qr",
                      params: { storeId },
                    })
                  }
                  variant="primary"
                  fullWidth
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
