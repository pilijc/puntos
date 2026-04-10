import { View, Text, TextInput, Pressable, ScrollView, Image, TouchableOpacity } from "@/tw";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { StepProps, PasswordStepProps, TermsStepProps, StepperProps, StepHeaderProps, RoleStepProps } from "@/type/auth";
import { useTranslation } from "react-i18next";
import { TextField } from "./text-field";
import { User, Store, Eye, LucideEye, LucideEyeOff } from "lucide-react-native";

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
    titleKey: "onboarding.signup.stepper.step4.title",
    descriptionKey: "onboarding.signup.stepper.step4.description"
  }
];

export function StepHeader({ currentStep }: StepHeaderProps) {
  const { t: translate } = useTranslation();
  const stepInfo = STEP_DATA[currentStep - 1];

  return (
    <View className="gap-y-4 mb-6">
      <View className="items-center justify-center">
        <View className="w-16 h-16 rounded-full items-center justify-center">
          <Image
            source={require("../assets/images/puntos-icon.png")}
            className="w-16 h-16"
          />
        </View>
      </View>

      <View className="gap-y-1">
        <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary text-center">
          {translate(stepInfo.titleKey)}
        </Text>

        <Text className="text-neutral-600 dark:text-darkTextSecondary font-poppins text-center text-sm">
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
        placeholder={translate("onboarding.signup.stepper.placeholder.email")}
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
    <View className="gap-y-4 pr-0.5">
      <View className="gap-y-2">
        <View className="gap-y-2">
          <TextField
            label={translate("onboarding.signup.stepper.label.password")}
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
  const roles = [
    {
      label: translate("onboarding.signup.roleSelect.customerLabel"),
      value: "user",
      description: translate("onboarding.signup.roleSelect.customerDescription"),
      Icon: User,
    },
    {
      label: translate("onboarding.signup.roleSelect.ownerLabel"),
      value: "manager",
      description: translate("onboarding.signup.roleSelect.ownerDescription"),
      Icon: Store,
    },
  ];

  return (
    <View className="gap-y-3 pr-0.5">
      <Text className="text-sm font-poppins-medium text-neutral-700 dark:text-darkTextSecondary text-center">
        {translate("onboarding.signup.roleSelect.title")}
      </Text>
      {roles.map((role) => {
        const isSelected = value === role.value;

        return (
          <Pressable
            key={role.value}
            onPress={() => onChange(role.value)}
            className={`px-4 py-6 rounded-2xl ${
              isSelected ? "bg-primary/10 border border-slate-50 dark:border-slate-700" : "bg-white dark:bg-darkBackgroundMuted border border-slate-100 dark:border-darkBorder"
            }`}
          >
            <View className="flex-row items-center gap-x-4">
              <role.Icon size={20} color={isSelected ? "#FF6600" : "#9CA3AF"} />

              <View className="flex-1">
                <Text className="font-poppins-semibold text-neutral-900 dark:text-darkTextPrimary text-sm">
                  {role.label}
                </Text>
                <Text className="font-poppins text-neutral-600 dark:text-darkTextSecondary text-xs mt-1">
                  {role.description}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
      {error && (
        <Text className="text-red-500 dark:text-red-400 text-sm font-poppins rounded-xl p-4 text-center bg-red-50 dark:bg-red-900/20">
          {error}
        </Text>
      )}
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
            <Ionicons name="checkmark" size={12} color="white" />
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