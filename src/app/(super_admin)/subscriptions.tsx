import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Platform, useColorScheme } from "react-native";
import { View, Text, SafeAreaView, ScrollView } from "@/tw";
import { useSuperAdminStoresStore } from "@/store/super-admin/super-admin-stores-store";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Store,
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
import type { ManagerSubscriptionPaymentRow, SubscriptionDashboardCompare } from "@/type/super-admin/subscription";

function parseAmount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = Number(raw.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

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
    trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : ArrowUpDown;
  const trendColor =
    trend === "up" ? TREND_UP : trend === "down" ? TREND_DOWN : TREND_FLAT;

  const formattedValue = React.useMemo(() => {
    const trimmed = String(value ?? "").trim();
    if (trimmed === "—") return { kind: "dash" as const };
    if (trimmed.toUpperCase().startsWith("PHP ")) {
      return { kind: "currency" as const, currency: "PHP", amount: trimmed.slice(4).trim() };
    }
    return { kind: "plain" as const, text: trimmed };
  }, [value]);

  return (
    <View className="flex-1 min-w-0 rounded-xl bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-700 p-4">
      <View className="flex-row items-center gap-1">
        <View className="w-8 h-8 rounded-xl items-center justify-center shrink-0 self-center">{icon}</View>
        <View className="flex-1 min-w-0 gap-y-0.5">
          <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted text-left">
            {label}
          </Text>
          {formattedValue.kind === "dash" ? (
            <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary text-left">
              —
            </Text>
          ) : formattedValue.kind === "currency" ? (
            <View className="flex-row flex-wrap items-baseline min-w-0">
              <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted mr-1">
                {formattedValue.currency}
              </Text>
              <Text
                className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary text-left shrink min-w-0"
                adjustsFontSizeToFit={true}
                minimumFontScale={0.75}
              >
                {formattedValue.amount}
              </Text>
            </View>
          ) : (
            <Text
              className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary text-left shrink min-w-0"
              adjustsFontSizeToFit={true}
              minimumFontScale={0.75}
            >
              {formattedValue.text}
            </Text>
          )}
          {compare ? (
            <View className="flex-row items-center gap-1">
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
  const { t: translate } = useTranslation();
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
            e instanceof Error ? e.message : translate("superAdmin.subscription.formError.loadPlansFailed"),
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
            e instanceof Error ? e.message : translate("superAdmin.subscription.formError.loadSubsFailed"),
          );
          subscriptionState.setManagerSubscriptions([]);
          subscriptionState.setDashboardStats(null);
          subscriptionState.setPublicUsers([]);
        }
      } finally {
      subscriptionState.setLoading(false);
    }
  })();
  }, [fetchStores, translate]); 

  const basicPlan = useMemo(
    () => plans.find((p) => String(p.slug ?? "").trim().toLowerCase() === "basic") ?? null,
    [plans],
  );
  const proPlan = useMemo(
    () => plans.find((p) => String(p.slug ?? "").trim().toLowerCase() === "pro") ?? null,
    [plans],
  );

  const hasProAmountChanges = useMemo(() => {
    const current = parseAmount(proAmountInput);
    if (current === null || current <= 0) return false;
    if (savedProAmount == null) return true;
    return current !== savedProAmount;
  }, [proAmountInput, savedProAmount]);

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
    const amount = parseAmount(proAmountInput);
    if (amount === null || amount <= 0) {
      subscriptionState.setFormError(translate("superAdmin.subscription.formError.invalidPrice"));
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
      subscriptionState.setFormError(e instanceof Error ? e.message : translate("superAdmin.subscription.formError.saveFailed"));
    } finally {
      subscriptionState.setSaving(false);
    }
  };

  const subscribedManagers = React.useMemo(() => {
    const storesByOwner = new Map(stores.map((s) => [s.owner_id, s]));
    return subscriptionState.managerSubscriptions.map((sub) => {
      const store = storesByOwner.get(sub.owner_id);
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
        subscriptionState.setFormError(e instanceof Error ? e.message : translate("superAdmin.subscription.formError.loadLedgerFailed"));
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
                  header: translate("superAdmin.subscription.ledger.paymentRef"),
                  flex: 3,
                  align: "left",
                  render: (p: ManagerSubscriptionPaymentRow) =>
                    p.payment_reference ?? "—",
                },
                {
                  key: "amount",
                  header: translate("superAdmin.subscription.ledger.amount"),
                  flex: 2,
                  align: "center",
                  render: (p: ManagerSubscriptionPaymentRow) =>
                    `₱${parseAmount(p.amount_paid)?.toFixed(2) ?? "0.00"}`,
                },
                {
                  key: "billing_period_start",
                  header: translate("superAdmin.subscription.ledger.billingStart"),
                  flex: 2,
                  align: "center",
                  render: (p: ManagerSubscriptionPaymentRow) =>
                    p.billing_period_start ? formatDateLong(p.billing_period_start) : "—",
                },
                {
                  key: "billing_period_end",
                  header: translate("superAdmin.subscription.ledger.billingEnd"),
                  flex: 3,
                  align: "center",
                  render: (p: ManagerSubscriptionPaymentRow) =>
                    p.billing_period_end ? formatDateLong(p.billing_period_end) : "—",
                },
                {
                  key: "status",
                  header: translate("superAdmin.subscription.ledger.status"),
                  flex: 1,
                  align: "left",
                  render: (p: ManagerSubscriptionPaymentRow) => {
                    const status = String(p.payment_status ?? "").toLowerCase();
                    const bgClass =
                      status === "failed"
                        ? "bg-red-100/60 dark:bg-red-900/25"
                        : "bg-emerald-100/60 dark:bg-emerald-900/25";
                    const textClass =
                      status === "failed"
                        ? "text-red-700 dark:text-red-300"
                        : "text-emerald-700 dark:text-emerald-300";
                    return (
                      <View className={`px-2 py-0.5 rounded-full ${bgClass}`}>
                        <Text className={`text-[10px] font-poppins-bold uppercase ${textClass}`}>
                          {p.payment_status ?? "—"}
                        </Text>
                      </View>
                    );
                  },
                },
            ]}
            rows={payments}
            rowKey={(p: ManagerSubscriptionPaymentRow, idx: number) => String(p.id ?? `${row.owner_id}-${idx}`)}
            emptyText={translate("superAdmin.subscription.ledger.empty")}
            />
          </View>
        </View>
      );
    },
    [subscriptionState.paymentsByOwner, translate, formatDateLong],
  );

  const isExpanded = useCallback(
    (row: (typeof subscribedManagers)[number]) => Boolean(subscriptionState.paymentsOpen[row.owner_id]),
    [subscriptionState.paymentsOpen],
  );

  const tableColumns = useMemo(() => {
    const cols: Array<TableColumn<(typeof subscribedManagers)[number]>> = [
      {
        key: "manager",
        header: translate("superAdmin.subscription.table.managerCol"),
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
        header: translate("superAdmin.subscription.table.planCol"),
        width: 150,
        align: "center",
        render: (row) => (
          <View className="px-2 py-0.5 rounded-full bg-primary/10">
            <Text className="text-[10px] font-poppins-bold uppercase tracking-wider text-primary">
              {row.subscription_id ? translate("superAdmin.subscription.table.planPro") : translate("superAdmin.subscription.table.planBasic")}
            </Text>
          </View>
        ),
   
      },
      {
        key: "payments",
        header: translate("superAdmin.subscription.table.paymentsCol"),
        width: 150,
        align: "center",
        render: (row) => {
          const open = Boolean(subscriptionState.paymentsOpen[row.owner_id]);
          const loading = Boolean(subscriptionState.paymentsLoading[row.owner_id]);
          // No inner Pressable — the Table's onRowPress handles toggle.
          // A nested Pressable would fire both handlers and toggle open→closed immediately.
          return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              {loading ? (
                <Text className="text-[12px] font-poppins-semibold text-primary">...</Text>
              ) : open ? (
                <ChevronUp size={16} color={mutedIcon} />
              ) : (
                <ChevronDown size={16} color={mutedIcon} />
              )}
            </View>
          );
        },
      },
    ];
    return cols;
  }, [
    translate,
    mutedIcon,
    subscriptionState.paymentsLoading,
    subscriptionState.paymentsOpen,
    togglePayments,
  ]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-6 py-3 flex-row items-center justify-between">
        <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary py-1">
          {translate("superAdmin.subscription.title")}
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
                      label={translate("superAdmin.subscription.stats.totalCollected")}
                      value={
                        dashboardStats != null
                          ? `PHP ${dashboardStats.totalAmountCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "—"
                      }
                      compare={dashboardStats?.totalAmountCollectedCompare ?? null}
                    />
                    <StatCard
                      icon={<UsersRound size={24} color="#FF6600" />}
                      label={translate("superAdmin.subscription.stats.activeSubscribers")}
                      value={dashboardStats != null ? String(dashboardStats.activeSubscribers) : "—"}
                      compare={dashboardStats?.activeSubscribersCompare ?? null}
                    />
                    <StatCard
                      icon={<UserRoundPlus size={24} color="#FF6600" />}
                      label={translate("superAdmin.subscription.stats.newSubscribers")}
                      value={dashboardStats != null ? String(dashboardStats.newSubscribersThisMonth) : "—"}
                      compare={dashboardStats?.newSubscribersThisMonthCompare ?? null}
                    />
                    <StatCard
                      icon={<UserRoundMinus size={24} color="#FF6600" />}
                      label={translate("superAdmin.subscription.stats.cancellations")}
                      value={dashboardStats != null ? String(dashboardStats.scheduledCancellations) : "—"}
                      compare={dashboardStats?.scheduledCancellationsCompare ?? null}
                    />
                  </View>
         
                </>
              ) : (
                <>
                  <StatCard
                    icon={<ArrowUp size={24} color="#FF6600" />}
                    label={translate("superAdmin.subscription.stats.totalCollected")}
                    value={
                      dashboardStats != null
                        ? `PHP ${dashboardStats.totalAmountCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—"
                    }
                    compare={dashboardStats?.totalAmountCollectedCompare ?? null}
                  />
                  <StatCard
                    icon={<UsersRound size={24} color="#FF6600" />}
                    label={translate("superAdmin.subscription.stats.activeSubscribers")}
                    value={dashboardStats != null ? String(dashboardStats.activeSubscribers) : "—"}
                    compare={dashboardStats?.activeSubscribersCompare ?? null}
                  />
                  <StatCard
                    icon={<UserRoundPlus size={24} color="#FF6600" />}
                    label={translate("superAdmin.subscription.stats.newSubscribers")}
                    value={dashboardStats != null ? String(dashboardStats.newSubscribersThisMonth) : "—"}
                    compare={dashboardStats?.newSubscribersThisMonthCompare ?? null}
                  />
                  <StatCard
                    icon={<UserRoundMinus size={24} color="#FF6600" />}
                    label={translate("superAdmin.subscription.stats.cancellations")}
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
                      {translate("superAdmin.subscription.basic.price")}
                    </Text>
                    <View className="pt-1 border-t border-slate-100 dark:border-slate-700">
                      <FeatureLine text={translate("superAdmin.subscription.basic.feature1")} />
                      <FeatureLine text={translate("superAdmin.subscription.basic.feature2")} />
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
                      {parseAmount(proAmountInput) != null
                        ? `${translate("superAdmin.subscription.pro.builtFor")} · ${formatPeso(parseAmount(proAmountInput))}/month`
                        : translate("superAdmin.subscription.pro.builtFor")}
                    </Text>

                    <View className="pt-1 border-t border-orange-100/80 dark:border-orange-900/40">
                      <FeatureLine text={translate("superAdmin.subscription.pro.feature1")} />
                      <FeatureLine text={translate("superAdmin.subscription.pro.feature2")} />
                      <FeatureLine text={translate("superAdmin.subscription.pro.feature3")} />
                    </View>

                    <View className="mt-4">
                      <TextField
                        label={translate("superAdmin.subscription.pro.priceLabel")}
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
                            label={translate("superAdmin.subscription.pro.saveChanges")}
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
                    {translate("superAdmin.subscription.managerSubs.title")}
                  </Text>
                </View>

                <Text className="text-xs font-poppins text-slate-500 dark:text-darkTextMuted leading-4 mb-4 px-0.5">
                  {translate("superAdmin.subscription.managerSubs.detail")}
                </Text>

                <Table
                  columns={tableColumns}
                  rows={subscribedManagers}
                  rowKey={(row, idx) => String(row.id ?? row.owner_id ?? idx)}
                  emptyText={translate("superAdmin.subscription.managerSubs.empty")}
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
                  {translate("superAdmin.subscription.managerSubs.title")}
                </Text>
                <Text className="text-[10px] font-poppins text-slate-500 dark:text-darkTextMuted leading-4">
                  {translate("superAdmin.subscription.managerSubs.empty")}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={subscriptionState.showSuccessModal}
        title={translate("superAdmin.subscription.modal.successTitle")}
        onClose={() => subscriptionState.setShowSuccessModal(false)}
        showCloseButton={false}
        buttons={[
          {
            label: translate("superAdmin.subscription.modal.okay"),
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
            {translate("superAdmin.subscription.modal.successDetail")}
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
