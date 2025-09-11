import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MyVoyagePlanService } from '../../services/my-voyage-plan/my-voyage-plan.service';
import { VoyagePlanItem } from '../../models/voyage-plan.model';

@Component({
  selector: 'app-my-voyage-plan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-voyage-plan.component.html',
  styleUrl: './my-voyage-plan.component.scss'
})
export class MyVoyagePlanComponent {
  private myVoyageService = inject(MyVoyagePlanService);
  private router = inject(Router);

  // Get sorted voyage plan items from service
  readonly myVoyagePlan = this.myVoyageService.itemsSorted;
  readonly totalSessions = this.myVoyageService.items;

  // Remove session from voyage plan
  removeFromPlan(islandId: string): void {
    this.myVoyageService.removeSession(islandId);
  }

  // Clear entire voyage plan
  clearVoyagePlan(): void {
    if (confirm('Are you sure you want to clear your entire voyage plan? This action cannot be undone.')) {
      this.myVoyageService.clear();
    }
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Format time for display
  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Check if session is upcoming
  isUpcoming(item: VoyagePlanItem): boolean {
    const now = new Date();
    const sessionDateTime = new Date(`${item.voyageDate}T${item.island.time}`);
    return sessionDateTime > now;
  }

  // Navigate to archipelago using proper Angular routing
  navigateToArchipelago(): void {
    this.router.navigate(['/dashboard/archipelago']);
  }

  // Export voyage plan to calendar (ICS format)
  exportToCalendar(): void {
    const voyagePlan = this.myVoyagePlan();

    if (voyagePlan.length === 0) {
      alert('No sessions to export. Add sessions to your voyage plan first.');
      return;
    }

    const icsContent = this.generateICSContent(voyagePlan);
    this.downloadICSFile(icsContent);
  }

  // Generate ICS (iCalendar) content from voyage plan items
  private generateICSContent(items: VoyagePlanItem[]): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DevFest Dhow//Voyage Plan//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    items.forEach(item => {
      const startDateTime = this.parseDateTime(item.voyageDate, item.island.time);
      const endDateTime = this.calculateEndDateTime(startDateTime, item.island.duration);

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${item.island.id}-${timestamp}@devfest-dhow.com`,
        `DTSTAMP:${timestamp}`,
        `DTSTART:${this.formatDateTimeForICS(startDateTime)}`,
        `DTEND:${this.formatDateTimeForICS(endDateTime)}`,
        `SUMMARY:${this.escapeICSText(item.island.title)}`,
        `DESCRIPTION:${this.escapeICSText(this.formatSessionDescription(item))}`,
        `LOCATION:${this.escapeICSText(item.island.venue)}`,
        `ORGANIZER:CN=${this.escapeICSText(item.island.speaker)}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');
    return icsContent.join('\r\n');
  }

  // Parse date and time strings into Date object
  private parseDateTime(dateString: string, timeString: string): Date {
    return new Date(`${dateString}T${timeString}:00`);
  }

  // Calculate end time based on duration
  private calculateEndDateTime(startDateTime: Date, duration: string): Date {
    const endDateTime = new Date(startDateTime);

    // Parse duration (e.g., "45 minutes", "1 hour", "1.5 hours")
    const durationMatch = duration.match(/(\d+(?:\.\d+)?)\s*(minute|hour)s?/i);
    if (durationMatch) {
      const value = parseFloat(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();

      if (unit === 'hour') {
        endDateTime.setHours(endDateTime.getHours() + value);
      } else if (unit === 'minute') {
        endDateTime.setMinutes(endDateTime.getMinutes() + value);
      }
    } else {
      // Default to 1 hour if duration parsing fails
      endDateTime.setHours(endDateTime.getHours() + 1);
    }

    return endDateTime;
  }

  // Format DateTime for ICS format (YYYYMMDDTHHMMSSZ)
  private formatDateTimeForICS(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  // Format session description with all relevant details
  private formatSessionDescription(item: VoyagePlanItem): string {
    const description = [
      item.island.description,
      '',
      `Speaker: ${item.island.speaker}`,
      `Role: ${item.island.speakerRole} at ${item.island.speakerCompany}`,
      `Duration: ${item.island.duration}`,
      `Venue: ${item.island.venue}`,
      ''
    ];

    if (item.island.tags.length > 0) {
      description.push(`Tags: ${item.island.tags.join(', ')}`);
    }

    description.push('', `Part of: ${item.voyageName} (${item.voyageDate})`);
    return description.join('\n');
  }

  // Escape special characters for ICS format
  private escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  // Download ICS file
  private downloadICSFile(icsContent: string): void {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `devfest-dhow-voyage-plan-${new Date().toISOString().split('T')[0]}.ics`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}
