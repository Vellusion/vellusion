import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FrameLoop } from '../src/FrameLoop';

// ---------------------------------------------------------------------------
// rAF stub helpers
// ---------------------------------------------------------------------------

let rafCallbacks: Map<number, FrameRequestCallback>;
let nextRafId: number;

function installRafStub() {
  rafCallbacks = new Map();
  nextRafId = 1;

  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
    const id = nextRafId++;
    rafCallbacks.set(id, cb);
    return id;
  }));

  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => {
    rafCallbacks.delete(id);
  }));
}

/** Simulate a rAF tick at the given timestamp. Fires only the most recent callback. */
function fireRaf(timestamp: number) {
  // Get the last registered callback (highest id)
  const entries = [...rafCallbacks.entries()];
  if (entries.length === 0) return;
  const [id, cb] = entries[entries.length - 1];
  rafCallbacks.delete(id);
  cb(timestamp);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FrameLoop', () => {
  beforeEach(() => {
    installRafStub();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // start / stop / running
  // -------------------------------------------------------------------------

  it('start() should call requestAnimationFrame', () => {
    const loop = new FrameLoop(vi.fn());
    loop.start();

    expect(requestAnimationFrame).toHaveBeenCalled();
    expect(loop.running).toBe(true);

    loop.stop();
  });

  it('stop() should call cancelAnimationFrame and set running to false', () => {
    const loop = new FrameLoop(vi.fn());
    loop.start();
    loop.stop();

    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(loop.running).toBe(false);
  });

  it('running should be false before start', () => {
    const loop = new FrameLoop(vi.fn());
    expect(loop.running).toBe(false);
  });

  it('start() should be a no-op if already running', () => {
    const loop = new FrameLoop(vi.fn());
    loop.start();
    loop.start(); // second call

    // requestAnimationFrame called only once from start()
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    loop.stop();
  });

  it('stop() should be a no-op if not running', () => {
    const loop = new FrameLoop(vi.fn());
    loop.stop(); // should not throw

    expect(cancelAnimationFrame).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Callback and deltaTime
  // -------------------------------------------------------------------------

  it('should not invoke callback on the first frame (no delta yet)', () => {
    const cb = vi.fn();
    const loop = new FrameLoop(cb);
    loop.start();

    fireRaf(1000); // first tick — no delta

    expect(cb).not.toHaveBeenCalled();

    loop.stop();
  });

  it('should invoke callback with deltaTime in seconds on subsequent frames', () => {
    const cb = vi.fn();
    const loop = new FrameLoop(cb);
    loop.start();

    fireRaf(1000); // first frame (baseline)
    fireRaf(1016); // second frame: 16 ms delta

    expect(cb).toHaveBeenCalledTimes(1);
    const delta = cb.mock.calls[0][0] as number;
    expect(delta).toBeCloseTo(0.016, 5);

    loop.stop();
  });

  it('should accumulate multiple frames with correct deltas', () => {
    const cb = vi.fn();
    const loop = new FrameLoop(cb);
    loop.start();

    fireRaf(0);     // baseline
    fireRaf(16);    // delta = 16 ms
    fireRaf(33);    // delta = 17 ms
    fireRaf(50);    // delta = 17 ms

    expect(cb).toHaveBeenCalledTimes(3);
    expect((cb.mock.calls[0][0] as number)).toBeCloseTo(0.016, 5);
    expect((cb.mock.calls[1][0] as number)).toBeCloseTo(0.017, 5);
    expect((cb.mock.calls[2][0] as number)).toBeCloseTo(0.017, 5);

    loop.stop();
  });

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  it('should update frameCount on each frame', () => {
    const loop = new FrameLoop(vi.fn());
    loop.start();

    fireRaf(0);
    fireRaf(16);
    fireRaf(32);

    expect(loop.stats.frameCount).toBe(2);

    loop.stop();
  });

  it('should update frameTime in milliseconds', () => {
    const loop = new FrameLoop(vi.fn());
    loop.start();

    fireRaf(0);
    fireRaf(16);

    expect(loop.stats.frameTime).toBe(16);

    loop.stop();
  });

  it('should compute smoothed fps (0.9 * old + 0.1 * current)', () => {
    const loop = new FrameLoop(vi.fn());
    loop.start();

    fireRaf(0);
    // First real frame: 16.666ms => ~60fps
    // When stats.fps is 0, the first value is set directly (no smoothing)
    fireRaf(16.666);

    const firstFps = 1000 / 16.666;
    expect(loop.stats.fps).toBeCloseTo(firstFps, 1);

    // Second frame: 20ms => 50fps
    fireRaf(36.666);
    const secondCurrentFps = 1000 / 20;
    const expectedSmoothed = 0.9 * firstFps + 0.1 * secondCurrentFps;
    expect(loop.stats.fps).toBeCloseTo(expectedSmoothed, 1);

    loop.stop();
  });

  it('should re-register requestAnimationFrame after each tick', () => {
    const loop = new FrameLoop(vi.fn());
    loop.start();

    // start() registers once
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    fireRaf(0);
    // After first tick, a new rAF is registered
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);

    fireRaf(16);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(3);

    loop.stop();
  });
});
