import { create } from "zustand";
import { supabase } from "@/supabase/supabase";

const BUCKET_URL =
  "https://gtxlhnmpvsrvryeisbqa.supabase.co/storage/v1/object/public/puntos-public/profile-pictures";

export type UserRoleTab = "All" | "User" | "Manager" | "Staff";
export type AccountStatusFilter = "All" | "Active" | "Blocked";

export type UserRecord = {
  id: string;
  name?: string | null;
  email?: string | null;
  displayEmail?: string;
  avatar?: string;
  avatar_url?: string | null;
  imageUri?: string | null;
  role_type?: string | null;
  role?: number | string | null;
  roleLabel?: "s-admin" | "Manager" | "Staff" | "User";
  status?: "Active" | "Blocked";
  stores?: string[];
  [key: string]: any;
};

type UserStoreState = {
  users: UserRecord[];
  loading: boolean;
  refreshing: boolean;
  updatingUserId: string | null;

  activeTab: UserRoleTab;
  statusFilter: AccountStatusFilter;
  search: string;
  showFilterModal: boolean;

  selectedUser: UserRecord | null;
  showBlockModal: boolean;

  fetchUsers: () => Promise<void>;
  setRefreshing: (val: boolean) => void;
  setActiveTab: (tab: UserRoleTab) => void;
  setStatusFilter: (status: AccountStatusFilter) => void;
  setSearch: (val: string) => void;
  setShowFilterModal: (val: boolean) => void;

  openBlockModal: (user: UserRecord) => void;
  closeBlockModal: () => void;
  confirmToggleBlock: () => Promise<void>;

  toggleBlockStatus: (userId: string, currentStatus: string) => Promise<void>;

  tabCounts: () => Record<UserRoleTab, number>;
  flatListData: () => Array<any>;
  stickyHeaderIndices: () => number[];
};

const normalizeUser = (u: any): UserRecord => {
  const name = u?.name || "Unknown User";
  const roleLabel: UserRecord["roleLabel"] =
    u?.role_type === "super_admin"
      ? "s-admin"
      : u?.role_type === "manager"
      ? "Manager"
      : u?.role_type === "front_desk"
      ? "Staff"
      : "User";

  const avatar =
    u?.avatar_url
      ? String(u.avatar_url).startsWith("http")
        ? u.avatar_url
        : `${BUCKET_URL}/${u.avatar_url}`
      : `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(
          name || u?.id || "user"
        )}`;

  const status: UserRecord["status"] = u?.role === 0 ? "Blocked" : "Active";

  return {
    ...u,
    name,
    displayEmail: u?.email || "No Email",
    avatar,
    roleLabel,
    status,
    stores:
      u?.role_type === "manager"
        ? ["Assigned Store"]
        : u?.role_type === "front_desk"
        ? ["Branch Location"]
        : [],
  };
};

const groupByFirstLetter = (users: UserRecord[]) => {
  const groups: Record<string, UserRecord[]> = {};
  users.forEach((user) => {
    const firstLetter = (user.name || "?").charAt(0).toUpperCase();
    if (!groups[firstLetter]) groups[firstLetter] = [];
    groups[firstLetter].push(user);
  });
  return groups;
};

export const useUserStore = create<UserStoreState>((set, get) => ({
  users: [],
  loading: true,
  refreshing: false,
  updatingUserId: null,

  activeTab: "All",
  statusFilter: "All",
  search: "",
  showFilterModal: false,

  selectedUser: null,
  showBlockModal: false,

  setRefreshing: (val) => set({ refreshing: val }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setSearch: (val) => set({ search: val }),
  setShowFilterModal: (val) => set({ showFilterModal: val }),

  fetchUsers: async () => {
    try {
      const { data, error } = await supabase
        .from("users_with_email")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      const processed: UserRecord[] = (data || []).map(normalizeUser);
      set({ users: processed, loading: false, refreshing: false });
    } catch (err) {
      console.error("Fetch Error:", err);
      set({ loading: false, refreshing: false });
    }
  },

  openBlockModal: (user) => {
    if (user?.roleLabel === "s-admin") return;
    set({ selectedUser: user, showBlockModal: true });
  },

  closeBlockModal: () => set({ showBlockModal: false, selectedUser: null }),

  confirmToggleBlock: async () => {
    const { selectedUser, toggleBlockStatus, closeBlockModal } = get();
    if (!selectedUser) return;
    await toggleBlockStatus(selectedUser.id, selectedUser.status || "Active");
    closeBlockModal();
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

  tabCounts: () => {
    const { users } = get();
    const visibleUsers = users.filter((u) => u.roleLabel !== "s-admin");
    return {
      All: visibleUsers.length,
      User: visibleUsers.filter((u) => u.roleLabel === "User").length,
      Manager: visibleUsers.filter((u) => u.roleLabel === "Manager").length,
      Staff: visibleUsers.filter((u) => u.roleLabel === "Staff").length,
    };
  },

  flatListData: () => {
    const { users, activeTab, statusFilter, search } = get();
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = users.filter((u) => {
      const matchesRole =
        activeTab === "All" || (u.roleLabel || "User") === activeTab;
      const matchesStatus = statusFilter === "All" || u.status === statusFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        (u.name || "").toLowerCase().includes(normalizedSearch) ||
        (u.displayEmail || u.email || "").toLowerCase().includes(normalizedSearch);
      return matchesRole && matchesStatus && matchesSearch;
    });

    const groups = groupByFirstLetter(filtered);
    const flat: any[] = [];
    Object.keys(groups)
      .sort()
      .forEach((letter) => {
        flat.push({ isHeader: true, title: letter });
        groups[letter].forEach((user) => flat.push({ ...user, isHeader: false }));
      });
    return flat;
  },

  stickyHeaderIndices: () => {
    const data = get().flatListData();
    return data
      .map((item, index) => (item.isHeader ? index : -1))
      .filter((i) => i !== -1);
  },
}));

