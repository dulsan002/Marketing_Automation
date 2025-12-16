import { ChangeDetectionStrategy, Component, signal, inject, DestroyRef } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, ActivatedRoute } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * The root component of the application.
 * It manages the main layout, including the sidebar and header,
 * and determines whether to show the standard layout or a full-screen view
 * based on the current route's metadata.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SidebarComponent, HeaderComponent, RouterOutlet]
})
export class AppComponent {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  /** The title of the current page, derived from route data. */
  readonly pageTitle = signal('');
  /** The description of the current page, derived from route data. */
  readonly pageDescription = signal('');
  /**
   * A signal that determines if the current route should be displayed in a full-screen
   * editor layout (without the main sidebar and header). This is controlled by the
   * `fullScreen` property in the route's data, providing a declarative way to manage layouts.
   */
  readonly isFullScreenEditor = signal(false);

  constructor() {
    this.router.events.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      // On each navigation end, we find the most deeply nested activated route
      // to ensure we get the data from the component that is actually being rendered.
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      filter(route => route.outlet === 'primary'),
      mergeMap(route => route.data)
    ).subscribe(data => {
      // Update page metadata and layout based on the data of the activated route.
      this.pageTitle.set(data['title'] || '');
      this.pageDescription.set(data['description'] || '');
      this.isFullScreenEditor.set(!!data['fullScreen']);
    });
  }
}
