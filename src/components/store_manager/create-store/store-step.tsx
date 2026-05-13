import React from "react";
import { Platform } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { Image } from "expo-image";
import { CircleX, ImagePlus } from "lucide-react-native";
import { TextField } from "@/components/text-field";
import { store_types_options, type PickImageType } from "@/type/store-manager/store";

type StoreStepProps = {
  storeName: string;
  setStoreName: (v: string) => void;
  storeType: string;
  setStoreType: (v: string) => void;
  logo: string | null;
  setLogo: (v: string | null) => void;
  pictures: string[] | null;
  setPictures: (v: string[] | null) => void;
  isUploadingImage: boolean;
  pickImage: (type: PickImageType, pictureIndex?: number) => void | Promise<void>;
  translate: (key: string, options?: Record<string, unknown>) => string;
};

export function StoreStep({
  storeName,
  setStoreName,
  storeType,
  setStoreType,
  logo,
  setLogo,
  pictures,
  setPictures,
  isUploadingImage,
  pickImage,
  translate,
}: StoreStepProps) {
  const isWeb = Platform.OS === "web";

  return (
    <View className="gap-2">
      <View
        className={`w-full bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 p-4 gap-4 ${
          isWeb ? "overflow-hidden" : ""
        }`}
      >
        <TextField
          label={translate("label.storeName")}
          required
          placeholder={translate("store_manager.detailEdit.storeNamePlaceholder")}
          value={storeName}
          onChangeText={setStoreName}
          sanitize={(v) => v}
        />

        <View className="flex-col gap-2 justify-start">
          <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
            {translate("label.storeType")}{" "}
            <Text className="text-red-500 dark:text-red-400">*</Text>
          </Text>
          <View className="flex-row flex-wrap gap-2 mt-1">
            {store_types_options.map((type) => {
              const selected = storeType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  activeOpacity={0.8}
                  onPress={() => setStoreType(type.value)}
                  className={`px-3 py-1.5 rounded-full border bg-white dark:bg-slate-800/50 ${
                    selected
                      ? "border-primary dark:border-primary"
                      : "border-slate-200 dark:border-slate-800/50"
                  }`}
                >
                  <Text
                    className={`text-xs font-poppins-medium ${
                      selected
                        ? "text-primary dark:text-slate-100"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {translate(`store_manager.storeTypes.${type.value}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="flex-row gap-4 gap-y-2">
          <View className="flex-1 flex-col gap-2">
            <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
              {translate("label.storeLogo")}{" "}
              <Text className="text-red-500 dark:text-red-400">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => pickImage("logo")}
              disabled={isUploadingImage}
              className="relative w-32 h-32 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 flex flex-col items-center justify-center gap-1 overflow-hidden"
            >
              {logo ? (
                <>
                  <Image
                    source={{ uri: logo }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    onPress={() => setLogo(null)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 items-center justify-center"
                    activeOpacity={0.8}
                  >
                    <CircleX size={14} color="#fff" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <ImagePlus size={18} color="#94A3B8" />
                  <Text className="text-[10px] text-slate-500 font-poppins">
                    {translate("store_manager.createStore.logo")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-col gap-2">
          <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
            {translate("store_manager.createStore.storePictures")}{" "}
            <Text className="text-red-500 dark:text-red-400">*</Text>
          </Text>
          <Text className="text-slate-600 dark:text-slate-400 text-xs font-poppins mb-3 px-1">
            {translate("store_manager.createStore.storePicturesHint")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const uri = pictures?.[index];
              return (
                <View
                  key={index}
                  style={
                    isWeb
                      ? { flexBasis: "32%", aspectRatio: 1 }
                      : undefined
                  }
                  className={
                    isWeb ? "min-w-[96px]" : "w-[31%] aspect-square"
                  }
                >
                  {uri ? (
                    <View className="flex-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                      <Image
                        source={{ uri }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                      <TouchableOpacity
                        onPress={() => {
                          const next = (pictures ?? []).filter((_, i) => i !== index);
                          setPictures(next.length > 0 ? next : null);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 items-center justify-center"
                      >
                        <CircleX size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => pickImage("picture", index)}
                      disabled={isUploadingImage || (pictures?.length ?? 0) >= 6}
                      className="flex-1 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 items-center justify-center min-h-[80px]"
                    >
                      <ImagePlus size={20} color="#94A3B8" />
                      <Text className="text-[10px] text-slate-500 font-poppins mt-0.5">
                        {translate("label.add")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
