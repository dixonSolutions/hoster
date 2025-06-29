import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AboutUsPopupComponent } from '../about-us-popup/about-us-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { DataServiceService } from '../data-service.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { BusinessRegistrationRequest } from '../models/BusinessRegistration';
import { ServicesForBusiness } from '../models/ServicesForBusiness';
import { switchMap } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    PanelModule,
    HttpClientModule,
    CommonModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  public dataService = inject(DataServiceService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  businessDetails?: BusinessRegistrationRequest;
  loading = false;
  error?: string;

  ngOnInit() {
    this.loading = true;
    const userId = this.dataService.userID;
    
    // First get JWT token, then get all businesses for user
    this.dataService.getUserById(userId).pipe(
      switchMap(response => {
        // Store the JWT token
        this.dataService.JWTtoken = response.token.result;
        console.log('JWT token obtained:', this.dataService.JWTtoken);
        
        // Now get all businesses for the user (this returns full business details)
        return this.dataService.getAllBusinessesForUser(userId);
      })
    ).subscribe({
      next: (businesses) => {
        // Get the first business (or you can show all businesses)
        if (businesses && businesses.length > 0) {
          this.businessDetails = businesses[0];
          console.log('Business details loaded:', this.businessDetails);
        } else {
          this.error = 'No businesses found for this user';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load business details';
        this.loading = false;
        console.error('Error loading business details:', err);
      }
    });
  }
  
  openDialog() {
    const dialogRef = this.dialog.open(AboutUsPopupComponent, {
      data: { title: 'This product is a good product', message: 'Product ingredients: ----' },
    });
  }

  addToCart(service: any) {
    // Convert business service format to ServicesForBusiness format
    const serviceForBusiness: ServicesForBusiness = {
      serviceID: service.serviceID || service.id,
      serviceName: service.serviceName,
      serviceDescription: service.serviceDescription,
      businessID: this.businessDetails?.basicInfo?.businessID || this.dataService.businessID,
      serviceEstimatedTime: service.serviceEstimatedTime,
      servicePrice: service.price,
      servicePriceCurrencyUnit: service.currency,
      serviceImageUrl: service.serviceImageUrl
    };

    this.dataService.AddToCart(serviceForBusiness);
    console.log('Service added to cart:', serviceForBusiness);
    
    // Show success message
    this.snackBar.open(`${service.serviceName} added to cart!`, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
