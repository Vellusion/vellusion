import { describe, it, expect } from 'vitest';
import {
  B3dmLoader,
  I3dmLoader,
  PntsLoader,
  CmptLoader,
} from '@vellusion/tiles3d';

// ---------- Helpers ----------

function createB3dm(
  glbData: Uint8Array,
  batchLength = 0,
  batchTableJson: Record<string, any> = {},
): ArrayBuffer {
  const ftJSON = JSON.stringify({ BATCH_LENGTH: batchLength });
  const ftBytes = new TextEncoder().encode(ftJSON);
  const ftPadded = ftBytes.length + ((4 - (ftBytes.length % 4)) % 4);

  const btStr = Object.keys(batchTableJson).length > 0
    ? JSON.stringify(batchTableJson)
    : '';
  const btBytes = btStr.length > 0 ? new TextEncoder().encode(btStr) : new Uint8Array(0);
  const btPadded = btBytes.length > 0
    ? btBytes.length + ((4 - (btBytes.length % 4)) % 4)
    : 0;

  const total = 28 + ftPadded + btPadded + glbData.length;
  const buf = new ArrayBuffer(total);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  view.setUint32(0, 0x6d643362, true); // magic
  view.setUint32(4, 1, true); // version
  view.setUint32(8, total, true); // byteLength
  view.setUint32(12, ftPadded, true); // ftJSON length
  view.setUint32(16, 0, true); // ftBin length
  view.setUint32(20, btPadded, true); // btJSON length
  view.setUint32(24, 0, true); // btBin length
  bytes.set(ftBytes, 28);
  if (btBytes.length > 0) {
    bytes.set(btBytes, 28 + ftPadded);
  }
  bytes.set(glbData, 28 + ftPadded + btPadded);
  return buf;
}

function createI3dm(
  glbData: Uint8Array,
  instanceCount: number,
  positions: Float32Array | null = null,
  gltfFormat = 1,
): ArrayBuffer {
  const ftObj: any = { INSTANCES_LENGTH: instanceCount };
  if (positions) {
    ftObj.POSITION = { byteOffset: 0 };
  }
  const ftJSON = JSON.stringify(ftObj);
  const ftBytes = new TextEncoder().encode(ftJSON);
  const ftJSONPadded = ftBytes.length + ((4 - (ftBytes.length % 4)) % 4);

  const ftBinData = positions
    ? new Uint8Array(positions.buffer, positions.byteOffset, positions.byteLength)
    : new Uint8Array(0);
  // Align ftBin to 4 bytes
  const ftBinPadded = ftBinData.length + ((4 - (ftBinData.length % 4)) % 4);

  const total = 32 + ftJSONPadded + ftBinPadded + glbData.length;
  const buf = new ArrayBuffer(total);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  view.setUint32(0, 0x6d643369, true); // magic
  view.setUint32(4, 1, true); // version
  view.setUint32(8, total, true); // byteLength
  view.setUint32(12, ftJSONPadded, true); // ftJSON length
  view.setUint32(16, ftBinPadded, true); // ftBin length
  view.setUint32(20, 0, true); // btJSON length
  view.setUint32(24, 0, true); // btBin length
  view.setUint32(28, gltfFormat, true); // gltfFormat
  bytes.set(ftBytes, 32);
  if (ftBinData.length > 0) {
    bytes.set(ftBinData, 32 + ftJSONPadded);
  }
  bytes.set(glbData, 32 + ftJSONPadded + ftBinPadded);
  return buf;
}

function createPnts(
  pointCount: number,
  positions: Float32Array,
  colors: Uint8Array | null = null,
): ArrayBuffer {
  const ftObj: any = { POINTS_LENGTH: pointCount };

  let posBytes = new Uint8Array(
    positions.buffer,
    positions.byteOffset,
    positions.byteLength,
  );
  ftObj.POSITION = { byteOffset: 0 };

  let colorBytes = new Uint8Array(0);
  if (colors) {
    ftObj.RGB = { byteOffset: posBytes.length };
    colorBytes = colors;
  }

  const ftJSON = JSON.stringify(ftObj);
  const ftJSONBytes = new TextEncoder().encode(ftJSON);
  const ftJSONPadded =
    ftJSONBytes.length + ((4 - (ftJSONBytes.length % 4)) % 4);

  // Binary must be 4-byte aligned overall
  const ftBinLen = posBytes.length + colorBytes.length;
  const ftBinPadded = ftBinLen + ((4 - (ftBinLen % 4)) % 4);

  const total = 28 + ftJSONPadded + ftBinPadded;
  const buf = new ArrayBuffer(total);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  view.setUint32(0, 0x73746e70, true); // magic
  view.setUint32(4, 1, true); // version
  view.setUint32(8, total, true); // byteLength
  view.setUint32(12, ftJSONPadded, true); // ftJSON length
  view.setUint32(16, ftBinPadded, true); // ftBin length
  view.setUint32(20, 0, true); // btJSON length
  view.setUint32(24, 0, true); // btBin length
  bytes.set(ftJSONBytes, 28);
  bytes.set(posBytes, 28 + ftJSONPadded);
  if (colorBytes.length > 0) {
    bytes.set(colorBytes, 28 + ftJSONPadded + posBytes.length);
  }
  return buf;
}

