import { Injectable } from '@angular/core';
import { 
  NavigationConfig, 
  ProcessedPage 
} from '../models/WebsiteRendering';

@Injectable({
  providedIn: 'root'
})
export class NavigationRenderingService {

  /**
   * Render top navigation HTML
   */
  renderTopNavigation(navConfig: NavigationConfig, pages: ProcessedPage[]): string {
    const logoHTML = this.generateLogoHTML(navConfig);
    const navigationMenuHTML = this.generateNavigationMenuHTML(pages);
    const mobileMenuHTML = this.generateMobileMenuHTML(pages);

    return `
      <nav class="top-navigation" style="
        background-color: ${navConfig.backgroundColor};
        color: ${navConfig.textColor};
        padding: 1rem 2rem;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        ${navConfig.showShadow ? 'box-shadow: 0 2px 4px rgba(0,0,0,0.1);' : ''}
      ">
        <div class="nav-container" style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
        ">
          <div class="nav-logo">
            ${logoHTML}
          </div>
          <div class="nav-menu desktop-menu" style="
            display: flex;
            gap: 2rem;
          ">
            ${navigationMenuHTML}
          </div>
          <div class="mobile-menu-toggle" style="
            display: none;
            cursor: pointer;
            font-size: 1.5rem;
            color: ${navConfig.textColor};
          " onclick="toggleMobileMenu()">
            ☰
          </div>
        </div>
        <div class="mobile-menu" style="
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background-color: ${navConfig.backgroundColor};
          ${navConfig.showShadow ? 'box-shadow: 0 2px 4px rgba(0,0,0,0.1);' : ''}
          padding: 1rem 2rem;
        ">
          ${mobileMenuHTML}
        </div>
      </nav>
    `;
  }

  /**
   * Generate logo HTML based on configuration
   */
  private generateLogoHTML(navConfig: NavigationConfig): string {
    const logoSizeStyles = {
      small: 'height: 30px; font-size: 1.2rem;',
      normal: 'height: 40px; font-size: 1.5rem;',
      large: 'height: 60px; font-size: 2rem;'
    };

    const logoShapeStyles = {
      square: 'border-radius: 4px;',
      circle: 'border-radius: 50%;',
      rounded: 'border-radius: 8px;'
    };

    if (navConfig.logoType === 'image' && navConfig.logoImage) {
      return `
        <img 
          src="${this.sanitizeUrl(navConfig.logoImage)}" 
          alt="${this.sanitizeHtml(navConfig.logoText)}" 
          class="logo-image"
          style="
            ${logoSizeStyles[navConfig.logoSize] || logoSizeStyles.normal}
            ${logoShapeStyles[navConfig.logoShape] || logoShapeStyles.square}
            width: auto;
            object-fit: contain;
            cursor: pointer;
          "
          onclick="navigateToHome()"
        >
      `;
    } else {
      return `
        <span 
          class="logo-text" 
          style="
            color: ${navConfig.textColor};
            ${logoSizeStyles[navConfig.logoSize] || logoSizeStyles.normal}
            font-weight: bold;
            cursor: pointer;
            text-decoration: none;
            line-height: 1;
          "
          onclick="navigateToHome()"
        >
          ${this.sanitizeHtml(navConfig.logoText)}
        </span>
      `;
    }
  }

  /**
   * Generate navigation menu HTML
   */
  private generateNavigationMenuHTML(pages: ProcessedPage[]): string {
    const navigationPages = this.getNavigationPages(pages);
    
    return navigationPages.map(page => `
      <a 
        href="${this.sanitizeUrl(page.route)}" 
        class="nav-link ${page.isActive ? 'active' : ''}"
        data-page-id="${page.id}"
        style="
          color: ${page.isActive ? 'inherit' : 'inherit'};
          text-decoration: none;
          font-weight: ${page.isActive ? '700' : '500'};
          transition: opacity 0.2s ease;
          position: relative;
        "
        onmouseover="this.style.opacity='0.8'"
        onmouseout="this.style.opacity='1'"
        onclick="navigateToPage('${page.id}', '${page.route}')"
      >
        ${this.sanitizeHtml(page.name)}
        ${page.isActive ? `
          <span style="
            position: absolute;
            bottom: -5px;
            left: 0;
            right: 0;
            height: 2px;
            background-color: currentColor;
          "></span>
        ` : ''}
      </a>
    `).join('');
  }

