import { create } from 'zustand';
import { supabase } from "@/supabase/supabase";

const BUCKET_URL = "https://gtxlhnmpvsrvryeisbqa.supabase.co/storage/v1/object/public/puntos-public/profile-pictures";

interface DashboardState {
  users: any[];
  stores: any[];
  adminInfo: { name: string; username: string; avatar: string };
  loading: boolean;
  fetchDashboardData: () => Promise<void>;
  fetchAdminSession: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  users: [],
  stores: [],
  adminInfo: { name: "Loading...", username: "admin", avatar: "" },
  loading: true,

  fetchAdminSession: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      set({
        adminInfo: {
          name: user.user_metadata?.display_name || "Super Admin",
          username: user.user_metadata?.username || user.email?.split('@')[0] || "admin",
          avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${user.id}`
        }
      });
    }
  },

  fetchDashboardData: async () => {
    set({ loading: true });
    try {
      const [{ data: userData }, { data: storeData }] = await Promise.all([
        supabase.from('users_with_email').select('*').order('id', { ascending: true }),
        supabase.from('stores').select('*')
      ]);

      const processedUsers = (userData || []).map(u => ({
        ...u,
        avatar: u.avatar_url
          ? u.avatar_url.startsWith('http') ? u.avatar_url : `${BUCKET_URL}/${u.avatar_url}`
          : `https://api.dicebear.com/7.x/avataaars/png?seed=${u.id}`,
        displayEmail: u.email || "No Email Provided"
      }));

      set({ users: processedUsers, stores: storeData || [] });
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      set({ loading: false });
    }
  },
}));