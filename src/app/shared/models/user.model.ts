export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}