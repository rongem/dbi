import { Component, OnInit, ChangeDetectionStrategy, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AppStore } from '../lib/store/app-store.service';

@Component({
    selector: 'app-list-schemas',
    templateUrl: './list-schemas.component.html',
    styleUrls: ['./list-schemas.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink]
})
export class ListSchemasComponent implements OnInit {
  readonly schemas = this.store.schemas;

  constructor(private readonly store: AppStore, private readonly router: Router) {
    effect(() => {
      const schemas = this.store.schemas();
      if (schemas.length === 1) {
        this.router.navigateByUrl('/schema/' + schemas[0], {replaceUrl: true});
      }
    });
  }

  ngOnInit(): void {
  }
}
