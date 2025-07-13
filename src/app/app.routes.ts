import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { ShoppingCartComponent } from './shopping-cart/shopping-cart.component';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { DynamicWebsiteComponent } from './dynamic-website/dynamic-website.component';

export const routes: Routes = [
//  { path: '', redirectTo: 'home', pathMatch: 'full' },
  //{ path: 'home', component: HomeComponent },
  //{ path: 'shopping-cart', component: ShoppingCartComponent },
  //{ path: 'checkout', component: ShoppingCartComponent },
  //{ path: 'order-history', component: OrderHistoryComponent },
  //{ path: 'landing-page', component: LandingPageComponent },
  //{ path: 'contact-us', component: ContactUsComponent },
  // Wildcard route for dynamic websites - MUST be last
  { path: '**', component: DynamicWebsiteComponent }
];
