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