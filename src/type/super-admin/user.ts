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

export const STORE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; text?: string }> = {
	active: { label: "Active", color: "#22C55E", bg: "bg-success/10", dot: "#22C55E", text: "text-success" },
	pending_review: { label: "Pending", color: "#F59E0B", bg: "bg-amber-100 dark:bg-amber-900/20", dot: "#F59E0B", text: "text-amber-600 dark:text-amber-400" },
	inactive: { label: "Inactive", color: "#EF4444", bg: "bg-red-100 dark:bg-red-900/20", dot: "#EF4444", text: "text-red-600 dark:text-red-400" },
};

export const STORE_CATEGORY_CONFIG: Record<string, { bg: string; text: string }> = {
  "Cafe": { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
  "Bar & Drinks": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400" },
  "Restaurant": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  "Market": { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  "Shop": { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400" },
  "Other": { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
};

export function getStoreCategoryBadge(type?: string | null) {
  if (!type) return STORE_CATEGORY_CONFIG["Other"];
  const normalized = Object.keys(STORE_CATEGORY_CONFIG).find(
    (k) => k.toLowerCase() === type.toLowerCase()
  );
  return STORE_CATEGORY_CONFIG[normalized || "Other"];
}

