import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { ProjectService } from '../../../core/services/project.service';
import { RoleService } from '../../../core/services/role.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { CandidateUser, Project, ProjectMember } from '../../../core/models/project.model';
import { Role } from '../../../core/models/role.model';
import { AddProjectMemberDialogComponent, AddProjectMemberDialogData } from '../add-project-member-dialog/add-project-member-dialog.component';
import {
  AssignProjectMemberRolesDialogComponent,
  AssignProjectMemberRolesDialogData,
} from '../assign-project-member-roles-dialog/assign-project-member-roles-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog.component';

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

@Component({
  selector: 'app-project-members',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './project-members.component.html',
  styleUrl: './project-members.component.scss',
})
export class ProjectMembersComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly roleService = inject(RoleService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);

  private readonly projectId = Number(this.route.snapshot.paramMap.get('id'));

  readonly displayedColumns = ['username', 'email', 'roles', 'actions'];
  readonly project = signal<Project | null>(null);
  readonly members = signal<ProjectMember[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly loading = signal(true);

  /** A Master Admin, or SUPER_ADMIN within this specific project - matches what the backend actually allows via ProjectAuthorizationService. */
  canManage(): boolean {
    return this.auth.isMasterAdmin() || (this.project()?.myRoles.includes(SUPER_ADMIN_ROLE) ?? false);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      project: this.projectService.getById(this.projectId),
      members: this.projectService.listMembers(this.projectId),
      roles: this.roleService.list(),
    }).subscribe({
      next: ({ project, members, roles }) => {
        this.project.set(project);
        this.members.set(members);
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
    });
  }

  addMember(): void {
    this.projectService.listCandidateUsers(this.projectId).subscribe((candidateUsers) => {
      const data: AddProjectMemberDialogData = {
        projectId: this.projectId,
        candidateUsers,
        roles: this.roles(),
      };
      this.dialog
        .open(AddProjectMemberDialogComponent, { data, width: '480px' })
        .afterClosed()
        .subscribe((added?: ProjectMember) => {
          if (added) {
            this.notifications.success(`"${added.username}" added to the project.`);
            this.load();
          }
        });
    });
  }

  assignRoles(member: ProjectMember): void {
    const data: AssignProjectMemberRolesDialogData = { projectId: this.projectId, member, roles: this.roles() };
    this.dialog
      .open(AssignProjectMemberRolesDialogComponent, { data, width: '440px' })
      .afterClosed()
      .subscribe((updated?: ProjectMember) => {
        if (updated) {
          this.notifications.success(`Roles updated for "${updated.username}".`);
          this.load();
        }
      });
  }

  removeMember(member: ProjectMember): void {
    const data: ConfirmDialogData = {
      title: 'Remove member',
      message: `Remove "${member.username}" from this project?`,
      confirmLabel: 'Remove',
      destructive: true,
    };
    this.dialog
      .open(ConfirmDialogComponent, { data, width: '420px' })
      .afterClosed()
      .subscribe((confirmed?: boolean) => {
        if (!confirmed) {
          return;
        }
        this.projectService.removeMember(this.projectId, member.userId).subscribe(() => {
          this.notifications.success(`"${member.username}" removed from the project.`);
          this.load();
        });
      });
  }
}
