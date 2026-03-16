export interface StaffType {
  name: string;
  email: string;
  password: string;
  storeId: number;

  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setStoreId: (storeId: number) => void;
  resetStaff: () => void;
}

