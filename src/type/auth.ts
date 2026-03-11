export interface AuthState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  sessionToken?: string | null;

  setName: (v: string) => void;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setConfirmPassword: (v: string) => void;
  setShowPassword: (v: boolean) => void;
  setShowConfirmPassword: (v: boolean) => void;
  setSessionToken: (t: string | null) => void;
  reset: () => void;
};

export interface GoogleAuth {
  session: any
  user: any
  loading: boolean
  init: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export interface StepProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export interface PasswordStepProps {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  errors: {
    password?: string;
    confirmPassword?: string;
  };
}

export interface TermsStepProps {
  accepted: boolean;
  onToggle: () => void;
  error?: string;
}

export interface RoleStepProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export interface StepperProps {
  currentStep: number;
  totalSteps: number;
}

export interface StepHeaderProps {
  currentStep: number;
}

export interface SlideProps {
  title: string;
  subtitle: string;
  width: number;
  image: any;
}