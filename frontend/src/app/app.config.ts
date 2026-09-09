import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { apiInterceptor } from './lib/interceptors/api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    Title,
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptors([apiInterceptor])),
    provideZonelessChangeDetection(),
  ],
};
