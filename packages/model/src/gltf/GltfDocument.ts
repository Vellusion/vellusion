import type { GltfAsset } from './GltfSchema';

const COMPONENT_SIZES: Record<number, number> = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4,
};

const TYPE_COUNTS: Record<string, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

export class GltfDocument {
  readonly json: GltfAsset;
  readonly buffers: ArrayBuffer[];

  constructor(json: GltfAsset, buffers: ArrayBuffer[]) {
    this.json = json;
    this.buffers = buffers;
  }

  getAccessorData(
    accessorIndex: number,
  ):
    | Float32Array
    | Uint16Array
    | Uint32Array
    | Int8Array
    | Uint8Array
    | Int16Array {
    const accessor = this.json.accessors![accessorIndex];
    const bufferView = this.json.bufferViews![accessor.bufferView!];
    const buffer = this.buffers[bufferView.buffer];
    const byteOffset =
      (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const count = accessor.count * TYPE_COUNTS[accessor.type];

    switch (accessor.componentType) {
      case 5126:
        return new Float32Array(buffer, byteOffset, count);
      case 5123:
        return new Uint16Array(buffer, byteOffset, count);
      case 5125:
        return new Uint32Array(buffer, byteOffset, count);
      case 5122:
        return new Int16Array(buffer, byteOffset, count);
      case 5121:
        return new Uint8Array(buffer, byteOffset, count);
      case 5120:
        return new Int8Array(buffer, byteOffset, count);
      default:
        throw new Error(
          `Unsupported component type: ${accessor.componentType}`,
        );
    }
  }

  getAccessorCount(accessorIndex: number): number {
    return this.json.accessors![accessorIndex].count;
  }

  getAccessorComponentCount(accessorIndex: number): number {
    return TYPE_COUNTS[this.json.accessors![accessorIndex].type];
  }
}
