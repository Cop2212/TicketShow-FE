import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface DashboardStats {
  totalEvents: number;
  publishedEvents: number;
  totalSeats: number;
  totalTicketsSold: number;
  totalRevenue: number;
  overallCheckInRate: number;
  totalCheckedInTickets: number;
  recentEvents: Array<{
    id: string;
    title: string;
    slug: string;
    venueName: string;
    startTime: string;
    status: number;
    totalSeats: number;
    soldSeats: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    orderId: string;
    orderCode: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
    ticketCount: number;
  }>;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8 pb-12">
      <!-- Title & Action Button -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white">Tổng quan Hoạt động</h2>
          <p class="text-xs text-slate-400">Số liệu tài chính & kiểm soát vé thời gian thực từ cơ sở dữ liệu PostgreSQL</p>
        </div>

        <div class="flex items-center gap-3">
          <a routerLink="/admin/events/create"
            class="px-4 py-2.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center gap-2">
            <span>+</span>
            <span>Tạo Show Diễn Mới</span>
          </a>
          <a routerLink="/admin/scanner"
            class="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-2">
            <span>📷</span>
            <span>Cổng soát vé</span>
          </a>
        </div>
      </div>

      @if (loading()) {
        <div class="py-20 text-center text-slate-500 text-sm">
          Đang tổng hợp số liệu thời gian thực từ CSDL...
        </div>
      } @else if (stats()) {
        <!-- Stats Grid (4 KPI Cards) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Card 1: Doanh thu thực -->
          <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doanh Thu Đã Thu</p>
            <p class="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {{ stats()?.totalRevenue | number:'1.0-0' }} ₫
            </p>
            <span class="text-xs text-slate-400 font-medium block">
              Giao dịch thanh toán thành công
            </span>
          </div>

          <!-- Card 2: Vé bán ra -->
          <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vé Đã Bán / Tổng Ghế</p>
            <p class="text-2xl sm:text-3xl font-extrabold text-purple-400">
              {{ stats()?.totalTicketsSold }} <span class="text-base text-slate-500 font-normal">/ {{ stats()?.totalSeats }}</span>
            </p>
            <span class="text-xs text-purple-300 font-medium block">
              {{ getFillRate() }}% công suất khán phòng
            </span>
          </div>

          <!-- Card 3: Tỷ lệ Check-in -->
          <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tỷ Lệ Soát Vé Tại Cổng</p>
            <p class="text-2xl sm:text-3xl font-extrabold text-amber-400">
              {{ stats()?.overallCheckInRate }}%
            </p>
            <span class="text-xs text-slate-400 font-medium block">
              {{ stats()?.totalCheckedInTickets }} / {{ stats()?.totalTicketsSold }} vé đã qua cổng
            </span>
          </div>

          <!-- Card 4: Tổng Show diễn -->
          <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Sự Kiện</p>
            <p class="text-2xl sm:text-3xl font-extrabold text-white">
              {{ stats()?.totalEvents }}
            </p>
            <span class="text-xs text-emerald-400 font-medium block">
              {{ stats()?.publishedEvents }} show đang mở bán vé
            </span>
          </div>
        </div>

        <!-- Recent Events Table -->
        <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div>
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span>🎪</span>
                <span>Danh Sách Show Diễn Gần Đây</span>
              </h3>
              <p class="text-xs text-slate-400">Theo dõi tiến độ bán vé và doanh thu từng chương trình</p>
            </div>
            <a routerLink="/admin/events/create" class="text-xs font-semibold text-purple-400 hover:text-purple-300 transition">
              + Tạo sự kiện mới
            </a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-slate-400 uppercase border-b border-slate-800 bg-slate-950/50">
                <tr>
                  <th class="py-3 px-4">Tên Show</th>
                  <th class="py-3 px-4">Địa điểm</th>
                  <th class="py-3 px-4">Khởi chiếu</th>
                  <th class="py-3 px-4 text-center">Tỷ lệ lấp đầy</th>
                  <th class="py-3 px-4 text-right">Doanh thu</th>
                  <th class="py-3 px-4 text-center">Trạng thái</th>
                  <th class="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                @for (ev of stats()?.recentEvents; track ev.id) {
                  <tr class="hover:bg-slate-800/30 transition">
                    <td class="py-3.5 px-4 font-bold text-white max-w-xs truncate">
                      {{ ev.title }}
                    </td>
                    <td class="py-3.5 px-4 text-slate-400">
                      {{ ev.venueName }}
                    </td>
                    <td class="py-3.5 px-4 font-mono">
                      {{ ev.startTime | date:'dd/MM/yyyy HH:mm' }}
                    </td>
                    <td class="py-3.5 px-4 text-center">
                      <span class="inline-block px-2.5 py-0.5 rounded-full font-bold"
                        [ngClass]="ev.soldSeats > 0 ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : 'bg-slate-800 text-slate-400'">
                        {{ ev.soldSeats }} / {{ ev.totalSeats }} ghế
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right font-bold text-emerald-400 font-mono">
                      {{ ev.revenue | number:'1.0-0' }} ₫
                    </td>
                    <td class="py-3.5 px-4 text-center">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-bold"
                        [ngClass]="{
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': ev.status === 2,
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20': ev.status === 3,
                          'bg-slate-800 text-slate-400': ev.status === 1 || ev.status === 4
                        }">
                        {{ ev.status === 2 ? 'ĐANG MỞ BÁN' : (ev.status === 3 ? 'ĐÃ ĐÓNG CỔNG' : 'BẢN NHÁP') }}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <a [routerLink]="['/events', ev.slug]"
                        class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white transition font-semibold text-[11px] inline-flex items-center gap-1">
                        <span>Sơ đồ ghế</span>
                        <span>→</span>
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Orders Table -->
        <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div class="pb-2 border-b border-slate-800/80">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <span>💳</span>
              <span>Giao Dịch Đặt Vé Gần Đây</span>
            </h3>
            <p class="text-xs text-slate-400">Theo dõi các đơn hàng được thanh toán trong hệ thống</p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-slate-400 uppercase border-b border-slate-800 bg-slate-950/50">
                <tr>
                  <th class="py-3 px-4">Mã đơn</th>
                  <th class="py-3 px-4">Khách hàng</th>
                  <th class="py-3 px-4">Email</th>
                  <th class="py-3 px-4 text-center">Số lượng vé</th>
                  <th class="py-3 px-4 text-right">Tổng tiền</th>
                  <th class="py-3 px-4 text-center">Trạng thái</th>
                  <th class="py-3 px-4 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                @for (order of stats()?.recentOrders; track order.orderId) {
                  <tr class="hover:bg-slate-800/30 transition">
                    <td class="py-3.5 px-4 font-mono font-bold text-purple-300">
                      {{ order.orderCode }}
                    </td>
                    <td class="py-3.5 px-4 font-semibold text-white">
                      {{ order.customerName }}
                    </td>
                    <td class="py-3.5 px-4 text-slate-400">
                      {{ order.customerEmail }}
                    </td>
                    <td class="py-3.5 px-4 text-center font-bold">
                      {{ order.ticketCount }} vé
                    </td>
                    <td class="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {{ order.totalAmount | number:'1.0-0' }} ₫
                    </td>
                    <td class="py-3.5 px-4 text-center">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                        [ngClass]="{
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': order.paymentStatus === 'Paid',
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20': order.paymentStatus === 'Pending',
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20': order.paymentStatus === 'Failed'
                        }">
                        {{ order.paymentStatus }}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right text-slate-500 font-mono">
                      {{ order.createdAt | date:'HH:mm dd/MM' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly stats = signal<DashboardStats | null>(null);

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    this.api.get<DashboardStats>('admin/dashboard-stats').subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.stats.set(res.data);
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getFillRate(): number {
    const s = this.stats();
    if (!s || s.totalSeats === 0) return 0;
    return Math.round((s.totalTicketsSold / s.totalSeats) * 100);
  }
}
