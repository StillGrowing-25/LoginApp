import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { strongPasswordValidator, passwordMatchValidator } from '../../shared/validators/password.validators';

type Step = 'email' | 'otp' | 'reset' | 'done';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  step = signal<Step>('email');
  isLoading = signal(false);
  showNewPassword = signal(false);
  togglePassword(): void {
  this.showNewPassword.update(v => !v);
}

  // The actual OTP code (in real app this would only exist server-side)
  private _otpCode = '';
  private _email = '';

  // Resend timer
  resendCountdown = signal(0);
  private _timer: ReturnType<typeof setInterval> | null = null;

  // OTP digits (6 individual inputs for better UX)
  otpDigits = signal<string[]>(['', '', '', '', '', '']);

  emailForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  resetForm: FormGroup = this.fb.group({
    newPassword:     ['', [Validators.required, Validators.minLength(8), strongPasswordValidator]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatchValidator('newPassword', 'confirmPassword') });

  hasEmailError(error?: string): boolean {
    const c = this.emailForm.get('email');
    if (!c?.invalid || !c.touched) return false;
    return error ? c.hasError(error) : true;
  }

  hasResetError(field: string, error?: string): boolean {
    const c = this.resetForm.get(field);
    if (!c?.invalid || !c.touched) return false;
    return error ? c.hasError(error) : true;
  }

  get otpValue(): string { return this.otpDigits().join(''); }

  async sendOtp(): Promise<void> {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }
    this.isLoading.set(true);
    const { email } = this.emailForm.value;
    const result = await this.auth.requestPasswordReset(email);
    this.isLoading.set(false);

    if (!result.success) { this.toast.error(result.error!); return; }

    this._email = email;
    this._otpCode = result.code!;
    this.toast.success(`Code sent to ${email} (demo: ${result.code})`);
    this.step.set('otp');
    this.startResendTimer();
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    const digits = [...this.otpDigits()];
    digits[index] = val;
    this.otpDigits.set(digits);

    if (val && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      next?.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits()[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      prev?.focus();
    }
  }

  verifyOtp(): void {
    if (this.otpValue.length < 6) { this.toast.warning('Enter all 6 digits.'); return; }
    if (this.otpValue !== this._otpCode) { this.toast.error('Incorrect code. Try again.'); return; }
    this.toast.success('Code verified!');
    this.step.set('reset');
  }

  async resetPassword(): Promise<void> {
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }
    this.isLoading.set(true);
    await this.auth.resetPassword(this._email, this.resetForm.value.newPassword);
    this.isLoading.set(false);
    this.step.set('done');
  }

  startResendTimer(): void {
    this.resendCountdown.set(60);
    this._timer = setInterval(() => {
      this.resendCountdown.update(v => {
        if (v <= 1 && this._timer) { clearInterval(this._timer); this._timer = null; }
        return Math.max(0, v - 1);
      });
    }, 1000);
  }

  async resendCode(): Promise<void> {
    if (this.resendCountdown() > 0) return;
    const result = await this.auth.requestPasswordReset(this._email);
    if (result.success) {
      this._otpCode = result.code!;
      this.toast.info(`New code sent (demo: ${result.code})`);
      this.startResendTimer();
    }
  }

  ngOnDestroy(): void {
    if (this._timer) clearInterval(this._timer);
  }
}