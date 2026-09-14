import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route-data-driven guard: attach `data: { permission: 'USER_READ' }` (or
 * `permissions: ['USER_READ', 'USER_WRITE']` to require any one of several)
 * to a route. Redirects to /forbidden rather than /login since the user IS
 * authenticated - they just lack the authority for this screen.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const required: string[] = route.data['permissions'] ?? (route.data['permission'] ? [route.data['permission']] : []);

  if (required.length === 0 || authService.hasAnyAuthority(required)) {
    return true;
  }

  return router.createUrlTree(['/forbidden']);
};
