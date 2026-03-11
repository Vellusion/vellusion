// PNTS (Point Cloud) format:
// Header (28 bytes): magic 'pnts', version, byteLength, ftJSON, ftBin, btJSON, btBin

import type { Tile3DContent, Tile3DFeature } from '../Tile3DContent';

export interface PntsContent extends Tile3DContent {
  readonly type: 'pnts';
  readonly pointCount: number;
  readonly positions: Float32Array;
  readonly colors: Uint8Array | null; // RGB per point
  readonly normals: Float32Array | null;
}

export class PntsLoader {
  static readonly MAGIC = 0x73746e70; // 'pnts'
  static readonly HEADER_SIZE = 28;

  static parse(data: ArrayBuffer): PntsContent {
    const view = new DataView(data);
    const magic = view.getUint32(0, true);
    if (magic !== PntsLoader.MAGIC) {
      throw new Error(`Invalid pnts magic: 0x${magic.toString(16)}`);
    }
    const byteLength = view.getUint32(8, true);
    const ftJSONLen = view.getUint32(12, true);
    const ftBinLen = view.getUint32(16, true);

    let offset = PntsLoader.HEADER_SIZE;

    const ftJSON =
      ftJSONLen > 0
        ? JSON.parse(
            new TextDecoder().decode(new Uint8Array(data, offset, ftJSONLen)).replace(/\0+$/, ''),
          )
        : {};
    offset += ftJSONLen;

    const ftBinStart = offset;
    offset += ftBinLen;

    const pointCount = ftJSON.POINTS_LENGTH ?? 0;

    // Extract positions
    let positions = new Float32Array(0);
    if (ftBinLen > 0 && ftJSON.POSITION) {
      const posOffset = ftBinStart + (ftJSON.POSITION.byteOffset ?? 0);
      const posCopy = new Float32Array(pointCount * 3);
      const srcView = new Float32Array(data, posOffset, pointCount * 3);
      posCopy.set(srcView);
      positions = posCopy;
    }

    // Extract colors (RGB, 3 bytes per point)
    let colors: Uint8Array | null = null;
    if (ftBinLen > 0 && ftJSON.RGB) {
      const colorOffset = ftBinStart + (ftJSON.RGB.byteOffset ?? 0);
      colors = new Uint8Array(data, colorOffset, pointCount * 3);
    }

    // Extract normals
    let normals: Float32Array | null = null;
    if (ftBinLen > 0 && ftJSON.NORMAL) {
      const normOffset = ftBinStart + (ftJSON.NORMAL.byteOffset ?? 0);
      normals = new Float32Array(data, normOffset, pointCount * 3);
    }

    return {
      type: 'pnts',
      pointCount,
      positions,
      colors,
      normals,
      featureCount: pointCount,
      byteLength,
      getFeature(index: number): Tile3DFeature {
        return {
          featureId: index,
          getProperty: () => undefined,
          setProperty: () => {},
          color: new Float32Array([1, 1, 1, 1]),
          show: true,
        };
      },
    };
  }
}
