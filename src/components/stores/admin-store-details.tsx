import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  Platform,
  StyleSheet,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { Modal } from "@/components/modal";
import { Button } from "@/components/button";
import { AdminStoreRow } from "@/services/store-service";

const twConfig = require("../../../tailwind.config.js");
const twColors = twConfig.theme.extend.colors;

const T = {
  pageBg:       twColors.backgroundMuted,
  cardBg:       "#ffffff",
  cardBorder:   "#e2e8f0",

  amberBg:      "#ffffff",
  amberBorder:  "#f5e4a8",
  amberBadge:   "#fef0c0",
  amberText:    "#7a5c00",

  greenBg:      "#ffffff",
  greenBorder:  "#d4fce2",
  greenBadge:   "#dcfce7",
  greenText:    twColors.success,

  redBg:        "#ffffff",
  redBorder:    "#fecaca",
  redBadge:     "#fee2e2",
  redText:      twColors.danger,

  textPrimary:  twColors.textPrimary,
  textMuted:    twColors.textMuted,

  primary:      twColors.primary,
  typePillBg:   twColors.primary,

  dashedBorder: "#cbd5e1",
  dashedBg:     twColors.background,
  dashedIcon:   twColors.textMuted,
};

type StatusKey = "pending" | "active" | "inactive";
const STATUS_CONFIG: Record<StatusKey, {
  label: string; icon: "schedule" | "check-circle" | "cancel";
  bg: string; border: string; badgeBg: string; text: string;
}> = {
  pending:  { label: "PENDING",  icon: "schedule",      bg: T.amberBg, border: T.amberBorder, badgeBg: T.amberBadge, text: T.amberText },
  active:   { label: "ACTIVE",   icon: "check-circle",  bg: T.greenBg, border: T.greenBorder, badgeBg: T.greenBadge, text: T.greenText },
  inactive: { label: "INACTIVE", icon: "cancel",         bg: T.redBg,   border: T.redBorder,   badgeBg: T.redBadge,   text: T.redText   },
};

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={s.sectionTitle}>{title}</Text>
);

const FieldLabel = ({ children }: { children: string }) => (
  <Text style={s.fieldLabel}>{children}</Text>
);

const FieldCard = ({ children, noPad }: { children: React.ReactNode; noPad?: boolean }) => (
  <View style={[s.fieldCard, noPad && { padding: 10 }]}>{children}</View>
);

