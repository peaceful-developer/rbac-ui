export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

/** Decoded shape of the access token's payload (see JwtService on the backend). */
export interface AccessTokenClaims {
  iss: string;
  sub: string;
  uid: number;
  authorities: string[];
  iat: number;
  exp: number;
}
