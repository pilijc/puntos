import React, { useCallback, useEffect, useMemo } from "react";
import { ActivityIndicator, Linking, Platform } from "react-native";
import { View, Text, SafeAreaView, ScrollView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePaymentReturnHandler } from "@/hooks/store-manager/use-payment-return-handler";
import { Button } from "@/components/button";
import { isPaidUnlimitedPlan } from "@/services/store-manager/subscription-limits";
import { Table, type TableColumn } from "@/components/ui/table";
import { Modal } from "@/components/modal";
import { useStoreManagerSubscriptionStore } from "@/store/store-manager/subscription-store";
import {
	getAuthenticatedUserId,
	getManagerSubscription,
	getManagerSubscriptionPayments,
	useSubscriptionCheckout,
	getSubscriptionPlans,
	normalizeSubscriptionId,
	cancelManagerSubscription,
	type ManagerSubscriptionPaymentRow,
} from "@/services/store-manager/subscription-service";

function toAmountNumber(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const n = Number(value);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

function formatDateLong(value: string | number | Date | null | undefined): string {
	if (!value) return "—";
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return "—";
	return new Intl.DateTimeFormat(undefined, {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(d);
}

function pickBasicAndProPlans(plans: Array<Record<string, unknown>>) {
	const basicPlan =
		plans.find((p) => String(p?.slug ?? "").toLowerCase() === "basic") ?? plans[0] ?? null;
	const proPlan = plans.find((p) => String(p?.slug ?? "").toLowerCase() === "pro") ?? null;
	return { basicPlan, proPlan };
}

export default function SubscriptionScreen() {
	const insets = useSafeAreaInsets();
	const isWeb = Platform.OS === "web";
	const scrollBottom = Math.max(insets.bottom, 40);
	const {
		ownerId,
		plans,
		managerRow,
		invoices,
		loading,
		loadingInvoices,
		startingCheckout,
		cancellingSubscription,
		modal,
		clearModal,
	} = useStoreManagerSubscriptionStore();
	usePaymentReturnHandler();

	useEffect(() => {
		let cancelled = false;
		const { reset, setLoading, setLoadingInvoices, hydrate } =
			useStoreManagerSubscriptionStore.getState();

		reset();

		void (async () => {
			try {
				const uid = await getAuthenticatedUserId();
				if (!uid) {
					if (!cancelled) setLoading(false);
					return;
				}

				setLoadingInvoices(true);
				const [planList, mgr, paymentRows] = await Promise.all([
					getSubscriptionPlans(),
					getManagerSubscription(uid),
					getManagerSubscriptionPayments(uid),
				]);

				if (cancelled) {
					setLoadingInvoices(false);
					return;
				}

				hydrate({
					ownerId: uid,
					plans: planList,
					managerRow: mgr,
					invoices: paymentRows,
				});
			} catch (e) {
				if (!cancelled) console.error("Subscription screen load error:", e);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	const { basicPlan, proPlan } = useMemo(() => pickBasicAndProPlans(plans), [plans]);

	const currentSubscriptionId = useMemo(
		() => normalizeSubscriptionId(managerRow?.subscription_id),
		[managerRow?.subscription_id],
	);

	const basicId = basicPlan?.id != null ? Number(basicPlan.id) : null;
	const proId = proPlan?.id != null ? Number(proPlan.id) : null;

	const activePlanName = useMemo(() => {
		if (currentSubscriptionId == null) return String(basicPlan?.name ?? "Basic plan");
		if (proId != null && currentSubscriptionId === proId)
			return String(proPlan?.name ?? "Pro plan");
		if (basicId != null && currentSubscriptionId === basicId)
			return String(basicPlan?.name ?? "Basic plan");
		return String(proPlan?.name ?? basicPlan?.name ?? "Plan");
	}, [basicId, basicPlan?.name, currentSubscriptionId, proId, proPlan?.name]);

	const activePlanAmount = useMemo(() => {
		const active =
			proId != null && currentSubscriptionId === proId
				? toAmountNumber(proPlan?.amount)
				: toAmountNumber(basicPlan?.amount);
		if (active == null) return 0;
		return active;
	}, [basicPlan, currentSubscriptionId, proId, proPlan]);

	const nextPaymentDate = managerRow?.current_period_end ?? null;
	const estimatedCost = activePlanAmount;

	const planListForGate = useMemo(
		() =>
			plans
				.map((p) => ({
					id: Number(p.id),
					slug: p.slug != null ? String(p.slug) : null,
				}))
				.filter((p) => Number.isFinite(p.id)),
		[plans],
	);

	const isPaidPro = isPaidUnlimitedPlan(managerRow, planListForGate);
	const cancelScheduled = Boolean(managerRow?.cancel_at_period_end);
	const periodLabel = cancelScheduled ? "Access until" : "Next payment";
	const accessEndMessage = useMemo(() => {
		const end = nextPaymentDate;
		if (!end) return null;
		return `Your subscription will remain active until ${formatDateLong(end)}. You will not be billed again.`;
	}, [nextPaymentDate]);

	const invoiceColumns = useMemo((): Array<TableColumn<ManagerSubscriptionPaymentRow>> => {
		return [
			{
				key: "payment_reference",
				header: "Payment reference",
				flex: 3,
				align: "left",
				render: (r) => (
					<View className="min-w-0">
						<Text
							className="text-xs font-poppins-semibold text-slate-800 dark:text-slate-100"
							numberOfLines={1}
						>
							{String(r.payment_reference ?? "—")}
						</Text>
					</View>
				),
			},
			{
				key: "paid_date",
				header: "Paid date",
				flex: 2,
				align: "center",
				render: (r) => (
					<Text className="text-xs font-poppins text-slate-700 dark:text-slate-200">
						{formatDateLong(r.paid_at ?? r.created_at)}
					</Text>
				),
			},
			{
				key: "status",
				header: "Status",
				flex: 1,
				align: "center",
				render: (r) => (
					<View className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/25">
						<Text className="text-xs font-poppins-bold uppercase text-green-700 dark:text-green-300">
							{String(r.payment_status ?? "—")}
						</Text>
					</View>
				),
			},
			{
				key: "amount",
				header: "Amount",
				flex: 1,
				align: "right",
				render: (r) => (
					<Text className="text-xs font-poppins text-slate-700 dark:text-slate-200"> 
            PHP&nbsp;{Number(r.amount_paid ?? 0).toFixed(2)}
					</Text>
				),
			},
		];
	}, []);

	const handleSubscribe = useCallback(async (amount: number, name: string) => {
		const s = useStoreManagerSubscriptionStore.getState();
		if (!s.ownerId) {
			s.showMessage("Something went wrong", "You must be signed in to subscribe.");
			return;
		}

		const { proPlan } = pickBasicAndProPlans(s.plans);
		const selectedSlug = String(proPlan?.slug ?? "pro");

		try {
			s.setStartingCheckout(true);
			const checkoutUrl = await useSubscriptionCheckout(s.ownerId, selectedSlug, amount, name);
			if (checkoutUrl) {
				await Linking.openURL(checkoutUrl);
			} else {
				s.showMessage(
					"Something went wrong",
					"Could not start checkout. Your session may be invalid. Please log in again and retry.",
				);
			}
		} catch (e) {
			s.showMessage(
				"Something went wrong",
				e instanceof Error ? e.message : "Please try again.",
			);
		} finally {
			s.setStartingCheckout(false);
		}
	}, []);

	const performCancel = useCallback(async () => {
		const s = useStoreManagerSubscriptionStore.getState();
		s.setCancellingSubscription(true);
		try {
			const uid = s.ownerId;
			const result = await cancelManagerSubscription();
			if (result.ok === false) {
				s.showMessage("Could not cancel", result.error);
				return;
			}

			let refreshedEnd = result.current_period_end ?? null;
			const refreshId = uid ?? (await getAuthenticatedUserId());
			const mgr = refreshId ? await getManagerSubscription(refreshId) : null;
			if (mgr) {
				useStoreManagerSubscriptionStore.setState({ managerRow: mgr });
			}
			refreshedEnd = refreshedEnd ?? mgr?.current_period_end ?? null;

			const endFormatted = formatDateLong(refreshedEnd);
			s.showMessage(
				"Subscription",
				`Your subscription will remain active until ${endFormatted}. You will not be billed again.`,
			);
		} catch (e) {
			s.showMessage(
				"Something went wrong",
				e instanceof Error ? e.message : "Please try again.",
			);
		} finally {
			s.setCancellingSubscription(false);
		}
	}, []);

	const openCancelConfirm = useCallback(() => {
		const s = useStoreManagerSubscriptionStore.getState();
		s.setModal({
			title: "Cancel subscription?",
			message:
				"You will keep your current benefits until the end of this billing period. After that date you will not be charged again.",
			buttons: [
				{ label: "Go back", variant: "secondary", onPress: () => s.clearModal() },
				{
					label: "Confirm cancel",
					variant: "danger",
					onPress: () => {
						s.clearModal();
						void performCancel();
					},
				},
			],
		});
	}, [performCancel]);

	const proAmount = toAmountNumber(proPlan?.amount);

	return (
		<SafeAreaView
			edges={["top", "left", "right"]}
			className="flex-1 bg-backgroundMuted dark:bg-neutral-900"
		>
			<Modal
				visible={!!modal}
				onClose={clearModal}
				title={modal?.title ?? ""}
				message={modal?.message}
				buttons={modal?.buttons}
			/>
			<View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-6 py-4">
				<Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
					Billing & Subscription
				</Text>
			</View>
			{loading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#FF6600" />
				</View>
			) : (
				<ScrollView
					className="flex-1"
					contentContainerStyle={{
						paddingHorizontal: 16,
						paddingTop: 16,
						paddingBottom: scrollBottom,
						...(isWeb ? { alignItems: "center" as const } : {}),
					}}
					showsVerticalScrollIndicator={false}
				>
					<View
						style={{ maxWidth: isWeb ? 896 : undefined }}
						className="w-full gap-4"
					>
						<View className="relative w-full overflow-hidden rounded-2xl bg-primary p-5 elevation-2">
							<View className="absolute inset-0 pointer-events-none">
								<View className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10" />
								<View className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/8" />
								<View className="absolute top-10 -right-24 h-10 w-80 rotate-12 rounded-full bg-white/10" />
								<View className="absolute bottom-10 -left-24 h-10 w-72 -rotate-12 rounded-full bg-white/8" />
							</View>
							{cancellingSubscription ? (
								<View className="absolute inset-0 z-10 rounded-2xl bg-black/25 items-center justify-center">
									<ActivityIndicator size="large" color="#FF6600" />
								</View>
							) : null}
							<View className="w-full">
								<View className="flex-row items-center gap-2">
									<View className="px-2 py-1 rounded-full bg-white/15">
										<Text className="text-[10px] font-poppins-bold uppercase tracking-wider text-white">
											Active plan
										</Text>
									</View>

									<Text className="text-xs font-poppins-semibold bg-white/15 text-white px-2 py-0.5 rounded-full">
										{activePlanName}
									</Text>
								</View>

								{accessEndMessage && cancelScheduled ? (
									<View className="mt-3 rounded-xl bg-white/15 px-3 py-2.5">
										<Text className="text-xs font-poppins leading-5 text-white">
											{accessEndMessage}
										</Text>
									</View>
								) : null}

								<View className="flex-row items-end gap-1 mt-4">
									<Text className="text-4xl font-poppins-bold text-white">
										{activePlanAmount === 0 ? "Free" : `PHP ${activePlanAmount.toFixed(2)}`}
									</Text>
									{activePlanAmount !== 0 ? (
										<Text className="text-sm font-poppins text-white/80 mb-1">
											/mo
										</Text>
									) : null}
								</View>

								<View className="flex-row gap-6 mt-5">
									<View className="flex-1">
										<Text className="text-xs font-poppins text-white/80">
											{periodLabel}
										</Text>
										<Text className="mt-1 text-sm font-poppins-semibold text-white">
											{formatDateLong(nextPaymentDate)}
										</Text>
									</View>
									<View className="flex-1">
										<Text className="text-xs font-poppins text-white/80">
											Estimated cost
										</Text>
										<Text className="mt-1 text-sm font-poppins-semibold text-white">
											{activePlanAmount === 0 ? "PHP 0.00" : `PHP ${estimatedCost.toFixed(2)}`}
										</Text>
									</View>
								</View>

								<View className="flex-row flex-wrap gap-3 mt-6 justify-start">
									{!isPaidPro && proPlan ? (
										<Button
											variant="primary"
											label="Upgrade to Pro"
											roundedFull
											icon="Sparkles"
											loading={startingCheckout}
											onPress={() => {
												const amount = proAmount ?? 0;
												const name = String(proPlan?.name ?? "Pro plan");
												void handleSubscribe(amount, name);
											}}
											disabled={startingCheckout || !ownerId || proAmount == null}
										/>
									) : null}
									{isPaidPro && !cancelScheduled ? (
										<Button
											variant="secondary"
											fitContent={true}
											label="Cancel Subscription"
											roundedFull
											onPress={openCancelConfirm}
											disabled={cancellingSubscription}
										/>
									) : null}
								</View>
							</View>
						</View>

						<View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-slate-100 dark:border-neutral-800 p-4">
							<View className="flex-row items-center gap-2 mb-2">
								<Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100">
									Recent billing
								</Text>
							</View>
							<Text className="text-xs font-poppins text-slate-500 dark:text-darkTextMuted leading-4 mb-4 px-0.5">
								Payment history for your account.
							</Text>

							{loadingInvoices ? (
								<View className="py-8 items-center justify-center">
									<ActivityIndicator size="small" color="#FF6600" />
								</View>
							) : (
								<>
									<Table
										variant="boxed"
										columns={invoiceColumns}
										rows={invoices}
										rowKey={(r, idx) => String(r.id ?? `${r.owner_id}-${idx}`)}
										emptyText="No invoices yet."
									/>
									<View className="mt-3 items-center">
										<Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
											You&apos;ve reached the end.
										</Text>
									</View>
								</>
							)}
						</View>
					</View>
				</ScrollView>
			)}
		</SafeAreaView>
	);
}
