import { View, Text, TextInput, Pressable, ScrollView, Image, TouchableOpacity } from "@/tw";
import React from "react";
import { StepProps, PasswordStepProps, TermsStepProps, StepperProps, StepHeaderProps, RoleStepProps } from "@/type/auth";
import { useTranslation } from "react-i18next";
import { TextField } from "./text-field";
import { CheckIcon, LucideEye, LucideEyeOff } from "lucide-react-native";
import { Platform } from "react-native";

const ROLE_LOTTIE_SOURCES = {
  user: require("../assets/images/role-user.png"),
  manager: require("../assets/images/role-store.png"),
} as const;

export const STEP_DATA = [
  {
    titleKey: "onboarding.signup.stepper.step1.title",
    descriptionKey: "onboarding.signup.stepper.step1.description"
  },
  {
    titleKey: "onboarding.signup.stepper.step2.title",
    descriptionKey: "onboarding.signup.stepper.step2.description"
  },
  {
    titleKey: "onboarding.signup.stepper.step3.title",
    descriptionKey: "onboarding.signup.stepper.step3.description"
  },
  {
    titleKey: "label.almostThere",
    descriptionKey: "onboarding.signup.stepper.step4.description"
  }
];

export function StepHeader({ currentStep }: StepHeaderProps) {
  const { t: translate } = useTranslation();
  const stepInfo = STEP_DATA[currentStep - 1];
  const align = Platform.OS === "web" ? "text-left" : "text-center";
  const items = Platform.OS === "web" ? "items-start" : "items-center";

  return (
    <View className="gap-y-4 mb-4">
      <View className={`${items} justify-center`}>
        <View className={`w-16 h-16 rounded-full ${items} justify-center`}>
          <Image
            source={require("../assets/images/puntos-icon.png")}
            className="w-16 h-16"
          />
        </View>
      </View>

      <View>
        <Text className={`text-lg font-poppins-bold text-textSecondary dark:text-darkTextPrimary ${align}`}>
          {translate(stepInfo.titleKey)}
        </Text>

        <Text className={`text-textMuted dark:text-darkTextSecondary font-poppins ${align} text-sm`}>
          {translate(stepInfo.descriptionKey)}
        </Text>
      </View>
    </View>
  );
}

export function Stepper({ currentStep, totalSteps }: StepperProps) {
  return (
    <View className="flex-row justify-start items-start px-6 py-4 gap-x-2">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <View
            key={stepNumber}
            className={`h-2 flex-1 rounded-full ${isCompleted || isActive ? 'bg-primary' : 'bg-neutral-200 dark:bg-neutral-800'
              }`}
          />
        );
      })}
    </View>
  );
}

export function NameStep({ value, onChange, error }: StepProps) {
  const { t: translate } = useTranslation();
  return (
    <View className="gap-y-4 pr-0.5">
      <TextField
        label={translate("onboarding.signup.stepper.label.name")}
        value={value}
        onChangeText={onChange}
        placeholder={translate("onboarding.signup.stepper.placeholder.name")}
        keyboardType="default"
      />
      {error && (
        <Text className="text-red-500 dark:text-red-400 text-sm font-poppins rounded-xl p-4 text-center bg-red-50 dark:bg-red-900/20">
          {error}
        </Text>
      )}
    </View>
  );
}

export function EmailStep({ value, onChange, error }: StepProps) {
  const { t: translate } = useTranslation();
  return (
    <View className="gap-y-4 pr-0.5">
      <TextField
        label={translate("onboarding.signup.stepper.label.email")}
        value={value}
        onChangeText={onChange}
        placeholder={translate("label.emailPlaceholder")}
        keyboardType="email-address"
      />
      {error && (
        <Text className="text-red-500 dark:text-red-400 text-sm font-poppins rounded-xl p-4 text-center bg-red-50 dark:bg-red-900/20">
          {error}
        </Text>
      )}
    </View>
  );
}

export function PasswordStep({
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  setShowPassword,
  setShowConfirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onToggleConfirmPassword,
  errors,
}: PasswordStepProps) {
  const { t: translate } = useTranslation();
  return (
    <View className=" pr-0.5">
      <View className="gap-y-2">
        <View className="gap-y-2">
          <TextField
            label={translate("label.password")}
            value={password}
            onChangeText={onPasswordChange}
            placeholder={translate("onboarding.signup.stepper.placeholder.password")}
            secureTextEntry={!showPassword}
            rightAccessory={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="ml-[-32px] p-2"
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <LucideEye color="#9ca3af" size={16} />
                ) : (
                  <LucideEyeOff color="#9ca3af" size={16} />
                )}
              </TouchableOpacity>
            }
          />
        </View>

        <View className="mt-1 mb-2 gap-y-2">
          <TextField
            label={translate("onboarding.signup.stepper.label.confirmPassword")}
            value={confirmPassword}
            onChangeText={onConfirmPasswordChange}
            placeholder={translate("onboarding.signup.stepper.placeholder.confirmPassword")}
            secureTextEntry={!showConfirmPassword}
  
            rightAccessory={
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="ml-[-32px] p-2"
                activeOpacity={0.7}
              >
                {showConfirmPassword ? (
                  <LucideEye color="#9ca3af" size={16} />
                ) : (
                  <LucideEyeOff color="#9ca3af" size={16} />
                )}
              </TouchableOpacity>
            }
          />
        </View>
      </View>
      <View className="justify-center">
        {(errors.confirmPassword || errors.password) && (
          <Text className="text-red-500 dark:text-red-400 text-sm font-poppins rounded-xl p-4 text-center bg-red-50 dark:bg-red-900/20">
            {errors.confirmPassword || errors.password}
          </Text>
        )}
      </View>
    </View>
  );
}

