export interface WorkspaceComponents {
  componentID: string;
  workspaceID: string;
  page_id: string;
  component_type_id: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  z_index: number;
  parameters: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateWorkspaceComponentRequest {
  workspaceID: string;
  page_id: string;
  component_type_id: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  z_index: number;
  parameters: Record<string, any>;
}

export interface UpdateWorkspaceComponentRequest {
  page_id?: string;
  component_type_id?: string;
  x_position?: number;
  y_position?: number;
  width?: number;
  height?: number;
  z_index?: number;
  parameters?: Record<string, any>;
} 