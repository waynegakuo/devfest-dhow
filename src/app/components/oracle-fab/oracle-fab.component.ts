import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-oracle-fab',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './oracle-fab.component.html',
  styleUrls: ['./oracle-fab.component.scss']
})
export class OracleFabComponent implements OnInit, OnDestroy {
  isVisible = true;
  private destroy$ = new Subject<void>();

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects;
      this.isVisible = !url.includes('/ask-the-oracle') && url !== '/' && !url.includes('/#');
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToOracle() {
    this.router.navigate(['/ask-the-oracle']);
  }
}
