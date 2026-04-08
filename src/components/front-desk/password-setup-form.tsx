import React from "react";
import { View } from "@/tw";
import { Button } from "@/components/button";
import type { PasswordSetupState } from "@/type/frontdesk/password";
import PasswordInputField from "./password-input-field";
import PasswordRequirements from "./password-requirements";

interface PasswordSetupFormProps {
  state: PasswordSetupState;
  isInitialSetup: boolean;
  onStateUpdate: (updates: Partial<PasswordSetupState>) => void;
  onSubmit: () => void;
}

export default function PasswordSetupForm({
  state,
  isInitialSetup,
  onStateUpdate,
  onSubmit
}: PasswordSetupFormProps) {
  const updateState = (updates: Partial<PasswordSetupState>) => {
    onStateUpdate(updates);
  };

  return (
    <View className="space-y-4">
      {/* Current Password (for updates only) */}
      {!isInitialSetup && (
        <PasswordInputField
          label="Current Password"
          value={state.currentPassword}
          onChangeText={(value) => updateState({ 
            currentPassword: value, 
            errors: { ...state.errors, currentPassword: undefined } 
          })}
          placeholder="Enter current password"
          showPassword={state.showCurrentPassword}
          onTogglePassword={() => updateState({ showCurrentPassword: !state.showCurrentPassword })}
          error={state.errors.currentPassword}
        />
      )}

      {/* New Password */}
      <PasswordInputField
        label="New Password"
        value={state.newPassword}
        onChangeText={(value) => updateState({ 
          newPassword: value, 
          errors: { ...state.errors, newPassword: undefined } 
        })}
        placeholder="Enter new password"
        showPassword={state.showNewPassword}
        onTogglePassword={() => updateState({ showNewPassword: !state.showNewPassword })}
        error={state.errors.newPassword}
      />

      {/* Confirm Password */}
      <PasswordInputField
        label="Confirm New Password"
        value={state.confirmPassword}
        onChangeText={(value) => updateState({ 
          confirmPassword: value, 
          errors: { ...state.errors, confirmPassword: undefined } 
        })}
        placeholder="Confirm new password"
        showPassword={state.showConfirmPassword}
        onTogglePassword={() => updateState({ showConfirmPassword: !state.showConfirmPassword })}
        error={state.errors.confirmPassword}
      />

      {/* Password Requirements */}
      <PasswordRequirements />

      {/* Submit Button */}
      <View className="mt-8 mb-8">
        <Button
          label={isInitialSetup ? "Set Password" : "Update Password"}
          onPress={onSubmit}
          loading={state.isSubmitting}
          disabled={state.isSubmitting}
          fullWidth
        />
      </View>
    </View>
  );
}
