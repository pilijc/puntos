import { create } from "zustand";

interface CreateStoreState {
    currentStep: number;
    storeName: string;
    storeType: string;
    logo: string | null;
    pictures: string[] | null;
    address: string;
    latitude: string;
    longitude: string;
    phone: string;
    registrationNumber: string;
    businessDocumentImage: string | null;
    storeOpen: string;
    storeClose: string;
    radius: number;

    setCurrentStep: (step: number) => void;
    setStoreName: (val: string) => void;
    setStoreType: (val: string) => void;
    setLogo: (val: string | null) => void;
    setPictures: (val: string[] | null) => void;
    setAddress: (val: string) => void;
    setLatitude: (val: string) => void;
    setLongitude: (val: string) => void;
    setPhone: (val: string) => void;
    setRegistrationNumber: (val: string) => void;
    setBusinessDocumentImage: (val: string | null) => void;
    setStoreOpen: (val: string) => void;
    setStoreClose: (val: string) => void;
    setRadius: (val: number) => void;
    resetForm: () => void;
}

export const useCreateStoreStore = create<CreateStoreState>((set) => ({
    currentStep: 1,
    storeName: "",
    storeType: "",
    logo: null,
    pictures: null,
    address: "",
    latitude: "",
    longitude: "",
    phone: "",
    registrationNumber: "",
    businessDocumentImage: null,
    storeOpen: "",
    storeClose: "",
    radius: 50,

    setCurrentStep: (step) => set({ currentStep: step }),
    setStoreName: (storeName) => set({ storeName }),
    setStoreType: (storeType) => set({ storeType }),
    setLogo: (logo) => set({ logo }),
    setPictures: (pictures) => set({ pictures }),
    setAddress: (address) => set({ address }),
    setLatitude: (latitude) => set({ latitude }),
    setLongitude: (longitude) => set({ longitude }),
    setPhone: (phone) => set({ phone }),
    setRegistrationNumber: (registrationNumber) => set({ registrationNumber }),
    setBusinessDocumentImage: (businessDocumentImage) => set({ businessDocumentImage }),
    setStoreOpen: (storeOpen) => set({ storeOpen }),
    setStoreClose: (storeClose) => set({ storeClose }),
    setRadius: (radius) => set({ radius: Math.max(50, Math.min(500, radius)) }),
    resetForm: () => set({
        currentStep: 1,
        storeName: "",
        storeType: "",
        logo: null,
        pictures: null,
        address: "",
        latitude: "",
        longitude: "",
        phone: "",
        registrationNumber: "",
        businessDocumentImage: null,
        storeOpen: "",
        storeClose: "",
        radius: 50,
    })
}));
