import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from '../src/ScreenSpaceEventHandler';

// ---------------------------------------------------------------------------
// Mock canvas helper
// ---------------------------------------------------------------------------

function createMockCanvas() {
  const listeners: Record<string, Function[]> = {};
  return {
    addEventListener: vi.fn((event: string, handler: Function) => {
      (listeners[event] ??= []).push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: Function) => {
      const arr = listeners[event] ?? [];
      const idx = arr.indexOf(handler);
      if (idx !== -1) arr.splice(idx, 1);
    }),
    getBoundingClientRect: vi.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    })),
    /** Simulate a DOM event on the canvas. */
    fireEvent(type: string, props: any) {
      for (const handler of listeners[type] ?? []) handler(props);
    },
  } as unknown as HTMLCanvasElement & {
    fireEvent(type: string, props: any): void;
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ScreenSpaceEventHandler', () => {
  let canvas: ReturnType<typeof createMockCanvas>;
  let handler: ScreenSpaceEventHandler;

  beforeEach(() => {
    canvas = createMockCanvas();
    handler = new ScreenSpaceEventHandler(canvas);
  });

  // -----------------------------------------------------------------------
  // setInputAction / getInputAction / removeInputAction
  // -----------------------------------------------------------------------

  it('setInputAction stores callback retrievable via getInputAction', () => {
    const cb = vi.fn();
    handler.setInputAction(cb, ScreenSpaceEventType.LEFT_DOWN);

    expect(handler.getInputAction(ScreenSpaceEventType.LEFT_DOWN)).toBe(cb);
  });

  it('getInputAction returns undefined for unregistered type', () => {
    expect(handler.getInputAction(ScreenSpaceEventType.RIGHT_CLICK)).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // mousedown events
  // -----------------------------------------------------------------------

  it('LEFT_DOWN fires on mousedown button=0', () => {
    const cb = vi.fn();
    handler.setInputAction(cb, ScreenSpaceEventType.LEFT_DOWN);

    canvas.fireEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith({ x: 100, y: 200 });
  });

  it('RIGHT_DOWN fires on mousedown button=2', () => {
    const cb = vi.fn();
    handler.setInputAction(cb, ScreenSpaceEventType.RIGHT_DOWN);

    canvas.fireEvent('mousedown', { button: 2, clientX: 50, clientY: 75 });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith({ x: 50, y: 75 });
  });

  it('MIDDLE_DOWN fires on mousedown button=1', () => {
    const cb = vi.fn();
    handler.setInputAction(cb, ScreenSpaceEventType.MIDDLE_DOWN);

    canvas.fireEvent('mousedown', { button: 1, clientX: 10, clientY: 20 });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith({ x: 10, y: 20 });
  });

  // -----------------------------------------------------------------------
  // mouseup events
  // -----------------------------------------------------------------------

  it('LEFT_UP fires on mouseup button=0', () => {
    const cb = vi.fn();
    handler.setInputAction(cb, ScreenSpaceEventType.LEFT_UP);

    canvas.fireEvent('mouseup', { button: 0, clientX: 30, clientY: 40 });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith({ x: 30, y: 40 });
  });

  // -----------------------------------------------------------------------
  // MOUSE_MOVE
  // -----------------------------------------------------------------------

  it('MOUSE_MOVE provides startPosition and endPosition', () => {
    const cb = vi.fn();
    handler.setInputAction(cb, ScreenSpaceEventType.MOUSE_MOVE);

    canvas.fireEvent('mousemove', { clientX: 10, clientY: 20 });
    canvas.fireEvent('mousemove', { clientX: 30, clientY: 40 });

    expect(cb).toHaveBeenCalledTimes(2);

    // Second move should have startPosition from the first move's end.
    const secondCall = cb.mock.calls[1][0];
    expect(secondCall.startPosition).toEqual({ x: 10, y: 20 });
    expect(secondCall.endPosition).toEqual({ x: 30, y: 40 });
  });

  it('first MOUSE_MOVE uses (0,0) as startPosition', () => {
    const cb = vi.fn();
    handler.setInputAction(cb, ScreenSpaceEventType.MOUSE_MOVE);

    canvas.fireEvent('mousemove', { clientX: 5, clientY: 15 });

    const firstCall = cb.mock.calls[0][0];
    expect(firstCall.startPosition).toEqual({ x: 0, y: 0 });
    expect(firstCall.endPosition).toEqual({ x: 5, y: 15 });
  });

  // -----------------------------------------------------------------------
  // WHEEL
  // -----------------------------------------------------------------------

  it('WHEEL provides delta and position', () => {
    const cb = vi.fn();
    handler.setInputAction(cb, ScreenSpaceEventType.WHEEL);

    canvas.fireEvent('wheel', { deltaY: 120, clientX: 400, clientY: 300 });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith({ delta: 120, position: { x: 400, y: 300 } });
  });

  it('WHEEL forwards negative delta for scroll-up', () => {
    const cb = vi.fn();
    handler.setInputAction(cb, ScreenSpaceEventType.WHEEL);

    canvas.fireEvent('wheel', { deltaY: -100, clientX: 0, clientY: 0 });

    expect(cb.mock.calls[0][0].delta).toBe(-100);
  });

  // -----------------------------------------------------------------------
  // removeInputAction
  // -----------------------------------------------------------------------

  it('removeInputAction prevents callback from firing', () => {
    const cb = vi.fn();
    handler.setInputAction(cb, ScreenSpaceEventType.LEFT_DOWN);
    handler.removeInputAction(ScreenSpaceEventType.LEFT_DOWN);

    canvas.fireEvent('mousedown', { button: 0, clientX: 0, clientY: 0 });

    expect(cb).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // destroy
  // -----------------------------------------------------------------------

  it('destroy removes all DOM listeners', () => {
    handler.destroy();

    // removeEventListener should have been called for every listener added.
    const addCount = (canvas.addEventListener as ReturnType<typeof vi.fn>).mock.calls.length;
    const removeCount = (canvas.removeEventListener as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(removeCount).toBe(addCount);
    expect(addCount).toBeGreaterThan(0);
  });

  it('destroy clears all actions', () => {
    handler.setInputAction(vi.fn(), ScreenSpaceEventType.LEFT_DOWN);
    handler.destroy();

    expect(handler.getInputAction(ScreenSpaceEventType.LEFT_DOWN)).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // Click detection
  // -----------------------------------------------------------------------

  it('LEFT_CLICK fires when mouseup is within 5px of mousedown', () => {
    const cb = vi.fn();
    handler.setInputAction(cb, ScreenSpaceEventType.LEFT_CLICK);

    canvas.fireEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
    canvas.fireEvent('mouseup', { button: 0, clientX: 103, clientY: 204 }); // distance = 5

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith({ x: 103, y: 204 });
  });

  it('LEFT_CLICK does NOT fire when mouseup is beyond 5px', () => {
    const cb = vi.fn();
    handler.setInputAction(cb, ScreenSpaceEventType.LEFT_CLICK);

    canvas.fireEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
    canvas.fireEvent('mouseup', { button: 0, clientX: 110, clientY: 210 }); // distance > 5

    expect(cb).not.toHaveBeenCalled();
  });

  it('RIGHT_CLICK fires on right-button click within threshold', () => {
    const cb = vi.fn();
    handler.setInputAction(cb, ScreenSpaceEventType.RIGHT_CLICK);

    canvas.fireEvent('mousedown', { button: 2, clientX: 50, clientY: 50 });
    canvas.fireEvent('mouseup', { button: 2, clientX: 52, clientY: 51 });

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('MIDDLE_CLICK fires on middle-button click within threshold', () => {
    const cb = vi.fn();
    handler.setInputAction(cb, ScreenSpaceEventType.MIDDLE_CLICK);

    canvas.fireEvent('mousedown', { button: 1, clientX: 200, clientY: 300 });
    canvas.fireEvent('mouseup', { button: 1, clientX: 200, clientY: 300 });

    expect(cb).toHaveBeenCalledTimes(1);
  });

  // -----------------------------------------------------------------------
  // contextmenu
  // -----------------------------------------------------------------------

  it('contextmenu default is prevented', () => {
    const preventDefault = vi.fn();
    canvas.fireEvent('contextmenu', { preventDefault });

    expect(preventDefault).toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Canvas offset
  // -----------------------------------------------------------------------

  it('positions are relative to canvas bounding rect', () => {
    (canvas.getBoundingClientRect as ReturnType<typeof vi.fn>).mockReturnValue({
      left: 50,
      top: 100,
      width: 800,
      height: 600,
    });

    const cb = vi.fn();
    handler.setInputAction(cb, ScreenSpaceEventType.LEFT_DOWN);

    canvas.fireEvent('mousedown', { button: 0, clientX: 150, clientY: 300 });

    expect(cb).toHaveBeenCalledWith({ x: 100, y: 200 });
  });
});
