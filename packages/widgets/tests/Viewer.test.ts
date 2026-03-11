import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Widget } from '../src/Widget';
import { Viewer, type ViewerOptions } from '../src/Viewer';

// ---------------------------------------------------------------------------
// Minimal DOM mock helpers
// ---------------------------------------------------------------------------

function createMockElement(tag = 'div'): HTMLElement {
  const children: any[] = [];
  const style: Record<string, string> = {};
  return {
    tagName: tag.toUpperCase(),
    style,
    className: '',
    textContent: '',
    innerHTML: '',
    appendChild: vi.fn((child: any) => {
      children.push(child);
      return child;
    }),
    removeChild: vi.fn((child: any) => {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
      return child;
    }),
    remove: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    })),
    children,
  } as unknown as HTMLElement;
}

function createMockCanvas(): HTMLCanvasElement {
  const style: Record<string, string> = {};
  return {
    tagName: 'CANVAS',
    style,
    width: 0,
    height: 0,
  } as unknown as HTMLCanvasElement;
}

/** Stub `document.createElement` and `document.getElementById`. */
function stubDocument(container: HTMLElement) {
  const canvasMock = createMockCanvas();
  let createIndex = 0;
  const createdDivs: HTMLElement[] = [];

  vi.stubGlobal('document', {
    getElementById: vi.fn((_id: string) => container),
    createElement: vi.fn((tag: string) => {
      if (tag === 'canvas') return canvasMock;
      const el = createMockElement(tag);
      createdDivs.push(el);
      return el;
    }),
  });

  vi.stubGlobal('devicePixelRatio', 2);

  return { canvasMock, createdDivs };
}

// ---------------------------------------------------------------------------
// Widget tests
// ---------------------------------------------------------------------------

describe('Widget', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = createMockElement('div');
    vi.restoreAllMocks();
  });

  it('accepts an HTMLElement as container', () => {
    stubDocument(container);
    const widget = new Widget(container);

    expect(widget.container).toBe(container);
    expect(widget.canvas).toBeDefined();
    expect(container.appendChild).toHaveBeenCalled();
  });

  it('accepts a string id and looks up the element', () => {
    stubDocument(container);
    const widget = new Widget('my-container');

    expect((document.getElementById as any)).toHaveBeenCalledWith('my-container');
    expect(widget.container).toBe(container);
  });

  it('sets container style to relative + overflow hidden', () => {
    stubDocument(container);
    const widget = new Widget(container);

    expect(container.style.position).toBe('relative');
    expect(container.style.overflow).toBe('hidden');
  });

  it('creates a canvas with full-size styles', () => {
    const { canvasMock } = stubDocument(container);
    const widget = new Widget(container);

    expect(canvasMock.style.width).toBe('100%');
    expect(canvasMock.style.height).toBe('100%');
    expect(canvasMock.style.display).toBe('block');
  });

  it('isDestroyed is false initially', () => {
    stubDocument(container);
    const widget = new Widget(container);

    expect(widget.isDestroyed).toBe(false);
  });

  it('destroy sets isDestroyed and removes canvas', () => {
    stubDocument(container);
    const widget = new Widget(container);
    widget.destroy();

    expect(widget.isDestroyed).toBe(true);
    expect(container.removeChild).toHaveBeenCalledWith(widget.canvas);
  });

  it('resize scales canvas by devicePixelRatio', () => {
    const { canvasMock } = stubDocument(container);
    const widget = new Widget(container);
    widget.resize();

    // container mock returns 800x600, dpr = 2
    expect(canvasMock.width).toBe(1600);
    expect(canvasMock.height).toBe(1200);
  });
});

// ---------------------------------------------------------------------------
// Viewer tests
// ---------------------------------------------------------------------------

describe('Viewer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = createMockElement('div');
    vi.restoreAllMocks();
  });

  it('creates with all default components enabled', () => {
    stubDocument(container);
    const viewer = new Viewer({ container });

    expect(viewer.container).toBe(container);
    expect(viewer.canvas).toBeDefined();
    expect(viewer.infoBox).toBeDefined();
    expect(viewer.selectionIndicator).toBeDefined();
    expect(viewer.creditDisplay).toBeDefined();
    expect(viewer.isDestroyed).toBe(false);
  });

  it('accepts a string container id', () => {
    stubDocument(container);
    const viewer = new Viewer({ container: 'viewer-root' });

    expect((document.getElementById as any)).toHaveBeenCalledWith('viewer-root');
    expect(viewer.container).toBe(container);
  });

  it('can disable infoBox', () => {
    stubDocument(container);
    const viewer = new Viewer({ container, infoBox: false });

    expect(viewer.infoBox).toBeUndefined();
  });

  it('can disable selectionIndicator', () => {
    stubDocument(container);
    const viewer = new Viewer({ container, selectionIndicator: false });

    expect(viewer.selectionIndicator).toBeUndefined();
  });

  it('can disable creditDisplay', () => {
    stubDocument(container);
    const viewer = new Viewer({ container, creditDisplay: false });

    expect(viewer.creditDisplay).toBeUndefined();
  });

  it('creates a toolbar element', () => {
    stubDocument(container);
    const viewer = new Viewer({ container });

    expect(viewer.toolbar).toBeDefined();
    expect(viewer.toolbar.className).toBe('vellusion-toolbar');
  });

  it('resize delegates to underlying widget', () => {
    const { canvasMock } = stubDocument(container);
    const viewer = new Viewer({ container });
    viewer.resize();

    expect(canvasMock.width).toBe(1600);
    expect(canvasMock.height).toBe(1200);
  });

  it('destroy sets isDestroyed', () => {
    stubDocument(container);
    const viewer = new Viewer({ container });
    viewer.destroy();

    expect(viewer.isDestroyed).toBe(true);
  });

  it('destroy calls destroy on sub-components', () => {
    stubDocument(container);
    const viewer = new Viewer({ container });
    const infoDestroy = vi.spyOn(viewer.infoBox!, 'destroy');
    const selDestroy = vi.spyOn(viewer.selectionIndicator!, 'destroy');
    const credDestroy = vi.spyOn(viewer.creditDisplay!, 'destroy');

    viewer.destroy();

    expect(infoDestroy).toHaveBeenCalled();
    expect(selDestroy).toHaveBeenCalled();
    expect(credDestroy).toHaveBeenCalled();
  });
});