  /**
   * Generate mobile menu HTML
   */
  private generateMobileMenuHTML(pages: ProcessedPage[]): string {
    const navigationPages = this.getNavigationPages(pages);
    
    return navigationPages.map(page => `
      <a 
        href="${this.sanitizeUrl(page.route)}" 
        class="mobile-nav-link ${page.isActive ? 'active' : ''}"
        data-page-id="${page.id}"
        style="
          display: block;
          padding: 0.75rem 0;
          color: inherit;
          text-decoration: none;
          font-weight: ${page.isActive ? '700' : '500'};
          border-bottom: 1px solid rgba(255,255,255,0.1);
        "
        onclick="navigateToPage('${page.id}', '${page.route}'); toggleMobileMenu();"
      >
        ${this.sanitizeHtml(page.name)}
      </a>
    `).join('');
  }

  /**
   * Generate navigation JavaScript
   */
  generateNavigationJS(): string {
    return `
      <script>
        let mobileMenuOpen = false;
        
        function toggleMobileMenu() {
          const mobileMenu = document.querySelector('.mobile-menu');
          const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
          
          if (mobileMenuOpen) {
            mobileMenu.style.display = 'none';
            mobileMenuToggle.innerHTML = '☰';
          } else {
            mobileMenu.style.display = 'block';
            mobileMenuToggle.innerHTML = '✕';
          }
          
          mobileMenuOpen = !mobileMenuOpen;
        }
        
        function navigateToHome() {
          const homeLink = document.querySelector('[data-page-id="home"]');
          if (homeLink) {
            homeLink.click();
          } else {
            window.location.href = '/';
          }
        }
        
        function navigateToPage(pageId, route) {
          // Update active state
          document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.classList.remove('active');
            link.style.fontWeight = '500';
            const activeIndicator = link.querySelector('span');
            if (activeIndicator) {
              activeIndicator.remove();
            }
          });
          
          // Set new active state
          const activeLinks = document.querySelectorAll('[data-page-id="' + pageId + '"]');
          activeLinks.forEach(link => {
            link.classList.add('active');
            link.style.fontWeight = '700';
            
            // Add active indicator for desktop
            if (link.classList.contains('nav-link')) {
              const indicator = document.createElement('span');
              indicator.style.cssText = 'position: absolute; bottom: -5px; left: 0; right: 0; height: 2px; background-color: currentColor;';
              link.appendChild(indicator);
            }
          });
          
          // Close mobile menu if open
          if (mobileMenuOpen) {
            toggleMobileMenu();
          }
        }
        
        // Responsive behavior
        function handleResize() {
          const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
          const desktopMenu = document.querySelector('.desktop-menu');
          const mobileMenu = document.querySelector('.mobile-menu');
          
          if (window.innerWidth > 768) {
            mobileMenuToggle.style.display = 'none';
            desktopMenu.style.display = 'flex';
            mobileMenu.style.display = 'none';
            mobileMenuOpen = false;
          } else {
            mobileMenuToggle.style.display = 'block';
            desktopMenu.style.display = 'none';
          }
        }
        
        // Initialize responsive behavior
        window.addEventListener('resize', handleResize);
        window.addEventListener('load', handleResize);
        
        // Handle page navigation
        document.addEventListener('DOMContentLoaded', function() {
          // Set active page based on current URL
          const currentPath = window.location.pathname;
          const matchingLink = document.querySelector('[href="' + currentPath + '"]');
          if (matchingLink) {
            const pageId = matchingLink.getAttribute('data-page-id');
            if (pageId) {
              navigateToPage(pageId, currentPath);
            }
          }
        });
      </script>
    `;
  }

