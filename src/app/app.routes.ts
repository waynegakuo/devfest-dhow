import { Routes } from '@angular/router';
import { loginRedirectGuard } from './guards/login-redirect.guard';
import { helmAuthGuard } from './guards/helm-auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/navigator-login/navigator-login.component').then(m => m.NavigatorLoginComponent),
    canActivate: [loginRedirectGuard]
  },
  {
    path: 'helm',
    loadComponent: () => import('./pages/helm-dashboard/helm-dashboard.component').then(m => m.HelmDashboardComponent),
    canActivate: [helmAuthGuard]
  }
];
