import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'selected-theme';
  private themeSubject = new BehaviorSubject<ThemeMode>('light');
  
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Check localStorage first
    const savedTheme = localStorage.getItem(this.THEME_KEY) as ThemeMode;
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      this.setTheme(savedTheme);
    } else {
      // Check user's system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(systemPrefersDark ? 'dark' : 'light');
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a theme
      if (!localStorage.getItem(this.THEME_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  setTheme(theme: ThemeMode): void {
    this.themeSubject.next(theme);
    localStorage.setItem(this.THEME_KEY, theme);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update body class for compatibility
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
  }

  toggleTheme(): void {
    const currentTheme = this.themeSubject.value;
    const newTheme: ThemeMode = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  getCurrentTheme(): ThemeMode {
    return this.themeSubject.value;
  }

  isDarkMode(): boolean {
    return this.themeSubject.value === 'dark';
  }

  isLightMode(): boolean {
    return this.themeSubject.value === 'light';
  }
} 