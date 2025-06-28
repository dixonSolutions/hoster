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
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

interface OrderData {
  customerDetails: CustomerDetails;
  selectedDate: Date;
  cartItems: CartItem[];
  totalPrice: number;
}

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatIconModule, 
    MatDatepickerModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatNativeDateModule,
    MatButtonModule,
    MatCardModule,
    ReactiveFormsModule
  ],
  templateUrl: './shopping-cart.component.html',
  styleUrl: './shopping-cart.component.css'
})
export class ShoppingCartComponent {
  public dataService = inject(DataServiceService);
  customerForm: FormGroup;
  showCustomerForm = false;
  selectedDate: Date | null = null;

  constructor(private fb: FormBuilder) {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required]]
    });
  }

  CheckOutPessed() {
    if (this.dataService.CartItems.length == 0) {
      this.dataService.openSnackBar(this, 5000, 'Your cart is empty, you need to add some services to checkout', 'OK');
    } else {
      // Autofill from localStorage if available
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        this.customerForm.patchValue(JSON.parse(userInfo));
      }
      this.showCustomerForm = true;
    }
  }

  onDateSelected(date: Date | null) {
    this.selectedDate = date;
  }

  submitOrder() {
    if (this.customerForm.valid && this.selectedDate) {
      const customerDetails: CustomerDetails = this.customerForm.value;
      const orderData: OrderData = {
        customerDetails,
        selectedDate: this.selectedDate,
        cartItems: this.dataService.CartItems,
        totalPrice: this.totalPrice
      };
      
      console.log('Order submitted:', orderData);
      this.dataService.openSnackBar(this, 5000, 'Order submitted successfully!', 'OK');
      
      // Clear cart after successful order
      this.dataService.CartItems = [];
      this.dataService.updateItemsInCart();
      this.showCustomerForm = false;
      this.customerForm.reset();
      this.selectedDate = null;
    } else {
      this.dataService.openSnackBar(this, 5000, 'Please fill in all required fields and select a date', 'OK');
    }
  }

  cancelOrder() {
    this.showCustomerForm = false;
    this.customerForm.reset();
    this.selectedDate = null;
  }

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
