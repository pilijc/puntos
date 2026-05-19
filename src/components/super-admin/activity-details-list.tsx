import React from "react";
import { TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Text, View } from "@/tw";
import { Users, User, RotateCcw } from "lucide-react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { DetailItem } from "@/services/super-admin/dashboard-analytics-service";

interface ActivityDetailsListProps {
  variant: "user" | "store";
  title: string;
  list: DetailItem[];
  hasMore: boolean;
  onLoadMore: () => void;
  onReset?: () => void;
}

export function ActivityDetailsList({
  variant,
  title,
  list,
  hasMore,
  onLoadMore,
  onReset,
}: ActivityDetailsListProps) {
  const { t: translate } = useTranslation();
  const isUser = variant === "user";

  return (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View className={`w-1.5 h-4 rounded-full ${isUser ? "bg-orange-500" : "bg-blue-600"}`} />
          <Text className="text-[11px] font-poppins-bold text-slate-800 dark:text-darkTextPrimary uppercase tracking-widest">
            {title}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className={`${isUser ? "bg-orange-50" : "bg-blue-50"} px-2 py-0.5 rounded-md`}>
            <Text className={`text-[9px] font-poppins-bold ${isUser ? "text-orange-600" : "text-blue-600"}`}>
              {list.length} {translate("superAdmin.dashboard.records")}
            </Text>
          </View>
          {onReset && list.length > 5 && (
            <TouchableOpacity onPress={onReset} activeOpacity={0.6}>
              <RotateCcw size={14} color={isUser ? "#EA580C" : "#2563EB"} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="bg-slate-50/50 dark:bg-darkBackgroundMuted/30 rounded-2xl overflow-hidden border border-slate-100 dark:border-darkBorder">
        {list.length === 0 ? (
          <View className="py-10 items-center">
            {isUser
              ? <Users size={24} color="#CBD5E1" strokeWidth={1.5} />
              : <MaterialIcons name="storefront" size={24} color="#CBD5E1" />
            }
            <Text className="text-xs font-poppins text-slate-400 mt-2">
              {isUser
                ? translate("superAdmin.dashboard.noNewUsers")
                : translate("superAdmin.dashboard.noNewStores")
              }
            </Text>
          </View>
        ) : (
          <>
            {list.map((item, idx) => (
              <View
                key={item.key}
                className={`flex-row items-center justify-between px-4 py-4 ${idx < list.length - 1 ? "border-b border-white dark:border-darkBorder/40" : ""}`}
              >
                <View
                  style={item.imageUrl
                    ? { width: 36, height: 36, borderRadius: 8, overflow: "hidden" }
                    : isUser
                      ? { width: 36, height: 36, borderRadius: 8, backgroundColor: "#FF660015" }
                      : { width: 36, height: 36, borderRadius: 8 }
                  }
                  className={`items-center justify-center mr-3 border ${item.imageUrl ? "border-transparent" : isUser ? "border-primary/10" : "bg-slate-100 dark:bg-darkBackgroundCard border-transparent"}`}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={{ width: 36, height: 36 }} contentFit="cover" />
                  ) : isUser ? (
                    <User size={16} color="#FF6600" />
                  ) : (
                    <MaterialIcons name="storefront" size={18} color="#94A3B8" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-poppins-bold text-slate-700 dark:text-darkTextPrimary">
                    {item.title}
                  </Text>
                  <Text className="text-[10px] font-poppins text-slate-400 dark:text-darkTextMuted">
                    {item.status}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-[10px] font-poppins-bold text-slate-500 dark:text-darkTextSecondary bg-white dark:bg-darkBackground p-1 px-2 rounded-lg">
                    {item.dateLabel}
                  </Text>
                </View>
              </View>
            ))}
            {hasMore && (
              <View className="py-4 items-center border-t border-slate-50 dark:border-darkBorder/30">
                <TouchableOpacity
                  onPress={onLoadMore}
                  activeOpacity={0.7}
                  className={`flex-row items-center gap-2 ${isUser
                    ? "bg-orange-50 dark:bg-orange-950/20 border-orange-100/50 dark:border-orange-900/10 shadow-orange-100/50"
                    : "bg-blue-50 dark:bg-blue-950/20 border-blue-100/50 dark:border-blue-900/10 shadow-blue-100/50"
                  } px-5 py-2.5 rounded-full border shadow-sm`}
                >
                  <Text className={`text-[11px] font-poppins-bold ${isUser ? "text-orange-600" : "text-blue-600"} uppercase tracking-tighter`}>
                    {translate("superAdmin.dashboard.showMore")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}
