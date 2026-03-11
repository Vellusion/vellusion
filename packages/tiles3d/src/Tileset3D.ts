import { Tile3D } from './Tile3D';
import { parseBoundingVolume } from './BoundingVolume';
import type { BoundingVolume } from './BoundingVolume';
import type { Mat4Type } from '@vellusion/math';
import { Mat4 } from '@vellusion/math';

export interface Tileset3DOptions {
  maximumScreenSpaceError?: number;
  show?: boolean;
}

export class Tileset3D {
  readonly url: string;
  readonly root: Tile3D;
  readonly asset: { version: string; tilesetVersion?: string };
  modelMatrix: Mat4Type;
  maximumScreenSpaceError: number;
  show: boolean;
  readonly ready: boolean = true;

  private constructor(
    url: string,
    root: Tile3D,
    asset: { version: string; tilesetVersion?: string },
    options?: Tileset3DOptions,
  ) {
    this.url = url;
    this.root = root;
    this.asset = asset;
    this.modelMatrix = Mat4.identity();
    this.maximumScreenSpaceError = options?.maximumScreenSpaceError ?? 16;
    this.show = options?.show ?? true;
  }

  /**
   * Parse tileset.json and construct tile tree.
   * For now: accepts the JSON directly (no fetch in tests).
   */
  static fromJson(url: string, json: any, options?: Tileset3DOptions): Tileset3D {
    const baseUrl = url.substring(0, url.lastIndexOf('/'));
    const root = Tileset3D._parseTile(json.root, null, baseUrl);
    return new Tileset3D(url, root, json.asset, options);
  }

  private static _parseTile(tileJson: any, parent: Tile3D | null, baseUrl: string): Tile3D {
    const bv = parseBoundingVolume(tileJson.boundingVolume);
    const tile = new Tile3D({
      parent,
      boundingVolume: bv,
      geometricError: tileJson.geometricError ?? 0,
      refine: tileJson.refine === 'ADD' ? 'ADD' : 'REPLACE',
      contentUri: tileJson.content?.uri ?? tileJson.content?.url,
      tilesetBaseUrl: baseUrl,
    });

    if (tileJson.children) {
      for (const childJson of tileJson.children) {
        const child = Tileset3D._parseTile(childJson, tile, baseUrl);
        tile.children.push(child);
      }
    }

    return tile;
  }

  get boundingSphere(): BoundingVolume {
    return this.root.boundingVolume;
  }

  /**
   * Total tile count in the tree.
   */
  get tileCount(): number {
    let count = 0;
    const stack = [this.root];
    while (stack.length > 0) {
      const t = stack.pop()!;
      count++;
      stack.push(...t.children);
    }
    return count;
  }
}
