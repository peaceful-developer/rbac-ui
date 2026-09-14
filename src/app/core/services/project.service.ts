import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AddProjectMemberRequest,
  CreateProjectRequest,
  Project,
  ProjectMember,
  UpdateProjectMemberRolesRequest,
  UpdateProjectRequest,
} from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/projects`;

  /** No permission required - the backend returns only what the caller may see (all projects for a Master Admin, just their own memberships otherwise). */
  list(): Observable<Project[]> {
    return this.http.get<Project[]>(this.base);
  }

  getById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.base}/${id}`);
  }

  create(request: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(this.base, request);
  }

  update(id: number, request: UpdateProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${this.base}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  listMembers(projectId: number): Observable<ProjectMember[]> {
    return this.http.get<ProjectMember[]>(`${this.base}/${projectId}/members`);
  }

  addMember(projectId: number, request: AddProjectMemberRequest): Observable<ProjectMember> {
    return this.http.post<ProjectMember>(`${this.base}/${projectId}/members`, request);
  }

  updateMemberRoles(projectId: number, userId: number, request: UpdateProjectMemberRolesRequest): Observable<ProjectMember> {
    return this.http.put<ProjectMember>(`${this.base}/${projectId}/members/${userId}/roles`, request);
  }

  removeMember(projectId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${projectId}/members/${userId}`);
  }
}
