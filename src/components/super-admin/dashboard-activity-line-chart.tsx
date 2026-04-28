import React from "react";
import { TouchableOpacity } from "react-native";
import { View } from "@/tw";
import { Eye, EyeOff, Users, Store } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { DetailList } from "@/services/super-admin/dashboard-analytics-service";
import { DashboardActivityHeader } from "./dashboard-activity-header";
import { PlatformActivityChart } from "./platform-activity-chart";
import { ActivityDetailsList } from "./activity-details-list";

interface DashboardActivityLineChartProps {
  userSeries: number[];
  storeSeries: number[];
  labels: string[];
  weekRange: string;
  showDetails: boolean;
  onToggleDetails: () => void;
  userList: DetailList;
  storeList: DetailList;
  onLoadMoreUsers: () => void;
  onLoadMoreStores: () => void;
  onResetUsers?: () => void;
  onResetStores?: () => void;
}

export function DashboardActivityLineChart({
  userSeries,
  storeSeries,
  labels,
  weekRange,
  showDetails,
  onToggleDetails,
  userList,
  storeList,
  onLoadMoreUsers,
  onLoadMoreStores,
  onResetUsers,
  onResetStores,
}: DashboardActivityLineChartProps) {
  const { t: translate } = useTranslation();

  return (
    <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl shadow-sm border border-slate-100 dark:border-darkBorder mb-6 overflow-hidden">
      <DashboardActivityHeader weekRange={weekRange} />
      <PlatformActivityChart userSeries={userSeries} storeSeries={storeSeries} labels={labels} />

      <View className="pt-4 pb-4 border-t border-slate-50 dark:border-darkBorder" style={{ paddingHorizontal: "4%" }}>
        <TouchableOpacity
          onPress={onToggleDetails}
          activeOpacity={0.8}
          className={`flex-col items-center justify-center py-4 rounded-3xl border shadow-sm ${showDetails
            ? "bg-slate-900 border-slate-800 dark:bg-darkBackgroundMuted dark:border-darkBorder"
            : "bg-white border-slate-200 dark:bg-darkBackgroundMuted dark:border-darkBorder"
          }`}
        >
          <View className="flex-row items-center -space-x-2.5">
            <View className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
              <Users size={12} color="#EA580C" strokeWidth={2.5} />
            </View>
            <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
              <Store size={12} color="#2563EB" strokeWidth={2.5} />
            </View>
            <View className={`w-8 h-8 rounded-full items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm ${showDetails ? "bg-slate-700" : "bg-slate-100"}`}>
              {showDetails
                ? <EyeOff size={12} color="#fff" strokeWidth={2.5} />
                : <Eye size={12} color="#64748B" strokeWidth={2.5} />
              }
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {showDetails && (
        <View className="pb-8 gap-8" style={{ paddingHorizontal: "4%" }}>
          <ActivityDetailsList
            variant="user"
            title={translate("superAdmin.dashboard.recentUserSignins")}
            list={userList.list}
            hasMore={userList.hasMore}
            onLoadMore={onLoadMoreUsers}
            onReset={onResetUsers}
          />
          <ActivityDetailsList
            variant="store"
            title={translate("superAdmin.dashboard.recentlyRegisteredStores")}
            list={storeList.list}
            hasMore={storeList.hasMore}
            onLoadMore={onLoadMoreStores}
            onReset={onResetStores}
          />
        </View>
      )}
    </View>
  );
}
