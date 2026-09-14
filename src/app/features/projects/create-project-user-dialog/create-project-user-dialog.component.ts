import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectMember } from '../../../core/models/project.model';
import { Role } from '../../../core/models/role.model';
import { ApiError } from '../../../core/models/api-error.model';

export interface CreateProjectUserDialogData {
  projectId: number;
  projectName: string;
  roles: Role[];
}

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

@Component({
  selector: 'app-create-project-user-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './create-project-user-dialog.component.html',
  styleUrl: './create-project-user-dialog.component.scss',
})
export class CreateProjectUserDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly dialogRef = inject(MatDialogRef<CreateProjectUserDialogComponent>);
  private readonly auth = inject(AuthService);
  readonly data = inject<CreateProjectUserDialogData>(MAT_DIALOG_DATA);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  hidePassword = true;

  /** Only a Master Admin may assign SUPER_ADMIN - hide it from anyone else so they don't hit a surprising 403. */
  readonly selectableRoles = computed(() =>
    this.auth.isMasterAdmin() ? this.data.roles : this.data.roles.filter((r) => r.name !== SUPER_ADMIN_ROLE),
  );

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: [''],
    lastName: [''],
    roles: [[] as string[], [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();
    this.projectService
      .createUser(this.data.projectId, {
        username: value.username,
        email: value.email,
        password: value.password,
        firstName: value.firstName || null,
        lastName: value.lastName || null,
        roles: value.roles,
      })
      .subscribe({
        next: (member: ProjectMember) => {
          this.loading.set(false);
          this.dialogRef.close(member);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          const apiError = error.error as ApiError | undefined;
          this.errorMessage.set(apiError?.message ?? 'Unable to create the user. Please try again.');
        },
      });
  }
}
