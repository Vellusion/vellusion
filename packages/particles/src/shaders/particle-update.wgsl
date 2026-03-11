// Compute shader for particle update (future use)
// For now, CPU-side update is used. This shader shows the intended GPU pipeline.

struct Particle {
  position: vec3f,
  velocity: vec3f,
  age: f32,
  maxAge: f32,
  alive: u32,
};

struct SimParams {
  deltaTime: f32,
  gravity: vec3f,
};

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> params: SimParams;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let idx = id.x;
  if (idx >= arrayLength(&particles)) { return; }

  var p = particles[idx];
  if (p.alive == 0u) { return; }

  // Age
  p.age += params.deltaTime;
  if (p.age >= p.maxAge) {
    p.alive = 0u;
    particles[idx] = p;
    return;
  }

  // Apply gravity
  p.velocity += params.gravity * params.deltaTime;

  // Update position
  p.position += p.velocity * params.deltaTime;

  particles[idx] = p;
}
