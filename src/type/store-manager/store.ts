import { Store } from "../store";

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

export type PickImageType = "logo" | "picture" | "business_document";

export const aspect_ratios: Record<PickImageType, [number, number]> = {
  logo: [1, 1],
  picture: [4, 3],
  business_document: [1, Math.SQRT2],
};