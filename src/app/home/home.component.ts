import { Component, inject } from '@angular/core';
import { TopbarComponent } from '../topbar/topbar.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AboutUsPopupComponent } from '../about-us-popup/about-us-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { DataServiceService } from '../data-service.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TopbarComponent, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    HttpClientModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private dataService = inject(DataServiceService);
  private dialog = inject(MatDialog);

  constructor() {
    
  }
  
  openDialog() {
    const dialogRef = this.dialog.open(AboutUsPopupComponent, {
      data: { title: 'This product is a good product', message: 'Product ingredients: ----' },
    });
  }
}
