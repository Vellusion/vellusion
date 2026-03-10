// ---------------------------------------------------------------------------
// Appearance system – defines how geometry is shaded / rendered.
// ---------------------------------------------------------------------------

export interface RenderState {
  depthTest?: boolean;
  depthWrite?: boolean;
  blending?: boolean;
  cullFace?: 'none' | 'front' | 'back';
}

export interface Appearance {
  vertexShaderSource: string;
  fragmentShaderSource: string;
  renderState: RenderState;
  closed: boolean;
  flat: boolean;
}

// ---------------------------------------------------------------------------
// Default WGSL shader sources (placeholders)
// ---------------------------------------------------------------------------

const DEFAULT_VERTEX_SHADER = /* wgsl */ `
struct Uniforms {
  modelViewProjection: mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
  @location(0) position: vec3<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.modelViewProjection * vec4<f32>(input.position, 1.0);
  return output;
}
`;

const DEFAULT_FRAGMENT_SHADER = /* wgsl */ `
@fragment
fn main() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 1.0, 1.0, 1.0);
}
`;

const PER_INSTANCE_COLOR_VERTEX_SHADER = /* wgsl */ `
struct Uniforms {
  modelViewProjection: mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) color: vec4<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.modelViewProjection * vec4<f32>(input.position, 1.0);
  output.color = input.color;
  return output;
}
`;

const PER_INSTANCE_COLOR_FRAGMENT_SHADER = /* wgsl */ `
struct FragmentInput {
  @location(0) color: vec4<f32>,
};

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
  return input.color;
}
`;

const POLYLINE_VERTEX_SHADER = /* wgsl */ `
struct Uniforms {
  modelViewProjection: mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) color: vec4<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.modelViewProjection * vec4<f32>(input.position, 1.0);
  output.color = input.color;
  return output;
}
`;

const POLYLINE_FRAGMENT_SHADER = /* wgsl */ `
struct FragmentInput {
  @location(0) color: vec4<f32>,
};

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
  return input.color;
}
`;

const POLYLINE_MATERIAL_VERTEX_SHADER = /* wgsl */ `
struct Uniforms {
  modelViewProjection: mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) st: vec2<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) st: vec2<f32>,
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.modelViewProjection * vec4<f32>(input.position, 1.0);
  output.st = input.st;
  return output;
}
`;

const POLYLINE_MATERIAL_FRAGMENT_SHADER = /* wgsl */ `
struct FragmentInput {
  @location(0) st: vec2<f32>,
};

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 1.0, 1.0, 1.0);
}
`;

// ---------------------------------------------------------------------------
// Default render states
// ---------------------------------------------------------------------------

const DEFAULT_RENDER_STATE: RenderState = {
  depthTest: true,
  depthWrite: true,
  blending: false,
  cullFace: 'back',
};

const TRANSLUCENT_RENDER_STATE: RenderState = {
  depthTest: true,
  depthWrite: false,
  blending: true,
  cullFace: 'back',
};

const POLYLINE_RENDER_STATE: RenderState = {
  depthTest: true,
  depthWrite: true,
  blending: false,
  cullFace: 'none',
};

// ---------------------------------------------------------------------------
// MaterialAppearance
// ---------------------------------------------------------------------------

export class MaterialAppearance implements Appearance {
  vertexShaderSource: string;
  fragmentShaderSource: string;
  renderState: RenderState;
  closed: boolean;
  flat: boolean;

  constructor(options?: {
    vertexShaderSource?: string;
    fragmentShaderSource?: string;
    renderState?: RenderState;
    closed?: boolean;
    flat?: boolean;
  }) {
    this.vertexShaderSource = options?.vertexShaderSource ?? DEFAULT_VERTEX_SHADER;
    this.fragmentShaderSource = options?.fragmentShaderSource ?? DEFAULT_FRAGMENT_SHADER;
    this.renderState = options?.renderState ?? { ...DEFAULT_RENDER_STATE };
    this.closed = options?.closed ?? false;
    this.flat = options?.flat ?? false;
  }
}

// ---------------------------------------------------------------------------
// PerInstanceColorAppearance
// ---------------------------------------------------------------------------

export class PerInstanceColorAppearance implements Appearance {
  vertexShaderSource: string;
  fragmentShaderSource: string;
  renderState: RenderState;
  closed: boolean;
  flat: boolean;

  constructor(options?: {
    closed?: boolean;
    flat?: boolean;
    renderState?: RenderState;
  }) {
    this.vertexShaderSource = PER_INSTANCE_COLOR_VERTEX_SHADER;
    this.fragmentShaderSource = PER_INSTANCE_COLOR_FRAGMENT_SHADER;
    this.renderState = options?.renderState ?? { ...DEFAULT_RENDER_STATE };
    this.closed = options?.closed ?? false;
    this.flat = options?.flat ?? false;
  }
}

// ---------------------------------------------------------------------------
// EllipsoidSurfaceAppearance
// ---------------------------------------------------------------------------

export class EllipsoidSurfaceAppearance implements Appearance {
  vertexShaderSource: string;
  fragmentShaderSource: string;
  renderState: RenderState;
  closed: boolean = false;
  flat: boolean = true;

  constructor(options?: { renderState?: RenderState }) {
    this.vertexShaderSource = DEFAULT_VERTEX_SHADER;
    this.fragmentShaderSource = DEFAULT_FRAGMENT_SHADER;
    this.renderState = options?.renderState ?? { ...DEFAULT_RENDER_STATE };
  }
}

// ---------------------------------------------------------------------------
// PolylineColorAppearance
// ---------------------------------------------------------------------------

export class PolylineColorAppearance implements Appearance {
  vertexShaderSource: string;
  fragmentShaderSource: string;
  renderState: RenderState;
  closed: boolean = false;
  flat: boolean = true;

  constructor() {
    this.vertexShaderSource = POLYLINE_VERTEX_SHADER;
    this.fragmentShaderSource = POLYLINE_FRAGMENT_SHADER;
    this.renderState = { ...POLYLINE_RENDER_STATE };
  }
}

// ---------------------------------------------------------------------------
// PolylineMaterialAppearance
// ---------------------------------------------------------------------------

export class PolylineMaterialAppearance implements Appearance {
  vertexShaderSource: string;
  fragmentShaderSource: string;
  renderState: RenderState;
  closed: boolean = false;
  flat: boolean = true;

  constructor() {
    this.vertexShaderSource = POLYLINE_MATERIAL_VERTEX_SHADER;
    this.fragmentShaderSource = POLYLINE_MATERIAL_FRAGMENT_SHADER;
    this.renderState = { ...POLYLINE_RENDER_STATE };
  }
}
