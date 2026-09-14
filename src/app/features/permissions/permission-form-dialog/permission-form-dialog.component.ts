import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { PermissionService } from '../../../core/services/permission.service';
import { Permission } from '../../../core/models/permission.model';
import { ApiError } from '../../../core/models/api-error.model';

@Component({
  selector: 'app-permission-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './permission-form-dialog.component.html',
})
export class PermissionFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly permissionService = inject(PermissionService);
  private readonly dialogRef = inject(MatDialogRef<PermissionFormDialogComponent>);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.permissionService.create(this.form.getRawValue()).subscribe({
      next: (permission: Permission) => {
        this.loading.set(false);
        this.dialogRef.close(permission);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        const apiError = error.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? 'Unable to create permission. Please try again.');
      },
    });
  }
}
