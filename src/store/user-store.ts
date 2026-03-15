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

const PAGE_SIZE = 20;

type UserStoreState = {
  users: UserRecord[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  page: number;
  hasMore: boolean;
  updatingUserId: string | null;

  activeTab: UserRoleTab;
  statusFilter: AccountStatusFilter;
  search: string;
  showFilterModal: boolean;

  selectedUser: UserRecord | null;
  showBlockModal: boolean;

  fetchUsers: (opts?: { reset?: boolean }) => Promise<void>;
  fetchMoreUsers: () => Promise<void>;
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

function buildUsersQuery(
  supabaseClient: ReturnType<typeof supabase>,
  activeTab: UserRoleTab,
  statusFilter: AccountStatusFilter,
  search: string,
  from: number,
  to: number
) {
  let q = supabaseClient
    .from("users_with_email")
    .select("*", { count: "exact" })
    .order("name", { ascending: true });

  if (statusFilter === "Active") q = q.neq("role", 0);
  if (statusFilter === "Blocked") q = q.eq("role", 0);

  if (activeTab === "Manager") q = q.eq("role_type", "manager");
  if (activeTab === "Staff") q = q.eq("role_type", "front_desk");
  if (activeTab === "User") {
    q = q.not("role_type", "in", "(manager,front_desk,super_admin)");
  }

  const trimmed = search.trim();
  if (trimmed.length > 0) {
    // Escape ilike special chars (%, _, \) to prevent PostgREST errors
    const escaped = trimmed.replace(/[%_\\]/g, "\\$&");
    q = q.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%`);
  }

  return q.range(from, to);
}

export const useUserStore = create<UserStoreState>((set, get) => ({
  users: [],
  loading: true,
  refreshing: false,
  loadingMore: false,
  page: 1,
  hasMore: true,
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

  fetchUsers: async (opts) => {
    const { activeTab, statusFilter, search } = get();
    const reset = opts?.reset ?? true;
    try {
      if (reset) set({ page: 1, users: [], hasMore: true });
      const { data, error } = await buildUsersQuery(
        supabase,
        activeTab,
        statusFilter,
        search,
        0,
        PAGE_SIZE - 1
      );

      if (error) throw error;

      const processed: UserRecord[] = (data || []).map(normalizeUser);
      const fetched = (data || []).length;
      set({
        users: processed,
        loading: false,
        refreshing: false,
        page: 1,
        hasMore: fetched >= PAGE_SIZE,
      });
    } catch (err) {
      console.error("Fetch Error:", err);
      set({ loading: false, refreshing: false });
    }
  },

  fetchMoreUsers: async () => {
    const { page, hasMore, loadingMore, activeTab, statusFilter, search, users } = get();
    if (!hasMore || loadingMore) return;
    set({ loadingMore: true });
    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await buildUsersQuery(
        supabase,
        activeTab,
        statusFilter,
        search,
        from,
        to
      );

      if (error) throw error;

      const processed: UserRecord[] = (data || []).map(normalizeUser);
      const fetched = (data || []).length;
      set({
        users: [...users, ...processed],
        page: page + 1,
        hasMore: fetched >= PAGE_SIZE,
        loadingMore: false,
      });
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      const details = err?.details ?? err?.hint ?? "";
      console.error("Fetch More Error:", { message: msg, details });
      set({ loadingMore: false });
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

