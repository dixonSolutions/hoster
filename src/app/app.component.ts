import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TopbarComponent } from './topbar/topbar.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserInfoDialogComponent } from './user-info-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [RouterOutlet, MatIconModule, MatButtonModule, MatToolbarModule, TopbarComponent, MatDialogModule, UserInfoDialogComponent],
  standalone: true
})
export class AppComponent implements OnInit {
  title = '';
  private dialog = inject(MatDialog);

  ngOnInit() {
    if (!localStorage.getItem('userInfo')) {
      UserInfoDialogComponent.openDialog(this.dialog);
    }
  }
}