function createCmpt(innerTiles: ArrayBuffer[]): ArrayBuffer {
  let innerTotalLen = 0;
  for (const t of innerTiles) innerTotalLen += t.byteLength;

  const total = 16 + innerTotalLen;
  const buf = new ArrayBuffer(total);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  view.setUint32(0, 0x74706d63, true); // magic
  view.setUint32(4, 1, true); // version
  view.setUint32(8, total, true); // byteLength
  view.setUint32(12, innerTiles.length, true); // tilesLength

  let offset = 16;
  for (const t of innerTiles) {
    bytes.set(new Uint8Array(t), offset);
    offset += t.byteLength;
  }
  return buf;
}

// ---------- B3dmLoader ----------

describe('B3dmLoader', () => {
  it('parses valid b3dm and extracts glbData', () => {
    const glb = new Uint8Array([0x67, 0x6c, 0x54, 0x46]); // fake glTF magic
    const data = createB3dm(glb, 5);
    const content = B3dmLoader.parse(data);

    expect(content.type).toBe('b3dm');
    expect(content.batchLength).toBe(5);
    expect(content.featureCount).toBe(5);
    expect(new Uint8Array(content.glbData)).toEqual(glb);
  });

  it('reads batchLength from featureTableJson', () => {
    const glb = new Uint8Array([1, 2, 3]);
    const data = createB3dm(glb, 42);
    const content = B3dmLoader.parse(data);

    expect(content.batchLength).toBe(42);
    expect(content.featureTableJson.BATCH_LENGTH).toBe(42);
  });

  it('reads batch table properties via getFeature', () => {
    const glb = new Uint8Array([1, 2]);
    const batchTable = { name: ['building_A', 'building_B'] };
    const data = createB3dm(glb, 2, batchTable);
    const content = B3dmLoader.parse(data);

    const feature0 = content.getFeature(0);
    expect(feature0.featureId).toBe(0);
    expect(feature0.getProperty('name')).toBe('building_A');

    const feature1 = content.getFeature(1);
    expect(feature1.getProperty('name')).toBe('building_B');
  });

  it('getFeature setProperty stores and retrieves values', () => {
    const glb = new Uint8Array([1]);
    const data = createB3dm(glb, 1);
    const content = B3dmLoader.parse(data);

    const feature = content.getFeature(0);
    feature.setProperty('highlight', true);
    expect(content.getFeature(0).getProperty('highlight')).toBe(true);
  });

  it('throws on invalid magic', () => {
    const buf = new ArrayBuffer(28);
    const view = new DataView(buf);
    view.setUint32(0, 0xdeadbeef, true);
    expect(() => B3dmLoader.parse(buf)).toThrow('Invalid b3dm magic');
  });

  it('byteLength matches total file size', () => {
    const glb = new Uint8Array([10, 20, 30, 40, 50]);
    const data = createB3dm(glb, 0);
    const content = B3dmLoader.parse(data);

    expect(content.byteLength).toBe(data.byteLength);
  });

  it('handles empty glbData', () => {
    const glb = new Uint8Array(0);
    const data = createB3dm(glb, 0);
    const content = B3dmLoader.parse(data);

    expect(content.glbData.byteLength).toBe(0);
    expect(content.batchLength).toBe(0);
  });
});

// ---------- I3dmLoader ----------

describe('I3dmLoader', () => {
  it('parses valid i3dm and reads instanceCount', () => {
    const glb = new Uint8Array([0x67, 0x6c, 0x54, 0x46]);
    const data = createI3dm(glb, 10);
    const content = I3dmLoader.parse(data);

    expect(content.type).toBe('i3dm');
    expect(content.instanceCount).toBe(10);
    expect(content.featureCount).toBe(10);
  });

  it('gltfFormat=1 yields glbData', () => {
    const glb = new Uint8Array([1, 2, 3, 4]);
    const data = createI3dm(glb, 3, null, 1);
    const content = I3dmLoader.parse(data);

    expect(content.glbData).not.toBeNull();
    expect(content.glbUri).toBeNull();
    expect(new Uint8Array(content.glbData!)).toEqual(glb);
  });

  it('gltfFormat=0 yields glbUri', () => {
    const uriStr = 'model.glb';
    const uriBytes = new TextEncoder().encode(uriStr);
    const data = createI3dm(uriBytes, 2, null, 0);
    const content = I3dmLoader.parse(data);

    expect(content.glbUri).toBe('model.glb');
    expect(content.glbData).toBeNull();
  });

  it('extracts positions from feature table binary', () => {
    const positions = new Float32Array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0]);
    const glb = new Uint8Array([0xaa, 0xbb]);
    const data = createI3dm(glb, 2, positions, 1);
    const content = I3dmLoader.parse(data);

    expect(content.positions.length).toBe(6);
    expect(content.positions[0]).toBeCloseTo(1.0);
    expect(content.positions[3]).toBeCloseTo(4.0);
  });

  it('throws on invalid magic', () => {
    const buf = new ArrayBuffer(32);
    const view = new DataView(buf);
    view.setUint32(0, 0x12345678, true);
    expect(() => I3dmLoader.parse(buf)).toThrow('Invalid i3dm magic');
  });
});

