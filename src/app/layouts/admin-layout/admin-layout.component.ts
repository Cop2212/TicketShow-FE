import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  template: `
    <div class="min-h-screen flex bg-slate-950 text-slate-100">
      <!-- Sidebar -->
      <aside class="w-64 border-r border-slate-800 bg-slate-900 flex flex-col justify-between">
        <div>
          <div class="h-16 flex items-center px-6 border-b border-slate-800">
            <a routerLink="/" class="flex items-center gap-2 font-bold text-lg text-white">
              <span class="p-1.5 bg-purple-600 rounded-lg text-white text-sm">🎟️</span>
              <span>TicketShow Admin</span>
            </a>
          </div>
          <div class="p-4 pb-0">
            <a routerLink="/admin/events/create" class="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition">
              <span>+</span> Tạo Show Diễn Mới
            </a>
          </div>

          <nav class="p-4 space-y-1">
            <a routerLink="/admin" class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg bg-slate-800 text-white">
              <span>📊</span> Dashboard
            </a>
            <a routerLink="/admin/events" class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <span>🎪</span> Quản lý Show diễn
            </a>
            <a routerLink="/admin/orders" class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <span>💳</span> Đơn đặt vé
            </a>
            <a routerLink="/admin/scanner" class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <span>📷</span> Cổng soát vé QR
            </a>
          </nav>
        </div>

        <div class="p-4 border-t border-slate-800">
          <div class="mb-3 px-3">
            <p class="text-xs text-slate-400">Đang đăng nhập:</p>
            <p class="text-sm font-semibold text-purple-300 truncate">{{ authService.currentUser()?.fullName }}</p>
          </div>
          <button (click)="logout()" class="w-full text-center px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 transition border border-slate-700">
            Đăng xuất
          </button>
        </div>
      </aside>

      <!-- Main workspace -->
      <div class="flex-1 flex flex-col min-h-screen">
        <header class="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8">
          <h1 class="text-sm font-semibold text-slate-300">Bảng điều khiển Quản trị hệ thống</h1>
          <a routerLink="/" class="text-xs text-purple-400 hover:text-purple-300 transition">← Về trang người dùng</a>
        </header>

        <main class="flex-1 p-8 overflow-y-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
