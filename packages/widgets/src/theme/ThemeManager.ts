export type ThemeMode = 'dark' | 'light';

export class ThemeManager {
  private static _currentTheme: ThemeMode = 'dark';

  static get currentTheme(): ThemeMode {
    return ThemeManager._currentTheme;
  }

  static applyTheme(element: HTMLElement, theme: ThemeMode): void {
    ThemeManager._currentTheme = theme;
    element.setAttribute('data-vellusion-theme', theme);

    const vars =
      theme === 'dark' ? ThemeManager._darkVars() : ThemeManager._lightVars();
    for (const [key, value] of Object.entries(vars)) {
      element.style.setProperty(key, value);
    }
  }

  static setCustomProperty(
    element: HTMLElement,
    name: string,
    value: string,
  ): void {
    element.style.setProperty(name, value);
  }

  private static _darkVars(): Record<string, string> {
    return {
      '--vel-bg-primary': 'rgba(38, 38, 42, 0.95)',
      '--vel-bg-secondary': 'rgba(48, 48, 54, 0.9)',
      '--vel-text-primary': '#e0e0e0',
      '--vel-text-secondary': '#aaaaaa',
      '--vel-accent': '#6ec6ff',
      '--vel-border': 'rgba(255, 255, 255, 0.1)',
      '--vel-shadow': '0 4px 16px rgba(0, 0, 0, 0.3)',
      '--vel-hover': 'rgba(255, 255, 255, 0.1)',
    };
  }

  private static _lightVars(): Record<string, string> {
    return {
      '--vel-bg-primary': 'rgba(255, 255, 255, 0.95)',
      '--vel-bg-secondary': 'rgba(245, 245, 245, 0.9)',
      '--vel-text-primary': '#333333',
      '--vel-text-secondary': '#666666',
      '--vel-accent': '#1976d2',
      '--vel-border': 'rgba(0, 0, 0, 0.1)',
      '--vel-shadow': '0 4px 16px rgba(0, 0, 0, 0.1)',
      '--vel-hover': 'rgba(0, 0, 0, 0.05)',
    };
  }
}
