export interface Store {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
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
  setStores: (stores: Store[]) => void;
  setMutedStoreIds: (ids: number[]) => void;
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