  /**
   * Generate navigation CSS
   */
  generateNavigationCSS(): string {
    return `
      <style>
        .top-navigation {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .nav-container {
          position: relative;
        }
        
        .nav-link {
          position: relative;
          display: inline-block;
        }
        
        .nav-link:hover {
          opacity: 0.8;
        }
        
        .mobile-nav-link:hover {
          background-color: rgba(255,255,255,0.1);
        }
        
        .logo-image:hover,
        .logo-text:hover {
          opacity: 0.8;
        }
        
        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .top-navigation {
            padding: 0.75rem 1rem;
          }
          
          .nav-container {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .desktop-menu {
            display: none !important;
          }
          
          .mobile-menu-toggle {
            display: block !important;
            position: absolute;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
          }
          
          .mobile-menu {
            margin-top: 1rem;
          }
          
          .logo-image,
          .logo-text {
            font-size: 1.2rem !important;
            height: 30px !important;
          }
        }
        
        /* Tablet responsive styles */
        @media (max-width: 1024px) and (min-width: 769px) {
          .nav-container {
            padding: 0 1rem;
          }
          
          .desktop-menu {
            gap: 1.5rem;
          }
        }
        
        /* Animation for mobile menu */
        .mobile-menu {
          animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Focus styles for accessibility */
        .nav-link:focus,
        .mobile-nav-link:focus,
        .logo-image:focus,
        .logo-text:focus {
          outline: 2px solid #4A90E2;
          outline-offset: 2px;
        }
        
        /* Print styles */
        @media print {
          .top-navigation {
            display: none;
          }
        }
      </style>
    `;
  }

  /**
   * Get pages that should appear in navigation
   */
  private getNavigationPages(pages: ProcessedPage[]): ProcessedPage[] {
    return pages.filter(page => {
      // Always include home page
      if (page.id === 'home') return true;
      
      // Include other pages that are not marked as non-deletable system pages
      // (assuming non-deletable system pages might be special pages not meant for navigation)
      return page.isDeletable !== false;
    });
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
    // Basic URL sanitization
    if (url.startsWith('javascript:') || url.startsWith('data:') || url.startsWith('vbscript:')) {
      return '#';
    }
    return url;
  }

  /**
   * Generate breadcrumb navigation
   */
  generateBreadcrumb(currentPage: ProcessedPage, pages: ProcessedPage[]): string {
    const breadcrumbItems = [];
    
    // Add home if not current page
    if (currentPage.id !== 'home') {
      const homePage = pages.find(p => p.id === 'home');
      if (homePage) {
        breadcrumbItems.push({
          name: homePage.name,
          route: homePage.route,
          isActive: false
        });
      }
    }
    
    // Add current page
    breadcrumbItems.push({
      name: currentPage.name,
      route: currentPage.route,
      isActive: true
    });
    
    return `
      <nav class="breadcrumb" style="
        padding: 0.5rem 2rem;
        background-color: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
        font-size: 0.875rem;
      ">
        <ol style="
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        ">
          ${breadcrumbItems.map((item, index) => `
            <li style="display: flex; align-items: center;">
              ${index > 0 ? `
                <span style="margin: 0 0.5rem; color: #6c757d;">›</span>
              ` : ''}
              ${item.isActive ? `
                <span style="color: #495057; font-weight: 500;">
                  ${this.sanitizeHtml(item.name)}
                </span>
              ` : `
                <a 
                  href="${this.sanitizeUrl(item.route)}" 
                  style="
                    color: #007bff;
                    text-decoration: none;
                  "
                  onmouseover="this.style.textDecoration='underline'"
                  onmouseout="this.style.textDecoration='none'"
                >
                  ${this.sanitizeHtml(item.name)}
                </a>
              `}
            </li>
          `).join('')}
        </ol>
      </nav>
    `;
  }
} 