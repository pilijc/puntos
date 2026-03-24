import React, { useState } from "react";
import { ScrollView } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { Modal } from "@/components/modal";
import { Button } from "@/components/button";
import { AdminStoreRow } from "@/services/store-service";

type StatusKey = "pending" | "active" | "inactive";

const STATUS_CONFIG: Record<StatusKey, {
  label: string; icon: "schedule" | "check-circle" | "cancel";
  bg: string; border: string; badgeBg: string; text: string;
}> = {
  pending:  { label: "PENDING",  icon: "schedule",      bg: "#ffffff", border: "#f5e4a8", badgeBg: "#fef0c0", text: "#7a5c00" },
  active:   { label: "ACTIVE",   icon: "check-circle",  bg: "#ffffff", border: "#d4fce2", badgeBg: "#dcfce7", text: "#22C55E" },
  inactive: { label: "INACTIVE", icon: "cancel",        bg: "#ffffff", border: "#fecaca", badgeBg: "#fee2e2", text: "#EF4444" },
};

const SectionHeader = ({ title }: { title: string }) => (
  <Text className="text-base font-poppins-bold text-slate-900 dark:text-slate-100 mb-3">{title}</Text>
);

const FieldLabel = ({ children }: { children: string }) => (
  <Text className="text-[10px] font-poppins-bold text-slate-500 uppercase tracking-wider mb-1 px-1">{children}</Text>
);

const FieldCard = ({ children, noPad }: { children: React.ReactNode; noPad?: boolean }) => (
  <View className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 min-h-[48px] justify-center ${noPad ? 'p-2.5' : 'p-3'}`}>
    {children}
  </View>
);

const ReadOnlyField = ({ label, value }: { label: string; value?: string | null }) => (
  <View className="mb-2.5">
    <FieldLabel>{label}</FieldLabel>
    <FieldCard>
      <Text className="text-sm font-poppins-medium text-slate-900 dark:text-slate-100">{value || "—"}</Text>
    </FieldCard>
  </View>
);

export function AdminStoreDetails({
  store,
  onBack,
  onApprove,
  onReject,
}: {
  store: AdminStoreRow;
  onBack: () => void;
  onApprove: (store: AdminStoreRow) => void;
  onReject: (store: AdminStoreRow) => void;
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isPending = store.status?.toLowerCase().includes("pending");
  const statusKey = isPending ? "pending" : (store.status as StatusKey);
  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;

  const registeredDate = new Date(store.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <ScreenWrapper className="flex-1 bg-backgroundMuted dark:bg-slate-950">

      <View className="flex-row items-center justify-between px-4 h-[60px]">
        <View className="flex-row items-center gap-1.5">
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} className="w-9 h-9 items-center justify-center rounded-full">
            <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-[17px] font-poppins-bold text-slate-900 dark:text-slate-100 ml-1">Store Details</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-backgroundMuted dark:bg-slate-950"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
      <View style={{ backgroundColor: statusCfg.bg, borderColor: statusCfg.border }} className="rounded-2xl border p-3 flex-row items-center justify-between">
          <Text style={{ color: statusCfg.text }} className="text-[13px] font-poppins-bold">Application Status</Text>
          <View style={{ backgroundColor: statusCfg.badgeBg }} className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-full">
            <MaterialIcons name={statusCfg.icon} size={13} color={statusCfg.text} />
            <Text style={{ color: statusCfg.text }} className="text-[11px] font-poppins-bold tracking-wider">{statusCfg.label}</Text>
          </View>
        </View>

        <View>
          <SectionHeader title="Store Details" />
          <ReadOnlyField label="STORE NAME" value={store.name} />

          <View className="mb-2.5">
            <FieldLabel>STORE TYPE</FieldLabel>
            <FieldCard noPad>
              {store.type ? (
                <View className="bg-primary rounded-full px-3.5 py-1.5 self-start m-1">
                  <Text className="text-xs font-poppins-bold text-white">{store.type}</Text>
                </View>
              ) : (
                <Text className="text-sm font-poppins-medium text-slate-400 p-1">—</Text>
              )}
            </FieldCard>
          </View>

          <View className="mb-2.5">
            <FieldLabel>STORE LOGO</FieldLabel>
            <FieldCard noPad>
              <View className="w-[60px] h-[60px] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 items-center justify-center m-1">
                {store.logo ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedImage(store.logo!)}
                    className="w-full h-full"
                  >
                    <Image source={{ uri: store.logo }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                  </TouchableOpacity>
                ) : (
                  <MaterialIcons name="storefront" size={26} color="#94A3B8" />
                )}
              </View>
            </FieldCard>
          </View>
        </View>

        <View>
          <SectionHeader title="Business Details" />
          <ReadOnlyField label="OWNER NAME"   value={store.owner_name} />
          <ReadOnlyField label="PHONE NUMBER" value={store.phone} />

          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <FieldLabel>BUSINESS REGISTRATION #</FieldLabel>
              <FieldCard><Text className="text-sm font-poppins-medium text-slate-900 dark:text-slate-100" numberOfLines={1}>{store.registration_number || "—"}</Text></FieldCard>
            </View>
            <View className="flex-1">
              <FieldLabel>REGISTERED ON</FieldLabel>
              <FieldCard><Text className="text-sm font-poppins-medium text-slate-900 dark:text-slate-100" numberOfLines={1}>{registeredDate}</Text></FieldCard>
            </View>
          </View>

          <View className="mb-2.5 mt-2.5">
            <FieldLabel>BUSINESS DOCUMENT</FieldLabel>
            <FieldCard noPad>
              {store.business_document_image ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setSelectedImage(store.business_document_image!)}
                  className="w-full h-[150px] rounded-lg overflow-hidden m-1 relative"
                >
                  <Image source={{ uri: store.business_document_image }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                  <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}>
                      <MaterialIcons name="visibility" size={18} color="#fff" />
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <Text className="text-sm font-poppins-medium text-slate-400 p-1">—</Text>
              )}
            </FieldCard>
          </View>
        </View>

        <View>
          <SectionHeader title="Location Details" />
          <View className="mb-2.5">
            <FieldLabel>LANDMARK / ADDRESS</FieldLabel>
            <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex-row items-start gap-2.5">
              <View className="mt-0.5"><MaterialIcons name="location-on" size={20} color="#FF6600" /></View>
              <Text className="flex-1 text-[13px] font-poppins-medium text-slate-900 dark:text-slate-100 leading-5">{store.address || "—"}</Text>
            </View>
          </View>
        </View>

        {isPending && (
          <View className="-mt-1">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  variant="primary"
                  label="Approve Store"
                  onPress={() => onApprove(store)}
                  fullWidth
                />
              </View>
              <View className="flex-1">
                <Button
                  variant="danger"
                  label="Reject Application"
                  onPress={() => onReject(store)}
                  fullWidth
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {!!selectedImage && (
        <Modal visible onClose={() => setSelectedImage(null)} title="" dismissOnBackdrop>
          <View className="items-center justify-center p-4">
            <Image source={{ uri: selectedImage }} style={{ width: "100%", height: 380 }} contentFit="contain" />
          </View>
        </Modal>
      )}
    </ScreenWrapper>
  );
}