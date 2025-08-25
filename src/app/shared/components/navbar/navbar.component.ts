import { Component, inject } from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import { UserAuthComponent } from '../user-auth/user-auth.component';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgOptimizedImage, UserAuthComponent, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  isMobileMenuOpen = false;

  // Available routes - only show nav links for implemented routes
  availableRoutes = {
    home: true,
    voyages: false,
    islands: false,
    navigators: false,
    helm: true,
    compass: false
  };

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
