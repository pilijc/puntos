import { create } from "zustand";
import { supabase } from "@/supabase/supabase";

const BUCKET_URL =
  "https://gtxlhnmpvsrvryeisbqa.supabase.co/storage/v1/object/public/puntos-public/profile-pictures";

interface UserState {
  users: any[];
  loading: boolean;
  refreshing: boolean;
  updatingUserId: string | null;
  fetchUsers: () => Promise<void>;
  setRefreshing: (val: boolean) => void;
  toggleBlockStatus: (userId: string, currentStatus: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: true,
  refreshing: false,
  updatingUserId: null,

  setRefreshing: (val) => set({ refreshing: val }),

  fetchUsers: async () => {
    try {
      const { data, error } = await supabase
        .from("users_with_email")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      const processed = (data || []).map((u) => ({
        ...u,
        name: u.name || "Unknown User",
        displayEmail: u.email || "No Email",
        avatar: u.avatar_url
          ? u.avatar_url.startsWith("http")
            ? u.avatar_url
            : `${BUCKET_URL}/${u.avatar_url}`
          : `https://api.dicebear.com/7.x/avataaars/png?seed=${u.name || u.id}`,
        role:
          u.role_type === "manager"
            ? "Manager"
            : u.role_type === "front_desk"
            ? "Staff"
            : "User",
        roleLabel: u.role_type === "manager" ? "Manager" : u.role_type === "front_desk" ? "Staff" : "User",
        status: u.role === 0 ? "Blocked" : "Active",
        stores: u.role_type === "manager" ? ["Assigned Store"] : u.role_type === "front_desk" ? ["Branch Location"] : [],
      }));

      set({ users: processed, loading: false, refreshing: false });
    } catch (err) {
      console.error("Fetch Error:", err);
      set({ loading: false, refreshing: false });
    }
  },

  toggleBlockStatus: async (userId, currentStatus) => {
    set({ updatingUserId: userId });
    const newRoleValue = currentStatus === "Blocked" ? 1 : 0;
    
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRoleValue })
        .eq("id", userId);

      if (error) throw error;
      
      await get().fetchUsers();
    } catch (err) {
      console.error("Update Error:", err);
    } finally {
      set({ updatingUserId: null });
    }
  },
}));