import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    StyleSheet,
    ActivityIndicator,
    Image,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Stepper } from "@/components/stepper";
import { supabase } from "@/supabase/supabase";
import { createStore } from "@/services/store-service";
import { useCreateStoreStore } from "@/store/create-store-store";
import { useManagerStoresStore } from "@/store/manager-stores-store";

// ── Utility: Base64 to ArrayBuffer ─────────────────────────────────────────
function base64ToArrayBuffer(base64: string) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

    let bufferLength = base64.length * 0.75;
    if (base64[base64.length - 1] === "=") bufferLength--;
    if (base64[base64.length - 2] === "=") bufferLength--;

    const arraybuffer = new ArrayBuffer(bufferLength);
    const bytes = new Uint8Array(arraybuffer);

    let p = 0;
    for (let i = 0; i < base64.length; i += 4) {
        const encoded1 = lookup[base64.charCodeAt(i)];
        const encoded2 = lookup[base64.charCodeAt(i + 1)];
        const encoded3 = lookup[base64.charCodeAt(i + 2)];
        const encoded4 = lookup[base64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        if (encoded3 !== 64) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        if (encoded4 !== 64) bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
    return arraybuffer;
}

// ── Constants ──────────────────────────────────────────────────────────────
const TOTAL_STEPS = 4;

const STORE_TYPES = [
    "Café", "Restaurant", "Retail", "Salon & Beauty",
    "Bakery", "Pharmacy", "Grocery", "Clothing", "Electronics", "Other",
];

// ── Step 1: Store Basics ──────────────────────────────────────────────────
function StoreBasicsStep({
    storeName, onStoreName, storeType, onStoreType,
    logoUri, onPickLogo, isUploadingLogo, errors,
}: {
    storeName: string; onStoreName: (v: string) => void;
    storeType: string; onStoreType: (v: string) => void;
    logoUri: string | null; onPickLogo: () => void;
    isUploadingLogo: boolean;
    errors: { storeName?: string; storeType?: string };
}) {
    return (
        <View style={{ gap: 24 }}>
            <View style={{ alignItems: "center" }}>
                <TouchableOpacity onPress={onPickLogo} style={styles.logoPicker} disabled={isUploadingLogo}>
                    <View style={styles.logoPlaceholder}>
                        {isUploadingLogo ? (
                            <ActivityIndicator color="#FF6600" size="small" />
                        ) : logoUri ? (
                            <Image source={{ uri: logoUri }} style={{ width: 96, height: 96, borderRadius: 24 }} resizeMode="cover" />
                        ) : (
                            <>
                                <MaterialIcons name="add-a-photo" size={28} color="#94A3B8" />
                                <Text style={styles.logoHint}>Add Logo</Text>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
                <Text style={styles.logoSubtext}>{logoUri ? "Tap to change logo" : "Store logo (optional)"}</Text>
            </View>

            <View>
                <Text style={styles.label}>Store Name <Text style={{ color: "#EF4444" }}>*</Text></Text>
                <TextInput
                    value={storeName} onChangeText={onStoreName}
                    placeholder="e.g. The Coffee Foundry" placeholderTextColor="#94A3B8"
                    style={[styles.input, errors.storeName ? styles.inputError : null]} autoFocus
                />
                {errors.storeName ? <Text style={styles.errorText}>{errors.storeName}</Text> : null}
            </View>

            <View>
                <Text style={styles.label}>Store Type <Text style={{ color: "#EF4444" }}>*</Text></Text>
                <View style={styles.pillGrid}>
                    {STORE_TYPES.map((type) => {
                        const active = storeType === type;
                        return (
                            <TouchableOpacity key={type} onPress={() => onStoreType(type)}
                                style={[styles.pill, active && styles.pillActive]}>
                                <Text style={[styles.pillText, active && styles.pillTextActive]}>{type}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                {errors.storeType ? <Text style={styles.errorText}>{errors.storeType}</Text> : null}
            </View>
        </View>
    );
}

// ── Step 2: Location ──────────────────────────────────────────────────────
function LocationStep({
    address, onAddress, latitude, onLatitude, longitude, onLongitude, errors,
}: {
    address: string; onAddress: (v: string) => void;
    latitude: string; onLatitude: (v: string) => void;
    longitude: string; onLongitude: (v: string) => void;
    errors: { address?: string };
}) {
    return (
        <View style={{ gap: 20 }}>
            <View style={styles.infoBox}>
                <MaterialIcons name="info-outline" size={16} color="#3B82F6" />
                <Text style={styles.infoText}>
                    Enter your store's full address. Coordinates are optional — they enable the nearby store feature for customers.
                </Text>
            </View>
            <View>
                <Text style={styles.label}>Address <Text style={{ color: "#EF4444" }}>*</Text></Text>
                <TextInput
                    value={address} onChangeText={onAddress}
                    placeholder="e.g. 123 Main St, Brooklyn, NY 11201" placeholderTextColor="#94A3B8"
                    style={[styles.input, styles.inputMultiline, errors.address ? styles.inputError : null]}
                    multiline numberOfLines={3}
                />
                {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
            </View>
            <Text style={[styles.label, { marginBottom: 0 }]}>Coordinates (optional)</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.sublabel}>Latitude</Text>
                    <TextInput value={latitude} onChangeText={onLatitude} placeholder="e.g. 40.6782"
                        placeholderTextColor="#94A3B8" style={styles.input} keyboardType="decimal-pad" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.sublabel}>Longitude</Text>
                    <TextInput value={longitude} onChangeText={onLongitude} placeholder="e.g. -73.9442"
                        placeholderTextColor="#94A3B8" style={styles.input} keyboardType="decimal-pad" />
                </View>
            </View>
        </View>
    );
}

// ── Step 3: Business Verification ─────────────────────────────────────────
function BusinessVerificationStep({
    phone, onPhone, registrationNumber, onRegistrationNumber,
}: {
    phone: string; onPhone: (v: string) => void;
    registrationNumber: string; onRegistrationNumber: (v: string) => void;
}) {
    return (
        <View style={{ gap: 20 }}>
            <View style={styles.infoBox}>
                <MaterialIcons name="hourglass-empty" size={16} color="#D97706" />
                <Text style={styles.infoText}>
                    All fields below are optional. Our team will verify your business details within 1–2 business days before activating your store.
                </Text>
            </View>
            <View>
                <Text style={styles.label}>Contact Phone</Text>
                <TextInput value={phone} onChangeText={onPhone} placeholder="e.g. +1 555 000 1234"
                    placeholderTextColor="#94A3B8" style={styles.input} keyboardType="phone-pad" />
            </View>
            <View>
                <Text style={styles.label}>Business Registration Number</Text>
                <TextInput value={registrationNumber} onChangeText={onRegistrationNumber}
                    placeholder="e.g. BR-12345678" placeholderTextColor="#94A3B8"
                    style={styles.input} autoCapitalize="characters" />
                <Text style={styles.fieldHint}>DTI, SEC, or equivalent national registration number</Text>
            </View>
        </View>
    );
}

// ── Step 4: Review & Submit ────────────────────────────────────────────────
function ReviewRow({ icon, label, value, muted = false }: {
    icon: React.ComponentProps<typeof MaterialIcons>["name"];
    label: string; value: string; muted?: boolean;
}) {
    return (
        <View style={styles.reviewRow}>
            <MaterialIcons name={icon} size={16} color="#94A3B8" style={{ marginTop: 1 }} />
            <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.reviewLabel}>{label}</Text>
                <Text style={[styles.reviewValue, muted && { color: "#94A3B8", fontFamily: "Poppins-Regular" }]}>{value}</Text>
            </View>
        </View>
    );
}

function ReviewStep({ storeName, storeType, address, latitude, longitude, phone, registrationNumber, logoUri }: {
    storeName: string; storeType: string; address: string;
    latitude: string; longitude: string; phone: string;
    registrationNumber: string; logoUri: string | null;
}) {
    return (
        <View style={{ gap: 16 }}>
            <View style={styles.reviewCard}>
                <Text style={styles.reviewSection}>Store Basics</Text>
                {logoUri ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <Image source={{ uri: logoUri }} style={{ width: 48, height: 48, borderRadius: 12 }} resizeMode="cover" />
                        <Text style={styles.reviewValue}>Logo uploaded ✓</Text>
                    </View>
                ) : null}
                <ReviewRow icon="store" label="Name" value={storeName} />
                <ReviewRow icon="category" label="Type" value={storeType} />
            </View>
            <View style={styles.reviewCard}>
                <Text style={styles.reviewSection}>Location</Text>
                <ReviewRow icon="location-on" label="Address" value={address} />
                {(latitude || longitude) ? (
                    <ReviewRow icon="my-location" label="Coordinates" value={`${latitude || "—"}, ${longitude || "—"}`} />
                ) : null}
            </View>
            <View style={styles.reviewCard}>
                <Text style={styles.reviewSection}>Business Verification</Text>
                <ReviewRow icon="phone" label="Phone" value={phone || "Not provided"} muted={!phone} />
                <ReviewRow icon="business" label="Reg. No." value={registrationNumber || "Not provided"} muted={!registrationNumber} />
            </View>
            <View style={styles.pendingNotice}>
                <MaterialIcons name="info-outline" size={16} color="#D97706" />
                <Text style={styles.pendingNoticeText}>
                    Your store will be set to <Text style={{ fontFamily: "Poppins-Bold" }}>Pending Review</Text> until our team verifies it.
                </Text>
            </View>
        </View>
    );
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function CreateStore() {
    const insets = useSafeAreaInsets();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    // Global Store State
    const store = useCreateStoreStore();

    // Validation States (Keep Local)
    const [step1Errors, setStep1Errors] = useState<{ storeName?: string; storeType?: string }>({});
    const [step2Errors, setStep2Errors] = useState<{ address?: string }>({});

    // ── Logo picker + Supabase Storage upload ─────────────────────────────
    const handlePickLogo = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Please allow access to your photo library to upload a logo.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: true,  // get base64 directly — avoids all content:// URI issues on Android
            });

            if (result.canceled || !result.assets?.[0]) return;

            const asset = result.assets[0];
            if (!asset.base64) {
                Alert.alert("Error", "Could not read image data. Please try again.");
                return;
            }

            store.setLogoUri(asset.uri);
            setIsUploadingLogo(true);

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Not authenticated");

                // Reliable cross-platform base64 arraybuffer decoding
                // using a custom lightweight decoder to skip 'atob' and fetch blob issues
                const arrayBuffer = base64ToArrayBuffer(asset.base64);

                const mimeType = asset.mimeType ?? "image/jpeg";
                const ext = mimeType.split("/")[1] ?? "jpg";
                const fileName = `store-logos/${user.id}/${Date.now()}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from("puntos-public")
                    .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: true });

                if (uploadError) throw new Error(uploadError.message);

                const { data: urlData } = supabase.storage.from("puntos-public").getPublicUrl(fileName);
                store.setLogoPublicUrl(urlData.publicUrl);
            } catch (err: any) {
                Alert.alert("Upload Failed", err?.message ?? "Could not upload logo. You can still submit without it.");
                store.setLogoUri(null);
                store.setLogoPublicUrl(null);
            } finally {
                setIsUploadingLogo(false);
            }
        } catch (error: any) {
            console.error("ImagePicker outer catch error:", error);
            Alert.alert("Store Logo Error", error?.message || "An unexpected error occurred while picking the image.");
        }
    };

    // ── Validation ────────────────────────────────────────────────────────
    const validateStep1 = () => {
        const errs: { storeName?: string; storeType?: string } = {};
        if (!store.storeName.trim()) errs.storeName = "Store name is required";
        if (!store.storeType) errs.storeType = "Please select a store type";
        setStep1Errors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep2 = () => {
        const errs: { address?: string } = {};
        if (!store.address.trim()) errs.address = "Address is required";
        setStep2Errors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Navigation ────────────────────────────────────────────────────────
    const goNext = () => {
        if (store.currentStep === 1 && !validateStep1()) return;
        if (store.currentStep === 2 && !validateStep2()) return;
        if (store.currentStep < TOTAL_STEPS) store.setCurrentStep(store.currentStep + 1);
    };

    const goBack = () => {
        if (store.currentStep > 1) store.setCurrentStep(store.currentStep - 1);
        else router.back();
    };

    // ── Submit ────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { Alert.alert("Error", "You must be logged in to create a store."); return; }

            // Construct optimistic store row to inject into dashboard immediately
            const optimisticStore = {
                id: Math.random(), // Temporary ID since Supabase will assign the real one
                name: store.storeName.trim(),
                type: store.storeType || null,
                address: store.address.trim() || null,
                latitude: store.latitude ? parseFloat(store.latitude) : null,
                longitude: store.longitude ? parseFloat(store.longitude) : null,
                phone: store.phone.trim() || null,
                registration_number: store.registrationNumber.trim() || null,
                owner_id: user.id,
                logo: store.logoPublicUrl ?? null,
                status: "pending_review",
                created_at: new Date().toISOString()
            };

            await createStore({
                name: optimisticStore.name,
                type: optimisticStore.type ?? undefined,
                address: optimisticStore.address ?? undefined,
                latitude: optimisticStore.latitude,
                longitude: optimisticStore.longitude,
                phone: optimisticStore.phone ?? undefined,
                registrationNumber: optimisticStore.registration_number ?? undefined,
                ownerId: optimisticStore.owner_id,
                storeImageUrl: optimisticStore.logo ?? undefined,
            });

            // Optimistically add it to the manager's dashboard right now
            useManagerStoresStore.getState().addStoreOptimistically(optimisticStore as any);

            Alert.alert(
                "Store Submitted! 🎉",
                "Your store is now pending review. Our team will verify it within 1–2 business days.",
                [{
                    text: "Got it",
                    onPress: () => {
                        store.resetForm();
                        router.replace("/(store_manager)/stores");
                    }
                }]
            );
        } catch (error: any) {
            Alert.alert("Submission Failed", error?.message ?? "Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const STEP_META = [
        { title: "Store Basics", desc: "Tell us about your store" },
        { title: "Location", desc: "Where is your store located?" },
        { title: "Business Verification", desc: "Provide your business details" },
        { title: "Review & Submit", desc: "Review your details before submitting" },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={22} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Store</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Stepper */}
            <Stepper currentStep={store.currentStep} totalSteps={TOTAL_STEPS} />

            {/* Step label */}
            <View style={styles.stepLabel}>
                <Text style={styles.stepTitle}>{STEP_META[store.currentStep - 1].title}</Text>
                <Text style={styles.stepDesc}>{STEP_META[store.currentStep - 1].desc}</Text>
            </View>

            {/* Step content */}
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {store.currentStep === 1 && (
                    <StoreBasicsStep
                        storeName={store.storeName} onStoreName={store.setStoreName}
                        storeType={store.storeType} onStoreType={store.setStoreType}
                        logoUri={store.logoUri} onPickLogo={handlePickLogo}
                        isUploadingLogo={isUploadingLogo} errors={step1Errors}
                    />
                )}
                {store.currentStep === 2 && (
                    <LocationStep
                        address={store.address} onAddress={store.setAddress}
                        latitude={store.latitude} onLatitude={store.setLatitude}
                        longitude={store.longitude} onLongitude={store.setLongitude}
                        errors={step2Errors}
                    />
                )}
                {store.currentStep === 3 && (
                    <BusinessVerificationStep
                        phone={store.phone} onPhone={store.setPhone}
                        registrationNumber={store.registrationNumber} onRegistrationNumber={store.setRegistrationNumber}
                    />
                )}
                {store.currentStep === 4 && (
                    <ReviewStep
                        storeName={store.storeName} storeType={store.storeType}
                        address={store.address} latitude={store.latitude} longitude={store.longitude}
                        phone={store.phone} registrationNumber={store.registrationNumber} logoUri={store.logoUri}
                    />
                )}
            </ScrollView>

            {/* Footer CTA */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    onPress={store.currentStep === TOTAL_STEPS ? handleSubmit : goNext}
                    style={[styles.nextBtn, isSubmitting && { opacity: 0.7 }]}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <>
                            <Text style={styles.nextBtnText}>{store.currentStep === TOTAL_STEPS ? "Submit for Review" : "Continue"}</Text>
                            <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 20, paddingBottom: 12,
        backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
    },
    headerTitle: { fontSize: 16, fontFamily: "Poppins-Bold", color: "#0F172A" },
    stepLabel: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 4 },
    stepTitle: { fontSize: 22, fontFamily: "Poppins-Bold", color: "#0F172A" },
    stepDesc: { fontSize: 13, fontFamily: "Poppins-Regular", color: "#94A3B8", marginTop: 2 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
    // Logo
    logoPicker: { marginBottom: 6 },
    logoPlaceholder: {
        width: 96, height: 96, borderRadius: 24,
        backgroundColor: "#F1F5F9", borderWidth: 2, borderColor: "#E2E8F0",
        borderStyle: "dashed", alignItems: "center", justifyContent: "center",
        gap: 4, overflow: "hidden",
    },
    logoHint: { fontSize: 11, fontFamily: "Poppins-Medium", color: "#94A3B8" },
    logoSubtext: { fontSize: 11, fontFamily: "Poppins-Regular", color: "#64748B" },
    // Form
    label: { fontSize: 13, fontFamily: "Poppins-Medium", color: "#475569", marginBottom: 8 },
    sublabel: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#94A3B8", marginBottom: 6 },
    input: {
        backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0",
        borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
        fontSize: 14, fontFamily: "Poppins-Regular", color: "#0F172A",
    },
    inputMultiline: { minHeight: 80, textAlignVertical: "top" },
    inputError: { borderColor: "#EF4444" },
    errorText: {
        fontSize: 12, fontFamily: "Poppins-Regular", color: "#EF4444",
        marginTop: 6, backgroundColor: "#FEF2F2", borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 6, textAlign: "center",
    },
    fieldHint: { fontSize: 11, fontFamily: "Poppins-Regular", color: "#CBD5E1", marginTop: 6 },
    // Pills
    pillGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    pill: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999,
        backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0",
    },
    pillActive: { backgroundColor: "#FF6600", borderColor: "#FF6600" },
    pillText: { fontSize: 13, fontFamily: "Poppins-Medium", color: "#64748B" },
    pillTextActive: { color: "#FFFFFF" },
    // Info box
    infoBox: {
        flexDirection: "row", alignItems: "flex-start", gap: 8,
        backgroundColor: "#EFF6FF", borderRadius: 12, padding: 12,
    },
    infoText: { flex: 1, fontSize: 12, fontFamily: "Poppins-Regular", color: "#1E40AF", lineHeight: 18 },
    // Review
    reviewCard: {
        backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, gap: 12,
        shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    reviewSection: {
        fontSize: 11, fontFamily: "Poppins-Bold", color: "#FF6600",
        textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
    },
    reviewRow: { flexDirection: "row", alignItems: "flex-start" },
    reviewLabel: { fontSize: 11, fontFamily: "Poppins-Regular", color: "#94A3B8" },
    reviewValue: { fontSize: 14, fontFamily: "Poppins-Medium", color: "#0F172A" },
    pendingNotice: {
        flexDirection: "row", alignItems: "flex-start", gap: 8,
        backgroundColor: "#FFFBEB", borderRadius: 12, padding: 12,
        borderLeftWidth: 3, borderLeftColor: "#F59E0B",
    },
    pendingNoticeText: { flex: 1, fontSize: 12, fontFamily: "Poppins-Regular", color: "#92400E", lineHeight: 18 },
    // Footer
    footer: {
        paddingHorizontal: 24, paddingTop: 16,
        backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#F1F5F9",
    },
    nextBtn: {
        backgroundColor: "#FF6600", borderRadius: 14, paddingVertical: 15,
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    },
    nextBtnText: { fontSize: 15, fontFamily: "Poppins-Bold", color: "#FFFFFF" },
});
