import { Component, input, ChangeDetectionStrategy } from '@angular/core';


@Component({
    selector: 'app-error-badge',
    templateUrl: './error-badge.component.html',
    styleUrls: ['./error-badge.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: []
})
export class ErrorBadgeComponent {
  readonly errorDescription = input<string | null>($localize `An error occured`);
  visibleText = false;
}
