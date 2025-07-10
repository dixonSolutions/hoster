import { Injectable } from '@angular/core';
import { 
  ComponentInstance, 
  ComponentDefinition, 
  ComponentRenderOptions,
  TextBlockParams,
  ImageParams,
  ButtonParams,
  FooterParams,
  TestimonialParams,
  PrimeCardParams
} from '../models/WebsiteRendering';
import { WebsiteCacheService } from './website-cache.service';

@Injectable({
  providedIn: 'root'
})
export class ComponentRenderingService {
  
  constructor(private cacheService: WebsiteCacheService) {}

  /**
   * Render a component instance to HTML
   */
  renderComponent(
    component: ComponentInstance, 
    componentDef: ComponentDefinition,
    options: ComponentRenderOptions = { includeWrapper: true }
  ): string {
    // Check cache first
    const cacheKey = this.generateCacheKey(component, componentDef);
    const cached = this.cacheService.getComponentHTML(cacheKey);
    if (cached) {
      return cached;
    }

    // Render component
    let html = '';
    
    try {
      // Merge parameters
      const mergedParams = this.mergeComponentParameters(component, componentDef);
      
      // Get component-specific HTML
      html = this.renderComponentByType(component, componentDef, mergedParams);
      
      // Add wrapper if requested
      if (options.includeWrapper) {
        html = this.wrapComponent(html, component, componentDef, options);
      }
      
      // Cache the result
      this.cacheService.setComponentHTML(cacheKey, html);
      
    } catch (error) {
      console.error(`Error rendering component ${component.id}:`, error);
      html = this.renderErrorComponent(component, error as Error);
    }

    return html;
  }

  /**
   * Render component based on its type
   */
  private renderComponentByType(
    component: ComponentInstance, 
    componentDef: ComponentDefinition,
    parameters: any
  ): string {
    switch (component.type) {
      case 'text-block':
        return this.renderTextBlock(parameters as TextBlockParams);
      case 'image':
        return this.renderImage(parameters as ImageParams);
      case 'button':
        return this.renderButton(parameters as ButtonParams);
      case 'footer':
        return this.renderFooter(parameters as FooterParams);
      case 'testimonial':
        return this.renderTestimonial(parameters as TestimonialParams);
      case 'prime-card-001':
        return this.renderPrimeCard(parameters as PrimeCardParams);
      default:
        return this.renderGenericComponent(component, componentDef, parameters);
    }
  }

  /**
   * Render text block component
   */
  private renderTextBlock(params: TextBlockParams): string {
    const title = params.title || '';
    const description = params.description || '';
    const backgroundColor = params.backgroundColor || '#ffffff';
    const textColor = params.textColor || '#333333';
    const alignment = params.alignment || 'left';
    const fontSize = params.fontSize || '16px';
    const fontWeight = params.fontWeight || 'normal';

    return `
      <div class="p-card text-block-component" style="
        background-color: ${backgroundColor};
        color: ${textColor};
        text-align: ${alignment};
        padding: 1.5rem;
        font-size: ${fontSize};
        font-weight: ${fontWeight};
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border: 1px solid #e9ecef;
      ">
        ${title ? `<h2 class="p-card-title" style="margin: 0 0 1rem 0; font-size: 1.5em; font-weight: 600; color: ${textColor};">${this.sanitizeHtml(title)}</h2>` : ''}
        ${description ? `<p class="p-card-content" style="margin: 0; line-height: 1.6; color: ${textColor};">${this.sanitizeHtml(description)}</p>` : ''}
      </div>
    `;
  }

  /**
   * Render image component
   */
  private renderImage(params: ImageParams): string {
    const imageUrl = params.imageUrl || '';
    const altText = params.altText || 'Image';
    const objectFit = params.objectFit || 'cover';
    const borderRadius = params.borderRadius || 8;
    const filter = params.filter || 'none';

    if (!imageUrl) {
      return `
        <div class="p-card image-placeholder" style="
          width: 100%;
          height: 100%;
          background-color: #f8f9fa;
          border: 2px dashed #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: ${borderRadius}px;
          color: #6c757d;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        ">
          <div style="text-align: center;">
            <i class="pi pi-image" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
            No image selected
          </div>
        </div>
      `;
    }

    return `
      <div class="image-component" style="
        width: 100%;
        height: 100%;
        border-radius: ${borderRadius}px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        border: 1px solid #e9ecef;
      ">
        <img 
          src="${this.sanitizeUrl(imageUrl)}" 
          alt="${this.sanitizeHtml(altText)}" 
          style="
            width: 100%;
            height: 100%;
            object-fit: ${objectFit};
            filter: ${filter};
            display: block;
            transition: transform 0.3s ease;
          "
          loading="lazy"
          onmouseover="this.style.transform='scale(1.05)'"
          onmouseout="this.style.transform='scale(1)'"
        >
      </div>
    `;
  }

