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
import { DataServiceService } from '../data-service.service';
import { User } from '../models/user';
import { CookieService } from 'ngx-cookie-service';
import { BusinessClientsInWebsite } from '../models/BusinessClientsInWebsite';
import { AboutUsPopupComponent } from '../about-us-popup/about-us-popup.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  profileFormForSignUp: FormGroup;
  profileFormForSignIn: FormGroup;
  verificationForm: FormGroup;
  private isInitialized = false;
  userData: any = null;
  user: User = {} as User;
  isHiddenWelcomeMessage: boolean = true;
  isHiddenSignUpMessage: boolean = true;
  isHiddenSignInMessage: boolean = false;
  isHiddenVerificationMessage: boolean = true;
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
    private cookie: CookieService,
    private dialog: MatDialog
  ) {
    // Verify cookie service
    console.log('Cookie service initialized:', this.cookie);
    console.log('Current cookies:', this.cookie.getAll());
    
    this.profileFormForSignUp = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.profileFormForSignIn = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.verificationForm = this.fb.group({
      verificationCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
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
          console.log('Response type:', typeof response);
          console.log('Response userId:', response.userId);
          this.dataService.theClient = response;
          // Set JWT token from response
          if (response.token) {
            console.log('Setting JWT token from registration:', response.token);
            this.dataService.JWTtoken = response.token;
            localStorage.setItem('jwt_token', response.token);
            // Store user ID in cookie
            if (response.userId) {
              console.log('About to set cookie with User ID:', response.userId);
              try {
                // Try setting cookie with minimal options first
                this.cookie.set('User ID', response.userId);
                console.log('Basic cookie set attempt completed');
                
                // Verify if cookie was set
                const verifyCookie = this.cookie.get('User ID');
                console.log('Immediate verification - Retrieved User ID from cookie:', verifyCookie);
                
                // If basic set worked, try with options
                if (verifyCookie) {
                  console.log('Basic cookie set successful, attempting with options');
                  this.cookie.set('User ID', response.userId, {
                    expires: 365,
                    path: '/',
                    secure: false,
                    sameSite: 'Lax'
                  });
                  console.log('Cookie set with options. All cookies:', this.cookie.getAll());
                } else {
                  console.warn('Basic cookie set failed');
                }
              } catch (error) {
                console.error('Error setting cookie:', error);
              }
            } else {
              console.warn('No userId found in registration response');
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
          console.log('Response type:', typeof response);
          console.log('Response userId:', response.userId);
          this.dataService.theClient = response;
          // Set JWT token from response
          if (response.token) {
            console.log('Setting JWT token from sign-in:', response.token);
            this.dataService.JWTtoken = response.token;
            localStorage.setItem('jwt_token', response.token);
            // Store user ID in cookie
            if (response.userId) {
              console.log('About to set cookie with User ID:', response.userId);
              try {
                // Try setting cookie with minimal options first
                this.cookie.set('User ID', response.userId);
                console.log('Basic cookie set attempt completed');
                
                // Verify if cookie was set
                const verifyCookie = this.cookie.get('User ID');
                console.log('Immediate verification - Retrieved User ID from cookie:', verifyCookie);
                
                // If basic set worked, try with options
                if (verifyCookie) {
                  console.log('Basic cookie set successful, attempting with options');
                  this.cookie.set('User ID', response.userId, {
                    expires: 365,
                    path: '/',
                    secure: false,
                    sameSite: 'Lax'
                  });
                  console.log('Cookie set with options. All cookies:', this.cookie.getAll());
                } else {
                  console.warn('Basic cookie set failed');
                }
              } catch (error) {
                console.error('Error setting cookie:', error);
              }
            } else {
              console.warn('No userId found in sign-in response');
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
      console.log('Starting sign in process...');
      const securityCode = this.dataService.generateSecurityCode(6);
      this.dataService.code = securityCode;
      console.log('Generated security code:', securityCode);
      
      this.dataService.SendVerificationEmail({
        to: this.profileFormForSignIn.value.email,
        from: "noreply@example.com",
        email: this.profileFormForSignIn.value.email,
        subject: "Security Code",
        message: this.dataService.code
      }).subscribe({
        next: (response: any) => {
          console.log("Full email response:", response);
          // Since we're expecting a text response, we'll consider any response as success
          console.log('Current form states:', {
            isHiddenSignInMessage: this.isHiddenSignInMessage,
            isHiddenVerificationMessage: this.isHiddenVerificationMessage
          });
          
          // First hide sign in form
          this.isHiddenSignInMessage = true;
          // Force change detection
          this.cdr.detectChanges();
          
          // Then show verification form
          this.isHiddenVerificationMessage = false;
          // Force change detection again
          this.cdr.detectChanges();
          
          console.log('Updated form states:', {
            isHiddenSignInMessage: this.isHiddenSignInMessage,
            isHiddenVerificationMessage: this.isHiddenVerificationMessage
          });
          
          this.dataService.openSnackBar(this, 5000, "Verification code sent to your email!", "OK");
        },
        error: (error: any) => {
          console.error("Error sending email:", error);
          const errorMessage = error.error?.message || error.message || "Error sending verification code";
          this.dataService.openSnackBar(this, 5000, errorMessage, "OK");
        }
      });
    }
  }

  onSubmitVerification() {
    if (this.verificationForm.valid) {
      const enteredCode = this.verificationForm.get('verificationCode')?.value;
      if (enteredCode === this.dataService.code) {
        this.dataService.openSnackBar(this, 5000, "Verification successful!", "OK");
        const dialogRef = this.dialog.open(AboutUsPopupComponent, {
          width: '300px',
          data: { 
            message: `${this.dataService.BasicBusinessInfo?.bussinessDescription}`, 
            title: `Welcome to ${this.dataService.BasicBusinessInfo?.bussinessName}` 
          }
        });
        dialogRef.afterClosed().subscribe((result: unknown) => {
          console.log('The dialog was closed');
          this.isHiddenVerificationMessage = true;
          this.isHiddenWelcomeMessage = false;
        });
      } else {
        this.dataService.openSnackBar(this, 5000, "Invalid verification code", "OK");
      }
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

    console.log('All cookies at initialization:', this.cookie.getAll());
    const UserIDInCookie = this.cookie.get('User ID');
    console.log('Retrieved User ID from cookie:', UserIDInCookie);

    // Wait for token to be available
    const checkToken = () => {
      if (this.dataService.JWTtoken) {
        if (UserIDInCookie) {
          console.log('Attempting to get client with User ID:', UserIDInCookie);
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
