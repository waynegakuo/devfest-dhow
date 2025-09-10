import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Ship Configuration interface
export interface ShipConfiguration {
  // Fleet Settings
  fleetName: string;
  maxVoyages: number;
  navigatorCapacity: number;

  // Navigation Systems
  autoNavigation: boolean;
  realTimeUpdates: boolean;
  sessionBuffer: number;

  // Communication Hub
  emailNotifications: boolean;
  pushNotifications: boolean;
  communicationChannel: 'slack' | 'discord' | 'teams' | 'email';

  // Security Protocols
  twoFactorAuth: boolean;
  sessionTimeout: number;
  accessLevel: 'public' | 'registered' | 'invited';
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.scss'
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
  // Configuration state
  shipConfig = signal<ShipConfiguration>({
    // Fleet Settings
    fleetName: 'DevFest Dhow Fleet',
    maxVoyages: 5,
    navigatorCapacity: 200,

    // Navigation Systems
    autoNavigation: true,
    realTimeUpdates: true,
    sessionBuffer: 15,

    // Communication Hub
    emailNotifications: true,
    pushNotifications: true,
    communicationChannel: 'slack',

    // Security Protocols
    twoFactorAuth: false,
    sessionTimeout: 60,
    accessLevel: 'registered'
  });

  // Original config for change detection
  private originalConfig: ShipConfiguration;

  // Status messages
  statusMessage = signal<string>('');
  statusType = signal<'success' | 'error' | 'info'>('info');

  constructor() {
    this.originalConfig = { ...this.shipConfig() };
  }

  ngOnInit(): void {
    this.loadConfiguration();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  // Load configuration from storage or service
  private loadConfiguration(): void {
    try {
      const savedConfig = localStorage.getItem('devfest-ship-config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        this.shipConfig.set(config);
        this.originalConfig = { ...config };
      }
    } catch (error) {
      console.error('Failed to load ship configuration:', error);
      this.showStatus('Failed to load saved configuration', 'error');
    }
  }

  // Check if there are unsaved changes
  hasChanges(): boolean {
    const current = this.shipConfig();
    return JSON.stringify(current) !== JSON.stringify(this.originalConfig);
  }

  // Fleet Configuration Methods
  updateFleetName(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.shipConfig.update(config => ({
      ...config,
      fleetName: target.value
    }));
  }

  updateMaxVoyages(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.shipConfig.update(config => ({
      ...config,
      maxVoyages: parseInt(target.value, 10) || 1
    }));
  }

  updateNavigatorCapacity(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.shipConfig.update(config => ({
      ...config,
      navigatorCapacity: parseInt(target.value, 10) || 10
    }));
  }

  // Navigation System Methods
  toggleAutoNavigation(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.shipConfig.update(config => ({
      ...config,
      autoNavigation: target.checked
    }));
  }

  toggleRealTimeUpdates(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.shipConfig.update(config => ({
      ...config,
      realTimeUpdates: target.checked
    }));
  }

  updateSessionBuffer(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.shipConfig.update(config => ({
      ...config,
      sessionBuffer: parseInt(target.value, 10) || 0
    }));
  }

  // Communication Methods
  toggleEmailNotifications(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.shipConfig.update(config => ({
      ...config,
      emailNotifications: target.checked
    }));
  }

  togglePushNotifications(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.shipConfig.update(config => ({
      ...config,
      pushNotifications: target.checked
    }));
  }

  updateCommunicationChannel(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.shipConfig.update(config => ({
      ...config,
      communicationChannel: target.value as ShipConfiguration['communicationChannel']
    }));
  }

  // Security Methods
  toggleTwoFactorAuth(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.shipConfig.update(config => ({
      ...config,
      twoFactorAuth: target.checked
    }));
  }

  updateSessionTimeout(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.shipConfig.update(config => ({
      ...config,
      sessionTimeout: parseInt(target.value, 10) || 15
    }));
  }

  updateAccessLevel(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.shipConfig.update(config => ({
      ...config,
      accessLevel: target.value as ShipConfiguration['accessLevel']
    }));
  }

  // Action Methods
  saveConfiguration(): void {
    try {
      const config = this.shipConfig();
      localStorage.setItem('devfest-ship-config', JSON.stringify(config));
      this.originalConfig = { ...config };
      this.showStatus('Ship configuration saved successfully! ⚓', 'success');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      this.showStatus('Failed to save configuration. Please try again.', 'error');
    }
  }

  resetToDefaults(): void {
    const defaultConfig: ShipConfiguration = {
      fleetName: 'DevFest Dhow Fleet',
      maxVoyages: 5,
      navigatorCapacity: 200,
      autoNavigation: true,
      realTimeUpdates: true,
      sessionBuffer: 15,
      emailNotifications: true,
      pushNotifications: true,
      communicationChannel: 'slack',
      twoFactorAuth: false,
      sessionTimeout: 60,
      accessLevel: 'registered'
    };

    this.shipConfig.set(defaultConfig);
    this.showStatus('Configuration reset to default values', 'info');
  }

  // Utility Methods
  private showStatus(message: string, type: 'success' | 'error' | 'info'): void {
    this.statusMessage.set(message);
    this.statusType.set(type);

    // Auto-clear status message after 5 seconds
    setTimeout(() => {
      this.statusMessage.set('');
    }, 5000);
  }
}
