import { ChangeDetectionStrategy, Component, OnInit, computed } from '@angular/core';
import packageJson from '../../package.json';
import { AppStore } from './lib/store/app-store.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent implements OnInit {
  title = 'Datenbank-Importer';
  version = packageJson.version;
  readonly busy = this.store.working;
  readonly error = this.store.error;
  readonly errorPresent = computed(() => !!this.error());
  readonly authenticatedUser = this.store.userName;
  readonly notAuthorized = this.store.notAuthorized;
  readonly headerText = this.store.databaseName;

  constructor(private readonly store: AppStore) {}

  ngOnInit(): void {
    this.store.retrieveUser();
  }

  clearError(): void {
    this.store.clearError();
  }
}
