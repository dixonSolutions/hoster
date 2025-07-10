export interface ScheduleExceptions {
  exceptionID: string;
  businessID: string;
  exception_date: Date;
  end_date?: Date;
  reason: string;
  exception_type: string;
  availability_status: string;
  is_closed: boolean;
  recurrence_pattern: string;
  recurrence_interval: number;
  is_active: boolean;
  notes: string;
}

export interface CreateScheduleExceptionRequest {
  businessID: string;
  exception_date: Date;
  end_date?: Date;
  reason: string;
  exception_type: string;
  availability_status: string;
  is_closed: boolean;
  recurrence_pattern: string;
  recurrence_interval: number;
  notes: string;
}

export interface UpdateScheduleExceptionRequest {
  exception_date?: Date;
  end_date?: Date;
  reason?: string;
  exception_type?: string;
  availability_status?: string;
  is_closed?: boolean;
  recurrence_pattern?: string;
  recurrence_interval?: number;
  is_active?: boolean;
  notes?: string;
} 