import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CarouselModule } from 'primeng/carousel';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TabViewModule } from 'primeng/tabview';
import { AccordionModule } from 'primeng/accordion';
import { TimelineModule } from 'primeng/timeline';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { DividerModule } from 'primeng/divider';
import { ScrollTopModule } from 'primeng/scrolltop';
import { MenuModule } from 'primeng/menu';
import { MenuItem, MegaMenuItem } from 'primeng/api';
import { MegaMenuModule } from 'primeng/megamenu';
import { GalleriaModule } from 'primeng/galleria';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ChipModule } from 'primeng/chip';

// Services
import { DataServiceService } from '../data-service.service';

// Models
import { ServicesForBusiness } from '../models/ServicesForBusiness';
import { BusinessRegistrationFullResponse, ServiceRegistration } from '../models/BusinessRegistration';

@Component({
  selector: 'app-landing-page',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    CarouselModule,
    InputTextModule,
    InputTextarea,
    SelectModule,
    DialogModule,
    ToastModule,
    ProgressSpinnerModule,
    TabViewModule,
    AccordionModule,
    TimelineModule,
    TagModule,
    RatingModule,
    DividerModule,
    ScrollTopModule,
    MenuModule,
    MegaMenuModule,
    GalleriaModule,
    PanelMenuModule,
    ChipModule
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
  providers: [MessageService]
})
export class LandingPageComponent implements OnInit, OnDestroy {
  // Business Data
  businessDetails: BusinessRegistrationFullResponse | null = null;
  services: ServicesForBusiness[] = [];
  loading = true;
  error: string | null = null;

  // Hero Section
  heroTitle = 'Transform Your Business with Professional Services';
  heroSubtitle = 'We provide comprehensive solutions to help your business grow and succeed in today\'s competitive market.';
  heroBackgroundImage = 'assets/images/hero-bg.jpg';

  // Services
  featuredServices: ServicesForBusiness[] = [];
  serviceCategories = [
    { label: 'All Services', value: 'all' },
    { label: 'Consulting', value: 'consulting' },
    { label: 'Technology', value: 'technology' },
    { label: 'Marketing', value: 'marketing' }
  ];
  selectedCategory = 'all';

  // Testimonials
  testimonials = [
    {
      name: 'Sarah Johnson',
      position: 'CEO, TechStart Inc.',
      content: 'Outstanding service quality and professional approach. They helped us increase our revenue by 40% in just 6 months.',
      rating: 5,
      avatar: 'assets/images/testimonial-1.jpg'
    },
    {
      name: 'Michael Chen',
      position: 'Marketing Director, GrowthCo',
      content: 'The team exceeded our expectations. Their strategic insights and implementation were game-changing for our business.',
      rating: 5,
      avatar: 'assets/images/testimonial-2.jpg'
    },
    {
      name: 'Emily Rodriguez',
      position: 'Founder, InnovateLab',
      content: 'Professional, reliable, and results-driven. I highly recommend their services to any business looking to scale.',
      rating: 5,
      avatar: 'assets/images/testimonial-3.jpg'
    }
  ];

  // Statistics
  stats = [
    { number: '500+', label: 'Happy Clients' },
    { number: '1000+', label: 'Projects Completed' },
    { number: '98%', label: 'Client Satisfaction' },
    { number: '24/7', label: 'Support Available' }
  ];

  // Contact Form
  contactForm: FormGroup;
  contactDialogVisible = false;
  newsletterEmail = '';

  // Navigation
  menuItems: MenuItem[] = [];

  // Animations
  animatedElements: { [key: string]: boolean } = {};

  // New Components Data
  // MegaMenu
  megaMenuItems: MegaMenuItem[] = [];

  // Galleria
  galleriaImages = [
    {
      itemImageSrc: 'assets/images/gallery-1.jpg',
      thumbnailImageSrc: 'assets/images/gallery-1-thumb.jpg',
      alt: 'Business Strategy',
      title: 'Strategic Planning'
    },
    {
      itemImageSrc: 'assets/images/gallery-2.jpg',
      thumbnailImageSrc: 'assets/images/gallery-2-thumb.jpg',
      alt: 'Technology Solutions',
      title: 'Tech Innovation'
    },
    {
      itemImageSrc: 'assets/images/gallery-3.jpg',
      thumbnailImageSrc: 'assets/images/gallery-3-thumb.jpg',
      alt: 'Team Collaboration',
      title: 'Team Work'
    }
  ];

