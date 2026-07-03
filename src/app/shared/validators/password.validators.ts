import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Cross-field validator: ensures two fields match
export function passwordMatchValidator(passwordField: string, confirmField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pass = group.get(passwordField)?.value;
    const confirm = group.get(confirmField)?.value;
    if (pass && confirm && pass !== confirm) {
      group.get(confirmField)?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  };
}

// Strong password validator
export function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return { weakPassword: true };
  }
  return null;
}

// Protects routes that require login
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

// Redirects already-logged-in users away from auth pages
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return true;
  }
  router.navigate(['/dashboard']);
  return false;
};