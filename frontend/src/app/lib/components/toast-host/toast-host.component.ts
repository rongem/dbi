import { Component, computed, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-host',
  template: `
    @for (toast of toasts(); track toast.id) {
      <div class="toast toast-{{ toast.type }}">
        <span>{{ toast.message }}</span>
        <button type="button" (click)="toastService.remove(toast.id)">×</button>
      </div>
    }
  `,
  styles: [
    ':host { position: fixed; right: 1rem; bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; z-index: 1000; }',
    '.toast { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.75rem 1rem; border-radius: 0.5rem; color: white; min-width: 16rem; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18); }',
    '.toast-info { background: #2563eb; }',
    '.toast-success { background: #15803d; }',
    '.toast-warning { background: #d97706; }',
    '.toast-error { background: #dc2626; }',
    'button { background: transparent; border: 0; color: inherit; cursor: pointer; font-size: 1rem; }',
  ],
  standalone: true,
})
export class ToastHostComponent {
  readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;
}
