// PBR shader — Metallic-Roughness workflow (simplified)

struct SceneUniforms {
  viewProjection: mat4x4f,
  cameraPosition: vec3f,
  _pad0: f32,
  lightDirection: vec3f,
  _pad1: f32,
  lightColor: vec3f,
  _pad2: f32,
};

struct ModelUniforms {
  modelMatrix: mat4x4f,
  normalMatrix: mat4x4f,  // transpose(inverse(modelMatrix))
};

struct MaterialUniforms {
  baseColorFactor: vec4f,
  metallicFactor: f32,
  roughnessFactor: f32,
  emissiveR: f32,
  emissiveG: f32,
  emissiveB: f32,
  normalScale: f32,
  occlusionStrength: f32,
  alphaCutoff: f32,
};

@group(0) @binding(0) var<uniform> scene: SceneUniforms;
@group(1) @binding(0) var<uniform> model: ModelUniforms;
@group(2) @binding(0) var<uniform> material: MaterialUniforms;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
};

struct VertexOutput {
  @builtin(position) clipPosition: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) uv: vec2f,
};

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  let worldPos = model.modelMatrix * vec4f(input.position, 1.0);
  output.clipPosition = scene.viewProjection * worldPos;
  output.worldPosition = worldPos.xyz;
  output.worldNormal = (model.normalMatrix * vec4f(input.normal, 0.0)).xyz;
  output.uv = input.uv;
  return output;
}

// Fresnel-Schlick approximation
fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// GGX/Trowbridge-Reitz NDF
fn distributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
  let a = roughness * roughness;
  let a2 = a * a;
  let NdotH = max(dot(N, H), 0.0);
  let NdotH2 = NdotH * NdotH;
  let denom = NdotH2 * (a2 - 1.0) + 1.0;
  return a2 / (3.14159265 * denom * denom);
}

// Schlick-GGX geometry function
fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
  let r = roughness + 1.0;
  let k = (r * r) / 8.0;
  return NdotV / (NdotV * (1.0 - k) + k);
}

fn geometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
  let NdotV = max(dot(N, V), 0.0);
  let NdotL = max(dot(N, L), 0.0);
  return geometrySchlickGGX(NdotV, roughness) * geometrySchlickGGX(NdotL, roughness);
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
  let N = normalize(input.worldNormal);
  let V = normalize(scene.cameraPosition - input.worldPosition);
  let L = normalize(-scene.lightDirection);
  let H = normalize(V + L);

  let albedo = material.baseColorFactor.rgb;
  let metallic = material.metallicFactor;
  let roughness = max(material.roughnessFactor, 0.04);

  // Dielectric F0 = 0.04, metallic F0 = albedo
  let F0 = mix(vec3f(0.04), albedo, metallic);

  // Cook-Torrance BRDF
  let NDF = distributionGGX(N, H, roughness);
  let G = geometrySmith(N, V, L, roughness);
  let F = fresnelSchlick(max(dot(H, V), 0.0), F0);

  let NdotL = max(dot(N, L), 0.0);

  let numerator = NDF * G * F;
  let denominator = 4.0 * max(dot(N, V), 0.0) * NdotL + 0.0001;
  let specular = numerator / denominator;

  let kS = F;
  let kD = (vec3f(1.0) - kS) * (1.0 - metallic);

  let Lo = (kD * albedo / 3.14159265 + specular) * scene.lightColor * NdotL;

  // Ambient
  let ambient = vec3f(0.03) * albedo;

  // Emissive
  let emissive = vec3f(material.emissiveR, material.emissiveG, material.emissiveB);

  var color = ambient + Lo + emissive;

  // HDR tone mapping (Reinhard)
  color = color / (color + vec3f(1.0));

  // Gamma correction
  color = pow(color, vec3f(1.0 / 2.2));

  return vec4f(color, material.baseColorFactor.a);
}
