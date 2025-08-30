import { Routes } from '@angular/router';
import { loginRedirectGuard } from './guards/login-redirect.guard';
import { helmAuthGuard } from './guards/helm-auth.guard';
import { courseSelectionGuard } from './guards/course-selection.guard';

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
    path: 'chart-course',
    loadComponent: () => import('./auth/course-selection/course-selection.component').then(m => m.CourseSelectionComponent),
    canActivate: [helmAuthGuard]
  },
  {
    path: 'helm',
    loadComponent: () => import('./pages/helm-dashboard/helm-dashboard.component').then(m => m.HelmDashboardComponent),
    canActivate: [courseSelectionGuard]
  }
];
