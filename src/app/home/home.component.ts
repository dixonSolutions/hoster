import { Component } from '@angular/core';
import { TopbarComponent } from '../topbar/topbar.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AboutUsPopupComponent } from '../about-us-popup/about-us-popup.component';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-home',
  imports: [TopbarComponent, MatCardModule, MatButtonModule, MatIconModule, MatIconModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  constructor(private dialog: MatDialog) {}
  openDialog() {
    const dialogRef = this.dialog.open(AboutUsPopupComponent, {
      data: { title: 'This product is a good product', message: 'Product ingredients: ----' },
    });
  }

}
