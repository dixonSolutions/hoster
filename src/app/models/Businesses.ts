export interface Businesses {
  businessID: string;
  business_name: string;
  business_description: string;
  business_phone: string;
  business_email: string;
  owner_email: string;
  owner_user_id: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface CreateBusinessRequest {
  business_name: string;
  business_description: string;
  business_phone: string;
  business_email: string;
  owner_email: string;
  owner_user_id: string;
}

export interface UpdateBusinessRequest {
  business_name?: string;
  business_description?: string;
  business_phone?: string;
  business_email?: string;
  is_active?: boolean;
} 