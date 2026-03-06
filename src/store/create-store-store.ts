import { create } from "zustand";

interface CreateStoreState {
    currentStep: number;
    storeName: string;
    storeType: string;
    logoUri: string | null;
    logoPublicUrl: string | null;
    address: string;
    latitude: string;
    longitude: string;
    phone: string;
    registrationNumber: string;

    setCurrentStep: (step: number) => void;
    setStoreName: (val: string) => void;
    setStoreType: (val: string) => void;
    setLogoUri: (val: string | null) => void;
    setLogoPublicUrl: (val: string | null) => void;
    setAddress: (val: string) => void;
    setLatitude: (val: string) => void;
    setLongitude: (val: string) => void;
    setPhone: (val: string) => void;
    setRegistrationNumber: (val: string) => void;
    
    resetForm: () => void;
}

export const useCreateStoreStore = create<CreateStoreState>((set) => ({
    currentStep: 1,
    storeName: "",
    storeType: "",
    logoUri: null,
    logoPublicUrl: null,
    address: "",
    latitude: "",
    longitude: "",
    phone: "",
    registrationNumber: "",

    setCurrentStep: (step) => set({ currentStep: step }),
    setStoreName: (storeName) => set({ storeName }),
    setStoreType: (storeType) => set({ storeType }),
    setLogoUri: (logoUri) => set({ logoUri }),
    setLogoPublicUrl: (logoPublicUrl) => set({ logoPublicUrl }),
    setAddress: (address) => set({ address }),
    setLatitude: (latitude) => set({ latitude }),
    setLongitude: (longitude) => set({ longitude }),
    setPhone: (phone) => set({ phone }),
    setRegistrationNumber: (registrationNumber) => set({ registrationNumber }),

    resetForm: () => set({
        currentStep: 1,
        storeName: "",
        storeType: "",
        logoUri: null,
        logoPublicUrl: null,
        address: "",
        latitude: "",
        longitude: "",
        phone: "",
        registrationNumber: "",
    })
}));
