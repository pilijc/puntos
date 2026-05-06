export interface Store {
  id: number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  location?: any;
  is_active: boolean;
  logo: string | null;
  banner: string | null;
  store_pictures: string[] | null;
  type: string;
  status: string;
  owner_id: string;
  radius: number | null;
  phone: string;
  registration_number: string;
  created_at: string;
  updated_at: string | null;
}

export type StoreState = {
  stores: Store[];
  mutedStoreIds: number[];
  isMutedStoresHydrated: boolean;
  setStores: (stores: Store[]) => void;
  setMutedStoreIds: (ids: number[] | ((prev: number[]) => number[])) => void;
  setMutedStoresHydrated: (hydrated: boolean) => void;
  reset: () => void;
};

export interface Store_Superadmin {
  id: string;
  name: string;
  address: string;
  owner: string;
  staff_count: number;
  logo: string;
  store_pictures: string[];
}

export type StoreState_Superadmin = {
  stores: Store_Superadmin[];
  setStores: (stores: Store_Superadmin[]) => void;
  reset: () => void;
};

export type StoreCardData = {
	id: string;
	name: string;
	address: string;
	owner: string;
	staff_count: number;
	is_active: boolean;
	logo: string;
	store_pictures: string[];
};

export type TravelMode = "driving" | "walking";
