import { GPUContext, GPUBufferWrapper, FrameLoop } from '@vellusion/core';
import { PerspectiveCamera, ScreenSpaceEventHandler, ScreenSpaceCameraController, Scene } from '@vellusion/scene';
import { Mat4, Vec3 } from '@vellusion/math';

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;

  const ctx = await GPUContext.create({ canvas });

  // Camera
  const camera = new PerspectiveCamera(
    Math.PI / 4,                    // 45 degree FOV
    canvas.width / canvas.height,   // aspect
    0.1,                            // near
    100,                            // far
  );
  camera.setPosition(0, 2, 5);
  camera.lookAtTarget(Vec3.zero());
  camera.update();

  // Scene
  const scene = new Scene({ camera });
  scene.backgroundColor = { r: 0.1, g: 0.1, b: 0.15, a: 1.0 };

  // Camera controller
  const eventHandler = new ScreenSpaceEventHandler(canvas);
  const controller = new ScreenSpaceCameraController(camera, eventHandler, {
    rotateSpeed: 0.005,
    zoomSpeed: 0.5,
    minimumZoomDistance: 1.0,
    maximumZoomDistance: 50.0,
  });

  // Cube geometry: 36 vertices (6 faces x 2 triangles x 3 vertices)
  // Each vertex: position(xyz) + color(rgb) = 6 floats
  const cubeVertices = new Float32Array([
    // Front face (red)
    -1, -1,  1,  1, 0, 0,
     1, -1,  1,  1, 0, 0,
     1,  1,  1,  1, 0, 0,
    -1, -1,  1,  1, 0, 0,
     1,  1,  1,  1, 0, 0,
    -1,  1,  1,  1, 0, 0,
    // Back face (cyan)
    -1, -1, -1,  0, 1, 1,
    -1,  1, -1,  0, 1, 1,
     1,  1, -1,  0, 1, 1,
    -1, -1, -1,  0, 1, 1,
     1,  1, -1,  0, 1, 1,
     1, -1, -1,  0, 1, 1,
    // Top face (green)
    -1,  1, -1,  0, 1, 0,
    -1,  1,  1,  0, 1, 0,
     1,  1,  1,  0, 1, 0,
    -1,  1, -1,  0, 1, 0,
     1,  1,  1,  0, 1, 0,
     1,  1, -1,  0, 1, 0,
    // Bottom face (magenta)
    -1, -1, -1,  1, 0, 1,
     1, -1, -1,  1, 0, 1,
     1, -1,  1,  1, 0, 1,
    -1, -1, -1,  1, 0, 1,
     1, -1,  1,  1, 0, 1,
    -1, -1,  1,  1, 0, 1,
    // Right face (blue)
     1, -1, -1,  0, 0, 1,
     1,  1, -1,  0, 0, 1,
     1,  1,  1,  0, 0, 1,
     1, -1, -1,  0, 0, 1,
     1,  1,  1,  0, 0, 1,
     1, -1,  1,  0, 0, 1,
    // Left face (yellow)
    -1, -1, -1,  1, 1, 0,
    -1, -1,  1,  1, 1, 0,
    -1,  1,  1,  1, 1, 0,
    -1, -1, -1,  1, 1, 0,
    -1,  1,  1,  1, 1, 0,
    -1,  1, -1,  1, 1, 0,
  ]);

  // Create GPU resources
  const vertexBuffer = new GPUBufferWrapper(ctx.device, {
    size: cubeVertices.byteLength,
    usage: ['vertex'],
  });
  vertexBuffer.write(ctx.device, cubeVertices);

  const uniformBuffer = new GPUBufferWrapper(ctx.device, {
    size: 64, // 4x4 float32 matrix
    usage: ['uniform'],
  });

  // Shader
  const shaderCode = await fetch(new URL('./cube.wgsl', import.meta.url)).then(r => r.text());
  const shaderModule = ctx.device.createShaderModule({ code: shaderCode });

  // Pipeline
  const pipeline = ctx.device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vs_main',
      buffers: [{
        arrayStride: 6 * 4, // 6 floats x 4 bytes
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x3' as GPUVertexFormat },  // position
          { shaderLocation: 1, offset: 12, format: 'float32x3' as GPUVertexFormat },  // color
        ],
      }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs_main',
      targets: [{ format: ctx.format }],
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
    },
    depthStencil: {
      format: 'depth24plus',
      depthWriteEnabled: true,
      depthCompare: 'less',
    },
  });

  // Bind group
  const bindGroup = ctx.device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: { buffer: uniformBuffer.gpuBuffer },
    }],
  });

  // Depth texture
  let depthTexture = ctx.device.createTexture({
    size: [ctx.width, ctx.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // Auto-rotate angle
  let angle = 0;

  // Scratch matrices to avoid allocations in the render loop
  const rotY = Mat4.identity();
  const model = Mat4.identity();
  const viewModel = Mat4.identity();
  const mvp = Mat4.identity();
  const mvpF32 = new Float32Array(16);

  // Render loop
  const loop = new FrameLoop((dt) => {
    controller.update(dt);
    scene.update(dt);

    // Auto-rotate
    angle += dt * 0.5;

    // Model matrix: rotate cube around Y axis
    Mat4.fromRotationY(angle, rotY);
    // model = rotY (no additional transform needed for a simple rotation)
    model.set(rotY);

    // MVP = projection x view x model
    Mat4.multiply(camera.viewMatrix, model, viewModel);
    Mat4.multiply(camera.projectionMatrix, viewModel, mvp);

    // Upload MVP as float32 (GPU uses f32, our math uses f64)
    for (let i = 0; i < 16; i++) mvpF32[i] = mvp[i];
    uniformBuffer.write(ctx.device, mvpF32);

    // Render
    const encoder = ctx.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: ctx.getCurrentTexture().createView(),
        clearValue: scene.backgroundColor,
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
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, vertexBuffer.gpuBuffer);
    pass.draw(36);
    pass.end();
    ctx.device.queue.submit([encoder.finish()]);
  });

  loop.start();

  // Resize handler
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
    depthTexture.destroy();
    depthTexture = ctx.device.createTexture({
      size: [canvas.width, canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  });
}

main().catch(console.error);
