// I3DM (Instanced 3D Model) format:
// Header (32 bytes):
//   magic: 'i3dm' (4 bytes)
//   version: uint32
//   byteLength: uint32
//   featureTableJSONByteLength: uint32
//   featureTableBinaryByteLength: uint32
//   batchTableJSONByteLength: uint32
//   batchTableBinaryByteLength: uint32
//   gltfFormat: uint32 (0 = URI, 1 = embedded GLB)

import type { Tile3DContent, Tile3DFeature } from '../Tile3DContent';

export interface I3dmContent extends Tile3DContent {
  readonly type: 'i3dm';
  readonly instanceCount: number;
  readonly positions: Float32Array;
  readonly glbData: ArrayBuffer | null;
  readonly glbUri: string | null;
}

export class I3dmLoader {
  static readonly MAGIC = 0x6d643369; // 'i3dm'
  static readonly HEADER_SIZE = 32;

  static parse(data: ArrayBuffer): I3dmContent {
    const view = new DataView(data);
    const magic = view.getUint32(0, true);
    if (magic !== I3dmLoader.MAGIC) {
      throw new Error(`Invalid i3dm magic: 0x${magic.toString(16)}`);
    }
    const byteLength = view.getUint32(8, true);
    const ftJSONLen = view.getUint32(12, true);
    const ftBinLen = view.getUint32(16, true);
    const btJSONLen = view.getUint32(20, true);
    const btBinLen = view.getUint32(24, true);
    const gltfFormat = view.getUint32(28, true);

    let offset = I3dmLoader.HEADER_SIZE;

    const ftJSON =
      ftJSONLen > 0
        ? JSON.parse(
            new TextDecoder().decode(new Uint8Array(data, offset, ftJSONLen)).replace(/\0+$/, ''),
          )
        : {};
    offset += ftJSONLen;

    const ftBin = ftBinLen > 0 ? data.slice(offset, offset + ftBinLen) : null;
    offset += ftBinLen;

    const btJSON =
      btJSONLen > 0
        ? JSON.parse(
            new TextDecoder().decode(new Uint8Array(data, offset, btJSONLen)).replace(/\0+$/, ''),
          )
        : {};
    offset += btJSONLen + btBinLen;

    const instanceCount = ftJSON.INSTANCES_LENGTH ?? 0;

    // Extract positions from feature table binary
    let positions = new Float32Array(0);
    if (ftBin && ftJSON.POSITION) {
      const posOffset = ftJSON.POSITION.byteOffset ?? 0;
      positions = new Float32Array(ftBin, posOffset, instanceCount * 3);
    }

    let glbData: ArrayBuffer | null = null;
    let glbUri: string | null = null;
    if (gltfFormat === 1) {
      glbData = data.slice(offset);
    } else {
      glbUri = new TextDecoder()
        .decode(new Uint8Array(data, offset))
        .replace(/\0+$/, '');
    }

    return {
      type: 'i3dm',
      instanceCount,
      positions,
      glbData,
      glbUri,
      featureCount: instanceCount,
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
