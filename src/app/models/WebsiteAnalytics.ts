export interface WebsiteAnalytics {
  analyticsID: string;
  workspaceID: string;
  page_views: number;
  unique_visitors: number;
  bounce_rate: number;
  session_duration: number;
  recorded_date: Date;
  created_at: Date;
}

export interface CreateWebsiteAnalyticsRequest {
  workspaceID: string;
  page_views: number;
  unique_visitors: number;
  bounce_rate: number;
  session_duration: number;
  recorded_date: Date;
}

export interface UpdateWebsiteAnalyticsRequest {
  page_views?: number;
  unique_visitors?: number;
  bounce_rate?: number;
  session_duration?: number;
  recorded_date?: Date;
}

export interface WebsiteAnalyticsSummary {
  workspaceID: string;
  total_page_views: number;
  total_unique_visitors: number;
  average_bounce_rate: number;
  average_session_duration: number;
  date_range: {
    start: Date;
    end: Date;
  };
} 