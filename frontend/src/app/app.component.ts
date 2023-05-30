import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import packageJson from '../../package.json';
import * as StoreSelectors from './lib/store/store.selectors';
import { retrieveUser } from './lib/store/store.actions';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Datenbank-Importer';
  version = packageJson.version;
  get busy() {
    return this.store.select(StoreSelectors.working);
  };
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
    return this.store.select(StoreSelectors.databaseName);
  }

  constructor(private cd: ChangeDetectorRef, private store: Store) {}
  
  ngOnInit(): void {
    this.store.dispatch(retrieveUser());
  }
;
}
