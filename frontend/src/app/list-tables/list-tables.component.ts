import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription, map, withLatestFrom } from 'rxjs';
import * as StoreSelectors from '../lib/store/store.selectors';
@Component({
  selector: 'app-list-tables',
  templateUrl: './list-tables.component.html',
  styleUrls: ['./list-tables.component.scss']
})
export class ListTablesComponent implements OnInit, OnDestroy {
  schemas = this.store.select(StoreSelectors.schemas).pipe(map(schemas => schemas.map(s => s.toLocaleLowerCase())));
  schemaName = '';
  tables = (schemaName: string) => this.store.select(StoreSelectors.tableNamesForSchema(schemaName));

  private subscription?: Subscription;
  constructor(private store: Store, private router: Router, private route: ActivatedRoute) {}
  ngOnInit(): void {
    this.subscription = this.route.params.pipe(withLatestFrom(this.schemas)).subscribe(([{schema}, schemas]) => {
      if(!schemas.includes(schema.toLocaleLowerCase())) {
        this.router.navigateByUrl('/schemas', {replaceUrl: true});
      } else {
        this.schemaName = schema;
      }
    });
  }
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
