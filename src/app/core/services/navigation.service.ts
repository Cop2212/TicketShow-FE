import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export interface UserNavMenuItem {
  id: string;
  title: string;
  routePath: string;
  icon: string;
  sortOrder: number;
  permissionCode?: string;
}

export interface UserNavigationResponse {
  fullName: string;
  email: string;
  roles: string[];
  permissions: string[];
  menus: UserNavMenuItem[];
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private readonly api = inject(ApiService);

  readonly menus = signal<UserNavMenuItem[]>([]);
  readonly permissions = signal<string[]>([]);
  readonly userRoles = signal<string[]>([]);
  readonly loading = signal(false);

  loadNavigation(): void {
    this.loading.set(true);
    this.api.get<UserNavigationResponse>('admin/navigation').subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.menus.set(res.data.menus);
          this.permissions.set(res.data.permissions);
          this.userRoles.set(res.data.roles);
        }
      },
      error: () => {
        this.loading.set(false);
        // Fallback default admin menus if backend is unreachable
        this.menus.set([
          { id: '1', title: 'Tổng quan', routePath: '/admin', icon: '📊', sortOrder: 1 },
          { id: '2', title: 'Quản lý Show diễn', routePath: '/admin/events', icon: '🎪', sortOrder: 2 },
          { id: '3', title: 'Tạo Show mới', routePath: '/admin/events/create', icon: '➕', sortOrder: 3 },
          { id: '4', title: 'Cổng soát vé QR', routePath: '/admin/scanner', icon: '📷', sortOrder: 4 },
          { id: '5', title: 'Quản lý Tài khoản', routePath: '/admin/users', icon: '👥', sortOrder: 5 },
          { id: '6', title: 'Vai trò & Phân quyền', routePath: '/admin/roles', icon: '🛡️', sortOrder: 6 },
          { id: '7', title: 'Cấu hình Menu', routePath: '/admin/menus', icon: '📑', sortOrder: 7 }
        ]);
      }
    });
  }

  hasPermission(code: string): boolean {
    const roles = this.userRoles();
    if (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')) {
      return true;
    }
    return this.permissions().includes(code);
  }
}
