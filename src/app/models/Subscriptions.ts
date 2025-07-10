export interface Subscriptions {
  subscriptionID: string;
  userID: string;
  status: string;
  current_period_start: Date;
  current_period_end: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSubscriptionRequest {
  userID: string;
  status: string;
  current_period_start: Date;
  current_period_end: Date;
}

export interface UpdateSubscriptionRequest {
  status?: string;
  current_period_start?: Date;
  current_period_end?: Date;
} 