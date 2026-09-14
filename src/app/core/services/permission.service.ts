import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreatePermissionRequest, Permission } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/permissions`;

  list(): Observable<Permission[]> {
    return this.http.get<Permission[]>(this.base);
  }

  create(request: CreatePermissionRequest): Observable<Permission> {
    return this.http.post<Permission>(this.base, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
