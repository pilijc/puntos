import { create } from "zustand";
import { ALL_STORE_DAYS, DEFAULT_STORE_CLOSE, DEFAULT_STORE_OPEN } from "@/type/store-manager/store";

interface CreateStoreState {
    currentStep: number;
    storeName: string;
    storeType: string;
    logo: string | null;
    pictures: string[] | null;
    address: string;
    latitude: string;
    longitude: string;
    timezone: string;
    phone: string;
    registrationNumber: string;
    businessDocumentImage: string | null;
    storeOpen: string;
    storeClose: string;
    storeDays: string[];
    radius: number;

    setCurrentStep: (step: number) => void;
    setStoreName: (val: string) => void;
    setStoreType: (val: string) => void;
    setLogo: (val: string | null) => void;
    setPictures: (val: string[] | null) => void;
    setAddress: (val: string) => void;
    setLatitude: (val: string) => void;
    setLongitude: (val: string) => void;
    setTimezone: (val: string) => void;
    setPhone: (val: string) => void;
    setRegistrationNumber: (val: string) => void;
    setBusinessDocumentImage: (val: string | null) => void;
    setStoreOpen: (val: string) => void;
    setStoreClose: (val: string) => void;
    setStoreDays: (val: string[]) => void;
    toggleStoreDay: (day: string) => void;
    setRadius: (val: number) => void;
    resetForm: () => void;
}

export const useCreateStoreStore = create<CreateStoreState>((set, get) => ({
    currentStep: 1,
    storeName: "",
    storeType: "",
    logo: null,
    pictures: null,
    address: "",
    latitude: "",
    longitude: "",
    timezone: "",
    phone: "",
    registrationNumber: "",
    businessDocumentImage: null,
    storeOpen: DEFAULT_STORE_OPEN,
    storeClose: DEFAULT_STORE_CLOSE,
    storeDays: [...ALL_STORE_DAYS],
    radius: 50,

    setCurrentStep: (step) => set({ currentStep: step }),
    setStoreName: (storeName) => set({ storeName }),
    setStoreType: (storeType) => set({ storeType }),
    setLogo: (logo) => set({ logo }),
    setPictures: (pictures) => set({ pictures }),
    setAddress: (address) => set({ address }),
    setLatitude: (latitude) => set({ latitude }),
    setLongitude: (longitude) => set({ longitude }),
    setTimezone: (timezone) => set({ timezone }),
    setPhone: (phone) => set({ phone }),
    setRegistrationNumber: (registrationNumber) => set({ registrationNumber }),
    setBusinessDocumentImage: (businessDocumentImage) => set({ businessDocumentImage }),
    setStoreOpen: (storeOpen) => set({ storeOpen }),
    setStoreClose: (storeClose) => set({ storeClose }),
    setStoreDays: (storeDays) => set({ storeDays }),
    toggleStoreDay: (day) => {
        const current = get().storeDays;
        const next = current.includes(day)
            ? current.filter((d) => d !== day)
            : [...current, day];
        const ordered = ALL_STORE_DAYS.filter((d) => next.includes(d));
        set({ storeDays: ordered });
    },
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
        timezone: "",
        phone: "",
        registrationNumber: "",
        businessDocumentImage: null,
        storeOpen: DEFAULT_STORE_OPEN,
        storeClose: DEFAULT_STORE_CLOSE,
        storeDays: [...ALL_STORE_DAYS],
        radius: 50,
    })
}));
