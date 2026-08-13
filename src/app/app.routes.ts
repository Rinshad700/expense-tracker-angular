import { Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard';
import { TransactionsComponent } from './pages/transactions/transactions';
import { ReportsComponent } from './pages/reports/reports';
import { SettingsComponent } from './pages/settings/settings';
import { TripsComponent } from './pages/trips/trips';
import { TripDetailComponent } from './pages/trips/trip-detail/trip-detail';
import { TripFormComponent } from './pages/trips/trip-form/trip-form';
import { LoginComponent } from './pages/login/login';
import { IncomeComponent } from './pages/income/income';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: '',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'transactions',
    component: TransactionsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'income',
    component: IncomeComponent,
    canActivate: [authGuard]
  },
  {
    path: 'trips',
    component: TripsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'trips/new',
    component: TripFormComponent,
    canActivate: [authGuard]
  },
  {
    path: 'trips/:id',
    component: TripDetailComponent,
    canActivate: [authGuard]
  },
  {
    path: 'reports',
    component: ReportsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [authGuard]
  }
];
