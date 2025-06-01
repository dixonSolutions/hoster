import { inject, Injectable } from '@angular/core';
import { Account } from './models/account';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BussinessBasicInfo } from './models/BussinessBasicInfo';
import { ServicesForBusiness } from './models/ServicesForBusiness';
import { User } from './models/user';
import {
  MatSnackBar,
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarLabel,
  MatSnackBarRef,
} from '@angular/material/snack-bar';

export interface CartItem {
  service: ServicesForBusiness;
  quantity: number;
}

interface TokenResponse {
  result: string;
  id: number;
  exception: any;
  status: number;
  isCanceled: boolean;
  isCompleted: boolean;
  isCompletedSuccessfully: boolean;
  creationOptions: number;
  asyncState: any;
  isFaulted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DataServiceService {
  private _snackBar = inject(MatSnackBar);
  User: Account | undefined;
  JWTtoken: string | undefined;
  itemsInCart: number = 0;
  CartItems: CartItem[] = [];
  BasicBusinessInfo: BussinessBasicInfo | undefined;
  services: ServicesForBusiness[] | undefined;
  businessID: string = "626700fc-6db7-48c3-ad6e-20c6e7c97b9d";
  urlForServicesForBusiness: string = 'https://localhost:44327/api/Marketplace/GetServicesForBusiness?businessId=';
  userID: string = "52127991-3353-4251-b731-6da879272ab1";
  URLforJWTtoken: string = "https://localhost:44327/api/User/GetUserById/";
  UrlforBusinessBasicInfo: string = 'https://localhost:44327/api/Business/GetBusinessByBusinessID?businessID=';
  private apiUrl = 'http://localhost:3000/api'; // Adjust this to your API URL
  user: User = {} as User;
  private authToken: string = '';

  constructor(private http: HttpClient) { }

  getUserById(id: string): Observable<{ user: Account, token: TokenResponse }> {
    return this.http.get<{ user: Account, token: TokenResponse }>(`${this.URLforJWTtoken}${id}`);
  }

  getBusinessByBusinessID(businessID: string, token: string): Observable<BussinessBasicInfo> {
    if (!token) {
      throw new Error('JWT token is required');
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<BussinessBasicInfo>(`${this.UrlforBusinessBasicInfo}${businessID}`, { headers });
  }

  getServicesForBusiness(businessId: string, token: string): Observable<ServicesForBusiness[]> {
    if (!token) {
      throw new Error('JWT token is required');
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<ServicesForBusiness[]>(`${this.urlForServicesForBusiness}${businessId}`, { headers });
  }

  AddToCart(service: ServicesForBusiness) {
    const existing = this.CartItems.find(item => item.service.serviceID === service.serviceID);
    if (existing) {
      existing.quantity++;
    } else {
      this.CartItems.push({ service, quantity: 1 });
    }
    this.updateItemsInCart();
  }

  RemoveFromCart(service: ServicesForBusiness) {
    this.CartItems = this.CartItems.filter(item => item.service.serviceID !== service.serviceID);
    this.updateItemsInCart();
  }

  IncrementQuantity(service: ServicesForBusiness) {
    const item = this.CartItems.find(item => item.service.serviceID === service.serviceID);
    if (item) item.quantity++;
    this.updateItemsInCart();
  }

  DecrementQuantity(service: ServicesForBusiness) {
    const item = this.CartItems.find(item => item.service.serviceID === service.serviceID);
    if (item && item.quantity > 1) {
      item.quantity--;
    } else if (item) {
      this.RemoveFromCart(service);
    }
    this.updateItemsInCart();
  }

  updateItemsInCart() {
    this.itemsInCart = this.CartItems.reduce((sum, item) => sum + item.quantity, 0);
  }
  getQuanityOfServiceInCart(service: ServicesForBusiness) {
    const item = this.CartItems.find(item => item.service.serviceID === service.serviceID);
    return item ? item.quantity : 0;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  getAuthToken(): string {
    return this.authToken;
  }

  createUser(user: User): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post(`${this.apiUrl}/auth/google`, user, { headers });
  }

  generateSecurityCode(length: number): string {
    const characters = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  SendVerificationEmail(email: string, subject: string, message: string): Observable<any> {
    return this.http.post(`https://localhost:44327/api/UserVerification/send-verification-email`, { email, subject, message });
  }
  verifyUserViaGoogle(idToken: string): Observable<any> {
    return this.http.post('https://localhost:44327/api/User/verify-user-via-google', idToken);
  }
  openSnackBar(component: any, duration: number, firstButton: string, secondButton: string) {
    this._snackBar.open(firstButton, secondButton, {
      duration: duration,
    });
  }
}
