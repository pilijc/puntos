import React, { useState } from "react";
import { ScrollView, TouchableOpacity as RNTouchableOpacity } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modal } from "@/components/modal";
import { AdminStoreRow } from "@/services/store-service";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; text?: string }> = {
	active: { label: "Active", color: "#22C55E", bg: "bg-success/10", dot: "#22C55E", text: "text-success" },
	pending_review: { label: "Pending", color: "#F59E0B", bg: "bg-amber-100 dark:bg-amber-900/20", dot: "#F59E0B", text: "text-amber-600 dark:text-amber-400" },
	inactive: { label: "Inactive", color: "#94A3B8", bg: "bg-slate-100 dark:bg-slate-800", dot: "#94A3B8", text: "text-slate-500 dark:text-slate-400" },
};

export function AdminStoreCard({
	store,
	onApprove,
	onReject,
}: {
	store: AdminStoreRow;
	onApprove: (store: AdminStoreRow) => void;
	onReject: (store: AdminStoreRow) => void;
}) {
	const status = store.status ?? "inactive";
	const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["inactive"];
	const isPending = status === "pending_review";
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);

	return (
		<>
			<TouchableOpacity
				className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden mb-3"
				onPress={() => setModalVisible(true)}
				activeOpacity={0.95}
			>
				<View className="p-4 flex-row gap-3">
					<View className="w-[60px] h-[60px] rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center overflow-hidden">
						{store.logo ? (
							<Image
								source={{ uri: store.logo }}
								style={{ width: 60, height: 60 }}
								contentFit="cover"
							/>
						) : (
							<MaterialIcons name="storefront" size={26} color="#94A3B8" />
						)}
					</View>

					<View className="flex-1 justify-center gap-y-1">
						<View className="flex-row items-center justify-between">
							<Text className="font-poppins-bold text-[15px] text-slate-900 dark:text-slate-100 flex-1 mr-2" numberOfLines={1}>{store.name}</Text>
							<View className={`px-2 py-0.5 rounded-full ${cfg.bg}`}>
								<Text className={`text-[9px] font-poppins-bold uppercase tracking-wider ${cfg.text}`}>
									{cfg.label}
								</Text>
							</View>
						</View>
						<View className="flex-row items-center gap-1">
							<MaterialIcons name="location-on" size={12} color="#94A3B8" />
							<Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 flex-1" numberOfLines={1}>{store.address ?? "No address provided"}</Text>
						</View>
						{store.type ? (
							<View className="flex-row items-center gap-1">
								<MaterialIcons name="category" size={12} color="#94A3B8" />
								<Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 flex-1" numberOfLines={1}>{store.type}</Text>
							</View>
						) : null}
					</View>
				</View>

				{/* ── Visual Indicator for Tap ── */}
				<View className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex-row justify-between items-center">
					<Text className="text-xs font-poppins-medium text-slate-500 dark:text-slate-400">
						Tap to view details
					</Text>
					<MaterialIcons name="chevron-right" size={18} color="#94A3B8" />
				</View>

			{/* ── Details Modal ── */}
			<Modal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				title="Store Details"
				buttons={isPending ? [
					{
						label: "Reject",
						variant: "danger",
						onPress: () => {
							setModalVisible(false);
							setTimeout(() => onReject(store), 300);
						}
					},
					{
						label: "Approve Store",
						variant: "success",
						onPress: () => {
							setModalVisible(false);
							setTimeout(() => onApprove(store), 300);
						}
					}
				] : []}
			>
				<ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
					{/* Top row again inside modal for context */}
					<View className="flex-row items-start mb-5 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
						<View className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center overflow-hidden">
							{store.logo ? (
								<Image source={{ uri: store.logo }} style={{ width: 56, height: 56 }} contentFit="cover" />
							) : (
								<MaterialIcons name="storefront" size={24} color="#94A3B8" />
							)}
						</View>
						<View className="flex-1 ml-3">
							<Text className="text-[15px] font-poppins-bold text-slate-900 dark:text-slate-100">{store.name}</Text>
							{store.type ? <Text className="text-[11px] font-poppins-medium text-primary mt-0.5">{store.type}</Text> : null}
							{store.address ? (
								<View className="flex-row items-center mt-1">
									<MaterialIcons name="location-on" size={12} color="#94A3B8" />
									<Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 ml-0.5">{store.address}</Text>
								</View>
							) : null}
						</View>
					</View>

					{/* Details section */}
					<View className="gap-y-3 mb-6">
						<Text className="text-sm font-poppins-bold text-slate-900 dark:text-slate-100 px-1">Information</Text>
						<View className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 gap-y-3">
							{store.owner_name ? (
								<View className="flex-row items-center gap-x-2.5">
									<MaterialIcons name="person" size={16} color="#94A3B8" />
									<Text className="text-sm font-poppins text-slate-600 dark:text-slate-400 flex-1">{store.owner_name}</Text>
								</View>
							) : null}
							{store.phone ? (
								<View className="flex-row items-center gap-x-2.5">
									<MaterialIcons name="phone" size={16} color="#94A3B8" />
									<Text className="text-sm font-poppins text-slate-600 dark:text-slate-400 flex-1">{store.phone}</Text>
								</View>
							) : null}
							{store.registration_number ? (
								<View className="flex-row items-center gap-x-2.5">
									<MaterialIcons name="business" size={16} color="#94A3B8" />
									<Text className="text-sm font-poppins text-slate-600 dark:text-slate-400 flex-1">{store.registration_number}</Text>
								</View>
							) : null}
							<View className="flex-row items-center gap-x-2.5">
								<MaterialIcons name="calendar-today" size={16} color="#94A3B8" />
								<Text className="text-sm font-poppins text-slate-600 dark:text-slate-400 flex-1">
									Registered on {new Date(store.created_at).toLocaleDateString("en-US", {
										month: "short", day: "numeric", year: "numeric",
									})}
								</Text>
							</View>
						</View>
					</View>

					{/* Documents preview */}
					{(!!store.business_document_image || ((store as any).store_pictures?.length ?? 0) > 0) && (
						<View className="gap-y-3">
							<Text className="text-sm font-poppins-bold text-slate-900 dark:text-slate-100 px-1">Submitted documents</Text>
							<View className="flex-row flex-wrap gap-2.5">
								{store.business_document_image && (
									<TouchableOpacity className="w-[100px] h-[100px] rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden" onPress={() => setSelectedImage(store.business_document_image!)}>
										<Image source={{ uri: store.business_document_image }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
									</TouchableOpacity>
								)}
								{(store as any).store_pictures?.map((uri: string, idx: number) => (
									<TouchableOpacity key={idx} className="w-[100px] h-[100px] rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden" onPress={() => setSelectedImage(uri)}>
										<Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
									</TouchableOpacity>
								))}
							</View>
						</View>
					)}
				</ScrollView>
			</Modal>
			</TouchableOpacity>

			{/* Full Screen Image Viewer Modal */}
			{!!selectedImage && (
				<Modal visible={true} onClose={() => setSelectedImage(null)} title="Document" dismissOnBackdrop={true}>
					<View className="items-center justify-center p-4">
						<Image source={{ uri: selectedImage }} style={{ width: "100%", height: 350 }} contentFit="contain" />
					</View>
				</Modal>
			)}
		</>
	);
}

export function AdminStoreSkeletonCard() {
	return (
		<View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-3">
			<View className="p-4 flex-row gap-3">
				<View className="w-[60px] h-[60px] rounded-xl bg-slate-100 dark:bg-slate-800" />
				<View className="flex-1 justify-center gap-y-2">
					<View className="h-4 rounded-lg bg-slate-100 dark:bg-slate-800" style={{ width: "55%" }} />
					<View className="h-3 rounded-lg bg-slate-100 dark:bg-slate-800" style={{ width: "75%" }} />
					<View className="h-3 rounded-lg bg-slate-100 dark:bg-slate-800" style={{ width: "40%" }} />
				</View>
			</View>
			<View className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex-row justify-between items-center">
				<View className="h-5 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
				<View className="h-7 w-20 rounded-lg bg-slate-100 dark:bg-slate-800" />
			</View>
		</View>
	);
}
