import { Component, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { DataServiceService } from '../../app/data-service.service';
import { User } from '../../app/models/user';
import { CookieService } from 'ngx-cookie-service';
import { Inject } from '@angular/core';
import { BusinessClientsInWebsite } from '../models/BusinessClientsInWebsite';
declare global {
  interface Window {
    google: any;
    handleCredentialResponse: (response: { credential: string }) => void;
  }
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  profileFormForSignUp: FormGroup;
  profileFormForSignIn: FormGroup;
  private isInitialized = false;
  userData: any = null;
  user: User = {} as User;
  isHiddenWelcomeMessage: boolean = true;
  isHiddenSignUpMessage: boolean = true;
  isHiddenSignInMessage: boolean = false;
  showGoogleButton: boolean = false;
  private initializationAttempts = 0;
  private readonly MAX_INIT_ATTEMPTS = 5;
  private initInterval: any;
  private readonly CLIENT_ID = '763839777363-2tclimqvmlkkagk6j5d14me4ec4iq2hl.apps.googleusercontent.com';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public dataService: DataServiceService,
    private cookie: CookieService
  ) {
    this.profileFormForSignUp = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.profileFormForSignIn = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    });

    // Bind the callback to the window object
    window.handleCredentialResponse = this.handleCredentialResponse.bind(this);
  }

  ngAfterViewInit() {
    if(this.dataService.user.name !== undefined) {
      this.dataService.openSnackBar(this, 5000, 'You are signed in as ' + this.dataService.user.name + '!', 'OK');
      this.isHiddenWelcomeMessage = false;
    }
    if (this.dataService.user.name == undefined) {
      this.isHiddenWelcomeMessage = true;
      this.cdr.detectChanges();
      




      // Start initialization attempts
      this.initInterval = setInterval(() => {
        this.attemptGoogleSignInInitialization();
      }, 1000);
    } else {
      const storedToken = localStorage.getItem('google_token');
      if (storedToken) {
        this.dataService.setAuthToken(storedToken);
      }
    }
  }

  private attemptGoogleSignInInitialization() {
    if (this.initializationAttempts >= this.MAX_INIT_ATTEMPTS) {
      clearInterval(this.initInterval);
      console.error('Failed to initialize Google Sign-In after maximum attempts');
      return;
    }

    if (typeof window.google === 'undefined') {
      console.log('Google API not loaded yet, attempt:', this.initializationAttempts + 1);
      this.initializationAttempts++;
      return;
    }

    if (this.isInitialized) {
      console.log('Google Sign-In already initialized');
      clearInterval(this.initInterval);
      return;
    }

    try {
      console.log('Attempting to initialize Google Sign-In');
      
      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: this.CLIENT_ID,
        callback: window.handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Render the button
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-container'),
        { 
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        }
      );

      this.isInitialized = true;
      this.showGoogleButton = true;
      console.log('Google Sign-In initialized successfully');
      this.cdr.detectChanges();
      clearInterval(this.initInterval);
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
      this.initializationAttempts++;
    }
  }

  handleCredentialResponse(response: { credential: string }) {
    console.log("Credential response:", response);
    const responseVariable = response;
    const decodedCredential = this.parseJwt(response.credential);
    console.log('Decoded credential:', decodedCredential);
    
    this.userData = decodedCredential;
    
    // Store the token
    localStorage.setItem('google_token', response.credential);
    console.log('Google token stored:', response.credential);
    this.dataService.setAuthToken(response.credential);
    
    // Create user object
    const user: User = {
      userID: decodedCredential.sub,
      name: decodedCredential.name,
      email: decodedCredential.email
    };
    console.log('User:', user);
    this.dataService.user = user;

    // Register client using Google token
    if(this.isHiddenSignInMessage == true) {
      this.dataService.registerClientWithGoogle(responseVariable.credential, this.dataService.businessID).subscribe({
        next: (response: any) => {
          console.log('Full registration response:', response);
          this.dataService.theClient = response;
          // Set JWT token from response
          if (response.token) {
            console.log('Setting JWT token from registration:', response.token);
            this.dataService.JWTtoken = response.token;
            localStorage.setItem('jwt_token', response.token);
            // Store user ID in cookie
            if (response.userId) {
              this.cookie.set('User ID', response.userId, 365);
            }
          } else {
            console.warn('No token found in registration response');
          }
          this.dataService.openSnackBar(this, 5000, 'Client registered successfully!', 'OK');
          this.isHiddenWelcomeMessage = false;
        },
        error: (error: any) => {
          console.error('Error registering client:', error);
          const errorMessage = error.error?.message || error.error || 'Unknown error occurred';
          this.dataService.openSnackBar(this, 5000, errorMessage, 'OK');
        }
      });
    } else {
      this.dataService.SignInClientWithGoogle(responseVariable.credential, this.dataService.businessID).subscribe({
        next: (response: any) => {
          console.log('Full sign-in response:', response);
          this.dataService.theClient = response;
          // Set JWT token from response
          if (response.token) {
            console.log('Setting JWT token from sign-in:', response.token);
            this.dataService.JWTtoken = response.token;
            localStorage.setItem('jwt_token', response.token);
            // Store user ID in cookie
            if (response.userId) {
              this.cookie.set('User ID', response.userId, 365);
            }
          } else {
            console.warn('No token found in sign-in response');
          }
          this.dataService.openSnackBar(this, 5000, 'Client signed in successfully!', 'OK');
          this.isHiddenWelcomeMessage = false;
        },
        error: (error: any) => {
          console.error('Error signing in client:', error);
          const errorMessage = error.error?.message || error.error || 'Unknown error occurred';
          this.dataService.openSnackBar(this, 5000, errorMessage, 'OK');
        }
      });
    }
  }

  private parseJwt(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      throw error;
    }
  }

  onSubmitSignUp() {
    if (this.profileFormForSignUp.valid) {
      console.log(this.profileFormForSignUp.value);
      // Handle form submission here
    }
  }

  onSubmitSignIn() {
    if (this.profileFormForSignIn.valid) {
      console.log(this.profileFormForSignIn.value);
      // Handle form submission here
    }
  }

  ngOnDestroy() {
    if (this.initInterval) {
      clearInterval(this.initInterval);
    }
  }

  ngOnInit() {
    // Initialize component
    this.isHiddenSignInMessage = false;  // Show sign in card by default
    this.isHiddenSignUpMessage = true;   // Hide sign up card by default

    // Wait for token to be available
    const checkToken = () => {
      if (this.dataService.JWTtoken) {
        const UserIDInCookie = this.cookie.get('User ID');
        if (UserIDInCookie) {
          this.dataService.getClientById(UserIDInCookie).subscribe({
            next: (response: BusinessClientsInWebsite) => {
              console.log('Client retrieved successfully:', response);
              this.dataService.theClient = response;
              this.isHiddenWelcomeMessage = false;
            },
            error: (error: any) => {
              console.error('Error getting client:', error);
              const errorMessage = error.error?.message || error.error || 'Unknown error occurred';
              this.dataService.openSnackBar(this, 5000, errorMessage, 'OK');
            }
          });
        }
      } else {
        // If token is not available yet, check again after a short delay
        setTimeout(checkToken, 100);
      }
    };

    // Start checking for token
    checkToken();
  }

  toggleForms() {
    this.isHiddenSignInMessage = !this.isHiddenSignInMessage;
    this.isHiddenSignUpMessage = !this.isHiddenSignUpMessage;
  }
}
