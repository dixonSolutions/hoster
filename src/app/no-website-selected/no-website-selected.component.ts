import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-no-website-selected',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './no-website-selected.component.html',
  styleUrl: './no-website-selected.component.css'
})
export class NoWebsiteSelectedComponent {
  
  goToHomePage() {
    window.location.href = 'https://servicefuzz.vercel.app';
  }
}
