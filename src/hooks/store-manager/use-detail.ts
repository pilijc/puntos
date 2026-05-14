import React, { useCallback, useEffect } from "react";
import { useColorScheme, useWindowDimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useDetailViewStore } from "@/store/store-manager/detail-store";
import { store_types_options } from "@/type/store-manager/store";
import { STATUS_CONFIG } from "@/type/store-manager/detail";
import { useStoreDetailQuery } from "@/hooks/store-manager/rq";

export function useStoreDetail() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const colorScheme = useColorScheme();
  const { width: screenWidth } = useWindowDimensions();

  const { detail, setDetail, reset } = useDetailViewStore();
  const detailQuery = useStoreDetailQuery(storeId);

  useEffect(() => {
    if (detailQuery.data !== undefined) {
      setDetail(detailQuery.data);
    }
  }, [detailQuery.data, setDetail]);

  useEffect(() => {
    reset();
    return () => {
      reset();
    };
  }, [storeId, reset]);

  const handleRefresh = useCallback(() => {
    void detailQuery.refetch();
  }, [detailQuery]);

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
    loading: detailQuery.isPending,
    refreshing: detailQuery.isRefetching && !detailQuery.isPending,
    handleRefresh,
    pictures,
    storeTypeLabelmap,
    statusCfg,
    hasCoords,
    isDark: colorScheme === "dark",
    mapWidth: screenWidth - 32,
  };
}
