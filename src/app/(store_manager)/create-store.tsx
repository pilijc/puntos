import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    StyleSheet,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Stepper } from "@/components/stepper";

// ── Constants ──────────────────────────────────────────────────────────────
const TOTAL_STEPS = 4;

const STORE_TYPES = [
    "Café",
    "Restaurant",
    "Retail",
    "Salon & Beauty",
    "Bakery",
    "Pharmacy",
    "Grocery",
    "Clothing",
    "Electronics",
    "Other",
];

// ── Step 1: Store Basics ──────────────────────────────────────────────────
function StoreBasicsStep({
    storeName,
    onStoreName,
    storeType,
    onStoreType,
    logoUri,
    onPickLogo,
    errors,
}: {
    storeName: string;
    onStoreName: (v: string) => void;
    storeType: string;
    onStoreType: (v: string) => void;
    logoUri: string | null;
    onPickLogo: () => void;
    errors: { storeName?: string; storeType?: string };
}) {
    return (
        <View style={{ gap: 24 }}>
            {/* Logo picker */}
            <View style={{ alignItems: "center" }}>
                <TouchableOpacity onPress={onPickLogo} style={styles.logoPicker}>
                    {logoUri ? (
                        <View style={styles.logoPlaceholder}>
                            <MaterialIcons name="store" size={36} color="#FF6600" />
                        </View>
                    ) : (
                        <View style={styles.logoPlaceholder}>
                            <MaterialIcons name="add-a-photo" size={28} color="#94A3B8" />
                            <Text style={styles.logoHint}>Add Logo</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <Text style={styles.logoSubtext}>Store logo (optional)</Text>
            </View>

            {/* Store name */}
            <View>
                <Text style={styles.label}>Store Name <Text style={{ color: "#EF4444" }}>*</Text></Text>
                <TextInput
                    value={storeName}
                    onChangeText={onStoreName}
                    placeholder="e.g. The Coffee Foundry"
                    placeholderTextColor="#94A3B8"
                    style={[styles.input, errors.storeName ? styles.inputError : null]}
                    autoFocus
                />
                {errors.storeName ? <Text style={styles.errorText}>{errors.storeName}</Text> : null}
            </View>

            {/* Store type */}
            <View>
                <Text style={styles.label}>Store Type <Text style={{ color: "#EF4444" }}>*</Text></Text>
                <View style={styles.pillGrid}>
                    {STORE_TYPES.map((type) => {
                        const active = storeType === type;
                        return (
                            <TouchableOpacity
                                key={type}
                                onPress={() => onStoreType(type)}
                                style={[styles.pill, active && styles.pillActive]}
                            >
                                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                {errors.storeType ? <Text style={styles.errorText}>{errors.storeType}</Text> : null}
            </View>
        </View>
    );
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function CreateStore() {
    const insets = useSafeAreaInsets();
    const [currentStep, setCurrentStep] = useState(1);

    // ── Step 1 state
    const [storeName, setStoreName] = useState("");
    const [storeType, setStoreType] = useState("");
    const [logoUri, setLogoUri] = useState<string | null>(null);
    const [step1Errors, setStep1Errors] = useState<{ storeName?: string; storeType?: string }>({});

    const handlePickLogo = () => {
        // TODO: integrate expo-image-picker when available
        Alert.alert("Logo Upload", "Image picker will be available once expo-image-picker is installed.");
    };

    const validateStep1 = () => {
        const errs: { storeName?: string; storeType?: string } = {};
        if (!storeName.trim()) errs.storeName = "Store name is required";
        if (!storeType) errs.storeType = "Please select a store type";
        setStep1Errors(errs);
        return Object.keys(errs).length === 0;
    };

    const goNext = () => {
        if (currentStep === 1 && !validateStep1()) return;
        if (currentStep < TOTAL_STEPS) setCurrentStep((s) => s + 1);
    };

    const goBack = () => {
        if (currentStep > 1) {
            setCurrentStep((s) => s - 1);
        } else {
            router.back();
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
            {/* ── Header ───────────────────────────────────────────────────── */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={22} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Store</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* ── Stepper ──────────────────────────────────────────────────── */}
            <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} />

            {/* ── Step label ───────────────────────────────────────────────── */}
            <View style={styles.stepLabel}>
                <Text style={styles.stepTitle}>
                    {currentStep === 1 && "Store Basics"}
                    {currentStep === 2 && "Location"}
                    {currentStep === 3 && "Business Verification"}
                    {currentStep === 4 && "Review & Submit"}
                </Text>
                <Text style={styles.stepDesc}>
                    {currentStep === 1 && "Tell us about your store"}
                    {currentStep === 2 && "Where is your store located?"}
                    {currentStep === 3 && "Provide your business registration"}
                    {currentStep === 4 && "Review your details before submitting"}
                </Text>
            </View>

            {/* ── Step content ─────────────────────────────────────────────── */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {currentStep === 1 && (
                    <StoreBasicsStep
                        storeName={storeName}
                        onStoreName={setStoreName}
                        storeType={storeType}
                        onStoreType={setStoreType}
                        logoUri={logoUri}
                        onPickLogo={handlePickLogo}
                        errors={step1Errors}
                    />
                )}

                {/* Steps 2–4 will be added in subsequent builds */}
                {currentStep > 1 && (
                    <View style={{ alignItems: "center", paddingTop: 40 }}>
                        <MaterialIcons name="build-circle" size={48} color="#CBD5E1" />
                        <Text style={{ fontFamily: "Poppins-Medium", color: "#94A3B8", marginTop: 12 }}>
                            Step {currentStep} coming soon
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* ── Bottom CTA ───────────────────────────────────────────────── */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity onPress={goNext} style={styles.nextBtn}>
                    <Text style={styles.nextBtnText}>
                        {currentStep === TOTAL_STEPS ? "Submit for Review" : "Continue"}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: "Poppins-Bold",
        color: "#0F172A",
    },
    stepLabel: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 4,
    },
    stepTitle: {
        fontSize: 22,
        fontFamily: "Poppins-Bold",
        color: "#0F172A",
    },
    stepDesc: {
        fontSize: 13,
        fontFamily: "Poppins-Regular",
        color: "#94A3B8",
        marginTop: 2,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    logoPicker: {
        marginBottom: 6,
    },
    logoPlaceholder: {
        width: 96,
        height: 96,
        borderRadius: 24,
        backgroundColor: "#F1F5F9",
        borderWidth: 2,
        borderColor: "#E2E8F0",
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    logoHint: {
        fontSize: 11,
        fontFamily: "Poppins-Medium",
        color: "#94A3B8",
    },
    logoSubtext: {
        fontSize: 11,
        fontFamily: "Poppins-Regular",
        color: "#CBD5E1",
    },
    label: {
        fontSize: 13,
        fontFamily: "Poppins-Medium",
        color: "#475569",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        fontFamily: "Poppins-Regular",
        color: "#0F172A",
    },
    inputError: {
        borderColor: "#EF4444",
    },
    errorText: {
        fontSize: 12,
        fontFamily: "Poppins-Regular",
        color: "#EF4444",
        marginTop: 6,
        backgroundColor: "#FEF2F2",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        textAlign: "center",
    },
    pillGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    pill: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 9999,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    pillActive: {
        backgroundColor: "#FF6600",
        borderColor: "#FF6600",
    },
    pillText: {
        fontSize: 13,
        fontFamily: "Poppins-Medium",
        color: "#64748B",
    },
    pillTextActive: {
        color: "#FFFFFF",
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    nextBtn: {
        backgroundColor: "#FF6600",
        borderRadius: 14,
        paddingVertical: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    nextBtnText: {
        fontSize: 15,
        fontFamily: "Poppins-Bold",
        color: "#FFFFFF",
    },
});
