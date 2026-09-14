import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, AccessTokenClaims } from '../models/auth.model';
import { User } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';
import { decodeJwtPayload, isTokenExpired } from './jwt.util';

/**
 * Owns the client-side session: tokens, the decoded access-token claims (used
 * for fast, no-request permission checks - see JwtService on the backend,
 * which embeds them for exactly this purpose), and the full user profile.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly apiBase = environment.apiBaseUrl;

  private readonly _claims = signal<AccessTokenClaims | null>(this.readInitialClaims());
  private readonly _user = signal<User | null>(null);
  private refreshInProgress$: Observable<string> | null = null;

  readonly isAuthenticated = computed(() => this._claims() !== null);
  readonly username = computed(() => this._claims()?.sub ?? null);
  readonly authorities = computed(() => this._claims()?.authorities ?? []);
  readonly user = this._user.asReadonly();

  private readInitialClaims(): AccessTokenClaims | null {
    const token = this.tokenStorage.getAccessToken();
    if (!token || isTokenExpired(token)) {
      return null;
    }
    return decodeJwtPayload(token);
  }

  /**
   * Called once at app startup (see provideAppInitializer in app.config.ts).
   * Restores the session from storage, refreshing the access token if it's
   * stale but a refresh token is still available. Never errors - a failure
   * to restore the session just means the user ends up logged out, same as
   * if they'd never had one; it must not block the app from rendering.
   */
  bootstrap(): Observable<void> {
    const accessToken = this.tokenStorage.getAccessToken();
    const refreshToken = this.tokenStorage.getRefreshToken();

    let restore$: Observable<void>;
    if (accessToken && !isTokenExpired(accessToken)) {
      this._claims.set(decodeJwtPayload(accessToken));
      restore$ = this.loadCurrentUser();
    } else if (refreshToken) {
      restore$ = this.refreshAccessToken().pipe(
        switchMap(() => this.loadCurrentUser()),
        map(() => void 0),
      );
    } else {
      this.clearSession();
      return of(void 0);
    }

    return restore$.pipe(
      catchError(() => {
        this.clearSession();
        return of(void 0);
      }),
    );
  }

  login(request: LoginRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiBase}/auth/login`, request).pipe(
      tap((res) => this.setSession(res)),
      switchMap(() => this.loadCurrentUser()),
      map(() => this._user()!),
    );
  }

  register(request: RegisterRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiBase}/auth/register`, request).pipe(
      tap((res) => this.setSession(res)),
      switchMap(() => this.loadCurrentUser()),
      map(() => this._user()!),
    );
  }

  logout(): Observable<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    this.clearSession();
    if (!refreshToken) {
      return new Observable<void>((subscriber) => {
        subscriber.next();
        subscriber.complete();
      });
    }
    // Best-effort: the local session is already cleared regardless of outcome.
    return this.http.post<void>(`${this.apiBase}/auth/logout`, { refreshToken });
  }

  loadCurrentUser(): Observable<void> {
    return this.http.get<User>(`${this.apiBase}/users/me`).pipe(
      tap((user) => this._user.set(user)),
      map(() => void 0),
    );
  }

  hasAuthority(authority: string): boolean {
    return this.authorities().includes(authority);
  }

  hasAnyAuthority(authorities: string[]): boolean {
    if (authorities.length === 0) {
      return true;
    }
    const mine = this.authorities();
    return authorities.some((a) => mine.includes(a));
  }

  /** Shared by every caller so concurrent 401s trigger exactly one refresh call. */
  refreshAccessToken(): Observable<string> {
    if (this.refreshInProgress$) {
      return this.refreshInProgress$;
    }

    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    this.refreshInProgress$ = this.http.post<AuthResponse>(`${this.apiBase}/auth/refresh`, { refreshToken }).pipe(
      tap((res) => this.setSession(res)),
      map((res) => res.accessToken),
      shareReplay(1),
      finalize(() => {
        this.refreshInProgress$ = null;
      }),
    );
    return this.refreshInProgress$;
  }

  private setSession(res: AuthResponse): void {
    this.tokenStorage.setTokens(res.accessToken, res.refreshToken);
    this._claims.set(decodeJwtPayload(res.accessToken));
  }

  clearSession(): void {
    this.tokenStorage.clear();
    this._claims.set(null);
    this._user.set(null);
  }
}
