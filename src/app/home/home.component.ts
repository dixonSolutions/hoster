import { Component, inject } from '@angular/core';
import { TopbarComponent } from '../topbar/topbar.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AboutUsPopupComponent } from '../about-us-popup/about-us-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { DataServiceService } from '../data-service.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TopbarComponent, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    HttpClientModule,
    CommonModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  public dataService = inject(DataServiceService);
  private dialog = inject(MatDialog);

  constructor() {
    console.log(this.dataService.services);
    
  }
  
  openDialog() {
    const dialogRef = this.dialog.open(AboutUsPopupComponent, {
      data: { title: 'This product is a good product', message: 'Product ingredients: ----' },
    });
  }
}
