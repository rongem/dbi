import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import * as StoreSelectors from '../lib/store/store.selectors';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-list-schemas',
    templateUrl: './list-schemas.component.html',
    styleUrls: ['./list-schemas.component.scss'],
    imports: [RouterLink, AsyncPipe]
})
export class ListSchemasComponent implements OnInit, OnDestroy {
  schemas = this.store.select(StoreSelectors.schemas);
  private subscription?: Subscription;

  constructor(private store: Store, private router: Router) {}

  ngOnInit(): void {
    this.subscription = this.schemas.subscribe(schemas => {
      if (schemas.length === 1) {
        this.router.navigateByUrl('/schema/' + schemas[0], {replaceUrl: true});
      }
    })
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
