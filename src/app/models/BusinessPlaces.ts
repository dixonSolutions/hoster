export interface BusinessPlaces {
  placeID: string;
  businessID: string;
  place_name: string;
  place_description: string;
  place_address: string;
  place_city: string;
  place_state: string;
  place_zip_code: string;
  place_country: string;
  place_phone?: string;
  place_email?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBusinessPlaceRequest {
  businessID: string;
  place_name: string;
  place_description: string;
  place_address: string;
  place_city: string;
  place_state: string;
  place_zip_code: string;
  place_country: string;
  place_phone?: string;
  place_email?: string;
}

export interface UpdateBusinessPlaceRequest {
  place_name?: string;
  place_description?: string;
  place_address?: string;
  place_city?: string;
  place_state?: string;
  place_zip_code?: string;
  place_country?: string;
  place_phone?: string;
  place_email?: string;
  is_active?: boolean;
} 