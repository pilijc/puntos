import { useQuery } from "@tanstack/react-query";
import {
  getAllStampsByStoreId,
  getCollectorsByProgramId,
  getCollectorsCountByProgramId,
  getStampProgramById,
} from "@/services/store-manager/stamp-service";
import { storeManagerKeys } from "./query-keys";

export function useStampsByStoreQuery(storeId: string | undefined) {
  const enabled = Boolean(storeId && storeId !== "undefined");
  return useQuery({
    queryKey: [...storeManagerKeys.root, "stamps-by-store", storeId ?? ""] as const,
    queryFn: () => getAllStampsByStoreId(storeId!),
    enabled,
    staleTime: 30_000,
  });
}

export function useStampProgramQuery(programId: number | undefined) {
  return useQuery({
    queryKey: storeManagerKeys.stampProgram(String(programId ?? "")),
    queryFn: () => getStampProgramById(programId!),
    enabled: programId != null && Number.isFinite(programId),
    staleTime: 30_000,
  });
}

export function useStampCollectorsQuery(programId: number | undefined) {
  return useQuery({
    queryKey: storeManagerKeys.stampCollectors(String(programId ?? "")),
    queryFn: () => getCollectorsByProgramId(programId!),
    enabled: programId != null && Number.isFinite(programId),
    staleTime: 15_000,
  });
}

export function useStampCollectorsCountQuery(programId: number | undefined) {
  return useQuery({
    queryKey: [...storeManagerKeys.root, "stamp-collectors-count", String(programId ?? "")] as const,
    queryFn: () => getCollectorsCountByProgramId(programId!),
    enabled: programId != null && Number.isFinite(programId),
    staleTime: 30_000,
  });
}
