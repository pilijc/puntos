import React from "react";
import {
	ScrollView,
	RefreshControl,
} from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AdminStoreCard, AdminStoreSkeletonCard } from "@/components/users/stores/admin-store-card";
import { AdminStoreDetails } from "@/components/users/stores/admin-store-details";
import { Modal } from "@/components/modal";
import {
	useSuperAdminStores,
	FILTERS,
	FILTER_LABELS,
} from "@/hooks/super-admin/use-super-admin-stores";

// ── Screen ──────────────────────────────────────────────────────────────────
export default function SuperAdminStores() {
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
		confirmModal,
		setConfirmModal,
		onRefresh,
		handleApprove,
		handleReject,
		getEffectiveStatus,
		filtered,
		pendingCount,
	} = useSuperAdminStores();

	if (selectedStore) {
		return (
			<AdminStoreDetails 
				store={selectedStore} 
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
		<ScreenWrapper className="flex-1 bg-backgroundMuted dark:bg-slate-950">

			{/* ── Header ── */}
			<View className="bg-white border-b border-slate-100 dark:bg-slate-900 dark:border-slate-800 px-6 py-4 flex-row items-center justify-start">
				<View className="flex-row items-center gap-2 py-1">
					<MaterialIcons name="storefront" size={22} color="black" className="mt-1" />
					<Text className="text-2xl font-poppins-bold text-slate-900 dark:text-slate-100 flex-1">
						Store Approvals
					</Text>
				</View>
			</View>

			{/* ── Filter tabs ── */}
			<View className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
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
										: "text-sm font-poppins-medium text-slate-400 dark:text-slate-500"
								}
								numberOfLines={1}
							>
								{FILTER_LABELS[f]}
							</Text>
							{count > 0 && (
								<View
									className={`rounded-full px-1.5 min-w-[20px] items-center ${active
										? "bg-primary/10"
										: "bg-neutral-100 dark:bg-neutral-700"
										}`}
								>
									<Text
										className={`text-[10px] font-poppins-bold ${active
											? "text-primary"
											: "text-neutral-500 dark:text-neutral-400"
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

			{/* ── Store list ── */}
			<View className="flex-1">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
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
						onSelect={(s) => setSelectedStore(s)}
					/>
				))}

					{!loading && filtered.length === 0 && !error && (
						<View className="items-center pt-16 gap-3">
							<MaterialIcons name="storefront" size={52} color="#CBD5E1" />
							<Text className="text-base font-poppins-bold text-slate-600 dark:text-slate-300">
								{activeFilter === "All" ? "No stores yet" : `No ${FILTER_LABELS[activeFilter]} stores`}
							</Text>
							<Text className="text-sm font-poppins text-slate-400 text-center px-8">
								Pull down to refresh or try another category.
							</Text>
						</View>
					)}
				</ScrollView>
			</View>

			<Modal
				visible={!!errorModal}
				onClose={dismissErrorModal}
				title={errorModal?.title ?? (errorModal?.type === "success" ? "Success" : "Error")}
				message={errorModal?.message ?? ""}
				buttons={[
					{
						label: "OK",
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
						label: "Cancel",
						onPress: () => setConfirmModal(null),
						variant: "secondary",
					},
					{
						label: confirmModal?.label ?? "Confirm",
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
