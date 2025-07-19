import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { ShoppingCartComponent } from './shopping-cart/shopping-cart.component';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { DynamicWebsiteComponent } from './dynamic-website/dynamic-website.component';
import { MagicLinkHandlerComponent } from './magic-link-handler/magic-link-handler.component';
import { NoWebsiteSelectedComponent } from './no-website-selected/no-website-selected.component';

export const routes: Routes = [
//  { path: '', redirectTo: 'home', pathMatch: 'full' },
  //{ path: 'home', component: HomeComponent },
  //{ path: 'shopping-cart', component: ShoppingCartComponent },
  //{ path: 'checkout', component: ShoppingCartComponent },
  //{ path: 'order-history', component: OrderHistoryComponent },
  //{ path: 'landing-page', component: LandingPageComponent },
  //{ path: 'contact-us', component: ContactUsComponent },
  
  // Magic link authentication handler - MUST be before wildcard route
  // Handle JWT tokens in URL path - both parameterized and wildcard patterns
  { path: ':websiteName/auth/:token', component: MagicLinkHandlerComponent },
  { path: ':websiteName/auth', component: MagicLinkHandlerComponent },
  { path: '', component: NoWebsiteSelectedComponent},
  
  // Wildcard route for dynamic websites - MUST be last
  { path: '**', component: DynamicWebsiteComponent }
];
