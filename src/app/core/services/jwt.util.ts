import { AccessTokenClaims } from '../models/auth.model';

/** Decodes a JWT's payload without verifying its signature - display/UX use only. */
export function decodeJwtPayload(token: string): AccessTokenClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json) as AccessTokenClaims;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const claims = decodeJwtPayload(token);
  if (!claims) {
    return true;
  }
  return Date.now() >= claims.exp * 1000;
}
