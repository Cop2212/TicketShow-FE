import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

interface HealthStatus {
  status: string;
  database: string;
  timestamp: string;
}

export interface HomeEventItem {
  id: string;
  title: string;
  slug: string;
  description?: string;
  bannerUrl?: string;
  venueName: string;
  venueAddress?: string;
  startTime: string;
  endTime: string;
  status: number;
  ticketTiers: Array<{
    id: string;
    name: string;
    price: number;
    totalQuantity: number;
    soldQuantity: number;
    colorHex: string;
  }>;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-16 pb-20">
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
            Hệ sinh thái kết nối Ban tổ chức và Địa điểm tổ chức. Xử lý giữ chỗ hạn chế tranh chấp (Concurrency Lock), thanh toán trực tuyến và soát vé QR thời gian thực.
          </p>

          <div class="flex flex-wrap justify-center gap-4 pt-4">
            <a routerLink="/auth/register" class="px-6 py-3 rounded-xl font-semibold bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg shadow-purple-600/30">
              Đăng ký tham gia
            </a>
            <a routerLink="/auth/login" class="px-6 py-3 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition">
              Đăng nhập tài khoản
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

      <!-- Live Events Showcase Section -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">ĐANG MỞ BÁN CHÍNH THỨC</span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white">Sự kiện & Show diễn Nổi bật</h2>
            <p class="text-xs text-slate-400">Chọn vị trí ghế và đặt vé trực tuyến ngay hôm nay</p>
          </div>
          <span class="text-xs text-slate-500">{{ liveEvents().length }} show diễn khả dụng</span>
        </div>

        @if (loadingEvents()) {
          <div class="py-16 text-center text-slate-500">
            <span class="inline-block animate-spin mr-2">🔄</span> Đang nạp danh sách sự kiện mở bán...
          </div>
        } @else if (liveEvents().length === 0) {
          <div class="p-12 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-3">
            <span class="text-3xl">🎪</span>
            <p class="text-sm font-semibold text-slate-300">Hiện chưa có sự kiện nào đang mở bán.</p>
            <p class="text-xs text-slate-500">Các show diễn mới sẽ được cập nhật liên tục trên hệ thống.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (ev of liveEvents(); track ev.id) {
              <div class="group bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
                <div>
                  <!-- Banner Image -->
                  <div class="relative aspect-video overflow-hidden bg-slate-950">
                    <img [src]="ev.bannerUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800'"
                         [alt]="ev.title"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white backdrop-blur shadow">
                      ĐANG BÁN VÉ
                    </div>
                  </div>

                  <!-- Content -->
                  <div class="p-5 space-y-3">
                    <h3 class="text-base font-extrabold text-white group-hover:text-purple-300 transition line-clamp-2">
                      {{ ev.title }}
                    </h3>

                    <!-- Meta info -->
                    <div class="space-y-1.5 text-xs text-slate-400">
                      <div class="flex items-center gap-2">
                        <span>📅</span>
                        <span>{{ ev.startTime | date:'dd/MM/yyyy' }} ({{ ev.startTime | date:'HH:mm' }})</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span>📍</span>
                        <span class="truncate">{{ ev.venueName }}</span>
                      </div>
                    </div>

                    <!-- Tiers Preview -->
                    <div class="pt-2 flex flex-wrap gap-1.5">
                      @for (t of ev.ticketTiers; track t.id) {
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold border"
                          [style.backgroundColor]="t.colorHex + '20'"
                          [style.borderColor]="t.colorHex + '50'"
                          [style.color]="t.colorHex">
                          {{ t.name }}: {{ t.price | number }}đ
                        </span>
                      }
                    </div>
                  </div>
                </div>

                <!-- Card Footer CTA -->
                <div class="p-5 pt-0">
                  <a [routerLink]="['/events', ev.slug]"
                    class="w-full py-2.5 px-4 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white text-xs transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2">
                    <span>🎟️ Chọn ghế & Đặt vé</span>
                  </a>
                </div>
              </div>
            }
          </div>
        }
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
  readonly liveEvents = signal<HomeEventItem[]>([]);
  readonly loadingEvents = signal(false);

  ngOnInit(): void {
    this.api.get<HealthStatus>('health').subscribe({
      next: res => {
        if (res.success && res.data) {
          this.health.set(res.data);
        }
      }
    });

    this.loadLiveEvents();
  }

  loadLiveEvents(): void {
    this.loadingEvents.set(true);
    // status 2 = Published
    this.api.get<HomeEventItem[]>('events', { status: 2 }).subscribe({
      next: res => {
        this.loadingEvents.set(false);
        if (res.success && res.data) {
          this.liveEvents.set(res.data);
        }
      },
      error: () => {
        this.loadingEvents.set(false);
      }
    });
  }
}
