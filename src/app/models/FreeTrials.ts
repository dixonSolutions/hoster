export interface FreeTrials {
  trialID: string;
  userID: string;
  user_email: string;
  start_date: Date;
  end_date: Date;
  days_remaining: number;
  is_active: boolean;
  created_at: Date;
}

export interface CreateFreeTrialRequest {
  userID: string;
  user_email: string;
  start_date: Date;
  end_date: Date;
  days_remaining: number;
}

export interface UpdateFreeTrialRequest {
  end_date?: Date;
  days_remaining?: number;
  is_active?: boolean;
} 