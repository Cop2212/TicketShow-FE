import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

export interface AdminVenueItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  city: string;
  imageUrl?: string;
  totalCapacity: number;
  status: number; // 1: Draft, 2: PendingApproval, 3: Approved, 4: Suspended
  ownerId: string;
  ownerName: string;
  masterLayoutJson?: string;
}

export interface ParsedMasterLayout {
  rows: string[];
  seatsPerRow: number;
  zones: Array<{ name: string; rows: string[]; colorHex?: string }>;
}

@Component({
  selector: 'app-admin-venues',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              🏛️ QUẢN LÝ MẶT BẰNG & ĐỊA ĐIỂM
            </span>
            <span class="text-xs text-slate-400">• {{ venues().length }} địa điểm trên sàn</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white">Địa điểm Tổ chức Sự kiện</h1>
          <p class="text-xs text-slate-400">Kiểm duyệt cơ sở mặt bằng và xem trước sơ đồ ghế vật lý (Master Layout)</p>
        </div>

        <button (click)="loadVenues()" [disabled]="loading()"
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
            placeholder="Tìm theo tên địa điểm, địa chỉ, thành phố..."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500" />
        </div>

        <!-- Status Filter Tabs -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button (click)="selectedStatus.set(null); applyFilter()"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            [ngClass]="selectedStatus() === null ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            Tất cả
          </button>
          <button (click)="selectedStatus.set(3); applyFilter()"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            [ngClass]="selectedStatus() === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            Đã duyệt (Approved)
          </button>
          <button (click)="selectedStatus.set(2); applyFilter()"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            [ngClass]="selectedStatus() === 2 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Chờ duyệt (Pending)
          </button>
          <button (click)="selectedStatus.set(4); applyFilter()"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            [ngClass]="selectedStatus() === 4 ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            Tạm dừng (Suspended)
          </button>
        </div>
      </div>

      <!-- Venues Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th class="py-3.5 px-4">Tên cơ sở</th>
                <th class="py-3.5 px-4">Vị trí & Thành phố</th>
                <th class="py-3.5 px-4">Sức chứa tối đa</th>
                <th class="py-3.5 px-4">Chủ sở hữu mặt bằng</th>
                <th class="py-3.5 px-4">Trạng thái</th>
                <th class="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-300">
              @if (loading()) {
                <tr>
                  <td colspan="6" class="py-12 text-center text-slate-500">
                    <span class="inline-block animate-spin mr-2">🔄</span> Đang nạp danh sách địa điểm...
                  </td>
                </tr>
              } @else if (filteredVenues().length === 0) {
                <tr>
                  <td colspan="6" class="py-12 text-center text-slate-500">
                    Không tìm thấy địa điểm nào phù hợp với bộ lọc.
                  </td>
                </tr>
              } @else {
                @for (v of filteredVenues(); track v.id) {
                  <tr class="hover:bg-slate-800/40 transition">
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-3">
                        <img [src]="v.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200'"
                             alt="Venue" class="w-12 h-10 object-cover rounded-lg shrink-0 border border-slate-800" />
                        <div>
                          <p class="font-bold text-white text-xs">{{ v.name }}</p>
                          <span class="text-[10px] font-mono text-purple-400">/{{ v.slug }}</span>
                        </div>
                      </div>
                    </td>

                    <td class="py-3.5 px-4">
                      <p class="text-white">{{ v.address }}</p>
                      <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 mt-0.5">
                        📍 {{ v.city }}
                      </span>
                    </td>

                    <td class="py-3.5 px-4 whitespace-nowrap">
                      <span class="text-sm font-extrabold text-purple-300">{{ v.totalCapacity | number }}</span>
                      <span class="text-[10px] text-slate-500 ml-1">chỗ ngồi</span>
                    </td>

                    <td class="py-3.5 px-4">
                      <p class="font-semibold text-white">{{ v.ownerName || 'Chủ địa điểm' }}</p>
                      <span class="text-[10px] text-slate-500 font-mono">{{ v.ownerId }}</span>
                    </td>

                    <td class="py-3.5 px-4 whitespace-nowrap">
                      @switch (v.status) {
                        @case (3) {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Đã phê duyệt
                          </span>
                        }
                        @case (2) {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            Chờ phê duyệt
                          </span>
                        }
                        @case (4) {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <span>🚫</span> Tạm dừng
                          </span>
                        }
                        @default {
                          <span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                            Status {{ v.status }}
                          </span>
                        }
                      }
                    </td>

                    <td class="py-3.5 px-4 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end gap-1.5">
                        <!-- View Master Layout Modal Button -->
                        <button (click)="openLayoutModal(v)"
                          class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-[11px] border border-slate-700 transition flex items-center gap-1">
                          <span>🗺️</span>
                          <span>Xem Layout</span>
                        </button>

                        <!-- Admin Approve/Suspend Actions -->
                        @if (v.status !== 3) {
                          <button (click)="approveVenue(v, true)" [disabled]="actionLoading()"
                            class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow">
                            ✅ Duyệt
                          </button>
                        } @else {
                          <button (click)="approveVenue(v, false)" [disabled]="actionLoading()"
                            class="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold text-[11px] border border-rose-800 transition">
                            🚫 Tạm dừng
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Master Layout Preview Modal -->
      @if (activeVenueModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 class="text-base font-extrabold text-white">Sơ đồ ghế Master (Physical Layout)</h3>
                <p class="text-xs text-purple-400">{{ activeVenueModal()?.name }}</p>
              </div>
              <button (click)="activeVenueModal.set(null)" class="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            @if (parsedLayout()) {
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span class="text-slate-500 block">Các hàng ghế:</span>
                    <span class="font-bold text-white">{{ parsedLayout()?.rows?.join(', ') }} ({{ parsedLayout()?.rows?.length }} hàng)</span>
                  </div>
                  <div>
                    <span class="text-slate-500 block">Số ghế mỗi hàng:</span>
                    <span class="font-bold text-white">{{ parsedLayout()?.seatsPerRow }} ghế / hàng</span>
                  </div>
                </div>

                <!-- Zones -->
                <div>
                  <h4 class="text-xs font-bold text-slate-300 mb-2 uppercase">Phân khu tiêu chuẩn (Zones):</h4>
                  <div class="space-y-2">
                    @for (zone of parsedLayout()?.zones; track zone.name) {
                      <div class="p-3 rounded-xl border flex items-center justify-between"
                        [style.backgroundColor]="(zone.colorHex || '#8b5cf6') + '15'"
                        [style.borderColor]="(zone.colorHex || '#8b5cf6') + '40'">
                        <div class="flex items-center gap-2.5">
                          <span class="w-3.5 h-3.5 rounded-full" [style.backgroundColor]="zone.colorHex || '#8b5cf6'"></span>
                          <span class="font-bold text-xs text-white">{{ zone.name }}</span>
                        </div>
                        <span class="text-[11px] text-slate-300">
                          Hàng: <strong class="text-white">{{ zone.rows.join(', ') }}</strong> ({{ zone.rows.length * (parsedLayout()?.seatsPerRow || 10) }} ghế)
                        </span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            } @else {
              <div class="p-4 bg-slate-950 rounded-xl text-center text-xs text-slate-400">
                Địa điểm này chưa có cấu hình JSON sơ đồ ghế Master.
              </div>
            }

            <div class="pt-2 text-right">
              <button (click)="activeVenueModal.set(null)"
                class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition">
                Đóng
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminVenuesComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly actionLoading = signal(false);
  readonly venues = signal<AdminVenueItem[]>([]);
  readonly filteredVenues = signal<AdminVenueItem[]>([]);
  readonly selectedStatus = signal<number | null>(null);
  readonly activeVenueModal = signal<AdminVenueItem | null>(null);
  readonly parsedLayout = signal<ParsedMasterLayout | null>(null);
  searchTerm = '';

  ngOnInit(): void {
    this.loadVenues();
  }

  loadVenues(): void {
    this.loading.set(true);
    // Passing no status filter to get all venues
    this.api.get<AdminVenueItem[]>('venues', { status: '' }).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.venues.set(res.data);
          this.applyFilter();
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    let result = this.venues();
    const st = this.selectedStatus();
    if (st !== null) {
      result = result.filter(v => v.status === st);
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      result = result.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q)
      );
    }

    this.filteredVenues.set(result);
  }

  openLayoutModal(v: AdminVenueItem): void {
    this.activeVenueModal.set(v);
    if (!v.masterLayoutJson) {
      this.api.get<AdminVenueItem>(`venues/${v.id}`).subscribe({
        next: res => {
          if (res.success && res.data?.masterLayoutJson) {
            try {
              this.parsedLayout.set(JSON.parse(res.data.masterLayoutJson));
            } catch {
              this.parsedLayout.set(null);
            }
          }
        }
      });
      return;
    }

    try {
      this.parsedLayout.set(JSON.parse(v.masterLayoutJson));
    } catch {
      this.parsedLayout.set(null);
    }
  }

  approveVenue(v: AdminVenueItem, isApproved: boolean): void {
    const actionText = isApproved ? 'PHÊ DUYỆT cho phép địa điểm này hoạt động trên sàn' : 'TẠM DỪNG hoạt động của địa điểm này';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText}?`)) return;

    this.actionLoading.set(true);
    this.api.patch(`venues/${v.id}/approve`, { isApproved }).subscribe({
      next: res => {
        this.actionLoading.set(false);
        alert(res.message || 'Cập nhật trạng thái địa điểm thành công.');
        this.loadVenues();
      },
      error: err => {
        this.actionLoading.set(false);
        alert(err.message || 'Lỗi khi cập nhật trạng thái địa điểm.');
      }
    });
  }
}
