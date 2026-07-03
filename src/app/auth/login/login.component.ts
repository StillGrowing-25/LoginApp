import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  form: FormGroup = this.fb.group({
    email:      ['', [Validators.required, Validators.email]],
    password:   ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  isLoading = signal(false);
  showPassword = signal(false);

  // Helper to check if a field has an error and has been touched
  hasError(field: string, error?: string): boolean {
    const control = this.form.get(field);
    if (!control?.invalid || !control.touched) return false;
    return error ? control.hasError(error) : true;
  }

  togglePassword(): void { this.showPassword.update(v => !v); }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { email, password, rememberMe } = this.form.value;

    const result = await this.auth.login({ email, password, rememberMe });
    this.isLoading.set(false);

    if (result.success) {
      this.toast.success('Welcome back! You are signed in.');
      this.router.navigate(['/dashboard']);
    } else {
      this.toast.error(result.error || 'Login failed.');
    }
  }
}