import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, Platform, Pressable, useColorScheme } from "react-native";
import { View, Text, SafeAreaView, ScrollView } from "@/tw";
import { useSuperAdminStoresStore } from "@/store/super-admin/super-admin-stores-store";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
  UserRoundMinus,
  UserRoundPlus,
  UsersRound,
} from "lucide-react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import { Modal } from "@/components/modal";
import { useSuperAdminSubscriptionStore } from "@/store/super-admin/subscription-store";
import { Table, type TableColumn } from "@/components/ui/table";
import {
  getSubscriptionPlans,
  getManagerSubscriptions,
  getPublicUsersByIds,
  getManagerSubscriptionPaymentsByOwner,
  getSubscriptionDashboardStats,
  updateProSubscriptionAmount,
} from "@/services/super-admin/subscription-service";
import type { SubscriptionDashboardCompare } from "@/type/super-admin/subscription";

function FeatureLine({ text }: { text: string }) {
  return (
    <View className="flex-row items-start gap-2 py-1">
      <Check size={14} color="#FF6600" style={{ marginTop: 2 }} />
      <Text className="flex-1 text-xs font-poppins leading-5 text-textPrimary dark:text-darkTextPrimary">
        {text}
      </Text>
    </View>
  );
}

const TREND_UP = "#16a34a";
const TREND_DOWN = "#dc2626";
const TREND_FLAT = "#94a3b8";

