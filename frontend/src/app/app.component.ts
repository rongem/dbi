import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import packageJson from '../../package.json';
import { AppStore } from './lib/store/app-store.service';
import { ToastHostComponent } from './components/toast-host/toast-host.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterOutlet, ToastHostComponent]
})
export class AppComponent implements OnInit {
  title = 'Datenbank-Importer';
  version = packageJson.version;
  readonly busy = this.store.working;
  readonly authenticatedUser = this.store.userName;
  readonly notAuthorized = this.store.notAuthorized;
  readonly headerText = this.store.databaseName;

  constructor(private readonly store: AppStore) {}

  ngOnInit(): void {
    this.store.retrieveUser();
  }
}
