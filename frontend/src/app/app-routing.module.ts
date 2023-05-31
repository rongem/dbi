import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListSchemasComponent } from './list-schemas/list-schemas.component';
import { ListTablesComponent } from './list-tables/list-tables.component';
import { TableComponent } from './table/table.component';
import { resolveTables } from './lib/resolvers/tables.resolver';

const routes: Routes = [
  { path: '', redirectTo: 'schemas', pathMatch: 'full' },
  { path: 'schemas', component: ListSchemasComponent, resolve: { tables: resolveTables } },
  { path: 'schema/:schema', resolve: { tables: resolveTables }, children: [
    { path: '', component: ListTablesComponent, pathMatch: 'full' },
    { path: 'table/:table', component: TableComponent },
  ] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
