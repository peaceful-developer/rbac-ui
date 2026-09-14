export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  enabled: boolean;
  accountNonLocked: boolean;
  masterAdmin: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SetMasterAdminRequest {
  masterAdmin: boolean;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  roles?: string[];
}

export interface UpdateUserRequest {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  enabled?: boolean | null;
  accountNonLocked?: boolean | null;
}

export interface AssignRolesRequest {
  roles: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
