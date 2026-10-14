import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <div>
        <h2 class="text-2xl font-bold text-white">Tổng quan Hoạt động</h2>
        <p class="text-sm text-slate-400">Số liệu thống kê thời gian thực từ hệ thống bán & soát vé</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">Tổng Show diễn</p>
          <p class="text-3xl font-extrabold text-white">12</p>
          <span class="text-xs text-emerald-400 font-medium">↑ 2 show mới trong tuần</span>
        </div>

        <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">Vé Đã Phân Phối</p>
          <p class="text-3xl font-extrabold text-purple-400">1,450</p>
          <span class="text-xs text-purple-300 font-medium">Đạt 85% tổng capacity</span>
        </div>

        <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">Doanh Thu Tạm Tính</p>
          <p class="text-3xl font-extrabold text-white">580.000.000 ₫</p>
          <span class="text-xs text-emerald-400 font-medium">Đã thanh toán thành công</span>
        </div>

        <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">Tỷ Lệ Check-In Cổng</p>
          <p class="text-3xl font-extrabold text-amber-400">72.4%</p>
          <span class="text-xs text-slate-400 font-medium">1,050 / 1,450 vé đã soát</span>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 class="text-lg font-semibold text-white">Thao tác Nhanh</h3>
        <div class="flex flex-wrap gap-4">
          <button class="px-4 py-2 text-sm font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition">
            + Tạo Show Diễn Mới
          </button>
          <button class="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition">
            Xuất Báo Cáo Doanh Thu
          </button>
          <button class="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition">
            Mở Cổng Soát Vé Trực Tiếp
          </button>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent {}
