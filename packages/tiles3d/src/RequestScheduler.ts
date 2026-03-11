import { Tile3D, Tile3DState } from './Tile3D';

export class RequestScheduler {
  maxConcurrency: number;
  private _queue: { tile: Tile3D; priority: number }[] = [];
  private _activeRequests: number = 0;

  constructor(maxConcurrency: number = 6) {
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Add tile to load queue with priority (lower = higher priority).
   */
  enqueue(tile: Tile3D, priority: number): void {
    // Don't re-add if already loading or loaded
    if (tile.state !== Tile3DState.UNLOADED) return;
    // Don't duplicate
    if (this._queue.some(q => q.tile === tile)) return;

    tile.state = Tile3DState.LOADING;
    this._queue.push({ tile, priority });
    // Sort by priority (ascending = higher priority first)
    this._queue.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Process queued requests up to concurrency limit.
   * Returns tiles that started loading.
   */
  processQueue(): Tile3D[] {
    const started: Tile3D[] = [];
    while (this._activeRequests < this.maxConcurrency && this._queue.length > 0) {
      const item = this._queue.shift()!;
      this._activeRequests++;
      started.push(item.tile);
    }
    return started;
  }

  /**
   * Mark a tile request as completed.
   */
  requestCompleted(_tile: Tile3D): void {
    this._activeRequests = Math.max(0, this._activeRequests - 1);
  }

  /**
   * Cancel a pending request.
   */
  cancel(tile: Tile3D): void {
    const idx = this._queue.findIndex(q => q.tile === tile);
    if (idx !== -1) {
      this._queue.splice(idx, 1);
      tile.state = Tile3DState.UNLOADED;
    }
  }

  get pendingCount(): number {
    return this._queue.length;
  }

  get activeCount(): number {
    return this._activeRequests;
  }

  clear(): void {
    for (const q of this._queue) {
      q.tile.state = Tile3DState.UNLOADED;
    }
    this._queue.length = 0;
    this._activeRequests = 0;
  }
}
