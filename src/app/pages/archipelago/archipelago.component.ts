import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Voyage } from '../../models/voyage.model';
import { Island } from '../../models/island.model';

@Component({
  selector: 'app-archipelago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archipelago.component.html',
  styleUrl: './archipelago.component.scss'
})
export class ArchipelagoComponent {

  // Mock data for full schedule - in real app this would come from a service
  voyages = signal<Voyage[]>([
    {
      id: 'voyage-1',
      name: 'Opening Waters',
      date: '2025-02-15',
      islands: [
        {
          id: 'island-1',
          title: 'Welcome Aboard - DevFest Dhow Opening',
          speaker: 'Captain Sarah Johnson',
          speakerRole: 'Lead Developer Advocate',
          speakerCompany: 'Google',
          time: '09:00',
          duration: '30 min',
          venue: 'Main Deck',
          description: 'Join us as we set sail on an incredible journey through the latest in tech and development.',
          tags: ['Opening', 'Welcome', 'Community'],
          attended: false
        },
        {
          id: 'island-2',
          title: 'Navigating Modern Web Development',
          speaker: 'Alex Rivera',
          speakerRole: 'Senior Frontend Engineer',
          speakerCompany: 'Meta',
          time: '10:00',
          duration: '45 min',
          venue: 'Angular Harbor',
          description: 'Explore the latest trends and best practices in modern web development.',
          tags: ['Web Development', 'Performance', 'UX'],
          attended: false
        }
      ]
    }
  ]);


  // Get all islands sorted by time
  getAllIslandsByTime(): Island[] {
    const allIslands: Island[] = [];
    this.voyages().forEach(voyage => {
      allIslands.push(...voyage.islands);
    });
    return allIslands.sort((a, b) => a.time.localeCompare(b.time));
  }
}
