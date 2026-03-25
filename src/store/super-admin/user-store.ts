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
  storeInfo?: {
    name: string;
    address: string;
    ownerName?: string;
    managerName?: string;
  }[];
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

  const status: UserRecord["status"] =
    u?.blocked === true || u?.role === 0 ? "Blocked" : "Active";

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
  supabaseClient: typeof supabase,
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

  // Active/Blocked: do NOT filter on users_with_email (view has no blocked column).
  // We load blocked from public.users and filter client-side.
  if (activeTab === "Manager") q = q.eq("role_type", "manager");
  if (activeTab === "Staff") q = q.eq("role_type", "front_desk");
  if (activeTab === "User") {
    // Avoid PostgREST `.not('in')` string parsing issues by using `.neq`
    q = q.neq("role_type", "manager").neq("role_type", "front_desk").neq("role_type", "super_admin");
  }

  const trimmed = search.trim();
  if (trimmed.length > 0) {
    // Strip out all characters that are known to break PostgREST's `.or` filter syntax.
    // E.g., double quotes, single quotes, braces, commas, backslashes, percent, underscore, parens.
    const sanitized = trimmed.replace(/["'{},\\%_()\[\]]/g, '');
    
    if (sanitized.trim().length > 0) {
      // Re-add double quotes so spaces and other characters don't break PostgREST .or() URL parsing
      q = q.or(`name.ilike."%${sanitized}%",email.ilike."%${sanitized}%"`);
    }
  }

  return q.range(from, to);
}

/** Load blocked from public.users only (users_with_email has no blocked column). */
async function fetchBlockedMap(ids: string[]): Promise<Map<string, boolean>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase
    .from("users")
    .select("id, blocked")
    .in("id", ids);
  if (error) throw error;
  const map = new Map<string, boolean>();
  (data || []).forEach((row: { id: string; blocked?: boolean }) => {
    map.set(row.id, row.blocked === true);
  });
  return map;
}

async function fetchStoreDetails(userIds: string[]): Promise<Map<string, any[]>> {
  if (userIds.length === 0) return new Map();

  // 1. Get roles and stores
  const { data: userRoles, error } = await supabase
    .from("user_roles")
    .select(`
      user_id,
      store_id,
      stores:store_id ( id, name, address, users:owner_id ( name ) )
    `)
    .in("user_id", userIds);

  if (error) throw error;

  const storeIds = Array.from(new Set(userRoles.map(r => r.store_id).filter(Boolean)));
  const storeToManager = new Map<number, string>();

  if (storeIds.length > 0) {
    // 2. Get managers for these stores (ID 2 = Manager)
    const { data: managers } = await supabase
      .from("user_roles")
      .select(`store_id, users:user_id(name)`)
      .in("store_id", storeIds)
      .eq("role_id", 2);
    
    (managers || []).forEach((m: any) => {
       if (m.users?.name) storeToManager.set(m.store_id, m.users.name);
    });
  }

  const result = new Map<string, any[]>();
  userRoles.forEach((r: any) => {
    if (!r.stores) return;
    if (!result.has(r.user_id)) result.set(r.user_id, []);
    result.get(r.user_id)!.push({
      name: r.stores.name,
      address: r.stores.address,
      ownerName: r.stores.users?.name,
      managerName: storeToManager.get(r.store_id)
    });
  });

  return result;
}

