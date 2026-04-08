import React from "react";
import { ScrollView, Dimensions } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { AdminStoreRow } from "@/services/store-service";
import { STORE_STATUS_CONFIG, getStoreCategoryBadge } from "@/type/super-admin/user";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";

interface AdminStorePreviewModalProps {
  visible: boolean;
  store: AdminStoreRow | null;
  onClose: () => void;
  onViewFullDetails: () => void;
  onApprove: () => void;
}

export function AdminStorePreviewModal({
  visible,
  store,
  onClose,
  onViewFullDetails,
  onApprove,
}: AdminStorePreviewModalProps) {
  const { t: translate } = useTranslation();

  if (!store) return null;

  const getEffectiveStatus = (s: AdminStoreRow) => {
    if (s.status === "pending_review" || !s.status) return "pending_review";
    if (s.status === "inactive") return "inactive";
    return s.is_active ? "active" : "inactive";
  };

  const status = getEffectiveStatus(store);
  const statusCfg = STORE_STATUS_CONFIG[status] ?? STORE_STATUS_CONFIG["inactive"];

  const formatTime = (t: string | null) => {
    if (!t) return "";
    return t.slice(0, 5);
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={translate("superAdmin.stores.preview.title", { defaultValue: "Quick Preview" })}
      showCloseButton={true}
      dismissOnBackdrop={true}
    >
      <ScrollView className="w-full" style={{ maxHeight: Dimensions.get('window').height * 0.6 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
        {/* 1. STORE HEADER DETAILS */}
        <View className="flex-row items-center gap-x-3 w-full border-b border-slate-100 dark:border-neutral-800 pb-4">
          <View className="w-[60px] h-[60px] rounded-xl bg-slate-100 dark:bg-darkBackgroundCard items-center justify-center overflow-hidden">
            {store.logo ? (
              <Image source={{ uri: store.logo }} style={{ width: 60, height: 60 }} contentFit="cover" />
            ) : (
              <MaterialIcons name="storefront" size={26} color="#94A3B8" />
            )}
          </View>

          <View className="flex-1 items-start justify-center gap-y-0.5">
            <View className="flex-row items-center justify-between w-full">
              <Text className="text-base font-poppins-bold text-slate-900 dark:text-darkTextPrimary flex-1 mr-2" numberOfLines={1}>
                {store.name || "Unnamed Store"}
              </Text>
              <View className={`flex-row items-center justify-center px-2.5 py-0.5 rounded-full ${statusCfg.bg}`}>
                <Text className={`text-[9px] font-poppins-bold uppercase tracking-wider text-center ${statusCfg.text}`}>
                  {statusCfg.label}
                </Text>
              </View>
            </View>
            
            {(store.store_open || store.store_close) && (
              <Text className="text-xs font-poppins-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                {formatTime(store.store_open)} – {formatTime(store.store_close)}
              </Text>
            )}
            

          </View>
        </View>

        {/* 2. CONTACT DETAILS & STORE INFO */}
        {(store.phone || store.registration_number || store.address || store.radius !== undefined) && (
          <View className="w-full gap-y-3 pb-4">
            {store.address && (
              <View className="flex-row items-center gap-x-2">
                <MaterialIcons name="location-on" size={14} color="#94A3B8" />
                <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-400 flex-1">
                  {store.address}
                </Text>
              </View>
            )}
            {(store.latitude !== null && store.longitude !== null && store.latitude !== undefined && store.longitude !== undefined) && (
              <View className="flex-row items-center gap-x-2">
                <MaterialIcons name="my-location" size={14} color="#94A3B8" />
                <Text className="text-[10px] font-poppins text-slate-400 dark:text-slate-500 flex-1">
                  Lat: {store.latitude}, Lng: {store.longitude}
                </Text>
              </View>
            )}
            {(store.radius !== null && store.radius !== undefined) && (
              <View className="flex-row items-center gap-x-2">
                <MaterialIcons name="radar" size={14} color="#94A3B8" />
                <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-400 flex-1">
                  Operational Radius: {store.radius}m
                </Text>
              </View>
            )}
            {store.phone && (
              <View className="flex-row items-center gap-x-2">
                <MaterialIcons name="phone" size={14} color="#94A3B8" />
                <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-400 flex-1">
                  {store.phone}
                </Text>
              </View>
            )}
            {store.registration_number && (
              <View className="flex-row items-center gap-x-2">
                <MaterialIcons name="description" size={14} color="#94A3B8" />
                <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-400 flex-1">
                  {store.registration_number}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Buttons Row */}
      <View className="flex-row items-center w-full gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-neutral-800">
        <View className="flex-1">
          <Button
            label={translate("superAdmin.stores.preview.viewDetails", { defaultValue: "View Full Details" })}
            onPress={onViewFullDetails}
            variant="primary"
            fullWidth
          />
        </View>
        {status === "pending_review" && (
          <TouchableOpacity
            onPress={onApprove}
            activeOpacity={0.7}
            className="w-[42px] h-[42px] items-center justify-center rounded-[14px] bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30"
          >
            <MaterialIcons name="verified" size={22} color="#16A34A" />
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}
