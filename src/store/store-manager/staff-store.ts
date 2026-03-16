import { StaffType } from "@/type/store-manager/staff";
import { create } from "zustand";

export const useStaffStore = create<StaffType>((set) => ({
  name: "",
  email: "",
  password: "",
  setName: (name: string) => set({ name }),
  setEmail: (email: string) => set({ email }),
  setPassword: (password: string) => set({ password }),
  resetStaff: () => set({ name: "", email: "", password: "" }),
}));