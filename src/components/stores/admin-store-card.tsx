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
	inactive: { label: "Inactive", color: "#EF4444", bg: "bg-red-100 dark:bg-red-900/20", dot: "#EF4444", text: "text-red-600 dark:text-red-400" },
};

export function AdminStoreCard({
	store,
	onApprove,
	onReject,
	onSelect,
}: {
	store: AdminStoreRow;
	onApprove: (store: AdminStoreRow) => void;
	onReject: (store: AdminStoreRow) => void;
	onSelect: (store: AdminStoreRow) => void;
}) {
	const status = store.status ?? "inactive";
	const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["inactive"];
	const isPending = status === "pending_review";

	return (
		<>
			<TouchableOpacity
				className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden mb-3"
				onPress={() => onSelect(store)}
				activeOpacity={0.95}
			>
				<View className="p-4 flex-row gap-3">
					<View className="relative">
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
						<View 
							style={{ backgroundColor: cfg.dot }} 
							className="absolute -bottom-1 -right-1 w-[14px] h-[14px] rounded-full border-[2.5px] border-white dark:border-slate-900 z-10" 
						/>
					</View>

					<View className="flex-1 justify-center gap-y-1">
						<View className="flex-row items-center justify-between">
							<Text className="font-poppins-bold text-[15px] text-slate-900 dark:text-slate-100 flex-1 mr-2" numberOfLines={1}>{store.name}</Text>
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

			</TouchableOpacity>
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
