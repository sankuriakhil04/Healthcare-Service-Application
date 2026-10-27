import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { API_BASE_URL } from './api-url';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private userState = new BehaviorSubject<any>(this.readUser());
  user$ = this.userState.asObservable();
  get token(): string | null {
    return localStorage.getItem('careconnect_token');
  }
  get currentUser(): any {
    return this.userState.value;
  }
  isAuthenticated(): boolean {
    return !!this.token;
  }
  login(credentials: { email: string; password: string }) {
    return this.http.post<any>(`${API_BASE_URL}/auth/login`, credentials).pipe(
      tap((result) => {
        localStorage.setItem('careconnect_token', result.token);
        localStorage.setItem('careconnect_user', JSON.stringify(result.user));
        this.userState.next(result.user);
      }),
    );
  }
  register(payload: object) {
    return this.http.post<any>(`${API_BASE_URL}/auth/register`, payload);
  }
  logout(): void {
    localStorage.removeItem('careconnect_token');
    localStorage.removeItem('careconnect_user');
    this.userState.next(null);
  }
  private readUser(): any {
    try {
      return JSON.parse(localStorage.getItem('careconnect_user') || 'null');
    } catch {
      return null;
    }
  }
}
