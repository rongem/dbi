import { Component, computed, inject } from '@angular/core';
import { ToastService } from '../../lib/services/toast.service';

@Component({
  selector: 'app-toast-host',
  templateUrl: './toast-host.component.html',
  styleUrls: ['./toast-host.component.scss'],
  standalone: true,
  host: { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'false' },
})
export class ToastHostComponent {
  readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;
}
