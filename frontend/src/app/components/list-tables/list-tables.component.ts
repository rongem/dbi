import { Component, DestroyRef, OnInit, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppStore } from '../../lib/store/app-store.service';

@Component({
    selector: 'app-list-tables',
    templateUrl: './list-tables.component.html',
    styleUrls: ['./list-tables.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink]
})
export class ListTablesComponent implements OnInit {
  readonly schemas = computed(() => this.store.schemas().map((schema) => schema.toLocaleLowerCase()));
  schemaName = '';

  private readonly destroyRef = inject(DestroyRef);
  constructor(private readonly store: AppStore, private readonly router: Router, private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({schema}) => {
      const normalizedSchemas = this.schemas();
      if (!normalizedSchemas.includes(schema.toLocaleLowerCase())) {
        this.router.navigateByUrl('/schemas', {replaceUrl: true});
      } else {
        this.schemaName = schema;
      }
    });
  }

  getTables(schemaName: string) {
    return this.store.tableNamesForSchema(schemaName);
  }
}
