import { useQuery } from "@tanstack/react-query";
import {
  getRewardById,
  getRewardsByStoreId,
  getRewardsByStoreIdPage,
} from "@/services/store-manager/reward-service";
import { isStoreRewardLinkedToStampProgram } from "@/services/store-manager/stamp-service";
import { storeManagerKeys } from "./query-keys";

export function useRewardsByStoreQuery(storeId: string | undefined) {
  const enabled = Boolean(storeId && storeId !== "undefined");
  return useQuery({
    queryKey:
      storeId != null && storeId !== "undefined"
        ? storeManagerKeys.rewardsByStore(Number(storeId))
        : ["store-manager", "rewards", "disabled"],
    queryFn: () => getRewardsByStoreId(storeId!),
    enabled,
    staleTime: 30_000,
  });
}

export function useRewardsByStorePageQuery(
  storeId: string | undefined,
  page: number,
  pageSize = 15,
) {
  const enabled = Boolean(storeId && storeId !== "undefined");
  return useQuery({
    queryKey:
      storeId != null && storeId !== "undefined"
        ? storeManagerKeys.rewardsPage(Number(storeId), page)
        : ["store-manager", "rewards-page", "disabled"],
    queryFn: () => getRewardsByStoreIdPage(storeId!, page, pageSize),
    enabled,
    staleTime: 30_000,
  });
}

export function useRewardByIdQuery(storeId: string | undefined, rewardId: string | undefined) {
  const enabled = Boolean(
    storeId && storeId !== "undefined" && rewardId && rewardId !== "undefined",
  );
  return useQuery({
    queryKey: storeManagerKeys.reward(`${storeId ?? ""}:${rewardId ?? ""}`),
    queryFn: () => getRewardById(storeId!, rewardId!),
    enabled,
    staleTime: 30_000,
  });
}

export function useRewardLinkedToStampQuery(
  storeId: string | undefined,
  rewardId: string | undefined,
) {
  const enabled = Boolean(
    storeId && storeId !== "undefined" && rewardId && rewardId !== "undefined",
  );
  return useQuery({
    queryKey: [
      ...storeManagerKeys.root,
      "reward-stamp-link",
      storeId ?? "",
      rewardId ?? "",
    ] as const,
    queryFn: () => isStoreRewardLinkedToStampProgram(storeId!, rewardId!),
    enabled,
    staleTime: 60_000,
  });
}
