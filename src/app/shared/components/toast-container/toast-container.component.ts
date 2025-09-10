import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss'
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);

  // Expose the toasts signal to the template
  toasts = this.toastService.toasts$;

  /**
   * Close a specific toast
   */
  closeToast(toastId: string): void {
    this.toastService.removeToast(toastId);
  }

  /**
   * Get the appropriate icon for each toast type
   */
  getToastIcon(type: string): string {
    switch (type) {
      case 'success':
        return '🎉';
      case 'error':
        return '⚠️';
      case 'warning':
        return '🚨';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  }

  /**
   * Get ocean-themed title for toast types
   */
  getToastTypeTitle(type: string): string {
    switch (type) {
      case 'success':
        return 'Smooth Sailing!';
      case 'error':
        return 'Rough Seas';
      case 'warning':
        return 'Weather Alert';
      case 'info':
        return 'Navigator Update';
      default:
        return 'Ship Notice';
    }
  }
}