  /**
   * Render button component
   */
  private renderButton(params: ButtonParams): string {
    const text = params.text || 'Click Me';
    const backgroundColor = params.backgroundColor || '#007bff';
    const textColor = params.textColor || '#ffffff';
    const borderRadius = params.borderRadius || 8;
    const size = params.size || 'medium';
    const customUrl = params.customUrl || '';
    const navigateTo = params.navigateTo || '';
    const openInNewTab = params.openInNewTab || false;

    // Size-specific styles with PrimeNG classes
    const sizeStyles = {
      small: 'padding: 0.5rem 1rem; font-size: 0.875rem;',
      medium: 'padding: 0.75rem 1.5rem; font-size: 1rem;',
      large: 'padding: 1rem 2rem; font-size: 1.125rem;'
    };

    const href = customUrl || (navigateTo ? `#${navigateTo}` : '#');
    const target = openInNewTab ? '_blank' : '_self';

    return `
      <a 
        href="${this.sanitizeUrl(href)}" 
        target="${target}"
        class="p-button p-component p-button-${size} btn-component"
        style="
          background-color: ${backgroundColor};
          color: ${textColor};
          border: 1px solid ${backgroundColor};
          border-radius: ${borderRadius}px;
          ${sizeStyles[size]}
          cursor: pointer;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          font-family: inherit;
          font-weight: 500;
          transition: opacity 0.2s ease;
        "
        onmouseover="this.style.opacity='0.9'"
        onmouseout="this.style.opacity='1'"
      >
        ${this.sanitizeHtml(text)}
      </a>
    `;
  }

  /**
   * Render footer component
   */
  private renderFooter(params: FooterParams): string {
    const companyName = params.companyName || 'Your Company';
    const description = params.description || '';
    const showSocialLinks = params.showSocialLinks || false;
    const copyright = params.copyright || `© ${new Date().getFullYear()} ${companyName}. All rights reserved.`;
    const backgroundColor = params.backgroundColor || '#2c3e50';
    const textColor = params.textColor || '#ffffff';
    const links = params.links || [];

    const linksHtml = links.map(link => `
      <a 
        href="${this.sanitizeUrl(link.url)}" 
        target="${link.openInNewTab ? '_blank' : '_self'}"
        class="p-button p-button-text"
        style="
          color: ${textColor}; 
          text-decoration: none; 
          margin-right: 1rem;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          transition: all 0.3s ease;
        "
        onmouseover="this.style.backgroundColor='rgba(255,255,255,0.1)'"
        onmouseout="this.style.backgroundColor='transparent'"
      >
        ${this.sanitizeHtml(link.text)}
      </a>
    `).join('');

    return `
      <footer class="p-card footer-component" style="
        background-color: ${backgroundColor};
        color: ${textColor};
        padding: 2rem 1rem;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        border-radius: 12px;
        border: 1px solid #34495e;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      ">
        <div class="footer-content" style="max-width: 1200px; width: 100%;">
          <div class="footer-branding" style="margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 600; color: ${textColor};">
              ${this.sanitizeHtml(companyName)}
            </h3>
            ${description ? `
              <p style="margin: 0; font-size: 1rem; opacity: 0.9; color: ${textColor};">
                ${this.sanitizeHtml(description)}
              </p>
            ` : ''}
          </div>
          
          ${links.length > 0 ? `
            <div class="footer-links" style="margin-bottom: 1.5rem;">
              ${linksHtml}
            </div>
          ` : ''}
          
          ${showSocialLinks ? `
            <div class="footer-social" style="margin-bottom: 1.5rem;">
              <a href="#" class="p-button p-button-rounded p-button-text" style="color: ${textColor}; margin: 0 0.5rem;">
                <i class="pi pi-facebook" style="font-size: 1.5rem;"></i>
              </a>
              <a href="#" class="p-button p-button-rounded p-button-text" style="color: ${textColor}; margin: 0 0.5rem;">
                <i class="pi pi-twitter" style="font-size: 1.5rem;"></i>
              </a>
              <a href="#" class="p-button p-button-rounded p-button-text" style="color: ${textColor}; margin: 0 0.5rem;">
                <i class="pi pi-linkedin" style="font-size: 1.5rem;"></i>
              </a>
            </div>
          ` : ''}
          
          <div class="footer-copyright" style="
            font-size: 0.875rem; 
            opacity: 0.8; 
            color: ${textColor};
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-top: 1rem;
          ">
            ${this.sanitizeHtml(copyright)}
          </div>
        </div>
      </footer>
    `;
  }

