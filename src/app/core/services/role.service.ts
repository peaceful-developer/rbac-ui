import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AssignPermissionsRequest, CreateRoleRequest, Role, UpdateRoleRequest } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/roles`;

  list(): Observable<Role[]> {
    return this.http.get<Role[]>(this.base);
  }

  getById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.base}/${id}`);
  }

  create(request: CreateRoleRequest): Observable<Role> {
    return this.http.post<Role>(this.base, request);
  }

  update(id: number, request: UpdateRoleRequest): Observable<Role> {
    return this.http.put<Role>(`${this.base}/${id}`, request);
  }

  assignPermissions(id: number, request: AssignPermissionsRequest): Observable<Role> {
    return this.http.put<Role>(`${this.base}/${id}/permissions`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
