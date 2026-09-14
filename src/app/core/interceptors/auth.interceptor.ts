import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

const AUTH_ENDPOINT_PATTERN = /\/api\/auth\/(login|register|refresh|logout)$/;

/**
 * Attaches the access token to outgoing requests and, on a 401 from a
 * protected endpoint, refreshes the token once and retries. A 401 from the
 * auth endpoints themselves (bad credentials, invalid refresh token, etc.)
 * is never retried - it's propagated as-is for the caller to handle.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const isAuthEndpoint = AUTH_ENDPOINT_PATTERN.test(req.url);
  const accessToken = tokenStorage.getAccessToken();

  const authReq = accessToken && !isAuthEndpoint
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }

      return authService.refreshAccessToken().pipe(
        switchMap((newAccessToken) =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${newAccessToken}` } })),
        ),
        catchError((refreshError) => {
          authService.clearSession();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
