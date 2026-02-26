import { supabase } from "@/supabase/supabase";

export type AppHomeRoute = "/(user)" | "/(super_admin)" | "/(front_desk)";

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

  if (userRolesError) {
    throw userRolesError;
  }

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
  return "/(user)";
}

export async function getHomeRouteForUserId(userId: string): Promise<AppHomeRoute> {
  try {
    const roleType = await getRoleTypeForUser(userId);
    return mapRoleToHomeRoute(roleType);
  } catch {
    return "/(user)";
  }
}
