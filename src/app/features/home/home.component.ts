import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

interface HealthStatus {
  status: string;
  database: string;
  timestamp: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-12 pb-16">
      <!-- Hero Banner -->
      <section class="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-950 border-b border-slate-800">
        <div class="max-w-4xl mx-auto space-y-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <span>🚀 Nền tảng phân phối vé công nghệ cao</span>
          </div>

          <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Trải nghiệm Đặt vé & Soát vé <br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
              Nhanh chóng, Chống giả mạo
            </span>
          </h1>

          <p class="text-lg text-slate-400 max-w-2xl mx-auto">
            Hệ thống quản lý sự kiện và show diễn đa nền tảng. Xử lý giữ chỗ hạn chế tranh chấp (Concurrency Lock), thanh toán trực tuyến và soát vé QR thời gian thực.
          </p>

          <div class="flex flex-wrap justify-center gap-4 pt-4">
            <a routerLink="/auth/register" class="px-6 py-3 rounded-xl font-semibold bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg shadow-purple-600/30">
              Bắt đầu ngay
            </a>
            <a routerLink="/auth/login" class="px-6 py-3 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition">
              Đăng nhập hệ thống
            </a>
          </div>

          <!-- Live API Status Indicator -->
          <div class="pt-8">
            <div class="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span class="flex h-2.5 w-2.5 relative">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  [ngClass]="health()?.database === 'Connected' ? 'bg-emerald-400' : 'bg-amber-400'"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5"
                  [ngClass]="health()?.database === 'Connected' ? 'bg-emerald-500' : 'bg-amber-500'"></span>
              </span>
              <span class="text-slate-400">Trạng thái API:</span>
              <span class="font-medium text-slate-200">{{ health() ? (health()?.database === 'Connected' ? 'Online (PostgreSQL Đã kết nối)' : 'API Sẵn sàng') : 'Đang kiểm tra kết nối...' }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Key Architectural Features -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl font-bold text-center text-white mb-8">Tính năng Cốt lõi của Hệ thống</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div class="text-3xl">🔒</div>
            <h3 class="text-lg font-semibold text-white">Khóa Giữ chỗ Chống Tranh chấp</h3>
            <p class="text-sm text-slate-400">
              Xử lý hàng nghìn người cùng mua vé một lúc với Optimistic Concurrency Lock (PostgreSQL xmin), đảm bảo không bao giờ âm vé.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div class="text-3xl">🎫</div>
            <h3 class="text-lg font-semibold text-white">E-Ticket QR Ký số HMAC</h3>
            <p class="text-sm text-slate-400">
              Mã QR vé được mã hóa và ký số bảo mật, ngăn chặn tối đa việc làm giả mã vé hoặc chụp màn hình tái sử dụng trái phép.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div class="text-3xl">📱</div>
            <h3 class="text-lg font-semibold text-white">Web Scanner Soát vé Tức thì</h3>
            <p class="text-sm text-slate-400">
              Nhân viên kiểm soát vé mở trực tiếp camera trên trình duyệt di động, nhận diện mã QR và phản hồi tức thì trong &lt; 200ms.
            </p>
          </div>
        </div>
      </section>
    </div>
  `
})
export class HomeComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly health = signal<HealthStatus | null>(null);

  ngOnInit(): void {
    this.api.get<HealthStatus>('health').subscribe({
      next: res => {
        if (res.success && res.data) {
          this.health.set(res.data);
        }
      },
      error: () => {
        this.health.set({ status: 'Offline', database: 'Disconnected', timestamp: '' });
      }
    });
  }
}
