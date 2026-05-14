import { useQuery } from "@tanstack/react-query";
import { getStoreFeaturesById } from "@/services/store-manager/feature-service";
import { storeManagerKeys } from "./query-keys";

export function useStoreFeaturesQuery(storeId: string | undefined) {
  const enabled = Boolean(storeId && storeId !== "undefined");
  return useQuery({
    queryKey: [...storeManagerKeys.root, "store-features", storeId ?? ""] as const,
    queryFn: () => getStoreFeaturesById(storeId!),
    enabled,
    staleTime: 60_000,
  });
}
