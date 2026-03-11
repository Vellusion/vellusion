import type { BoundingVolume } from './BoundingVolume';
import type { Vec3Type } from '@vellusion/math';
import { distanceToBoundingVolume } from './BoundingVolume';

export enum Tile3DState {
  UNLOADED = 0,
  LOADING = 1,
  LOADED = 2,
  READY = 3,
  FAILED = 4,
}

export class Tile3D {
  readonly parent: Tile3D | null;
  readonly children: Tile3D[] = [];
  readonly boundingVolume: BoundingVolume;
  readonly geometricError: number;
  readonly refine: 'ADD' | 'REPLACE';
  readonly contentUri: string | undefined;
  readonly depth: number;

  content: any | null = null;  // Tile3DContent after loading
  state: Tile3DState = Tile3DState.UNLOADED;
  lastVisitedFrame: number = -1;
  priority: number = 0;

  // Back-reference to tileset for base URL resolution
  private _tilesetBaseUrl: string;

  constructor(options: {
    parent: Tile3D | null;
    boundingVolume: BoundingVolume;
    geometricError: number;
    refine?: 'ADD' | 'REPLACE';
    contentUri?: string;
    tilesetBaseUrl: string;
  }) {
    this.parent = options.parent;
    this.boundingVolume = options.boundingVolume;
    this.geometricError = options.geometricError;
    this.refine = options.refine ?? (options.parent?.refine ?? 'REPLACE');
    this.contentUri = options.contentUri;
    this.depth = options.parent ? options.parent.depth + 1 : 0;
    this._tilesetBaseUrl = options.tilesetBaseUrl;
  }

  get contentUrl(): string | undefined {
    if (!this.contentUri) return undefined;
    if (this.contentUri.startsWith('http')) return this.contentUri;
    return this._tilesetBaseUrl + '/' + this.contentUri;
  }

  get hasContent(): boolean {
    return this.contentUri !== undefined;
  }

  get hasChildren(): boolean {
    return this.children.length > 0;
  }

  /**
   * Compute screen space error for this tile from given camera.
   */
  computeScreenSpaceError(cameraPosition: Vec3Type, screenHeight: number, fov: number): number {
    const distance = distanceToBoundingVolume(this.boundingVolume, cameraPosition);
    if (distance === 0) return Infinity;
    const sseDenominator = 2 * Math.tan(fov / 2);
    return (this.geometricError * screenHeight) / (distance * sseDenominator);
  }

  computeDistanceToCamera(cameraPosition: Vec3Type): number {
    return distanceToBoundingVolume(this.boundingVolume, cameraPosition);
  }
}
