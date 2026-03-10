import { GPUContext, GPUBufferWrapper, FrameLoop } from '@vellusion/core';
import { PerspectiveCamera, ScreenSpaceEventHandler, ScreenSpaceCameraController } from '@vellusion/scene';
import { Mat4, Vec3 } from '@vellusion/math';
import { BoxGeometry, SphereGeometry, CylinderGeometry } from '@vellusion/geometry';
import type { Geometry } from '@vellusion/geometry';

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;

  const ctx = await GPUContext.create({ canvas });

  const camera = new PerspectiveCamera(Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
  camera.setPosition(0, 3, 8);
  camera.lookAtTarget(Vec3.zero());
  camera.update();

  const eventHandler = new ScreenSpaceEventHandler(canvas);
  const controller = new ScreenSpaceCameraController(camera, eventHandler, {
    rotateSpeed: 0.005,
    zoomSpeed: 0.5,
    minimumZoomDistance: 2,
    maximumZoomDistance: 50,
  });

  // Create geometries
  const boxGeom = BoxGeometry.create({ width: 1, height: 1, depth: 1 });
  const sphereGeom = SphereGeometry.create({ radius: 0.7, stackCount: 16, sliceCount: 32 });
  const cylinderGeom = CylinderGeometry.create({ topRadius: 0.5, bottomRadius: 0.5, height: 1.5, sliceCount: 32 });

  // Helper: upload geometry to GPU
  function uploadGeometry(geom: Geometry) {
    const pos = geom.attributes.position.values;
    const norm = geom.attributes.normal?.values;
    const idx = geom.indices!;

    // Interleave position + normal = 6 floats per vertex
    const vertexCount = pos.length / 3;
    const vertexData = new Float32Array(vertexCount * 6);
    for (let i = 0; i < vertexCount; i++) {
      vertexData[i * 6 + 0] = pos[i * 3];
      vertexData[i * 6 + 1] = pos[i * 3 + 1];
      vertexData[i * 6 + 2] = pos[i * 3 + 2];
      vertexData[i * 6 + 3] = norm ? norm[i * 3] : 0;
      vertexData[i * 6 + 4] = norm ? norm[i * 3 + 1] : 1;
      vertexData[i * 6 + 5] = norm ? norm[i * 3 + 2] : 0;
    }

    const vBuf = new GPUBufferWrapper(ctx.device, { size: vertexData.byteLength, usage: ['vertex'] });
    vBuf.write(ctx.device, vertexData);

    const iBuf = new GPUBufferWrapper(ctx.device, { size: idx.byteLength, usage: ['index'] });
    iBuf.write(ctx.device, idx);

    return { vBuf, iBuf, indexCount: idx.length, indexFormat: idx instanceof Uint32Array ? 'uint32' : 'uint16' };
  }

  const box = uploadGeometry(boxGeom);
  const sphere = uploadGeometry(sphereGeom);
  const cylinder = uploadGeometry(cylinderGeom);

  // Shader
  const shaderCode = `
struct Uniforms { mvp: mat4x4f, color: vec4f };
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VS_OUT { @builtin(position) pos: vec4f, @location(0) normal: vec3f };

@vertex fn vs(@location(0) position: vec3f, @location(1) normal: vec3f) -> VS_OUT {
  var out: VS_OUT;
  out.pos = uniforms.mvp * vec4f(position, 1.0);
  out.normal = normal;
  return out;
}

@fragment fn fs(in: VS_OUT) -> @location(0) vec4f {
  let light = normalize(vec3f(1.0, 2.0, 1.5));
  let nDotL = max(dot(normalize(in.normal), light), 0.15);
  return vec4f(uniforms.color.rgb * nDotL, 1.0);
}`;

  const shaderModule = ctx.device.createShaderModule({ code: shaderCode });

  const pipeline = ctx.device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vs',
      buffers: [{
        arrayStride: 24,
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x3' as GPUVertexFormat },
          { shaderLocation: 1, offset: 12, format: 'float32x3' as GPUVertexFormat },
        ],
      }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs',
      targets: [{ format: ctx.format }],
    },
    primitive: { topology: 'triangle-list', cullMode: 'back' },
    depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' },
  });

  // One uniform buffer per object (MVP + color = 64 + 16 = 80 bytes)
  const uniformSize = 80;
  function createUniform(color: number[]) {
    const buf = new GPUBufferWrapper(ctx.device, { size: uniformSize, usage: ['uniform'] });
    const bg = ctx.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: buf.gpuBuffer } }],
    });
    return { buf, bg, color };
  }

  const boxUni = createUniform([0.9, 0.2, 0.2, 1.0]);   // red
  const sphereUni = createUniform([0.2, 0.7, 0.2, 1.0]); // green
  const cylUni = createUniform([0.2, 0.3, 0.9, 1.0]);    // blue

  let depthTexture = ctx.device.createTexture({
    size: [ctx.width, ctx.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const objects = [
    { mesh: box, uni: boxUni, pos: Vec3.create(-2.5, 0, 0) },
    { mesh: sphere, uni: sphereUni, pos: Vec3.create(0, 0, 0) },
    { mesh: cylinder, uni: cylUni, pos: Vec3.create(2.5, 0, 0) },
  ];

  // Scratch matrices to avoid allocations in the render loop
  const model = Mat4.identity();
  const viewModel = Mat4.identity();
  const mvp = Mat4.identity();

  const loop = new FrameLoop((dt) => {
    controller.update(dt);
    camera.update();

    const encoder = ctx.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: ctx.getCurrentTexture().createView(),
        clearValue: { r: 0.1, g: 0.1, b: 0.15, a: 1.0 },
        loadOp: 'clear' as GPULoadOp,
        storeOp: 'store' as GPUStoreOp,
      }],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear' as GPULoadOp,
        depthStoreOp: 'store' as GPUStoreOp,
      },
    });

    pass.setPipeline(pipeline);

    for (const obj of objects) {
      Mat4.fromTranslation(obj.pos, model);

      // MVP = projection x view x model
      Mat4.multiply(camera.viewMatrix, model, viewModel);
      Mat4.multiply(camera.projectionMatrix, viewModel, mvp);

      const data = new Float32Array(20); // 16 (mvp) + 4 (color)
      for (let i = 0; i < 16; i++) data[i] = mvp[i];
      data[16] = obj.uni.color[0];
      data[17] = obj.uni.color[1];
      data[18] = obj.uni.color[2];
      data[19] = obj.uni.color[3];
      obj.uni.buf.write(ctx.device, data);

      pass.setBindGroup(0, obj.uni.bg);
      pass.setVertexBuffer(0, obj.mesh.vBuf.gpuBuffer);
      pass.setIndexBuffer(obj.mesh.iBuf.gpuBuffer, obj.mesh.indexFormat as GPUIndexFormat);
      pass.drawIndexed(obj.mesh.indexCount);
    }

    pass.end();
    ctx.device.queue.submit([encoder.finish()]);
  });
  loop.start();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
    depthTexture.destroy();
    depthTexture = ctx.device.createTexture({
      size: [ctx.width, ctx.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  });
}

main().catch(console.error);
