import { Store } from "../user/store";

export type StoreCardVariant = "list" | "preview";

export type StoreCardProps = {
  store: Partial<Store> & {
    id?: number | string;
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    radius?: number | null;
    logo?: string | null;
    banner?: string | null;
    type?: string | null;
    is_active?: boolean | null;
    status?: string | null;
  };
  variant?: StoreCardVariant;
  onPress?: () => void;
  adminMode?: boolean;
};

export const store_types_options = [
  { label: "Cafe", value: "cafe" },
  { label: "Bar & Drinks", value: "bar" },
  { label: "Restaurant", value: "restaurant" },
  { label: "Market", value: "market" },
  { label: "Shop", value: "shop" },
  { label: "Other", value: "other" }
];

export const STEPS = [
  { key: "store" as const, label: "Store details" },
  { key: "business" as const, label: "Business details" },
  { key: "location" as const, label: "Location details" },
];

export const DEFAULT_STORE_OPEN = "09:00";
export const DEFAULT_STORE_CLOSE = "21:00";

export const STORE_DAYS = [
  { value: "monday", shortKey: "mon" },
  { value: "tuesday", shortKey: "tue" },
  { value: "wednesday", shortKey: "wed" },
  { value: "thursday", shortKey: "thu" },
  { value: "friday", shortKey: "fri" },
  { value: "saturday", shortKey: "sat" },
  { value: "sunday", shortKey: "sun" },
] as const;

export type StoreDayValue = (typeof STORE_DAYS)[number]["value"];

export const ALL_STORE_DAYS: StoreDayValue[] = STORE_DAYS.map((d) => d.value);

export type PickImageType = "logo" | "picture" | "business_document";

export const aspect_ratios: Record<PickImageType, [number, number]> = {
  logo: [1, 1],
  picture: [4, 3],
  business_document: [1, Math.SQRT2],
};