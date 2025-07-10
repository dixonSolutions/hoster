export interface StaffMembers {
  staffID: string;
  businessID: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  access_all: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateStaffMemberRequest {
  businessID: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  access_all: boolean;
}

export interface UpdateStaffMemberRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  access_all?: boolean;
  is_active?: boolean;
} 