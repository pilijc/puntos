import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Image,
} from "@/tw";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth-store";
import { Stepper, StepHeader, NameStep, EmailStep, PasswordStep, TermsStep } from "@/components/stepper";

// ---------------------------------------------------------------------------
// Step metadata — mirrors the shape consumed by StepHeader but with
// store-owner-specific copy so the experience feels distinct.
// ---------------------------------------------------------------------------
const STORE_OWNER_STEPS = [
    {
        title: "What's your name?",
        description: "Tell us who's registering as a store owner/manager",
    },
    {
        title: "Your business email",
        description: "Use the email linked to your business",
    },
    {
        title: "Secure your account",
        description: "Must be at least 8 characters",
    },
    {
        title: "Almost there!",
        description: "Review and accept our terms to continue",
    },
];

const TOTAL_STEPS = STORE_OWNER_STEPS.length;

// ---------------------------------------------------------------------------
// Validation helpers — kept in this file to avoid polluting shared stepper
// ---------------------------------------------------------------------------
type Errors = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    terms: string;
};

const INITIAL_ERRORS: Errors = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: "",
};

function validateStep(
    step: number,
    fields: { name: string; email: string; password: string; confirmPassword: string; acceptedTerms: boolean },
    errors: Errors
): { valid: boolean; errors: Errors } {
    const next = { ...errors };

    if (step === 1) {
        next.name = fields.name.trim() ? "" : "Name is required";
        return { valid: !next.name, errors: next };
    }

    if (step === 2) {
        if (!fields.email.trim()) {
            next.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
            next.email = "Please enter a valid email";
        } else {
            next.email = "";
        }
        return { valid: !next.email, errors: next };
    }

    if (step === 3) {
        next.password = !fields.password
            ? "Password is required"
            : fields.password.length < 8
                ? "Password must be at least 8 characters"
                : "";
        next.confirmPassword =
            fields.password !== fields.confirmPassword ? "Passwords do not match" : "";
        return { valid: !next.password && !next.confirmPassword, errors: next };
    }

    if (step === 4) {
        next.terms = fields.acceptedTerms ? "" : "You must accept the terms";
        return { valid: !next.terms, errors: next };
    }

    return { valid: true, errors: next };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function StoreOwnerSignUp() {
    const [currentStep, setCurrentStep] = useState(1);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [errors, setErrors] = useState<Errors>(INITIAL_ERRORS);

    const {
        name, setName,
        email, setEmail,
        password, setPassword,
        confirmPassword, setConfirmPassword,
        showPassword, setShowPassword,
        showConfirmPassword, setShowConfirmPassword,
        reset,
    } = useAuthStore();

    // ── Navigation ────────────────────────────────────────────────────
    const goBack = () => {
        if (currentStep > 1) {
            setCurrentStep((s) => s - 1);
        } else {
            router.replace("/login");
        }
    };

    const goNext = () => {
        const { valid, errors: nextErrors } = validateStep(
            currentStep,
            { name, email, password, confirmPassword, acceptedTerms },
            errors
        );
        setErrors(nextErrors);

        if (!valid) return;

        if (currentStep < TOTAL_STEPS) {
            setCurrentStep((s) => s + 1);
        } else {
            handleRegister();
        }
    };

    // ── Submission (placeholder — backend wired later) ────────────────
    const handleRegister = async () => {
        try {
            // TODO: call store-owner-specific signUpService with role = 'store_manager'
            Alert.alert(
                "Registration Submitted",
                "Your store owner account is pending approval. We'll notify you via email.",
                [{ text: "Back to Login", onPress: () => router.replace("/login") }]
            );
        } catch (error: any) {
            Alert.alert("Registration Failed", error?.message ?? "Something went wrong");
        } finally {
            reset();
            setAcceptedTerms(false);
            setCurrentStep(1);
        }
    };

    // ── The StepHeader uses its own internal STEP_DATA array, so we
    //    render our own compact header from STORE_OWNER_STEPS instead.
    const stepMeta = STORE_OWNER_STEPS[currentStep - 1];

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                {/* ── Top bar ─────────────────────────────────────────────── */}
                <View className="px-6 py-4 flex-row items-center">
                    <TouchableOpacity onPress={goBack}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text className="flex-1 text-center font-poppins-semibold text-lg">
                        Store Owner Registration
                    </Text>
                    <View className="w-6" />
                </View>

                {/* ── Progress bar ─────────────────────────────────────────── */}
                <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} />

                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="p-6 flex-1 justify-between">
                        <View className="flex-1 justify-center">

                            {/* Step icon + copy */}
                            <View className="gap-y-4 mb-6">
                                <View className="items-center justify-center">
                                    <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center">
                                        <Image
                                            source={require("../../assets/images/puntos-icon.png")}
                                            className="w-16 h-16"
                                        />
                                    </View>
                                </View>
                                <View className="gap-y-1">
                                    <Text className="text-2xl font-poppins-bold text-neutral-900 text-center">
                                        {stepMeta.title}
                                    </Text>
                                    <Text className="text-neutral-600 font-poppins text-center">
                                        {stepMeta.description}
                                    </Text>
                                </View>
                            </View>

                            {/* ── Step content ──────────────────────────────────── */}
                            {currentStep === 1 && (
                                <NameStep value={name} onChange={setName} error={errors.name} />
                            )}
                            {currentStep === 2 && (
                                <EmailStep value={email} onChange={setEmail} error={errors.email} />
                            )}
                            {currentStep === 3 && (
                                <PasswordStep
                                    password={password}
                                    confirmPassword={confirmPassword}
                                    showPassword={showPassword}
                                    showConfirmPassword={showConfirmPassword}
                                    onPasswordChange={setPassword}
                                    onConfirmPasswordChange={setConfirmPassword}
                                    onTogglePassword={() => setShowPassword(!showPassword)}
                                    onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                                    errors={errors}
                                />
                            )}
                            {currentStep === 4 && (
                                <TermsStep
                                    accepted={acceptedTerms}
                                    onToggle={() => setAcceptedTerms((v) => !v)}
                                    error={errors.terms}
                                />
                            )}
                        </View>

                        {/* ── Bottom actions ───────────────────────────────────── */}
                        <View className="gap-y-4 mt-6">
                            <TouchableOpacity
                                onPress={goNext}
                                className="bg-primary py-4 rounded-xl items-center"
                            >
                                <Text className="text-white text-base font-poppins-semibold">
                                    {currentStep === TOTAL_STEPS ? "Create Store Account" : "Continue"}
                                </Text>
                            </TouchableOpacity>

                            <View className="flex-row justify-center">
                                <Text className="font-poppins text-neutral-600">
                                    Already have an account?{" "}
                                </Text>
                                <TouchableOpacity onPress={() => router.replace("/login")}>
                                    <Text className="font-poppins-semibold text-primary">Login</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
