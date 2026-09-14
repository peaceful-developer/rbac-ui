import { Permission } from './permission.model';

export interface Role {
  id: number;
  name: string;
  description: string | null;
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
