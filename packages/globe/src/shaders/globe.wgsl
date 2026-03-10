struct Uniforms {
  mvp: mat4x4f,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) uv: vec2f,
};

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.mvp * vec4f(input.position, 1.0);
  output.normal = input.normal;
  output.uv = input.uv;
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
  // Simple directional light
  let lightDir = normalize(vec3f(0.5, 1.0, 0.3));
  let nDotL = max(dot(normalize(input.normal), lightDir), 0.15);

  // Base color from UV (debug visualization — green/blue gradient)
  let baseColor = vec3f(0.1, 0.3 + input.uv.y * 0.4, 0.2 + input.uv.x * 0.3);

  return vec4f(baseColor * nDotL, 1.0);
}
