import React from "react";
import { Platform } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { Image } from "expo-image";
import { CalendarDays, CircleX, FileText } from "lucide-react-native";
import { TextField } from "@/components/text-field";
import {
  DEFAULT_STORE_CLOSE,
  DEFAULT_STORE_OPEN,
  type PickImageType,
} from "@/type/store-manager/store";
import { TimeDropdown } from "./time-dropdown";
import { DaysBadgeSelector } from "./days-badge-selector";

type BusinessStepProps = {
  phone: string;
  setPhone: (v: string) => void;
  registrationNumber: string;
  setRegistrationNumber: (v: string) => void;
  businessDocumentImage: string | null;
  setBusinessDocumentImage: (v: string | null) => void;
  storeOpen: string;
  setStoreOpen: (v: string) => void;
  storeClose: string;
  setStoreClose: (v: string) => void;
  storeDays: string[];
  toggleStoreDay: (day: string) => void;
  isUploadingImage: boolean;
  pickImage: (type: PickImageType, pictureIndex?: number) => void | Promise<void>;
  isDark: boolean;
  translate: (key: string, options?: Record<string, unknown>) => string;
};

export function BusinessStep({
  phone,
  setPhone,
  registrationNumber,
  setRegistrationNumber,
  businessDocumentImage,
  setBusinessDocumentImage,
  storeOpen,
  setStoreOpen,
  storeClose,
  setStoreClose,
  storeDays,
  toggleStoreDay,
  isUploadingImage,
  pickImage,
  isDark,
  translate,
}: BusinessStepProps) {
  const isWeb = Platform.OS === "web";
  const uploadDocImageKey = isWeb
    ? "storeManager.createStore.uploadDocumentImage"
    : "storeManager.detailEdit.uploadDocumentImage";

  return (
    <View className="gap-2">
      <View className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 p-4 gap-4">
        <TextField
          label={translate("storeManager.createStore.phoneNumber")}
          placeholder={translate("storeManager.detailEdit.phonePlaceholder")}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(text) => {
            if (text.length <= 11) {
              setPhone(text);
            } else if (text.length < (phone?.length ?? 0)) {
              setPhone(text);
            }
          }}
        />

        <TextField
          label={translate("storeManager.createStore.registrationNumber")}
          required
          placeholder={translate("storeManager.detailEdit.registrationPlaceholder")}
          value={registrationNumber}
          onChangeText={setRegistrationNumber}
          sanitize={(v) => v}
        />

        <View className="flex flex-col gap-2">
          <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
            {translate("label.businessDocument")}{" "}
            <Text className="text-red-500 dark:text-red-400">*</Text>
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (!businessDocumentImage) pickImage("business_document");
            }}
            disabled={isUploadingImage || !!businessDocumentImage}
            className="w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 items-center justify-center overflow-hidden"
            style={{ height: 220 }}
          >
            {businessDocumentImage ? (
              <>
                <Image
                  source={{ uri: businessDocumentImage }}
                  style={{ width: "100%", height: "100%", resizeMode: "cover" }}
                  contentFit="contain"
                />
                <TouchableOpacity
                  onPress={() => setBusinessDocumentImage(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/65 items-center justify-center"
                  activeOpacity={0.8}
                >
                  <CircleX size={16} color="gray" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <FileText size={24} color="#94A3B8" />
                <Text className="text-xs text-slate-500 font-poppins mt-1">
                  {translate(uploadDocImageKey)}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3" style={{ zIndex: 30 }}>
          <View className="flex-1 flex-col gap-1.5" style={{ zIndex: 30 }}>
            <View className="flex-row items-center gap-1 px-1">
              <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium">
                {translate("storeManager.createStore.openingTime")}
                {isWeb && (
                  <Text className="text-red-500 dark:text-red-400 ml-1">*</Text>
                )}
              </Text>
            </View>
            <TimeDropdown
              value={storeOpen}
              onChange={setStoreOpen}
              isDark={isDark}
              defaultValue={DEFAULT_STORE_OPEN}
            />
          </View>
          <View className="flex-1 flex-col gap-1.5" style={{ zIndex: 30 }}>
            <View className="flex-row items-center gap-1 px-1">
              <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium">
                {translate("storeManager.createStore.closingTime")}
                {isWeb && (
                  <Text className="text-red-500 dark:text-red-400 ml-1">*</Text>
                )}
              </Text>
            </View>
            <TimeDropdown
              value={storeClose}
              onChange={setStoreClose}
              isDark={isDark}
              defaultValue={DEFAULT_STORE_CLOSE}
            />
          </View>
        </View>

        <View className="flex-col gap-2" style={{ zIndex: 1 }}>
          <View className="flex-row items-center gap-1 px-1">
            {!isWeb && (
              <CalendarDays size={14} color={isDark ? "#cbd5e1" : "#475569"} />
            )}
            <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium">
              {translate("storeManager.createStore.storeDays")}{" "}
              <Text className="text-red-500 dark:text-red-400">*</Text>
            </Text>
          </View>
          <Text className="text-slate-600 dark:text-slate-400 text-xs font-poppins px-1">
            {translate("storeManager.createStore.storeDaysHint")}
          </Text>
          <DaysBadgeSelector
            selectedDays={storeDays}
            onToggle={toggleStoreDay}
            translate={translate}
          />
          {storeDays.length === 7 && (
            <Text className="text-xs text-slate-400 dark:text-slate-500 font-poppins px-1">
              {translate("storeManager.createStore.storeDaysAllSelected")}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
