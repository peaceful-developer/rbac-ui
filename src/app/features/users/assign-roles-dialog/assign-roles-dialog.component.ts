import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { Role } from '../../../core/models/role.model';
import { ApiError } from '../../../core/models/api-error.model';

export interface AssignRolesDialogData {
  user: User;
  roles: Role[];
}

@Component({
  selector: 'app-assign-roles-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './assign-roles-dialog.component.html',
})
export class AssignRolesDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly dialogRef = inject(MatDialogRef<AssignRolesDialogComponent>);
  readonly data = inject<AssignRolesDialogData>(MAT_DIALOG_DATA);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    roles: [this.data.user.roles, [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.userService.assignRoles(this.data.user.id, this.form.getRawValue()).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.dialogRef.close(user);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        const apiError = error.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? 'Unable to update roles. Please try again.');
      },
    });
  }
}
