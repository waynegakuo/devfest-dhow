# 🚢 DevFest Dhow - Developer Guidelines

Welcome aboard, Navigator! This guide will help you set sail with the DevFest Dhow PWA development.

## 🗺️ Project Overview

**DevFest Dhow** is an Angular 19 Progressive Web App with Server-Side Rendering (SSR) for DevFest Pwani 2025. Built with TypeScript, SCSS, and Express.js for optimal performance.

### 🛠️ Tech Stack
- **Angular 19** - Latest framework with standalone components
- **TypeScript 5.7** - Type-safe JavaScript
- **SCSS** - Enhanced CSS with variables and mixins
- **Express.js** - Server-side rendering
- **Karma + Jasmine** - Unit testing framework
- **PWA** - Progressive Web App capabilities

## 📁 Project Structure

```
devfest-dhow/
├── src/
│   ├── app/                    # Main application code
│   │   ├── app.component.*     # Root component files
│   │   ├── app.config.*        # App configuration (client & server)
│   │   └── app.routes.*        # Routing configuration
│   ├── index.html              # Main HTML template
│   ├── main.ts                 # Client-side bootstrap
│   ├── main.server.ts          # Server-side bootstrap
│   ├── server.ts               # Express server configuration
│   └── styles.scss             # Global styles
├── public/                     # Static assets
├── angular.json                # Angular CLI configuration
├── package.json                # Dependencies and scripts
└── tsconfig.*.json             # TypeScript configurations
```

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS version recommended)
- npm or yarn package manager

### Installation
```bash
npm install
```

### Development Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start development server (localhost:4200) |
| `npm run build` | Build for production |
| `npm run watch` | Build with file watching |
| `npm test` | Run unit tests |
| `npm run serve:ssr:devfest-dhow` | Serve SSR build |

## 🏗️ Development Workflow

### Creating New Components
Use Angular CLI for consistent structure:
```bash
ng generate component voyage-tracker
ng generate service navigation
ng generate guard helm-auth
```

### Ocean-Themed Naming Conventions
Follow the maritime theme in your code:
- **Navigators** - Users/attendees
- **Voyages** - Conference tracks
- **Islands** - Sessions/talks
- **The Helm** - Dashboard/control center
- **Ports** - Venues/locations
- **Compass** - Navigation components
- **Anchor** - Fixed/persistent elements

Example component names:
- `VoyageListComponent`
- `IslandDetailsComponent`
- `NavigatorProfileComponent`
- `HelmDashboardComponent`

## 🎯 Code Organization Best Practices

### Component Structure
```typescript
// voyage-list.component.ts
@Component({
  selector: 'app-voyage-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './voyage-list.component.html',
  styleUrl: './voyage-list.component.scss'
})
export class VoyageListComponent {
  // Ocean-themed properties
  voyages: Voyage[] = [];
  selectedVoyage: Voyage | null = null;
  
  // Methods with maritime naming
  setCourseTo(voyage: Voyage) { ... }
  dropAnchor() { ... }
  castOff() { ... }
}
```

### Service Patterns
```typescript
// navigation.service.ts
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private currentPort = signal<Port | null>(null);
  private voyageHistory = signal<Voyage[]>([]);
  
  navigateToIsland(island: Island) { ... }
  returnToHelm() { ... }
}
```

### SCSS Organization
- Use global variables in `styles.scss`
- Component-specific styles in component `.scss` files
- Ocean-themed color palette and naming

## ⚡ Angular Best Practices

### Standalone Components
- Use standalone components (Angular 19 default) for better tree-shaking
- Import dependencies directly in component decorators

```typescript
@Component({
  selector: 'app-voyage-tracker',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './voyage-tracker.component.html',
  styleUrl: './voyage-tracker.component.scss'
})
export class VoyageTrackerComponent { }
```

### Change Detection Strategy
- Implement OnPush change detection where possible for better performance
- Use signals for reactive state management
- Minimize unnecessary change detection cycles

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ... other config
})
export class NavigatorProfileComponent {
  private navigatorSignal = signal<Navigator | null>(null);
  readonly navigator = this.navigatorSignal.asReadonly();
}
```

### Modern Angular Features
- Follow Angular style guide naming conventions
- Use @for and @if control flow syntax (Angular 17+) instead of *ngFor and *ngIf
- Use the inject() function instead of constructor injection for dependency injection

```typescript
// Modern control flow syntax
@Component({
  template: `
    @if (voyages().length > 0) {
      @for (voyage of voyages(); track voyage.id) {
        <div>{{ voyage.name }}</div>
      }
    }
  `
})
export class VoyageListComponent {
  private voyageService = inject(VoyageService);
  private router = inject(Router);
  