/** When "Blocked Only" or "Active Only": fetch a larger window from view + blocked from users, filter client-side. Avoids querying users table for ids (which was causing Fetch More Error). */
const STATUS_FILTER_WINDOW = 100;

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
      if (reset) set({ page: 1, hasMore: true, loading: true });

      if (statusFilter === "Blocked" || statusFilter === "Active") {
        const { data, error } = await buildUsersQuery(
          supabase,
          activeTab,
          "All",
          search,
          0,
          STATUS_FILTER_WINDOW - 1
        );
        if (error) throw error;
        const rows = data || [];
        const ids = rows.map((r: any) => r.id).filter(Boolean);
        const blockedMap = await fetchBlockedMap(ids);
        const withBlocked = rows.map((r: any) => ({
          ...r,
          blocked: blockedMap.get(r.id) ?? false,
        }));
        const processed: UserRecord[] = withBlocked.map(normalizeUser);
        
        // Deduplicate
        const uniqueProcessed: UserRecord[] = [];
        const seen = new Set<string>();
        for (const u of processed) {
          if (!seen.has(u.id)) {
            uniqueProcessed.push(u);
            seen.add(u.id);
          }
        }

        // Fetch store details
        const storeDetails = await fetchStoreDetails(uniqueProcessed.map(u => u.id));
        const enriched = uniqueProcessed.map(u => ({
          ...u,
          storeInfo: storeDetails.get(u.id) || []
        }));

        const filtered =
          statusFilter === "Blocked"
            ? enriched.filter((u) => u.status === "Blocked")
            : enriched.filter((u) => u.status !== "Blocked");
        set({
          users: filtered,
          loading: false,
          refreshing: false,
          page: 1,
          hasMore: false,
        });
        return;
      }

      const { data, error } = await buildUsersQuery(
        supabase,
        activeTab,
        statusFilter,
        search,
        0,
        PAGE_SIZE - 1
      );

      if (error) throw error;

      const rows = data || [];
      const ids = rows.map((r: any) => r.id).filter(Boolean);
      const blockedMap = await fetchBlockedMap(ids);
      const withBlocked = rows.map((r: any) => ({
        ...r,
        blocked: blockedMap.get(r.id) ?? false,
      }));
      const processed: UserRecord[] = withBlocked.map(normalizeUser);
      
      // Deduplicate
      const uniqueProcessed: UserRecord[] = [];
      const seen = new Set<string>();
      for (const u of processed) {
        if (!seen.has(u.id)) {
          uniqueProcessed.push(u);
          seen.add(u.id);
        }
      }

      // Fetch store details
      const storeDetails = await fetchStoreDetails(uniqueProcessed.map(u => u.id));
      const enriched = uniqueProcessed.map(u => ({
        ...u,
        storeInfo: storeDetails.get(u.id) || []
      }));

      const fetched = rows.length;
      set({
        users: enriched,
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
    const { page, hasMore, loadingMore, activeTab, statusFilter, search, users, loading } = get();
    if (!hasMore || loadingMore || loading) return;
    set({ loadingMore: true });
    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      if (statusFilter === "Blocked" || statusFilter === "Active") {
        set({ loadingMore: false });
        return;
      }

      const { data, error } = await buildUsersQuery(
        supabase,
        activeTab,
        statusFilter,
        search,
        from,
        to
      );

      if (error) throw error;

      const rows = data || [];
      const ids = rows.map((r: any) => r.id).filter(Boolean);
      const blockedMap = await fetchBlockedMap(ids);
      const withBlocked = rows.map((r: any) => ({
        ...r,
        blocked: blockedMap.get(r.id) ?? false,
      }));
      const processed: UserRecord[] = withBlocked.map(normalizeUser);
      
      // Deduplicate against already loaded users
      const existingIds = new Set(users.map(u => u.id));
      const uniqueNew: UserRecord[] = [];
      const seenInNew = new Set<string>();

      for (const u of processed) {
        if (!existingIds.has(u.id) && !seenInNew.has(u.id)) {
          uniqueNew.push(u);
          seenInNew.add(u.id);
        }
      }

      // Fetch store details for new users
      const storeDetails = await fetchStoreDetails(uniqueNew.map(u => u.id));
      const enrichedNew = uniqueNew.map(u => ({
        ...u,
        storeInfo: storeDetails.get(u.id) || []
      }));

      const fetched = rows.length;
      set({
        users: [...users, ...enrichedNew],
        page: page + 1,
        hasMore: fetched >= PAGE_SIZE,
        loadingMore: false,
      });
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      const details = err?.details ?? err?.hint ?? "";
      set({ loadingMore: false, hasMore: false });
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
    const willBeBlocked = currentStatus !== "Blocked";

    try {
      const { error } = await supabase
        .from("users")
        .update({ blocked: willBeBlocked })
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
    if (users.length === 0) return [];
    
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
    const sortedKeys = Object.keys(groups).sort();
    
    for (const letter of sortedKeys) {
      flat.push({ isHeader: true, title: letter, id: `header-${letter}` });
      for (const user of groups[letter]) {
        flat.push(user);
      }
    }
    return flat;
  },

  stickyHeaderIndices: () => {
    const data = get().flatListData();
    const indices: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i].isHeader) indices.push(i);
    }
    return indices;
  },
}));

