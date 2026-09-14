import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { Role } from '../../../core/models/role.model';
import { ApiError } from '../../../core/models/api-error.model';

export interface UserFormDialogData {
  mode: 'create' | 'edit';
  user?: User;
  roles: Role[];
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-form-dialog.component.html',
})
export class UserFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  readonly data = inject<UserFormDialogData>(MAT_DIALOG_DATA);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isEdit = this.data.mode === 'edit';

  readonly createForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    firstName: [''],
    lastName: [''],
    roles: [[] as string[]],
  });

  readonly editForm = this.fb.nonNullable.group({
    email: [this.data.user?.email ?? '', [Validators.required, Validators.email]],
    firstName: [this.data.user?.firstName ?? ''],
    lastName: [this.data.user?.lastName ?? ''],
    enabled: [this.data.user?.enabled ?? true],
    accountNonLocked: [this.data.user?.accountNonLocked ?? true],
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

    this.userService.create(this.createForm.getRawValue()).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.dialogRef.close(user);
      },
      error: (error: HttpErrorResponse) => this.handleError(error),
    });
  }

  private submitEdit(): void {
    if (this.editForm.invalid || this.loading() || !this.data.user) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.userService.update(this.data.user.id, this.editForm.getRawValue()).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.dialogRef.close(user);
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
