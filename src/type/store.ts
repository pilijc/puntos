export interface Store {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  is_active: boolean;
}

export type StoreState = {
  stores: Store[];
  setStores: (stores: Store[]) => void;
  reset: () => void;
};