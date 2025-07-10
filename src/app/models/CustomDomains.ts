export interface CustomDomains {
  domainID: string;
  businessID: string;
  workspaceID: string;
  domain_name: string;
  is_verified: boolean;
  dns_records: Record<string, any>;
  ssl_status: string;
  created_at: Date;
  verified_at?: Date;
}

export interface CreateCustomDomainRequest {
  businessID: string;
  workspaceID: string;
  domain_name: string;
  dns_records: Record<string, any>;
  ssl_status: string;
}

export interface UpdateCustomDomainRequest {
  domain_name?: string;
  is_verified?: boolean;
  dns_records?: Record<string, any>;
  ssl_status?: string;
  verified_at?: Date;
} 