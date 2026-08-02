import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { AppStore } from '../store/app-store.service';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  constructor(private readonly store: AppStore) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const message = this.extractErrorMessage(error);
        this.store.setError(message);
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
