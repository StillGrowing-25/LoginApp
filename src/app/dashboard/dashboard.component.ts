import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../shared/services/auth.service';
import { ToastService } from '../shared/services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  user = this.auth.currentUser;
  activeTab = signal<'overview' | 'security' | 'profile'>('overview');

  get initials(): string {
    const u = this.user();
    if (!u) return '?';
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  }

  get memberSince(): string {
    const u = this.user();
    if (!u) return '';
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(u.createdAt));
  }

  logout(): void {
    this.auth.logout();
    this.toast.info('You have been signed out.');
    this.router.navigate(['/login']);
  }
}