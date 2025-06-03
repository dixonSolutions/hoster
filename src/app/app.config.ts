import { ApplicationConfig, PLATFORM_ID, APP_ID, Inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { DOCUMENT } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideAnimations(),
    provideHttpClient(),
    {
      provide: CookieService,
      useFactory: (document: Document, platformId: Object) => {
        return new CookieService(document, platformId);
      },
      deps: [DOCUMENT, PLATFORM_ID]
    }
  ]
};
