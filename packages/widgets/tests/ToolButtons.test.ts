// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
  PerformanceDisplay,
  FullscreenButton,
  VRButton,
} from '@vellusion/widgets';
import { ThemeManager } from '@vellusion/widgets';

// ─── PerformanceDisplay ─────────────────────────────────────────────────
describe('PerformanceDisplay', () => {
  function makeParent(): HTMLElement {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
  }

  it('update calculates FPS from dt', () => {
    const perf = new PerformanceDisplay(makeParent());
    // 60 fps → dt = 1/60 ≈ 0.01667
    perf.update(1 / 60);
    expect(perf.fps).toBeCloseTo(60, 0);
    perf.destroy();
  });

  it('frameTime averaging works', () => {
    const perf = new PerformanceDisplay(makeParent());
    perf.update(0.01);
    perf.update(0.02);
    // avg = 0.015
    expect(perf.frameTime).toBeCloseTo(0.015, 6);
    perf.destroy();
  });
});

// ─── ThemeManager ───────────────────────────────────────────────────────
describe('ThemeManager', () => {
  function makeEl(): HTMLElement {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
  }

  it('applyTheme sets data-vellusion-theme attribute', () => {
    const el = makeEl();
    ThemeManager.applyTheme(el, 'dark');
    expect(el.getAttribute('data-vellusion-theme')).toBe('dark');
    ThemeManager.applyTheme(el, 'light');
    expect(el.getAttribute('data-vellusion-theme')).toBe('light');
  });

  it('currentTheme updates after applyTheme', () => {
    const el = makeEl();
    ThemeManager.applyTheme(el, 'light');
    expect(ThemeManager.currentTheme).toBe('light');
    ThemeManager.applyTheme(el, 'dark');
    expect(ThemeManager.currentTheme).toBe('dark');
  });

  it('dark theme sets correct CSS variables', () => {
    const el = makeEl();
    ThemeManager.applyTheme(el, 'dark');
    expect(el.style.getPropertyValue('--vel-accent')).toBe('#6ec6ff');
    expect(el.style.getPropertyValue('--vel-text-primary')).toBe('#e0e0e0');
  });

  it('light theme sets correct CSS variables', () => {
    const el = makeEl();
    ThemeManager.applyTheme(el, 'light');
    expect(el.style.getPropertyValue('--vel-accent')).toBe('#1976d2');
    expect(el.style.getPropertyValue('--vel-text-primary')).toBe('#333333');
  });

  it('setCustomProperty sets arbitrary property', () => {
    const el = makeEl();
    ThemeManager.setCustomProperty(el, '--vel-custom', 'red');
    expect(el.style.getPropertyValue('--vel-custom')).toBe('red');
  });
});

// ─── FullscreenButton ───────────────────────────────────────────────────
describe('FullscreenButton', () => {
  it('isFullscreen defaults to false', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const btn = new FullscreenButton(parent);
    expect(btn.isFullscreen).toBe(false);
    btn.destroy();
  });
});

// ─── VRButton ───────────────────────────────────────────────────────────
describe('VRButton', () => {
  it('default not supported in test environment', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const btn = new VRButton(parent);
    // jsdom does not have navigator.xr, so not supported
    expect(btn.isSupported).toBe(false);
    btn.destroy();
  });
});
