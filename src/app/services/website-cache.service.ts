import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  RenderingCache, 
  ComponentInstance, 
  ProcessedPage,
  NavigationConfig,
  ComponentDefinition
} from '../models/WebsiteRendering';

@Injectable({
  providedIn: 'root'
})
export class WebsiteCacheService {
  private cache: RenderingCache = {
    renderedPages: new Map<string, string>(),
    componentHTML: new Map<string, string>(),
    pageComponents: new Map<string, ComponentInstance[]>()
  };

  private cacheHits = 0;
  private cacheMisses = 0;
  
  // Cache statistics subject
  private statsSubject = new BehaviorSubject<{hits: number, misses: number, hitRate: number}>({
    hits: 0,
    misses: 0,
    hitRate: 0
  });

  public cacheStats$ = this.statsSubject.asObservable();

  // ==================== PAGE CACHING ====================

  /**
   * Get cached rendered page HTML
   */
  getRenderedPage(pageId: string): string | null {
    const cached = this.cache.renderedPages.get(pageId);
    if (cached) {
      this.recordCacheHit();
      return cached;
    }
    this.recordCacheMiss();
    return null;
  }

  /**
   * Cache rendered page HTML
   */
  setRenderedPage(pageId: string, html: string): void {
    this.cache.renderedPages.set(pageId, html);
  }

  /**
   * Remove cached page
   */
  removeRenderedPage(pageId: string): void {
    this.cache.renderedPages.delete(pageId);
  }

  /**
   * Get all cached page IDs
   */
  getCachedPageIds(): string[] {
    return Array.from(this.cache.renderedPages.keys());
  }

  // ==================== COMPONENT CACHING ====================

  /**
   * Get cached component HTML
   */
  getComponentHTML(componentId: string): string | null {
    const cached = this.cache.componentHTML.get(componentId);
    if (cached) {
      this.recordCacheHit();
      return cached;
    }
    this.recordCacheMiss();
    return null;
  }

  /**
   * Cache component HTML
   */
  setComponentHTML(componentId: string, html: string): void {
    this.cache.componentHTML.set(componentId, html);
  }

  /**
   * Remove cached component
   */
  removeComponentHTML(componentId: string): void {
    this.cache.componentHTML.delete(componentId);
  }

  /**
   * Get cached component HTML by type pattern
   */
  getComponentsByType(componentType: string): Array<{id: string, html: string}> {
    const results: Array<{id: string, html: string}> = [];
    
    for (const [id, html] of this.cache.componentHTML.entries()) {
      if (id.includes(componentType)) {
        results.push({id, html});
      }
    }
    
    return results;
  }

  // ==================== PAGE COMPONENTS CACHING ====================

  /**
   * Get cached page components
   */
  getPageComponents(pageId: string): ComponentInstance[] | null {
    const cached = this.cache.pageComponents.get(pageId);
    if (cached) {
      this.recordCacheHit();
      return cached;
    }
    this.recordCacheMiss();
    return null;
  }

  /**
   * Cache page components
   */
  setPageComponents(pageId: string, components: ComponentInstance[]): void {
    this.cache.pageComponents.set(pageId, components);
  }

  /**
   * Remove cached page components
   */
  removePageComponents(pageId: string): void {
    this.cache.pageComponents.delete(pageId);
  }

