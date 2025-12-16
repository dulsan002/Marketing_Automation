import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProspectSegment } from '../../../types';
import { SegmentService } from '../../../services/segment.service';

@Component({
  selector: 'app-prospect-segments',
  imports: [CommonModule, RouterModule],
  templateUrl: './segments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProspectSegmentsComponent {
  private segmentService = inject(SegmentService);

  readonly segments = this.segmentService.getSegments();
  readonly filter = signal<'All' | 'Dynamic' | 'Static'>('All');
  readonly searchTerm = signal('');
  readonly activeDropdown = signal<string | null>(null);

  readonly filteredSegments = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const currentFilter = this.filter();
    
    return this.segments().filter(segment => {
      const nameMatch = segment.name.toLowerCase().includes(term) || segment.description.toLowerCase().includes(term);
      const filterMatch = currentFilter === 'All' || segment.type === currentFilter;
      return nameMatch && filterMatch;
    });
  });

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }
  
  setFilter(filter: 'All' | 'Dynamic' | 'Static'): void {
    this.filter.set(filter);
  }

  toggleDropdown(segmentId: string): void {
    this.activeDropdown.update(current => current === segmentId ? null : segmentId);
  }

  deleteSegment(segmentId: string): void {
    this.segmentService.deleteSegment(segmentId);
    this.activeDropdown.set(null);
  }

  getChangeClass(change: number): string {
    return change > 0 ? 'text-green-600' : 'text-red-600';
  }
}