import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { ApiError } from '../../core/models/api-error.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly notifications = inject(NotificationService);

  readonly user = this.authService.user;
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  hideCurrentPassword = true;
  hideNewPassword = true;

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
  });

  changePassword(): void {
    if (this.passwordForm.invalid || this.loading()) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.userService.changeOwnPassword(this.passwordForm.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.passwordForm.reset();
        this.notifications.success('Password changed. Other sessions have been signed out.');
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        const apiError = error.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? 'Unable to change password. Please try again.');
      },
    });
  }
}
