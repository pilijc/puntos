import { useQuery } from "@tanstack/react-query";
import { getStoreDetail } from "@/services/store-manager/detail-service";
import { storeManagerKeys } from "./query-keys";

export function useStoreDetailQuery(storeId: string | undefined) {
  const enabled = Boolean(storeId && storeId !== "undefined");
  return useQuery({
    queryKey: storeManagerKeys.storeDetail(storeId ?? ""),
    queryFn: () => getStoreDetail(storeId!),
    enabled,
    staleTime: 30_000,
  });
}
