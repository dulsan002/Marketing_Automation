import { ChangeDetectionStrategy, Component, signal, inject, DestroyRef } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, ActivatedRoute } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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

  readonly pageTitle = signal('');
  readonly pageDescription = signal('');
  readonly isFullScreenEditor = signal(false);

  constructor() {
    this.router.events.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        
        const isWorkflowEditor = url.includes('/map/workflows/builder/');
        const isSegmentEditor = url.startsWith('/map/prospect-segments/') && (url.endsWith('/new') || url.split('/').length > 4);
        const isCampaignEditor = url.startsWith('/map/campaigns/new');

        this.isFullScreenEditor.set(isWorkflowEditor || isSegmentEditor || isCampaignEditor);
        
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      filter(route => route.outlet === 'primary'),
      mergeMap(route => route.data)
    ).subscribe(data => {
      this.pageTitle.set(data['title'] || '');
      this.pageDescription.set(data['description'] || '');
    });
  }
}