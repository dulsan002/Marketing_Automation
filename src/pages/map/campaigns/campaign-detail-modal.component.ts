import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Campaign } from '../../../types';

@Component({
  selector: 'app-campaign-detail-modal',
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity" (click)="closeModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
        
        <div class="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-800">{{ campaign().name }}</h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 p-1 rounded-full">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div class="p-6 overflow-y-auto">
          <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div class="bg-gray-50 p-4 rounded-lg">
              <dt class="text-sm font-medium text-gray-500">Campaign Type</dt>
              <dd class="mt-1 text-md font-semibold text-gray-900">{{ campaign().type }}</dd>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <dt class="text-sm font-medium text-gray-500">Status</dt>
              <dd class="mt-1">
                 <span class="px-3 py-1 text-sm font-medium rounded-full capitalize" [class]="getStatusClass(campaign().status)">
                  {{ campaign().status }}
                </span>
              </dd>
            </div>
             <div class="bg-gray-50 p-4 rounded-lg">
              <dt class="text-sm font-medium text-gray-500">Total Sent</dt>
              <dd class="mt-1 text-md font-semibold text-gray-900">{{ campaign().sent | number }}</dd>
            </div>
             <div class="bg-gray-50 p-4 rounded-lg">
              <dt class="text-sm font-medium text-gray-500">Open Rate</dt>
              <dd class="mt-1 text-md font-semibold text-gray-900">{{ campaign().openRate }}%</dd>
            </div>
             <div class="bg-gray-50 p-4 rounded-lg">
              <dt class="text-sm font-medium text-gray-500">Click-Through Rate (CTR)</dt>
              <dd class="mt-1 text-md font-semibold text-gray-900">{{ campaign().ctr }}%</dd>
            </div>
          </dl>
        </div>

        <div class="p-4 bg-gray-50 border-t border-gray-200 text-right">
            <button (click)="closeModal()" class="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition duration-200">
              Close
            </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-fade-in-up {
      animation: fade-in-up 0.3s ease-out forwards;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignDetailModalComponent {
  campaign = input.required<Campaign>();
  close = output<void>();

  closeModal(): void {
    this.close.emit();
  }

  getStatusClass(status: Campaign['status']): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
