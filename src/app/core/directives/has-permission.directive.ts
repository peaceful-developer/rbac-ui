import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Structural directive to show/hide UI based on the current user's
 * authorities, e.g. `*appHasPermission="'USER_WRITE'"` or
 * `*appHasPermission="['USER_WRITE', 'USER_DELETE']"` (any match shows it).
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private required: string[] = [];
  private hasView = false;

  @Input()
  set appHasPermission(value: string | string[]) {
    this.required = Array.isArray(value) ? value : [value];
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.authService.authorities();
      this.updateView();
    });
  }

  private updateView(): void {
    const shouldShow = this.authService.hasAnyAuthority(this.required);
    if (shouldShow && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!shouldShow && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
