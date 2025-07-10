export interface OpeningPeriods {
  periodID: string;
  businessID: string;
  cycle_id: string;
  day_of_week: number;
  opening_time: string;
  closing_time: string;
  exception_date?: Date;
}

export interface CreateOpeningPeriodRequest {
  businessID: string;
  cycle_id: string;
  day_of_week: number;
  opening_time: string;
  closing_time: string;
  exception_date?: Date;
}

export interface UpdateOpeningPeriodRequest {
  day_of_week?: number;
  opening_time?: string;
  closing_time?: string;
  exception_date?: Date;
} 