export const environment = {
  production: true,
  // Relative path so this works out of the box behind a reverse proxy that
  // forwards /api to the backend. Override at build time if the API lives
  // on a different origin.
  apiBaseUrl: '/api',
};
