import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  mapOpen = signal(true);
  abmOpen = signal(true);
  eventsOpen = signal(true);

  toggle(section: 'map' | 'abm' | 'events'): void {
    if (section === 'map') {
      this.mapOpen.update(v => !v);
    } else if (section === 'abm') {
      this.abmOpen.update(v => !v);
    } else if (section === 'events') {
      this.eventsOpen.update(v => !v);
    }
  }
}