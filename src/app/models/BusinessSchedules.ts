export interface BusinessSchedules {
  scheduleID: string;
  businessID: string;
  cycle_type: string;
  cycle_length_days: number;
  cycle_start_date: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBusinessScheduleRequest {
  businessID: string;
  cycle_type: string;
  cycle_length_days: number;
  cycle_start_date: Date;
}

export interface UpdateBusinessScheduleRequest {
  cycle_type?: string;
  cycle_length_days?: number;
  cycle_start_date?: Date;
  is_active?: boolean;
} 