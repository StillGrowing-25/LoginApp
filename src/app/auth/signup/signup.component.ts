import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { passwordMatchValidator, strongPasswordValidator } from '../../shared/validators/password.validators';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  form: FormGroup = this.fb.group({
    firstName:       ['', [Validators.required, Validators.minLength(2)]],
    lastName:        ['', [Validators.required, Validators.minLength(2)]],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(8), strongPasswordValidator]],
    confirmPassword: ['', Validators.required],
    agreeToTerms:    [false, Validators.requiredTrue]
  }, { validators: passwordMatchValidator('password', 'confirmPassword') });

  isLoading = signal(false);
  showPassword = signal(false);
  showConfirm = signal(false);

  hasError(field: string, error?: string): boolean {
    const control = this.form.get(field);
    if (!control?.invalid || !control.touched) return false;
    return error ? control.hasError(error) : true;
  }

  get passwordStrength() {
    return this.auth.getPasswordStrength(this.form.get('password')?.value || '');
  }

  get strengthBars(): boolean[] {
    const s = this.passwordStrength.score;
    return [s >= 1, s >= 2, s >= 3, s >= 4, s >= 5, s >= 6];
  }

  togglePassword() { this.showPassword.update(v => !v); }
  toggleConfirm()  { this.showConfirm.update(v => !v); }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { confirmPassword, agreeToTerms, ...data } = this.form.value;
    const result = await this.auth.signup(data);
    this.isLoading.set(false);

    if (result.success) {
      this.toast.success('Account created! Welcome aboard 🎉');
      this.router.navigate(['/dashboard']);
    } else {
      this.toast.error(result.error || 'Sign up failed.');
    }
  }
}