import { ChangeDetectionStrategy, Component, output, input, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BuyingCommitteeMember, CommitteeRole, InfluenceLevel } from '../../../types';

@Component({
  selector: 'app-add-edit-member-modal',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity" (click)="closeModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up">
        
        <div class="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-800">{{ member() ? 'Edit Member' : 'Add Member' }}</h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 p-1 rounded-full">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

          <form [formGroup]="memberForm" (ngSubmit)="onSave()" class="flex-grow overflow-y-auto">
          <div class="p-6 space-y-4">
              <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" formControlName="name" 
                         [class.bg-gray-100]="!!member()"
                         [readonly]="!!member()"
                         class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3">
              </div>
               <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" formControlName="title" 
                         [class.bg-gray-100]="!!member()"
                         [readonly]="!!member()"
                         class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3">
              </div>
               <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" formControlName="email" 
                         [class.bg-gray-100]="!!member()"
                         [readonly]="!!member()"
                         class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3">
              </div>
              <div class="grid grid-cols-1 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select formControlName="role" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3">
                        @for(role of roles; track role) { <option [value]="role">{{ role }}</option> }
                    </select>
                </div>
                <!-- Influence is calculated automatically -->
              </div>
          </div>

          <div class="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button type="button" (click)="closeModal()" class="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition duration-200">
                Cancel
              </button>
              <button type="submit" [disabled]="memberForm.invalid" class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-300">
                Save
              </button>
          </div>
        </form>

      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditMemberModalComponent {
  private fb = inject(FormBuilder);
  member = input<BuyingCommitteeMember | null>(null);
  save = output<any>();
  close = output<void>();

  roles: CommitteeRole[] = ['Decision Maker', 'Influencer', 'Champion', 'End-User'];
  influenceLevels: InfluenceLevel[] = ['High', 'Medium', 'Low'];

  memberForm = this.fb.group({
    id: [''],
    name: ['', Validators.required],
    title: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['Influencer' as CommitteeRole, Validators.required],
  });

  constructor() {
    effect(() => {
      const m = this.member();
      if (m) {
        this.memberForm.patchValue({
          id: m.id,
          name: m.name,
          title: m.title || '',
          email: m.email,
          role: m.role
        });
      } else {
        this.memberForm.reset({
          role: 'Influencer' as CommitteeRole,
          name: '',
          title: '',
          email: ''
        });
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }

  onSave(): void {
    if (this.memberForm.valid) {
      this.save.emit(this.memberForm.value);
    }
  }
}