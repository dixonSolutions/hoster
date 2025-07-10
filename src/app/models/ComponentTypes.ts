export interface ComponentTypes {
  componentTypeID: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  parameters_schema: Record<string, any>;
  default_parameters: Record<string, any>;
  html_template: string;
  default_width: number;
  default_height: number;
  is_active: boolean;
  created_at: Date;
}

export interface CreateComponentTypeRequest {
  name: string;
  category: string;
  icon: string;
  description: string;
  parameters_schema: Record<string, any>;
  default_parameters: Record<string, any>;
  html_template: string;
  default_width: number;
  default_height: number;
}

export interface UpdateComponentTypeRequest {
  name?: string;
  category?: string;
  icon?: string;
  description?: string;
  parameters_schema?: Record<string, any>;
  default_parameters?: Record<string, any>;
  html_template?: string;
  default_width?: number;
  default_height?: number;
  is_active?: boolean;
} 