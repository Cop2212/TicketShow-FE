import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

export interface AdminOrderItem {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalAmount: number;
  paymentStatus: 'Paid' | 'Pending' | 'Failed' | string;
  paymentGateway?: string;
  transactionId?: string;
  expiresAt: string;
  createdAt: string;
  ticketsCount: number;
  eventTitle?: string;
  seats: string[];
}

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              💳 QUẢN LÝ GIAO DỊCH & DOANH THU
            </span>
            <span class="text-xs text-slate-400">• {{ orders().length }} đơn hàng</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white">Đơn Đặt Vé Toàn Sàn</h1>
          <p class="text-xs text-slate-400">Theo dõi trạng thái thanh toán, ghế đã giữ và doanh thu thời gian thực</p>
        </div>

        <button (click)="loadOrders()" [disabled]="loading()"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-2">
          <span>🔄</span>
          <span>{{ loading() ? 'Đang tải...' : 'Làm mới' }}</span>
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span class="text-[11px] text-slate-400 font-semibold uppercase">Tổng Doanh Thu</span>
          <p class="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1">{{ totalPaidRevenue() | number }} đ</p>
          <span class="text-[10px] text-slate-500">Đã thanh toán thành công</span>
        </div>
        <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span class="text-[11px] text-purple-400 font-semibold uppercase">Vé Đã Bán Ra</span>
          <p class="text-xl sm:text-2xl font-extrabold text-white mt-1">{{ totalPaidTickets() | number }}</p>
          <span class="text-[10px] text-slate-500">Vé E-Ticket hợp lệ</span>
        </div>
        <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span class="text-[11px] text-amber-400 font-semibold uppercase">Đang Giữ Chỗ (5p)</span>
          <p class="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1">{{ pendingOrdersCount() }}</p>
          <span class="text-[10px] text-slate-500">Đơn chờ khách chuyển khoản</span>
        </div>
        <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span class="text-[11px] text-slate-400 font-semibold uppercase">Đơn Hủy / Hết hạn</span>
          <p class="text-xl sm:text-2xl font-extrabold text-rose-400 mt-1">{{ failedOrdersCount() }}</p>
          <span class="text-[10px] text-slate-500">Đã giải phóng ghế lại kho</span>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2 flex-1 min-w-[240px]">
          <span class="text-slate-500 text-sm">🔍</span>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()"
            placeholder="Tìm theo mã đơn ORD, tên khách, email..."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500" />
        </div>

        <!-- Status Filter Tabs -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button (click)="selectedStatus.set(null); applyFilter()"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            [ngClass]="selectedStatus() === null ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            Tất cả
          </button>
          <button (click)="selectedStatus.set('Paid'); applyFilter()"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            [ngClass]="selectedStatus() === 'Paid' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            Đã thanh toán (Paid)
          </button>
          <button (click)="selectedStatus.set('Pending'); applyFilter()"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            [ngClass]="selectedStatus() === 'Pending' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Chờ thanh toán (Pending)
          </button>
          <button (click)="selectedStatus.set('Failed'); applyFilter()"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            [ngClass]="selectedStatus() === 'Failed' ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'">
            Đã hủy (Failed)
          </button>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th class="py-3.5 px-4">Mã đơn & Thời gian</th>
                <th class="py-3.5 px-4">Khách hàng</th>
                <th class="py-3.5 px-4">Sự kiện & Vị trí ghế</th>
                <th class="py-3.5 px-4">Số lượng vé</th>
                <th class="py-3.5 px-4">Tổng tiền</th>
                <th class="py-3.5 px-4">Trạng thái</th>
                <th class="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-300">
              @if (loading()) {
                <tr>
                  <td colspan="7" class="py-12 text-center text-slate-500">
                    <span class="inline-block animate-spin mr-2">🔄</span> Đang nạp danh sách đơn hàng...
                  </td>
                </tr>
              } @else if (filteredOrders().length === 0) {
                <tr>
                  <td colspan="7" class="py-12 text-center text-slate-500">
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              } @else {
                @for (o of filteredOrders(); track o.id) {
                  <tr class="hover:bg-slate-800/40 transition">
                    <!-- Code & Time -->
                    <td class="py-3.5 px-4">
                      <span class="font-mono font-bold text-white text-xs">{{ o.orderCode }}</span>
                      <p class="text-[10px] text-slate-500 mt-0.5">{{ o.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                      @if (o.transactionId) {
                        <p class="text-[9px] font-mono text-purple-400 truncate max-w-[130px]">{{ o.transactionId }}</p>
                      }
                    </td>

                    <!-- Customer -->
                    <td class="py-3.5 px-4">
                      <p class="font-semibold text-white">{{ o.customerName }}</p>
                      <p class="text-[10px] text-slate-400">{{ o.customerEmail }}</p>
                      @if (o.customerPhone) {
                        <p class="text-[10px] text-slate-500">{{ o.customerPhone }}</p>
                      }
                    </td>

                    <!-- Event & Seats -->
                    <td class="py-3.5 px-4">
                      <p class="font-semibold text-white line-clamp-1 max-w-[180px]">{{ o.eventTitle || 'Sự kiện TicketShow' }}</p>
                      <div class="flex flex-wrap gap-1 mt-1">
                        @for (seat of o.seats; track seat) {
                          <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-950 text-purple-300 border border-slate-800">
                            {{ seat }}
                          </span>
                        }
                      </div>
                    </td>

                    <!-- Tickets Count -->
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      <span class="font-bold text-white text-sm">{{ o.ticketsCount }}</span>
                      <span class="text-[10px] text-slate-500 ml-1">vé</span>
                    </td>

                    <!-- Total Amount -->
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      <p class="font-extrabold text-emerald-400 text-xs">{{ o.totalAmount | number }} đ</p>
                      <span class="text-[10px] text-slate-500 uppercase">{{ o.paymentGateway || 'QR Pay' }}</span>
                    </td>

                    <!-- Status -->
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      @switch (o.paymentStatus) {
                        @case ('Paid') {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Đã thanh toán
                          </span>
                        }
                        @case ('Pending') {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            Chờ thanh toán
                          </span>
                        }
                        @case ('Failed') {
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <span>❌</span> Đã hủy
                          </span>
                        }
                        @default {
                          <span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                            {{ o.paymentStatus }}
                          </span>
                        }
                      }
                    </td>

                    <!-- Actions -->
                    <td class="py-3.5 px-4 text-right whitespace-nowrap">
                      @if (o.paymentStatus === 'Pending') {
                        <button (click)="cancelOrder(o)" [disabled]="actionLoading()"
                          class="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold text-[11px] border border-rose-800 transition">
                          Hủy giữ chỗ
                        </button>
                      } @else {
                        <span class="text-[11px] text-slate-500 italic">--</span>
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
export class AdminOrdersComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(false);
  readonly actionLoading = signal(false);
  readonly orders = signal<AdminOrderItem[]>([]);
  readonly filteredOrders = signal<AdminOrderItem[]>([]);
  readonly selectedStatus = signal<string | null>(null);
  searchTerm = '';

  // Stats computed
  readonly totalPaidRevenue = computed(() =>
    this.orders()
      .filter(o => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  );

  readonly totalPaidTickets = computed(() =>
    this.orders()
      .filter(o => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + (o.ticketsCount || 0), 0)
  );

  readonly pendingOrdersCount = computed(() =>
    this.orders().filter(o => o.paymentStatus === 'Pending').length
  );

  readonly failedOrdersCount = computed(() =>
    this.orders().filter(o => o.paymentStatus === 'Failed').length
  );

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.api.get<AdminOrderItem[]>('orders').subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.orders.set(res.data);
          this.applyFilter();
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    let result = this.orders();
    const st = this.selectedStatus();
    if (st !== null) {
      result = result.filter(o => o.paymentStatus.toLowerCase() === st.toLowerCase());
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      result = result.filter(o =>
        o.orderCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        (o.eventTitle && o.eventTitle.toLowerCase().includes(q))
      );
    }

    this.filteredOrders.set(result);
  }

  cancelOrder(o: AdminOrderItem): void {
    if (!confirm(`Bạn có chắc chắn muốn HỦY đơn giữ chỗ ${o.orderCode}? Ghế sẽ được giải phóng lập tức.`)) return;

    this.actionLoading.set(true);
    this.api.delete(`orders/${o.orderCode}/cancel`).subscribe({
      next: res => {
        this.actionLoading.set(false);
        alert(res.message || 'Đã hủy giữ chỗ thành công.');
        this.loadOrders();
      },
      error: err => {
        this.actionLoading.set(false);
        alert(err.message || 'Lỗi khi hủy đơn hàng.');
      }
    });
  }
}
