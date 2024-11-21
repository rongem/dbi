import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-error-badge',
    templateUrl: './error-badge.component.html',
    styleUrls: ['./error-badge.component.scss'],
    standalone: true,
    imports: [NgIf]
})
export class ErrorBadgeComponent {
  @Input() errorDescription: string | null = $localize `An error occured`;
  visibleText = false;
}
