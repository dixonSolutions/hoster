import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
export interface DialogData {
  message: string;
  title: string;
}
@Component({
  selector: 'app-about-us-popup',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './about-us-popup.component.html',
  styleUrl: './about-us-popup.component.css'
})
export class AboutUsPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<AboutUsPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData // To inject data into the dialog
  ) {}

  onCloseClick(): void {
    this.dialogRef.close(); // Closes the dialog
  }

}