  // Timeline
  timelineEvents = [
    {
      status: 'Discovery',
      date: 'Week 1',
      icon: 'pi pi-search',
      color: '#22c55e',
      title: 'Business Analysis',
      description: 'We analyze your business needs and identify growth opportunities.'
    },
    {
      status: 'Strategy',
      date: 'Week 2-3',
      icon: 'pi pi-cog',
      color: '#3b82f6',
      title: 'Strategic Planning',
      description: 'Develop comprehensive strategies tailored to your business goals.'
    },
    {
      status: 'Implementation',
      date: 'Week 4-8',
      icon: 'pi pi-rocket',
      color: '#f59e0b',
      title: 'Execution',
      description: 'Implement solutions with continuous monitoring and optimization.'
    },
    {
      status: 'Results',
      date: 'Ongoing',
      icon: 'pi pi-chart-line',
      color: '#ef4444',
      title: 'Growth & Success',
      description: 'Track results and ensure sustainable business growth.'
    }
  ];

  // Accordion
  faqItems = [
    {
      header: 'What services do you offer?',
      content: 'We offer comprehensive business solutions including strategic consulting, technology implementation, marketing strategies, and operational optimization.'
    },
    {
      header: 'How long does a typical project take?',
      content: 'Project timelines vary based on complexity. Small projects take 2-4 weeks, while comprehensive solutions may take 8-12 weeks.'
    },
    {
      header: 'Do you provide ongoing support?',
      content: 'Yes, we offer ongoing support and maintenance packages to ensure your business continues to grow and succeed.'
    },
    {
      header: 'What industries do you specialize in?',
      content: 'We work with businesses across various industries including technology, healthcare, retail, manufacturing, and professional services.'
    }
  ];

  // PanelMenu
  panelMenuItems: MenuItem[] = [];

  // Chips
  serviceTags = [
    { label: 'Strategy', icon: 'pi pi-cog' },
    { label: 'Technology', icon: 'pi pi-desktop' },
    { label: 'Marketing', icon: 'pi pi-chart-line' },
    { label: 'Consulting', icon: 'pi pi-users' },
    { label: 'Analytics', icon: 'pi pi-chart-bar' },
    { label: 'Innovation', icon: 'pi pi-lightbulb' }
  ];

