import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface RoleItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  userCount: number;
  permissionCount: number;
}

interface ModulePermissions {
  module: string;
  permissions: Array<{
    id: string;
    code: string;
    name: string;
    description?: string;
  }>;
}

interface MenuItem {
  id: string;
  title: string;
  routePath: string;
  icon: string;
  sortOrder: number;
  permissionCode?: string;
}

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white">Quản lý Vai trò & Ma trận Phân quyền</h2>
          <p class="text-xs text-slate-400">Định nghĩa vai trò, phân quyền theo từng hành động và phân quyền menu hiển thị</p>
        </div>

        <button (click)="loadAllData()" [disabled]="loading()"
          class="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-2">
          <span>🔄</span>
          <span>Làm mới</span>
        </button>
      </div>

      <!-- Main Layout: 4 cols Left (Roles) - 8 cols Right (Matrix) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left: Roles List & Add Role Form (4 cols) -->
        <div class="lg:col-span-4 space-y-6">
          <!-- Roles List -->
          <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>🛡️</span>
              <span>Danh mục Vai trò</span>
            </h3>

            <div class="space-y-2">
              @for (role of roles(); track role.id) {
                <div (click)="selectRole(role)"
                  class="p-4 rounded-2xl border transition cursor-pointer"
                  [ngClass]="selectedRole()?.id === role.id ? 'bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-600/10' : 'bg-slate-950 border-slate-800 hover:border-slate-700'">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-extrabold text-white">{{ role.name }}</span>
                    @if (role.isSystem) {
                      <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">HỆ THỐNG</span>
                    }
                  </div>
                  <div class="text-[11px] text-purple-400 font-mono">{{ role.code }}</div>
                  <p class="text-[11px] text-slate-400 mt-1 line-clamp-2">{{ role.description || 'Chưa có mô tả' }}</p>
                  <div class="flex items-center gap-3 mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                    <span>👥 {{ role.userCount }} tài khoản</span>
                    <span>•</span>
                    <span>🔑 {{ role.permissionCount }} quyền</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Add Custom Role -->
          <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>➕</span>
              <span>Tạo Vai trò Mới</span>
            </h3>

            <form [formGroup]="roleForm" (ngSubmit)="onCreateRole()" class="space-y-3 text-xs">
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Mã vai trò (Code) *</label>
                <input type="text" formControlName="code" placeholder="VD: AUDITOR, SUPPORT..."
                  class="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Tên hiển thị *</label>
                <input type="text" formControlName="name" placeholder="VD: Kiểm toán viên tài chính"
                  class="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Mô tả nhiệm vụ</label>
                <textarea rows="2" formControlName="description" placeholder="Ghi chú trách nhiệm vai trò..."
                  class="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"></textarea>
              </div>

              <button type="submit" [disabled]="roleForm.invalid || creatingRole()"
                class="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-purple-600/30">
                {{ creatingRole() ? 'Đang tạo...' : '+ Thêm Vai trò' }}
              </button>
            </form>
          </div>
        </div>

        <!-- Right: Matrix Config (8 cols) -->
        <div class="lg:col-span-8 space-y-6">
          @if (selectedRole()) {
            <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
              <!-- Selected Role Info & Tabs -->
              <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400">Đang cấu hình:</span>
                    <h3 class="text-lg font-extrabold text-white">{{ selectedRole()?.name }}</h3>
                    <span class="text-xs text-purple-400 font-mono">({{ selectedRole()?.code }})</span>
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5">{{ selectedRole()?.description }}</p>
                </div>

                <!-- Tabs -->
                <div class="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button (click)="activeTab = 'permissions'"
                    class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition"
                    [ngClass]="activeTab === 'permissions' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'">
                    🔑 Ma trận Quyền
                  </button>
                  <button (click)="activeTab = 'menus'"
                    class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition"
                    [ngClass]="activeTab === 'menus' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'">
                    📑 Phân quyền Menu
                  </button>
                </div>
              </div>

              <!-- TAB 1: PERMISSION MATRIX -->
              @if (activeTab === 'permissions') {
                <div class="space-y-6">
                  <div class="flex items-center justify-between">
                    <p class="text-xs text-slate-400">
                      Tích chọn các quyền mà vai trò <strong>{{ selectedRole()?.name }}</strong> được phép thực hiện:
                    </p>
                    <button (click)="savePermissions()" [disabled]="saving()"
                      class="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition shadow-lg shadow-emerald-600/30">
                      {{ saving() ? 'Đang lưu...' : '💾 Lưu Ma trận Quyền' }}
                    </button>
                  </div>

                  <!-- Modules Grouping -->
                  <div class="space-y-4">
                    @for (mod of modulePermissions(); track mod.module) {
                      <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3">
                        <div class="flex items-center justify-between pb-2 border-b border-slate-900">
                          <span class="text-xs font-extrabold text-purple-300 uppercase tracking-wider">
                            Phân hệ {{ mod.module }}
                          </span>
                          <button (click)="toggleAllInModule(mod)" class="text-[11px] text-slate-400 hover:text-white transition">
                            Tất cả / Bỏ chọn
                          </button>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          @for (p of mod.permissions; track p.id) {
                            <label class="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700 cursor-pointer transition">
                              <input type="checkbox" [checked]="isPermissionAssigned(p.id)" (change)="togglePermission(p.id)"
                                class="mt-0.5 w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-700 focus:ring-purple-500" />
                              <div class="flex-1">
                                <p class="text-xs font-bold text-white">{{ p.name }}</p>
                                <p class="text-[10px] text-slate-500 font-mono">{{ p.code }}</p>
                              </div>
                            </label>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- TAB 2: MENU ASSIGNMENT -->
              @if (activeTab === 'menus') {
                <div class="space-y-6">
                  <div class="flex items-center justify-between">
                    <p class="text-xs text-slate-400">
                      Tích chọn các mục Menu hiển thị trên thanh Sidebar cho vai trò <strong>{{ selectedRole()?.name }}</strong>:
                    </p>
                    <button (click)="saveRoleMenus()" [disabled]="saving()"
                      class="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition shadow-lg shadow-emerald-600/30">
                      {{ saving() ? 'Đang lưu...' : '💾 Lưu Menu Vai trò' }}
                    </button>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    @for (menu of allMenus(); track menu.id) {
                      <label class="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-purple-500/50 cursor-pointer transition">
                        <input type="checkbox" [checked]="isMenuAssigned(menu.id)" (change)="toggleMenu(menu.id)"
                          class="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500" />
                        <span class="text-lg">{{ menu.icon }}</span>
                        <div class="flex-1">
                          <p class="text-xs font-bold text-white">{{ menu.title }}</p>
                          <p class="text-[10px] text-slate-500 font-mono">{{ menu.routePath }}</p>
                        </div>
                      </label>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="p-16 bg-slate-900 border border-slate-800 rounded-3xl text-center text-slate-500 text-xs">
              Vui lòng chọn một Vai trò ở cột bên trái để cấu hình Ma trận Phân quyền & Menu.
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class AdminRolesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly creatingRole = signal(false);
  readonly saving = signal(false);

  readonly roles = signal<RoleItem[]>([]);
  readonly selectedRole = signal<RoleItem | null>(null);
  readonly modulePermissions = signal<ModulePermissions[]>([]);
  readonly allMenus = signal<MenuItem[]>([]);

  activeTab: 'permissions' | 'menus' = 'permissions';

  // Dynamic Sets for assigned IDs
  assignedPermissionIds = new Set<string>();
  assignedMenuIds = new Set<string>();

  readonly roleForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
    name: ['', [Validators.required]],
    description: ['']
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading.set(true);
    this.api.get<RoleItem[]>('admin/roles').subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.roles.set(res.data);
          if (res.data.length > 0 && !this.selectedRole()) {
            this.selectRole(res.data[0]);
          }
        }
      },
      error: () => this.loading.set(false)
    });

    this.api.get<ModulePermissions[]>('admin/permissions').subscribe({
      next: res => {
        if (res.success && res.data) {
          this.modulePermissions.set(res.data);
        }
      }
    });

    this.api.get<MenuItem[]>('admin/menus').subscribe({
      next: res => {
        if (res.success && res.data) {
          this.allMenus.set(res.data);
        }
      }
    });
  }

  selectRole(role: RoleItem): void {
    this.selectedRole.set(role);
    this.loadRolePermissions(role.id);
    this.loadRoleMenus(role.id);
  }

  private loadRolePermissions(roleId: string): void {
    this.api.get<string[]>(`admin/roles/${roleId}/permissions`).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.assignedPermissionIds = new Set<string>(res.data);
        }
      }
    });
  }

  private loadRoleMenus(roleId: string): void {
    this.api.get<string[]>(`admin/roles/${roleId}/menus`).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.assignedMenuIds = new Set<string>(res.data);
        }
      }
    });
  }

  isPermissionAssigned(pId: string): boolean {
    return this.assignedPermissionIds.has(pId);
  }

  togglePermission(pId: string): void {
    if (this.assignedPermissionIds.has(pId)) {
      this.assignedPermissionIds.delete(pId);
    } else {
      this.assignedPermissionIds.add(pId);
    }
  }

  toggleAllInModule(mod: ModulePermissions): void {
    const allIds = mod.permissions.map(p => p.id);
    const allChecked = allIds.every(id => this.assignedPermissionIds.has(id));
    if (allChecked) {
      allIds.forEach(id => this.assignedPermissionIds.delete(id));
    } else {
      allIds.forEach(id => this.assignedPermissionIds.add(id));
    }
  }

  savePermissions(): void {
    const role = this.selectedRole();
    if (!role) return;

    this.saving.set(true);
    const permissionIds = Array.from(this.assignedPermissionIds);

    this.api.put(`admin/roles/${role.id}/permissions`, { permissionIds }).subscribe({
      next: res => {
        this.saving.set(false);
        if (res.success) {
          alert('Lưu Ma trận Phân quyền thành công!');
          this.loadAllData();
        }
      },
      error: err => {
        this.saving.set(false);
        alert(err.message || 'Lỗi khi lưu phân quyền.');
      }
    });
  }

  isMenuAssigned(menuId: string): boolean {
    return this.assignedMenuIds.has(menuId);
  }

  toggleMenu(menuId: string): void {
    if (this.assignedMenuIds.has(menuId)) {
      this.assignedMenuIds.delete(menuId);
    } else {
      this.assignedMenuIds.add(menuId);
    }
  }

  saveRoleMenus(): void {
    const role = this.selectedRole();
    if (!role) return;

    this.saving.set(true);
    const menuIds = Array.from(this.assignedMenuIds);

    this.api.put(`admin/roles/${role.id}/menus`, { menuIds }).subscribe({
      next: res => {
        this.saving.set(false);
        if (res.success) {
          alert('Lưu cấu hình Menu hiển thị cho vai trò thành công!');
          this.loadAllData();
        }
      },
      error: err => {
        this.saving.set(false);
        alert(err.message || 'Lỗi khi lưu menu.');
      }
    });
  }

  onCreateRole(): void {
    if (this.roleForm.invalid) return;

    this.creatingRole.set(true);
    const val = this.roleForm.getRawValue();

    this.api.post<RoleItem>('admin/roles', {
      code: val.code?.trim().toUpperCase(),
      name: val.name?.trim(),
      description: val.description?.trim()
    }).subscribe({
      next: res => {
        this.creatingRole.set(false);
        if (res.success && res.data) {
          this.roleForm.reset();
          this.loadAllData();
          alert(`Tạo vai trò ${res.data.name} thành công!`);
        }
      },
      error: err => {
        this.creatingRole.set(false);
        alert(err.message || 'Lỗi khi tạo vai trò.');
      }
    });
  }
}
