import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CompassNavComponent } from './shared/components/compass-nav/compass-nav.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CompassNavComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'devfest-dhow';
}
