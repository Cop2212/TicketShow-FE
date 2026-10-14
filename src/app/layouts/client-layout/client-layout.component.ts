import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <!-- Navbar -->
      <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-8">
            <a routerLink="/" class="flex items-center gap-2 text-xl font-bold tracking-tight text-white hover:text-purple-400 transition">
              <span class="p-2 bg-purple-600 rounded-lg text-white">🎟️</span>
              <span>TicketShow</span>
            </a>
            <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <a routerLink="/" class="hover:text-white transition">Trang chủ</a>
              <a routerLink="/events" class="hover:text-white transition">Chọn vé & Sơ đồ</a>
              <a routerLink="/my-tickets" class="hover:text-white transition">Vé của tôi</a>
              <a routerLink="/scanner" class="text-amber-400 hover:text-amber-300 transition flex items-center gap-1 font-semibold">📷 Cổng Soát vé</a>
              @if (authService.isAdmin() || authService.isStaff()) {
                <a routerLink="/admin" class="text-purple-400 hover:text-purple-300 transition">Quản trị</a>
              }
            </nav>
          </div>

          <div class="flex items-center gap-4">
            @if (authService.isAuthenticated()) {
              <div class="flex items-center gap-3">
                <span class="text-xs text-slate-400">Xin chào,</span>
                <span class="text-sm font-medium text-purple-300">{{ authService.currentUser()?.fullName }}</span>
                <button (click)="logout()" class="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700">
                  Đăng xuất
                </button>
              </div>
            } @else {
              <div class="flex items-center gap-3">
                <a routerLink="/auth/login" class="text-sm font-medium text-slate-300 hover:text-white transition px-3 py-1.5">
                  Đăng nhập
                </a>
                <a routerLink="/auth/register" class="text-sm font-medium px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition shadow-md shadow-purple-600/20">
                  Đăng ký
                </a>
              </div>
            }
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1">
        <router-outlet />
      </main>

      <!-- Footer -->
      <footer class="border-t border-slate-800 bg-slate-900 py-6 text-center text-xs text-slate-500">
        <div class="max-w-7xl mx-auto px-4">
          <p>© 2026 TicketShow. Nền tảng quản lý và phân phối vé sự kiện trực tuyến.</p>
        </div>
      </footer>
    </div>
  `
})
export class ClientLayoutComponent {
  readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
