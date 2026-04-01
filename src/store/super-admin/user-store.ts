import { create } from "zustand";
import { 
  UserRoleTab, 
  AccountStatusFilter, 
  UserRecord, 
  normalizeUser, 
  fetchBlockedMap, 
  deduplicateAndEnrich, 
  buildUsersQuery, 
  toggleUserBlockStatus 
} from "@/services/super-admin/user-admin-service";

export type { UserRoleTab, AccountStatusFilter, UserRecord };

const PAGE_SIZE = 20;
const STATUS_FILTER_WINDOW = 100;

type AlertModal = { title: string; message: string; type?: "success" | "error" } | null;

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
  errorModal: AlertModal;

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
  toggleBlockStatus: (userId: string, currentStatus: string) => Promise<boolean>;
  dismissErrorModal: () => void;
  tabCounts: () => Record<UserRoleTab, number>;
  flatListData: () => Array<any>;
  stickyHeaderIndices: () => number[];
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

// ─── Store ────────────────────────────────────────────────────────────────────

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
  errorModal: null,

  setRefreshing: (val) => set({ refreshing: val }),
  setActiveTab: (tab) => set({ activeTab: tab, page: 1, hasMore: false }),
  setStatusFilter: (status) => set({ statusFilter: status, page: 1, hasMore: false }),
  setSearch: (val) => set({ search: val, page: 1, hasMore: false }),
  setShowFilterModal: (val) => set({ showFilterModal: val }),
  dismissErrorModal: () => set({ errorModal: null }),

  fetchUsers: async (opts) => {
    const { activeTab, statusFilter, search } = get();
    const reset = opts?.reset ?? true;
    try {
      if (reset) set({ page: 1, hasMore: false, loading: true, errorModal: null });

      if (statusFilter === "Blocked" || statusFilter === "Active") {
        const { data, error } = await buildUsersQuery(
          activeTab, "All", search, 0, STATUS_FILTER_WINDOW - 1
        );
        if (error) throw error;

        const rows = data || [];
        const blockedMap = await fetchBlockedMap(rows.map((r: any) => r.id).filter(Boolean));
        const processed = rows.map((r: any) => normalizeUser({ ...r, blocked: blockedMap.get(r.id) ?? false }));
        const enriched = await deduplicateAndEnrich(processed);

        const filtered =
          statusFilter === "Blocked"
            ? enriched.filter((u) => u.status === "Blocked")
            : enriched.filter((u) => u.status !== "Blocked");

        set({ users: filtered, loading: false, refreshing: false, page: 1, hasMore: false });
        return;
      }

      const { data, error } = await buildUsersQuery(
        activeTab, statusFilter, search, 0, PAGE_SIZE - 1
      );
      if (error) throw error;

      const rows = data || [];
      const blockedMap = await fetchBlockedMap(rows.map((r: any) => r.id).filter(Boolean));
      const processed = rows.map((r: any) => normalizeUser({ ...r, blocked: blockedMap.get(r.id) ?? false }));
      const enriched = await deduplicateAndEnrich(processed);

      set({
        users: enriched,
        loading: false,
        refreshing: false,
        page: 1,
        hasMore: rows.length >= PAGE_SIZE,
      });
    } catch (err: any) {
      set({
        loading: false,
        refreshing: false,
        errorModal: { 
          title: "Failed to Load Users", 
          message: err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err)),
          type: "error"
        },
      });
    }
  },

  fetchMoreUsers: async () => {
    const { page, hasMore, loadingMore, activeTab, statusFilter, search, users, loading } = get();
    if (!hasMore || loadingMore || loading) return;
    if (statusFilter === "Blocked" || statusFilter === "Active") return;

    set({ loadingMore: true });
    try {
      const from = page * PAGE_SIZE;
      const { data, error } = await buildUsersQuery(
        activeTab, statusFilter, search, from, from + PAGE_SIZE - 1
      );
      if (error) throw error;

      const rows = data || [];
      const blockedMap = await fetchBlockedMap(rows.map((r: any) => r.id).filter(Boolean));
      const processed = rows.map((r: any) => normalizeUser({ ...r, blocked: blockedMap.get(r.id) ?? false }));
      const enrichedNew = await deduplicateAndEnrich(processed, new Set(users.map((u) => u.id)));

      set({
        users: [...users, ...enrichedNew],
        page: page + 1,
        hasMore: rows.length >= PAGE_SIZE,
        loadingMore: false,
      });
    } catch (err: any) {
      set({
        loadingMore: false,
        hasMore: false,
        errorModal: { 
          title: "Failed to Load More", 
          message: err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err)),
          type: "error"
        },
      });
    }
  },

  // ── Block modal
  openBlockModal: (user) => {
    if (user?.roleLabel === "s-admin") return;
    set({ selectedUser: user, showBlockModal: true });
  },

  closeBlockModal: () => set({ showBlockModal: false, selectedUser: null }),

  confirmToggleBlock: async () => {
    const { selectedUser, toggleBlockStatus, closeBlockModal } = get();
    if (!selectedUser) return;

    const userName = selectedUser.name || "User";
    const willBlock = selectedUser.status !== "Blocked";
    const success = await toggleBlockStatus(selectedUser.id, selectedUser.status || "Active");

    if (success) {
      closeBlockModal();
      set({
        errorModal: {
          title: "Status Updated",
          message: `Account for ${userName} has been successfully ${willBlock ? "blocked" : "restored"}.`,
          type: "success",
        },
      });
    }
  },

  toggleBlockStatus: async (userId, currentStatus) => {
    set({ updatingUserId: userId });
    try {
      await toggleUserBlockStatus(userId, currentStatus !== "Blocked");
      await get().fetchUsers();
      return true;
    } catch (err: any) {
      set({
        errorModal: { 
          title: "Update Failed", 
          message: err?.message ?? "Could not update user status.",
          type: "error"
        },
      });
      return false;
    } finally {
      set({ updatingUserId: null });
    }
  },

  tabCounts: () => {
    const { users } = get();
    const visible = users.filter((u) => u.roleLabel !== "s-admin");
    return {
      All: visible.length,
      User: visible.filter((u) => u.roleLabel === "User").length,
      Manager: visible.filter((u) => u.roleLabel === "Manager").length,
      Staff: visible.filter((u) => u.roleLabel === "Staff").length,
    };
  },

  flatListData: () => {
    const { users, activeTab, statusFilter, search } = get();
    if (users.length === 0) return [];

    const q = search.trim().toLowerCase();
    const filtered = users.filter((u) => {
      const matchesRole = activeTab === "All" || (u.roleLabel || "User") === activeTab;
      const matchesStatus = statusFilter === "All" || u.status === statusFilter;
      const matchesSearch =
        !q ||
        (u.name || "").toLowerCase().includes(q) ||
        (u.displayEmail || u.email || "").toLowerCase().includes(q);
      return matchesRole && matchesStatus && matchesSearch;
    });

    const groups = groupByFirstLetter(filtered);
    const flat: any[] = [];
    for (const letter of Object.keys(groups).sort()) {
      flat.push({ isHeader: true, title: letter, id: `header-${letter}` });
      for (const user of groups[letter]) flat.push(user);
    }
    return flat;
  },

  stickyHeaderIndices: () => {
    const data = get().flatListData();
    return data.reduce<number[]>((acc, item, i) => {
      if (item.isHeader) acc.push(i);
      return acc;
    }, []);
  },
}));
