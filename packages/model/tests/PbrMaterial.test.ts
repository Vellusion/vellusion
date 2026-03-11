import { describe, it, expect } from 'vitest';
import { PbrMaterial } from '../src/PbrMaterial';

describe('PbrMaterial', () => {
  it('default values are correct', () => {
    const mat = new PbrMaterial();
    expect(mat.params.baseColorFactor).toEqual(new Float32Array([1, 1, 1, 1]));
    expect(mat.params.metallicFactor).toBe(1.0);
    expect(mat.params.roughnessFactor).toBe(1.0);
    expect(mat.params.emissiveFactor).toEqual(new Float32Array([0, 0, 0]));
    expect(mat.params.normalScale).toBe(1.0);
    expect(mat.params.occlusionStrength).toBe(1.0);
    expect(mat.params.alphaCutoff).toBe(0.5);
    expect(mat.params.baseColorTextureIndex).toBe(-1);
    expect(mat.params.metallicRoughnessTextureIndex).toBe(-1);
    expect(mat.params.normalTextureIndex).toBe(-1);
    expect(mat.params.occlusionTextureIndex).toBe(-1);
    expect(mat.params.emissiveTextureIndex).toBe(-1);
  });

  it('custom params override defaults', () => {
    const mat = new PbrMaterial({
      metallicFactor: 0.5,
      roughnessFactor: 0.8,
      baseColorFactor: new Float32Array([0.2, 0.4, 0.6, 1.0]),
      emissiveFactor: new Float32Array([0.1, 0.2, 0.3]),
      normalScale: 2.0,
      occlusionStrength: 0.7,
      alphaCutoff: 0.3,
    });
    expect(mat.params.metallicFactor).toBe(0.5);
    expect(mat.params.roughnessFactor).toBe(0.8);
    expect(mat.params.baseColorFactor).toEqual(new Float32Array([0.2, 0.4, 0.6, 1.0]));
    expect(mat.params.emissiveFactor).toEqual(new Float32Array([0.1, 0.2, 0.3]));
    expect(mat.params.normalScale).toBe(2.0);
    expect(mat.params.occlusionStrength).toBe(0.7);
    expect(mat.params.alphaCutoff).toBe(0.3);
  });

  it('fromGltfMaterial with full PBR data', () => {
    const gltfMat = {
      pbrMetallicRoughness: {
        baseColorFactor: [0.8, 0.2, 0.1, 1.0],
        metallicFactor: 0.3,
        roughnessFactor: 0.7,
        baseColorTexture: { index: 0 },
        metallicRoughnessTexture: { index: 1 },
      },
      emissiveFactor: [0.5, 0.5, 0.0],
      normalTexture: { index: 2, scale: 1.5 },
      occlusionTexture: { index: 3, strength: 0.9 },
      emissiveTexture: { index: 4 },
      alphaMode: 'MASK',
      alphaCutoff: 0.4,
      doubleSided: true,
    };

    const mat = PbrMaterial.fromGltfMaterial(gltfMat);
    expect(mat.params.baseColorFactor).toEqual(new Float32Array([0.8, 0.2, 0.1, 1.0]));
    expect(mat.params.metallicFactor).toBe(0.3);
    expect(mat.params.roughnessFactor).toBe(0.7);
    expect(mat.params.emissiveFactor).toEqual(new Float32Array([0.5, 0.5, 0.0]));
    expect(mat.params.normalScale).toBe(1.5);
    expect(mat.params.occlusionStrength).toBe(0.9);
    expect(mat.params.alphaMode).toBe('MASK');
    expect(mat.params.alphaCutoff).toBe(0.4);
    expect(mat.params.doubleSided).toBe(true);
  });

  it('fromGltfMaterial with minimal data (no pbr block)', () => {
    const gltfMat = {};
    const mat = PbrMaterial.fromGltfMaterial(gltfMat);
    // Should fall back to defaults
    expect(mat.params.baseColorFactor).toEqual(new Float32Array([1, 1, 1, 1]));
    expect(mat.params.metallicFactor).toBe(1.0);
    expect(mat.params.roughnessFactor).toBe(1.0);
    expect(mat.params.emissiveFactor).toEqual(new Float32Array([0, 0, 0]));
    expect(mat.params.normalScale).toBe(1.0);
    expect(mat.params.occlusionStrength).toBe(1.0);
    expect(mat.params.alphaMode).toBe('OPAQUE');
    expect(mat.params.alphaCutoff).toBe(0.5);
    expect(mat.params.doubleSided).toBe(false);
  });

  it('fromGltfMaterial with texture indices', () => {
    const gltfMat = {
      pbrMetallicRoughness: {
        baseColorTexture: { index: 5 },
        metallicRoughnessTexture: { index: 6 },
      },
      normalTexture: { index: 7 },
      occlusionTexture: { index: 8 },
      emissiveTexture: { index: 9 },
    };

    const mat = PbrMaterial.fromGltfMaterial(gltfMat);
    expect(mat.params.baseColorTextureIndex).toBe(5);
    expect(mat.params.metallicRoughnessTextureIndex).toBe(6);
    expect(mat.params.normalTextureIndex).toBe(7);
    expect(mat.params.occlusionTextureIndex).toBe(8);
    expect(mat.params.emissiveTextureIndex).toBe(9);
  });

  it('toUniformData returns correct 12-float layout', () => {
    const mat = new PbrMaterial();
    const data = mat.toUniformData();
    expect(data).toBeInstanceOf(Float32Array);
    expect(data.length).toBe(12);
    // baseColor [1,1,1,1] at indices 0-3
    expect(data[0]).toBe(1);
    expect(data[1]).toBe(1);
    expect(data[2]).toBe(1);
    expect(data[3]).toBe(1);
    // metallic at 4
    expect(data[4]).toBe(1.0);
    // roughness at 5
    expect(data[5]).toBe(1.0);
    // emissive [0,0,0] at 6-8
    expect(data[6]).toBe(0);
    expect(data[7]).toBe(0);
    expect(data[8]).toBe(0);
    // normalScale at 9
    expect(data[9]).toBe(1.0);
    // occlusionStrength at 10
    expect(data[10]).toBe(1.0);
    // alphaCutoff at 11
    expect(data[11]).toBe(0.5);
  });

  it('toUniformData reflects custom params', () => {
    const mat = new PbrMaterial({
      baseColorFactor: new Float32Array([0.5, 0.6, 0.7, 0.8]),
      metallicFactor: 0.3,
      roughnessFactor: 0.9,
      emissiveFactor: new Float32Array([0.1, 0.2, 0.3]),
      normalScale: 2.0,
      occlusionStrength: 0.5,
      alphaCutoff: 0.75,
    });
    const data = mat.toUniformData();
    expect(data[0]).toBeCloseTo(0.5);
    expect(data[1]).toBeCloseTo(0.6);
    expect(data[2]).toBeCloseTo(0.7);
    expect(data[3]).toBeCloseTo(0.8);
    expect(data[4]).toBeCloseTo(0.3);
    expect(data[5]).toBeCloseTo(0.9);
    expect(data[6]).toBeCloseTo(0.1);
    expect(data[7]).toBeCloseTo(0.2);
    expect(data[8]).toBeCloseTo(0.3);
    expect(data[9]).toBeCloseTo(2.0);
    expect(data[10]).toBeCloseTo(0.5);
    expect(data[11]).toBeCloseTo(0.75);
  });

  it('alphaMode defaults to OPAQUE', () => {
    const mat = new PbrMaterial();
    expect(mat.params.alphaMode).toBe('OPAQUE');
  });

  it('doubleSided defaults to false', () => {
    const mat = new PbrMaterial();
    expect(mat.params.doubleSided).toBe(false);
  });

  it('PbrMaterial.default() returns default material', () => {
    const mat = PbrMaterial.default();
    expect(mat).toBeInstanceOf(PbrMaterial);
    expect(mat.params.baseColorFactor).toEqual(new Float32Array([1, 1, 1, 1]));
    expect(mat.params.metallicFactor).toBe(1.0);
    expect(mat.params.roughnessFactor).toBe(1.0);
    expect(mat.params.alphaMode).toBe('OPAQUE');
    expect(mat.params.doubleSided).toBe(false);
  });
});
