import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsSignal = signal<ToastMessage[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  private nextId = 1;

  show(message: string, type: ToastType = 'info', timeoutMs = 4000): void {
    const toast: ToastMessage = { id: this.nextId++, type, message };
    this.toastsSignal.update((current) => [...current, toast]);

    if (timeoutMs > 0) {
      window.setTimeout(() => this.remove(toast.id), timeoutMs);
    }
  }

  remove(id: number): void {
    this.toastsSignal.update((current) => current.filter((toast) => toast.id !== id));
  }

  clear(): void {
    this.toastsSignal.set([]);
  }
}
