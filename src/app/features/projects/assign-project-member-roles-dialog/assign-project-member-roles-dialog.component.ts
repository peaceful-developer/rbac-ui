import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectMember } from '../../../core/models/project.model';
import { Role } from '../../../core/models/role.model';
import { ApiError } from '../../../core/models/api-error.model';

export interface AssignProjectMemberRolesDialogData {
  projectId: number;
  member: ProjectMember;
  roles: Role[];
}

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

@Component({
  selector: 'app-assign-project-member-roles-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './assign-project-member-roles-dialog.component.html',
})
export class AssignProjectMemberRolesDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly dialogRef = inject(MatDialogRef<AssignProjectMemberRolesDialogComponent>);
  private readonly auth = inject(AuthService);
  readonly data = inject<AssignProjectMemberRolesDialogData>(MAT_DIALOG_DATA);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /**
   * Only a Master Admin may add or remove SUPER_ADMIN. If this member already holds
   * it and the caller isn't a Master Admin, keep it selectable (so the form doesn't
   * silently drop it if left untouched) but disabled everywhere else.
   */
  readonly selectableRoles = computed(() => {
    if (this.auth.isMasterAdmin()) {
      return this.data.roles;
    }
    const alreadySuperAdmin = this.data.member.roles.includes(SUPER_ADMIN_ROLE);
    return this.data.roles.filter((r) => r.name !== SUPER_ADMIN_ROLE || alreadySuperAdmin);
  });

  readonly form = this.fb.nonNullable.group({
    roles: [this.data.member.roles, [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.projectService
      .updateMemberRoles(this.data.projectId, this.data.member.userId, this.form.getRawValue())
      .subscribe({
        next: (member: ProjectMember) => {
          this.loading.set(false);
          this.dialogRef.close(member);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          const apiError = error.error as ApiError | undefined;
          this.errorMessage.set(apiError?.message ?? 'Unable to update roles. Please try again.');
        },
      });
  }
}
