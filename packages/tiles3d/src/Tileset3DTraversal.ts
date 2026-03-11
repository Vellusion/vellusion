import { Tile3D, Tile3DState } from './Tile3D';
import type { Vec3Type } from '@vellusion/math';

export interface TraversalResult {
  /** Tiles to render this frame */
  tilesToRender: Tile3D[];
  /** Tiles that need to be loaded */
  tilesToLoad: Tile3D[];
  /** Total tiles visited during traversal */
  tilesVisited: number;
}

export class Tileset3DTraversal {
  /**
   * Select tiles for rendering based on SSE threshold.
   * Uses a top-down traversal:
   * 1. Start at root
   * 2. Compute SSE for each tile
   * 3. If SSE > maxSSE and tile has children -> refine (visit children)
   * 4. If SSE <= maxSSE or leaf tile -> render this tile
   * 5. If tile has content that isn't loaded -> add to load queue
   */
  static selectTiles(
    root: Tile3D,
    cameraPosition: Vec3Type,
    screenHeight: number,
    fov: number,
    maxSSE: number,
  ): TraversalResult {
    const tilesToRender: Tile3D[] = [];
    const tilesToLoad: Tile3D[] = [];
    let tilesVisited = 0;

    const stack: Tile3D[] = [root];

    while (stack.length > 0) {
      const tile = stack.pop()!;
      tilesVisited++;

      const sse = tile.computeScreenSpaceError(cameraPosition, screenHeight, fov);

      // Should we refine (go deeper)?
      const shouldRefine = sse > maxSSE && tile.hasChildren;

      if (shouldRefine) {
        if (tile.refine === 'ADD') {
          // ADD refinement: render parent AND children
          if (tile.hasContent) {
            if (tile.state === Tile3DState.READY) {
              tilesToRender.push(tile);
            } else if (tile.state === Tile3DState.UNLOADED) {
              tilesToLoad.push(tile);
            }
          }
        }
        // Visit children
        for (const child of tile.children) {
          stack.push(child);
        }
      } else {
        // Render this tile
        if (tile.hasContent) {
          if (tile.state === Tile3DState.READY) {
            tilesToRender.push(tile);
          } else if (tile.state === Tile3DState.UNLOADED) {
            tilesToLoad.push(tile);
            // Fallback: render parent if available and ready
            this._addFallbackAncestor(tile, tilesToRender);
          }
        }
      }
    }

    return { tilesToRender, tilesToLoad, tilesVisited };
  }

  /**
   * Find nearest ancestor with loaded content as a fallback.
   */
  private static _addFallbackAncestor(tile: Tile3D, tilesToRender: Tile3D[]): void {
    let ancestor = tile.parent;
    while (ancestor) {
      if (ancestor.state === Tile3DState.READY && ancestor.hasContent) {
        if (!tilesToRender.includes(ancestor)) {
          tilesToRender.push(ancestor);
        }
        return;
      }
      ancestor = ancestor.parent;
    }
  }
}
