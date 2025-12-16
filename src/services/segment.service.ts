import { Injectable, signal } from '@angular/core';
import { ProspectSegment } from '../types';
import { MOCK_SEGMENTS } from '../data/mock-data';

@Injectable({
  providedIn: 'root',
})
export class SegmentService {
  private segmentsSignal = signal<ProspectSegment[]>(MOCK_SEGMENTS);

  getSegments() {
    return this.segmentsSignal.asReadonly();
  }

  getSegment(id: string): ProspectSegment | undefined {
    return this.segmentsSignal().find(s => s.id === id);
  }

  saveSegment(segmentToSave: Partial<ProspectSegment>) {
    if (segmentToSave.id && this.getSegment(segmentToSave.id)) {
      // Update existing
      this.segmentsSignal.update(segments =>
        segments.map(s =>
          s.id === segmentToSave.id
            ? { ...s, ...segmentToSave, updated: 'Just now' } as ProspectSegment
            : s
        )
      );
    } else {
      // Create new
      const newSegment: ProspectSegment = {
        id: `sg_${Date.now()}`,
        name: segmentToSave.name || 'Untitled Segment',
        description: segmentToSave.description || '',
        type: segmentToSave.type || 'Dynamic',
        rulesCount: segmentToSave.rulesCount || 0,
        members: segmentToSave.members || Math.floor(Math.random() * 5000),
        memberChange: segmentToSave.memberChange || 0,
        updated: 'Just now',
        ruleGroups: segmentToSave.ruleGroups || [],
      };
      this.segmentsSignal.update(segments => [newSegment, ...segments]);
    }
  }

  deleteSegment(segmentId: string) {
    this.segmentsSignal.update(segments => 
      segments.filter(s => s.id !== segmentId)
    );
  }
}