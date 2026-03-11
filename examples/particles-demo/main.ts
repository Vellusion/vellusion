import { GPUContext, FrameLoop } from '@vellusion/core';
import { PerspectiveCamera, ScreenSpaceEventHandler, ScreenSpaceCameraController } from '@vellusion/scene';
import { Vec3 } from '@vellusion/math';
import {
  ParticleSystem, ParticleBurst,
  ConeEmitter, GravityForce,
} from '@vellusion/particles';

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  const ctx = await GPUContext.create({ canvas });

  const camera = new PerspectiveCamera(Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
  camera.setPosition(0, 3, 8);
  camera.lookAtTarget(Vec3.create(0, 1, 0));
  camera.update();

  const eventHandler = new ScreenSpaceEventHandler(canvas);
  const controller = new ScreenSpaceCameraController(camera, eventHandler, {
    rotateSpeed: 0.005, zoomSpeed: 0.5, minimumZoomDistance: 2, maximumZoomDistance: 30,
  });

  // Fire-like particle system
  const fireSystem = new ParticleSystem({
    emitter: new ConeEmitter(Math.PI / 6),
    emissionRate: 50,
    maximumParticles: 500,
    minimumSpeed: 1,
    maximumSpeed: 3,
    minimumParticleLife: 0.5,
    maximumParticleLife: 2,
    startScale: 1.5,
    endScale: 0.1,
    startColor: new Float32Array([1.0, 0.8, 0.2, 1.0]),
    endColor: new Float32Array([0.8, 0.1, 0.0, 0.0]),
    bursts: [
      new ParticleBurst({ time: 0.5, minimum: 20, maximum: 30 }),
    ],
  });
  fireSystem.addForceField(new GravityForce(new Float32Array([0, 0.5, 0]))); // upward "heat"

  // ---- Billboard particle rendering pipeline ----
  const shaderCode = `
struct Uniforms { viewProjection: mat4x4f, cameraPosition: vec3f, _pad: f32 };
@group(0) @binding(0) var<uniform> u: Uniforms;
struct V { @builtin(position) pos: vec4f, @location(0) color: vec4f, @location(1) uv: vec2f };
@vertex fn vs_main(
  @builtin(vertex_index) vi: u32,
  @location(0) pPos: vec3f, @location(1) pColor: vec4f, @location(2) pScale: f32
) -> V {
  let off = array<vec2f, 4>(vec2f(-0.5,-0.5), vec2f(0.5,-0.5), vec2f(-0.5,0.5), vec2f(0.5,0.5));
  let o = off[vi]; let s = pScale * 0.1;
  let tc = normalize(u.cameraPosition - pPos);
  let r = normalize(cross(vec3f(0,1,0), tc));
  let up = cross(tc, r);
  let wp = pPos + r * o.x * s + up * o.y * s;
  var out: V; out.pos = u.viewProjection * vec4f(wp, 1.0);
  out.color = pColor; out.uv = o + 0.5; return out;
}
@fragment fn fs_main(i: V) -> @location(0) vec4f {
  let d = length(i.uv - vec2f(0.5));
  if (d > 0.5) { discard; }
  let a = smoothstep(0.5, 0.2, d);
  return vec4f(i.color.rgb, i.color.a * a);
}`;

  const shaderModule = ctx.device.createShaderModule({ code: shaderCode });

  // Uniform buffer: mat4x4f (64 bytes) + vec3f + pad (16 bytes) = 80 bytes
  const uniformBuffer = ctx.device.createBuffer({
    size: 80,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroupLayout = ctx.device.createBindGroupLayout({
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      buffer: { type: 'uniform' },
    }],
  });

  const bindGroup = ctx.device.createBindGroup({
    layout: bindGroupLayout,
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  const pipelineLayout = ctx.device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });

  const pipeline = ctx.device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: shaderModule,
      entryPoint: 'vs_main',
      buffers: [{
        // Per-instance: position (vec3f) + color (vec4f) + scale (f32)
        arrayStride: 32, // 3*4 + 4*4 + 4 = 32
        stepMode: 'instance' as GPUVertexStepMode,
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x3' as GPUVertexFormat },  // position
          { shaderLocation: 1, offset: 12, format: 'float32x4' as GPUVertexFormat }, // color
          { shaderLocation: 2, offset: 28, format: 'float32' as GPUVertexFormat },   // scale
        ],
      }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs_main',
      targets: [{
        format: ctx.format,
        blend: {
          color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' },
          alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
        },
      }],
    },
    primitive: { topology: 'triangle-strip' },
    depthStencil: {
      format: 'depth24plus',
      depthWriteEnabled: false, // transparent particles should not write depth
      depthCompare: 'less',
    },
  });

  // Instance buffer sized for maximum particles (32 bytes each)
  const maxParticles = fireSystem.maximumParticles;
  const instanceBuffer = ctx.device.createBuffer({
    size: maxParticles * 32,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  let depthTexture = ctx.device.createTexture({
    size: [ctx.width, ctx.height], format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const info = document.getElementById('info');

  const loop = new FrameLoop((dt) => {
    controller.update(dt);
    camera.update();

    // dt is already in seconds from FrameLoop
    fireSystem.update(dt);

    if (info) info.textContent = `Particles: ${fireSystem.activeCount} / ${fireSystem.maximumParticles}`;

    // Build instance data from alive particles
    const instanceData = new Float32Array(maxParticles * 8); // 8 floats per particle
    let count = 0;
    for (let i = 0; i < maxParticles; i++) {
      if (!fireSystem.alive[i]) continue;
      const off = count * 8;
      instanceData[off + 0] = fireSystem.positions[i * 3];
      instanceData[off + 1] = fireSystem.positions[i * 3 + 1];
      instanceData[off + 2] = fireSystem.positions[i * 3 + 2];
      instanceData[off + 3] = fireSystem.colors[i * 4];
      instanceData[off + 4] = fireSystem.colors[i * 4 + 1];
      instanceData[off + 5] = fireSystem.colors[i * 4 + 2];
      instanceData[off + 6] = fireSystem.colors[i * 4 + 3];
      instanceData[off + 7] = fireSystem.scales[i];
      count++;
    }

    if (count > 0) {
      ctx.device.queue.writeBuffer(instanceBuffer, 0, instanceData, 0, count * 8);
    }

    // Update uniform buffer (viewProjection + cameraPosition)
    const uniformData = new Float32Array(20);
    for (let i = 0; i < 16; i++) uniformData[i] = camera.viewProjectionMatrix[i];
    uniformData[16] = camera.position[0];
    uniformData[17] = camera.position[1];
    uniformData[18] = camera.position[2];
    uniformData[19] = 0; // padding
    ctx.device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    const encoder = ctx.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: ctx.getCurrentTexture().createView(),
        clearValue: { r: 0.05, g: 0.05, b: 0.08, a: 1.0 },
        loadOp: 'clear' as GPULoadOp, storeOp: 'store' as GPUStoreOp,
      }],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear' as GPULoadOp, depthStoreOp: 'store' as GPUStoreOp,
      },
    });

    if (count > 0) {
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.setVertexBuffer(0, instanceBuffer);
      pass.draw(4, count); // 4 vertices per billboard quad (triangle-strip), N instances
    }

    pass.end();
    ctx.device.queue.submit([encoder.finish()]);
  });
  loop.start();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    ctx.resize(canvas.width, canvas.height);
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
    depthTexture.destroy();
    depthTexture = ctx.device.createTexture({
      size: [ctx.width, ctx.height], format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  });
}
main().catch(console.error);
