import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  isVisible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = signal<Toast[]>([]);

  // Public readonly signal for components to subscribe to
  readonly toasts$ = this.toasts.asReadonly();

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Show a success toast notification
   */
  showSuccess(title: string, message?: string, duration: number = 4000): void {
    this.addToast({
      type: 'success',
      title,
      message,
      duration
    });
  }

  /**
   * Show an error toast notification
   */
  showError(title: string, message?: string, duration: number = 5000): void {
    this.addToast({
      type: 'error',
      title,
      message,
      duration
    });
  }

  /**
   * Show a warning toast notification
   */
  showWarning(title: string, message?: string, duration: number = 4000): void {
    this.addToast({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  /**
   * Show an info toast notification
   */
  showInfo(title: string, message?: string, duration: number = 4000): void {
    this.addToast({
      type: 'info',
      title,
      message,
      duration
    });
  }

  /**
   * Remove a specific toast by ID
   */
  removeToast(id: string): void {
    const currentToasts = this.toasts();
    const toastIndex = currentToasts.findIndex(toast => toast.id === id);

    if (toastIndex !== -1) {
      // Mark as not visible for fade-out animation
      const updatedToasts = [...currentToasts];
      updatedToasts[toastIndex] = { ...updatedToasts[toastIndex], isVisible: false };
      this.toasts.set(updatedToasts);

      // Remove from array after animation
      setTimeout(() => {
        const finalToasts = this.toasts().filter(toast => toast.id !== id);
        this.toasts.set(finalToasts);
      }, 300); // Match CSS transition duration
    }
  }

  /**
   * Clear all toasts
   */
  clearAll(): void {
    this.toasts.set([]);
  }

  /**
   * Private method to add a toast to the array
   */
  private addToast(toastData: Omit<Toast, 'id' | 'isVisible'>): void {
    const toast: Toast = {
      id: this.generateId(),
      isVisible: true,
      ...toastData
    };

    // Add to beginning of array (newest first)
    const currentToasts = this.toasts();
    this.toasts.set([toast, ...currentToasts]);

    // Auto-remove after specified duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.removeToast(toast.id);
      }, toast.duration);
    }
  }
}
