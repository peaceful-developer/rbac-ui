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
import { CandidateUser, ProjectMember } from '../../../core/models/project.model';
import { Role } from '../../../core/models/role.model';
import { ApiError } from '../../../core/models/api-error.model';

export interface AddProjectMemberDialogData {
  projectId: number;
  /** Users not already a member of this project - fetched via ProjectService.listCandidateUsers, which needs no global USER_READ authority. */
  candidateUsers: CandidateUser[];
  roles: Role[];
}

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

@Component({
  selector: 'app-add-project-member-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-project-member-dialog.component.html',
})
export class AddProjectMemberDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly dialogRef = inject(MatDialogRef<AddProjectMemberDialogComponent>);
  private readonly auth = inject(AuthService);
  readonly data = inject<AddProjectMemberDialogData>(MAT_DIALOG_DATA);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /** Only a Master Admin may assign SUPER_ADMIN - hide it from anyone else so they don't hit a surprising 403. */
  readonly selectableRoles = computed(() =>
    this.auth.isMasterAdmin() ? this.data.roles : this.data.roles.filter((r) => r.name !== SUPER_ADMIN_ROLE),
  );

  readonly form = this.fb.nonNullable.group({
    userId: [null as number | null, [Validators.required]],
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
    this.projectService.addMember(this.data.projectId, { userId: value.userId!, roles: value.roles }).subscribe({
      next: (member: ProjectMember) => {
        this.loading.set(false);
        this.dialogRef.close(member);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        const apiError = error.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? 'Unable to add member. Please try again.');
      },
    });
  }
}