  voyages = signal<Voyage[]>([]);
}
```

### Guards and Resolvers
- Use functional guards and resolvers instead of class-based ones
- Always export interfaces and types for better code organization

```typescript
// Functional guard
export const helmGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  return authService.isNavigatorAuthenticated();
};

// Export interfaces
export interface Voyage {
  id: string;
  name: string;
  islands: Island[];
}

export interface Navigator {
  id: string;
  name: string;
  voyages: Voyage[];
}

## 🧪 Testing Guidelines

### Unit Tests
- Follow AAA pattern (Arrange, Act, Assert)
- Use ocean-themed test descriptions
- Mock services with maritime names

```typescript
describe('VoyageListComponent', () => {
  it('should display all available voyages', () => {
    // Test implementation
  });
  
  it('should navigate to selected voyage island', () => {
    // Test implementation
  });
});
```

### Running Tests
```bash
npm test                    # Run once
npm test -- --watch        # Watch mode
npm test -- --code-coverage # With coverage
```

## 🌊 PWA Configuration

### Service Worker
- Handled automatically by Angular PWA
- Cache strategies for offline support
- Background sync for user data

### Performance Budgets
- Initial bundle: max 1MB (warning at 500kB)
- Component styles: max 8kB (warning at 4kB)

## 🎨 Styling Guidelines

### Primary: Tailwind CSS
- Use Tailwind CSS utility classes as the primary styling approach
- Only write custom CSS when Tailwind utilities are insufficient
- Leverage Tailwind's responsive design utilities
- Create global styles for common styles used across the application

```html
<!-- Example: Using Tailwind classes -->
<div class="bg-ocean-blue text-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <h2 class="text-xl font-bold mb-2">Voyage Details</h2>
  <p class="text-sm opacity-90">Navigate your conference journey</p>
</div>
```

### Secondary: SCSS for Complex Styles
- Use SCSS only for complex styles that can't be achieved with Tailwind
- Component styles: Use `:host` for component root styling
- Global styles: Add to `src/styles.scss`
- Always reuse styles from global styles file
- If needed styles aren't available, add them to global styles file first

```scss
// Component-specific complex styles
:host {
  display: block;
  @apply bg-gradient-to-br from-ocean-blue to-deep-sea;
}

.complex-animation {
  @keyframes wave-motion {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  animation: wave-motion 2s ease-in-out infinite;
}
```

### Angular Material Integration
- Use Angular Material components with magenta-violet theme
- Customize Material components using CSS custom properties
- Maintain ocean theme consistency in Material components

```typescript
// Material theme configuration
export const oceanTheme = {
  primary: {
    50: '#f3e5f5',
    500: '#9c27b0', // magenta-violet
    700: '#7b1fa2',
  }
};
```

### SCSS Variables & Ocean Palette
```scss
// Ocean-themed color palette
$ocean-blue: #1565C0;
$wave-teal: #00ACC1;
$sand-beige: #D7CCC8;
$coral-orange: #FF7043;
$deep-sea: #0D47A1;
$magenta-violet: #9c27b0;
```

### Performance & Bundle Monitoring
- Always test SCSS files don't exceed maximum budgets (4kB warning, 8kB error)
- Monitor component style sizes during development
- Use `ng build --stats-json` to analyze bundle composition
- Prefer Tailwind utilities over custom CSS to reduce bundle size

### Component Styling Best Practices
- Use BEM methodology when custom CSS is required
- Prefix custom classes with ocean themes
- Responsive design first approach
- Reuse global styles and variables

## ⚡ Performance Considerations

### Bundle Optimization
- Minimize bundle size by avoiding unnecessary dependencies
- Use tree-shaking with standalone components
- Lazy load feature modules where appropriate
- Monitor bundle size with `ng build --stats-json`

### Change Detection & RxJS
- Use trackBy with @for directives for better performance
- Implement proper unsubscribe patterns for RxJS observables
- Use OnPush change detection strategy where possible
- Prefer signals over observables for simple state

```typescript
// TrackBy example
@Component({
  template: `
    @for (voyage of voyages(); track trackByVoyageId) {
      <voyage-card [voyage]="voyage"></voyage-card>
    }
  `
})
export class VoyageListComponent {
  voyages = signal<Voyage[]>([]);
  
  trackByVoyageId(index: number, voyage: Voyage): string {
    return voyage.id;
  }
}

// Proper unsubscribe pattern
export class NavigatorService implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private subscribeToUpdates() {
    return this.updates$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(/* handle updates */);
  }
}
```

