// Core Data Interfaces
export interface IncomingData {
  workspaceId: string;
  name: string;
  websiteJson: string; // JSON string that needs parsing
  components: ComponentDefinition[];
}

export interface ComponentDefinition {
  id: string;
  workspaceId?: string;
  pageId?: string;
  componentId?: string;
  componentType?: string;
  name?: string;
  category?: string;
  icon?: string;
  description?: string;
  parametersSchema?: string; // JSON string
  defaultParameters?: string; // JSON string
  parameters?: string; // JSON string
  htmlTemplate?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  xPosition?: number;
  yPosition?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  styles?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ComponentInstance {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  parameters: any;
}

export interface ProcessedPage {
  id: string;
  name: string;
  route: string;
  isDeletable: boolean;
  isActive: boolean;
  components: ComponentInstance[];
}

export interface NavigationConfig {
  logoType: 'text' | 'image';
  logoText: string;
  logoImage: string;
  logoShape: 'square' | 'circle' | 'rounded';
  logoSize: 'small' | 'normal' | 'large';
  backgroundColor: string;
  textColor: string;
  showShadow: boolean;
}

export interface ParsedWebsiteData {
  navigation: NavigationConfig;
  pages: ProcessedPage[];
  components: Map<string, ComponentDefinition>;
}

export interface RenderedWebsite {
  navigation: string;
  pages: RenderedPage[];
}

export interface RenderedPage {
  id: string;
  name: string;
  route: string;
  html: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface RenderingCache {
  renderedPages: Map<string, string>;
  componentHTML: Map<string, string>;
  pageComponents: Map<string, ComponentInstance[]>;
}

export interface ComponentRenderOptions {
  includeWrapper: boolean;
  customStyles?: Record<string, string>;
  customClasses?: string[];
}

export interface PageRenderOptions {
  includeNavigation: boolean;
  customCSS?: string;
  customJS?: string;
}

// Component-specific interfaces
export interface TextBlockParams {
  title?: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  alignment?: 'left' | 'center' | 'right';
  fontSize?: string;
  fontWeight?: string;
}

export interface ImageParams {
  imageUrl: string;
  altText?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  borderRadius?: number;
  filter?: string;
}

export interface ButtonParams {
  text: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  size?: 'small' | 'medium' | 'large';
  customUrl?: string;
  navigateTo?: string;
  openInNewTab?: boolean;
}

export interface FooterParams {
  companyName?: string;
  description?: string;
  showSocialLinks?: boolean;
  copyright?: string;
  backgroundColor?: string;
  textColor?: string;
  links?: FooterLink[];
}

export interface FooterLink {
  text: string;
  url: string;
  openInNewTab?: boolean;
}

export interface TestimonialParams {
  customerName?: string;
  customerPosition?: string;
  customerImage?: string;
  testimonialText?: string;
  authorName?: string;
  authorTitle?: string;
  quote?: string;
  rating?: number;
  backgroundColor?: string;
  textColor?: string;
}

export interface PrimeCardParams {
  title?: string;
  description?: string;
  imageUrl?: string;
  picture?: string;
  showImage?: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  showShadow?: boolean;
}

// Error and event interfaces
export interface RenderingError {
  componentId?: string;
  pageId?: string;
  error: string;
  timestamp: Date;
}

export interface RenderingEvent {
  type: 'page-rendered' | 'component-rendered' | 'navigation-updated' | 'error' | 'initialization-started' | 'initialization-completed' | 'initialization-failed' | 'page-render-failed' | 'all-pages-rendered' | 'page-changed' | 'cache-cleared';
  data: any;
  timestamp: Date;
} 