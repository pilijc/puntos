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

export type DetailDraft = {
  name: string;
  type: string;
  logo: string | null;
  pictures: (string | null)[];
  phone: string;
  registrationNumber: string;
  businessDoc: string | null;
  storeOpen: string;
  storeClose: string;
  address: string;
  latitude: string;
  longitude: string;
  radius: number;
};

export interface DetailDraftStore {
  name: string;
  type: string;
  logo: string | null;
  pictures: (string | null)[];
  phone: string;
  registrationNumber: string;
  businessDoc: string | null;
  storeOpen: string;
  storeClose: string;
  address: string;
  latitude: string;
  longitude: string;
  radius: number;
  setName: (name: string) => void;
  setType: (type: string) => void;
  setLogo: (logo: string | null) => void;
  setPictures: (pictures: (string | null)[]) => void;
  setPhone: (phone: string) => void;
  setRegistrationNumber: (registrationNumber: string) => void;
  setBusinessDoc: (businessDoc: string | null) => void;
  setStoreOpen: (storeOpen: string) => void;
  setStoreClose: (storeClose: string) => void;
  setAddress: (address: string) => void;
  setLatitude: (latitude: string) => void;
  setLongitude: (longitude: string) => void;
  setRadius: (radius: number) => void;
  initFromDetail: (detail: StoreDetail | null) => void;
  reset: () => void;
}

export interface DetailViewState {
  detail: StoreDetail | null;
  setDetail: (detail: StoreDetail | null) => void;
  reset: () => void;
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
