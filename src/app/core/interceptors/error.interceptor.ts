import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
      }

      const errorMessage = (error.error && typeof error.error === 'object' && 'message' in error.error)
        ? String(error.error.message)
        : error.statusText || 'Đã xảy ra lỗi kết nối đến máy chủ.';

      return throwError(() => new Error(errorMessage));
    })
  );
};
