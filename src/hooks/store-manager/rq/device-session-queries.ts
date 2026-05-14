import { useQuery } from "@tanstack/react-query";
import { getActiveDeviceSessionsService } from "@/services/store-manager/device-session-service";
import { storeManagerKeys } from "./query-keys";

export function useActiveDeviceSessionsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: userId
      ? storeManagerKeys.deviceSessionsActive(userId)
      : [...storeManagerKeys.root, "device-sessions", "disabled"] as const,
    queryFn: () => getActiveDeviceSessionsService(userId!),
    enabled: Boolean(userId),
    staleTime: 15_000,
  });
}
