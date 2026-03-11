import { View, Text, TextInput, Pressable, ScrollView, Image } from "@/tw";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { StepProps, PasswordStepProps, TermsStepProps, StepperProps, StepHeaderProps, RoleStepProps } from "@/type/auth";

export const STEP_DATA = [
  {
    title: "What's your name?",
    description: "Let's get to know you better"
  },
  {
    title: "What's your email?",
    description: "We'll use this for your account"
  },
  {
    title: "Create a password",
    description: "Must be at least 8 characters"
  },
  {
    title: "Almost there!",
    description: "Please review and accept our terms"
  }
];

export function StepHeader({ currentStep }: StepHeaderProps) {
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
          {stepInfo.title}
        </Text>

        <Text className="text-neutral-600 font-poppins text-center">
          {stepInfo.description}
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
  return (
    <View className="gap-y-2">
      <Text className="text-sm font-poppins-medium text-neutral-700">
        Name
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="John Doe"
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
  return (
    <View className="gap-y-2">
      <Text className="text-sm font-poppins-medium text-neutral-700">
        Email Address
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="email@domain.com"
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
  return (
    <View className="gap-y-2">
      <View className="gap-y-2">
        <View className="gap-y-2">
          <Text className="text-sm font-poppins-medium text-neutral-700">
            Password
          </Text>
          <View className="relative">
            <TextInput
              value={password}
              onChangeText={onPasswordChange}
              placeholder="Enter your password"
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
            Confirm Password
          </Text>
          <View className="relative">
            <TextInput
              value={confirmPassword}
              onChangeText={onConfirmPasswordChange}
              placeholder="Confirm your password"
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
  const roles = [
    { label: "Customer", value: "user", description: "Earn points and redeem rewards" },
    { label: "Store Manager", value: "manager", description: "Manage your store and staff" },
  ];

  return (
    <View className="gap-y-4">
      <Text className="text-sm font-poppins-medium text-neutral-700">
        Select your role
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
  return (
    <View className="gap-y-2">
      <Text className="text-sm font-poppins-medium text-neutral-700">
        Terms and Conditions
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
          I agree to the Terms and Conditions
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