export function RoleStep({ value, onChange, error }: RoleStepProps) {
  const { t: translate } = useTranslation();
  const roles = Platform.OS === "web"
    ? [
        {
          label: translate("onboarding.signup.roleSelect.ownerLabel"),
          value: "manager" as const,
          description: translate("onboarding.signup.roleSelect.ownerDescription"),
        },
      ]
    : [
        {
          label: translate("onboarding.signup.roleSelect.customerLabel"),
          value: "user" as const,
          description: translate("onboarding.signup.roleSelect.customerDescription"),
        },
        {
          label: translate("onboarding.signup.roleSelect.ownerLabel"),
          value: "manager" as const,
          description: translate("onboarding.signup.roleSelect.ownerDescription"),
        },
      ];

  return (
    <View className="gap-y-5 pr-0.5">
      <View>
        <Text className="text-base font-poppins-semibold text-textSecondary dark:text-darkTextPrimary text-start">
          {translate("onboarding.signup.roleSelect.title")}
        </Text>
        <Text className="text-xs font-poppins text-textMuted dark:text-darkTextSecondary/90 text-start leading-relaxed">
          {translate("onboarding.signup.roleSelect.subtitle")}
        </Text>
      </View>

      <View className="flex-row gap-3">
        {roles.map((role) => {
          const isSelected = value === role.value;

          return (
            <Pressable
              key={role.value}
              onPress={() => onChange(role.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${role.label}. ${role.description}`}
              android_ripple={{ color: "rgba(255, 102, 0, 0.12)" }}
              className="flex-1 min-w-0 rounded-2xl"
            >
              <View
                className={`flex-1 min-h-[168px] rounded-2xl px-3 pt-4 pb-3.5 ${
                  isSelected
                    ? "bg-white dark:bg-primary/15 border border-primary"
                    : "bg-white dark:bg-darkBackgroundCard border border-neutral-200/90 dark:border-darkBorder"
                }`}
              >
                {isSelected ? (
                  <View className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-primary items-center justify-center">
                    <CheckIcon size={14} color="white" />
                  </View>
                ) : null}

                <View className="items-center gap-y-2.5 flex-1 justify-center">
                  <View
                    className={`w-[68px] h-[68px] rounded-2xl items-center justify-center overflow-hidden`}
                  >
                    <View style={{ opacity: isSelected ? 1 : 0.72 }}>
                      <Image
                        source={ROLE_LOTTIE_SOURCES[role.value]}
                        style={{ width: 54, height: 54 }}
                      />
                    </View>
                  </View>

                  <View className="gap-y-1 px-0.5">
                    <Text
                      className={`font-poppins-semibold text-sm text-center leading-tight ${
                        isSelected
                          ? "text-neutral-900 dark:text-darkTextPrimary"
                          : "text-neutral-800 dark:text-darkTextPrimary"
                      }`}
                      numberOfLines={2}
                    >
                      {role.label}
                    </Text>
                    <Text
                      className="font-poppins text-[11px] leading-[15px] text-center text-neutral-500 dark:text-darkTextSecondary"
                      numberOfLines={4}
                    >
                      {role.description}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <View className="rounded-2xl px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40">
          <Text className="text-red-600 dark:text-red-400 text-sm font-poppins text-center leading-snug">
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function TermsStep({ accepted, onToggle, error }: TermsStepProps) {
  const { t: translate } = useTranslation();
  return (
    <View className="gap-y-4 pr-0.5">
      <Text className="text-sm font-poppins-medium text-neutral-700 dark:text-darkTextSecondary">
        {translate("onboarding.signup.stepper.label.terms")}
      </Text>
      <Pressable
        onPress={onToggle}
        className="flex-row items-center gap-x-3 p-4 rounded-xl border border-neutral-200 dark:border-darkBorder bg-neutral-50 dark:bg-darkBackgroundMuted"
      >
        <View
          className={`w-5 h-5 rounded border-2 ${accepted ? 'border-primary bg-primary' : 'border-neutral-300 dark:border-neutral-600'}`}
        >
          {accepted && (
            <CheckIcon size={12} color="white" />
          )}
        </View>
        <Text className="font-poppins text-neutral-700 dark:text-darkTextSecondary flex-1">
          {translate("onboarding.signup.stepper.label.termsAgree")}
        </Text>
      </Pressable>

      {error && (
        <Text className="text-red-500 dark:text-red-400 text-sm font-poppins rounded-xl p-4 text-center bg-red-50 dark:bg-red-900/20">
          {error}
        </Text>
      )}
    </View>
  );
}