import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

export interface EventTierItem {
  id: string;
  name: string;
  price: number;
  totalQuantity: number;
  soldQuantity: number;
  colorHex: string;
}

export interface AdminEventItem {
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
  status: number; // 1: Draft, 2: Published, 3: Closed, 4: Finished, 5: PendingApproval
  ticketTiers: EventTierItem[];
  venueId?: string;
  isSeated: boolean;
  organizerName: string;
}

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              🎪 HỆ THỐNG PHÂN PHỐI VÉ
            </span>
            <span class="text-xs text-slate-400">• Tổng cộng {{ events().length }} sự kiện</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white">Quản lý Show diễn & Sự kiện</h1>
          <p class="text-xs text-slate-400">Kiểm duyệt, quản lý vòng đời và theo dõi tiến độ bán vé của từng show</p>
        </div>

        <div class="flex items-center gap-3">
          <button (click)="loadEvents()" [disabled]="loading()"
            class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-2">
            <span>🔄</span>
            <span>{{ loading() ? 'Đang tải...' : 'Làm mới' }}</span>
          </button>
          <a routerLink="/admin/events/create"
            class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 flex items-center gap-2">
            <span>➕</span>
            <span>Tạo Show Mới</span>
          </a>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2 flex-1 min-w-[240px]">
          <span class="text-slate-500 text-sm">🔍</span>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()"
            placeholder="Tìm theo tên show diễn, địa điểm..."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500" />
        </div>

        <!-- Status Filter Tabs -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button (click)="selectStatus(null)"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            [ngClass]="selectedStatus() === null ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            Tất cả
          </button>
          <button (click)="selectStatus(2)"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            [ngClass]="selectedStatus() === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            Đang bán (Published)
          </button>
          <button (click)="selectStatus(5)"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            [ngClass]="selectedStatus() === 5 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Chờ duyệt (Pending)
          </button>
          <button (click)="selectStatus(1)"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            [ngClass]="selectedStatus() === 1 ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            Nháp (Draft)
          </button>
          <button (click)="selectStatus(3)"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            [ngClass]="selectedStatus() === 3 ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            Đã đóng (Closed)
          </button>
        </div>
      </div>

      <!-- Events Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th class="py-3.5 px-4">Show diễn</th>
                <th class="py-3.5 px-4">Địa điểm</th>
                <th class="py-3.5 px-4">Thời gian</th>
                <th class="py-3.5 px-4">Hạng vé & Sức chứa</th>
                <th class="py-3.5 px-4">Trạng thái</th>
                <th class="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-300">
              @if (loading()) {
                <tr>
                  <td colspan="6" class="py-12 text-center text-slate-500">
                    <span class="inline-block animate-spin mr-2">🔄</span> Đang nạp danh sách show diễn...
                  </td>
                </tr>
              } @else if (filteredEvents().length === 0) {
                <tr>
                  <td colspan="6" class="py-12 text-center text-slate-500">
                    Không tìm thấy show diễn nào phù hợp với bộ lọc.
                  </td>
                </tr>
              } @else {
                @for (ev of filteredEvents(); track ev.id) {
                  <tr class="hover:bg-slate-800/40 transition">
                    <!-- Event Info -->
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-3">
                        <img [src]="ev.bannerUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200'"
                             alt="Banner" class="w-14 h-10 object-cover rounded-lg shrink-0 border border-slate-800" />
                        <div>
                          <p class="font-bold text-white text-xs hover:text-purple-300 transition line-clamp-1">{{ ev.title }}</p>
                          <span class="text-[10px] font-mono text-purple-400">/{{ ev.slug }}</span>
                          <p class="text-[10px] text-slate-500">BTC: {{ ev.organizerName || 'Ban tổ chức' }}</p>
                        </div>
                      </div>
                    </td>

                    <!-- Venue -->
                    <td class="py-3.5 px-4">
                      <p class="font-semibold text-white truncate max-w-[160px]">{{ ev.venueName }}</p>
                      <p class="text-[10px] text-slate-400 truncate max-w-[160px]">{{ ev.venueAddress || 'Chưa cập nhật địa chỉ' }}</p>
                    </td>

                    <!-- Time -->
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      <p class="font-medium text-slate-200">{{ ev.startTime | date:'dd/MM/yyyy' }}</p>
                      <p class="text-[10px] text-slate-500">{{ ev.startTime | date:'HH:mm' }} - {{ ev.endTime | date:'HH:mm' }}</p>
                    </td>

                    <!-- Ticket Tiers & Capacity -->
                    <td class="py-3.5 px-4">
                      <div class="space-y-1 max-w-[200px]">
                        <div class="flex flex-wrap gap-1">
                          @for (t of ev.ticketTiers; track t.id) {
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold border"
                              [style.backgroundColor]="t.colorHex + '20'"
                              [style.borderColor]="t.colorHex + '50'"
                              [style.color]="t.colorHex">
                              {{ t.name }}: {{ t.price | number }}đ ({{ t.soldQuantity }}/{{ t.totalQuantity }})
                            </span>
                          }
                        </div>
                        <p class="text-[10px] text-slate-500">
                          Tổng bán: <strong class="text-white">{{ getSoldTotal(ev) }}</strong> / {{ getCapacityTotal(ev) }} vé
                        </p>
                      </div>
                    </td>

                    <!-- Status Badge -->
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      @switch (ev.status) {
                        @case (2) {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Đang mở bán
                          </span>
                        }
                        @case (5) {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            Chờ sàn duyệt
                          </span>
                        }
                        @case (1) {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            <span>📝</span> Bản nháp
                          </span>
                        }
                        @case (3) {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <span>🔒</span> Đã đóng bán
                          </span>
                        }
                        @default {
                          <span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                            Status {{ ev.status }}
                          </span>
                        }
                      }
                    </td>

                    <!-- Action Buttons -->
                    <td class="py-3.5 px-4 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end gap-1.5">
                        <!-- PendingApproval: Admin Approve/Reject -->
                        @if (ev.status === 5) {
                          <button (click)="approveEvent(ev, true)" [disabled]="actionLoading()"
                            class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow">
                            ✅ Duyệt
                          </button>
                          <button (click)="approveEvent(ev, false)" [disabled]="actionLoading()"
                            class="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold text-[11px] border border-rose-800 transition">
                            ❌ Từ chối
                          </button>
                        }

                        <!-- Draft: Submit for Approval -->
                        @if (ev.status === 1) {
                          <button (click)="submitForApproval(ev)" [disabled]="actionLoading()"
                            class="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] transition">
                            📤 Gửi duyệt
                          </button>
                        }

                        <!-- Published: Close sales -->
                        @if (ev.status === 2) {
                          <button (click)="closeEventSales(ev)" [disabled]="actionLoading()"
                            class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 text-[11px] border border-slate-700 transition">
                            🔒 Đóng bán
                          </button>
                        }

                        <!-- View Live Show -->
                        <a [routerLink]="['/events', ev.slug]" target="_blank"
                           class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition"
                           title="Xem giao diện đặt vé trên sàn">
                          👁️
                        </a>
                      </div>
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
export class AdminEventsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly actionLoading = signal(false);
  readonly events = signal<AdminEventItem[]>([]);
  readonly filteredEvents = signal<AdminEventItem[]>([]);
  readonly selectedStatus = signal<number | null>(null);
  searchTerm = '';

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading.set(true);
    this.api.get<AdminEventItem[]>('events').subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.events.set(res.data);
          this.applyFilter();
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  selectStatus(status: number | null): void {
    this.selectedStatus.set(status);
    this.applyFilter();
  }

  applyFilter(): void {
    let result = this.events();
    const st = this.selectedStatus();
    if (st !== null) {
      result = result.filter(e => e.status === st);
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.venueName.toLowerCase().includes(q) ||
        e.slug.toLowerCase().includes(q)
      );
    }

    this.filteredEvents.set(result);
  }

  approveEvent(ev: AdminEventItem, approved: boolean): void {
    const actionText = approved ? 'PHÊ DUYỆT mở bán show diễn này lên trang chủ' : 'TỪ CHỐI duyệt show diễn này';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText}?`)) return;

    this.actionLoading.set(true);
    this.api.patch(`events/${ev.id}/approve`, { approved }).subscribe({
      next: res => {
        this.actionLoading.set(false);
        alert(res.message || 'Cập nhật trạng thái sự kiện thành công.');
        this.loadEvents();
      },
      error: err => {
        this.actionLoading.set(false);
        alert(err.message || 'Lỗi khi xử lý phê duyệt.');
      }
    });
  }

  submitForApproval(ev: AdminEventItem): void {
    if (!confirm('Gửi show diễn này lên Ban quản trị sàn kiểm duyệt?')) return;

    this.actionLoading.set(true);
    this.api.patch(`events/${ev.id}/submit`, {}).subscribe({
      next: res => {
        this.actionLoading.set(false);
        alert(res.message || 'Đã gửi yêu cầu phê duyệt show diễn.');
        this.loadEvents();
      },
      error: err => {
        this.actionLoading.set(false);
        alert(err.message || 'Lỗi khi gửi yêu cầu phê duyệt.');
      }
    });
  }

  closeEventSales(ev: AdminEventItem): void {
    if (!confirm('Bạn có chắc chắn muốn ĐÓNG CỔNG BÁN VÉ cho show diễn này?')) return;

    this.actionLoading.set(true);
    this.api.patch(`events/${ev.id}/close-sales`, {}).subscribe({
      next: res => {
        this.actionLoading.set(false);
        alert(res.message || 'Đã đóng cổng bán vé.');
        this.loadEvents();
      },
      error: err => {
        this.actionLoading.set(false);
        alert(err.message || 'Lỗi khi đóng cổng bán vé.');
      }
    });
  }

  getSoldTotal(ev: AdminEventItem): number {
    return ev.ticketTiers.reduce((acc, t) => acc + (t.soldQuantity || 0), 0);
  }

  getCapacityTotal(ev: AdminEventItem): number {
    return ev.ticketTiers.reduce((acc, t) => acc + (t.totalQuantity || 0), 0);
  }
}
