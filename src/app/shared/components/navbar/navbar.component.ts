import { Component, inject, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { UserAuthComponent } from '../user-auth/user-auth.component';
import { HelpPopupComponent } from '../help-popup/help-popup.component';
import { RouterLink } from '@angular/router';
import { NavigatorService } from '../../../services/navigator/navigator.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, UserAuthComponent, HelpPopupComponent, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  private navigatorService = inject(NavigatorService);
  private authService = inject(AuthService);

  isMobileMenuOpen = false;
  isHelpPopupVisible = false;

  // Get current navigator data
  readonly navigator = this.navigatorService.currentNavigator.asReadonly();

  // Check if current user is admin
  readonly isAdmin = computed(() => {
    const nav = this.navigator();
    return nav?.role === 'admin';
  });

  // Available routes - only show nav links for implemented routes
  availableRoutes = {
    home: true,
    voyages: false,
    islands: false,
    navigators: false,
    helm: true,
    compass: false,
    admin: true // Admin dashboard route
  };

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleHelpPopup(): void {
    this.isHelpPopupVisible = !this.isHelpPopupVisible;
  }

  closeHelpPopup(): void {
    this.isHelpPopupVisible = false;
  }
}
