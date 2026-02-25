import { View, Text, TextInput, Pressable, ScrollView, Image } from "@/tw";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StepProps, PasswordStepProps, TermsStepProps, StepperProps, StepHeaderProps } from "@/type/auth";

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
        <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center">
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
              className={`h-2 flex-1 rounded-full ${
                isCompleted || isActive ? 'bg-primary' : 'bg-neutral-200'
              }`}
            />
          );
        })}
      </View>
    );
  }
export function NameStep({ value, onChange, error }: StepProps) {
  return (
    <View className="gap-y-4">
      <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
        Full Name
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="John Doe"
        placeholderTextColor="#404040"
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
    <View>
      <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
        Email Address
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="john@example.com"
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
    <View>
      <View>
        <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
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
            autoFocus
          />
          <Pressable
            onPress={onTogglePassword}
            className="absolute right-4 top-4"
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="#737373"
            />
          </Pressable>
        </View>
      </View>
      
      <View>
        <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
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
          />
          <Pressable
            onPress={onToggleConfirmPassword}
            className="absolute right-4 top-4"
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={22}
              color="#737373"
            />
          </Pressable>
        </View>
      </View>
			
			{(errors.confirmPassword || errors.password) && (
        <Text className="text-red-500 text-sm font-poppins rounded-xl p-4 text-center bg-red-50">
            {errors.confirmPassword || errors.password}
          </Text>
        )}
    </View>
  );
}

export function TermsStep({ accepted, onToggle, error }: TermsStepProps) {
  return (
    <View className="gap-y-4">
      <View className="bg-background rounded-xl p-4 border border-neutral-200 max-h-64">
        <Text className="font-poppins-semibold text-neutral-900 mb-2">
          Terms of Service & Privacy Policy
        </Text>
        <ScrollView showsVerticalScrollIndicator={true}>
          <Text className="font-poppins text-neutral-600 text-sm">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
            {'\n\n'}
            We collect and process your data to provide our services. Your information will be stored securely and used only for the purposes described in our Privacy Policy.
            {'\n\n'}
            You can delete your account at any time from the settings menu.
          </Text>
        </ScrollView>
      </View>
      
      <Pressable
        onPress={onToggle}
        className="flex-row items-start gap-x-3 mt-4"
      >
        <View
          className={`w-6 h-6 rounded border-2 items-center justify-center mt-0.5 ${
            accepted ? 'bg-primary border-primary' : 'border-neutral-300'
          }`}
        >
          {accepted && (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
        </View>
        <Text className="flex-1 font-poppins text-neutral-700">
          I agree to the{' '}
          <Text className="font-poppins-semibold text-primary">
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text className="font-poppins-semibold text-primary">
            Privacy Policy
          </Text>
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