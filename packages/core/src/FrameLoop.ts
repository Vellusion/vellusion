/**
 * Per-frame timing statistics.
 */
export interface FrameStats {
  /** Frames per second (exponentially smoothed). */
  fps: number;
  /** Time for the last frame in milliseconds. */
  frameTime: number;
  /** Total number of frames rendered. */
  frameCount: number;
}

/**
 * A simple `requestAnimationFrame`-based frame loop.
 *
 * - Calls the provided callback each frame with `deltaTime` in **seconds**.
 * - Maintains smoothed FPS: `0.9 * old + 0.1 * current`.
 * - Exposes a `stats` object with live timing information.
 */
export class FrameLoop {
  readonly stats: FrameStats = {
    fps: 0,
    frameTime: 0,
    frameCount: 0,
  };

  private _running = false;
  private _rafId = 0;
  private _lastTimestamp = 0;
  private _firstFrame = true;

  constructor(private callback: (deltaTime: number) => void) {}

  /** Start the frame loop. Has no effect if already running. */
  start(): void {
    if (this._running) return;
    this._running = true;
    this._firstFrame = true;
    this._rafId = requestAnimationFrame(this._tick);
  }

  /** Stop the frame loop. Has no effect if not running. */
  stop(): void {
    if (!this._running) return;
    this._running = false;
    cancelAnimationFrame(this._rafId);
  }

  /** Whether the loop is currently running. */
  get running(): boolean {
    return this._running;
  }

  /** Internal tick bound as an arrow function so it retains `this`. */
  private _tick = (timestamp: number): void => {
    if (!this._running) return;

    if (this._firstFrame) {
      // First frame — no delta yet, just record the timestamp.
      this._firstFrame = false;
      this._lastTimestamp = timestamp;
      this._rafId = requestAnimationFrame(this._tick);
      return;
    }

    const deltaMs = timestamp - this._lastTimestamp;
    this._lastTimestamp = timestamp;

    const deltaTime = deltaMs / 1000; // seconds

    // Update stats
    this.stats.frameTime = deltaMs;
    this.stats.frameCount++;

    const currentFps = deltaMs > 0 ? 1000 / deltaMs : 0;
    this.stats.fps = this.stats.fps === 0
      ? currentFps
      : 0.9 * this.stats.fps + 0.1 * currentFps;

    this.callback(deltaTime);

    this._rafId = requestAnimationFrame(this._tick);
  };
}
