import { Permission } from './permission.model';

export interface Role {
  id: number;
  name: string;
  description: string | null;
  /** False for a role created by a Master Admin (e.g. seeded ADMIN/SUPER_ADMIN) - only a Master Admin can then modify it. */
  editable: boolean;
  permissions: Permission[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string | null;
  permissions?: string[];
}

export interface UpdateRoleRequest {
  description?: string | null;
}

export interface AssignPermissionsRequest {
  permissions: string[];
}
