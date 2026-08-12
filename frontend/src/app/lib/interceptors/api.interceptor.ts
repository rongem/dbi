import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { ToastService } from '../services/toast.service';
import { AppStore } from '../store/app-store.service';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  constructor(
    private readonly store: AppStore,
    private readonly toastService: ToastService,
  ) {}

/**
 * Adds correlation and CSRF headers to outgoing requests and converts backend HTTP failures into user-visible toast notifications.
 */
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const requestId = typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const csrfToken = this.store.csrfToken();
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

    return next.handle(updatedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        const message = this.extractErrorMessage(error);
        if (error.status === 401 || error.status === 403) {
          this.toastService.show(message, 'warning', 6000);
        } else {
          this.toastService.show(message, 'error', 6000);
        }
        return throwError(() => error);
      }),
    );
  }

/**
 * Extracts the meaningful backend error message from the response payload and falls back to a generic request error when no structured message is available.
 */
  private extractErrorMessage(error: HttpErrorResponse): string {
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
}
