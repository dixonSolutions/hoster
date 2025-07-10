export interface Services {
  serviceID: string;
  businessID: string;
  service_name: string;
  service_description: string;
  duration_minutes: number;
  estimated_time: string;
  price: number;
  currency_unit: string;
  image_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateServiceRequest {
  businessID: string;
  service_name: string;
  service_description: string;
  duration_minutes: number;
  estimated_time: string;
  price: number;
  currency_unit: string;
  image_url?: string;
}

export interface UpdateServiceRequest {
  service_name?: string;
  service_description?: string;
  duration_minutes?: number;
  estimated_time?: string;
  price?: number;
  currency_unit?: string;
  image_url?: string;
  is_active?: boolean;
} 