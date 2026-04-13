import React from "react";
import {
	ScrollView,
	RefreshControl,
} from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { useTranslation } from "react-i18next";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AdminStoreCard, AdminStoreSkeletonCard } from "@/components/users/stores/admin-store-card";
import { AdminStoreDetails } from "@/components/users/stores/admin-store-details";
import { AdminStorePreviewModal } from "@/components/users/stores/admin-store-preview-modal";
import { Modal } from "@/components/modal";
import { Toggle } from "@/components/toggle";
import {
	useSuperAdminStores,
	FILTERS,
} from "@/hooks/super-admin/use-super-admin-stores";

// ── Screen ──────────────────────────────────────────────────────────────────
export default function SuperAdminStores() {
	const { t: translate } = useTranslation();
	const {
		stores,
		loading,
		error,
		errorModal,
		dismissErrorModal,
		activeFilter,
		setActiveFilter,
		refreshing,
		selectedStore,
		setSelectedStore,
		previewStore,
		setPreviewStore,
		confirmModal,
		setConfirmModal,
		onRefresh,
		handleApprove,
		handleReject,
		getEffectiveStatus,
		filtered,
		pendingCount,
		FILTER_LABELS,
		enforceSubscription,
		setEnforceSubscription,
	} = useSuperAdminStores();

	const selectedOwnerActiveStoresCount = selectedStore 
		? stores.filter(s => s.owner_id === selectedStore.owner_id && s.id !== selectedStore.id && (s.status === "active" || s.is_active)).length 
		: 0;

	if (selectedStore) {
		return (
			<AdminStoreDetails 
				store={selectedStore} 
				ownerActiveStoresCount={selectedOwnerActiveStoresCount}
				onBack={() => setSelectedStore(null)} 
				onApprove={(store) => {
					handleApprove(store);
					setSelectedStore(null); 
				}} 
				onReject={(store) => {
					handleReject(store);
					setSelectedStore(null);
				}} 
			/>
		);
	}

	return (
		<ScreenWrapper className="flex-1 bg-backgroundMuted dark:bg-darkBackground">

			{/* ── Header ── */}
			<View className="bg-white border-b border-slate-100 dark:bg-darkBackgroundMuted dark:border-darkBorder px-6 py-4 flex-row items-center justify-start">
				<View className="flex-row items-center gap-2 py-1">
					<MaterialIcons name="storefront" size={22} color="black" className="mt-1" />
					<Text className="text-2xl font-poppins-bold text-slate-900 dark:text-darkTextPrimary flex-1">
						{translate("superAdmin.stores.title")}
					</Text>
				</View>
			</View>

			{/* ── Filter tabs ── */}
			<View className="bg-white dark:bg-darkBackgroundMuted border-b border-slate-100 dark:border-darkBorder">
				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 28, flexDirection: "row" }}>
					{FILTERS.map((f) => {
						const active = activeFilter === f;
						const count = f === "All" ? stores.length : stores.filter((s) => getEffectiveStatus(s) === f).length;
						return (
							<TouchableOpacity
								key={f}
								className={`py-3 items-center flex-row justify-center gap-1.5 border-b-2 ${active ? 'border-primary' : 'border-transparent'}`}
								onPress={() => setActiveFilter(f)}
								activeOpacity={0.7}
							>
							<Text
								className={
									active
										? "text-sm font-poppins-bold text-primary"
										: "text-sm font-poppins-medium text-slate-400 dark:text-darkTextMuted"
								}
								numberOfLines={1}
							>
								{FILTER_LABELS[f]}
							</Text>
							{count > 0 && (
								<View
									className={`rounded-full px-1.5 min-w-[20px] items-center ${active
										? "bg-primary/10"
										: "bg-neutral-100 dark:bg-darkBackgroundCard"
										}`}
								>
									<Text
										className={`text-[10px] font-poppins-bold ${active
											? "text-primary"
											: "text-neutral-500 dark:text-darkTextMuted"
											}`}
									>
										{count}
									</Text>
								</View>
							)}
						</TouchableOpacity>
					);
				})}
				</ScrollView>
			</View>

			<View className="bg-white dark:bg-darkBackgroundMuted border-b border-slate-100 dark:border-darkBorder px-6 py-3 flex-row items-center justify-between">
				<View className="flex-1 pr-4">
					<Text className="text-sm font-poppins-semibold text-slate-800 dark:text-darkTextPrimary">Enforce Subscription</Text>
					<Text className="text-[10px] font-poppins text-slate-500 dark:text-darkTextMuted leading-4 mt-0.5">Require store managers to pay after exceeding 2 active stores.</Text>
				</View>
				<Toggle size="sm" value={enforceSubscription} onValueChange={setEnforceSubscription} />
			</View>

			{/* ── Store list ── */}
			<View className="flex-1">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ padding: 16, paddingBottom: filtered.length === 0 ? 16 : 40 }}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor="#FF6600"
							colors={["#FF6600"]}
						/>
					}
				>
					{error && !loading && (
						<View className="flex-row items-center gap-2 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-3 mb-4">
							<MaterialIcons name="error-outline" size={16} color="#DC2626" />
							<Text className="flex-1 text-sm font-poppins text-red-600 dark:text-red-400">{error}</Text>
						</View>
					)}

				{loading && (
					<>
						<AdminStoreSkeletonCard />
						<AdminStoreSkeletonCard />
						<AdminStoreSkeletonCard />
					</>
				)}

				{!loading && filtered.map((store) => (
					<AdminStoreCard
						key={store.id}
						store={store}
						onApprove={handleApprove}
						onReject={handleReject}
						onSelect={(s) => setPreviewStore(s)}
					/>
				))}

					{!loading && filtered.length === 0 && !error && (
						<View className="items-center pt-16 gap-3">
							<MaterialIcons name="storefront" size={52} color="#CBD5E1" />
							<Text className="text-base font-poppins-bold text-slate-600 dark:text-darkTextSecondary">
								{activeFilter === "All" 
									? translate("superAdmin.stores.noStores") 
									: translate("superAdmin.stores.noFilteredStores", { status: FILTER_LABELS[activeFilter] })}
							</Text>
							<Text className="text-sm font-poppins text-slate-400 text-center px-8">
								{translate("superAdmin.stores.pullToRefresh")}
							</Text>
						</View>
					)}
				</ScrollView>
			</View>

			<AdminStorePreviewModal
				visible={!!previewStore}
				store={previewStore}
				onClose={() => setPreviewStore(null)}
				onViewFullDetails={() => {
					setSelectedStore(previewStore);
					setPreviewStore(null);
				}}
				onApprove={() => {
					if (previewStore) handleApprove(previewStore);
				}}
				onReject={() => {
					if (previewStore) {
						handleReject(previewStore);
					}
				}}
			/>

			<Modal
				visible={!!errorModal}
				onClose={dismissErrorModal}
				title={errorModal?.title ?? (errorModal?.type === "success" ? "Success" : "Error")}
				message={errorModal?.message ?? ""}
				buttons={[
					{
						label: translate("label.ok"),
						onPress: dismissErrorModal,
						variant: errorModal?.type === "success" ? "success" : "primary",
					},
				]}
				showCloseButton={false}
				dismissOnBackdrop
			/>

			<Modal
				visible={!!confirmModal}
				onClose={() => setConfirmModal(null)}
				title={confirmModal?.title ?? ""}
				message={confirmModal?.message ?? ""}
				buttons={[
					{
						label: translate("label.cancel"),
						onPress: () => setConfirmModal(null),
						variant: "secondary",
					},
					{
						label: confirmModal?.label ?? translate("label.confirm"),
						onPress: confirmModal?.onConfirm ?? (() => {}),
						variant: confirmModal?.variant ?? "primary",
					},
				]}
				showCloseButton={false}
				dismissOnBackdrop
			/>
		</ScreenWrapper>
	);
}
