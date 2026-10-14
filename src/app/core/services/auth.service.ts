import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, AuthResult, CurrentUser, UserRole } from '../models/api-response.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  role?: UserRole;
}

const TOKEN_KEY = 'ticket_access_token';
const REFRESH_TOKEN_KEY = 'ticket_refresh_token';
const USER_KEY = 'ticket_current_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly currentUser = signal<CurrentUser | null>(this.loadUserFromStorage());
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly userRole = computed(() => this.currentUser()?.role ?? null);
  readonly isAdmin = computed(() => this.currentUser()?.role === UserRole.Admin);
  readonly isStaff = computed(() => this.currentUser()?.role === UserRole.Staff);

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResult>> {
    return this.api.post<AuthResult, LoginRequest>('auth/login', credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<ApiResponse<AuthResult>> {
    return this.api.post<AuthResult, RegisterRequest>('auth/register', data).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private setSession(authResult: AuthResult): void {
    localStorage.setItem(TOKEN_KEY, authResult.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, authResult.refreshToken);

    const user: CurrentUser = {
      userId: authResult.userId,
      email: authResult.email,
      fullName: authResult.fullName,
      role: authResult.role
    };

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private loadUserFromStorage(): CurrentUser | null {
    try {
      const userJson = localStorage.getItem(USER_KEY);
      if (!userJson) return null;
      const parsed: unknown = JSON.parse(userJson);
      if (parsed && typeof parsed === 'object' && 'userId' in parsed && 'email' in parsed && 'fullName' in parsed && 'role' in parsed) {
        return parsed as CurrentUser;
      }
      return null;
    } catch {
      return null;
    }
  }
}