  /**
   * Render testimonial component
   */
  private renderTestimonial(params: TestimonialParams): string {
    // Support both old and new parameter names
    const customerName = params.customerName || params.authorName || 'Anonymous';
    const customerPosition = params.customerPosition || params.authorTitle || '';
    const customerImage = params.customerImage || '';
    const testimonialText = params.testimonialText || params.quote || '';
    const rating = Math.min(params.rating || 5, 5); // Cap at 5 stars
    const backgroundColor = params.backgroundColor || '#ffffff';
    const textColor = params.textColor || '#333333';

    const starsHtml = Array.from({length: 5}, (_, i) => 
      `<span style="color: ${i < rating ? '#ffd700' : '#ddd'}; font-size: 1.2rem;">★</span>`
    ).join('');

    return `
      <div class="p-card testimonial-component" style="
        background-color: ${backgroundColor};
        color: ${textColor};
        padding: 2rem;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: center;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        border: 1px solid #e9ecef;
      ">
        <div class="testimonial-content" style="flex: 1;">
          <div class="testimonial-text" style="
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
            font-style: italic;
            color: ${textColor};
          ">
            "${this.sanitizeHtml(testimonialText)}"
          </div>
          <div class="testimonial-rating" style="margin-bottom: 1.5rem;">
            ${starsHtml}
          </div>
        </div>
        <div class="testimonial-author" style="
          display: flex;
          align-items: center;
          gap: 1rem;
          border-top: 1px solid #e9ecef;
          padding-top: 1rem;
        ">
          ${customerImage ? `
            <img 
              src="${this.sanitizeUrl(customerImage)}" 
              alt="${this.sanitizeHtml(customerName)}"
              style="
                width: 50px;
                height: 50px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #e9ecef;
              "
            >
          ` : `
            <div style="
              width: 50px;
              height: 50px;
              border-radius: 50%;
              background-color: #4A90E2;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 1.2rem;
            ">
              ${customerName.charAt(0).toUpperCase()}
            </div>
          `}
          <div class="author-info">
            <div class="author-name" style="font-weight: 600; margin-bottom: 0.25rem; color: #2c3e50;">
              ${this.sanitizeHtml(customerName)}
            </div>
            ${customerPosition ? `
              <div class="author-position" style="font-size: 0.9rem; color: #666666;">
                ${this.sanitizeHtml(customerPosition)}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render prime card component
   */
  private renderPrimeCard(params: PrimeCardParams): string {
    const title = params.title || 'Card Title';
    const description = params.description || 'Card description goes here.';
    const imageUrl = params.picture || params.imageUrl || '';
    const showImage = params.showImage !== false;
    const backgroundColor = params.backgroundColor || '#ffffff';
    const textColor = params.textColor || '#333333';
    const borderRadius = params.borderRadius || 12;
    const showShadow = params.showShadow !== false;

    return `
      <div class="p-card p-component prime-card-component" style="
        background-color: ${backgroundColor};
        color: ${textColor};
        border-radius: ${borderRadius}px;
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        ${showShadow ? 'box-shadow: 0 4px 12px rgba(0,0,0,0.1);' : ''}
      ">
        ${imageUrl ? `
          <div class="card-image" style="
            width: 100%;
            height: 200px;
            overflow: hidden;
          ">
            <img 
              src="${this.sanitizeUrl(imageUrl)}" 
              alt="${this.sanitizeHtml(title)}"
              style="
                width: 100%;
                height: 100%;
                object-fit: cover;
              "
            >
          </div>
        ` : ''}
        <div class="card-content" style="
          padding: 1.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        ">
          <h3 class="card-title" style="
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
            font-weight: 600;
          ">
            ${this.sanitizeHtml(title)}
          </h3>
          <p class="card-description" style="
            margin: 0;
            line-height: 1.6;
            flex: 1;
          ">
            ${this.sanitizeHtml(description)}
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Render generic component using template
   */
  private renderGenericComponent(
    component: ComponentInstance, 
    componentDef: ComponentDefinition,
    parameters: any
  ): string {
    let html = componentDef.htmlTemplate || '<div>No template defined</div>';

    // Replace parameter placeholders
    html = this.replaceParameterPlaceholders(html, parameters);

    return html;
  }

  /**
   * Replace parameter placeholders in template
   */
  private replaceParameterPlaceholders(template: string, parameters: any): string {
    let processedTemplate = template;

    Object.keys(parameters).forEach(paramName => {
      const placeholder = `{{${paramName}}}`;
      const value = this.formatParameterValue(parameters[paramName]);
      processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value);
    });

    return processedTemplate;
  }

  /**
   * Format parameter value for HTML output
   */
  private formatParameterValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'boolean') {
      return value.toString();
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return this.sanitizeHtml(String(value));
  }

  /**
   * Merge component parameters with defaults
   */
  private mergeComponentParameters(component: ComponentInstance, componentDef: ComponentDefinition): any {
    // Parse default parameters from either parameters or defaultParameters field
    let defaultParams = {};
    try {
      const paramsString = componentDef.parameters || componentDef.defaultParameters || '{}';
      defaultParams = JSON.parse(paramsString);
    } catch (error) {
      console.warn(`Failed to parse default parameters for ${componentDef.id}:`, error);
    }

    // Merge with instance parameters
    return { ...defaultParams, ...component.parameters };
  }

  /**
   * Wrap component with positioning and styling
   */
  private wrapComponent(
    html: string, 
    component: ComponentInstance, 
    componentDef: ComponentDefinition,
    options: ComponentRenderOptions
  ): string {
    const styles = {
      position: 'absolute',
      left: `${component.x}px`,
      top: `${component.y}px`,
      width: `${component.width}px`,
      height: `${component.height}px`,
      zIndex: component.zIndex.toString(),
      ...options.customStyles
    };

    const styleString = Object.entries(styles)
      .map(([key, value]) => `${this.camelToKebab(key)}: ${value}`)
      .join('; ');

    const classes = [
      'component-wrapper',
      `component-${component.type}`,
      ...(options.customClasses || [])
    ].join(' ');

    return `<div class="${classes}" style="${styleString}" data-component-id="${component.id}">${html}</div>`;
  }

  /**
   * Render error component
   */
  private renderErrorComponent(component: ComponentInstance, error: Error): string {
    return `
      <div class="component-error" style="
        width: 100%;
        height: 100%;
        background-color: #ffe6e6;
        border: 2px dashed #ff4444;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        box-sizing: border-box;
        color: #cc0000;
        font-size: 12px;
        text-align: center;
      ">
        <div>
          <strong>Error rendering component</strong><br>
          Type: ${component.type}<br>
          ID: ${component.id}<br>
          Error: ${error.message}
        </div>
      </div>
    `;
  }

  /**
   * Generate cache key for component
   */
  private generateCacheKey(component: ComponentInstance, componentDef: ComponentDefinition): string {
    const paramHash = JSON.stringify(component.parameters);
    return `${component.type}_${component.id}_${btoa(paramHash).substring(0, 8)}`;
  }

  /**
   * Convert camelCase to kebab-case
   */
  private camelToKebab(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  /**
   * Sanitize HTML content
   */
  private sanitizeHtml(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Sanitize URL
   */
  private sanitizeUrl(url: string): string {
    // Allow data: URLs for images (base64 encoded images)
    if (url.startsWith('data:image/')) {
      return url;
    }
    
    // Block potentially dangerous protocols
    if (url.startsWith('javascript:') || url.startsWith('vbscript:')) {
      return '#';
    }
    
    // Allow other data: URLs but validate them
    if (url.startsWith('data:')) {
      // For non-image data URLs, be more cautious
      try {
        // Basic validation - ensure it's properly formatted
        const parts = url.split(',');
        if (parts.length === 2 && parts[0].includes('base64')) {
          return url;
        }
      } catch (error) {
        console.warn('Invalid data URL:', error);
        return '#';
      }
    }
    
    return url;
  }
} 