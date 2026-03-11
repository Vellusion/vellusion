import { describe, it, expect } from 'vitest';
import { GltfParser } from '../src/gltf/GltfParser';
import { GltfDocument } from '../src/gltf/GltfDocument';

// Helper: create a minimal GLB
function createMinimalGlb(json: object, bin?: ArrayBuffer): ArrayBuffer {
  const jsonStr = JSON.stringify(json);
  const jsonBytes = new TextEncoder().encode(jsonStr);
  // Pad JSON to 4-byte alignment
  const jsonPadded =
    jsonBytes.length + ((4 - (jsonBytes.length % 4)) % 4);
  const jsonChunk = new Uint8Array(jsonPadded);
  jsonChunk.set(jsonBytes);
  for (let i = jsonBytes.length; i < jsonPadded; i++) jsonChunk[i] = 0x20; // space

  const binLength = bin ? bin.byteLength : 0;
  const binPadded = binLength + ((4 - (binLength % 4)) % 4);
  const totalLength = 12 + 8 + jsonPadded + (bin ? 8 + binPadded : 0);

  const result = new ArrayBuffer(totalLength);
  const view = new DataView(result);
  const bytes = new Uint8Array(result);

  // Header
  view.setUint32(0, 0x46546c67, true); // magic
  view.setUint32(4, 2, true); // version
  view.setUint32(8, totalLength, true); // length

  // JSON chunk
  let off = 12;
  view.setUint32(off, jsonPadded, true);
  off += 4;
  view.setUint32(off, 0x4e4f534a, true);
  off += 4;
  bytes.set(jsonChunk, off);
  off += jsonPadded;

  // BIN chunk
  if (bin) {
    view.setUint32(off, binPadded, true);
    off += 4;
    view.setUint32(off, 0x004e4942, true);
    off += 4;
    bytes.set(new Uint8Array(bin), off);
  }

  return result;
}

describe('GltfParser', () => {
  it('parses minimal gltf JSON', () => {
    const json = { asset: { version: '2.0' } };
    const doc = GltfParser.parseGltf(json);
    expect(doc.json.asset.version).toBe('2.0');
    expect(doc.buffers).toHaveLength(0);
  });

  it('parses gltf with buffers', () => {
    const json = {
      asset: { version: '2.0' },
      buffers: [{ byteLength: 12 }],
    };
    const buf = new ArrayBuffer(12);
    const doc = GltfParser.parseGltf(json, [buf]);
    expect(doc.buffers).toHaveLength(1);
  });

  it('parses GLB binary', () => {
    const json = { asset: { version: '2.0' } };
    const glb = createMinimalGlb(json);
    const doc = GltfParser.parseGlb(glb);
    expect(doc.json.asset.version).toBe('2.0');
  });

  it('parses GLB with binary chunk', () => {
    const bin = new ArrayBuffer(16);
    new Float32Array(bin).set([1, 2, 3, 4]);
    const json = {
      asset: { version: '2.0' },
      buffers: [{ byteLength: 16 }],
      bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 16 }],
      accessors: [
        {
          bufferView: 0,
          componentType: 5126,
          count: 4,
          type: 'SCALAR',
        },
      ],
    };
    const glb = createMinimalGlb(json, bin);
    const doc = GltfParser.parseGlb(glb);
    const data = doc.getAccessorData(0);
    expect(data).toBeInstanceOf(Float32Array);
    expect(data.length).toBe(4);
    expect(data[0]).toBeCloseTo(1);
  });

  it('throws on invalid GLB magic', () => {
    const bad = new ArrayBuffer(12);
    new DataView(bad).setUint32(0, 0xdeadbeef, true);
    expect(() => GltfParser.parseGlb(bad)).toThrow('Invalid GLB magic');
  });

  it('throws on unsupported GLB version', () => {
    const bad = new ArrayBuffer(12);
    const v = new DataView(bad);
    v.setUint32(0, 0x46546c67, true);
    v.setUint32(4, 99, true);
    v.setUint32(8, 12, true);
    expect(() => GltfParser.parseGlb(bad)).toThrow(
      'Unsupported GLB version',
    );
  });
});

describe('GltfDocument', () => {
  it('getAccessorData returns Float32Array for type 5126', () => {
    const bin = new ArrayBuffer(24);
    new Float32Array(bin).set([1, 2, 3, 4, 5, 6]);
    const json = {
      asset: { version: '2.0' },
      bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 24 }],
      accessors: [
        {
          bufferView: 0,
          componentType: 5126,
          count: 2,
          type: 'VEC3',
        },
      ],
    };
    const doc = new GltfDocument(json as any, [bin]);
    const data = doc.getAccessorData(0);
    expect(data.length).toBe(6); // 2 * VEC3
  });

  it('getAccessorData returns Uint16Array for type 5123', () => {
    const bin = new ArrayBuffer(6);
    new Uint16Array(bin).set([0, 1, 2]);
    const json = {
      asset: { version: '2.0' },
      bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 6 }],
      accessors: [
        {
          bufferView: 0,
          componentType: 5123,
          count: 3,
          type: 'SCALAR',
        },
      ],
    };
    const doc = new GltfDocument(json as any, [bin]);
    const data = doc.getAccessorData(0);
    expect(data).toBeInstanceOf(Uint16Array);
    expect(data.length).toBe(3);
  });

  it('getAccessorCount returns element count', () => {
    const json = {
      asset: { version: '2.0' },
      accessors: [
        {
          bufferView: 0,
          componentType: 5126,
          count: 42,
          type: 'VEC3',
        },
      ],
    };
    const doc = new GltfDocument(json as any, []);
    expect(doc.getAccessorCount(0)).toBe(42);
  });

  it('getAccessorComponentCount returns components per element', () => {
    const json = {
      asset: { version: '2.0' },
      accessors: [{ componentType: 5126, count: 1, type: 'MAT4' }],
    };
    const doc = new GltfDocument(json as any, []);
    expect(doc.getAccessorComponentCount(0)).toBe(16);
  });

  it('handles byteOffset in accessor', () => {
    const bin = new ArrayBuffer(32);
    new Float32Array(bin).set([0, 0, 0, 0, 10, 20, 30, 40]);
    const json = {
      asset: { version: '2.0' },
      bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 32 }],
      accessors: [
        {
          bufferView: 0,
          byteOffset: 16,
          componentType: 5126,
          count: 4,
          type: 'SCALAR',
        },
      ],
    };
    const doc = new GltfDocument(json as any, [bin]);
    const data = doc.getAccessorData(0);
    expect(data[0]).toBeCloseTo(10);
  });
});
