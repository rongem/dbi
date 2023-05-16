import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription, withLatestFrom } from 'rxjs';
import * as StoreSelectors from '../lib/store/store.selectors';
import * as StoreActions from '../lib/store/store.actions';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit, OnDestroy {
  private subscription?: Subscription;
  constructor(private store: Store, private router: Router, private route: ActivatedRoute) {}
  ngOnInit(): void {
    this.subscription = this.route.params.pipe(withLatestFrom(this.store.select(StoreSelectors.tables))).subscribe(([{schema, table}, tables]) => {
      const targettable = tables.find(t => t.name.toLocaleLowerCase() === (table as string).toLocaleLowerCase() &&
        t.schema.toLocaleLowerCase() === (schema as string).toLocaleLowerCase());
      if (!targettable) {
        this.router.navigateByUrl('/schemas', {replaceUrl: true});
      } else {
        this.store.dispatch(StoreActions.selectTable(targettable));
      }
    });
    // this.schemas.subscribe()
  }
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

}
