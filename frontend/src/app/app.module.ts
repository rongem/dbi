import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { ListSchemasComponent } from './list-schemas/list-schemas.component';
import { ListTablesComponent } from './list-tables/list-tables.component';
import { TableComponent } from './table/table.component';
import { RouterModule } from '@angular/router';
import { ErrorBadgeComponent } from './error-badge/error-badge.component';
import { ApiInterceptor } from './lib/interceptors/api.interceptor';
import { ToastHostComponent } from './lib/components/toast-host/toast-host.component';

@NgModule({
    declarations: [AppComponent],
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        RouterModule,
        ListSchemasComponent,
        ListTablesComponent,
        TableComponent,
        ErrorBadgeComponent,
        ToastHostComponent
    ],
    providers: [
        Title,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ApiInterceptor,
            multi: true,
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
    ]
})
export class AppModule { }
