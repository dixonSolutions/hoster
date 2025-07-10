export interface ScheduleCycles {
  cycleID: string;
  businessID: string;
  schedule_id: string;
  start_date: Date;
  end_date: Date;
  is_active: boolean;
}

export interface CreateScheduleCycleRequest {
  businessID: string;
  schedule_id: string;
  start_date: Date;
  end_date: Date;
}

export interface UpdateScheduleCycleRequest {
  start_date?: Date;
  end_date?: Date;
  is_active?: boolean;
} 