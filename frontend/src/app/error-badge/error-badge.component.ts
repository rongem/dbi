import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-error-badge',
  templateUrl: './error-badge.component.html',
  styleUrls: ['./error-badge.component.scss']
})
export class ErrorBadgeComponent {
  @Input() errorDescription: string | null = $localize `An error occured`;
  visibleText = false;
}
