import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE_URL } from './api-url';
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('careconnect_token');
  return next(
    token && request.url.startsWith(API_BASE_URL)
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request,
  );
};
