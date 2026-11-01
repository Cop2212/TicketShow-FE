import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

export interface VenueBookingItem {
  id: string;
  bookingCode: string;
  venueId: string;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  organizerId: string;
  organizerName: string;
  startTime: string;
  endTime: string;
  priceQuote: number;
  note?: string;
  rejectionReason?: string;
  status: number; // 1: Pending, 2: Confirmed, 3: Rejected, 4: Cancelled
  eventId?: string;
  eventTitle?: string;
}

@Component({
  selector: 'app-admin-venue-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              📅 ĐIỀU PHỐI & THUÊ MẶT BẰNG
            </span>
            <span class="text-xs text-slate-400">• {{ bookings().length }} đơn đặt lịch</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white">Lịch Đặt Thuê Địa Điểm</h1>
          <p class="text-xs text-slate-400">Kiểm soát xung đột khung giờ và phê duyệt cho thuê mặt bằng giữa BTC và Chủ địa điểm</p>
        </div>

        <button (click)="loadBookings()" [disabled]="loading()"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-2">
          <span>🔄</span>
          <span>{{ loading() ? 'Đang tải...' : 'Làm mới' }}</span>
        </button>
      </div>

      <!-- Filters Bar -->
      <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2 flex-1 min-w-[240px]">
          <span class="text-slate-500 text-sm">🔍</span>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()"
            placeholder="Tìm theo mã đơn VBK, tên địa điểm, ban tổ chức..."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500" />
        </div>

        <!-- Status Filter Tabs -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button (click)="selectedStatus.set(null); applyFilter()"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            [ngClass]="selectedStatus() === null ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            Tất cả
          </button>
          <button (click)="selectedStatus.set(1); applyFilter()"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            [ngClass]="selectedStatus() === 1 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Chờ duyệt (Pending)
          </button>
          <button (click)="selectedStatus.set(2); applyFilter()"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            [ngClass]="selectedStatus() === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            Đã xác nhận (Confirmed)
          </button>
          <button (click)="selectedStatus.set(3); applyFilter()"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            [ngClass]="selectedStatus() === 3 ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            Đã từ chối (Rejected)
          </button>
        </div>
      </div>

      <!-- Bookings Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th class="py-3.5 px-4">Mã đơn & Show</th>
                <th class="py-3.5 px-4">Địa điểm thuê</th>
                <th class="py-3.5 px-4">Đơn vị tổ chức (BTC)</th>
                <th class="py-3.5 px-4">Khung giờ thuê</th>
                <th class="py-3.5 px-4">Giá thuê đề xuất</th>
                <th class="py-3.5 px-4">Trạng thái</th>
                <th class="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-300">
              @if (loading()) {
                <tr>
                  <td colspan="7" class="py-12 text-center text-slate-500">
                    <span class="inline-block animate-spin mr-2">🔄</span> Đang nạp danh sách đặt lịch...
                  </td>
                </tr>
              } @else if (filteredBookings().length === 0) {
                <tr>
                  <td colspan="7" class="py-12 text-center text-slate-500">
                    Không tìm thấy đơn đặt lịch nào phù hợp với bộ lọc.
                  </td>
                </tr>
              } @else {
                @for (b of filteredBookings(); track b.id) {
                  <tr class="hover:bg-slate-800/40 transition">
                    <!-- Code & Event Title -->
                    <td class="py-3.5 px-4">
                      <span class="font-mono font-bold text-white text-xs">{{ b.bookingCode }}</span>
                      @if (b.eventTitle) {
                        <p class="text-[11px] font-semibold text-purple-300 line-clamp-1 mt-0.5">Show: {{ b.eventTitle }}</p>
                      } @else {
                        <p class="text-[10px] text-slate-500 mt-0.5">Chưa liên kết show</p>
                      }
                      @if (b.note) {
                        <p class="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">"{{ b.note }}"</p>
                      }
                    </td>

                    <!-- Venue -->
                    <td class="py-3.5 px-4">
                      <p class="font-semibold text-white">{{ b.venueName }}</p>
                      <p class="text-[10px] text-slate-400 truncate max-w-[150px]">{{ b.venueAddress }}, {{ b.venueCity }}</p>
                    </td>

                    <!-- Organizer -->
                    <td class="py-3.5 px-4">
                      <p class="font-semibold text-white">{{ b.organizerName }}</p>
                      <span class="text-[10px] text-slate-500 font-mono">{{ b.organizerId }}</span>
                    </td>

                    <!-- Time Slot -->
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      <p class="font-medium text-slate-200">{{ b.startTime | date:'dd/MM/yyyy' }}</p>
                      <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800">
                        {{ b.startTime | date:'HH:mm' }} - {{ b.endTime | date:'HH:mm' }}
                      </span>
                    </td>

                    <!-- Price Quote -->
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      <p class="font-extrabold text-purple-300 text-xs">{{ b.priceQuote | number }} VNĐ</p>
                    </td>

                    <!-- Status -->
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      @switch (b.status) {
                        @case (2) {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Đã xác nhận
                          </span>
                        }
                        @case (1) {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            Chờ duyệt
                          </span>
                        }
                        @case (3) {
                          <div>
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <span>❌</span> Đã từ chối
                            </span>
                            @if (b.rejectionReason) {
                              <p class="text-[9px] text-rose-400/80 truncate max-w-[120px] mt-0.5">{{ b.rejectionReason }}</p>
                            }
                          </div>
                        }
                        @default {
                          <span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                            Status {{ b.status }}
                          </span>
                        }
                      }
                    </td>

                    <!-- Action Buttons -->
                    <td class="py-3.5 px-4 text-right whitespace-nowrap">
                      @if (b.status === 1) {
                        <div class="flex items-center justify-end gap-1.5">
                          <button (click)="respondBooking(b, true)" [disabled]="actionLoading()"
                            class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow">
                            ✅ Chấp thuận
                          </button>
                          <button (click)="respondBooking(b, false)" [disabled]="actionLoading()"
                            class="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold text-[11px] border border-rose-800 transition">
                            ❌ Từ chối
                          </button>
                        </div>
                      } @else {
                        <span class="text-[11px] text-slate-500 italic">Đã hoàn tất</span>
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminVenueBookingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly actionLoading = signal(false);
  readonly bookings = signal<VenueBookingItem[]>([]);
  readonly filteredBookings = signal<VenueBookingItem[]>([]);
  readonly selectedStatus = signal<number | null>(null);
  searchTerm = '';

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);
    this.api.get<VenueBookingItem[]>('venue-bookings').subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.bookings.set(res.data);
          this.applyFilter();
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    let result = this.bookings();
    const st = this.selectedStatus();
    if (st !== null) {
      result = result.filter(b => b.status === st);
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      result = result.filter(b =>
        b.bookingCode.toLowerCase().includes(q) ||
        b.venueName.toLowerCase().includes(q) ||
        b.organizerName.toLowerCase().includes(q) ||
        (b.eventTitle && b.eventTitle.toLowerCase().includes(q))
      );
    }

    this.filteredBookings.set(result);
  }

  respondBooking(b: VenueBookingItem, accept: boolean): void {
    let reason: string | undefined = undefined;
    if (!accept) {
      const input = prompt('Nhập lý do từ chối đơn thuê địa điểm này:');
      if (input === null) return;
      reason = input.trim() || 'Chủ địa điểm bận lịch không thể cho thuê.';
    } else {
      if (!confirm(`Xác nhận CHẤP THUẬN cho đơn vị "${b.organizerName}" thuê địa điểm "${b.venueName}"?`)) return;
    }

    this.actionLoading.set(true);
    this.api.patch(`venue-bookings/${b.id}/respond`, { accept, reason }).subscribe({
      next: res => {
        this.actionLoading.set(false);
        alert(res.message || 'Xử lý yêu cầu thuê địa điểm thành công.');
        this.loadBookings();
      },
      error: err => {
        this.actionLoading.set(false);
        alert(err.message || 'Lỗi khi xử lý đơn thuê địa điểm.');
      }
    });
  }
}
