import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  roleNames: string[];
  roleIds: string[];
}

interface RoleItem {
  id: string;
  code: string;
  name: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white">Quản lý Tài khoản & Phân quyền</h2>
          <p class="text-xs text-slate-400">Danh sách người dùng, trạng thái kích hoạt và gán vai trò quyền hạn</p>
        </div>

        <div class="flex items-center gap-3">
          <button (click)="loadUsers()" [disabled]="loading()"
            class="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-2">
            <span>🔄</span>
            <span>{{ loading() ? 'Đang tải...' : 'Làm mới' }}</span>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
        <div class="flex-1 min-w-[240px]">
          <input type="text" [(ngModel)]="searchTerm" (keyup.enter)="loadUsers()" placeholder="Tìm theo Email, Họ tên hoặc Số điện thoại..."
            class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500" />
        </div>
        <div class="flex items-center gap-3">
          <select [(ngModel)]="selectedRoleFilter" (change)="loadUsers()"
            class="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500">
            <option value="">-- Tất cả vai trò --</option>
            <option value="SUPER_ADMIN">Quản trị viên cấp cao</option>
            <option value="ORGANIZER">Ban tổ chức</option>
            <option value="STAFF">Nhân viên soát vé</option>
            <option value="CUSTOMER">Khách hàng</option>
          </select>
          <button (click)="loadUsers()" class="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition">
            Tìm kiếm
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
        @if (loading()) {
          <div class="py-16 text-center text-xs text-slate-500 animate-pulse">
            Đang tải dữ liệu tài khoản...
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-slate-400 uppercase border-b border-slate-800 bg-slate-950/50">
                <tr>
                  <th class="py-3 px-4">Họ và Tên</th>
                  <th class="py-3 px-4">Email / SĐT</th>
                  <th class="py-3 px-4">Vai trò đảm nhiệm</th>
                  <th class="py-3 px-4 text-center">Trạng thái</th>
                  <th class="py-3 px-4 text-center">Ngày tạo</th>
                  <th class="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                @for (user of users(); track user.id) {
                  <tr class="hover:bg-slate-800/30 transition">
                    <td class="py-3.5 px-4 font-bold text-white">
                      {{ user.fullName }}
                    </td>
                    <td class="py-3.5 px-4">
                      <div class="text-slate-200">{{ user.email }}</div>
                      <div class="text-[11px] text-slate-500 font-mono">{{ user.phoneNumber || 'Chưa cập nhật' }}</div>
                    </td>
                    <td class="py-3.5 px-4">
                      <div class="flex flex-wrap gap-1">
                        @for (role of user.roleNames; track role) {
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {{ role }}
                          </span>
                        }
                        @if (user.roleNames.length === 0) {
                          <span class="text-slate-500 italic text-[11px]">Chưa gán vai trò</span>
                        }
                      </div>
                    </td>
                    <td class="py-3.5 px-4 text-center">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-bold"
                        [ngClass]="user.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'">
                        {{ user.isActive ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA' }}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-center font-mono text-slate-500 text-[11px]">
                      {{ user.createdAt | date:'dd/MM/yyyy' }}
                    </td>
                    <td class="py-3.5 px-4 text-right space-x-2">
                      <button (click)="openRoleModal(user)"
                        class="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white transition font-semibold text-[11px] border border-purple-500/30">
                        🛡️ Gán Vai trò
                      </button>
                      <button (click)="toggleStatus(user)"
                        class="px-2.5 py-1 rounded-lg font-semibold text-[11px] transition border"
                        [ngClass]="user.isActive ? 'bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border-rose-800' : 'bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800'">
                        {{ user.isActive ? 'Khóa' : 'Mở khóa' }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Modal Assign Roles -->
      @if (activeUserModal()) {
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <span>🛡️</span>
                <span>Phân quyền cho người dùng</span>
              </h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs space-y-1">
              <p class="text-slate-400">Tài khoản: <strong class="text-white">{{ activeUserModal()?.fullName }}</strong></p>
              <p class="text-slate-400">Email: <strong class="text-purple-300 font-mono">{{ activeUserModal()?.email }}</strong></p>
            </div>

            <div class="space-y-3">
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider">Chọn các vai trò đảm nhiệm:</label>
              <div class="space-y-2 max-h-56 overflow-y-auto">
                @for (role of availableRoles(); track role.id) {
                  <label class="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-purple-500/50 cursor-pointer transition">
                    <div>
                      <p class="text-xs font-bold text-white">{{ role.name }}</p>
                      <p class="text-[10px] text-slate-500 font-mono">{{ role.code }}</p>
                    </div>
                    <input type="checkbox" [checked]="isRoleSelected(role.id)" (change)="toggleRoleSelection(role.id)"
                      class="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500" />
                  </label>
                }
              </div>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button (click)="saveUserRoles()" [disabled]="savingRoles()"
                class="flex-1 py-2.5 px-4 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white text-xs transition shadow-lg shadow-purple-600/30">
                {{ savingRoles() ? 'Đang lưu...' : 'Lưu Phân quyền' }}
              </button>
              <button (click)="closeModal()"
                class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
                Đóng
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(false);
  readonly savingRoles = signal(false);
  readonly users = signal<UserItem[]>([]);
  readonly availableRoles = signal<RoleItem[]>([]);

  searchTerm = '';
  selectedRoleFilter = '';

  readonly activeUserModal = signal<UserItem | null>(null);
  selectedRoleIds = new Set<string>();

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (this.searchTerm.trim()) params['search'] = this.searchTerm.trim();
    if (this.selectedRoleFilter) params['roleCode'] = this.selectedRoleFilter;

    this.api.get<UserItem[]>('admin/users', params).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.users.set(res.data);
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private loadRoles(): void {
    this.api.get<RoleItem[]>('admin/roles').subscribe({
      next: res => {
        if (res.success && res.data) {
          this.availableRoles.set(res.data);
        }
      }
    });
  }

  toggleStatus(user: UserItem): void {
    const nextStatus = !user.isActive;
    const actionName = nextStatus ? 'mở khóa' : 'khóa';
    if (!confirm(`Bạn có chắc muốn ${actionName} tài khoản ${user.email}?`)) return;

    this.api.put(`admin/users/${user.id}/status`, { isActive: nextStatus }).subscribe({
      next: res => {
        if (res.success) {
          user.isActive = nextStatus;
          alert(res.message || 'Cập nhật trạng thái thành công.');
        }
      },
      error: err => {
        alert(err.message || 'Lỗi khi cập nhật trạng thái.');
      }
    });
  }

  openRoleModal(user: UserItem): void {
    this.activeUserModal.set(user);
    this.selectedRoleIds = new Set<string>(user.roleIds);
  }

  closeModal(): void {
    this.activeUserModal.set(null);
  }

  isRoleSelected(roleId: string): boolean {
    return this.selectedRoleIds.has(roleId);
  }

  toggleRoleSelection(roleId: string): void {
    if (this.selectedRoleIds.has(roleId)) {
      this.selectedRoleIds.delete(roleId);
    } else {
      this.selectedRoleIds.add(roleId);
    }
  }

  saveUserRoles(): void {
    const user = this.activeUserModal();
    if (!user) return;

    this.savingRoles.set(true);
    const roleIds = Array.from(this.selectedRoleIds);

    this.api.put(`admin/users/${user.id}/roles`, { roleIds }).subscribe({
      next: res => {
        this.savingRoles.set(false);
        if (res.success) {
          this.closeModal();
          this.loadUsers();
          alert('Cập nhật phân quyền tài khoản thành công!');
        }
      },
      error: err => {
        this.savingRoles.set(false);
        alert(err.message || 'Lỗi khi cập nhật vai trò.');
      }
    });
  }
}
