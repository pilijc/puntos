export interface Auth {
  username: string;
	setUsername: (username: string) => void;
  email: string;
	setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
	showPassword: boolean;
	setShowPassword: (showPassword: boolean) => void;
  // sessionChecked: boolean;
  // setSessionChecked: (sessionChecked: boolean) => void;
  reset: () => void;
}
