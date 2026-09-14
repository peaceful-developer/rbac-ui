import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { PermissionService } from '../../../core/services/permission.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Permission } from '../../../core/models/permission.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { PermissionFormDialogComponent } from '../permission-form-dialog/permission-form-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-permission-list',
  standalone: true,
  imports: [MatTableModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule, HasPermissionDirective],
  templateUrl: './permission-list.component.html',
  styleUrl: './permission-list.component.scss',
})
export class PermissionListComponent implements OnInit {
  private readonly permissionService = inject(PermissionService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['name', 'description', 'actions'];
  readonly permissions = signal<Permission[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.permissionService.list().subscribe({
      next: (permissions) => {
        this.permissions.set(permissions);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createPermission(): void {
    this.dialog
      .open(PermissionFormDialogComponent, { width: '440px' })
      .afterClosed()
      .subscribe((created?: Permission) => {
        if (created) {
          this.notifications.success(`Permission "${created.name}" created.`);
          this.load();
        }
      });
  }

  deletePermission(permission: Permission): void {
    const data: ConfirmDialogData = {
      title: 'Delete permission',
      message: `Delete "${permission.name}"? It will be removed from any role that grants it.`,
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
        this.permissionService.delete(permission.id).subscribe(() => {
          this.notifications.success(`Permission "${permission.name}" deleted.`);
          this.load();
        });
      });
  }
}
