import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getQRConfig, toggleQREnabled } from "@/services/store-manager/qr-service";
import { storeManagerKeys } from "./query-keys";

export function useQRConfigQuery(storeId: string | undefined) {
  const enabled = Boolean(storeId && storeId !== "undefined");
  return useQuery({
    queryKey: storeManagerKeys.qrConfig(storeId ?? ""),
    queryFn: () => getQRConfig(storeId!),
    enabled,
    staleTime: 30_000,
  });
}

export function useToggleQREnabledMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, enabled }: { storeId: string; enabled: boolean }) =>
      toggleQREnabled(storeId, enabled),
    onSuccess: (_data, { storeId }) => {
      void queryClient.invalidateQueries({
        queryKey: storeManagerKeys.qrConfig(storeId),
      });
    },
  });
}
