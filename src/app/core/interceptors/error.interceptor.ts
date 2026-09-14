import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { ApiError } from '../models/api-error.model';

/**
 * Surfaces every HTTP failure as a snackbar, except 401s (the auth
 * interceptor already redirects to /login for those, so a toast would be
 * redundant/confusing). Components can still inspect the error themselves
 * (e.g. to show field-level validation messages) - this only adds a
 * top-level notification, it doesn't swallow the error.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status !== 401) {
        if (error.status === 0) {
          notifications.error('Unable to reach the server. Check your connection and try again.');
        } else {
          const apiError = error.error as ApiError | undefined;
          notifications.error(apiError?.message ?? 'Something went wrong. Please try again.');
        }
      }
      return throwError(() => error);
    }),
  );
};
