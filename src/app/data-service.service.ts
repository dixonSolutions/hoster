import { Injectable } from '@angular/core';
import { Account } from './models/account';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BussinessBasicInfo } from './models/BussinessBasicInfo';
import { ServicesForBusiness } from './models/ServicesForBusiness';

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
}
