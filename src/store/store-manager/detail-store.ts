import { create } from "zustand";
import type { DetailDraftStore, DetailViewState } from "@/type/store-manager/detail";

export const useDetailStore = create<DetailDraftStore>((set) => ({
  name: "",
  type: "",
  logo: null,
  pictures: [null, null, null],
  phone: "",
  registrationNumber: "",
  businessDoc: null,
  storeOpen: "09:00",
  storeClose: "21:00",
  address: "",
  latitude: "",
  longitude: "",
  radius: 50,
  storeDays: [],

  setName: (name) => set({ name }),
  setType: (type) => set({ type }),
  setLogo: (logo) => set({ logo }),
  setPictures: (pictures) => set({ pictures }),
  setPhone: (phone) => set({ phone }),
  setRegistrationNumber: (registrationNumber) => set({ registrationNumber }),
  setBusinessDoc: (businessDoc) => set({ businessDoc }),
  setStoreOpen: (storeOpen) => set({ storeOpen }),
  setStoreClose: (storeClose) => set({ storeClose }),
  setAddress: (address) => set({ address }),
  setLatitude: (latitude) => set({ latitude }),
  setLongitude: (longitude) => set({ longitude }),
  setRadius: (radius) => set({ radius }),
  setStoreDays: (storeDays) => set({ storeDays }),

  initFromDetail: (detail) =>
    set({
      name: detail?.name ?? "",
      type: detail?.type ?? "",
      logo: detail?.logo ?? null,
      pictures: [
        detail?.store_pictures?.[0] ?? null,
        detail?.store_pictures?.[1] ?? null,
        detail?.store_pictures?.[2] ?? null,
      ],
      phone: detail?.phone ?? "",
      registrationNumber: detail?.registration_number ?? "",
      businessDoc: detail?.business_document_image ?? null,
      storeOpen: detail?.store_open ?? "09:00",
      storeClose: detail?.store_close ?? "21:00",
      address: detail?.address ?? "",
      latitude: detail?.latitude != null ? String(detail.latitude) : "",
      longitude: detail?.longitude != null ? String(detail.longitude) : "",
      radius: detail?.radius ?? 50,
      storeDays: detail?.store_days ?? [],
    }),
  reset: () =>
    set({
      name: "",
      type: "",
      logo: null,
      pictures: [null, null, null],
      phone: "",
      registrationNumber: "",
      businessDoc: null,
      storeOpen: "09:00",
      storeClose: "21:00",
      address: "",
      latitude: "",
      longitude: "",
      radius: 50,
    }),
}));

export const useDetailViewStore = create<DetailViewState>((set) => ({
  detail: null,
  setDetail: (detail) => set({ detail }),
  reset: () => set({ detail: null }),
}));
