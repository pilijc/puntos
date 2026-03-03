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
import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Stepper } from "@/components/stepper";
import { supabase } from "@/supabase/supabase";
import { createStore } from "@/services/store-service";

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

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    // Step 1
    const [storeName, setStoreName] = useState("");
    const [storeType, setStoreType] = useState("");
    const [logoUri, setLogoUri] = useState<string | null>(null);
    const [logoPublicUrl, setLogoPublicUrl] = useState<string | null>(null);
    const [step1Errors, setStep1Errors] = useState<{ storeName?: string; storeType?: string }>({});

    // Step 2
    const [address, setAddress] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [step2Errors, setStep2Errors] = useState<{ address?: string }>({});

    // Step 3
    const [phone, setPhone] = useState("");
    const [registrationNumber, setRegistrationNumber] = useState("");

    // ── Reset all state every time this screen comes into focus ───────────
    useFocusEffect(
        useCallback(() => {
            setCurrentStep(1);
            setIsSubmitting(false);
            setIsUploadingLogo(false);
            setStoreName("");
            setStoreType("");
            setLogoUri(null);
            setLogoPublicUrl(null);
            setStep1Errors({});
            setAddress("");
            setLatitude("");
            setLongitude("");
            setStep2Errors({});
            setPhone("");
            setRegistrationNumber("");
        }, [])
    );

    // ── Logo picker + Supabase Storage upload ─────────────────────────────
    const handlePickLogo = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Please allow access to your photo library to upload a logo.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

            setLogoUri(asset.uri);
            setIsUploadingLogo(true);

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Not authenticated");

                // Convert base64 → Uint8Array (no local file reading needed)
                const binaryString = atob(asset.base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                const mimeType = asset.mimeType ?? "image/jpeg";
                const ext = mimeType.split("/")[1] ?? "jpg";
                const fileName = `store-logos/${user.id}/${Date.now()}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from("puntos")
                    .upload(fileName, bytes, { contentType: mimeType, upsert: true });

                if (uploadError) throw new Error(uploadError.message);

                const { data: urlData } = supabase.storage.from("puntos").getPublicUrl(fileName);
                setLogoPublicUrl(urlData.publicUrl);
            } catch (err: any) {
                Alert.alert("Upload Failed", err?.message ?? "Could not upload logo. You can still submit without it.");
                setLogoUri(null);
                setLogoPublicUrl(null);
            } finally {
                setIsUploadingLogo(false);
            }
        } catch {
            Alert.alert("Not Available", "Image picker is not available. Please rebuild the app after installing expo-image-picker.");

        }
    };

    // ── Validation ────────────────────────────────────────────────────────
    const validateStep1 = () => {
        const errs: { storeName?: string; storeType?: string } = {};
        if (!storeName.trim()) errs.storeName = "Store name is required";
        if (!storeType) errs.storeType = "Please select a store type";
        setStep1Errors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep2 = () => {
        const errs: { address?: string } = {};
        if (!address.trim()) errs.address = "Address is required";
        setStep2Errors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Navigation ────────────────────────────────────────────────────────
    const goNext = () => {
        if (currentStep === 1 && !validateStep1()) return;
        if (currentStep === 2 && !validateStep2()) return;
        if (currentStep < TOTAL_STEPS) setCurrentStep((s) => s + 1);
    };

    const goBack = () => {
        if (currentStep > 1) setCurrentStep((s) => s - 1);
        else router.back();
    };

    // ── Submit ────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { Alert.alert("Error", "You must be logged in to create a store."); return; }

            await createStore({
                name: storeName.trim(),
                type: storeType,
                address: address.trim(),
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                phone: phone.trim() || undefined,
                registrationNumber: registrationNumber.trim() || undefined,
                ownerId: user.id,
                storeImageUrl: logoPublicUrl ?? undefined,
            });

            Alert.alert(
                "Store Submitted! 🎉",
                "Your store is now pending review. Our team will verify it within 1–2 business days.",
                [{ text: "Got it", onPress: () => router.replace("/(store_manager)/stores") }]
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
            <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} />

            {/* Step label */}
            <View style={styles.stepLabel}>
                <Text style={styles.stepTitle}>{STEP_META[currentStep - 1].title}</Text>
                <Text style={styles.stepDesc}>{STEP_META[currentStep - 1].desc}</Text>
            </View>

            {/* Step content */}
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {currentStep === 1 && (
                    <StoreBasicsStep
                        storeName={storeName} onStoreName={setStoreName}
                        storeType={storeType} onStoreType={setStoreType}
                        logoUri={logoUri} onPickLogo={handlePickLogo}
                        isUploadingLogo={isUploadingLogo} errors={step1Errors}
                    />
                )}
                {currentStep === 2 && (
                    <LocationStep
                        address={address} onAddress={setAddress}
                        latitude={latitude} onLatitude={setLatitude}
                        longitude={longitude} onLongitude={setLongitude}
                        errors={step2Errors}
                    />
                )}
                {currentStep === 3 && (
                    <BusinessVerificationStep
                        phone={phone} onPhone={setPhone}
                        registrationNumber={registrationNumber} onRegistrationNumber={setRegistrationNumber}
                    />
                )}
                {currentStep === 4 && (
                    <ReviewStep
                        storeName={storeName} storeType={storeType}
                        address={address} latitude={latitude} longitude={longitude}
                        phone={phone} registrationNumber={registrationNumber} logoUri={logoUri}
                    />
                )}
            </ScrollView>

            {/* Footer CTA */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    onPress={currentStep === TOTAL_STEPS ? handleSubmit : goNext}
                    style={[styles.nextBtn, isSubmitting && { opacity: 0.7 }]}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <>
                            <Text style={styles.nextBtnText}>{currentStep === TOTAL_STEPS ? "Submit for Review" : "Continue"}</Text>
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
    logoSubtext: { fontSize: 11, fontFamily: "Poppins-Regular", color: "#CBD5E1" },
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
