import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/user-list/user-list.component').then((m) => m.UserListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'USER_READ' },
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/roles/role-list/role-list.component').then((m) => m.RoleListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'ROLE_READ' },
      },
      {
        path: 'permissions',
        loadComponent: () =>
          import('./features/permissions/permission-list/permission-list.component').then((m) => m.PermissionListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'PERMISSION_READ' },
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/project-list/project-list.component').then((m) => m.ProjectListComponent),
      },
      {
        path: 'projects/:id/members',
        loadComponent: () =>
          import('./features/projects/project-members/project-members.component').then((m) => m.ProjectMembersComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'forbidden',
        loadComponent: () => import('./features/errors/forbidden.component').then((m) => m.ForbiddenComponent),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./features/errors/not-found.component').then((m) => m.NotFoundComponent),
  },
];
