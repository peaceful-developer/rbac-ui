import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../models/page.model';
import {
  AssignRolesRequest,
  ChangePasswordRequest,
  CreateUserRequest,
  SetMasterAdminRequest,
  UpdateUserRequest,
  User,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/users`;

  list(page: number, size: number, sort = 'username,asc'): Observable<Page<User>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<User>>(this.base, { params });
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  create(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.base, request);
  }

  update(id: number, request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.base}/${id}`, request);
  }

  assignRoles(id: number, request: AssignRolesRequest): Observable<User> {
    return this.http.put<User>(`${this.base}/${id}/roles`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  setMasterAdmin(id: number, request: SetMasterAdminRequest): Observable<User> {
    return this.http.patch<User>(`${this.base}/${id}/master-admin`, request);
  }

  changeOwnPassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.patch<void>(`${this.base}/me/password`, request);
  }
}
