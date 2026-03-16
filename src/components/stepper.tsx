import { View, Text, TextInput, Pressable, ScrollView, Image } from "@/tw";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { StepProps, PasswordStepProps, TermsStepProps, StepperProps, StepHeaderProps, RoleStepProps } from "@/type/auth";
import { useTranslation } from "react-i18next";

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
        <Text className="text-2xl font-poppins-bold text-neutral-900 text-center">
          {translate(stepInfo.titleKey)}
        </Text>

        <Text className="text-neutral-600 font-poppins text-center">
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
            className={`h-2 flex-1 rounded-full ${isCompleted || isActive ? 'bg-primary' : 'bg-neutral-200'
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
    <View className="gap-y-2">
      <Text className="text-sm font-poppins-medium text-neutral-700">
        {translate("onboarding.signup.stepper.label.name")}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={translate("onboarding.signup.stepper.placeholder.name")}
        placeholderTextColor="#9CA3AF"
        className="border border-neutral-200 rounded-xl px-4 py-4 font-poppins text-neutral-700"
        autoFocus
      />
      {error && (
        <Text className="text-red-500 text-sm font-poppins rounded-xl p-4 text-center bg-red-50">
          {error}
        </Text>
      )}
    </View>
  );
}

export function EmailStep({ value, onChange, error }: StepProps) {
  const { t: translate } = useTranslation();
  return (
    <View className="gap-y-2">
      <Text className="text-sm font-poppins-medium text-neutral-700">
        {translate("onboarding.signup.stepper.label.email")}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={translate("onboarding.signup.stepper.placeholder.email")}
        placeholderTextColor="#9CA3AF"
        keyboardType="email-address"
        autoCapitalize="none"
        className="border border-neutral-200 rounded-xl px-4 py-4 font-poppins"
        autoFocus
      />
      {error && (
        <Text className="text-red-500 text-sm font-poppins rounded-xl p-4 text-center bg-red-50">
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
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onToggleConfirmPassword,
  errors,
}: PasswordStepProps) {
  const { t: translate } = useTranslation();
  return (
    <View className="gap-y-2">
      <View className="gap-y-2">
        <View className="gap-y-2">
          <Text className="text-sm font-poppins-medium text-neutral-700">
            {translate("onboarding.signup.stepper.label.password")}
          </Text>
          <View className="relative">
            <TextInput
              value={password}
              onChangeText={onPasswordChange}
              placeholder={translate("onboarding.signup.stepper.placeholder.password")}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              className="border border-neutral-200 rounded-xl px-4 py-4 pr-12 font-poppins"
              autoFocus={false}
              placeholderTextColor="#9CA3AF"
            />
            <Pressable
              onPress={onTogglePassword}
              className="absolute right-4 top-4"
            >
              <Feather name={showPassword ? "eye" : "eye-off"} size={18} color="gray" />
            </Pressable>
          </View>
        </View>

        <View className="mt-1 mb-2 gap-y-2">
          <Text className="text-sm font-poppins-medium text-neutral-700">
            {translate("onboarding.signup.stepper.label.confirmPassword")}
          </Text>
          <View className="relative">
            <TextInput
              value={confirmPassword}
              onChangeText={onConfirmPasswordChange}
              placeholder={translate("onboarding.signup.stepper.placeholder.confirmPassword")}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              className="border border-neutral-200 rounded-xl px-4 py-4 pr-12 font-poppins"
              placeholderTextColor="#9CA3AF"
            />
            <Pressable
              onPress={onToggleConfirmPassword}
              className="absolute right-4 top-4"
            >
              <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={18} color="gray" />
            </Pressable>
          </View>
        </View>
      </View>
      <View className="justify-center">
        {(errors.confirmPassword || errors.password) && (
          <Text className="text-red-500 text-sm font-poppins rounded-xl p-4 text-center bg-red-50">
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
    { label: translate("onboarding.signup.title"), value: "user", description: translate("onboarding.slide.subtitle1") },
    { label: translate("onboarding.signup.titleManager"), value: "manager", description: translate("onboarding.signup.titleManager") },
  ];

  return (
    <View className="gap-y-4">
      <Text className="text-sm font-poppins-medium text-neutral-700">
        {translate("onboarding.signup.ownerPrompt")}
      </Text>
      {roles.map((role) => (
        <Pressable
          key={role.value}
          onPress={() => onChange(role.value)}
          className={`p-4 rounded-xl border ${value === role.value ? 'border-primary bg-primary/5' : 'border-neutral-200'}`}
        >
          <View className="flex-row items-center gap-x-3">
            <View
              className={`w-4 h-4 rounded-full border-2 ${value === role.value ? 'border-primary bg-primary' : 'border-neutral-300'}`}
            >
              {value === role.value && (
                <View className="w-2 h-2 rounded-full bg-white m-0.5" />
              )}
            </View>
            <View className="flex-1">
              <Text className="font-poppins-semibold text-neutral-900">
                {role.label}
              </Text>
              <Text className="font-poppins text-neutral-600 text-sm">
                {role.description}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
      {error && (
        <Text className="text-red-500 text-sm font-poppins rounded-xl p-4 text-center bg-red-50">
          {error}
        </Text>
      )}
    </View>
  );
}

export function TermsStep({ accepted, onToggle, error }: TermsStepProps) {
  const { t: translate } = useTranslation();
  return (
    <View className="gap-y-2">
      <Text className="text-sm font-poppins-medium text-neutral-700">
        {translate("onboarding.signup.stepper.label.terms")}
      </Text>
      <Pressable
        onPress={onToggle}
        className="flex-row items-center gap-x-3 p-4 rounded-xl border border-neutral-200"
      >
        <View
          className={`w-5 h-5 rounded border-2 ${accepted ? 'border-primary bg-primary' : 'border-neutral-300'}`}
        >
          {accepted && (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
        </View>
        <Text className="font-poppins text-neutral-700 flex-1">
          {translate("onboarding.signup.stepper.label.termsAgree")}
        </Text>
      </Pressable>
      {error && (
        <Text className="text-red-500 text-sm font-poppins rounded-xl p-4 text-center bg-red-50">
          {error}
        </Text>
      )}
    </View>
  );
}