export interface GltfAsset {
  asset: { version: string; generator?: string; minVersion?: string };
  scene?: number;
  scenes?: GltfScene[];
  nodes?: GltfNode[];
  meshes?: GltfMesh[];
  accessors?: GltfAccessor[];
  bufferViews?: GltfBufferView[];
  buffers?: GltfBuffer[];
  materials?: GltfMaterial[];
  textures?: GltfTexture[];
  images?: GltfImage[];
  samplers?: GltfSampler[];
  animations?: GltfAnimation[];
  skins?: GltfSkin[];
  cameras?: GltfCamera[];
  extensions?: Record<string, any>;
  extensionsUsed?: string[];
  extensionsRequired?: string[];
}

export interface GltfScene {
  name?: string;
  nodes?: number[];
}

export interface GltfNode {
  name?: string;
  children?: number[];
  mesh?: number;
  skin?: number;
  camera?: number;
  matrix?: number[]; // 16 elements, column-major
  translation?: number[]; // [x, y, z]
  rotation?: number[]; // [x, y, z, w] quaternion
  scale?: number[]; // [x, y, z]
  weights?: number[];
}

export interface GltfMesh {
  name?: string;
  primitives: GltfMeshPrimitive[];
  weights?: number[];
}

export interface GltfMeshPrimitive {
  attributes: Record<string, number>; // e.g. { POSITION: 0, NORMAL: 1 }
  indices?: number;
  material?: number;
  mode?: number; // 0=POINTS, 1=LINES, 4=TRIANGLES (default)
  targets?: Record<string, number>[];
}

export interface GltfAccessor {
  bufferView?: number;
  byteOffset?: number;
  componentType: number; // 5120=BYTE, 5121=UBYTE, 5122=SHORT, 5123=USHORT, 5125=UINT, 5126=FLOAT
  count: number;
  type: string; // 'SCALAR', 'VEC2', 'VEC3', 'VEC4', 'MAT2', 'MAT3', 'MAT4'
  max?: number[];
  min?: number[];
  normalized?: boolean;
  sparse?: any;
}

export interface GltfBufferView {
  buffer: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
  target?: number; // 34962=ARRAY_BUFFER, 34963=ELEMENT_ARRAY_BUFFER
}

export interface GltfBuffer {
  uri?: string;
  byteLength: number;
}

export interface GltfMaterial {
  name?: string;
  pbrMetallicRoughness?: {
    baseColorFactor?: number[];
    baseColorTexture?: { index: number; texCoord?: number };
    metallicFactor?: number;
    roughnessFactor?: number;
    metallicRoughnessTexture?: { index: number; texCoord?: number };
  };
  normalTexture?: { index: number; scale?: number; texCoord?: number };
  occlusionTexture?: {
    index: number;
    strength?: number;
    texCoord?: number;
  };
  emissiveTexture?: { index: number; texCoord?: number };
  emissiveFactor?: number[];
  alphaMode?: 'OPAQUE' | 'MASK' | 'BLEND';
  alphaCutoff?: number;
  doubleSided?: boolean;
  extensions?: Record<string, any>;
}

export interface GltfTexture {
  sampler?: number;
  source?: number;
}

export interface GltfImage {
  uri?: string;
  mimeType?: string;
  bufferView?: number;
}

export interface GltfSampler {
  magFilter?: number;
  minFilter?: number;
  wrapS?: number;
  wrapT?: number;
}

export interface GltfAnimation {
  name?: string;
  channels: GltfAnimationChannel[];
  samplers: GltfAnimationSampler[];
}

export interface GltfAnimationChannel {
  sampler: number;
  target: { node?: number; path: string };
}

export interface GltfAnimationSampler {
  input: number;
  output: number;
  interpolation?: 'LINEAR' | 'STEP' | 'CUBICSPLINE';
}

export interface GltfSkin {
  name?: string;
  inverseBindMatrices?: number;
  skeleton?: number;
  joints: number[];
}

export interface GltfCamera {
  name?: string;
  type: 'perspective' | 'orthographic';
  perspective?: {
    aspectRatio?: number;
    yfov: number;
    znear: number;
    zfar?: number;
  };
  orthographic?: {
    xmag: number;
    ymag: number;
    znear: number;
    zfar: number;
  };
}
