import { Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard';
import { TransactionsComponent } from './pages/transactions/transactions';
import { ReportsComponent } from './pages/reports/reports';
import { SettingsComponent } from './pages/settings/settings';
import { TripsComponent } from './pages/trips/trips';
import { TripDetailComponent } from './pages/trips/trip-detail/trip-detail';
import { TripFormComponent } from './pages/trips/trip-form/trip-form';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'transactions',
    component: TransactionsComponent
  },
  {
    path: 'trips',
    component: TripsComponent
  },
  {
    path: 'trips/new',
    component: TripFormComponent
  },
  {
    path: 'trips/:id',
    component: TripDetailComponent
  },
  {
    path: 'reports',
    component: ReportsComponent
  },
  {
    path: 'settings',
    component: SettingsComponent
  }
];