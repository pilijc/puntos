import { create } from "zustand";
import { StaffFormState, StaffViewState } from "@/type/store-manager/staff";

export const useStaffStore = create<StaffFormState>((set) => ({
  name: "",
  email: "",
  password: "",
  storeId: 0,

  setName: (name) => set({ name }),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setStoreId: (storeId) => set({ storeId }),
  resetStaff: () => set({ name: "", email: "", password: "", storeId: 0 }),
}));

const viewInitialState = {
  staff: [],
  loading: false,
  refreshing: false,
  deleting: null,
};

export const useStaffViewStore = create<StaffViewState>((set) => ({
  ...viewInitialState,
  setStaff: (staff) => set({ staff }),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),
  setDeleting: (deleting) => set({ deleting }),
  removeStaff: (id) => set((state) => ({ staff: state.staff.filter((m) => m.id !== id) })),
  reset: () => set(viewInitialState),
}));
