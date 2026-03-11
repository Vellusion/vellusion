// Renders camera-facing billboard quads for particles

struct Uniforms {
  viewProjection: mat4x4f,
  cameraPosition: vec3f,
  _pad: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
  @location(1) uv: vec2f,
};

// Per-instance attributes
@vertex
fn vs_main(
  @builtin(vertex_index) vertexIndex: u32,
  @location(0) particlePos: vec3f,
  @location(1) particleColor: vec4f,
  @location(2) particleScale: f32,
) -> VertexOutput {
  // Billboard quad: 4 vertices as triangle strip
  let offsets = array<vec2f, 4>(
    vec2f(-0.5, -0.5),
    vec2f( 0.5, -0.5),
    vec2f(-0.5,  0.5),
    vec2f( 0.5,  0.5),
  );

  let offset = offsets[vertexIndex];
  let size = particleScale * 0.1; // scale factor

  // Camera-facing billboard
  let toCamera = normalize(uniforms.cameraPosition - particlePos);
  let worldUp = vec3f(0.0, 1.0, 0.0);
  let right = normalize(cross(worldUp, toCamera));
  let up = cross(toCamera, right);

  let worldPos = particlePos + right * offset.x * size + up * offset.y * size;

  var output: VertexOutput;
  output.position = uniforms.viewProjection * vec4f(worldPos, 1.0);
  output.color = particleColor;
  output.uv = offset + 0.5;
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
  // Circular particle with soft edge
  let dist = length(input.uv - vec2f(0.5));
  if (dist > 0.5) { discard; }
  let alpha = smoothstep(0.5, 0.3, dist);
  return vec4f(input.color.rgb, input.color.a * alpha);
}
