import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Island } from '../../../models/island.model';
import { Voyage } from '../../../models/voyage.model';

export interface NavigatorTool {
  id: string;
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-navigator-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigator-sidebar.component.html',
  styleUrl: './navigator-sidebar.component.scss'
})
export class NavigatorSidebarComponent {
  // Input properties
  @Input() isOpen = false;
  @Input() voyages: Voyage[] = [];
  @Input() progress: { totalIslands: number; attendedIslands: number; completionRate: number } = {
    totalIslands: 0,
    attendedIslands: 0,
    completionRate: 0
  };

  // Output events
  @Output() sidebarClose = new EventEmitter<void>();
  @Output() toolChange = new EventEmitter<string>();

  // Internal state
  private activeToolSignal = signal<string>('schedule');
  readonly activeTool = this.activeToolSignal.asReadonly();

  // Navigator tools configuration
  navigatorTools: NavigatorTool[] = [
    { id: 'schedule', name: 'Full Schedule', icon: '🗺️', description: 'View complete conference schedule' },
    { id: 'agenda', name: 'Download Agenda', icon: '📋', description: 'Download your personal agenda' },
    { id: 'reminders', name: 'Set Reminders', icon: '🎯', description: 'Manage session reminders' },
    { id: 'connect', name: 'Connect', icon: '👥', description: 'Connect with other navigators' }
  ];

  // Close sidebar
  closeSidebar(): void {
    this.sidebarClose.emit();
  }

  // Set active tool
  setActiveTool(toolId: string): void {
    this.activeToolSignal.set(toolId);
    this.toolChange.emit(toolId);
  }

  // Get islands by time for chronological view
  getAllIslandsByTime(): Island[] {
    const allIslands: Island[] = [];
    this.voyages.forEach(voyage => {
      allIslands.push(...voyage.islands);
    });
    return allIslands.sort((a, b) => a.time.localeCompare(b.time));
  }
}
