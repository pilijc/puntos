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

export const normalizeUser = (u: any): UserRecord => {
  const name = u?.name || "Unknown User";
  const isManager = ["manager", "store_owner", "store_manager"].includes(u?.role_type);
  const roleLabel: UserRecord["roleLabel"] =
    u?.role_type === "super_admin"
      ? "s-admin"
      : isManager
      ? "Manager"
      : u?.role_type === "front_desk"
      ? "Staff"
      : "User";

  const avatar = u?.avatar_url
    ? String(u.avatar_url).startsWith("http")
      ? u.avatar_url
      : `${BUCKET_URL}/${u.avatar_url}`
    : null;

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

export async function fetchBlockedMap(ids: string[]): Promise<Map<string, boolean>> {
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

export async function fetchStoreDetails(userIds: string[]): Promise<Map<string, any[]>> {
  if (userIds.length === 0) return new Map();

  const { data: userRoles, error } = await supabase
    .from("user_roles")
    .select("user_id, store_id, stores:store_id ( id, name, address, phone, status, is_active, users:owner_id ( name ) )")
    .in("user_id", userIds);

  if (error) throw error;

  const storeIds = Array.from(
    new Set(userRoles.map((r) => r.store_id).filter(Boolean))
  );
  const storeToManager = new Map<number, string>();

  if (storeIds.length > 0) {
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
      phone: r.stores.phone,
      status: r.stores.status,
      is_active: r.stores.is_active,
      ownerName: r.stores.users?.name,
      managerName: storeToManager.get(r.store_id),
    });
  });

  return result;
}

export async function deduplicateAndEnrich(
  processed: UserRecord[],
  existingIds?: Set<string>
): Promise<UserRecord[]> {
  const seen = existingIds ? new Set(existingIds) : new Set<string>();
  const unique: UserRecord[] = [];
  for (const u of processed) {
    if (!seen.has(u.id)) {
      unique.push(u);
      seen.add(u.id);
    }
  }
  const storeDetails = await fetchStoreDetails(unique.map((u) => u.id));
  return unique.map((u) => ({ ...u, storeInfo: storeDetails.get(u.id) || [] }));
}

export function buildUsersQuery(
  activeTab: UserRoleTab,
  statusFilter: AccountStatusFilter,
  search: string,
  from: number,
  to: number
) {
  let q = supabase
    .from("users_with_email")
    .select("*", { count: "exact" })
    .order("name", { ascending: true });

  if (activeTab === "Manager") {
    q = q.in("role_type", ["manager", "store_owner", "store_manager"]);
  }
  if (activeTab === "Staff") q = q.eq("role_type", "front_desk");
  if (activeTab === "User") {
    q = q
      .not("role_type", "in", '("manager","store_owner","store_manager","super_admin","front_desk")');
  }

  const trimmed = search.trim();
  if (trimmed.length > 0) {
    const sanitized = trimmed.replace(/["'{},\\%_()\[\]]/g, "");
    if (sanitized.trim().length > 0) {
      q = q.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
    }
  }

  return q.range(from, to);
}

export async function toggleUserBlockStatus(userId: string, shouldBlock: boolean): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ blocked: shouldBlock })
    .eq("id", userId);
  if (error) throw error;
}
