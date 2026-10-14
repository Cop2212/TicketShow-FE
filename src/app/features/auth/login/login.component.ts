import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div class="max-w-md w-full space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
        <div class="text-center space-y-2">
          <h2 class="text-3xl font-extrabold text-white">Đăng nhập</h2>
          <p class="text-sm text-slate-400">Truy cập tài khoản TicketShow của bạn</p>
        </div>

        @if (errorMessage()) {
          <div class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg text-sm text-center">
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Email</label>
            <input type="email" formControlName="email"
              class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition text-sm"
              placeholder="name@example.com" />
            @if (form.get('email')?.touched && form.get('email')?.invalid) {
              <p class="text-xs text-rose-400 mt-1">Vui lòng nhập email hợp lệ</p>
            }
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Mật khẩu</label>
            <input type="password" formControlName="password"
              class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition text-sm"
              placeholder="••••••••" />
            @if (form.get('password')?.touched && form.get('password')?.invalid) {
              <p class="text-xs text-rose-400 mt-1">Mật khẩu không được để trống</p>
            }
          </div>

          <button type="submit" [disabled]="form.invalid || loading()"
            class="w-full py-3 px-4 rounded-xl font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition shadow-lg shadow-purple-600/30 text-sm">
            {{ loading() ? 'Đang xác thực...' : 'Đăng nhập' }}
          </button>
        </form>

        <div class="text-center text-xs text-slate-400 pt-2">
          Chưa có tài khoản?
          <a routerLink="/auth/register" class="text-purple-400 hover:text-purple-300 font-medium">Đăng ký ngay</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();
    if (!email || !password) return;

    this.authService.login({ email, password }).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: err => {
        this.loading.set(false);
        this.errorMessage.set(err.message || 'Email hoặc mật khẩu không chính xác.');
      }
    });
  }
}
