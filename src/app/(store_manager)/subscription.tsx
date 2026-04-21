import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Animated, Linking, Platform, useColorScheme } from "react-native";
import { View, Text, SafeAreaView, ScrollView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePaymentReturnHandler } from "@/hooks/store-manager/use-payment-return-handler";
import { Button } from "@/components/button";
import { isPaidUnlimitedPlan } from "@/services/store-manager/subscription-limits";
import { Table, type TableColumn } from "@/components/ui/table";
import { Modal } from "@/components/modal";
import { useStoreManagerSubscriptionStore } from "@/store/store-manager/subscription-store";
import { useTranslation } from "react-i18next";
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
	const colorScheme = useColorScheme();
	const { t: translate } = useTranslation();
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
		if (loading) return "—";
		if (currentSubscriptionId == null) return String(basicPlan?.name ?? "Basic plan");
		if (proId != null && currentSubscriptionId === proId)
			return String(proPlan?.name ?? "Pro plan");
		if (basicId != null && currentSubscriptionId === basicId)
			return String(basicPlan?.name ?? "Basic plan");
		return String(proPlan?.name ?? basicPlan?.name ?? "Plan");
	}, [basicId, basicPlan?.name, currentSubscriptionId, proId, proPlan?.name]);

	const activePlanAmount = useMemo(() => {
		if (loading) return 0;
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
	const periodLabel = cancelScheduled
		? translate("storeManager.subscription.billing.period.accessUntil")
		: translate("storeManager.subscription.billing.period.nextPayment");
	const accessEndMessage = useMemo(() => {
		const end = nextPaymentDate;
		if (!end) return null;
		return translate("storeManager.subscription.billing.messages.accessUntilNoBill", {
			date: formatDateLong(end),
		});
	}, [nextPaymentDate, translate]);

	const invoiceColumns = useMemo((): Array<TableColumn<ManagerSubscriptionPaymentRow>> => {
		return [
			{
				key: "payment_reference",
				header: translate("storeManager.subscription.billing.invoices.columns.paymentReference"),
				flex: 3,
				align: "left",
				render: (r) => (
					<View className="min-w-0">
						<Text
							className="text-xs font-poppins text-textSecondary"
							numberOfLines={1}
						>
							{String(r.payment_reference ?? "—")}
						</Text>
					</View>
				),
			},
			{
				key: "paid_date",
				header: translate("storeManager.subscription.billing.invoices.columns.paidDate"),
				flex: 2,
				align: "center",
				render: (r) => (
					<Text className="text-xs font-poppins text-textSecondary">
						{formatDateLong(r.paid_at ?? r.created_at)}
					</Text>
				),
			},
			{
				key: "status",
				header: translate("storeManager.subscription.billing.invoices.columns.status"),
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
				header: translate("storeManager.subscription.billing.invoices.columns.amount"),
				flex: 1,
				align: "right",
				render: (r) => (
					<Text className="text-xs font-poppins text-textSecondary"> 
            PHP&nbsp;{Number(r.amount_paid ?? 0).toFixed(2)}
					</Text>
				),
			},
		];
	}, [translate]);

	const handleSubscribe = useCallback(async (amount: number, name: string) => {
		const s = useStoreManagerSubscriptionStore.getState();
		if (!s.ownerId) {
			s.showMessage(
				translate("label.somethingWentWrong"),
				translate("storeManager.subscription.billing.errors.mustBeSignedInToSubscribe"),
			);
			return;
		}

		const { proPlan } = pickBasicAndProPlans(s.plans);
		const selectedSlug = String(proPlan?.slug ?? "pro");

		try {
			s.setStartingCheckout(true);
			console.log('Starting checkout for:', { ownerId: s.ownerId, selectedSlug, amount, name });
			const checkoutUrl = await useSubscriptionCheckout(s.ownerId, selectedSlug, amount, name);
			if (checkoutUrl) {
				await Linking.openURL(checkoutUrl);
			} else {
				s.showMessage(
					translate("label.somethingWentWrong"),
					translate("storeManager.subscription.billing.errors.checkoutStartFailed"),
				);
			}
		} catch (e) {
			s.showMessage(
				translate("label.somethingWentWrong"),
				e instanceof Error ? e.message : translate("storeManager.subscription.billing.errors.pleaseTryAgain"),
			);
		} finally {
			s.setStartingCheckout(false);
		}
	}, [translate]);

	const performCancel = useCallback(async () => {
		const s = useStoreManagerSubscriptionStore.getState();
		s.setCancellingSubscription(true);
		try {
			const uid = s.ownerId;
			const result = await cancelManagerSubscription();
			if (result.ok === false) {
				s.showMessage(translate("storeManager.subscription.billing.cancel.failedTitle"), result.error);
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
				translate("storeManager.subscription.billing.cancel.successTitle"),
				translate("storeManager.subscription.billing.messages.accessUntilNoBill", {
					date: endFormatted,
				}),
			);
		} catch (e) {
			s.showMessage(
				translate("label.somethingWentWrong"),
				e instanceof Error ? e.message : translate("storeManager.subscription.billing.errors.pleaseTryAgain"),
			);
		} finally {
			s.setCancellingSubscription(false);
		}
	}, [translate]);

	const openCancelConfirm = useCallback(() => {
		const s = useStoreManagerSubscriptionStore.getState();
		s.setModal({
			title: translate("storeManager.subscription.billing.cancel.confirmTitle"),
			message: translate("storeManager.subscription.billing.cancel.confirmMessage"),
			buttons: [
				{
					label: translate("storeManager.subscription.billing.cancel.goBack"),
					variant: "secondary",
					onPress: () => s.clearModal(),
				},
				{
					label: translate("storeManager.subscription.billing.cancel.confirmCta"),
					variant: "danger",
					onPress: () => {
						s.clearModal();
						void performCancel();
					},
				},
			],
		});
	}, [performCancel, translate]);

	const proAmount = toAmountNumber(proPlan?.amount);


	const checkoutSession = {
		id: "cs_e8e8ce7fb4d8ef22ae3e1245",
		type: "checkout_session",
		attributes: {
		  billing: {
			address: {
			  city: null,
			  country: null,
			  line1: null,
			  line2: null,
			  postal_code: null,
			  state: null,
			},
			email: null,
			name: null,
			phone: null,
		  },
		  billing_information_fields_editable: "enabled",
		  cancel_url: "http://localhost:8081/subscription/cancel",
		  checkout_url:
			"https://checkout.paymongo.com/cs_e8e8ce7fb4d8ef22ae3e1245_client_b9d8e3fcb6d9b3212baba1fe#cGtfdGVzdF8yTnVXb3hTY2lEUzJQdlVnamU4cHlkcWQ=",
		  client_key: "cs_e8e8ce7fb4d8ef22ae3e1245_client_b9d8e3fcb6d9b3212baba1fe",
		  customer_email: null,
		  customer_id: null,
		  description: null,
		  line_items: [
			{
			  amount: 29900,
			  currency: "PHP",
			  description: "Subscription",
			  images: [],
			  name: "Pro Monthly Plan",
			  quantity: 1,
			},
		  ],
		  livemode: false,
		  merchant: "Puntos",
		  paid_at: 1776386511,
		  payments: [
			{
			  id: "pay_9DCoC7e2pEYu7Yu42geu3K8D",
			  type: "payment",
			  attributes: {
				access_url: null,
				amount: 29900,
				balance_transaction_id: "bal_txn_diacghwEXz3YqM9kCFJHJdbY",
				billing: {
				  address: {
					city: null,
					country: null,
					line1: null,
					line2: null,
					postal_code: null,
					state: null,
				  },
				  email: "kayshamir2004@gmail.com",
				  name: "Kay Sh",
				  phone: "9178208391",
				},
				currency: "PHP",
				description: null,
				digital_withholding_vat_amount: 0,
				disputed: false,
				external_reference_number: null,
				fee: 748,
				instant_settlement: null,
				livemode: false,
				net_amount: 29152,
				origin: "api",
				payment_intent_id: "pi_B6s3Jw7Jm9uAtFLr5qgRKD32",
				payout: null,
				source: {
				  id: "src_WD5z9Pu4ATbj7NhDkATL21Uy",
				  type: "gcash",
				  provider: {
					id: null,
				  },
				  provider_id: null,
				},
				statement_descriptor: "Puntos",
				status: "paid",
				tax_amount: null,
				metadata: {
				  slug: "pro",
				  owner_id: "cb72aec9-c64d-460a-a0a2-40740ec8abd2",
				},
				promotion: null,
				refunds: [],
				taxes: [],
				available_at: 1776762000,
				created_at: 1776386511,
				credited_at: 1776906000,
				paid_at: 1776386511,
				updated_at: 1776386511,
			  },
			},
		  ],
		  payment_intent: {
			id: "pi_B6s3Jw7Jm9uAtFLr5qgRKD32",
			type: "payment_intent",
			attributes: {
			  amount: 29900,
			  capture_type: "automatic",
			  client_key: "pi_B6s3Jw7Jm9uAtFLr5qgRKD32_client_7Ntby6ecxjpFeJ3zWvnmKmC2",
			  currency: "PHP",
			  description: null,
			  livemode: false,
			  original_amount: 29900,
			  statement_descriptor: "Puntos",
			  status: "succeeded",
			  last_payment_error: null,
			  payment_method_allowed: ["card", "gcash"],
			  payments: [
				{
				  id: "pay_9DCoC7e2pEYu7Yu42geu3K8D",
				  type: "payment",
				  attributes: {
					access_url: null,
					amount: 29900,
					balance_transaction_id: "bal_txn_diacghwEXz3YqM9kCFJHJdbY",
					billing: {
					  address: {
						city: null,
						country: null,
						line1: null,
						line2: null,
						postal_code: null,
						state: null,
					  },
					  email: "kayshamir2004@gmail.com",
					  name: "Kay Sh",
					  phone: "9178208391",
					},
					currency: "PHP",
					description: null,
					digital_withholding_vat_amount: 0,
					disputed: false,
					external_reference_number: null,
					fee: 748,
					instant_settlement: null,
					livemode: false,
					net_amount: 29152,
					origin: "api",
					payment_intent_id: "pi_B6s3Jw7Jm9uAtFLr5qgRKD32",
					payout: null,
					source: {
					  id: "src_WD5z9Pu4ATbj7NhDkATL21Uy",
					  type: "gcash",
					  provider: {
						id: null,
					  },
					  provider_id: null,
					},
					statement_descriptor: "Puntos",
					status: "paid",
					tax_amount: null,
					metadata: {
					  slug: "pro",
					  owner_id: "cb72aec9-c64d-460a-a0a2-40740ec8abd2",
					},
					promotion: null,
					refunds: [],
					taxes: [],
					available_at: 1776762000,
					created_at: 1776386511,
					credited_at: 1776906000,
					paid_at: 1776386511,
					updated_at: 1776386511,
				  },
				},
			  ],
			  next_action: null,
				card: {
			  payment_method_options: {
				  request_three_d_secure: "any",
				},
			  },
			  metadata: {
				slug: "pro",
				owner_id: "cb72aec9-c64d-460a-a0a2-40740ec8abd2",
			  },
			  setup_future_usage: null,
			  created_at: 1776386508,
			  updated_at: 1776386511,
			},
		  },
		  payment_method_types: [],
		  payment_method_used: "gcash",
		  reference_number: null,
		  send_email_receipt: false,
		  show_description: true,
		  show_line_items: true,
		  status: "active",
		  success_url: "http://localhost:8081/subscription/success",
		  created_at: 1776386502,
		  updated_at: 1776386508,
		  metadata: {
			owner_id: "cb72aec9-c64d-460a-a0a2-40740ec8abd2",
			slug: "pro",
		  },
		},
	  };

	  console.log(checkoutSession.attributes.payment_intent.attributes.payments[0].id)

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
					{translate("storeManager.subscription.billing.title")}
				</Text>
			</View>
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
						<View className="relative w-full overflow-hidden rounded-xl bg-primary p-5 elevation-2">
							<View className="absolute inset-0 pointer-events-none">
								<View className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10" />
								<View className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/8" />
								<View className="absolute top-10 -right-24 h-10 w-80 rotate-12 rounded-full bg-white/10" />
								<View className="absolute bottom-10 -left-24 h-10 w-72 -rotate-12 rounded-full bg-white/8" />
							</View>
							{cancellingSubscription ? (
								<View className="absolute inset-0 z-10 rounded-xl bg-black/25 items-center justify-center">
									<ActivityIndicator size="large" color="#FF6600" />
								</View>
							) : null}
							<View className="w-full">
								<View className="flex-row items-center gap-2">
									<View className="px-2 py-1 rounded-full bg-white/15">
										<Text className="text-[10px] font-poppins-bold uppercase tracking-wider text-white">
											{translate("storeManager.subscription.billing.activePlanBadge")}
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
										{activePlanAmount === 0
											? translate("storeManager.subscription.billing.free")
											: `PHP ${activePlanAmount.toFixed(2)}`}
									</Text>
									{activePlanAmount !== 0 ? (
										<Text className="text-sm font-poppins-bold text-white/80 mb-1">
											{translate("storeManager.subscription.billing.perMonth")}
										</Text>
									) : null}
								</View>

								<View className="flex-row gap-6 mt-5">
									<View className="flex-1">
										<Text className="text-xs font-poppins-semibold text-white/80">
											{periodLabel}
										</Text>
										<Text className="mt-1 text-sm font-poppins-semibold text-white">
											{formatDateLong(nextPaymentDate)}
										</Text>
									</View>
									<View className="flex-1">
										<Text className="text-xs font-poppins-semibold text-white/80">
											{translate("storeManager.subscription.billing.estimatedCost")}
										</Text>
										<Text className="mt-1 text-sm font-poppins-semibold text-white">
											{activePlanAmount === 0 ? "PHP 0.00" : `PHP ${estimatedCost.toFixed(2)}`}
										</Text>
									</View>
								</View>

								<View className="flex-row flex-wrap gap-3 mt-6 justify-start">
									{!isPaidPro && proPlan ? (
										<Button
											variant="accent"
											label={translate("storeManager.subscription.billing.upgradeToPro")}
											roundedFull
											icon="Sparkles"
											elevation={true}
											loading={startingCheckout}
											onPress={() => {
												const amount = proAmount ?? 0;
												const name = String(
													proPlan?.name ??
														translate("storeManager.subscription.billing.fallbackPlanName.pro"),
												);
												void handleSubscribe(amount, name);
											}}
											disabled={startingCheckout || !ownerId || proAmount == null}
										/>
									) : null}
									{isPaidPro && !cancelScheduled ? (
										<Button
											variant="secondary"
											fitContent={true}
											label={translate("storeManager.subscription.billing.cancelSubscription")}
											roundedFull
											onPress={openCancelConfirm}
											disabled={cancellingSubscription}
										/>
									) : null}
								</View>
							</View>
						</View>

						<View className="bg-white dark:bg-darkBackgroundCard rounded-xl border border-slate-100 dark:border-neutral-800 p-4">
							<View className="flex-row items-center gap-2 mb-2">
								<Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100">
									{translate("storeManager.subscription.billing.recentBilling.title")}
								</Text>
							</View>
							<Text className="text-xs font-poppins text-slate-500 dark:text-darkTextMuted leading-4 mb-4 px-0.5">
								{translate("storeManager.subscription.billing.recentBilling.subtitle")}
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
										emptyText={translate("storeManager.subscription.billing.invoices.empty")}
									/>
									<View className="mt-3 items-center">
										<Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
											{translate("storeManager.subscription.billing.invoices.end")}
										</Text>
									</View>
								</>
							)}
						</View>
					</View>
				</ScrollView>
		</SafeAreaView>
	);
}
