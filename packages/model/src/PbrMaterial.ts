export interface PbrMaterialParams {
  baseColorFactor: Float32Array;    // [r, g, b, a] default [1,1,1,1]
  metallicFactor: number;           // default 1.0
  roughnessFactor: number;          // default 1.0
  emissiveFactor: Float32Array;     // [r, g, b] default [0,0,0]
  normalScale: number;              // default 1.0
  occlusionStrength: number;        // default 1.0
  alphaMode: 'OPAQUE' | 'MASK' | 'BLEND';
  alphaCutoff: number;              // default 0.5
  doubleSided: boolean;
  // Texture indices (references into glTF textures array, -1 = none)
  baseColorTextureIndex: number;
  metallicRoughnessTextureIndex: number;
  normalTextureIndex: number;
  occlusionTextureIndex: number;
  emissiveTextureIndex: number;
}

export class PbrMaterial {
  params: PbrMaterialParams;

  constructor(params?: Partial<PbrMaterialParams>) {
    this.params = {
      baseColorFactor: params?.baseColorFactor ?? new Float32Array([1, 1, 1, 1]),
      metallicFactor: params?.metallicFactor ?? 1.0,
      roughnessFactor: params?.roughnessFactor ?? 1.0,
      emissiveFactor: params?.emissiveFactor ?? new Float32Array([0, 0, 0]),
      normalScale: params?.normalScale ?? 1.0,
      occlusionStrength: params?.occlusionStrength ?? 1.0,
      alphaMode: params?.alphaMode ?? 'OPAQUE',
      alphaCutoff: params?.alphaCutoff ?? 0.5,
      doubleSided: params?.doubleSided ?? false,
      baseColorTextureIndex: params?.baseColorTextureIndex ?? -1,
      metallicRoughnessTextureIndex: params?.metallicRoughnessTextureIndex ?? -1,
      normalTextureIndex: params?.normalTextureIndex ?? -1,
      occlusionTextureIndex: params?.occlusionTextureIndex ?? -1,
      emissiveTextureIndex: params?.emissiveTextureIndex ?? -1,
    };
  }

  /**
   * Create PbrMaterial from a glTF material definition.
   */
  static fromGltfMaterial(gltfMat: any): PbrMaterial {
    const pbr = gltfMat.pbrMetallicRoughness ?? {};
    return new PbrMaterial({
      baseColorFactor: pbr.baseColorFactor
        ? new Float32Array(pbr.baseColorFactor)
        : undefined,
      metallicFactor: pbr.metallicFactor,
      roughnessFactor: pbr.roughnessFactor,
      emissiveFactor: gltfMat.emissiveFactor
        ? new Float32Array(gltfMat.emissiveFactor)
        : undefined,
      normalScale: gltfMat.normalTexture?.scale,
      occlusionStrength: gltfMat.occlusionTexture?.strength,
      alphaMode: gltfMat.alphaMode,
      alphaCutoff: gltfMat.alphaCutoff,
      doubleSided: gltfMat.doubleSided,
      baseColorTextureIndex: pbr.baseColorTexture?.index ?? -1,
      metallicRoughnessTextureIndex: pbr.metallicRoughnessTexture?.index ?? -1,
      normalTextureIndex: gltfMat.normalTexture?.index ?? -1,
      occlusionTextureIndex: gltfMat.occlusionTexture?.index ?? -1,
      emissiveTextureIndex: gltfMat.emissiveTexture?.index ?? -1,
    });
  }

  /**
   * Get material parameters as a Float32Array for GPU uniform upload.
   * Layout: baseColor(4) + metallic(1) + roughness(1) + emissive(3) + normalScale(1) + occlusionStr(1) + alphaCutoff(1) = 12 floats = 48 bytes
   */
  toUniformData(): Float32Array {
    const data = new Float32Array(12);
    data.set(this.params.baseColorFactor, 0);
    data[4] = this.params.metallicFactor;
    data[5] = this.params.roughnessFactor;
    data.set(this.params.emissiveFactor, 6);
    data[9] = this.params.normalScale;
    data[10] = this.params.occlusionStrength;
    data[11] = this.params.alphaCutoff;
    return data;
  }

  static default(): PbrMaterial {
    return new PbrMaterial();
  }
}
