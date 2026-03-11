import { Tile3D, Tile3DState } from './Tile3D';

export class TileCache {
  maximumMemoryUsage: number; // bytes
  private _entries: { tile: Tile3D; size: number; lastAccessed: number }[] = [];
  private _currentMemoryUsage: number = 0;
  private _frame: number = 0;

  constructor(maximumMemoryUsage: number = 512 * 1024 * 1024) { // 512 MB default
    this.maximumMemoryUsage = maximumMemoryUsage;
  }

  get currentMemoryUsage(): number {
    return this._currentMemoryUsage;
  }

  get entryCount(): number {
    return this._entries.length;
  }

  /**
   * Add a loaded tile to the cache.
   */
  add(tile: Tile3D, size: number): void {
    this._frame++;
    // Check if already cached
    const existing = this._entries.find(e => e.tile === tile);
    if (existing) {
      existing.lastAccessed = this._frame;
      return;
    }
    this._entries.push({ tile, size, lastAccessed: this._frame });
    this._currentMemoryUsage += size;
  }

  /**
   * Mark tile as recently used (touch).
   */
  touch(tile: Tile3D): void {
    this._frame++;
    const entry = this._entries.find(e => e.tile === tile);
    if (entry) {
      entry.lastAccessed = this._frame;
    }
  }

  /**
   * Evict tiles to fit within memory budget.
   * Returns evicted tiles.
   */
  trimToFit(): Tile3D[] {
    const evicted: Tile3D[] = [];
    if (this._currentMemoryUsage <= this.maximumMemoryUsage) return evicted;

    // Sort by last accessed (oldest first)
    this._entries.sort((a, b) => a.lastAccessed - b.lastAccessed);

    while (this._currentMemoryUsage > this.maximumMemoryUsage && this._entries.length > 0) {
      const entry = this._entries.shift()!;
      this._currentMemoryUsage -= entry.size;
      entry.tile.state = Tile3DState.UNLOADED;
      entry.tile.content = null;
      evicted.push(entry.tile);
    }

    return evicted;
  }

  /**
   * Remove a specific tile from cache.
   */
  remove(tile: Tile3D): boolean {
    const idx = this._entries.findIndex(e => e.tile === tile);
    if (idx === -1) return false;
    this._currentMemoryUsage -= this._entries[idx].size;
    this._entries.splice(idx, 1);
    return true;
  }

  clear(): void {
    for (const entry of this._entries) {
      entry.tile.state = Tile3DState.UNLOADED;
      entry.tile.content = null;
    }
    this._entries.length = 0;
    this._currentMemoryUsage = 0;
  }
}
