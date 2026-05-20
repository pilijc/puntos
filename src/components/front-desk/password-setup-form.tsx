import React from "react";
import { TouchableOpacity, View } from "@/tw";
import { Button } from "@/components/button";
import type { PasswordSetupState } from "@/type/frontdesk/password";
import PasswordInputField from "./password-input-field";
import PasswordRequirements from "./password-requirements";
import { useTranslation } from "react-i18next";
import { TextField } from "../text-field";
import { LucideEye, LucideEyeOff } from "lucide-react-native";

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
  onSubmit,
}: PasswordSetupFormProps) {
  const { t: translate } = useTranslation();
  const updateState = (updates: Partial<PasswordSetupState>) => {
    onStateUpdate(updates);
  };

  return (
    <View className="space-y-4">
      {/* Current Password (for updates only) */}
      {!isInitialSetup && (
        <PasswordInputField
          label={translate("frontdesk.password.currentPassword")}
          value={state.currentPassword}
          onChangeText={(value) =>
            updateState({
              currentPassword: value,
              errors: { ...state.errors, currentPassword: undefined },
            })
          }
          placeholder={translate(
            "frontdesk.password.currentPasswordPlaceholder",
          )}
          showPassword={state.showCurrentPassword}
          onTogglePassword={() =>
            updateState({ showCurrentPassword: !state.showCurrentPassword })
          }
          error={state.errors.currentPassword}
        />
      )}

      {/* New Password */}
      <TextField
        label={translate("frontdesk.password.newPassword")}
        value={state.newPassword}
        onChangeText={(value) =>
          updateState({
            newPassword: value,
            errors: { ...state.errors, newPassword: undefined },
          })
        }
        placeholder={translate("frontdesk.password.newPasswordPlaceholder")}
        secureTextEntry={!state.showNewPassword}
        error={!!state.errors.newPassword}
        rightAccessory={
          <TouchableOpacity
            onPress={() =>
              updateState({ showNewPassword: !state.showNewPassword })
            }
            className="ml-[-32px] p-2"
            activeOpacity={0.7}
          >
            {state.showNewPassword ? (
              <LucideEye color="#9ca3af" size={16} />
            ) : (
              <LucideEyeOff color="#9ca3af" size={16} />
            )}
          </TouchableOpacity>
        }
      />
      {/* <PasswordInputField
        label={translate("frontdesk.password.newPassword")}
        value={state.newPassword}
        onChangeText={(value) =>
          updateState({
            newPassword: value,
            errors: { ...state.errors, newPassword: undefined },
          })
        }
        placeholder={translate("frontdesk.password.newPasswordPlaceholder")}
        showPassword={state.showNewPassword}
        onTogglePassword={() =>
          updateState({ showNewPassword: !state.showNewPassword })
        }
        error={state.errors.newPassword}
      /> */}

      {/* Confirm Password */}
      <View className="pt-2">
        <TextField
          label={translate("frontdesk.password.confirmPassword")}
          value={state.confirmPassword}
          onChangeText={(value) =>
            updateState({
              confirmPassword: value,
              errors: { ...state.errors, confirmPassword: undefined },
            })
          }
          placeholder={translate(
            "frontdesk.password.confirmPasswordPlaceholder",
          )}
          secureTextEntry={!state.showConfirmPassword}
          error={!!state.errors.confirmPassword}
          rightAccessory={
            <TouchableOpacity
              onPress={() =>
                updateState({ showConfirmPassword: !state.showConfirmPassword })
              }
              className="ml-[-32px] p-2"
              activeOpacity={0.7}
            >
              {state.showConfirmPassword ? (
                <LucideEye color="#9ca3af" size={16} />
              ) : (
                <LucideEyeOff color="#9ca3af" size={16} />
              )}
            </TouchableOpacity>
          }
        />
        {/* <PasswordInputField
          label={translate("frontdesk.password.confirmPassword")}
          value={state.confirmPassword}
          onChangeText={(value) =>
            updateState({
              confirmPassword: value,
              errors: { ...state.errors, confirmPassword: undefined },
            })
          }
          placeholder={translate(
            "frontdesk.password.confirmPasswordPlaceholder",
          )}
          showPassword={state.showConfirmPassword}
          onTogglePassword={() =>
            updateState({ showConfirmPassword: !state.showConfirmPassword })
          }
          error={state.errors.confirmPassword}
        /> */}
      </View>
      {/* Password Requirements */}
      <View className="pt-6">
        <PasswordRequirements />
      </View>
      {/* Submit Button */}
      <View className="pt-8">
        <Button
          label={
            isInitialSetup
              ? translate("frontdesk.password.setButton")
              : translate("frontdesk.password.updateButton")
          }
          onPress={onSubmit}
          loading={state.isSubmitting}
          disabled={state.isSubmitting}
          fullWidth
        />
      </View>
    </View>
  );
}
