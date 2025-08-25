import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/navigator-login/navigator-login.component').then(m => m.NavigatorLoginComponent)
  },
  {
    path: 'helm',
    loadComponent: () => import('./pages/helm-dashboard/helm-dashboard.component').then(m => m.HelmDashboardComponent)
  }
];
