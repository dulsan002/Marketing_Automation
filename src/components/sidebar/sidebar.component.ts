import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

/**
 * The main sidebar navigation component for the application.
 * It contains collapsible sections for different modules like MAP, ABM, and Events.
 * The open/closed state of each section is managed by signals.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  /** Signal to manage the collapsed state of the Marketing Automation Platform (MAP) section. */
  mapOpen = signal(true);
  /** Signal to manage the collapsed state of the Account-Based Marketing (ABM) section. */
  abmOpen = signal(true);
  /** Signal to manage the collapsed state of the Events section. */
  eventsOpen = signal(true);

  /**
   * Toggles the visibility of a specific navigation section.
   * @param section The identifier for the section to toggle ('map', 'abm', or 'events').
   */
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
