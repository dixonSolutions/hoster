// User and Business Management
export * from './Users';
export * from './Businesses';
export * from './BusinessPlaces';

// Service Management
export * from './Services';
export * from './ServicePlaceAssignments';
export * from './ServiceReview';

// Staff Management
export * from './StaffMembers';

// Website and Deployment Management
export * from './Workspaces';
export * from './Deployments';
export * from './ComponentTypes';
export * from './WorkspaceComponents';

// Business Operations and Scheduling
export * from './BusinessSchedules';
export * from './ScheduleCycles';
export * from './OpeningPeriods';
export * from './ScheduleExceptions';

// Subscription and Payment Management
export * from './Subscriptions';
export * from './FreeTrials';

// Advanced Hosting Features
export * from './CustomDomains';
export * from './WebsiteAnalytics';

// Website Rendering System
export * from './WebsiteRendering';

// Website Hoster System
export * from './WebsiteHoster';

// Existing models
export * from './account';
export * from './ApiResponse';
export * from './BusinessRegistration';
export * from './BusinessSchedule';
export * from './BussinessBasicInfo';
export * from './Order';
export * from './OrderAuth';
export * from './Payment';
export * from './ServicesForBusiness';
export * from './user';
export * from './AnonymousOrder';

// Enhanced API Response Types for 24-hour support (Actual API Schema)
export interface BusinessAvailabilityResponse {
  businessId: string;
  businessName: string;
  bookingDaysAhead: number;
  timeZone: string;
  availableDays: AvailabilityDay[];
  summary: AvailabilitySummary;
  generatedAt: string;
}

export interface AvailabilityDay {
  date: string; // ISO date string "2025-08-11"
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  isAvailable: boolean;
  status: 'SpecificHours' | 'Closed' | 'FullDay' | 'Limited';
  availableTimeSlots: TimeSlot[];
  specialNote?: string;
}

export interface TimeSlot {
  startTime: string; // "09:00" 24-hour format HH:mm
  endTime: string;   // "17:00" 24-hour format HH:mm
  isCurrentlyOpen: boolean;
  totalHours: number;
}

export interface AvailabilitySummary {
  totalAvailableDays: number;
  totalUnavailableDays: number;
  totalAvailableHours: number;
  nextAvailableDate: string;
  isCurrentlyOpen: boolean;
  operatingDays: string[];
}

export interface OrderValidationError {
  Success: false;
  Message: string;
  ErrorCode: "INVALID_DELIVERY_DATE";
  SuggestedDates: string[]; // ISO date strings
}

export interface EnhancedOrderResponse {
  Success: boolean;
  Message: string;
  ErrorCode?: string;
  SuggestedDates?: string[];
  OrderId?: string;
} 