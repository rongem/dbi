import { signal } from '@angular/core';
import { HttpErrorResponse, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { apiInterceptor } from './api.interceptor';
import { AppStore } from '../store/app-store.service';
import { ToastService } from '../services/toast.service';

describe('apiInterceptor', () => {
  const store = { csrfToken: signal('csrf-token') };
  const toastService = { show: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: AppStore, useValue: store },
        { provide: ToastService, useValue: toastService },
      ],
    });
  });

  it('adds request and CSRF headers to unsafe requests', () => {
    let interceptedRequest: HttpRequest<unknown> | undefined;
    const next: HttpHandlerFn = (request) => {
      interceptedRequest = request;
      return of(new HttpResponse({ status: 200 }));
    };

    TestBed.runInInjectionContext(() => {
      apiInterceptor(new HttpRequest('POST', '/api/import', {}), next).subscribe();
    });

    expect(interceptedRequest?.headers.get('x-request-id')).toBeTruthy();
    expect(interceptedRequest?.headers.get('x-csrf-token')).toBe('csrf-token');
  });

  it('shows a warning toast for authorization errors', () => {
    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({
      status: 403,
      error: { error: { message: 'Forbidden' } },
    }));

    TestBed.runInInjectionContext(() => {
      apiInterceptor(new HttpRequest('GET', '/api/user'), next).subscribe({ error: () => undefined });
    });

    expect(toastService.show).toHaveBeenCalledWith('Forbidden', 'warning', 6000);
  });
});
