import type { GltfAsset } from './GltfSchema';
import { GltfDocument } from './GltfDocument';

const GLB_MAGIC = 0x46546c67; // 'glTF'
const GLB_VERSION = 2;
const JSON_CHUNK_TYPE = 0x4e4f534a; // 'JSON'
const BIN_CHUNK_TYPE = 0x004e4942; // 'BIN\0'

export class GltfParser {
  /**
   * Parse a .gltf JSON with external buffers.
   */
  static parseGltf(json: any, buffers: ArrayBuffer[] = []): GltfDocument {
    return new GltfDocument(json as GltfAsset, buffers);
  }

  /**
   * Parse a .glb binary.
   * GLB layout: Header(12 bytes) + Chunk0(JSON) + Chunk1(BIN)
   */
  static parseGlb(data: ArrayBuffer): GltfDocument {
    const view = new DataView(data);

    // Header: magic(4) + version(4) + length(4)
    const magic = view.getUint32(0, true);
    if (magic !== GLB_MAGIC) {
      throw new Error(`Invalid GLB magic: 0x${magic.toString(16)}`);
    }
    const version = view.getUint32(4, true);
    if (version !== GLB_VERSION) {
      throw new Error(`Unsupported GLB version: ${version}`);
    }

    let offset = 12;
    let json: GltfAsset | null = null;
    const buffers: ArrayBuffer[] = [];

    while (offset < data.byteLength) {
      const chunkLength = view.getUint32(offset, true);
      const chunkType = view.getUint32(offset + 4, true);
      offset += 8;

      if (chunkType === JSON_CHUNK_TYPE) {
        const jsonBytes = new Uint8Array(data, offset, chunkLength);
        const jsonStr = new TextDecoder().decode(jsonBytes);
        json = JSON.parse(jsonStr);
      } else if (chunkType === BIN_CHUNK_TYPE) {
        // Create a copy to avoid alignment issues
        const binCopy = new ArrayBuffer(chunkLength);
        new Uint8Array(binCopy).set(new Uint8Array(data, offset, chunkLength));
        buffers.push(binCopy);
      }

      offset += chunkLength;
    }

    if (!json) {
      throw new Error('GLB missing JSON chunk');
    }

    return new GltfDocument(json, buffers);
  }
}
