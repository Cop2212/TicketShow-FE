import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

export interface OrderDetailTicket {
  id: string;
  ticketCode: string;
  eventTitle?: string;
  venueName?: string;
  startTime?: string;
  tierName?: string;
  seatLabel: string;
  status: string;
  qrCodeImage: string;
}

export interface OrderDetailResponse {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paymentStatus: string;
  expiresAt: string;
  tickets: OrderDetailTicket[];
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <!-- Checkout Header -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <span>🔒 CỔNG THANH TOÁN BẢO MẬT SSL 256-BIT</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-white">Xác nhận Đặt vé & Thanh toán</h1>
        <p class="text-xs text-slate-400">Vui lòng hoàn tất thanh toán trước khi thời gian giữ chỗ kết thúc</p>
      </div>

      @if (loading()) {
        <div class="py-20 text-center text-slate-500">
          <span class="inline-block animate-spin mr-2">🔄</span> Đang nạp thông tin đơn giữ chỗ...
        </div>
      } @else if (!order()) {
        <div class="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
          <span class="text-4xl">⚠️</span>
          <h2 class="text-lg font-bold text-white">Không tìm thấy đơn hàng</h2>
          <p class="text-xs text-slate-400">Đơn hàng không tồn tại hoặc đã bị hủy trước đó.</p>
          <a routerLink="/" class="inline-block px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs">
            Quay về trang chủ
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Left: Order Details & Seat Summary (2 cols) -->
          <div class="md:col-span-2 space-y-6">
            <!-- Event & Seats Summary Card -->
            <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
              <div class="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span class="text-[10px] font-mono text-purple-400 block uppercase">Mã đơn đặt vé:</span>
                  <span class="text-base font-extrabold text-white font-mono">{{ order()?.orderCode }}</span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-slate-400 block uppercase">Khách hàng:</span>
                  <span class="text-xs font-bold text-white">{{ order()?.customerName }}</span>
                  <p class="text-[10px] text-slate-500">{{ order()?.customerEmail }}</p>
                </div>
              </div>

              <!-- Selected Seats -->
              <div>
                <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Vị trí ghế đã giữ chỗ:</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  @for (t of order()?.tickets; track t.id) {
                    <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <span class="text-xs font-bold text-purple-400 font-mono">{{ t.seatLabel }}</span>
                        <p class="text-[10px] text-slate-400">{{ t.tierName || 'Vé show' }}</p>
                      </div>
                      <span class="text-[10px] font-bold text-emerald-400">ĐÃ KHÓA</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Price Breakdown -->
              <div class="pt-4 border-t border-slate-800 space-y-2 text-xs">
                <div class="flex justify-between text-slate-400">
                  <span>Số lượng vé:</span>
                  <span class="font-bold text-white">{{ order()?.tickets?.length }} vé</span>
                </div>
                <div class="flex justify-between text-slate-400">
                  <span>Phí dịch vụ nền tảng:</span>
                  <span class="text-emerald-400 font-bold">Miễn phí (0 đ)</span>
                </div>
                <div class="flex justify-between items-center text-sm pt-2 border-t border-slate-800/60 font-bold">
                  <span class="text-white">Tổng tiền thanh toán:</span>
                  <span class="text-xl font-extrabold text-emerald-400">{{ order()?.totalAmount | number }} VNĐ</span>
                </div>
              </div>
            </div>

            <!-- Payment Methods Selector -->
            <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider">Chọn phương thức thanh toán:</h3>
              <div class="space-y-2.5">
                <label class="flex items-center justify-between p-3.5 bg-slate-950 border rounded-2xl cursor-pointer transition"
                  [ngClass]="selectedGateway === 'VNPAY_QR' ? 'border-purple-500 bg-purple-950/20' : 'border-slate-800 hover:border-slate-700'">
                  <div class="flex items-center gap-3">
                    <input type="radio" name="gateway" value="VNPAY_QR" [(ngModel)]="selectedGateway" class="accent-purple-600" />
                    <div>
                      <p class="text-xs font-bold text-white">VNPAY-QR (Quét mã qua App Ngân hàng)</p>
                      <p class="text-[10px] text-slate-500">Hỗ trợ hơn 40 ngân hàng & ví điện tử tại Việt Nam</p>
                    </div>
                  </div>
                  <span class="text-lg">🏦</span>
                </label>

                <label class="flex items-center justify-between p-3.5 bg-slate-950 border rounded-2xl cursor-pointer transition"
                  [ngClass]="selectedGateway === 'MOMO' ? 'border-purple-500 bg-purple-950/20' : 'border-slate-800 hover:border-slate-700'">
                  <div class="flex items-center gap-3">
                    <input type="radio" name="gateway" value="MOMO" [(ngModel)]="selectedGateway" class="accent-purple-600" />
                    <div>
                      <p class="text-xs font-bold text-white">Ví MoMo</p>
                      <p class="text-[10px] text-slate-500">Thanh toán tức thì qua ví điện tử MoMo</p>
                    </div>
                  </div>
                  <span class="text-lg">📱</span>
                </label>

                <label class="flex items-center justify-between p-3.5 bg-slate-950 border rounded-2xl cursor-pointer transition"
                  [ngClass]="selectedGateway === 'CREDIT_CARD' ? 'border-purple-500 bg-purple-950/20' : 'border-slate-800 hover:border-slate-700'">
                  <div class="flex items-center gap-3">
                    <input type="radio" name="gateway" value="CREDIT_CARD" [(ngModel)]="selectedGateway" class="accent-purple-600" />
                    <div>
                      <p class="text-xs font-bold text-white">Thẻ Quốc Tế (Visa / Mastercard / JCB)</p>
                      <p class="text-[10px] text-slate-500">Xác thực mã OTP 3D Secure bảo mật</p>
                    </div>
                  </div>
                  <span class="text-lg">💳</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Right: Countdown Timer & Action Panel (1 col) -->
          <div class="space-y-6">
            <!-- Countdown Timer Card -->
            <div class="p-6 bg-slate-900 border border-purple-500/30 rounded-3xl text-center space-y-3 shadow-xl">
              <span class="text-[11px] text-purple-400 font-semibold uppercase tracking-wider block">Thời gian giữ chỗ còn lại</span>
              <div class="text-4xl font-extrabold font-mono"
                [ngClass]="secondsLeft() < 60 ? 'text-rose-400 animate-pulse' : 'text-purple-300'">
                {{ formattedTimer() }}
              </div>
              <p class="text-[10px] text-slate-500">Nếu quá thời gian này, các vị trí ghế sẽ tự động giải phóng cho khán giả khác.</p>
            </div>

            <!-- Pay Now Button -->
            <button (click)="onConfirmPayment()" [disabled]="paying() || secondsLeft() <= 0"
              class="w-full py-4 px-6 rounded-2xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white transition shadow-lg shadow-purple-600/30 text-sm flex items-center justify-center gap-2">
              <span>{{ paying() ? 'Đang xác thực giao dịch...' : '⚡ Xác nhận & Thanh toán ngay' }}</span>
            </button>

            <!-- Cancel Order Button -->
            <button (click)="onCancelOrder()" [disabled]="paying()"
              class="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 transition">
              Hủy đơn & Chọn lại ghế
            </button>

            <!-- Security Trust Badges -->
            <div class="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2 text-[11px] text-slate-400">
              <div class="flex items-center gap-2 text-slate-300">
                <span>🛡️</span>
                <span class="font-semibold">Mã hóa ký số QR HMAC-SHA256</span>
              </div>
              <p class="text-[10px] text-slate-500">Vé điện tử (E-ticket) sau khi thanh toán được gửi ngay lập tức về email và lưu trong mục "Vé của tôi".</p>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly paying = signal(false);
  readonly order = signal<OrderDetailResponse | null>(null);
  readonly secondsLeft = signal(300);
  selectedGateway = 'VNPAY_QR';

  private timerInterval: number | null = null;

  readonly formattedTimer = computed(() => {
    const sec = this.secondsLeft();
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  });

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('orderCode');
    if (!code) {
      this.router.navigate(['/']);
      return;
    }
    this.loadOrder(code);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private loadOrder(orderCode: string): void {
    this.loading.set(true);
    this.api.get<OrderDetailResponse>(`orders/${orderCode}`).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.order.set(res.data);

          if (res.data.paymentStatus === 'Paid') {
            alert('Đơn hàng này đã được thanh toán thành công!');
            this.router.navigate(['/my-tickets']);
            return;
          }

          // Calculate remaining seconds from expiresAt
          const expiryDate = new Date(res.data.expiresAt).getTime();
          const now = Date.now();
          const remainingSec = Math.max(0, Math.floor((expiryDate - now) / 1000));
          this.startTimer(remainingSec > 0 ? remainingSec : 300);
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private startTimer(seconds: number): void {
    this.stopTimer();
    this.secondsLeft.set(seconds);
    this.timerInterval = window.setInterval(() => {
      const left = this.secondsLeft() - 1;
      if (left <= 0) {
        this.stopTimer();
        this.secondsLeft.set(0);
        const currentOrder = this.order();
        if (currentOrder) {
          this.api.delete(`orders/${currentOrder.orderCode}/cancel`).subscribe();
        }
        alert('Hết thời gian giữ chỗ (5 phút). Ghế của bạn đã được giải phóng trên hệ thống.');
        this.router.navigate(['/']);
      } else {
        this.secondsLeft.set(left);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  onConfirmPayment(): void {
    const ord = this.order();
    if (!ord) return;

    this.paying.set(true);
    this.api.post('payments/simulate', {
      orderId: ord.id,
      orderCode: ord.orderCode,
      paymentGateway: this.selectedGateway,
      success: true
    }).subscribe({
      next: () => {
        this.paying.set(false);
        this.stopTimer();
        alert('Thanh toán thành công! Vé điện tử E-Ticket kèm mã QR ký số HMAC đã được khởi tạo.');
        this.router.navigate(['/my-tickets']);
      },
      error: err => {
        this.paying.set(false);
        alert(err.message || 'Lỗi khi xử lý thanh toán.');
      }
    });
  }

  onCancelOrder(): void {
    const ord = this.order();
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này và giải phóng ghế đã chọn?')) return;

    this.stopTimer();
    if (ord?.orderCode) {
      this.api.delete(`orders/${ord.orderCode}/cancel`).subscribe({
        next: () => this.router.navigate(['/']),
        error: () => this.router.navigate(['/'])
      });
    } else {
      this.router.navigate(['/']);
    }
  }
}
