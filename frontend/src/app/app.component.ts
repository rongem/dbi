import { ChangeDetectorRef, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import packageJson from '../../package.json';
import { EnvService } from './lib/services/env.service';
import * as StoreSelectors from './lib/store/store.selectors';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Datenbank-Importer';
  version = packageJson.version;
  busy = false;
  get error() {
    return this.store.select(StoreSelectors.error);
  }
  get errorPresent() {
    return this.error.pipe(map(error => !!error));
  }

  get authenticatedUser() {
    return this.store.select(StoreSelectors.userName);
  }

  get notAuthorized() {
    return this.store.select(StoreSelectors.notAuthorized);
  }

  get headerText() {
    return this.env.headerText;
  }

  constructor(private cd: ChangeDetectorRef, private store: Store, private env: EnvService) {};
}
