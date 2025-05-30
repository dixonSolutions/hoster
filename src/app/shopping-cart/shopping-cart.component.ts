import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DataServiceService } from '../data-service.service';
import { CommonModule } from '@angular/common';
import { CartItem } from '../data-service.service';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import {MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule],
  templateUrl: './shopping-cart.component.html',
  styleUrl: './shopping-cart.component.css'
})
export class ShoppingCartComponent {
  public dataService = inject(DataServiceService);
  myFilter = (d: Date | null): boolean => {
    if (!d) return false;
    const today = new Date();
    // Set to midnight for comparison
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 2);
    // Only allow dates after today (i.e., tomorrow and later)
    return d.getTime() >= tomorrow.getTime();
  };
  get totalPrice(): number {
    return this.dataService.CartItems.reduce((sum, item) => sum + (item.service.servicePrice || 0) * item.quantity, 0);
  }
  displayedColumns: string[] = ['serviceName', 'quantity'];
  get groupedByService() {
    // Group cart items by serviceID
    const groups: {[serviceID: string]: CartItem[]} = {};
    for (const item of this.dataService.CartItems) {
      const id = item.service.serviceID || '';
      if (!groups[id]) groups[id] = [];
      groups[id].push(item);
    }
    // Return as array of {service, items}
    return Object.values(groups).map(items => ({
      service: items[0].service,
      items
    }));
  }
}
