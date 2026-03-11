// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HomeButton } from '../src/HomeButton';
import { SceneModePicker, type SceneMode } from '../src/SceneModePicker';
import { ZoomControls } from '../src/ZoomControls';
import { NavigationHelp } from '../src/NavigationHelp';

// ---------------------------------------------------------------------------
// HomeButton
// ---------------------------------------------------------------------------

describe('HomeButton', () => {
  let parent: HTMLDivElement;

  beforeEach(() => {
    parent = document.createElement('div');
    document.body.appendChild(parent);
  });

  it('should append a button to the parent', () => {
    const btn = new HomeButton(parent);
    expect(parent.querySelector('.vellusion-home-button')).not.toBeNull();
    btn.destroy();
  });

  it('should invoke onClick callback when clicked', () => {
    const cb = vi.fn();
    const btn = new HomeButton(parent, cb);
    parent.querySelector('button')!.click();
    expect(cb).toHaveBeenCalledTimes(1);
    btn.destroy();
  });

  it('should allow changing onClick after construction', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const btn = new HomeButton(parent, cb1);
    btn.onClick = cb2;
    parent.querySelector('button')!.click();
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledTimes(1);
    btn.destroy();
  });

  it('destroy() should remove the element', () => {
    const btn = new HomeButton(parent);
    btn.destroy();
    expect(parent.querySelector('.vellusion-home-button')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SceneModePicker
// ---------------------------------------------------------------------------

describe('SceneModePicker', () => {
  let parent: HTMLDivElement;

  beforeEach(() => {
    parent = document.createElement('div');
    document.body.appendChild(parent);
  });

  it('currentMode defaults to 3D', () => {
    const picker = new SceneModePicker(parent);
    expect(picker.currentMode).toBe('3D');
    picker.destroy();
  });

  it('setMode changes mode', () => {
    const picker = new SceneModePicker(parent);
    picker.setMode('2D');
    expect(picker.currentMode).toBe('2D');
    picker.destroy();
  });

  it('setMode invokes onModeChange callback', () => {
    const cb = vi.fn();
    const picker = new SceneModePicker(parent, cb);
    picker.setMode('2.5D');
    expect(cb).toHaveBeenCalledWith('2.5D');
    picker.destroy();
  });

  it('creates three buttons for 3D, 2.5D, 2D', () => {
    const picker = new SceneModePicker(parent);
    const buttons = parent.querySelectorAll('button');
    expect(buttons.length).toBe(3);
    expect(buttons[0].textContent).toBe('3D');
    expect(buttons[1].textContent).toBe('2.5D');
    expect(buttons[2].textContent).toBe('2D');
    picker.destroy();
  });

  it('destroy() removes the element', () => {
    const picker = new SceneModePicker(parent);
    picker.destroy();
    expect(parent.querySelector('.vellusion-scene-mode-picker')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ZoomControls
// ---------------------------------------------------------------------------

describe('ZoomControls', () => {
  let parent: HTMLDivElement;

  beforeEach(() => {
    parent = document.createElement('div');
    document.body.appendChild(parent);
  });

  it('should create zoom in and zoom out buttons', () => {
    const controls = new ZoomControls(parent);
    const buttons = parent.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toBe('+');
    controls.destroy();
  });

  it('should invoke onZoomIn callback', () => {
    const onZoomIn = vi.fn();
    const controls = new ZoomControls(parent, { onZoomIn });
    parent.querySelectorAll('button')[0].click();
    expect(onZoomIn).toHaveBeenCalledTimes(1);
    controls.destroy();
  });

  it('should invoke onZoomOut callback', () => {
    const onZoomOut = vi.fn();
    const controls = new ZoomControls(parent, { onZoomOut });
    parent.querySelectorAll('button')[1].click();
    expect(onZoomOut).toHaveBeenCalledTimes(1);
    controls.destroy();
  });
});

// ---------------------------------------------------------------------------
// NavigationHelp
// ---------------------------------------------------------------------------

describe('NavigationHelp', () => {
  let parent: HTMLDivElement;

  beforeEach(() => {
    parent = document.createElement('div');
    document.body.appendChild(parent);
  });

  it('isVisible defaults to false', () => {
    const help = new NavigationHelp(parent);
    expect(help.isVisible).toBe(false);
    help.destroy();
  });

  it('show() sets isVisible to true', () => {
    const help = new NavigationHelp(parent);
    help.show();
    expect(help.isVisible).toBe(true);
    help.destroy();
  });

  it('hide() sets isVisible to false', () => {
    const help = new NavigationHelp(parent);
    help.show();
    help.hide();
    expect(help.isVisible).toBe(false);
    help.destroy();
  });

  it('toggle() flips visibility', () => {
    const help = new NavigationHelp(parent);
    help.toggle();
    expect(help.isVisible).toBe(true);
    help.toggle();
    expect(help.isVisible).toBe(false);
    help.destroy();
  });

  it('destroy() removes both elements', () => {
    const help = new NavigationHelp(parent);
    help.destroy();
    expect(parent.querySelector('.vellusion-nav-help-toggle')).toBeNull();
    expect(parent.querySelector('.vellusion-nav-help')).toBeNull();
  });
});
