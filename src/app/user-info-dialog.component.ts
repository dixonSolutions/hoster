import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

interface UserInfo {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

@Component({
  selector: 'app-user-info-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
  <h2 mat-dialog-title>Welcome! Can we help you?</h2>
  <div style="padding: 16px;">
    <p>We'd like to get your location and contact details to make checkout faster.</p>
    <p>This is optional - you can always fill in your details later when you checkout.</p>
    
    <div style="display: flex; flex-direction: column; gap: 12px; margin: 20px 0;">
      <button mat-raised-button color="primary" (click)="getLocationAndContact()">
        Yes, get my location & contact info
      </button>
      <button mat-stroked-button (click)="skip()">
        No thanks, I'll fill it in later
      </button>
    </div>
    
    <div *ngIf="status" style="margin-top: 12px; padding: 8px; border-radius: 4px; background: #f0f0f0;">
      {{ status }}
    </div>
  </div>
  `
})
export class UserInfoDialogComponent {
  status: string = '';
  private dialogRef = inject(MatDialogRef<UserInfoDialogComponent>);

  static openDialog(dialog: MatDialog) {
    return dialog.open(UserInfoDialogComponent, {
      width: '400px',
      disableClose: false
    });
  }

  skip() {
    this.dialogRef.close();
  }

  async getLocationAndContact() {
    this.status = 'Getting your information...';
    
    const userInfo: UserInfo = {};
    let hasAnyInfo = false;

    // Try to get location
    if (navigator.geolocation) {
      try {
        const position = await this.getCurrentPosition();
        const { latitude, longitude } = position.coords;
        
        // Use Nominatim for reverse geocoding
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        
        if (data.address) {
          userInfo.address = data.address.road || '';
          userInfo.city = data.address.city || data.address.town || data.address.village || '';
          userInfo.state = data.address.state || '';
          userInfo.postalCode = data.address.postcode || '';
          hasAnyInfo = true;
        }
      } catch (error) {
        console.log('Location access denied or failed');
      }
    }

    // Try to get contact info (this is limited by browser security)
    // Most browsers don't allow access to contact info without user interaction
    // We'll just note that this would be ideal but isn't typically possible
    
    if (hasAnyInfo) {
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      this.status = 'Location saved! You can now checkout faster.';
      setTimeout(() => this.dialogRef.close(), 2000);
    } else {
      this.status = 'Could not get your location. You can still fill in your details when you checkout.';
      setTimeout(() => this.dialogRef.close(), 3000);
    }
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });
  }
} 