  constructor(
    private dataService: DataServiceService,
    private router: Router,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      company: [''],
      message: ['', [Validators.required, Validators.minLength(10)]],
      service: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadBusinessData();
    this.setupMenuItems();
    this.setupMegaMenu();
    this.setupPanelMenu();
    this.initializeAnimations();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  async loadBusinessData() {
    try {
      this.loading = true;
      
      // First, get the user and JWT token
      const userResponse = await this.dataService.getUserById(this.dataService.userID).toPromise();
      if (userResponse) {
        this.dataService.User = userResponse.user;
        this.dataService.JWTtoken = userResponse.token.result;
        
        // Now that we have the token, get the business registration
        if (this.dataService.JWTtoken) {
          const response = await this.dataService.getBusinessRegistration(this.dataService.businessID).toPromise();
          this.businessDetails = response || null;
          
          if (this.businessDetails?.services) {
            this.services = this.businessDetails.services.map((service: ServiceRegistration): ServicesForBusiness => ({
              serviceID: service.serviceID,
              serviceName: service.serviceName,
              serviceDescription: service.serviceDescription,
              businessID: service.businessID,
              serviceEstimatedTime: service.serviceEstimatedTime,
              servicePrice: service.price,
              servicePriceCurrencyUnit: service.currency,
              serviceImageUrl: service.serviceImageUrl
            }));
          }
          
          this.featuredServices = this.services.slice(0, 6);
        } else {
          this.error = 'Failed to obtain authentication token';
        }
      } else {
        this.error = 'Failed to load user data';
      }
      
      this.loading = false;
    } catch (error) {
      this.error = 'Failed to load business details';
      this.loading = false;
      console.error('Error loading business data:', error);
    }
  }

  private setupMenuItems() {
    this.menuItems = [
      {
        label: 'Services',
        icon: 'pi pi-briefcase',
        items: [
          { label: 'All Services', routerLink: '/services' },
          { label: 'Consulting', routerLink: '/services/consulting' },
          { label: 'Technology', routerLink: '/services/technology' },
          { label: 'Marketing', routerLink: '/services/marketing' }
        ]
      },
      {
        label: 'About',
        icon: 'pi pi-info-circle',
        items: [
          { label: 'Our Story', routerLink: '/about' },
          { label: 'Team', routerLink: '/team' },
          { label: 'Careers', routerLink: '/careers' }
        ]
      },
      {
        label: 'Resources',
        icon: 'pi pi-book',
        items: [
          { label: 'Blog', routerLink: '/blog' },
          { label: 'Case Studies', routerLink: '/case-studies' },
          { label: 'Whitepapers', routerLink: '/whitepapers' }
        ]
      },
      {
        label: 'Contact',
        icon: 'pi pi-envelope',
        routerLink: '/contact'
      }
    ];
  }

  private setupMegaMenu() {
    this.megaMenuItems = [
      {
        label: 'Services',
        icon: 'pi pi-briefcase',
        items: [
          [
            {
              label: 'Business Solutions',
              items: [
                { label: 'Strategic Consulting', icon: 'pi pi-cog' },
                { label: 'Technology Implementation', icon: 'pi pi-desktop' },
                { label: 'Marketing Strategy', icon: 'pi pi-chart-line' }
              ]
            }
          ],
          [
            {
              label: 'Specialized Services',
              items: [
                { label: 'Data Analytics', icon: 'pi pi-chart-bar' },
                { label: 'Process Optimization', icon: 'pi pi-sync' },
                { label: 'Digital Transformation', icon: 'pi pi-rocket' }
              ]
            }
          ]
        ]
      },
      {
        label: 'Industries',
        icon: 'pi pi-building',
        items: [
          [
            {
              label: 'Technology',
              items: [
                { label: 'SaaS Companies', icon: 'pi pi-cloud' },
                { label: 'Startups', icon: 'pi pi-star' },
                { label: 'Enterprise', icon: 'pi pi-building' }
              ]
            }
          ],
          [
            {
              label: 'Other Sectors',
              items: [
                { label: 'Healthcare', icon: 'pi pi-heart' },
                { label: 'Retail', icon: 'pi pi-shopping-bag' },
                { label: 'Manufacturing', icon: 'pi pi-cog' }
              ]
            }
          ]
        ]
      }
    ];
  }

  private setupPanelMenu() {
    this.panelMenuItems = [
      {
        label: 'Business Solutions',
        icon: 'pi pi-briefcase',
        items: [
          {
            label: 'Strategy & Consulting',
            icon: 'pi pi-cog',
            items: [
              { label: 'Business Analysis', icon: 'pi pi-search' },
              { label: 'Strategic Planning', icon: 'pi pi-chart-line' },
              { label: 'Market Research', icon: 'pi pi-globe' }
            ]
          },
          {
            label: 'Technology Services',
            icon: 'pi pi-desktop',
            items: [
              { label: 'System Integration', icon: 'pi pi-link' },
              { label: 'Cloud Migration', icon: 'pi pi-cloud' },
              { label: 'Digital Transformation', icon: 'pi pi-rocket' }
            ]
          }
        ]
      },
      {
        label: 'Support & Resources',
        icon: 'pi pi-life-ring',
        items: [
          {
            label: 'Customer Support',
            icon: 'pi pi-headset',
            items: [
              { label: '24/7 Help Desk', icon: 'pi pi-clock' },
              { label: 'Technical Support', icon: 'pi pi-wrench' },
              { label: 'Training Programs', icon: 'pi pi-graduation-cap' }
            ]
          }
        ]
      }
    ];
  }

  private initializeAnimations() {
    this.animatedElements = {
      hero: false,
      services: false,
      testimonials: false,
      stats: false
    };
  }

  // Navigation Methods
  navigateToService(service: ServicesForBusiness) {
    this.router.navigate(['/services', service.serviceID]);
  }

  navigateToContact() {
    this.router.navigate(['/contact-us']);
  }

  // Contact Form Methods
  openContactDialog() {
    this.contactDialogVisible = true;
  }

  closeContactDialog() {
    this.contactDialogVisible = false;
    this.contactForm.reset();
  }

  submitContactForm() {
    if (this.contactForm.valid) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Thank you for your message! We\'ll get back to you soon.'
      });
      this.closeContactDialog();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill in all required fields correctly.'
      });
    }
  }

  // Newsletter Subscription
  subscribeNewsletter() {
    if (this.newsletterEmail && this.isValidEmail(this.newsletterEmail)) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Thank you for subscribing to our newsletter!'
      });
      this.newsletterEmail = '';
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please enter a valid email address.'
      });
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Animation Methods
  onElementVisible(element: string) {
    this.animatedElements[element] = true;
  }

  // Service Filtering
  filterServices() {
    if (this.selectedCategory === 'all') {
      this.featuredServices = this.services.slice(0, 6);
    } else {
      this.featuredServices = this.services
        .filter(service => service.serviceName?.toLowerCase().includes(this.selectedCategory))
        .slice(0, 6);
    }
  }

  // Utility Methods
  getServiceIcon(service: ServicesForBusiness): string {
    const icons: { [key: string]: string } = {
      'consulting': 'pi pi-users',
      'technology': 'pi pi-cog',
      'marketing': 'pi pi-chart-line',
      'default': 'pi pi-star'
    };
    return icons['default'];
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Galleria Methods
  onGalleriaItemChange(event: any) {
    console.log('Galleria item changed:', event);
  }
} 