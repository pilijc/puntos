export interface StaffType {
  name: string;
  email: string;
  password: string;
  
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  resetStaff: () => void;
}