import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMutedStores,
  muteStore,
  unmuteStore,
} from "@/services/user/mute-service";
import { userKeys } from "./query-keys";

export function useMutedStoresQuery(userId: string | undefined) {
  return useQuery({
    queryKey: userKeys.mutedStores(userId),
    queryFn: getMutedStores,
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}

export function useToggleMuteStoreMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = userKeys.mutedStores(userId);

  return useMutation({
    mutationFn: async ({ storeId, currentlyMuted }: { storeId: number; currentlyMuted: boolean }) => {
      if (currentlyMuted) {
        await unmuteStore(storeId);
      } else {
        await muteStore(storeId);
      }
    },
    onMutate: async ({ storeId, currentlyMuted }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<number[]>(queryKey) ?? [];

      queryClient.setQueryData<number[]>(queryKey, (current = []) =>
        currentlyMuted
          ? current.filter((id) => id !== storeId)
          : Array.from(new Set([...current, storeId])),
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previous ?? []);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
