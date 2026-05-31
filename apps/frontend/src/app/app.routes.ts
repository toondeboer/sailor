import { Route } from '@angular/router';
import {
  DashboardComponent,
  PageWrapperComponent,
  TransactionsComponent,
} from '@aws/ui';
import { LandingWrapperComponent } from '../auth/landing-wrapper/landing-wrapper.component';
import { LoginComponent } from '../auth/login/login.component';
import { SignUpComponent } from '../auth/signup/signup.component';
import { AuthGuard } from '../auth/guard/auth.guard';

export const appRoutes: Route[] = [
  { path: 'login', component: LandingWrapperComponent },
  { path: 'signin', component: LoginComponent },
  { path: 'signup', component: SignUpComponent },
  { path: 'callback', redirectTo: 'login' },
  {
    path: '',
    component: PageWrapperComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'transactions', component: TransactionsComponent },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
