import type { AccountStatusFilter } from "@/store/super-admin/user-store";

export const TYPO = {
  title: "text-[22px] font-poppins-bold text-textPrimary leading-7",
  subtitle: "text-[11px] font-poppins text-textMuted",
  sectionHeader: "text-[10px] font-poppins-bold text-textMuted uppercase tracking-widest",
  body: "text-[12px] font-poppins text-textSecondary",
  chip: "text-[11px] font-poppins-bold",
} as const;

export const COLORS = {
  primary: "#FF6600",
  textMuted: "#94A3B8",
  danger: "#EF4444",
  success: "#22C55E",
} as const;

export const ROLE_CONFIG: Record<string, { bg: string; text: string }> = {
  "s-admin": { bg: "bg-transparent", text: "text-primary" },
  super_admin: { bg: "bg-transparent", text: "text-primary" },
  Manager: { bg: "bg-transparent", text: "text-primary" },
  manager: { bg: "bg-transparent", text: "text-primary" },
  Staff: { bg: "bg-transparent", text: "text-primary" },
  front_desk: { bg: "bg-transparent", text: "text-primary" },
  User: { bg: "bg-transparent", text: "text-primary" },
  user: { bg: "bg-transparent", text: "text-primary" },
  Blocked: { bg: "bg-transparent", text: "text-danger" },
};

export const FILTER_OPTIONS: { value: AccountStatusFilter; label: string; desc: string }[] = [
  { value: "All", label: "All Accounts", desc: "Show everyone" },
  { value: "Active", label: "Active Only", desc: "Show active users" },
  { value: "Blocked", label: "Blocked Only", desc: "Show blocked users" },
];

export function getBadge(user: any) {
  if (!user) return ROLE_CONFIG["User"];
  if (user.status === "Blocked") return ROLE_CONFIG["Blocked"];
  return ROLE_CONFIG[user.roleLabel] || ROLE_CONFIG["User"];
}
