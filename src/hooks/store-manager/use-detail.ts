import React, { useCallback, useEffect } from "react";
import { useColorScheme, useWindowDimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getStoreDetail } from "@/services/store-manager/detail-service";
import { useDetailStore } from "@/store/store-manager/detail-store";
import { store_types_options } from "@/type/store-manager/store";
import { STATUS_CONFIG } from "@/type/store-manager/detail";

export function useStoreDetail() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const colorScheme = useColorScheme();
  const { width: screenWidth } = useWindowDimensions();

  const { detail, setDetail, reset } = useDetailStore();
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const data = await getStoreDetail(storeId);
      setDetail(data);
    } catch {
      // keep existing data on error
    }
  }, [storeId, setDetail]);

  // Reset and re-fetch whenever storeId changes
  useEffect(() => {
    reset();
    setLoading(true);
    fetchDetail().finally(() => setLoading(false));

    return () => {
      reset();
    };
  }, [storeId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDetail();
    setRefreshing(false);
  }, [fetchDetail]);

  const pictures = (detail?.store_pictures ?? []).filter(Boolean).slice(0, 3);
  const storeTypeLabelmap = Object.fromEntries(store_types_options.map((o) => [o.value, o.label]));
  const statusCfg = STATUS_CONFIG[detail?.status ?? ""] ?? STATUS_CONFIG["pending_review"];

  const hasCoords =
    typeof detail?.latitude === "number" &&
    typeof detail?.longitude === "number" &&
    (detail.latitude !== 0 || detail.longitude !== 0);

  return {
    storeId,
    detail,
    loading,
    refreshing,
    handleRefresh,
    pictures,
    storeTypeLabelmap,
    statusCfg,
    hasCoords,
    isDark: colorScheme === "dark",
    mapWidth: screenWidth - 32,
  };
}
