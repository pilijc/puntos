import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getTransactionsPageForStore } from "@/services/store-manager/transactions-service";
import type { TypeFilter } from "@/type/store-manager/transaction";
import { storeManagerKeys } from "./query-keys";

export function useStoreTransactionsInfinite(
  storeId: number | null,
  typeFilter: TypeFilter,
) {
  return useInfiniteQuery({
    queryKey:
      storeId != null
        ? storeManagerKeys.transactions(storeId, typeFilter)
        : ["store-manager", "transactions", "disabled"],
    queryFn: ({ pageParam }) =>
      getTransactionsPageForStore(storeId!, typeFilter, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.nextPage : undefined),
    enabled: storeId != null,
    staleTime: 30_000,
  });
}

export function useStoreTransactionsPreview(storeId: number | undefined) {
  return useQuery({
    queryKey:
      storeId != null && storeId > 0
        ? storeManagerKeys.transactionsPreview(storeId)
        : ["store-manager", "transactions-preview", "disabled"] as const,
    queryFn: () => getTransactionsPageForStore(storeId!, "all", 1, 10),
    enabled: storeId != null && storeId > 0,
    staleTime: 30_000,
  });
}
