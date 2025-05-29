import { Component } from '@angular/core';
import { DataServiceService } from '../data-service.service';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-contact-us',
  imports: [MatCardModule],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent {
  constructor(public dataService: DataServiceService) {}
}