const ReadOnlyField = ({ label, value }: { label: string; value?: string | null }) => (
  <View style={s.fieldWrap}>
    <FieldLabel>{label}</FieldLabel>
    <FieldCard>
      <Text style={s.fieldValue}>{value || "—"}</Text>
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
    <ScreenWrapper style={s.wrapper}>

      <View style={s.topbar}>
        <View style={s.topbarLeft}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.iconBtn}>
            <MaterialIcons name="arrow-back" size={24} color={T.textPrimary} />
          </TouchableOpacity>
          <Text style={s.topbarTitle}>Store Details</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} style={s.iconBtn}>
          <MaterialIcons name="more-vert" size={24} color={T.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: T.pageBg }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.statusBanner, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
          <Text style={[s.statusLabel, { color: statusCfg.text }]}>Application Status</Text>
          <View style={[s.statusBadge, { backgroundColor: statusCfg.badgeBg }]}>
            <MaterialIcons name={statusCfg.icon} size={13} color={statusCfg.text} />
            <Text style={[s.statusBadgeText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
          </View>
        </View>

        <View>
          <SectionHeader title="Store Details" />
          <ReadOnlyField label="STORE NAME" value={store.name} />

          <View style={s.fieldWrap}>
            <FieldLabel>STORE TYPE</FieldLabel>
            <FieldCard noPad>
              {store.type ? (
                <View style={s.typePill}>
                  <Text style={s.typePillText}>{store.type}</Text>
                </View>
              ) : (
                <Text style={[s.fieldValue, { color: "#aaa", padding: 3 }]}>—</Text>
              )}
            </FieldCard>
          </View>

          <View style={s.fieldWrap}>
            <FieldLabel>STORE LOGO</FieldLabel>
            <FieldCard noPad>
              <View style={s.logoBox}>
                {store.logo ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedImage(store.logo!)}
                    style={{ width: "100%", height: "100%" }}
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

          <View style={s.twoCol}>
            <View style={s.twoColItem}>
              <FieldLabel>BUSINESS REGISTRATION #</FieldLabel>
              <FieldCard><Text style={s.fieldValue} numberOfLines={1}>{store.registration_number || "—"}</Text></FieldCard>
            </View>
            <View style={s.twoColItem}>
              <FieldLabel>REGISTERED ON</FieldLabel>
              <FieldCard><Text style={s.fieldValue} numberOfLines={1}>{registeredDate}</Text></FieldCard>
            </View>
          </View>

          <View style={[s.fieldWrap, { marginTop: 10 }]}>
            <FieldLabel>BUSINESS DOCUMENT</FieldLabel>
            <FieldCard noPad>
              {store.business_document_image ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setSelectedImage(store.business_document_image!)}
                  style={s.docWrap}
                >
                  <Image source={{ uri: store.business_document_image }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                  <View style={s.docOverlay}>
                    <View style={s.eyeBtn}>
                      <MaterialIcons name="visibility" size={18} color="#fff" />
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <Text style={[s.fieldValue, { color: "#aaa", padding: 3 }]}>—</Text>
              )}
            </FieldCard>
          </View>
        </View>

        <View>
          <SectionHeader title="Location Details" />
          <View style={s.fieldWrap}>
            <FieldLabel>LANDMARK / ADDRESS</FieldLabel>
            <View style={s.addressCard}>
              <MaterialIcons name="location-on" size={20} color={T.primary} style={{ marginTop: 1 }} />
              <Text style={s.addressText}>{store.address || "—"}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      
      {isPending && (
        <View style={s.bottomBar}>
          <View style={s.bottomActions}>
            <View style={{ flex: 1 }}>
              <Button
                variant="primary"
                label="Approve Store"
                onPress={() => onApprove(store)}
                fullWidth
              />
            </View>
            <View style={{ flex: 1 }}>
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

      
      {!!selectedImage && (
        <Modal visible onClose={() => setSelectedImage(null)} title="" dismissOnBackdrop>
          <View style={{ alignItems: "center", justifyContent: "center", padding: 16 }}>
            <Image source={{ uri: selectedImage }} style={{ width: "100%", height: 380 }} contentFit="contain" />
          </View>
        </Modal>
      )}
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: T.pageBg },

  topbar: { 
    backgroundColor: "#fff", 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 16, 
    height: 60, 
    borderBottomWidth: 1, 
    borderBottomColor: T.cardBorder 
  },
  topbarLeft:  { flexDirection: "row", alignItems: "center", gap: 6 },
  topbarTitle: { fontSize: 17, fontWeight: "700", color: T.textPrimary, marginLeft: 4 },
  iconBtn:     { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18 },

  
  scrollContent: { 
    paddingHorizontal: 16, 
    paddingTop: 16, 
    paddingBottom: 160, 
    gap: 20 
  },

  statusBanner:    { borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusLabel:     { fontSize: 13, fontWeight: "600" },
  statusBadge:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusBadgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },
  sectionTitle:    { fontSize: 16, fontWeight: "700", color: T.textPrimary, marginBottom: 12 },

  fieldWrap:  { marginBottom: 10 },
  fieldLabel: { fontSize: 10, fontWeight: "700", color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, paddingHorizontal: 2 },
  fieldCard:  { backgroundColor: T.cardBg, borderRadius: 12, padding: 13, borderWidth: 1, borderColor: T.cardBorder, minHeight: 48, justifyContent: "center" },
  fieldValue: { fontSize: 14, fontWeight: "500", color: T.textPrimary },

  typePill:     { backgroundColor: T.typePillBg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, alignSelf: "flex-start", margin: 3 },
  typePillText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  logoBox: { width: 60, height: 60, borderRadius: 12, overflow: "hidden", backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", margin: 3 },

  docWrap:    { width: "100%", height: 150, borderRadius: 10, overflow: "hidden", margin: 3 },
  docOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center" },
  eyeBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },

  twoCol:     { flexDirection: "row", gap: 10 },
  twoColItem: { flex: 1 },
  addressCard: { backgroundColor: T.cardBg, borderRadius: 12, borderWidth: 1, borderColor: T.cardBorder, padding: 13, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  addressText: { flex: 1, fontSize: 13, fontWeight: "500", color: T.textPrimary, lineHeight: 20 },

  
  bottomBar: { 
    position: "absolute", 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: "#fff", 
    borderTopWidth: 1, 
    borderTopColor: T.cardBorder,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 20,
  },
  bottomActions: {
    flexDirection: "row",
    gap: 12,
  }
});