// ---------- PntsLoader ----------

describe('PntsLoader', () => {
  it('parses valid pnts and reads pointCount', () => {
    const positions = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const data = createPnts(3, positions);
    const content = PntsLoader.parse(data);

    expect(content.type).toBe('pnts');
    expect(content.pointCount).toBe(3);
    expect(content.featureCount).toBe(3);
  });

  it('extracts positions correctly', () => {
    const positions = new Float32Array([10, 20, 30, 40, 50, 60]);
    const data = createPnts(2, positions);
    const content = PntsLoader.parse(data);

    expect(content.positions.length).toBe(6);
    expect(content.positions[0]).toBeCloseTo(10);
    expect(content.positions[1]).toBeCloseTo(20);
    expect(content.positions[5]).toBeCloseTo(60);
  });

  it('extracts RGB colors when present', () => {
    const positions = new Float32Array([1, 2, 3]);
    const colors = new Uint8Array([255, 128, 0]);
    const data = createPnts(1, positions, colors);
    const content = PntsLoader.parse(data);

    expect(content.colors).not.toBeNull();
    expect(content.colors![0]).toBe(255);
    expect(content.colors![1]).toBe(128);
    expect(content.colors![2]).toBe(0);
  });

  it('colors is null when not present', () => {
    const positions = new Float32Array([1, 2, 3]);
    const data = createPnts(1, positions);
    const content = PntsLoader.parse(data);

    expect(content.colors).toBeNull();
  });

  it('throws on invalid magic', () => {
    const buf = new ArrayBuffer(28);
    const view = new DataView(buf);
    view.setUint32(0, 0xffffffff, true);
    expect(() => PntsLoader.parse(buf)).toThrow('Invalid pnts magic');
  });

  it('byteLength matches total file size', () => {
    const positions = new Float32Array([1, 2, 3]);
    const data = createPnts(1, positions);
    const content = PntsLoader.parse(data);

    expect(content.byteLength).toBe(data.byteLength);
  });
});

// ---------- CmptLoader ----------

describe('CmptLoader', () => {
  it('parses composite with inner b3dm', () => {
    const glb = new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]);
    const b3dm = createB3dm(glb, 3);
    const data = createCmpt([b3dm]);
    const content = CmptLoader.parse(data);

    expect(content.type).toBe('cmpt');
    expect(content.innerContents.length).toBe(1);
    expect(content.innerContents[0].type).toBe('b3dm');
    expect(content.featureCount).toBe(3);
  });

  it('parses composite with multiple inner tiles', () => {
    const glb1 = new Uint8Array([1, 2, 3, 4]);
    const b3dm1 = createB3dm(glb1, 2);

    const glb2 = new Uint8Array([5, 6, 7, 8]);
    const b3dm2 = createB3dm(glb2, 4);

    const data = createCmpt([b3dm1, b3dm2]);
    const content = CmptLoader.parse(data);

    expect(content.innerContents.length).toBe(2);
    expect(content.featureCount).toBe(6); // 2 + 4
  });

  it('parses composite with mixed tile types', () => {
    const glb = new Uint8Array([0xaa]);
    const b3dm = createB3dm(glb, 1);

    const positions = new Float32Array([1, 2, 3, 4, 5, 6]);
    const pnts = createPnts(2, positions);

    const data = createCmpt([b3dm, pnts]);
    const content = CmptLoader.parse(data);

    expect(content.innerContents.length).toBe(2);
    expect(content.innerContents[0].type).toBe('b3dm');
    expect(content.innerContents[1].type).toBe('pnts');
    expect(content.featureCount).toBe(3); // 1 + 2
  });

  it('handles empty composite', () => {
    const data = createCmpt([]);
    const content = CmptLoader.parse(data);

    expect(content.innerContents.length).toBe(0);
    expect(content.featureCount).toBe(0);
  });

  it('throws on invalid magic', () => {
    const buf = new ArrayBuffer(16);
    const view = new DataView(buf);
    view.setUint32(0, 0xbaadf00d, true);
    expect(() => CmptLoader.parse(buf)).toThrow('Invalid cmpt magic');
  });

  it('handles nested cmpt', () => {
    const glb = new Uint8Array([0x01, 0x02]);
    const b3dm = createB3dm(glb, 5);
    const innerCmpt = createCmpt([b3dm]);
    const data = createCmpt([innerCmpt]);
    const content = CmptLoader.parse(data);

    expect(content.innerContents.length).toBe(1);
    expect(content.innerContents[0].type).toBe('cmpt');
    const nested = content.innerContents[0] as any;
    expect(nested.innerContents.length).toBe(1);
    expect(nested.innerContents[0].type).toBe('b3dm');
    expect(content.featureCount).toBe(5);
  });
});
