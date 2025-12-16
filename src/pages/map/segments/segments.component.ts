import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProspectSegment } from '../../../types';
import { SegmentService } from '../../../services/segment.service';

/**
 * Manages the display and interaction of the main prospect segments list.
 * This component fetches and displays segment cards, allowing users to filter
 * them by type (All, Dynamic, Static) and search by name or description.
 */
@Component({
  selector: 'app-prospect-segments',
  imports: [CommonModule, RouterModule],
  templateUrl: './segments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProspectSegmentsComponent {
  private segmentService = inject(SegmentService);

  /** A read-only signal holding the list of all prospect segments. */
  readonly segments = this.segmentService.getSegments();
  /** The current type filter applied to the segments list. */
  readonly filter = signal<'All' | 'Dynamic' | 'Static'>('All');
  /** The current search term entered by the user. */
  readonly searchTerm = signal('');
  /** Manages which segment's action dropdown is currently visible. Null if none are open. */
  readonly activeDropdown = signal<string | null>(null);

  /** A computed signal that returns a filtered list of segments based on the current search term and type filter. */
  readonly filteredSegments = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const currentFilter = this.filter();
    
    return this.segments().filter(segment => {
      const nameMatch = segment.name.toLowerCase().includes(term) || segment.description.toLowerCase().includes(term);
      const filterMatch = currentFilter === 'All' || segment.type === currentFilter;
      return nameMatch && filterMatch;
    });
  });

  /**
   * Updates the search term signal based on user input.
   * @param event The input event from the search field.
   */
  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }
  
  /**
   * Sets the filter type for the segment list.
   * @param filter The filter to apply ('All', 'Dynamic', or 'Static').
   */
  setFilter(filter: 'All' | 'Dynamic' | 'Static'): void {
    this.filter.set(filter);
  }

  /**
   * Toggles the visibility of the action dropdown menu for a specific segment.
   * @param segmentId The ID of the segment whose dropdown should be toggled.
   */
  toggleDropdown(segmentId: string): void {
    this.activeDropdown.update(current => current === segmentId ? null : segmentId);
  }

  /**
   * Deletes a segment via the segment service.
   * @param segmentId The ID of the segment to delete.
   */
  deleteSegment(segmentId: string): void {
    this.segmentService.deleteSegment(segmentId);
    this.activeDropdown.set(null);
  }

  /**
   * Determines the Tailwind CSS class for the member change percentage.
   * @param change The percentage change in segment members.
   * @returns A string of CSS classes for text color (green for positive, red for negative).
   */
  getChangeClass(change: number): string {
    return change > 0 ? 'text-green-600' : 'text-red-600';
  }
}
