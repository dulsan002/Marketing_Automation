import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SegmentService } from '../../../../services/segment.service';
import { ProspectSegment } from '../../../../types';

@Component({
    selector: 'app-new-segment',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Create New Segment</h1>
        <div class="flex gap-3">
          <a routerLink="/map/prospect-segments" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </a>
          <button (click)="save()" [disabled]="isLoading()" class="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50">
            {{ isLoading() ? 'Creating...' : 'Create Segment' }}
          </button>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <!-- Basic Info -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Segment Name</label>
          <input [(ngModel)]="name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Tech CEOs">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea [(ngModel)]="description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Brief description of this segment..."></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Segment Type</label>
          <div class="flex gap-4">
            <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50" [class.border-indigo-500]="type() === 'Dynamic'" [class.bg-indigo-50]="type() === 'Dynamic'">
              <input type="radio" name="type" value="Dynamic" [ngModel]="type()" (ngModelChange)="type.set($event)" class="text-indigo-600 focus:ring-indigo-500">
              <div class="ml-3">
                <span class="block text-sm font-medium text-gray-900">Dynamic</span>
                <span class="block text-xs text-gray-500">Automatically updates as contacts match rules</span>
              </div>
            </label>
            <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50" [class.border-indigo-500]="type() === 'Static'" [class.bg-indigo-50]="type() === 'Static'">
              <input type="radio" name="type" value="Static" [ngModel]="type()" (ngModelChange)="type.set($event)" class="text-indigo-600 focus:ring-indigo-500">
              <div class="ml-3">
                <span class="block text-sm font-medium text-gray-900">Static</span>
                <span class="block text-xs text-gray-500">Manually add specific contacts</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Rules Placeholder (Simplification for MVP Check) -->
        <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p class="text-sm text-gray-600">
            <span class="font-semibold">Note:</span> Advanced rule builder will be available in the editor after creation.
          </p>
        </div>

        @if (error()) {
          <div class="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {{ error() }}
          </div>
        }
      </div>
    </div>
  `
})
export class NewSegmentComponent {
    private segmentService = inject(SegmentService);
    private router = inject(Router);

    name = '';
    description = '';
    type = signal<'Dynamic' | 'Static'>('Dynamic');
    isLoading = signal(false);
    error = signal('');

    async save() {
        if (!this.name) {
            this.error.set('Segment name is required');
            return;
        }

        this.isLoading.set(true);
        this.error.set('');

        try {
            await this.segmentService.saveSegment({
                name: this.name,
                description: this.description,
                type: this.type(),
                ruleGroups: [] // Empty rules for now
            });
            this.router.navigate(['/map/prospect-segments']);
        } catch (e: any) {
            this.error.set(e.message || 'Failed to create segment');
        } finally {
            this.isLoading.set(false);
        }
    }
}
