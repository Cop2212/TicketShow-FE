import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NavigationService } from '../../../core/services/navigation.service';

interface MenuItem {
  id: string;
  title: string;
  routePath: string;
  icon: string;
  parentId?: string;
  sortOrder: number;
  permissionCode?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-menus',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white">Quản lý Cây Menu Hệ Thống</h2>
          <p class="text-xs text-slate-400">Định nghĩa các mục Menu hiển thị trên thanh Sidebar và ánh xạ mã quyền bảo vệ</p>
        </div>

        <button (click)="loadMenus()" [disabled]="loading()"
          class="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-2">
          <span>🔄</span>
          <span>Làm mới</span>
        </button>
      </div>

      <!-- Grid: 7 cols Menu Table - 5 cols Form -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left: Menu List Table (7 cols) -->
        <div class="lg:col-span-7 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>📑</span>
              <span>Danh mục Menu Hiện Có</span>
            </h3>
            <span class="text-xs text-slate-500 font-mono">{{ menus().length }} mục</span>
          </div>

          @if (loading()) {
            <div class="py-16 text-center text-xs text-slate-500 animate-pulse">
              Đang tải danh mục menu...
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="text-slate-400 uppercase border-b border-slate-800 bg-slate-950/50">
                  <tr>
                    <th class="py-3 px-3 w-12 text-center">STT</th>
                    <th class="py-3 px-4">Tên Menu & Icon</th>
                    <th class="py-3 px-4">Đường dẫn Router</th>
                    <th class="py-3 px-4">Mã quyền bảo vệ</th>
                    <th class="py-3 px-4 text-center">Trạng thái</th>
                    <th class="py-3 px-4 text-right">Sửa</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-300">
                  @for (menu of menus(); track menu.id) {
                    <tr class="hover:bg-slate-800/30 transition">
                      <td class="py-3 px-3 text-center font-mono font-bold text-slate-500">
                        {{ menu.sortOrder }}
                      </td>
                      <td class="py-3 px-4 font-bold text-white flex items-center gap-2">
                        <span class="text-base">{{ menu.icon }}</span>
                        <span>{{ menu.title }}</span>
                      </td>
                      <td class="py-3 px-4 font-mono text-purple-300">
                        {{ menu.routePath }}
                      </td>
                      <td class="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {{ menu.permissionCode || 'Công khai' }}
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          [ngClass]="menu.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'">
                          {{ menu.isActive ? 'BẬT' : 'TẮT' }}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-right">
                        <button (click)="onEditMenu(menu)"
                          class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white transition font-semibold text-[11px] border border-slate-700">
                          ✏️ Sửa
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Right: Add / Edit Form (5 cols) -->
        <div class="lg:col-span-5 p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>{{ editingMenuId ? '✏️' : '➕' }}</span>
              <span>{{ editingMenuId ? 'Cập Nhật Mục Menu' : 'Thêm Mục Menu Mới' }}</span>
            </h3>
            @if (editingMenuId) {
              <button (click)="resetForm()" class="text-xs text-purple-400 hover:text-purple-300 transition">
                + Tạo mới
              </button>
            }
          </div>

          <form [formGroup]="menuForm" (ngSubmit)="onSubmit()" class="space-y-4 text-xs">
            <div>
              <label class="block text-slate-300 font-semibold mb-1">Tên Menu hiển thị *</label>
              <input type="text" formControlName="title" placeholder="VD: Báo cáo Doanh thu"
                class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500" />
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-2">
                <label class="block text-slate-300 font-semibold mb-1">Đường dẫn Route *</label>
                <input type="text" formControlName="routePath" placeholder="VD: /admin/reports"
                  class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Biểu tượng (Icon)</label>
                <input type="text" formControlName="icon" placeholder="VD: 📊, 🎟️"
                  class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-center text-sm focus:outline-none focus:border-purple-500" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Thứ tự sắp xếp</label>
                <input type="number" formControlName="sortOrder"
                  class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Mã quyền bảo vệ</label>
                <input type="text" formControlName="permissionCode" placeholder="VD: events.view"
                  class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500" />
              </div>
            </div>

            <div class="pt-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" formControlName="isActive"
                  class="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-700 focus:ring-purple-500" />
                <span class="text-slate-300 font-semibold">Kích hoạt hiển thị mục menu này</span>
              </label>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button type="submit" [disabled]="menuForm.invalid || saving()"
                class="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-purple-600/30">
                {{ saving() ? 'Đang lưu...' : (editingMenuId ? 'Lưu Thay Đổi' : '+ Thêm Menu') }}
              </button>
              @if (editingMenuId) {
                <button type="button" (click)="resetForm()"
                  class="px-4 py-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 transition">
                  Hủy
                </button>
              }
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class AdminMenusComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly navService = inject(NavigationService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly menus = signal<MenuItem[]>([]);

  editingMenuId: string | null = null;

  readonly menuForm = this.fb.group({
    title: ['', [Validators.required]],
    routePath: ['', [Validators.required]],
    icon: ['📑'],
    sortOrder: [1, [Validators.required]],
    permissionCode: [''],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadMenus();
  }

  loadMenus(): void {
    this.loading.set(true);
    this.api.get<MenuItem[]>('admin/menus').subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.menus.set(res.data);
        }
      },
      error: () => this.loading.set(false)
    });
  }

  onEditMenu(menu: MenuItem): void {
    this.editingMenuId = menu.id;
    this.menuForm.patchValue({
      title: menu.title,
      routePath: menu.routePath,
      icon: menu.icon,
      sortOrder: menu.sortOrder,
      permissionCode: menu.permissionCode || '',
      isActive: menu.isActive
    });
  }

  resetForm(): void {
    this.editingMenuId = null;
    this.menuForm.reset({
      title: '',
      routePath: '',
      icon: '📑',
      sortOrder: this.menus().length + 1,
      permissionCode: '',
      isActive: true
    });
  }

  onSubmit(): void {
    if (this.menuForm.invalid) return;

    this.saving.set(true);
    const val = this.menuForm.getRawValue();

    if (this.editingMenuId) {
      this.api.put(`admin/menus/${this.editingMenuId}`, {
        title: val.title?.trim(),
        routePath: val.routePath?.trim(),
        icon: val.icon?.trim() || '📑',
        sortOrder: Number(val.sortOrder),
        permissionCode: val.permissionCode?.trim() || null,
        isActive: !!val.isActive
      }).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.resetForm();
            this.loadMenus();
            this.navService.loadNavigation();
            alert('Cập nhật menu thành công!');
          }
        },
        error: err => {
          this.saving.set(false);
          alert(err.message || 'Lỗi khi cập nhật menu.');
        }
      });
    } else {
      this.api.post('admin/menus', {
        title: val.title?.trim(),
        routePath: val.routePath?.trim(),
        icon: val.icon?.trim() || '📑',
        parentId: null,
        sortOrder: Number(val.sortOrder),
        permissionCode: val.permissionCode?.trim() || null
      }).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.resetForm();
            this.loadMenus();
            this.navService.loadNavigation();
            alert('Thêm menu mới thành công!');
          }
        },
        error: err => {
          this.saving.set(false);
          alert(err.message || 'Lỗi khi tạo menu.');
        }
      });
    }
  }
}
