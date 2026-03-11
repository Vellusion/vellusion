// B3DM (Batched 3D Model) format:
// Header (28 bytes):
//   magic: 'b3dm' (4 bytes)
//   version: uint32 (4 bytes) = 1
//   byteLength: uint32 (4 bytes) = total file size
//   featureTableJSONByteLength: uint32 (4 bytes)
//   featureTableBinaryByteLength: uint32 (4 bytes)
//   batchTableJSONByteLength: uint32 (4 bytes)
//   batchTableBinaryByteLength: uint32 (4 bytes)
// Body:
//   featureTableJSON
//   featureTableBinary
//   batchTableJSON
//   batchTableBinary
//   glb (rest of data)

import type { Tile3DContent, Tile3DFeature } from '../Tile3DContent';

export interface B3dmContent extends Tile3DContent {
  readonly type: 'b3dm';
  readonly glbData: ArrayBuffer;
  readonly featureTableJson: any;
  readonly batchTableJson: any;
  readonly batchLength: number;
}

export class B3dmLoader {
  static readonly MAGIC = 0x6d643362; // 'b3dm' in little-endian
  static readonly HEADER_SIZE = 28;

  static parse(data: ArrayBuffer): B3dmContent {
    const view = new DataView(data);
    const magic = view.getUint32(0, true);
    if (magic !== B3dmLoader.MAGIC) {
      throw new Error(`Invalid b3dm magic: 0x${magic.toString(16)}`);
    }
    const version = view.getUint32(4, true);
    const byteLength = view.getUint32(8, true);
    const ftJSONLen = view.getUint32(12, true);
    const ftBinLen = view.getUint32(16, true);
    const btJSONLen = view.getUint32(20, true);
    const btBinLen = view.getUint32(24, true);

    let offset = B3dmLoader.HEADER_SIZE;

    const ftJSON =
      ftJSONLen > 0
        ? JSON.parse(
            new TextDecoder().decode(new Uint8Array(data, offset, ftJSONLen)).replace(/\0+$/, ''),
          )
        : {};
    offset += ftJSONLen + ftBinLen;

    const btJSON =
      btJSONLen > 0
        ? JSON.parse(
            new TextDecoder().decode(new Uint8Array(data, offset, btJSONLen)).replace(/\0+$/, ''),
          )
        : {};
    offset += btJSONLen + btBinLen;

    const glbData = data.slice(offset);
    const batchLength = ftJSON.BATCH_LENGTH ?? 0;

    const features: Map<number, Record<string, any>> = new Map();

    return {
      type: 'b3dm',
      glbData,
      featureTableJson: ftJSON,
      batchTableJson: btJSON,
      batchLength,
      featureCount: batchLength,
      byteLength,
      getFeature(index: number): Tile3DFeature {
        let props = features.get(index);
        if (!props) {
          props = {};
          features.set(index, props);
        }
        return {
          featureId: index,
          getProperty(name: string) {
            return btJSON[name]?.[index] ?? props![name];
          },
          setProperty(name: string, value: any) {
            props![name] = value;
          },
          color: new Float32Array([1, 1, 1, 1]),
          show: true,
        };
      },
    };
  }
}
