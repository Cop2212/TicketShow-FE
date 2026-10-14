import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div class="max-w-md w-full space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
        <div class="text-center space-y-2">
          <h2 class="text-3xl font-extrabold text-white">Đăng ký tài khoản</h2>
          <p class="text-sm text-slate-400">Tham gia hệ thống phân phối vé TicketShow</p>
        </div>

        @if (errorMessage()) {
          <div class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg text-sm text-center">
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Họ và tên</label>
            <input type="text" formControlName="fullName"
              class="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition text-sm"
              placeholder="Nguyễn Văn A" />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Email</label>
            <input type="email" formControlName="email"
              class="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition text-sm"
              placeholder="name@example.com" />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Số điện thoại</label>
            <input type="tel" formControlName="phoneNumber"
              class="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition text-sm"
              placeholder="0912345678" />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Mật khẩu</label>
            <input type="password" formControlName="password"
              class="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition text-sm"
              placeholder="Ít nhất 6 ký tự" />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Vai trò tài khoản</label>
            <select formControlName="role"
              class="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-purple-500 transition text-sm">
              <option [ngValue]="UserRole.Customer">Khách hàng mua vé</option>
              <option [ngValue]="UserRole.Staff">Nhân viên soát vé (Staff)</option>
              <option [ngValue]="UserRole.Organizer">Ban tổ chức show (Organizer)</option>
              <option [ngValue]="UserRole.Admin">Quản trị viên (Admin)</option>
            </select>
          </div>

          <button type="submit" [disabled]="form.invalid || loading()"
            class="w-full py-3 px-4 rounded-xl font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition shadow-lg shadow-purple-600/30 text-sm mt-2">
            {{ loading() ? 'Đang khởi tạo...' : 'Tạo tài khoản' }}
          </button>
        </form>

        <div class="text-center text-xs text-slate-400 pt-2">
          Đã có tài khoản?
          <a routerLink="/auth/login" class="text-purple-400 hover:text-purple-300 font-medium">Đăng nhập ngay</a>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly UserRole = UserRole;
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: [UserRole.Customer, [Validators.required]]
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const val = this.form.getRawValue();
    if (!val.email || !val.password || !val.fullName) return;

    this.authService.register({
      fullName: val.fullName,
      email: val.email,
      phoneNumber: val.phoneNumber ?? undefined,
      password: val.password,
      role: val.role ?? UserRole.Customer
    }).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.router.navigate(['/']);
        }
      },
      error: err => {
        this.loading.set(false);
        this.errorMessage.set(err.message || 'Không thể tạo tài khoản. Vui lòng kiểm tra lại.');
      }
    });
  }
}
