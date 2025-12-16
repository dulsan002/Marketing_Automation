import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A presentational component for the main application header.
 * It displays the current page title and description, along with global
 * UI elements like search and user profile.
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  /** The main title to be displayed in the header. */
  title = input<string>('');
  /** The subtitle or description to be displayed below the main title. */
  description = input<string>('');
}
