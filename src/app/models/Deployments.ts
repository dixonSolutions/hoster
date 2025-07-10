export interface Deployments {
  deploymentID: string;
  workspaceID: string;
  deployment_status: string;
  deployment_url: string;
  website_name: string;
  deployed_by: string;
  deployed_at: Date;
  error_message?: string;
  created_at: Date;
}

export interface CreateDeploymentRequest {
  workspaceID: string;
  deployment_status: string;
  deployment_url: string;
  website_name: string;
  deployed_by: string;
}

export interface UpdateDeploymentRequest {
  deployment_status?: string;
  deployment_url?: string;
  website_name?: string;
  deployed_at?: Date;
  error_message?: string;
} 