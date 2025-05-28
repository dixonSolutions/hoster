import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { TopbarComponent } from './topbar/topbar.component';

export const routes: Routes = [
  { path: 'home', component: AppComponent },
  { path: 'topbar', component: TopbarComponent },
];
