export interface StoreDetail {
  id: number;
  name: string | null;
  type: string | null;
  logo: string | null;
  store_pictures: string[] | null;
  phone: string | null;
  registration_number: string | null;
  business_document_image: string | null;
  store_open: string | null;
  store_close: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  radius: number | null;
  status: string | null;
  is_active: boolean | null;
}

export const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active: {
    label: "Active",
    bg: "bg-green-50 dark:bg-green-950",
    text: "text-green-700 dark:text-green-400",
    dot: "bg-green-500",
  },
  inactive: {
    label: "Inactive",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-500 dark:text-slate-400",
    dot: "bg-slate-400",
  },
  pending_review: {
    label: "Under Review",
    bg: "bg-amber-50 dark:bg-amber-950",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
};
