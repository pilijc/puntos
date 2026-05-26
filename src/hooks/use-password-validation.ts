import { useMemo } from "react";

export const PASSWORD_REGEX = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[@#$%^&+=!]/,
};

export interface PasswordRequirements {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}


export const usePasswordValidation = (password: string) => {
  const requirements = useMemo((): PasswordRequirements => {
    return {
      hasMinLength: password.length >= 8,
      hasUppercase: PASSWORD_REGEX.uppercase.test(password),
      hasLowercase: PASSWORD_REGEX.lowercase.test(password),
      hasNumber: PASSWORD_REGEX.number.test(password),
      hasSpecial: PASSWORD_REGEX.special.test(password),
    };
  }, [password]);

  const allMet = useMemo(() => {
    return Object.values(requirements).every(Boolean);
  }, [requirements]);

  return {
    requirements,
    allMet,
  };
};
