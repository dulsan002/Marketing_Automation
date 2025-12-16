import { ChangeDetectionStrategy, Component, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Account } from '../../../types';

@Component({
  selector: 'app-add-account-modal',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity" (click)="closeModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
        
        <div class="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-800">Add New Account</h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 p-1 rounded-full">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form [formGroup]="accountForm" (ngSubmit)="onSave()" class="flex-grow overflow-y-auto">
          <div class="p-6 space-y-4">
              <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
                  <input type="text" formControlName="name" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3" placeholder="e.g., Acme Corporation">
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input type="text" formControlName="industry" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3" placeholder="e.g., Technology">
                </div>
                 <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input type="text" formControlName="country" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3" placeholder="e.g., USA">
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Employees</label>
                    <input type="number" formControlName="employees" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3" placeholder="e.g., 500">
                </div>
                 <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Annual Revenue (in millions)</label>
                    <input type="number" formControlName="revenue" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3" placeholder="e.g., 50">
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tier *</label>
                <select formControlName="tier" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3">
                  <option value="T1">Tier 1</option>
                  <option value="T2">Tier 2</option>
                  <option value="T3">Tier 3</option>
                </select>
              </div>
          </div>

          <div class="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button type="button" (click)="closeModal()" class="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition duration-200">
                Cancel
              </button>
              <button type="submit" [disabled]="accountForm.invalid" class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-300">
                Save Account
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
export class AddAccountModalComponent {
  private fb = inject(FormBuilder);
  save = output<Omit<Account, 'id' | 'score' | 'intent'>>();
  close = output<void>();

  accountForm = this.fb.group({
    name: ['', Validators.required],
    industry: [''],
    country: [''],
    employees: [null, [Validators.min(1)]],
    revenue: [null, [Validators.min(0)]],
    tier: ['T2' as Account['tier'], Validators.required],
  });

  closeModal(): void {
    this.close.emit();
  }

  onSave(): void {
    if (this.accountForm.valid) {
      this.save.emit(this.accountForm.value as Omit<Account, 'id' | 'score' | 'intent'>);
    }
  }
}