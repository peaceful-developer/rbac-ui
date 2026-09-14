import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { RoleService } from '../../../core/services/role.service';
import { Role } from '../../../core/models/role.model';
import { Permission } from '../../../core/models/permission.model';
import { ApiError } from '../../../core/models/api-error.model';

export interface RoleFormDialogData {
  mode: 'create' | 'edit';
  role?: Role;
  permissions: Permission[];
}

@Component({
  selector: 'app-role-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './role-form-dialog.component.html',
})
export class RoleFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);
  private readonly dialogRef = inject(MatDialogRef<RoleFormDialogComponent>);
  readonly data = inject<RoleFormDialogData>(MAT_DIALOG_DATA);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isEdit = this.data.mode === 'edit';

  readonly createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]],
    permissions: [[] as string[]],
  });

  readonly editForm = this.fb.nonNullable.group({
    description: [this.data.role?.description ?? '', [Validators.maxLength(255)]],
  });

  submit(): void {
    if (this.isEdit) {
      this.submitEdit();
    } else {
      this.submitCreate();
    }
  }

  private submitCreate(): void {
    if (this.createForm.invalid || this.loading()) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.roleService.create(this.createForm.getRawValue()).subscribe({
      next: (role) => {
        this.loading.set(false);
        this.dialogRef.close(role);
      },
      error: (error: HttpErrorResponse) => this.handleError(error),
    });
  }

  private submitEdit(): void {
    if (this.editForm.invalid || this.loading() || !this.data.role) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.roleService.update(this.data.role.id, this.editForm.getRawValue()).subscribe({
      next: (role) => {
        this.loading.set(false);
        this.dialogRef.close(role);
      },
      error: (error: HttpErrorResponse) => this.handleError(error),
    });
  }

  private handleError(error: HttpErrorResponse): void {
    this.loading.set(false);
    const apiError = error.error as ApiError | undefined;
    this.errorMessage.set(apiError?.message ?? 'Something went wrong. Please try again.');
  }
}
