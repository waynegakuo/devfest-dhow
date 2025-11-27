import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo/seo.service';

@Component({
  selector: 'app-codelab-doubloons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './codelab-doubloons.component.html',
  styleUrl: './codelab-doubloons.component.scss'
})
export class CodelabDoubloonsComponent implements OnInit {
  private seoService = inject(SeoService);

  ngOnInit() {
    this.seoService.setMetaTags({
      title: 'Codelab Doubloons | DevFest Pwani 2025',
      description: 'Earn Codelab Doubloons by completing hands-on codelabs at DevFest Pwani 2025. Redeem your doubloons for exclusive swag and prizes.',
      ogImageUrl: 'https://devfest-dhow.web.app/assets/logo/devfest-dhow-emblem.png'
    });
  }
}
