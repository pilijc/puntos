export interface PasswordSetupState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  isSubmitting: boolean;
  errors: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
}

export interface PasswordSetupResponse {
  success: boolean;
  message?: string;
  requiresPasswordSetup?: boolean;
}
