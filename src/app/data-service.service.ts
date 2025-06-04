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
import { BusinessClientsInWebsite } from './models/BusinessClientsInWebsite';

export interface CartItem {
  service: ServicesForBusiness;
  quantity: number;
}
interface EmailVerificationRequest {
  to: string;
  from: string;
  email: string;
  subject: string;
  message:string;
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
interface GoogleClientRegistrationRequest {
  googleToken: string;
  businessId: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataServiceService {
  private _snackBar = inject(MatSnackBar);
  User: Account | undefined;
  JWTtoken: string | undefined;
  theClient: BusinessClientsInWebsite | undefined;
  itemsInCart: number = 0;
  code:string | undefined;
  CartItems: CartItem[] = [];
  BasicBusinessInfo: BussinessBasicInfo | undefined;
  services: ServicesForBusiness[] | undefined;
  businessID: string = "626700fc-6db7-48c3-ad6e-20c6e7c97b9d";
  urlForServicesForBusiness: string = 'https://localhost:44327/api/Marketplace/GetServicesForBusiness?businessId=';
  userID: string = "52127991-3353-4251-b731-6da879272ab1";
  URLforJWTtoken: string = "https://localhost:44327/api/User/GetUserById/";
  UrlforBusinessBasicInfo: string = 'https://localhost:44327/api/Business/GetBusinessByBusinessID?businessID=';
  UrlForBusinessClientRegistration: string = 'https://localhost:44327/api/BusinessWebsite/register-client'
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
  generateSecureCode(length: number = 6): string {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte % 10).join('');
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

  RegisterClientInBusiness(client: BusinessClientsInWebsite) {
    console.log("About to register client in business", client);
    console.log("JWT token", this.JWTtoken);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.JWTtoken}`
    });
  
    return this.http.post<BusinessClientsInWebsite>(
      'https://localhost:44327/api/BusinessWebsite/register-client',
      client,
      { headers }
    );  }
    SignInClientWithGoogle(googleToken: string, businessId: string) {
      console.log('Signing in client with Google token:', { googleToken, businessId });
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.JWTtoken}`
      });
    
      const requestBody: GoogleClientRegistrationRequest = {
        googleToken: googleToken,
        businessId: businessId
      };
    
      return this.http.post<BusinessClientsInWebsite>(
        'https://localhost:44327/api/BusinessWebsite/signin-client-google',
        requestBody,
        { headers }
      );
    }
    getClientById(userId: string) {
      console.log('Getting client by ID:', { userId });

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.JWTtoken}`
      });
    
      return this.http.get<BusinessClientsInWebsite>(
        `https://localhost:44327/api/BusinessWebsite/client/${userId}`,
        { headers }
      );
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

  SendVerificationEmail(messageDetails: EmailVerificationRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.JWTtoken}`
    });
    return this.http.post(
      `https://localhost:44327/api/UserVerification/send-verification-email`,
      messageDetails,
      { 
        headers,
        responseType: 'text'  // Expect text response instead of JSON
      }
    );
  }

  openSnackBar(component: any, duration: number, firstButton: string, secondButton: string) {
    this._snackBar.open(firstButton, secondButton, {
      duration: duration,
    });
  }
  registerClientWithGoogle(googleToken: string, businessId: string) {
    console.log('Registering client with Google token:', { googleToken, businessId });
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.JWTtoken}`
    });
  
    const requestBody: GoogleClientRegistrationRequest = {
      googleToken: googleToken,
      businessId: businessId
    };
  
    return this.http.post<BusinessClientsInWebsite>(
      'https://localhost:44327/api/BusinessWebsite/register-client-google',
      requestBody,
      { headers }
    );
  }
}
