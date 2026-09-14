import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    HasPermissionDirective,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly projectService = inject(ProjectService);

  readonly user = this.auth.user;
  readonly username = this.auth.username;
  readonly isMasterAdmin = this.auth.isMasterAdmin;

  /**
   * A non-Master-Admin's own project(s) - fetched so the sidenav can show "their"
   * project instead of the platform-wide Projects browser, which only a Master
   * Admin needs (GET /api/projects already scopes the result to the caller, a
   * Master Admin just happens to see every project).
   */
  readonly myProjects = signal<Project[]>([]);

  /** "IAM Portal" for a Master Admin or anyone with no project (e.g. a legacy ADMIN/MANAGER/USER account); their project's name(s) otherwise. */
  readonly brandLabel = computed(() => {
    if (this.isMasterAdmin() || this.myProjects().length === 0) {
      return 'IAM Portal';
    }
    return this.myProjects()
      .map((p) => p.name)
      .join(', ');
  });

  /** Only offer a direct link into the project's member page when there's exactly one and the caller manages it (Super Admin) - otherwise it's just a label. */
  readonly manageableProject = computed(() => {
    const projects = this.myProjects();
    if (projects.length !== 1) {
      return null;
    }
    return projects[0].myRoles.includes(SUPER_ADMIN_ROLE) ? projects[0] : null;
  });

  ngOnInit(): void {
    if (!this.isMasterAdmin()) {
      this.projectService.list().subscribe((projects) => this.myProjects.set(projects));
    }
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.notifications.success('Signed out.');
        this.router.navigate(['/login']);
      },
      error: () => {
        // Session is cleared locally regardless of whether the server call succeeded.
        this.router.navigate(['/login']);
      },
    });
  }

  initials(): string {
    const u = this.user();
    if (!u) {
      return '?';
    }
    const first = u.firstName?.[0] ?? u.username[0];
    const last = u.lastName?.[0] ?? '';
    return (first + last).toUpperCase();
  }
}
