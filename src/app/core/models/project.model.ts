/** myRoles is the caller's own roles within this project (empty if none) - see the backend's ProjectResponse for why. */
export interface Project {
  id: number;
  name: string;
  description: string | null;
  myRoles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  userId: number;
  username: string;
  email: string;
  roles: string[];
}

/** Minimal projection returned by GET /api/projects/{id}/candidate-users - just enough to pick someone, no account/role state. */
export interface CandidateUser {
  id: number;
  username: string;
  email: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string | null;
}

export interface UpdateProjectRequest {
  name?: string | null;
  description?: string | null;
}

export interface AddProjectMemberRequest {
  userId: number;
  roles: string[];
}

export interface UpdateProjectMemberRolesRequest {
  roles: string[];
}
