import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NavigationService } from '../../core/services/navigation.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen flex bg-slate-950 text-slate-100">
      <!-- Sidebar -->
      <aside class="w-64 border-r border-slate-800 bg-slate-900 flex flex-col justify-between shrink-0">
        <div>
          <!-- Logo & Brand -->
          <div class="h-16 flex items-center px-6 border-b border-slate-800">
            <a routerLink="/" class="flex items-center gap-2 font-bold text-lg text-white">
              <span class="p-1.5 bg-purple-600 rounded-lg text-white text-sm">🎟️</span>
              <span class="tracking-tight">TicketShow Admin</span>
            </a>
          </div>

          <!-- Quick Action -->
          <div class="p-4 pb-2">
            <a routerLink="/admin/events/create"
              class="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition">
              <span>➕</span>
              <span>Tạo Show Diễn Mới</span>
            </a>
          </div>

          <!-- Dynamic RBAC Navigation Menu -->
          <nav class="p-4 space-y-1">
            @if (navService.loading()) {
              <div class="px-3 py-4 text-xs text-slate-500 text-center animate-pulse">
                Đang tải menu phân quyền...
              </div>
            } @else {
              @for (item of navService.menus(); track item.id) {
                <a [routerLink]="item.routePath"
                   routerLinkActive="bg-purple-600/20 text-purple-300 border border-purple-500/30 font-bold"
                   [routerLinkActiveOptions]="{ exact: item.routePath === '/admin' }"
                   class="flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition">
                  <span class="text-sm">{{ item.icon }}</span>
                  <span>{{ item.title }}</span>
                </a>
              }
            }
          </nav>
        </div>

        <!-- User Profile & Logout -->
        <div class="p-4 border-t border-slate-800 bg-slate-900/80">
          <div class="mb-3 px-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <p class="text-[11px] text-slate-400 font-semibold uppercase">Tài khoản quản trị</p>
            </div>
            <p class="text-xs font-bold text-white truncate">{{ authService.currentUser()?.fullName }}</p>
            <p class="text-[11px] text-purple-400 truncate">{{ authService.currentUser()?.email }}</p>
            @if (navService.userRoles().length > 0) {
              <div class="flex flex-wrap gap-1 mt-1.5">
                @for (role of navService.userRoles(); track role) {
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {{ role }}
                  </span>
                }
              </div>
            }
          </div>

          <button (click)="logout()"
            class="w-full text-center px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-300 transition border border-slate-700">
            Đăng xuất
          </button>
        </div>
      </aside>

      <!-- Main Workspace -->
      <div class="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <header class="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8 backdrop-blur sticky top-0 z-30">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Enterprise RBAC Guard Active
            </span>
          </div>
          <div class="flex items-center gap-4">
            <a routerLink="/" class="text-xs font-medium text-slate-400 hover:text-white transition flex items-center gap-1">
              <span>←</span>
              <span>Trang chủ bán vé</span>
            </a>
          </div>
        </header>

        <main class="flex-1 p-8 overflow-y-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly navService = inject(NavigationService);

  ngOnInit(): void {
    this.navService.loadNavigation();
  }

  logout(): void {
    this.authService.logout();
  }
}
