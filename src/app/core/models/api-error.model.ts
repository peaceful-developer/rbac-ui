/** Mirrors the backend's ErrorResponse shape (see GlobalExceptionHandler). */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string | null;
  fieldErrors: Record<string, string> | null;
}
