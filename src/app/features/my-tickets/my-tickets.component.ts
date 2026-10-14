import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface UserTicket {
  id: string;
  ticketCode: string;
  eventId: string;
  eventTitle: string;
  venueName: string;
  startTime: string;
  endTime: string;
  tierName: string;
  price: number;
  seatLabel: string;
  status: 'Valid' | 'CheckedIn' | 'Cancelled';
  checkedInAt?: string;
  qrData: string;
  qrCodeImage: string;
}

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div class="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h1 class="text-3xl font-extrabold text-white">Vé điện tử của tôi (E-Tickets)</h1>
          <p class="text-sm text-slate-400">Danh sách vé đã thanh toán thành công, có gắn chữ ký số HMAC chống giả mạo</p>
        </div>
        <button (click)="loadTickets()" class="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition">
          🔄 Làm mới
        </button>
      </div>

      @if (loading()) {
        <div class="py-16 text-center text-slate-400">Đang tải danh sách vé...</div>
      } @else if (tickets().length === 0) {
        <div class="py-16 text-center space-y-4 bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <div class="text-4xl">🎫</div>
          <h3 class="text-lg font-bold text-white">Bạn chưa có vé nào</h3>
          <p class="text-sm text-slate-400 max-w-md mx-auto">
            Hãy khám phá các show diễn âm nhạc đỉnh cao và đặt vé trực tuyến ngay hôm nay!
          </p>
          <a routerLink="/" class="inline-block px-6 py-2.5 rounded-xl font-semibold bg-purple-600 hover:bg-purple-500 text-white transition text-sm">
            Xem sự kiện đang mở bán
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          @for (ticket of tickets(); track ticket.id) {
            <div class="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-purple-500/50 transition">
              <!-- Ticket Details Top -->
              <div class="p-6 space-y-4">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider"
                      [ngClass]="ticket.tierName.includes('VIP') ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'">
                      {{ ticket.tierName }}
                    </span>
                    <h3 class="text-lg font-extrabold text-white mt-2 leading-tight">{{ ticket.eventTitle }}</h3>
                  </div>

                  <span class="px-3 py-1 rounded-full text-xs font-bold shrink-0"
                    [ngClass]="ticket.status === 'CheckedIn' ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'">
                    {{ ticket.status === 'CheckedIn' ? 'ĐÃ CHECK-IN' : 'HỢP LỆ' }}
                  </span>
                </div>

                <div class="space-y-1.5 text-xs text-slate-300">
                  <div class="flex items-center gap-2">
                    <span>📍</span>
                    <span class="truncate">{{ ticket.venueName }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span>📅</span>
                    <span>{{ ticket.startTime | date:'HH:mm - dd/MM/yyyy' }}</span>
                  </div>
                </div>

                <div class="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                  <div>
                    <span class="text-slate-400">Vị trí chỗ:</span>
                    <span class="text-base font-extrabold text-purple-400 ml-1.5">{{ ticket.seatLabel }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-slate-400">Mã vé:</span>
                    <span class="font-mono text-slate-200 ml-1">{{ ticket.ticketCode }}</span>
                  </div>
                </div>
              </div>

              <!-- Ticket Bottom QR Area (Perforated coupon style) -->
              <div class="p-5 bg-slate-950 border-t-2 border-dashed border-slate-800 flex items-center justify-between gap-4">
                <div class="space-y-1">
                  <p class="text-[11px] font-semibold text-slate-400">MÃ QR SOÁT VÉ CHỐNG GIẢ</p>
                  <p class="text-[10px] text-slate-500">Xuất trình mã này cho nhân viên tại cổng check-in</p>
                  <button (click)="selectedQr.set(ticket)"
                    class="text-xs text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1 pt-1">
                    🔍 Xem phóng to mã QR
                  </button>
                </div>

                <img [src]="'data:image/png;base64,' + ticket.qrCodeImage"
                  class="w-20 h-20 bg-white p-1 rounded-xl shadow-md shrink-0 cursor-pointer hover:opacity-90 transition"
                  (click)="selectedQr.set(ticket)"
                  alt="QR Code" />
              </div>
            </div>
          }
        </div>
      }

      <!-- QR Zoom Modal -->
      @if (selectedQr()) {
        <div class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
          (click)="selectedQr.set(null)">
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl"
            (click)="$event.stopPropagation()">
            <div class="space-y-1">
              <h3 class="text-lg font-bold text-white">{{ selectedQr()?.eventTitle }}</h3>
              <p class="text-xs text-purple-400 font-semibold">{{ selectedQr()?.seatLabel }} ({{ selectedQr()?.tierName }})</p>
            </div>

            <div class="p-4 bg-white rounded-2xl inline-block shadow-inner">
              <img [src]="'data:image/png;base64,' + selectedQr()?.qrCodeImage"
                class="w-64 h-64 object-contain mx-auto" alt="QR Full" />
            </div>

            <div class="space-y-2">
              <p class="font-mono text-xs text-slate-300">{{ selectedQr()?.ticketCode }}</p>
              <p class="text-[11px] text-slate-500">Ký số bảo mật HMAC-SHA256 • Chống chụp màn hình tái sử dụng</p>
            </div>

            <button (click)="selectedQr.set(null)"
              class="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700">
              Đóng lại
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class MyTicketsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly tickets = signal<UserTicket[]>([]);
  readonly selectedQr = signal<UserTicket | null>(null);

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading.set(true);
    const email = this.auth.currentUser()?.email;
    const params = email ? { email } : undefined;

    this.api.get<UserTicket[]>('orders/my-tickets', params).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.tickets.set(res.data);
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
