import { Routes } from '@angular/router';
import { loginRedirectGuard } from './guards/login-redirect.guard';
import { helmAuthGuard } from './guards/helm-auth.guard';
import { courseSelectionGuard } from './guards/course-selection.guard';
import { adminGuard } from './guards/admin.guard';

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
    path: 'dashboard',
    loadComponent: () => import('./shared/layouts/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [courseSelectionGuard],
    children: [
      {
        path: '',
        redirectTo: 'helm',
        pathMatch: 'full'
      },
      {
        path: 'helm',
        loadComponent: () => import('./pages/helm-dashboard/helm-dashboard.component').then(m => m.HelmDashboardComponent)
      },
      {
        path: 'archipelago',
        loadComponent: () => import('./pages/archipelago/archipelago.component').then(m => m.ArchipelagoComponent)
      },
      {
        path: 'my-voyage-plan',
        loadComponent: () => import('./pages/my-voyage-plan/my-voyage-plan.component').then(m => m.MyVoyagePlanComponent)
      },
      {
        path: 'navigational-drills',
        loadComponent: () => import('./pages/navigational-drills/navigational-drills.component').then(m => m.NavigationalDrillsComponent)
      },
      {
        path: 'codelab-doubloons',
        loadComponent: () => import('./pages/codelab-doubloons/codelab-doubloons.component').then(m => m.CodelabDoubloonsComponent)
      },
      {
        path: 'ask-the-oracle',
        loadComponent: () => import('./pages/ask-the-oracle/ask-the-oracle.component').then(m => m.AskTheOracleComponent)
      },
      {
        path: 'stocking-the-galley',
        loadComponent: () => import('./pages/stocking-the-galley/stocking-the-galley.component').then(m => m.StockingTheGalleyComponent)
      },
      {
        path: 'admin-role-assignment',
        loadComponent: () => import('./pages/admin/admin-role-assignment/admin-role-assignment.component').then(m => m.AdminRoleAssignmentComponent),
        canActivate: [adminGuard]
      },
      // {
      //   path: 'quest-for-atlantis',
      //   loadComponent: () => import('./pages/quest-for-atlantis/quest-for-atlantis.component').then(m => m.QuestForAtlantisComponent)
      // },
      // {
      //   path: 'my-profile',
      //   loadComponent: () => import('./pages/my-profile/my-profile.component').then(m => m.MyProfileComponent)
      // }
    ]
  },
  {
    path: 'admin',
    loadComponent: () => import('./shared/layouts/admin-dashboard-layout/admin-dashboard-layout.component').then(m => m.AdminDashboardLayoutComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'helm',
        pathMatch: 'full'
      },
      {
        path: 'helm',
        loadComponent: () => import('./pages/admin/admin-helm-dashboard/admin-helm-dashboard.component').then(m => m.AdminHelmDashboardComponent)
      },
      {
        path: 'voyages',
        loadComponent: () => import('./pages/admin/admin-voyage-management/admin-voyage-management.component').then(m => m.AdminVoyageManagementComponent)
      },
      {
        path: 'sessions',
        loadComponent: () => import('./pages/admin/admin-session-management/admin-session-management.component').then(m => m.AdminSessionManagementComponent)
      },
      {
        path: 'navigators',
        loadComponent: () => import('./pages/admin/admin-navigator-management/admin-navigator-management.component').then(m => m.AdminNavigatorManagementComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./pages/admin/admin-analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/admin/admin-settings/admin-settings.component').then(m => m.AdminSettingsComponent)
      },
      {
        path: 'role-assignment',
        loadComponent: () => import('./pages/admin/admin-role-assignment/admin-role-assignment.component').then(m => m.AdminRoleAssignmentComponent)
      }
    ]
  },
  // Legacy routes for backward compatibility - redirect to dashboard
  {
    path: 'helm',
    redirectTo: 'dashboard/helm',
    pathMatch: 'full'
  },
  {
    path: 'archipelago',
    redirectTo: 'dashboard/archipelago',
    pathMatch: 'full'
  },
  {
    path: 'my-voyage-plan',
    redirectTo: 'dashboard/my-voyage-plan',
    pathMatch: 'full'
  },
  {
    path: 'navigational-drills',
    redirectTo: 'dashboard/navigational-drills',
    pathMatch: 'full'
  },
  {
    path: 'codelab-doubloons',
    redirectTo: 'dashboard/codelab-doubloons',
    pathMatch: 'full'
  },
  {
    path: 'ask-the-oracle',
    redirectTo: 'dashboard/ask-the-oracle',
    pathMatch: 'full'
  }
];
