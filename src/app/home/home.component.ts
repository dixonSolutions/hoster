import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MessageService } from 'primeng/api';
import { AboutUsPopupComponent } from '../about-us-popup/about-us-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { DataServiceService } from '../data-service.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { BusinessRegistrationRequest, ServiceRegistration } from '../models/BusinessRegistration';
import { ServicesForBusiness } from '../models/ServicesForBusiness';
import { switchMap } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ReviewsComponent } from '../reviews/reviews.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    PanelModule,
    ToastModule,
    HttpClientModule,
    CommonModule,
    DialogModule,
    ReviewsComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  public dataService = inject(DataServiceService);
  private dialog = inject(MatDialog);
  private messageService = inject(MessageService);

  businessDetails?: BusinessRegistrationRequest;
  loading = false;
  error?: string;
  
  // Reviews dialog properties
  showReviewsDialog = false;
  selectedServiceForReviews: ServiceRegistration | null = null;

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
          
          // Ensure businessID is set on all services for reviews
          if (this.businessDetails.services && this.businessDetails.basicInfo?.businessID) {
            this.businessDetails.services.forEach(service => {
              if (!service.businessID) {
                service.businessID = this.businessDetails!.basicInfo!.businessID;
              }
            });
          }
          
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

  openReviewsDialog(service: ServiceRegistration) {
    // Ensure we have the business ID before opening the dialog
    if (!this.businessDetails?.basicInfo?.businessID) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Business information not available. Please try again.',
        life: 5000
      });
      return;
    }
    
    console.log('Opening reviews dialog:');
    console.log('Business ID from businessDetails:', this.businessDetails.basicInfo.businessID);
    console.log('Service:', service);
    
    this.selectedServiceForReviews = service;
    this.showReviewsDialog = true;
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
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `${service.serviceName} added to cart!`,
      life: 3000
    });
  }
}
