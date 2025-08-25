import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Island } from '../../models/island.model';
import { Voyage } from '../../models/voyage.model';
import { NavigatorSidebarComponent } from '../../shared/components/navigator-sidebar/navigator-sidebar.component';

@Component({
  selector: 'app-helm-dashboard',
  standalone: true,
  imports: [CommonModule, NavigatorSidebarComponent],
  templateUrl: './helm-dashboard.component.html',
  styleUrl: './helm-dashboard.component.scss'
})
export class HelmDashboardComponent {
  // Navigator's personal voyages and schedule
  private voyagesSignal = signal<Voyage[]>([
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
          description: 'Join us as we set sail on an incredible journey through the latest in tech and development. Get ready to navigate through exciting waters of innovation.',
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
          description: 'Explore the latest trends and best practices in modern web development, from performance optimization to user experience design.',
          tags: ['Web Development', 'Performance', 'UX'],
          attended: false
        }
      ]
    },
    {
      id: 'voyage-2',
      name: 'Technical Deep Dive',
      date: '2025-02-15',
      islands: [
        {
          id: 'island-3',
          title: 'AI-Powered Navigation: Machine Learning in Production',
          speaker: 'Dr. Amara Okafor',
          speakerRole: 'ML Research Scientist',
          speakerCompany: 'DeepMind',
          time: '11:30',
          duration: '50 min',
          venue: 'AI Archipelago',
          description: 'Discover how to successfully deploy machine learning models in production environments and navigate the challenges of scaling AI systems.',
          tags: ['AI', 'Machine Learning', 'Production'],
          attended: false
        },
        {
          id: 'island-4',
          title: 'Cloud Harbor: Scaling Applications on Google Cloud',
          speaker: 'Michael Chen',
          speakerRole: 'Cloud Solutions Architect',
          speakerCompany: 'Google Cloud',
          time: '14:00',
          duration: '40 min',
          venue: 'Cloud Cove',
          description: 'Learn how to leverage Google Cloud Platform to build scalable, reliable applications that can weather any storm.',
          tags: ['Cloud', 'Scaling', 'Architecture'],
          attended: false
        }
      ]
    },
    {
      id: 'voyage-3',
      name: 'Innovation Islands',
      date: '2025-02-15',
      islands: [
        {
          id: 'island-5',
          title: 'Flutter Winds: Cross-Platform Development',
          speaker: 'Fatima Al-Rashid',
          speakerRole: 'Mobile Development Lead',
          speakerCompany: 'Spotify',
          time: '15:30',
          duration: '45 min',
          venue: 'Flutter Bay',
          description: 'Set sail with Flutter and discover how to build beautiful, natively compiled applications for mobile, web, and desktop from a single codebase.',
          tags: ['Flutter', 'Mobile', 'Cross-Platform'],
          attended: false
        },
        {
          id: 'island-6',
          title: 'DevOps Currents: Streamlining Development Workflows',
          speaker: 'James Peterson',
          speakerRole: 'DevOps Engineer',
          speakerCompany: 'GitHub',
          time: '16:30',
          duration: '35 min',
          venue: 'DevOps Dock',
          description: 'Navigate through modern DevOps practices and learn how to create efficient CI/CD pipelines that keep your development ship sailing smoothly.',
          tags: ['DevOps', 'CI/CD', 'Automation'],
          attended: false
        }
      ]
    }
  ]);

  readonly voyages = this.voyagesSignal.asReadonly();

  // Navigator's progress tracking
  private progressSignal = signal({
    totalIslands: 6,
    attendedIslands: 0,
    completionRate: 0
  });

  readonly progress = this.progressSignal.asReadonly();

  // Current navigator info (dummy data)
  navigator = {
    name: 'Navigator Explorer',
    email: 'explorer@devfest.com',
    registrationNumber: 'DHW2025-001',
    voyageLevel: 'Captain'
  };

  // Navigator Tools Sidebar state
  private sidebarOpenSignal = signal(false);

  readonly sidebarOpen = this.sidebarOpenSignal.asReadonly();

  // Toggle island attendance
  toggleAttendance(voyageId: string, islandId: string): void {
    const voyages = this.voyagesSignal();
    const updatedVoyages = voyages.map(voyage => {
      if (voyage.id === voyageId) {
        return {
          ...voyage,
          islands: voyage.islands.map(island => {
            if (island.id === islandId) {
              return { ...island, attended: !island.attended };
            }
            return island;
          })
        };
      }
      return voyage;
    });

    this.voyagesSignal.set(updatedVoyages);
    this.updateProgress();
  }

  // Update progress statistics
  private updateProgress(): void {
    const voyages = this.voyagesSignal();
    const totalIslands = voyages.reduce((total, voyage) => total + voyage.islands.length, 0);
    const attendedIslands = voyages.reduce((total, voyage) =>
      total + voyage.islands.filter(island => island.attended).length, 0);
    const completionRate = totalIslands > 0 ? Math.round((attendedIslands / totalIslands) * 100) : 0;

    this.progressSignal.set({
      totalIslands,
      attendedIslands,
      completionRate
    });
  }

  // Get islands by time for chronological view
  getAllIslandsByTime(): Island[] {
    const allIslands: Island[] = [];
    this.voyages().forEach(voyage => {
      allIslands.push(...voyage.islands);
    });
    return allIslands.sort((a, b) => a.time.localeCompare(b.time));
  }

  // Check if island is happening now or soon
  isIslandUpcoming(island: Island): boolean {
    // For demo purposes, consider sessions in the next 2 hours as upcoming
    const now = new Date();
    const sessionTime = new Date();
    const [hours, minutes] = island.time.split(':');
    sessionTime.setHours(parseInt(hours), parseInt(minutes));

    const timeDiff = sessionTime.getTime() - now.getTime();
    return timeDiff > 0 && timeDiff <= 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  }

  // Get voyage ID for a given island ID
  getVoyageForIsland(islandId: string): string {
    const voyage = this.voyages().find(voyage =>
      voyage.islands.some(island => island.id === islandId)
    );
    return voyage?.id || '';
  }

  // Get count of attended islands for a voyage
  getAttendedCount(voyage: Voyage): number {
    return voyage.islands.filter(island => island.attended).length;
  }

  // Navigator Tools Sidebar methods
  toggleSidebar(): void {
    this.sidebarOpenSignal.set(!this.sidebarOpen());
  }

  closeSidebar(): void {
    this.sidebarOpenSignal.set(false);
  }

  setActiveTool(toolId: string): void {
    // Tool change is handled by the sidebar component
    // This method is kept for the event binding but doesn't need implementation
  }
}
