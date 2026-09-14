import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ProjectService } from '../../../core/services/project.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../core/models/project.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { ProjectFormDialogComponent, ProjectFormDialogData } from '../project-form-dialog/project-form-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    HasPermissionDirective,
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly displayedColumns = ['name', 'description', 'myRoles', 'actions'];
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.projectService.list().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** A Master Admin, or anyone holding SUPER_ADMIN within this specific project - matches what the backend actually allows via ProjectAuthorizationService. */
  canManage(project: Project): boolean {
    return this.auth.isMasterAdmin() || project.myRoles.includes('SUPER_ADMIN');
  }

  openMembers(project: Project): void {
    this.router.navigate(['/projects', project.id, 'members']);
  }

  createProject(): void {
    const data: ProjectFormDialogData = { mode: 'create' };
    this.dialog
      .open(ProjectFormDialogComponent, { data, width: '480px' })
      .afterClosed()
      .subscribe((created?: Project) => {
        if (created) {
          this.notifications.success(`Project "${created.name}" created.`);
          this.load();
        }
      });
  }

  editProject(project: Project): void {
    const data: ProjectFormDialogData = { mode: 'edit', project };
    this.dialog
      .open(ProjectFormDialogComponent, { data, width: '480px' })
      .afterClosed()
      .subscribe((updated?: Project) => {
        if (updated) {
          this.notifications.success(`Project "${updated.name}" updated.`);
          this.load();
        }
      });
  }

  deleteProject(project: Project): void {
    const data: ConfirmDialogData = {
      title: 'Delete project',
      message: `Delete "${project.name}"? This removes every member's role assignment in this project too.`,
      confirmLabel: 'Delete',
      destructive: true,
    };
    this.dialog
      .open(ConfirmDialogComponent, { data, width: '420px' })
      .afterClosed()
      .subscribe((confirmed?: boolean) => {
        if (!confirmed) {
          return;
        }
        this.projectService.delete(project.id).subscribe(() => {
          this.notifications.success(`Project "${project.name}" deleted.`);
          this.load();
        });
      });
  }
}
