import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../services/auth.service';
import { TranslatePipe } from '../pipes/translate.pipe';
import { USER_ENTITY, USERS_TABLE_VIEW, USERS_DECK_VIEW } from '../app/core/config/users.config';
import { GenericTableComponent } from '../app/shared/templates/generic-table/generic-table.component';
import { GenericDeckComponent } from '../app/shared/templates/generic-deck/generic-deck.component';
import { GenericFormComponent } from '../app/shared/templates/generic-form/generic-form.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, TranslatePipe, GenericTableComponent, GenericDeckComponent, GenericFormComponent],
  template: `
    <div class="h-full flex flex-col">
      <!-- Desktop View -->
      <div class="hidden lg:block h-full">
        <app-generic-table 
            [view]="tableView" 
            [entity]="entity" 
            [data]="authService.users()"
            (actionTriggered)="handleAction($event)"
        ></app-generic-table>
      </div>

      <!-- Mobile View -->
      <div class="block lg:hidden h-full">
        <app-generic-deck 
            [view]="deckView" 
            [entity]="entity" 
            [data]="authService.users()"
            (actionTriggered)="handleAction($event)"
        ></app-generic-deck>
      </div>

      <!-- Form Modal -->
      @if (isFormOpen()) {
        <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                <app-generic-form
                    [view]="tableView" 
                    [entity]="entity"
                    [data]="selectedUser()"
                    (save)="onSave($event)"
                    (cancel)="closeForm()"
                ></app-generic-form>
            </div>
        </div>
      }
    </div>
  `
})
export class UserManagementComponent {
  authService = inject(AuthService);

  // Config
  entity = USER_ENTITY;
  tableView = USERS_TABLE_VIEW;
  deckView = USERS_DECK_VIEW;

  // State
  isFormOpen = signal(false);
  selectedUser = signal<User | null>(null);

  handleAction(event: { action: any, item?: any }) {
    switch (event.action.type) {
      case 'create':
        this.selectedUser.set(null);
        this.isFormOpen.set(true);
        break;
      case 'update':
        this.selectedUser.set(event.item);
        this.isFormOpen.set(true);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this user?')) {
          alert('Delete logic not implemented yet');
        }
        break;
      case 'navigate': // Mobile card click
        this.handleAction({ action: { type: 'update' }, item: event.item });
        break;
    }
  }

  onSave(formData: any) {
    if (this.selectedUser()) {
      // Edit
      this.authService.updateUser(this.selectedUser()!.username, formData).subscribe({
        next: () => {
          this.authService.loadUsers();
          this.closeForm();
        },
        error: (err) => alert('Error updating user')
      });
    } else {
      // Create
      alert('Create user not implemented yet');
      // Implement create logic in AuthService
    }
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.selectedUser.set(null);
  }
}