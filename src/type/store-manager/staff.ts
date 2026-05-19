import { ModalButton } from "@/components/modal";
import type { StoreStaffRow } from "@/services/store-manager/staff-service";

export type StaffMember = StoreStaffRow;

export interface StaffFormState {
  name: string;
  email: string;
  password: string;
  storeId: number;
  isSubmitting: boolean;
  showConfirm: boolean;
  modal: {
    title: string;
    message: string;
    buttons: ModalButton[];
    timer?: boolean;
  } | null;
  nameError: boolean;
  emailError: boolean;

  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setStoreId: (storeId: number) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setShowConfirm: (showConfirm: boolean) => void;
  setModal: (modal: StaffFormState["modal"]) => void;
  setNameError: (value: boolean) => void;
  setEmailError: (value: boolean) => void;
  resetStaff: () => void;
}
export interface StaffViewState {
  staff: StaffMember[];
  loading: boolean;
  refreshing: boolean;
  deleting: string | null;

  setStaff: (staff: StaffMember[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setDeleting: (id: string | null) => void;
  removeStaff: (id: string) => void;
  reset: () => void;
}
