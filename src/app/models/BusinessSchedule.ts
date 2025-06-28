export interface BusinessScheduleRequest {
  businessId: string;
  cycleType: ScheduleCycleType;
  cycleLengthInDays: number;
  cycleStartDate: string;
  cycles: ScheduleCycle[];
  exceptions: ScheduleException[];
}

export enum ScheduleCycleType {
  Weekly = 0,
  BiWeekly = 1,
  Monthly = 2,
  Custom = 3
}

export interface ScheduleCycle {
  businessId: string;
  cycleId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  days: DailySchedule[];
}

export interface DailySchedule {
  businessId: string;
  cycleId: number;
  day: number; // 0=Sunday, 1=Monday, etc.
  availabilityStatus: AvailabilityStatus;
  openingPeriods: OpeningPeriod[];
}

export enum AvailabilityStatus {
  Open24Hours = 0,
  Unavailable = 1,
  SpecificHours = 2
}

export interface OpeningPeriod {
  businessId: string;
  cycleId: number;
  day: number;
  openingTime: string; // "HH:mm:ss" format
  closingTime: string; // "HH:mm:ss" format
  exceptionBusinessId?: string;
  exceptionDate?: string;
}

export interface ScheduleException {
  businessId: string;
  exceptionDate: string;
  endDate?: string;
  reason: string;
  exceptionType: ExceptionType;
  availabilityStatus: AvailabilityStatus;
  isClosed: boolean;
  timeZone?: string;
  recurrencePattern: RecurrencePattern;
  recurrenceInterval?: number;
  recurrenceRule?: string;
  isActive: boolean;
  notes?: string;
  specialHours: OpeningPeriod[];
}

export enum ExceptionType {
  Holiday = 0,
  SpecialEvent = 1,
  Maintenance = 2,
  Weather = 3,
  StaffShortage = 4,
  Custom = 5
}

export enum RecurrencePattern {
  None = 0,
  Daily = 1,
  Weekly = 2,
  Monthly = 3,
  Yearly = 4,
  Custom = 5
} 