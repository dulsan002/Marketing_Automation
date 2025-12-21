import { ChangeDetectionStrategy, Component, output, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-unban-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
        
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-green-50 rounded-t-lg">
          <h2 class="text-xl font-bold text-green-700 flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Unban User
          </h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form [formGroup]="unbanForm" (ngSubmit)="onConfirm()">
          <div class="p-6 space-y-4">
            
            <div class="bg-red-50 p-3 rounded-md border border-red-100 mb-4">
                <p class="text-xs font-bold text-red-800 uppercase tracking-wide">Original Ban Reason</p>
                <p class="text-sm text-red-700 mt-1">{{ banReason() || 'No reason provided' }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Unban Reason *</label>
              <textarea formControlName="reason" rows="3" class="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" placeholder="Why is this user being unbanned?"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                   <label class="block text-sm font-medium text-gray-700 mb-1">Admin Name *</label>
                   <input type="text" formControlName="adminName" class="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                </div>
                <div>
                   <label class="block text-sm font-medium text-gray-700 mb-1">Admin Email *</label>
                   <input type="email" formControlName="adminEmail" class="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                   @if (emailMismatch) {
                       <p class="text-xs text-red-600 mt-1">Email must match logged-in admin ({{ currentUserEmail() }})</p>
                   }
                </div>
            </div>
          </div>

          <div class="p-4 bg-gray-50 rounded-b-lg flex justify-end gap-3 border-t border-gray-100">
            <button type="button" (click)="closeModal()" class="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button type="submit" [disabled]="unbanForm.invalid || emailMismatch" class="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 shadow-sm disabled:opacity-50 transition-colors">Confirm Unban</button>
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
export class UnbanUserModalComponent {
  private fb = inject(FormBuilder);

  banReason = input<string | undefined>('');
  currentUserEmail = input<string | undefined>('');

  confirm = output<{ reason: string, adminName: string, adminEmail: string }>();
  close = output<void>();

  unbanForm = this.fb.group({
    reason: ['', Validators.required],
    adminName: ['', Validators.required],
    adminEmail: ['', [Validators.required, Validators.email]]
  });

  get emailMismatch() {
    const inputEmail = this.unbanForm.get('adminEmail')?.value;
    const validEmail = this.currentUserEmail();
    if (!inputEmail || !validEmail) return false; // Let default validators handle empty
    return inputEmail.toLowerCase() !== validEmail.toLowerCase();
  }

  closeModal() {
    this.close.emit();
  }

  onConfirm() {
    if (this.unbanForm.valid && !this.emailMismatch) {
      this.confirm.emit(this.unbanForm.value as any);
    }
  }
}
