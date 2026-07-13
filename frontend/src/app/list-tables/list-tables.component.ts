import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppStore } from '../lib/store/app-store.service';

@Component({
    selector: 'app-list-tables',
    templateUrl: './list-tables.component.html',
    styleUrls: ['./list-tables.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink]
})
export class ListTablesComponent implements OnInit, OnDestroy {
  readonly schemas = computed(() => this.store.schemas().map((schema) => schema.toLocaleLowerCase()));
  schemaName = '';

  private subscription?: Subscription;
  constructor(private readonly store: AppStore, private readonly router: Router, private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.subscription = this.route.params.subscribe(({schema}) => {
      const normalizedSchemas = this.schemas();
      if (!normalizedSchemas.includes(schema.toLocaleLowerCase())) {
        this.router.navigateByUrl('/schemas', {replaceUrl: true});
      } else {
        this.schemaName = schema;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  getTables(schemaName: string) {
    return this.store.tableNamesForSchema(schemaName);
  }
}
