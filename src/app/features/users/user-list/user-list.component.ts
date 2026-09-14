import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User } from '../../../core/models/user.model';
import { Role } from '../../../core/models/role.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { UserFormDialogComponent, UserFormDialogData } from '../user-form-dialog/user-form-dialog.component';
import { AssignRolesDialogComponent, AssignRolesDialogData } from '../assign-roles-dialog/assign-roles-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    HasPermissionDirective,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['username', 'email', 'name', 'roles', 'status', 'actions'];
  readonly users = signal<User[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly totalElements = signal(0);
  readonly loading = signal(true);

  pageIndex = 0;
  pageSize = 10;
  sortField = 'username';
  sortDirection: 'asc' | 'desc' = 'asc';

  ngOnInit(): void {
    this.roleService.list().subscribe((roles) => this.roles.set(roles));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.userService.list(this.pageIndex, this.pageSize, `${this.sortField},${this.sortDirection}`).subscribe({
      next: (page) => {
        this.users.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  onSort(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      this.sortField = 'username';
      this.sortDirection = 'asc';
    } else {
      this.sortField = sort.active;
      this.sortDirection = sort.direction;
    }
    this.pageIndex = 0;
    this.load();
  }

  createUser(): void {
    const data: UserFormDialogData = { mode: 'create', roles: this.roles() };
    this.dialog
      .open(UserFormDialogComponent, { data, width: '480px' })
      .afterClosed()
      .subscribe((created?: User) => {
        if (created) {
          this.notifications.success(`User "${created.username}" created.`);
          this.load();
        }
      });
  }

  editUser(user: User): void {
    const data: UserFormDialogData = { mode: 'edit', user, roles: this.roles() };
    this.dialog
      .open(UserFormDialogComponent, { data, width: '480px' })
      .afterClosed()
      .subscribe((updated?: User) => {
        if (updated) {
          this.notifications.success(`User "${updated.username}" updated.`);
          this.load();
        }
      });
  }

  assignRoles(user: User): void {
    const data: AssignRolesDialogData = { user, roles: this.roles() };
    this.dialog
      .open(AssignRolesDialogComponent, { data, width: '440px' })
      .afterClosed()
      .subscribe((updated?: User) => {
        if (updated) {
          this.notifications.success(`Roles updated for "${updated.username}".`);
          this.load();
        }
      });
  }

  deleteUser(user: User): void {
    const data: ConfirmDialogData = {
      title: 'Delete user',
      message: `Delete "${user.username}"? This cannot be undone and revokes their sessions immediately.`,
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
        this.userService.delete(user.id).subscribe(() => {
          this.notifications.success(`User "${user.username}" deleted.`);
          this.load();
        });
      });
  }
}
