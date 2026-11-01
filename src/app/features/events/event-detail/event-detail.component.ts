import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SeatItem, SeatMapComponent } from '../../../shared/components/seat-map/seat-map.component';

interface EventDetail {
  id: string;
  title: string;
  slug: string;
  description?: string;
  bannerUrl?: string;
  venueName: string;
  venueAddress?: string;
  startTime: string;
  endTime: string;
  salesStartTime: string;
  salesEndTime: string;
  status: number;
  ticketTiers: Array<{
    id: string;
    name: string;
    price: number;
    totalQuantity: number;
    soldQuantity: number;
    colorHex: string;
  }>;
  seats: SeatItem[];
}

interface ReservationResult {
  orderId: string;
  orderCode: string;
  totalAmount: number;
  expiresAt: string;
  remainingSeconds: number;
  seats: Array<{ seatId: string; label: string; tierName: string; price: number }>;
}

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SeatMapComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      @if (loading()) {
        <div class="text-center py-20 text-slate-400">Đang tải thông tin sự kiện...</div>
      } @else if (event()) {
        <!-- Event Header Card -->
        <div class="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
          <div class="h-64 sm:h-80 w-full relative">
            <img [src]="event()?.bannerUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200'"
                 class="w-full h-full object-cover" alt="Banner" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

            <div class="absolute bottom-6 left-6 right-6 space-y-2">
              <span class="px-3 py-1 bg-purple-600/80 backdrop-blur rounded-full text-xs font-semibold text-white">
                ĐANG MỞ BÁN VÉ
              </span>
              <h1 class="text-2xl sm:text-4xl font-extrabold text-white">{{ event()?.title }}</h1>
              <div class="flex flex-wrap gap-4 text-xs sm:text-sm text-slate-300">
                <span>📍 {{ event()?.venueName }}</span>
                <span>📅 {{ event()?.startTime | date:'HH:mm - dd/MM/yyyy' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Booking Section: Seatmap & Checkout Panel -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- 2D SVG Seat Map (Col 1-2) -->
          <div class="lg:col-span-2 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <span>🗺️ Sơ đồ chọn chỗ ngồi</span>
              </h2>
              <span class="text-xs text-slate-400">Chọn tối đa 10 ghế/lần đặt</span>
            </div>

            <app-seat-map
              [seats]="event()!.seats"
              (selectionChange)="onSeatsSelected($event)"
            />
          </div>

          <!-- Selection & Checkout Card (Col 3) -->
          <div class="space-y-6">
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 sticky top-24 shadow-xl">
              <h3 class="text-lg font-bold text-white pb-3 border-b border-slate-800">Thông tin vé đã chọn</h3>

              @if (selectedSeats().length === 0) {
                <div class="py-8 text-center text-sm text-slate-500">
                  Vui lòng click chọn ghế trên sơ đồ 2D để tiến hành đặt vé.
                </div>
              } @else {
                <!-- Selected list -->
                <div class="space-y-3 max-h-56 overflow-y-auto pr-1">
                  @for (seat of selectedSeats(); track seat.id) {
                    <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm">
                      <div>
                        <span class="font-bold text-white">Ghế {{ seat.rowName }}{{ seat.seatNumber }}</span>
                        <span class="text-xs text-purple-400 ml-2">({{ seat.tierName }})</span>
                      </div>
                      <span class="font-semibold text-slate-200">{{ seat.price | number:'1.0-0' }} ₫</span>
                    </div>
                  }
                </div>

                <!-- Price Breakdown -->
                <div class="pt-4 border-t border-slate-800 space-y-2 text-sm">
                  <div class="flex justify-between text-slate-400">
                    <span>Số lượng ghế:</span>
                    <span class="font-bold text-white">{{ selectedSeats().length }} vé</span>
                  </div>
                  <div class="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800/60">
                    <span>Tổng thanh toán:</span>
                    <span class="text-xl text-purple-400">{{ totalPrice() | number:'1.0-0' }} ₫</span>
                  </div>
                </div>

                <!-- Customer form if not logged in -->
                <form [formGroup]="customerForm" class="space-y-3 pt-2">
                  <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Họ tên người nhận vé</label>
                    <input type="text" formControlName="name" placeholder="Nguyễn Văn A"
                      class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Email nhận E-ticket</label>
                    <input type="email" formControlName="email" placeholder="name@example.com"
                      class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500" />
                  </div>
                </form>

                <button
                  (click)="onReserveSeats()"
                  [disabled]="reserving() || customerForm.invalid"
                  class="w-full py-3 px-4 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition shadow-lg shadow-purple-600/30 text-sm flex items-center justify-center gap-2">
                  <span>🔒</span>
                  <span>{{ reserving() ? 'Đang kích hoạt Redis Lock...' : 'Giữ chỗ & Thanh toán (5 phút)' }}</span>
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- MODAL COUNTDOWN & CHECKOUT SIMULATION -->
      @if (reservation()) {
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl relative">
            <!-- Header with Countdown Timer -->
            <div class="text-center space-y-2">
              <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold">
                <span>⏱️ ĐANG KHÓA GHẾ (TTL): {{ formattedTimer() }}</span>
              </div>
              <h3 class="text-2xl font-extrabold text-white">Xác nhận Đặt vé</h3>
              <p class="text-xs text-slate-400">Mã đơn: <span class="text-purple-300 font-mono">{{ reservation()?.orderCode }}</span></p>
            </div>

            <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-sm">
              <div class="flex justify-between text-slate-400">
                <span>Danh sách ghế:</span>
                <span class="text-white font-semibold">
                  @for (s of reservation()?.seats; track s.seatId) {
                    {{ s.label }} ({{ s.tierName }})
                  }
                </span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Tổng tiền:</span>
                <span class="text-lg font-bold text-purple-400">{{ reservation()?.totalAmount | number:'1.0-0' }} ₫</span>
              </div>
            </div>

            <!-- Simulation Action Buttons -->
            <div class="space-y-3 pt-2">
              <button
                (click)="onSimulatePaymentSuccess()"
                [disabled]="paying()"
                class="w-full py-3.5 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition shadow-lg shadow-emerald-600/30 text-sm">
                {{ paying() ? 'Đang kích hoạt Webhook & Ký số vé...' : '💳 Thanh toán Thành công (Mô phỏng Sandbox)' }}
              </button>

              <button
                (click)="onCancelReservation()"
                class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition">
                Hủy giữ chỗ & Quay lại
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class EventDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly reserving = signal(false);
  readonly paying = signal(false);
  readonly event = signal<EventDetail | null>(null);
  readonly selectedSeats = signal<SeatItem[]>([]);
  readonly reservation = signal<ReservationResult | null>(null);

  readonly secondsLeft = signal(300);
  private timerInterval: number | null = null;

  readonly customerForm = this.fb.group({
    name: [this.auth.currentUser()?.fullName || '', [Validators.required]],
    email: [this.auth.currentUser()?.email || '', [Validators.required, Validators.email]],
    phone: ['']
  });

  readonly totalPrice = computed(() => this.selectedSeats().reduce((sum, s) => sum + s.price, 0));

  readonly formattedTimer = computed(() => {
    const sec = this.secondsLeft();
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || 'live-concert-ha-noi-2026';
    this.loadEvent(slug);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private loadEvent(idOrSlug: string): void {
    this.loading.set(true);
    this.api.get<EventDetail>(`events/${idOrSlug}`).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.event.set(res.data);
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onSeatsSelected(seats: SeatItem[]): void {
    this.selectedSeats.set(seats);
  }

  onReserveSeats(): void {
    const ev = this.event();
    const selected = this.selectedSeats();
    if (!ev || selected.length === 0 || this.customerForm.invalid) return;

    this.reserving.set(true);
    const formVal = this.customerForm.getRawValue();

    const body = {
      eventId: ev.id,
      seatIds: selected.map(s => s.id),
      customerName: formVal.name || '',
      customerEmail: formVal.email || '',
      customerPhone: formVal.phone || ''
    };

    this.api.post<ReservationResult>('orders/reserve-seats', body).subscribe({
      next: res => {
        this.reserving.set(false);
        if (res.success && res.data) {
          this.router.navigate(['/checkout', res.data.orderCode]);
        }
      },
      error: err => {
        this.reserving.set(false);
        alert(err.message || 'Không thể giữ chỗ. Ghế có thể đã bị người khác chọn.');
        this.loadEvent(ev.slug);
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
        const currentRes = this.reservation();
        this.reservation.set(null);
        if (currentRes?.orderCode) {
          this.api.delete(`orders/${currentRes.orderCode}/cancel`).subscribe();
        }
        alert('Hết thời gian giữ chỗ (5 phút). Ghế đã được giải phóng trên hệ thống.');
        if (this.event()) this.loadEvent(this.event()!.slug);
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

  onSimulatePaymentSuccess(): void {
    const res = this.reservation();
    if (!res) return;

    this.paying.set(true);
    this.api.post('payments/simulate', {
      orderId: res.orderId,
      orderCode: res.orderCode,
      success: true
    }).subscribe({
      next: () => {
        this.paying.set(false);
        this.stopTimer();
        this.reservation.set(null);
        alert('Thanh toán thành công! Vé điện tử (E-ticket) có mã QR ký số HMAC đã được khởi tạo.');
        this.router.navigate(['/my-tickets']);
      },
      error: err => {
        this.paying.set(false);
        alert(err.message || 'Lỗi xử lý thanh toán.');
      }
    });
  }

  onCancelReservation(): void {
    const res = this.reservation();
    this.stopTimer();
    this.reservation.set(null);

    if (res?.orderCode) {
      this.api.delete(`orders/${res.orderCode}/cancel`).subscribe({
        next: () => {
          if (this.event()) this.loadEvent(this.event()!.slug);
        },
        error: () => {
          if (this.event()) this.loadEvent(this.event()!.slug);
        }
      });
    } else {
      if (this.event()) this.loadEvent(this.event()!.slug);
    }
  }
}
