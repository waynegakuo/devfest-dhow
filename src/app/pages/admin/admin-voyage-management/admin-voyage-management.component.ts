import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Voyage } from '../../../models/voyage.model';

@Component({
  selector: 'app-admin-voyage-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-voyage-management.component.html',
  styleUrl: './admin-voyage-management.component.scss'
})
export class AdminVoyageManagementComponent {

  // Voyages data (mock data for demonstration)
  readonly voyages = signal<Voyage[]>([
    {
      id: '1',
      name: 'Opening Waters - Morning Keynotes',
      date: '2025-03-15',
      islands: []
    },
    {
      id: '2',
      name: 'First Wave Breakouts - 12:00 PM',
      date: '2025-03-15',
      islands: []
    },
    {
      id: '3',
      name: 'Afternoon Expeditions - 2:00 PM',
      date: '2025-03-15',
      islands: []
    }
  ]);

  // Modal and form states
  readonly showCreateModal = signal(false);
  readonly showEditModal = signal(false);
  readonly selectedVoyage = signal<Voyage | null>(null);

  // Form data
  readonly voyageForm = signal({
    name: '',
    date: ''
  });

  // Create new voyage
  createVoyage(): void {
    this.resetForm();
    this.showCreateModal.set(true);
  }

  // Edit existing voyage
  editVoyage(voyage: Voyage): void {
    this.selectedVoyage.set(voyage);
    this.voyageForm.set({
      name: voyage.name,
      date: voyage.date
    });
    this.showEditModal.set(true);
  }

  // Save voyage (create or update)
  saveVoyage(): void {
    const form = this.voyageForm();
    const currentVoyages = this.voyages();

    if (this.showCreateModal()) {
      // Create new voyage
      const newVoyage: Voyage = {
        id: Date.now().toString(),
        name: form.name,
        date: form.date,
        islands: []
      };

      this.voyages.set([...currentVoyages, newVoyage]);
      this.showCreateModal.set(false);
    } else if (this.showEditModal()) {
      // Update existing voyage
      const voyageId = this.selectedVoyage()?.id;
      if (voyageId) {
        const updatedVoyages = currentVoyages.map(voyage =>
          voyage.id === voyageId
            ? { ...voyage, name: form.name, date: form.date }
            : voyage
        );
        this.voyages.set(updatedVoyages);
      }
      this.showEditModal.set(false);
    }

    this.resetForm();
  }

  // Delete voyage
  deleteVoyage(voyageId: string): void {
    if (confirm('Are you sure you want to delete this voyage? This action cannot be undone.')) {
      const currentVoyages = this.voyages();
      const updatedVoyages = currentVoyages.filter(voyage => voyage.id !== voyageId);
      this.voyages.set(updatedVoyages);
    }
  }

  // Cancel modal
  cancelModal(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.selectedVoyage.set(null);
    this.resetForm();
  }

  // Reset form
  private resetForm(): void {
    this.voyageForm.set({
      name: '',
      date: ''
    });
  }

  // Format date for display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