function StatCard({
  icon,
  label,
  value,
  compare,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  compare?: SubscriptionDashboardCompare | null;
}) {
  const trend = compare?.trend;
  const TrendGlyph =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : ArrowUpDown;
  const trendColor =
    trend === "up" ? TREND_UP : trend === "down" ? TREND_DOWN : TREND_FLAT;

  return (
    <View className="flex-1 min-w-0 rounded-xl bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-700 p-4">
      <View className="flex-row items-start gap-3">
        <View className="w-10 h-10 rounded-xl items-center justify-center shrink-0">{icon}</View>
        <View className="flex-1 min-w-0 gap-y-1">
          <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted text-left">
            {label}
          </Text>
          <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary text-left">
            {value}
          </Text>
          {compare ? (
            <View className="flex-row items-center gap-2">
              <TrendGlyph size={14} color={trendColor} />
              <Text className="flex-1 text-[10px] font-poppins text-textMuted dark:text-darkTextMuted text-left leading-4">
                {compare.subtitle}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function SubscriptionConfig() {
  const { stores, fetchStores } = useSuperAdminStoresStore();
  const subscriptionState = useSuperAdminSubscriptionStore();
  const isWeb = Platform.OS === "web";
  const isDark = useColorScheme() === "dark";
  const mutedIcon = isDark ? "#a3a3a3" : "#64748b";
  const plans = subscriptionState.plans;
  const proAmountInput = subscriptionState.proAmountInput;
  const savedProAmount = subscriptionState.savedProAmount;
  const formError = subscriptionState.formError;
  const dashboardStats = subscriptionState.dashboardStats;

  React.useEffect(() => {
    fetchStores();
    void (async () => {
      subscriptionState.setFormError(null);
      subscriptionState.setLoading(true);
      try {
        try {
          const plans = await getSubscriptionPlans();
          subscriptionState.setPlans(plans);

          const pro = plans.find((p) => String(p.slug ?? "").trim().toLowerCase() === "pro") ?? null;
          const amt =
            typeof pro?.amount === "number" && Number.isFinite(pro.amount) ? pro.amount : null;
          subscriptionState.setSavedProAmount(amt);
          subscriptionState.setProAmountInput(amt != null ? String(amt) : "");
        } catch (e) {
          subscriptionState.setFormError(
            e instanceof Error ? e.message : "Failed to load subscription plans.",
          );
        }

        try {
          const managerSubscriptions = await getManagerSubscriptions();
          subscriptionState.setManagerSubscriptions(managerSubscriptions);
          const stats = await getSubscriptionDashboardStats(managerSubscriptions);
          subscriptionState.setDashboardStats(stats);

          const users = await getPublicUsersByIds(managerSubscriptions.map((m) => m.owner_id));
          subscriptionState.setPublicUsers(users);
        } catch (e) {
          subscriptionState.setFormError(
            e instanceof Error ? e.message : "Failed to load manager subscriptions.",
          );
          subscriptionState.setManagerSubscriptions([]);
          subscriptionState.setDashboardStats(null);
          subscriptionState.setPublicUsers([]);
        }
      } finally {
        subscriptionState.setLoading(false);
      }
    })();
  }, []);

  const basicPlan = useMemo(
    () => plans.find((p) => String(p.slug ?? "").trim().toLowerCase() === "basic") ?? null,
    [plans],
  );
  const proPlan = useMemo(
    () => plans.find((p) => String(p.slug ?? "").trim().toLowerCase() === "pro") ?? null,
    [plans],
  );

  const hasProAmountChanges = useMemo(() => {
    if (savedProAmount == null) return false;
    const current = Number(proAmountInput);
    if (!Number.isFinite(current)) return false;
    return current !== savedProAmount;
  }, [proAmountInput, savedProAmount]);

  const toAmountNumber = useCallback((value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }, []);

  const formatPeso = useCallback((amount: number | null) => {
    if (amount == null) return "";
    return `PHP ${amount.toFixed(2)}`;
  }, []);

  const formatDateLong = useCallback((value: string | number | Date | null | undefined) => {
    if (!value) return "—";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  }, []);

  const handleSave = async () => {
    subscriptionState.setFormError(null);
    const amount = Number(proAmountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      subscriptionState.setFormError("Please enter a valid Pro price (PHP).");
      return;
    }

    try {
      subscriptionState.setSaving(true);
      await updateProSubscriptionAmount(amount);
      const [plans, managerSubscriptions] = await Promise.all([
        getSubscriptionPlans(),
        getManagerSubscriptions(),
      ]);
      subscriptionState.setPlans(plans);
      subscriptionState.setManagerSubscriptions(managerSubscriptions);
      const stats = await getSubscriptionDashboardStats(managerSubscriptions);
      subscriptionState.setDashboardStats(stats);
      const users = await getPublicUsersByIds(managerSubscriptions.map((m) => m.owner_id));
      subscriptionState.setPublicUsers(users);

      const pro = plans.find((p) => String(p.slug ?? "").trim().toLowerCase() === "pro") ?? null;
      const amt = typeof pro?.amount === "number" && Number.isFinite(pro.amount) ? pro.amount : null;
      subscriptionState.setSavedProAmount(amt);
      subscriptionState.setProAmountInput(amt != null ? String(amt) : "");

      subscriptionState.setShowSuccessModal(true);
    } catch (e) {
      subscriptionState.setFormError(e instanceof Error ? e.message : "Failed to save Pro price.");
    } finally {
      subscriptionState.setSaving(false);
    }
  };

  const subscribedManagers = React.useMemo(() => {
    return subscriptionState.managerSubscriptions.map((sub) => {
      const store = stores.find((s) => s.owner_id === sub.owner_id);
      const user = subscriptionState.publicUsers[sub.owner_id];
      const name = (user?.name ?? "").trim();
      return {
        ...sub,
        display_name: name || store?.owner_name || "Puntos User",
        email: user?.email ?? "—",
      };
    });
  }, [subscriptionState.managerSubscriptions, subscriptionState.publicUsers, stores]);

  const togglePayments = useCallback(
    async (ownerId: string) => {
      const open = Boolean(subscriptionState.paymentsOpen[ownerId]);
      const next = !open;

      subscriptionState.setPaymentsOpen(ownerId, next);
      if (!next) return;
      if (subscriptionState.paymentsByOwner[ownerId]?.length) return;

      subscriptionState.setPaymentsLoading(ownerId, true);
      try {
        const payments = await getManagerSubscriptionPaymentsByOwner(ownerId);
        subscriptionState.setPaymentsForOwner(ownerId, payments);
      } catch (e) {
        subscriptionState.setFormError(e instanceof Error ? e.message : "Failed to load payments ledger.");
      } finally {
        subscriptionState.setPaymentsLoading(ownerId, false);
      }
    },
    [
      subscriptionState.paymentsByOwner,
      subscriptionState.paymentsOpen,
      subscriptionState.setFormError,
      subscriptionState.setPaymentsForOwner,
      subscriptionState.setPaymentsLoading,
      subscriptionState.setPaymentsOpen,
    ],
  );

  const renderLedger = useCallback(
    (row: (typeof subscribedManagers)[number]) => {
      const payments = subscriptionState.paymentsByOwner[row.owner_id] ?? [];
      return (
        <View className="w-full">
          <View className="pt-1">
            <Table
              variant="divider"
              headerPaddingYClassName="py-2"
              columns={[
                {
                  key: "payment_reference",
                  header: "Payment reference",
                  flex: 3,
                  align: "left",
                  render: (p: any) =>
                    p.payment_reference
                      ? p.payment_reference
                      : "—",
                },
                {
                  key: "amount",
                  header: "Amount",
                  flex: 2,
                  align: "center",
                  render: (p: any) => `₱${Number(p.amount_paid ?? 0).toFixed(2)}`,
                },
                {
                  key: "billing_period_start",
                  header: "Billing period start",
                  flex: 2,
                  align: "center",
                  render: (p: any) =>
                    p.billing_period_start
                      ? formatDateLong(p.billing_period_start)
                      : "—",
                },
                {
                  key: "billing_period_end",
                  header: "Billing period end",
                  flex: 3,
                  align: "center",
                  render: (p: any) =>
                    p.billing_period_end
                      ? formatDateLong(p.billing_period_end)
                      : "—",
                },
           
                {
                  key: "status",
                  header: "Status",
                  flex: 1,
                  align: "left",
                  render: (p: any) => (
                    <View className="px-2 py-0.5 rounded-full bg-emerald-100/60 dark:bg-emerald-900/25">
                      <Text className="text-[10px] font-poppins-bold uppercase text-emerald-700 dark:text-emerald-300">
                        {String(p.payment_status ?? "—")}
                      </Text>
                    </View>
                  ),
                },
            ]}
            rows={payments}
            rowKey={(p: any, idx: number) => String(p.id ?? `${row.owner_id}-${idx}`)}
            emptyText="No payments yet."
            />
          </View>
        </View>
      );
    },
    [subscriptionState.paymentsByOwner],
  );

  const isExpanded = useCallback(
    (row: (typeof subscribedManagers)[number]) => Boolean(subscriptionState.paymentsOpen[row.owner_id]),
    [subscriptionState.paymentsOpen],
  );

  const tableColumns = useMemo(() => {
    const cols: Array<TableColumn<(typeof subscribedManagers)[number]>> = [
      {
        key: "manager",
        header: "Store manager",
        flex: 2,
        align: "left",
        render: (row) => (
          <View className="min-w-0">
            <Text className="text-[12px] font-poppins text-textSecondary dark:text-darkTextSecondary" numberOfLines={1}>
              {row.display_name}
            </Text>
            {/* <Text className="text-[10px] font-poppins text-slate-500 dark:text-slate-400" numberOfLines={1}>
              {row.email || "—"}
            </Text> */}
          </View>
        ),
      },
      {
        key: "plan",
        header: "Plan",
        width: 150,
        align: "center",
        render: (row) => (
          <View className="px-2 py-0.5 rounded-full bg-primary/10">
            <Text className="text-[10px] font-poppins-bold uppercase tracking-wider text-primary">
              {row.subscription_id ? "Pro" : "Basic"}
            </Text>
          </View>
        ),
   
      },
      {
        key: "payments",
        header: "View payments",
        width: 150,
        align: "center",
        render: (row) => {
          const open = Boolean(subscriptionState.paymentsOpen[row.owner_id]);
          const loading = Boolean(subscriptionState.paymentsLoading[row.owner_id]);
          return (
            <Pressable
              onPress={() => void togglePayments(row.owner_id)}
              disabled={loading}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={open ? "Hide payments" : "View payments"}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              <View className="flex-row items-center justify-center">
                {loading ? (
                  <Text className="text-[12px] font-poppins-semibold text-primary">...</Text>
                ) : open ? (
                  <ChevronUp size={16} color={mutedIcon} />
                ) : (
                  <ChevronDown size={16} color={mutedIcon} />
                )}
              </View>
            </Pressable>
          );
        },
      },
    ];
    return cols;
  }, [
    subscribedManagers,
    subscriptionState.paymentsLoading,
    subscriptionState.paymentsOpen,
    renderLedger,
    togglePayments,
  ]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-6 py-3 flex-row items-center justify-between">
        <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary py-1">
          Subscription
        </Text>
      </View>

      {subscriptionState.loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6600" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 40,
            ...(isWeb ? { alignItems: "center" as const } : {}),
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ maxWidth: isWeb ? 896 : undefined }} className="w-full gap-y-4">

          <View className={`${isWeb ? "gap-4" : "flex-col gap-3"}`}>
              {isWeb ? (
                <>
                  <View className="flex-row gap-x-2">
                    <StatCard
                      icon={<TrendingUp size={24} color="#FF6600" />}
                      label="Total collected"
                      value={
                        dashboardStats != null
                          ? `PHP ${dashboardStats.totalAmountCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "—"
                      }
                      compare={dashboardStats?.totalAmountCollectedCompare ?? null}
                    />
                    <StatCard
                      icon={<UsersRound size={24} color="#FF6600" />}
                      label="Active subscribers"
                      value={dashboardStats != null ? String(dashboardStats.activeSubscribers) : "—"}
                      compare={dashboardStats?.activeSubscribersCompare ?? null}
                    />
                    <StatCard
                      icon={<UserRoundPlus size={24} color="#FF6600" />}
                      label="New subscribers"
                      value={dashboardStats != null ? String(dashboardStats.newSubscribersThisMonth) : "—"}
                      compare={dashboardStats?.newSubscribersThisMonthCompare ?? null}
                    />
                    <StatCard
                      icon={<UserRoundMinus size={24} color="#FF6600" />}
                      label="Cancellations"
                      value={dashboardStats != null ? String(dashboardStats.scheduledCancellations) : "—"}
                      compare={dashboardStats?.scheduledCancellationsCompare ?? null}
                    />
                  </View>
         
                </>
              ) : (
                <>
                  <StatCard
                    icon={<TrendingUp size={24} color="#FF6600" />}
                    label="Total collected"
                    value={
                      dashboardStats != null
                        ? `PHP ${dashboardStats.totalAmountCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—"
                    }
                    compare={dashboardStats?.totalAmountCollectedCompare ?? null}
                  />
                  <StatCard
                    icon={<UsersRound size={24} color="#FF6600" />}
                    label="Active subscribers"
                    value={dashboardStats != null ? String(dashboardStats.activeSubscribers) : "—"}
                    compare={dashboardStats?.activeSubscribersCompare ?? null}
                  />
                  <StatCard
                    icon={<UserRoundPlus size={24} color="#FF6600" />}
                    label="New subscribers (this month)"
                    value={dashboardStats != null ? String(dashboardStats.newSubscribersThisMonth) : "—"}
                    compare={dashboardStats?.newSubscribersThisMonthCompare ?? null}
                  />
                  <StatCard
                    icon={<UserRoundMinus size={24} color="#FF6600" />}
                    label="Scheduled cancellations"
                    value={dashboardStats != null ? String(dashboardStats.scheduledCancellations) : "—"}
                    compare={dashboardStats?.scheduledCancellationsCompare ?? null}
                  />
                </>
              )}
            </View>

            <View className="w-full rounded-xl border border-slate-100 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden p-4">
              <View className={isWeb ? "flex-row gap-4 items-stretch" : "flex-col gap-4"}>
                <View className="flex-1 min-w-0">
                  <View className="relative rounded-2xl border border-slate-100 bg-white p-4 h-full dark:border-slate-700 dark:bg-neutral-900">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Store size={20} color={mutedIcon} />
                      <Text className="text-md font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                        {String(basicPlan?.name ?? "Basic")}
                      </Text>
                    </View>
                    <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted mb-2">
                      Free
                    </Text>
                    <View className="pt-1 border-t border-slate-100 dark:border-slate-700">
                      <FeatureLine text={"1 store with full loyalty tools"} />
                      <FeatureLine text={"Stamps, rewards, QR, and staff tools"} />
                    </View>
                  </View>
                </View>

                <View
                  className={`
                    flex-1 min-w-0
                    w-full rounded-2xl
                    bg-white dark:bg-neutral-900
                    p-4 relative
                    border
                    border-primary/50 dark:border-primary/60
                    ${isWeb ? "shadow-[0_0_16px_0_rgba(255,102,0,0.22)] dark:shadow-[0_0_24px_0_rgba(255,102,0,0.28)]" : ""}
                  `}
                >
           
                  <View className="relative h-full">
                    <View className="flex-row items-center gap-2 mb-1 mt-1">
                      <Sparkles size={20} color="#FF6600" />
                      <Text className="text-md font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                        {String(proPlan?.name ?? "Pro")}
                      </Text>
                    </View>

                    <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted mb-2">
                      {toAmountNumber(proAmountInput) != null
                        ? `Built for multiple locations · ${formatPeso(toAmountNumber(proAmountInput))}/month`
                        : "Built for multiple locations"}
                    </Text>

                    <View className="pt-1 border-t border-orange-100/80 dark:border-orange-900/40">
                      <FeatureLine text={"Add and run more than one store"} />
                      <FeatureLine text={"Priority support"} />
                      <FeatureLine text={"Access to new premium features as we release them"} />
                    </View>

                    <View className="mt-4">
                      <TextField
                        label="Pro monthly amount (PHP)"
                        value={proAmountInput}
                        onChangeText={subscriptionState.setProAmountInput}
                        keyboardType="numeric"
                      />
                      {formError ? (
                        <View className="mt-2 bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                          <Text className="text-xs font-poppins text-red-700 dark:text-red-300">
                            {formError}
                          </Text>
                        </View>
                      ) : null}

                      <View className="mt-3">
                        {hasProAmountChanges ? (
                          <Button
                            variant="primary"
                            loading={subscriptionState.saving}
                            label="Save Changes"
                            onPress={handleSave}
                            disabled={subscriptionState.saving}
                            fullWidth={true}
                          />
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {subscribedManagers.length > 0 ? (
              <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-slate-100 dark:border-neutral-800 p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100">
                    Manager subscriptions
                  </Text>
                </View>

                <Text className="text-xs font-poppins text-slate-500 dark:text-darkTextMuted leading-4 mb-4 px-0.5">
                  Billing state per store manager.
                </Text>

                <Table
                  columns={tableColumns}
                  rows={subscribedManagers}
                  rowKey={(row, idx) => String(row.id ?? row.owner_id ?? idx)}
                  emptyText="No manager subscriptions found."
                  isRowExpanded={(row) => isExpanded(row)}
                  renderExpandedRow={(row) => renderLedger(row)}
                  hideExpandedTopBorder={true}
                  onRowPress={(row) => {
                    void togglePayments(row.owner_id);
                  }}
                  isRowPressDisabled={(row) => Boolean(subscriptionState.paymentsLoading[row.owner_id])}
                />
              </View>
            ) : (
              <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-slate-100 dark:border-neutral-800 p-4 mt-4">
                <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100 mb-1">
                  Manager subscriptions
                </Text>
                <Text className="text-[10px] font-poppins text-slate-500 dark:text-darkTextMuted leading-4">
                  No manager subscriptions found.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={subscriptionState.showSuccessModal}
        title="Successfully Saved!"
        onClose={() => subscriptionState.setShowSuccessModal(false)}
        showCloseButton={false}
        buttons={[
          {
            label: "Okay",
            variant: "success",
            onPress: () => subscriptionState.setShowSuccessModal(false),
          },
        ]}
      >
        <View className="items-center justify-center pt-2">
          <View className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-800">
            <MaterialIcons name="check" size={32} color="#10B981" />
          </View>
          <Text className="text-sm leading-6 font-poppins text-slate-500 dark:text-slate-400 text-center px-2">
            Pro pricing has been saved. Basic remains free.
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
