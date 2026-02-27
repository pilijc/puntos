
export interface Auth {
  name: string;
	setName: (name: string) => void;
  email: string;
	setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
	showPassword: boolean;
	setShowPassword: (showPassword: boolean) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (showConfirmPassword: boolean) => void;
  reset: () => void;
}

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