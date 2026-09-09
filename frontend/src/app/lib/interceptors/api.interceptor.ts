import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { ToastService } from '../services/toast.service';
import { AppStore } from '../store/app-store.service';

/**
 * Adds correlation and CSRF headers to outgoing requests and converts backend HTTP failures into user-visible toast notifications.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
    const store = inject(AppStore);
    const toastService = inject(ToastService);
    const requestId = typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const csrfToken = store.csrfToken();
    const method = req.method.toUpperCase();
    const isUnsafeMethod = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';

    const headers: Record<string, string> = {
      'x-request-id': requestId,
    };
    if (isUnsafeMethod && csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    const updatedRequest = req.clone({
      setHeaders: headers,
    });

    return next(updatedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        const message = extractErrorMessage(error);
        if (error.status === 401 || error.status === 403) {
          toastService.show(message, 'warning', 6000);
        } else {
          toastService.show(message, 'error', 6000);
        }
        return throwError(() => error);
      }),
    );
  };

/**
 * Extracts the meaningful backend error message from the response payload and falls back to a generic request error when no structured message is available.
 */
function extractErrorMessage(error: HttpErrorResponse): string {
    const payload = error.error as { error?: { message?: string } } | undefined;
    if (payload?.error?.message) {
      return payload.error.message;
    }

    if (typeof error.error === 'string' && error.error.length > 0) {
      return error.error;
    }

    if (error.message) {
      return error.message;
    }

    return 'Request failed.';
}
