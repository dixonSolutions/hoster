import { Injectable } from '@angular/core';
import { 
  ValidationResult, 
  IncomingData, 
  ComponentDefinition, 
  ComponentInstance 
} from '../models/WebsiteRendering';

@Injectable({
  providedIn: 'root'
})
export class WebsiteValidationService {

  /**
   * Validate complete incoming website data
   */
  validateIncomingData(data: IncomingData): ValidationResult {
    const errors: string[] = [];

    // Validate basic structure
    if (!data.workspaceId?.trim()) {
      errors.push('Missing or empty workspaceId');
    }

    if (!data.name?.trim()) {
      errors.push('Missing or empty website name');
    }

    if (!data.websiteJson?.trim()) {
      errors.push('Missing or empty websiteJson');
    }

    if (!data.components || !Array.isArray(data.components)) {
      errors.push('Missing or invalid components array');
    }

    // Validate websiteJson can be parsed
    if (data.websiteJson) {
      try {
        const parsed = JSON.parse(data.websiteJson);
        const websiteDataValidation = this.validateWebsiteData(parsed);
        errors.push(...websiteDataValidation.errors);
      } catch (error) {
        errors.push(`Invalid websiteJson format: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Validate components
    if (data.components) {
      const componentValidation = this.validateComponents(data.components);
      errors.push(...componentValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate parsed website data structure
   */
  validateWebsiteData(data: any): ValidationResult {
    const errors: string[] = [];

    // Check required top-level fields
    if (!data.builtInNavigation) {
      errors.push('Missing builtInNavigation configuration');
    } else {
      const navValidation = this.validateNavigationConfig(data.builtInNavigation);
      errors.push(...navValidation.errors);
    }

    if (!data.pages || !Array.isArray(data.pages)) {
      errors.push('Missing or invalid pages array');
    } else {
      // Validate each page
      data.pages.forEach((page: any, index: number) => {
        const pageValidation = this.validatePage(page, index);
        errors.push(...pageValidation.errors);
      });

      // Check for duplicate page IDs
      const pageIds = data.pages.map((p: any) => p.id).filter(Boolean);
      const duplicateIds = pageIds.filter((id: string, index: number) => pageIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        errors.push(`Duplicate page IDs found: ${duplicateIds.join(', ')}`);
      }

      // Check for duplicate routes
      const routes = data.pages.map((p: any) => p.route).filter(Boolean);
      const duplicateRoutes = routes.filter((route: string, index: number) => routes.indexOf(route) !== index);
      if (duplicateRoutes.length > 0) {
        errors.push(`Duplicate page routes found: ${duplicateRoutes.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate navigation configuration
   */
  validateNavigationConfig(navConfig: any): ValidationResult {
    const errors: string[] = [];

    if (!navConfig.logoType || !['text', 'image'].includes(navConfig.logoType)) {
      errors.push('Navigation: logoType must be "text" or "image"');
    }

    if (navConfig.logoType === 'text' && !navConfig.logoText?.trim()) {
      errors.push('Navigation: logoText is required when logoType is "text"');
    }

    if (navConfig.logoType === 'image' && !navConfig.logoImage?.trim()) {
      errors.push('Navigation: logoImage is required when logoType is "image"');
    }

    if (navConfig.logoShape && !['square', 'circle', 'rounded'].includes(navConfig.logoShape)) {
      errors.push('Navigation: logoShape must be "square", "circle", or "rounded"');
    }

    if (navConfig.logoSize && !['small', 'normal', 'large'].includes(navConfig.logoSize)) {
      errors.push('Navigation: logoSize must be "small", "normal", or "large"');
    }

    if (navConfig.backgroundColor && !this.isValidColor(navConfig.backgroundColor)) {
      errors.push('Navigation: backgroundColor must be a valid CSS color');
    }

    if (navConfig.textColor && !this.isValidColor(navConfig.textColor)) {
      errors.push('Navigation: textColor must be a valid CSS color');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate individual page
   */
  validatePage(page: any, index: number): ValidationResult {
    const errors: string[] = [];
    const pagePrefix = `Page ${index + 1}`;

    if (!page.id?.trim()) {
      errors.push(`${pagePrefix}: Missing or empty id`);
    }

    if (!page.name?.trim()) {
      errors.push(`${pagePrefix}: Missing or empty name`);
    }

    if (!page.route?.trim()) {
      errors.push(`${pagePrefix}: Missing or empty route`);
    } else if (!page.route.startsWith('/')) {
      errors.push(`${pagePrefix}: Route must start with /`);
    }

    if (page.isDeletable !== undefined && typeof page.isDeletable !== 'boolean') {
      errors.push(`${pagePrefix}: isDeletable must be a boolean`);
    }

    if (page.components && !Array.isArray(page.components)) {
      errors.push(`${pagePrefix}: Components must be an array`);
    } else if (page.components) {
      page.components.forEach((component: any, compIndex: number) => {
        const componentValidation = this.validateComponentInstance(component, compIndex, page.id);
        errors.push(...componentValidation.errors);
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate component definitions
   */
  validateComponents(components: ComponentDefinition[]): ValidationResult {
    const errors: string[] = [];

    components.forEach((component, index) => {
      const compPrefix = `Component ${index + 1}`;

      // Only validate required fields that are actually required
      if (!component.id?.trim()) {
        errors.push(`${compPrefix}: Missing or empty id`);
      }

      // componentType is essential for rendering - if not present, try componentId
      if (!component.componentType?.trim() && !component.componentId?.trim()) {
        errors.push(`${compPrefix}: Missing componentType or componentId`);
      }

      // Validate numeric fields only if they exist and need to be positive
      if (component.defaultWidth !== undefined && component.defaultWidth <= 0) {
        errors.push(`${compPrefix}: defaultWidth must be greater than 0`);
      }

      if (component.defaultHeight !== undefined && component.defaultHeight <= 0) {
        errors.push(`${compPrefix}: defaultHeight must be greater than 0`);
      }

      // Validate JSON strings only if they exist
      if (component.parametersSchema) {
        try {
          JSON.parse(component.parametersSchema);
        } catch {
          errors.push(`${compPrefix}: Invalid parametersSchema JSON`);
        }
      }

      if (component.defaultParameters) {
        try {
          JSON.parse(component.defaultParameters);
        } catch {
          errors.push(`${compPrefix}: Invalid defaultParameters JSON`);
        }
      }

      // Validate parameters field if it exists
      if (component.parameters) {
        try {
          JSON.parse(component.parameters);
        } catch {
          errors.push(`${compPrefix}: Invalid parameters JSON`);
        }
      }
    });

    // Check for duplicate component IDs
    const componentIds = components.map(c => c.id).filter(Boolean);
    const duplicateIds = componentIds.filter((id, index) => componentIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate component IDs found: ${duplicateIds.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate component instance
   */
  validateComponentInstance(component: any, index: number, pageId: string): ValidationResult {
    const errors: string[] = [];
    const compPrefix = `Page ${pageId}, Component ${index + 1}`;

    if (!component.id?.trim()) {
      errors.push(`${compPrefix}: Missing or empty id`);
    }

    if (!component.type?.trim()) {
      errors.push(`${compPrefix}: Missing or empty type`);
    }

    if (typeof component.x !== 'number' || component.x < 0) {
      errors.push(`${compPrefix}: x position must be a non-negative number`);
    }

    if (typeof component.y !== 'number' || component.y < 0) {
      errors.push(`${compPrefix}: y position must be a non-negative number`);
    }

    if (typeof component.width !== 'number' || component.width <= 0) {
      errors.push(`${compPrefix}: width must be a positive number`);
    }

    if (typeof component.height !== 'number' || component.height <= 0) {
      errors.push(`${compPrefix}: height must be a positive number`);
    }

    if (typeof component.zIndex !== 'number') {
      errors.push(`${compPrefix}: zIndex must be a number`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate CSS color value
   */
  private isValidColor(color: string): boolean {
    // Basic color validation - hex, rgb, rgba, hsl, hsla, or named colors
    const colorPatterns = [
      /^#([0-9A-F]{3}|[0-9A-F]{6})$/i, // hex
      /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i, // rgb
      /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([01]?\.?\d*)\s*\)$/i, // rgba
      /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/i, // hsl
      /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*([01]?\.?\d*)\s*\)$/i // hsla
    ];

    // Check patterns
    if (colorPatterns.some(pattern => pattern.test(color))) {
      return true;
    }

    // Check named colors (basic list)
    const namedColors = [
      'transparent', 'currentColor', 'black', 'white', 'red', 'green', 'blue',
      'yellow', 'orange', 'purple', 'pink', 'gray', 'grey', 'brown', 'cyan',
      'magenta', 'lime', 'maroon', 'navy', 'olive', 'teal', 'silver', 'aqua',
      'fuchsia'
    ];

    return namedColors.includes(color.toLowerCase());
  }

  /**
   * Validate component parameters against schema
   */
  validateComponentParameters(parameters: any, schema: string): ValidationResult {
    const errors: string[] = [];

    if (!schema) {
      return { isValid: true, errors: [] };
    }

    try {
      const parsedSchema = JSON.parse(schema);
      
      // Basic validation - check required fields
      Object.keys(parsedSchema).forEach(paramName => {
        const paramConfig = parsedSchema[paramName];
        
        if (paramConfig.required && (parameters[paramName] === undefined || parameters[paramName] === null)) {
          errors.push(`Required parameter '${paramName}' is missing`);
        }
      });

    } catch (error) {
      errors.push(`Invalid parameter schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 