import { useQuery } from "@tanstack/react-query";
import { getStoreStaff, getStoreStaffMember } from "@/services/store-manager/staff-service";
import { storeManagerKeys } from "./query-keys";

export function useStoreStaffQuery(storeId: string | undefined) {
  const enabled = Boolean(storeId && storeId !== "undefined");
  return useQuery({
    queryKey: storeManagerKeys.staff(storeId ?? ""),
    queryFn: () => getStoreStaff(storeId!),
    enabled,
    staleTime: 30_000,
  });
}

export function useStoreStaffMemberQuery(staffId: string | undefined) {
  const enabled = Boolean(staffId && staffId !== "undefined");
  return useQuery({
    queryKey: storeManagerKeys.staffMember(staffId ?? ""),
    queryFn: () => getStoreStaffMember(staffId!),
    enabled,
    staleTime: 30_000,
  });
}