### Server-Side Rendering
- Consider using server-side rendering for improved initial load time
- Avoid browser-specific APIs in SSR components
- Use Angular Universal best practices
- Implement proper hydration strategies

## 📝 File Naming Conventions

### Components & Services
- **Components**: kebab-case.component.ts
- **Services**: kebab-case.service.ts
- **Guards**: kebab-case.guard.ts
- **Interceptors**: kebab-case.interceptor.ts

### Interfaces & Types
- **Interfaces**: PascalCase.interface.ts
- **Types**: PascalCase.type.ts
- **Enums**: PascalCase.enum.ts

### Constants & Configuration
- **Constants**: UPPER_SNAKE_CASE
- **Configuration files**: kebab-case.config.ts
- **Environment files**: environment.prod.ts

### Examples
```
voyage-list.component.ts
navigation.service.ts
helm-auth.guard.ts
Navigator.interface.ts
VoyageStatus.enum.ts
API_ENDPOINTS (constant)
ocean-theme.config.ts
```

## 🌊 Git Workflow

### Feature Development
```bash
# Create feature branch
git checkout -b feature/voyage-tracker

# Make changes and commit
git add .
git commit -m "feat: add voyage tracking functionality"

# Push feature branch
git push origin feature/voyage-tracker

# Create pull request for code review
```

### Commit Message Format
Follow conventional commits specification:
```bash
feat: add new voyage selection feature
fix: resolve navigation issue in helm dashboard  
docs: update API documentation for islands
style: improve ocean theme styling
refactor: optimize voyage list performance
test: add unit tests for navigator service
```

### Branch Naming
- **Features**: `feature/feature-name`
- **Bug fixes**: `fix/bug-description`
- **Hotfixes**: `hotfix/critical-issue`
- **Documentation**: `docs/update-description`

## 🔧 Build Configuration

### Production Build
```bash
npm run build
```
Output: `dist/devfest-dhow/`

### SSR Build
Server-side rendering is configured for better SEO and performance.

### Environment Configuration
- Development: Source maps enabled, optimization off
- Production: Optimized bundle, hash-based caching

## 📝 Code Quality

### Linting & Formatting
- Follow Angular ESLint rules for consistent code style
- Use Prettier for automatic code formatting
- Configure pre-commit hooks for quality checks
- Maintain consistent indentation and spacing

### TypeScript Standards
- Enable strict mode in TypeScript configuration
- Use explicit type annotations for public APIs
- Prefer interfaces over types for object shapes
- Implement proper error handling with typed exceptions

```typescript
// Good: Explicit typing and error handling
export interface VoyageConfig {
  readonly id: string;
  readonly name: string;
  readonly islands: readonly Island[];
}

export class NavigationError extends Error {
  constructor(
    message: string,
    public readonly voyageId: string
  ) {
    super(message);
    this.name = 'NavigationError';
  }
}
```

### Testing Standards
- Maintain >80% test coverage across the application
- Write unit tests for all services and components
- Implement integration tests for critical user flows
- Use ocean-themed test descriptions and mock data

```typescript
describe('VoyageNavigationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VoyageNavigationService]
    });
  });

  it('should successfully chart course to selected island', () => {
    // Arrange
    const mockVoyage = createMockVoyage();
    const targetIsland = mockVoyage.islands[0];
    
    // Act
    const result = service.navigateToIsland(targetIsland);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.currentLocation).toEqual(targetIsland);
  });
});
```

### Performance Standards
- Monitor and maintain bundle size budgets
- Implement lazy loading for feature modules
- Use OnPush change detection where applicable
- Profile and optimize critical rendering paths

```bash
# Monitor bundle size
ng build --stats-json
npm install -g webpack-bundle-analyzer
webpack-bundle-analyzer dist/devfest-dhow/stats.json
```

### Code Organization
- Use meaningful variable and function names
- Comment complex maritime logic and algorithms
- Maintain consistent file and folder structure
- Follow single responsibility principle

## 🚨 Common Pitfalls

1. **SSR Compatibility** - Avoid browser-only APIs in components
2. **Bundle Size** - Monitor component imports
3. **Ocean Theming** - Maintain consistent maritime terminology
4. **Performance** - Use OnPush change detection where possible

---

*May fair winds guide your development journey! ⛵*
