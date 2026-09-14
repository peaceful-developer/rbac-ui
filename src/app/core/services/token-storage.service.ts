import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'iam.accessToken';
const REFRESH_TOKEN_KEY = 'iam.refreshToken';

/**
 * Thin wrapper around localStorage. Kept as its own service (rather than
 * scattering localStorage calls) so the storage mechanism can be swapped
 * later without touching AuthService or the interceptor.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  setAccessToken(accessToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
