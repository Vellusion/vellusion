const BUILT_IN_MATERIALS: Record<string, string> = {
  'Color': `
// Color material: solid color
fn materialColor(baseColor: vec4f) -> vec4f {
  return material_color;
}`,
  'Image': `
// Image material: texture sample
fn materialColor(uv: vec2f) -> vec4f {
  return textureSample(material_texture, material_sampler, uv * material_repeat);
}`,
  'Grid': `
// Grid material: grid lines overlay
fn materialColor(uv: vec2f) -> vec4f {
  let cellSize = 1.0 / material_lineCount;
  let thickness = material_lineThickness;
  let gridX = step(cellSize - thickness, fract(uv.x * material_lineCount));
  let gridY = step(cellSize - thickness, fract(uv.y * material_lineCount));
  let grid = max(gridX, gridY);
  return mix(vec4f(0.0, 0.0, 0.0, material_cellAlpha), material_color, grid);
}`,
  'Stripe': `
// Stripe material
fn materialColor(uv: vec2f) -> vec4f {
  let stripe = step(0.5, fract(uv.x * material_repeat));
  return mix(material_evenColor, material_oddColor, stripe);
}`,
  'Checkerboard': `
// Checkerboard material
fn materialColor(uv: vec2f) -> vec4f {
  let cx = step(0.5, fract(uv.x * material_repeat));
  let cy = step(0.5, fract(uv.y * material_repeat));
  let check = abs(cx - cy);
  return mix(material_lightColor, material_darkColor, check);
}`,
  'Dot': `
// Dot material
fn materialColor(uv: vec2f) -> vec4f {
  let cell = fract(uv * material_repeat);
  let dist = distance(cell, vec2f(0.5));
  let dot = 1.0 - step(material_dotRadius, dist);
  return mix(vec4f(0.0, 0.0, 0.0, 0.0), material_color, dot);
}`,
  'Water': `
// Water material: animated water surface
fn materialColor(uv: vec2f) -> vec4f {
  return material_baseWaterColor;
}`,
  'PolylineArrow': `
// Arrow polyline material
fn materialColor(uv: vec2f) -> vec4f {
  let arrow = step(abs(uv.y - 0.5) * 2.0, 1.0 - uv.x);
  return mix(vec4f(0.0), material_color, arrow);
}`,
  'PolylineDash': `
// Dashed polyline material
fn materialColor(uv: vec2f) -> vec4f {
  let dash = step(0.5, fract(uv.x * material_dashLength));
  return mix(material_gapColor, material_color, dash);
}`,
  'PolylineGlow': `
// Glowing polyline material
fn materialColor(uv: vec2f) -> vec4f {
  let dist = abs(uv.y - 0.5) * 2.0;
  let glow = exp(-dist * dist * material_glowPower);
  return vec4f(material_color.rgb, glow * material_color.a);
}`,
  'PolylineOutline': `
// Outlined polyline material
fn materialColor(uv: vec2f) -> vec4f {
  let dist = abs(uv.y - 0.5) * 2.0;
  let isOutline = step(1.0 - material_outlineWidth, dist);
  return mix(material_color, material_outlineColor, isOutline);
}`,
};

const DEFAULT_UNIFORMS: Record<string, Record<string, any>> = {
  'Color': { color: [1.0, 1.0, 1.0, 1.0] },
  'Image': { image: '', repeat: [1.0, 1.0] },
  'Grid': { color: [1.0, 1.0, 1.0, 1.0], cellAlpha: 0.1, lineCount: 8, lineThickness: 0.01 },
  'Stripe': { evenColor: [1.0, 1.0, 1.0, 1.0], oddColor: [0.0, 0.0, 0.0, 1.0], repeat: 5 },
  'Checkerboard': { lightColor: [1.0, 1.0, 1.0, 1.0], darkColor: [0.0, 0.0, 0.0, 1.0], repeat: 5 },
  'Dot': { color: [1.0, 1.0, 0.0, 1.0], dotRadius: 0.3, repeat: 5 },
  'Water': { baseWaterColor: [0.2, 0.3, 0.6, 1.0] },
  'PolylineArrow': { color: [1.0, 1.0, 1.0, 1.0] },
  'PolylineDash': { color: [1.0, 1.0, 1.0, 1.0], gapColor: [0.0, 0.0, 0.0, 0.0], dashLength: 16 },
  'PolylineGlow': { color: [0.0, 0.5, 1.0, 1.0], glowPower: 4.0 },
  'PolylineOutline': { color: [1.0, 1.0, 1.0, 1.0], outlineColor: [0.0, 0.0, 0.0, 1.0], outlineWidth: 0.2 },
};

export interface MaterialOptions {
  type: string;
  uniforms?: Record<string, any>;
  source?: string; // custom WGSL fragment
}

export class Material {
  type: string;
  uniforms: Record<string, any>;
  shaderSource: string;

  constructor(options: MaterialOptions) {
    this.type = options.type;
    this.uniforms = { ...DEFAULT_UNIFORMS[options.type], ...options.uniforms };
    this.shaderSource = options.source ?? Material._getBuiltInSource(options.type);
  }

  /**
   * Factory method for built-in materials.
   */
  static fromType(type: string, uniforms?: Record<string, any>): Material {
    return new Material({ type, uniforms });
  }

  private static _getBuiltInSource(type: string): string {
    return BUILT_IN_MATERIALS[type] ?? '';
  }
}
