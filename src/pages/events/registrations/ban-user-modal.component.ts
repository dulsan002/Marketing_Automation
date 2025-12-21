import { ChangeDetectionStrategy, Component, output, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-ban-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
        
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50 rounded-t-lg">
          <h2 class="text-xl font-bold text-red-700 flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
            Ban User
          </h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form [formGroup]="banForm" (ngSubmit)="onConfirm()">
          <div class="p-6 space-y-4">
            <p class="text-sm text-gray-600">Please provide details for this administrative action. This will be logged.</p>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ban Reason *</label>
              <textarea formControlName="reason" rows="3" class="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" placeholder="e.g. Violation of Code of Conduct..."></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                   <label class="block text-sm font-medium text-gray-700 mb-1">Admin Name *</label>
                   <input type="text" formControlName="adminName" class="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500">
                </div>
                <div>
                   <label class="block text-sm font-medium text-gray-700 mb-1">Admin Email *</label>
                   <input type="email" formControlName="adminEmail" class="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500">
                   @if (emailMismatch) {
                       <p class="text-xs text-red-600 mt-1">Email must match logged-in admin ({{ currentUserEmail() }})</p>
                   }
                </div>
            </div>
          </div>

          <div class="p-4 bg-gray-50 rounded-b-lg flex justify-end gap-3 border-t border-gray-100">
            <button type="button" (click)="closeModal()" class="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button type="submit" [disabled]="banForm.invalid || emailMismatch" class="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 shadow-sm disabled:opacity-50 transition-colors">Confirm Ban</button>
          </div>
        </form>

      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in-up { animation: fadeInUp 0.3s ease-out; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BanUserModalComponent {
  private fb = inject(FormBuilder);
  currentUserEmail = input<string | undefined>('');

  confirm = output<{ reason: string, adminName: string, adminEmail: string }>();
  close = output<void>();

  banForm = this.fb.group({
    reason: ['', Validators.required],
    adminName: ['', Validators.required],
    adminEmail: ['', [Validators.required, Validators.email]]
  });

  get emailMismatch() {
    const inputEmail = this.banForm.get('adminEmail')?.value;
    const validEmail = this.currentUserEmail();
    if (!inputEmail || !validEmail) return false;
    return inputEmail.toLowerCase() !== validEmail.toLowerCase();
  }

  closeModal() {
    this.close.emit();
  }

  onConfirm() {
    if (this.banForm.valid && !this.emailMismatch) {
      this.confirm.emit(this.banForm.value as any);
    }
  }
}
