import { useQuery } from "@tanstack/react-query";
import {
  getAllStreaksByStoreId,
  getParticipantsByProgramId,
  getParticipantsCountByProgramId,
  getStreakProgramById,
} from "@/services/store-manager/streak-service";
import { storeManagerKeys } from "./query-keys";

export function useStreaksByStoreQuery(storeId: string | undefined) {
  const enabled = Boolean(storeId && storeId !== "undefined");
  return useQuery({
    queryKey:
      storeId != null && storeId !== "undefined"
        ? storeManagerKeys.streaksByStore(Number(storeId))
        : ["store-manager", "streaks", "disabled"],
    queryFn: () => getAllStreaksByStoreId(storeId!),
    enabled,
    staleTime: 30_000,
  });
}

export function useStreakProgramQuery(programId: number | undefined) {
  return useQuery({
    queryKey: storeManagerKeys.streakProgram(String(programId ?? "")),
    queryFn: () => getStreakProgramById(programId!),
    enabled: programId != null && Number.isFinite(programId),
    staleTime: 30_000,
  });
}

export function useStreakParticipantsQuery(programId: number | undefined) {
  return useQuery({
    queryKey: storeManagerKeys.streakParticipants(String(programId ?? "")),
    queryFn: () => getParticipantsByProgramId(programId!),
    enabled: programId != null && Number.isFinite(programId),
    staleTime: 15_000,
  });
}

export function useStreakParticipantsCountQuery(programId: number | undefined) {
  return useQuery({
    queryKey: storeManagerKeys.streakParticipantsCount(String(programId ?? "")),
    queryFn: () => getParticipantsCountByProgramId(programId!),
    enabled: programId != null && Number.isFinite(programId),
    staleTime: 15_000,
  });
}
