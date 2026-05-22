import { supabase } from "@/supabase/supabase";

const BUCKET_URL =
  "https://gtxlhnmpvsrvryeisbqa.supabase.co/storage/v1/object/public/puntos-public/profile-pictures";

export interface AdminInfo {
  name: string;
  username: string;
  avatar: string;
}

export interface DashboardUser {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_sign_in_at: string | null;
  role_type: string;
  avatar: string | null;
  displayEmail: string;
  [key: string]: unknown;
}

export interface DashboardStore {
  id: number;
  name: string;
  logo: string | null;
  owner_id: string | null;
  owner_name: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  [key: string]: unknown;
}

export interface DashboardSubscription {
  id: string | number;
  owner_id: string;
  payment_status: string | null;
  updated_at: string | null;
  current_period_start: string | null;
  created_at: string | null;
  [key: string]: unknown;
}

export interface DashboardData {
  users: DashboardUser[];
  stores: DashboardStore[];
  subscriptions: DashboardSubscription[];
}

export async function getAdminSession(): Promise<AdminInfo | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) return null;

  return {
    name: user.user_metadata?.display_name || "Super Admin",
    username:
      user.user_metadata?.username ||
      user.email?.split("@")[0] ||
      "admin",
    avatar: user.user_metadata?.avatar_url || null,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const [{ data: userData }, { data: storeData }, { data: subData }] = await Promise.all([
    supabase
      .from("users_with_email")
      .select("*, user_roles(role_id)")
      .order("id", { ascending: true }),
    supabase
      .from("stores")
      .select("id, name, logo, owner_id, status, is_active, created_at, updated_at, users!owner_id ( name )")
      .order("created_at", { ascending: false }),
    supabase
      .from("manager_subscriptions")
      .select("id, owner_id, payment_status, updated_at, current_period_start, created_at"),
  ]);



  const ROLE_ID_TO_TYPE: Record<number, string> = {
    1: "super_admin",
    2: "store_manager",
    3: "front_desk",
    4: "user",
  };

  const processedUsers = (userData || []).map((u): DashboardUser => {
    let role_type = "user";
    if (u.user_roles && Array.isArray(u.user_roles) && u.user_roles.length > 0) {
      role_type = ROLE_ID_TO_TYPE[u.user_roles[0].role_id] || "user";
    }

    return {
      ...u,
      role_type,
      user_roles: undefined,
      last_sign_in_at: u.last_sign_in_at || u.updated_at || u.created_at,
      avatar: u.avatar_url
        ? u.avatar_url.startsWith("http")
          ? u.avatar_url
          : `${BUCKET_URL}/${u.avatar_url}`
        : null,
      displayEmail: u.email || "No Email Provided",
    };
  });

  // Flatten the joined relation: { users: { name } } → { owner_name: string }
  const processedStores = (storeData || []).map((s): DashboardStore => ({
    ...s,
    owner_name: s.users?.name ?? null,
    users: undefined,
  }));

  return {
    users: processedUsers,
    stores: processedStores,
    subscriptions: subData || [],
  };
}
