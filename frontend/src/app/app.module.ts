import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { appReducer } from './lib/store/store.reducer';
import { HttpClientModule } from '@angular/common/http';
import { StoreEffects } from './lib/store/store.effects';
import { ListSchemasComponent } from './list-schemas/list-schemas.component';
import { ListTablesComponent } from './list-tables/list-tables.component';
import { TableComponent } from './table/table.component';
import { RouterModule } from '@angular/router';
import { ErrorBadgeComponent } from './error-badge/error-badge.component';

@NgModule({
  declarations: [
    AppComponent,
    ListSchemasComponent,
    ListTablesComponent,
    TableComponent,
    ErrorBadgeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RouterModule,
    StoreModule.forRoot(appReducer),
    EffectsModule.forRoot([StoreEffects]),
  ],
  providers: [
    Title,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