  // ==================== CACHE INVALIDATION ====================

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.renderedPages.clear();
    this.cache.componentHTML.clear();
    this.cache.pageComponents.clear();
    this.resetStats();
  }

  /**
   * Clear page-specific cache
   */
  clearPageCache(pageId: string): void {
    this.removeRenderedPage(pageId);
    this.removePageComponents(pageId);
    
    // Remove components that belong to this page
    const componentsToRemove: string[] = [];
    for (const componentId of this.cache.componentHTML.keys()) {
      if (componentId.startsWith(`${pageId}_`)) {
        componentsToRemove.push(componentId);
      }
    }
    
    componentsToRemove.forEach(id => this.removeComponentHTML(id));
  }

  /**
   * Clear component-specific cache
   */
  clearComponentCache(componentType: string): void {
    const componentsToRemove: string[] = [];
    
    for (const componentId of this.cache.componentHTML.keys()) {
      if (componentId.includes(componentType)) {
        componentsToRemove.push(componentId);
      }
    }
    
    componentsToRemove.forEach(id => this.removeComponentHTML(id));
    
    // Clear any pages that might contain this component type
    this.cache.renderedPages.clear();
  }

  /**
   * Clear cache for specific website
   */
  clearWebsiteCache(workspaceId: string): void {
    // Remove all cached items that belong to this workspace
    const pagesToRemove: string[] = [];
    const componentsToRemove: string[] = [];
    
    for (const pageId of this.cache.renderedPages.keys()) {
      if (pageId.startsWith(`${workspaceId}_`)) {
        pagesToRemove.push(pageId);
      }
    }
    
    for (const componentId of this.cache.componentHTML.keys()) {
      if (componentId.startsWith(`${workspaceId}_`)) {
        componentsToRemove.push(componentId);
      }
    }
    
    pagesToRemove.forEach(id => this.removeRenderedPage(id));
    componentsToRemove.forEach(id => this.removeComponentHTML(id));
  }

  // ==================== CACHE WARMING ====================

  /**
   * Pre-cache common components
   */
  warmComponentCache(components: ComponentDefinition[]): void {
    // Pre-generate cache keys for common components
    const commonComponentTypes = ['text-block', 'button', 'image', 'footer'];
    
    components.forEach(component => {
      if (commonComponentTypes.includes(component.id)) {
        // Pre-create cache entry (placeholder)
        const cacheKey = `${component.id}_default`;
        if (!this.cache.componentHTML.has(cacheKey)) {
          this.cache.componentHTML.set(cacheKey, '<!-- cached placeholder -->');
        }
      }
    });
  }

  /**
   * Pre-cache page structure
   */
  warmPageCache(pages: ProcessedPage[]): void {
    pages.forEach(page => {
      // Pre-create cache entries for page components
      if (!this.cache.pageComponents.has(page.id)) {
        this.cache.pageComponents.set(page.id, page.components);
      }
    });
  }

  // ==================== CACHE OPTIMIZATION ====================

  /**
   * Optimize cache by removing least recently used items
   */
  optimizeCache(maxItems: number = 100): void {
    // Simple LRU implementation for pages
    if (this.cache.renderedPages.size > maxItems) {
      const entries = Array.from(this.cache.renderedPages.entries());
      const toRemove = entries.slice(0, entries.length - maxItems);
      
      toRemove.forEach(([pageId]) => {
        this.cache.renderedPages.delete(pageId);
      });
    }
    
    // Simple LRU implementation for components
    if (this.cache.componentHTML.size > maxItems * 2) {
      const entries = Array.from(this.cache.componentHTML.entries());
      const toRemove = entries.slice(0, entries.length - maxItems * 2);
      
      toRemove.forEach(([componentId]) => {
        this.cache.componentHTML.delete(componentId);
      });
    }
  }

  /**
   * Get cache size information
   */
  getCacheSize(): {
    renderedPages: number;
    componentHTML: number;
    pageComponents: number;
    total: number;
  } {
    return {
      renderedPages: this.cache.renderedPages.size,
      componentHTML: this.cache.componentHTML.size,
      pageComponents: this.cache.pageComponents.size,
      total: this.cache.renderedPages.size + this.cache.componentHTML.size + this.cache.pageComponents.size
    };
  }

  // ==================== CACHE STATISTICS ====================

  /**
   * Record cache hit
   */
  private recordCacheHit(): void {
    this.cacheHits++;
    this.updateStats();
  }

  /**
   * Record cache miss
   */
  private recordCacheMiss(): void {
    this.cacheMisses++;
    this.updateStats();
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;
    
    this.statsSubject.next({
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: Math.round(hitRate * 100) / 100
    });
  }

  /**
   * Reset cache statistics
   */
  private resetStats(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.updateStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): {hits: number, misses: number, hitRate: number} {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;
    
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  // ==================== CACHE DEBUGGING ====================

  /**
   * Get cache debug information
   */
  getDebugInfo(): any {
    return {
      cacheSize: this.getCacheSize(),
      statistics: this.getStats(),
      cachedPages: Array.from(this.cache.renderedPages.keys()),
      cachedComponents: Array.from(this.cache.componentHTML.keys()),
      pageComponentMappings: Array.from(this.cache.pageComponents.entries()).map(([pageId, components]) => ({
        pageId,
        componentCount: components.length
      }))
    };
  }
} 