import { Injectable, signal, computed } from '@angular/core';
import { User, LoginCredentials, SignupData } from '../models/user.model';

// Simulated database of users
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: '1',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@example.com',
    password: 'Demo@1234',
    createdAt: new Date('2024-01-01'),
  }
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signals — Angular's modern reactive state (like useState in React)
  private _currentUser = signal<User | null>(null);
  private _registeredUsers = signal<(User & { password: string })[]>([...MOCK_USERS]);

  // Computed — derives a boolean from the user signal
  isLoggedIn = computed(() => this._currentUser() !== null);
  currentUser = computed(() => this._currentUser());

  constructor() {
    // Restore session from localStorage (remember me)
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try { this._currentUser.set(JSON.parse(saved)); } catch {}
    }
  }

  login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        const users = this._registeredUsers();
        const user = users.find(
          u => u.email.toLowerCase() === credentials.email.toLowerCase()
            && u.password === credentials.password
        );

        if (!user) {
          resolve({ success: false, error: 'Invalid email or password.' });
          return;
        }

        const { password, ...safeUser } = user;
        this._currentUser.set(safeUser);

        if (credentials.rememberMe) {
          localStorage.setItem('auth_user', JSON.stringify(safeUser));
        }

        resolve({ success: true });
      }, 1000);
    });
  }

  signup(data: SignupData): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = this._registeredUsers();
        const exists = users.some(u => u.email.toLowerCase() === data.email.toLowerCase());

        if (exists) {
          resolve({ success: false, error: 'An account with this email already exists.' });
          return;
        }

        const newUser: User & { password: string } = {
          id: Date.now().toString(),
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          createdAt: new Date(),
        };

        this._registeredUsers.update(users => [...users, newUser]);

        const { password, ...safeUser } = newUser;
        this._currentUser.set(safeUser);

        resolve({ success: true });
      }, 1200);
    });
  }

  // Simulates sending a reset code
  requestPasswordReset(email: string): Promise<{ success: boolean; error?: string; code?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = this._registeredUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
          resolve({ success: false, error: 'No account found with this email.' });
          return;
        }

        // In a real app this would be emailed — here we return it for demo purposes
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        resolve({ success: true, code });
      }, 1000);
    });
  }

  resetPassword(email: string, newPassword: string): Promise<{ success: boolean }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this._registeredUsers.update(users =>
          users.map(u => u.email.toLowerCase() === email.toLowerCase()
            ? { ...u, password: newPassword } : u)
        );
        resolve({ success: true });
      }, 800);
    });
  }

  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem('auth_user');
  }

  getPasswordStrength(password: string): { score: number; label: string; color: string } {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: '#dc3545' };
    if (score <= 4) return { score, label: 'Fair', color: '#fd7e14' };
    if (score === 5) return { score, label: 'Good', color: '#0d6efd' };
    return { score, label: 'Strong', color: '#198754' };
  }
}