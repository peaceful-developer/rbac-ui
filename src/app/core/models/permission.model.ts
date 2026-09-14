export interface Permission {
  id: number;
  name: string;
  description: string | null;
}

export interface CreatePermissionRequest {
  name: string;
  description?: string | null;
}
