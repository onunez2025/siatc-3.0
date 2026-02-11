import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService, Ticket } from '../services/ticket.service';
import { AuthService } from '../services/auth.service';
import { TICKET_ENTITY, TICKETS_TABLE_VIEW, TICKETS_DECK_VIEW, TICKETS_FORM_VIEW } from '../app/core/config/tickets.config';
import { GenericTableComponent } from '../app/shared/templates/generic-table/generic-table.component';
import { GenericDeckComponent } from '../app/shared/templates/generic-deck/generic-deck.component';
import { GenericFormComponent } from '../app/shared/templates/generic-form/generic-form.component';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, GenericTableComponent, GenericDeckComponent, GenericFormComponent],
  template: `
    <div class="h-full flex flex-col">
      <!-- Desktop View -->
      <div class="hidden lg:block h-full">
        <app-generic-table 
            [view]="tableView" 
            [entity]="entity" 
            [data]="ticketService.tickets()"
            (actionTriggered)="handleAction($event)"
        ></app-generic-table>
      </div>

      <!-- Mobile View -->
      <div class="block lg:hidden h-full">
        <app-generic-deck 
            [view]="deckView" 
            [entity]="entity" 
            [data]="ticketService.tickets()"
            (actionTriggered)="handleAction($event)"
        ></app-generic-deck>
      </div>

      <!-- Form Modal -->
      @if (isFormOpen()) {
        <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <app-generic-form
                    [view]="formView" 
                    [entity]="entity"
                    [data]="selectedTicket()"
                    (save)="onSave($event)"
                    (cancel)="closeForm()"
                ></app-generic-form>
            </div>
        </div>
      }
    </div>
  `
})
export class TicketListComponent {
  ticketService = inject(TicketService);
  authService = inject(AuthService);

  // Config
  entity = TICKET_ENTITY;
  tableView = TICKETS_TABLE_VIEW;
  deckView = TICKETS_DECK_VIEW;
  formView = TICKETS_FORM_VIEW;

  // State
  isFormOpen = signal(false);
  selectedTicket = signal<Ticket | null>(null);

  handleAction(event: { action: any, item?: any }) {
    switch (event.action.type) {
      case 'create':
        // Logic for new ticket
        this.selectedTicket.set({} as Ticket); // Empty ticket
        this.isFormOpen.set(true);
        break;
      case 'update':
        // Logic for edit ticket
        this.selectedTicket.set(event.item);
        this.isFormOpen.set(true);
        break;
      case 'delete':
        if (confirm('¿Estás seguro de eliminar este ticket?')) {
          this.ticketService.deleteTicket(event.item.Ticket);
        }
        break;
      case 'navigate':
        // If click card on mobile, go to edit for now, or detail if implemented
        this.handleAction({ action: { type: 'update' }, item: event.item });
        break;
    }
  }

  onSave(formData: any) {
    const current = this.selectedTicket();

    // Merge ID if exists (for updates)
    const ticketToSave = {
      ...formData,
      Ticket: current?.Ticket // Preserve ID if editing
    };

    console.log('Saving ticket:', ticketToSave);

    this.ticketService.saveTicket(ticketToSave).then(success => {
      if (success) {
        this.closeForm();
      } else {
        alert('Error al guardar el ticket');
      }
    });
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.selectedTicket.set(null);
  }
}
