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

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const message = this.extractErrorMessage(error);
        if (error.status === 401 || error.status === 403) {
          this.store.setError(message);
          this.toastService.show(message, 'warning', 6000);
        } else {
          this.store.setError(message);
          this.toastService.show(message, 'error', 6000);
        }
        return throwError(() => error);
      }),
    );
  }

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
