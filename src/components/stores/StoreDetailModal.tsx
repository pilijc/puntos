import React, { useState, useEffect } from "react";
import { Modal, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, useColorScheme } from "react-native";
import { View, Text, TextInput, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { StoreRow, updateStore, UpdateStorePayload } from "@/services/store-service";

interface StoreDetailModalProps {
    store: StoreRow | null;
    visible: boolean;
    onClose: () => void;
    onSaved: (updated: StoreRow) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    active: { label: "Active", color: "#16A34A", bg: "#F0FDF4", dot: "#22C55E" },
    pending_review: { label: "Pending Review", color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
    inactive: { label: "Inactive", color: "#64748B", bg: "#F1F5F9", dot: "#94A3B8" },
};

function FieldRow({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <View className="bg-neutral-50 dark:bg-darkBackgroundMuted rounded-xl px-4 py-3">
            <Text className="text-[10px] font-poppins-bold text-textMuted dark:text-darkTextMuted tracking-widest uppercase mb-1">
                {label}
            </Text>
            <Text className="text-sm font-poppins-medium text-textPrimary dark:text-darkTextPrimary">{value}</Text>
        </View>
    );
}

function InputField({
    label,
    value,
    onChangeText,
    placeholder,
    multiline,
    keyboardType,
    isDark,
}: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    multiline?: boolean;
    keyboardType?: any;
    isDark: boolean;
}) {
    return (
        <View className="gap-1.5">
            <Text className="text-xs font-poppins-bold text-neutral-600 dark:text-darkTextSecondary ml-1">{label}</Text>
            <TextInput
                className="bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder rounded-xl px-4 py-3 text-sm font-poppins-medium text-textPrimary dark:text-darkTextPrimary"
                style={{ fontFamily: "Poppins-Medium", minHeight: multiline ? 76 : 48 }}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={isDark ? "#4b5563" : "#CBD5E1"}
                multiline={multiline}
                keyboardType={keyboardType}
            />
        </View>
    );
}

export default function StoreDetailModal({ store, visible, onClose, onSaved }: StoreDetailModalProps) {
    const isDark = useColorScheme() === "dark";

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [type, setType] = useState("");

    useEffect(() => {
        if (store) {
            setName(store.name ?? "");
            setAddress(store.address ?? "");
            setPhone(store.phone ?? "");
            setType(store.type ?? "");
            setEditing(false);
        }
    }, [store]);

    const handleSave = async () => {
        if (!store) return;
        setSaving(true);
        try {
            const payload: UpdateStorePayload = {
                name: name.trim() || undefined,
                address: address.trim() || undefined,
                phone: phone.trim() || undefined,
                type: type.trim() || undefined,
            };
            const updated = await updateStore(store.id, payload);
            onSaved(updated);
            setEditing(false);
            Alert.alert("Saved", "Store details updated successfully.");
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Failed to save store.");
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setEditing(false);
        onClose();
    };

    if (!store) return null;

    const status = store.status ?? "inactive";
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["inactive"];

    return (
        <Modal
            animationType="slide"
            transparent
            statusBarTranslucent
            visible={visible}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={"padding"}
                style={{ flex: 1 }}
            >
                {/* Scrim */}
                <TouchableOpacity
                    className="absolute inset-0 bg-black/50"
                    activeOpacity={1}
                    onPress={handleClose}
                />

                {/* Sheet */}
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <View className="bg-background dark:bg-darkBackground rounded-t-[32px] px-6 pt-3 pb-2 max-h-[90%]">
                        {/* Handle */}
                        <View className="w-10 h-1 rounded-full bg-neutral-200 dark:bg-darkBackgroundCard self-center mb-5" />

                        {/* Header */}
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="flex-1 mr-3">
                                <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary" numberOfLines={1}>
                                    {editing ? "Edit Store" : store.name}
                                </Text>
                                {!editing && (
                                    <Text className="text-sm font-poppins-regular text-neutral-500 dark:text-darkTextSecondary">
                                        Store details
                                    </Text>
                                )}
                            </View>
                            <View className="flex-row gap-2 items-center">
                                {!editing && (
                                    <TouchableOpacity
                                        className="flex-row items-center gap-1 px-3 py-2 rounded-xl bg-orange-50 dark:bg-darkPrimaryBgMuted border border-orange-200 dark:border-darkPrimaryBorder"
                                        onPress={() => setEditing(true)}
                                    >
                                        <MaterialIcons name="edit" size={14} color="#FF6600" />
                                        <Text className="text-xs font-poppins-bold text-primary">Edit</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    className="h-10 w-10 bg-neutral-100 dark:bg-darkBackgroundMuted rounded-full items-center justify-center"
                                    onPress={handleClose}
                                >
                                    <MaterialIcons name="close" size={20} color={isDark ? "#9ca3af" : "#4b5563"} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 32 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Logo + status badge */}
                            <View className="items-center mb-6 gap-3">
                                {store.logo ? (
                                    <Image
                                        source={{ uri: store.logo }}
                                        style={{ width: 88, height: 88, borderRadius: 20 }}
                                        contentFit="cover"
                                    />
                                ) : (
                                    <View className="w-22 h-22 rounded-[20px] bg-neutral-100 dark:bg-darkBackgroundMuted items-center justify-center"
                                        style={{ width: 88, height: 88 }}
                                    >
                                        <MaterialIcons name="storefront" size={36} color={isDark ? "#4b5563" : "#CBD5E1"} />
                                    </View>
                                )}
                                <View
                                    className="flex-row items-center rounded-lg px-3 py-1 gap-1.5"
                                    style={{ backgroundColor: cfg.bg }}
                                >
                                    <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                                    <Text className="text-xs font-poppins-bold" style={{ color: cfg.color }}>
                                        {cfg.label}
                                    </Text>
                                </View>
                            </View>

                            {!editing ? (
                                /* View mode */
                                <View className="gap-3">
                                    <FieldRow label="Store Name" value={store.name} />
                                    <FieldRow label="Type" value={store.type} />
                                    <FieldRow label="Address" value={store.address} />
                                    <FieldRow label="Phone" value={store.phone} />
                                    <FieldRow label="Registration No." value={store.registration_number} />
                                    <FieldRow
                                        label="Created"
                                        value={new Date(store.created_at).toLocaleDateString("en-US", {
                                            month: "long", day: "numeric", year: "numeric",
                                        })}
                                    />
                                    <FieldRow label="Active" value={store.is_active ? "Yes" : "No"} />
                                </View>
                            ) : (
                                /* Edit mode */
                                <View className="gap-4">
                                    <InputField label="Store Name" value={name} onChangeText={setName} placeholder="Store name" isDark={isDark} />
                                    <InputField label="Type" value={type} onChangeText={setType} placeholder="e.g. Coffee Shop" isDark={isDark} />
                                    <InputField label="Address" value={address} onChangeText={setAddress} placeholder="Full address" multiline isDark={isDark} />
                                    <InputField label="Phone" value={phone} onChangeText={setPhone} placeholder="+63 9XX XXX XXXX" keyboardType="phone-pad" isDark={isDark} />

                                    {/* Actions */}
                                    <View className="flex-row gap-3 mt-2">
                                        <TouchableOpacity
                                            className="flex-1 py-4 rounded-2xl items-center bg-neutral-100 dark:bg-darkBackgroundMuted"
                                            onPress={() => setEditing(false)}
                                            disabled={saving}
                                        >
                                            <Text className="text-neutral-900 dark:text-darkTextSoftest font-poppins-bold">Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className={`flex-[2] py-4 rounded-2xl items-center bg-primary ${saving ? "opacity-60" : ""}`}
                                            onPress={handleSave}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <ActivityIndicator color="#FFFFFF" size="small" />
                                            ) : (
                                                <Text className="text-white font-poppins-bold">Save Changes</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
