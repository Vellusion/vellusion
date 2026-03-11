// CMPT (Composite) format:
// Header (16 bytes): magic 'cmpt', version, byteLength, tilesLength
// Body: sequence of inner tiles (each with its own header)

import { B3dmLoader } from './B3dmLoader';
import { I3dmLoader } from './I3dmLoader';
import { PntsLoader } from './PntsLoader';
import type { Tile3DContent, Tile3DFeature } from '../Tile3DContent';

export interface CmptContent extends Tile3DContent {
  readonly type: 'cmpt';
  readonly innerContents: Tile3DContent[];
}

export class CmptLoader {
  static readonly MAGIC = 0x74706d63; // 'cmpt'

  static parse(data: ArrayBuffer): CmptContent {
    const view = new DataView(data);
    const magic = view.getUint32(0, true);
    if (magic !== CmptLoader.MAGIC) {
      throw new Error(`Invalid cmpt magic: 0x${magic.toString(16)}`);
    }
    const byteLength = view.getUint32(8, true);
    const tilesLength = view.getUint32(12, true);

    const innerContents: Tile3DContent[] = [];
    let offset = 16;

    for (let i = 0; i < tilesLength; i++) {
      const innerMagic = view.getUint32(offset, true);
      const innerByteLength = view.getUint32(offset + 8, true);
      const innerData = data.slice(offset, offset + innerByteLength);

      switch (innerMagic) {
        case B3dmLoader.MAGIC:
          innerContents.push(B3dmLoader.parse(innerData));
          break;
        case I3dmLoader.MAGIC:
          innerContents.push(I3dmLoader.parse(innerData));
          break;
        case PntsLoader.MAGIC:
          innerContents.push(PntsLoader.parse(innerData));
          break;
        case CmptLoader.MAGIC:
          innerContents.push(CmptLoader.parse(innerData));
          break;
      }

      offset += innerByteLength;
    }

    return {
      type: 'cmpt',
      innerContents,
      featureCount: innerContents.reduce(
        (sum, c) => sum + c.featureCount,
        0,
      ),
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
