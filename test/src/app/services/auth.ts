import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

interface LoginResponse {
  message: string;
  token: string;
  usuario: {
    id: number;
    nombre: string;
    username: string;
    correo: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/login`, { username, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/logout`, {}).pipe(
      tap(() => localStorage.removeItem(this.TOKEN_KEY)),
      catchError(() => {
        // Aunque falle la llamada al backend (ej. sesión ya expirada),
        // igual limpiamos el token local para no dejar al usuario atascado.
        localStorage.removeItem(this.TOKEN_KEY);
        return of(null);
      })
    );
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}