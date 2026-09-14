import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { RoleService } from '../../../core/services/role.service';
import { Role } from '../../../core/models/role.model';
import { Permission } from '../../../core/models/permission.model';
import { ApiError } from '../../../core/models/api-error.model';

export interface AssignPermissionsDialogData {
  role: Role;
  permissions: Permission[];
}

@Component({
  selector: 'app-assign-permissions-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './assign-permissions-dialog.component.html',
})
export class AssignPermissionsDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);
  private readonly dialogRef = inject(MatDialogRef<AssignPermissionsDialogComponent>);
  readonly data = inject<AssignPermissionsDialogData>(MAT_DIALOG_DATA);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    permissions: [this.data.role.permissions.map((p) => p.name), [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.roleService.assignPermissions(this.data.role.id, this.form.getRawValue()).subscribe({
      next: (role) => {
        this.loading.set(false);
        this.dialogRef.close(role);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        const apiError = error.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? 'Unable to update permissions. Please try again.');
      },
    });
  }
}
