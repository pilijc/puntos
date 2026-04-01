import { create } from "zustand";
import { getAdminSession, getDashboardData, AdminInfo } from "@/services/super-admin/dashboard-service";

interface DashboardState {
  users: any[];
  stores: any[];
  adminInfo: AdminInfo;
  loading: boolean;
  fetchDashboardData: () => Promise<void>;
  fetchAdminSession: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  users: [],
  stores: [],
  adminInfo: { name: "Loading...", username: "admin", avatar: "" },
  loading: true,

  fetchAdminSession: async () => {
    try {
      const adminInfo = await getAdminSession();
      if (adminInfo) {
        set({ adminInfo });
      }
    } catch (error) {
      console.error("Admin Session Error:", error);
    }
  },

  fetchDashboardData: async () => {
    const isInitialFetch = get().users.length === 0;
    if (isInitialFetch) set({ loading: true });
    
    try {
      const { users, stores } = await getDashboardData();
      set({ users, stores });
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      if (isInitialFetch) set({ loading: false });
    }
  },
}));