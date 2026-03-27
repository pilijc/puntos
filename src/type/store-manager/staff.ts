import { getStoreStaff } from "@/services/store-manager/staff-service";

export type StaffMember = Awaited<ReturnType<typeof getStoreStaff>>[number];

export interface StaffFormState {
  name: string;
  email: string;
  password: string;
  storeId: number;

  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setStoreId: (storeId: number) => void;
  resetStaff: () => void;
}
export interface StaffViewState {
  staff: StaffMember[];
  loading: boolean;
  refreshing: boolean;
  deleting: string | null;

  setStaff: (staff: StaffMember[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setDeleting: (id: string | null) => void;
  removeStaff: (id: string) => void;
  reset: () => void;
}
