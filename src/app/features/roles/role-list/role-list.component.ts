import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { RoleService } from '../../../core/services/role.service';
import { PermissionService } from '../../../core/services/permission.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Role } from '../../../core/models/role.model';
import { Permission } from '../../../core/models/permission.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { RoleFormDialogComponent, RoleFormDialogData } from '../role-form-dialog/role-form-dialog.component';
import { AssignPermissionsDialogComponent, AssignPermissionsDialogData } from '../assign-permissions-dialog/assign-permissions-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-role-list',
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
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly permissionService = inject(PermissionService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['name', 'description', 'permissions', 'actions'];
  readonly roles = signal<Role[]>([]);
  readonly permissions = signal<Permission[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.permissionService.list().subscribe((permissions) => this.permissions.set(permissions));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.roleService.list().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createRole(): void {
    const data: RoleFormDialogData = { mode: 'create', permissions: this.permissions() };
    this.dialog
      .open(RoleFormDialogComponent, { data, width: '480px' })
      .afterClosed()
      .subscribe((created?: Role) => {
        if (created) {
          this.notifications.success(`Role "${created.name}" created.`);
          this.load();
        }
      });
  }

  editRole(role: Role): void {
    const data: RoleFormDialogData = { mode: 'edit', role, permissions: this.permissions() };
    this.dialog
      .open(RoleFormDialogComponent, { data, width: '480px' })
      .afterClosed()
      .subscribe((updated?: Role) => {
        if (updated) {
          this.notifications.success(`Role "${updated.name}" updated.`);
          this.load();
        }
      });
  }

  assignPermissions(role: Role): void {
    const data: AssignPermissionsDialogData = { role, permissions: this.permissions() };
    this.dialog
      .open(AssignPermissionsDialogComponent, { data, width: '480px' })
      .afterClosed()
      .subscribe((updated?: Role) => {
        if (updated) {
          this.notifications.success(`Permissions updated for "${updated.name}".`);
          this.load();
        }
      });
  }

  deleteRole(role: Role): void {
    const data: ConfirmDialogData = {
      title: 'Delete role',
      message: `Delete role "${role.name}"? Any user holding it will lose the permissions it grants.`,
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
        this.roleService.delete(role.id).subscribe(() => {
          this.notifications.success(`Role "${role.name}" deleted.`);
          this.load();
        });
      });
  }
}
