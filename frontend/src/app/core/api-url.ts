const fallbackOrigin = 'http://localhost';

export const API_BASE_URL =
  typeof window === 'undefined'
    ? `${fallbackOrigin}:3000/api`
    : `${window.location.protocol}//${window.location.hostname}:3000/api`;
