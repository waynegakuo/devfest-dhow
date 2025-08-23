import { Component } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-compass-nav',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './compass-nav.component.html',
  styleUrl: './compass-nav.component.scss'
})
export class CompassNavComponent {
  isMobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
