import { Platform } from "react-native";
import { supabase } from "@/supabase/supabase";

export const WEB_APP_UNAVAILABLE_HREF = "/web-unavailable" as const;

export function getWebAdjustedHomeRoute(route: string): string {
  if (Platform.OS !== "web") return route;
  if (
    route === "/(user)" ||
    route.startsWith("/(user)/") ||
    route === "/(front_desk)" ||
    route.startsWith("/(front_desk)/")
  ) {
    return WEB_APP_UNAVAILABLE_HREF;
  }
  return route;
}

export type AppHomeRoute = "/(user)" | "/(super_admin)" | "/(front_desk)" | "/(store_manager)";

const ROLE_PRIORITY = [
  "super_admin",
  "manager",
  "store_owner",
  "front_desk",
  "user",
  "customer",
] as const;

type UserRoleRow = {
  role_id: number | string | null;
};

type RoleRow = {
  id: number;
  role_type: string | null;
};

const ROLE_ID_TO_TYPE: Record<number, string> = {
  1: "super_admin",
  2: "manager",
  3: "front_desk",
  4: "user",
};

function toRoleId(value: number | string | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

export async function getRoleTypeForUser(userId: string): Promise<string | null> {
  const { data: userRoles, error: userRolesError } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId);

  const roleIds = Array.from(
    new Set(
      ((userRoles as UserRoleRow[] | null) ?? [])
        .map((row) => toRoleId(row.role_id))
        .filter((id): id is number => id !== null)
    )
  );

  if (roleIds.length === 0) {
    return null;
  }

  const directMappedRoleTypes = roleIds
    .map((id) => ROLE_ID_TO_TYPE[id])
    .filter((roleType): roleType is string => Boolean(roleType));

  for (const wanted of ROLE_PRIORITY) {
    if (directMappedRoleTypes.includes(wanted)) {
      return wanted;
    }
  }

  const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select("id, role_type")
    .in("id", roleIds);

  if (rolesError) {
    throw rolesError;
  }

  const roleTypes = ((roles as RoleRow[] | null) ?? [])
    .map((row) => row.role_type)
    .filter((roleType): roleType is string => Boolean(roleType));

  for (const wanted of ROLE_PRIORITY) {
    if (roleTypes.includes(wanted)) {
      return wanted;
    }
  }

  return roleTypes[0] ?? null;
}

export function mapRoleToHomeRoute(roleType: string | null | undefined): AppHomeRoute {
  if (roleType === "super_admin" || roleType === "superadmin") {
    return "/(super_admin)";
  }
  if (roleType === "front_desk" || roleType === "frontdesk") {
    return "/(front_desk)";
  }
  if (roleType === "manager" || roleType === "store_owner" || roleType === "store_manager") {
    return "/(store_manager)";
  }
  return "/(user)";
}

export async function getHomeRouteForUserId(userId: string): Promise<AppHomeRoute> {
  try {
    const roleType = await getRoleTypeForUser(userId);
    
    if (!roleType) {
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role_id: 4, store_id: null });
      
      return "/(user)";
    }
    
    return mapRoleToHomeRoute(roleType);
  } catch {
    return "/(user)";
  }
}
