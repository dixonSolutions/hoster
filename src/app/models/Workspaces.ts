export interface Workspaces {
  workspaceID: string;
  userID: string;
  businessID: string;
  name: string;
  description: string;
  thumbnail_url?: string;
  website_json: string;
  deployment_status: string;
  deployment_url?: string;
  deployed_at?: Date;
  created_at: Date;
  last_modified: Date;
}

export interface CreateWorkspaceRequest {
  userID: string;
  businessID: string;
  name: string;
  description: string;
  thumbnail_url?: string;
  website_json: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  thumbnail_url?: string;
  website_json?: string;
  deployment_status?: string;
  deployment_url?: string;
  deployed_at?: Date;
} 