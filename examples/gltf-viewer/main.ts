import { GPUContext, FrameLoop } from '@vellusion/core';
import { PerspectiveCamera, ScreenSpaceEventHandler, ScreenSpaceCameraController } from '@vellusion/scene';
import { Vec3, Mat4 } from '@vellusion/math';
import { Model, ModelRenderer, ModelNode, ModelMesh, ModelPrimitive, PbrMaterial, ModelAnimation, AnimationChannel, AnimationSampler } from '@vellusion/model';

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  const ctx = await GPUContext.create({ canvas });

  const camera = new PerspectiveCamera(Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
  camera.setPosition(0, 2, 5);
  camera.lookAtTarget(Vec3.zero());
  camera.update();

  const eventHandler = new ScreenSpaceEventHandler(canvas);
  const controller = new ScreenSpaceCameraController(camera, eventHandler, {
    rotateSpeed: 0.005,
    zoomSpeed: 0.5,
    minimumZoomDistance: 1,
    maximumZoomDistance: 20,
  });

  // Create a simple box mesh programmatically
  // 24 vertices (4 per face x 6 faces) for correct per-face normals
  const positions = new Float32Array([
    // front face
    -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,  0.5,
    // back face
    -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5, -0.5,
    // top face
    -0.5,  0.5, -0.5, -0.5,  0.5,  0.5,  0.5,  0.5,  0.5,  0.5,  0.5, -0.5,
    // bottom face
    -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, -0.5,  0.5, -0.5, -0.5,  0.5,
    // right face
     0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,
    // left face
    -0.5, -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5,
  ]);
  const normals = new Float32Array([
    0,0,1, 0,0,1, 0,0,1, 0,0,1,
    0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
    0,1,0, 0,1,0, 0,1,0, 0,1,0,
    0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
    1,0,0, 1,0,0, 1,0,0, 1,0,0,
    -1,0,0, -1,0,0, -1,0,0, -1,0,0,
  ]);
  const uvs = new Float32Array([
    0,0, 1,0, 1,1, 0,1,
    0,0, 1,0, 1,1, 0,1,
    0,0, 1,0, 1,1, 0,1,
    0,0, 1,0, 1,1, 0,1,
    0,0, 1,0, 1,1, 0,1,
    0,0, 1,0, 1,1, 0,1,
  ]);
  const indices = new Uint16Array([
    0,1,2, 0,2,3,       4,5,6, 4,6,7,
    8,9,10, 8,10,11,     12,13,14, 12,14,15,
    16,17,18, 16,18,19,  20,21,22, 20,22,23,
  ]);

  const prim = new ModelPrimitive({ positions, normals, uvs, indices, materialIndex: 0 });
  const mesh = new ModelMesh([prim]);
  const node = new ModelNode('Box');
  node.mesh = mesh;

  // Create a simple rotation animation (360-degree Y-axis spin over 4 seconds)
  const animTimes = new Float32Array([0, 1, 2, 3, 4]);
  const animValues = new Float32Array([
    0, 0, 0, 1,            // identity
    0, 0.7071, 0, 0.7071,  // 90 degrees Y
    0, 1, 0, 0,            // 180 degrees Y
    0, 0.7071, 0, -0.7071, // 270 degrees Y
    0, 0, 0, 1,            // 360 degrees (back to start)
  ]);
  const sampler = new AnimationSampler(animTimes, animValues, 4, 'LINEAR');
  const channel = new AnimationChannel(node, 'rotation', sampler);
  const animation = new ModelAnimation('spin');
  animation.channels.push(channel);
  animation.duration = 4;
  animation.play();

  const material = new PbrMaterial({
    baseColorFactor: new Float32Array([0.8, 0.2, 0.1, 1.0]),
    metallicFactor: 0.3,
    roughnessFactor: 0.7,
  });

  const model = new Model({
    rootNodes: [node],
    allNodes: [node],
    animations: [animation],
    skins: [],
    materials: [material],
  });

  // Simple PBR-like shader
  const shaderCode = `
struct Uniforms { mvp: mat4x4f };
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VS_OUT {
  @builtin(position) pos: vec4f,
  @location(0) normal: vec3f,
  @location(1) uv: vec2f,
};

@vertex fn vs_main(
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
) -> VS_OUT {
  var out: VS_OUT;
  out.pos = uniforms.mvp * vec4f(position, 1.0);
  out.normal = normal;
  out.uv = uv;
  return out;
}

@fragment fn fs_main(in: VS_OUT) -> @location(0) vec4f {
  let light = normalize(vec3f(1.0, 2.0, 1.5));
  let nDotL = max(dot(normalize(in.normal), light), 0.15);
  let color = vec3f(0.8, 0.2, 0.1);
  return vec4f(color * nDotL, 1.0);
}`;

  const renderer = new ModelRenderer(ctx);
  renderer.initPipeline(shaderCode);
  renderer.addModel(model);

  let depthTexture = ctx.device.createTexture({
    size: [ctx.width, ctx.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const loop = new FrameLoop((dt) => {
    controller.update(dt);
    camera.update();
    model.updateAnimations(dt); // dt is in seconds

    const encoder = ctx.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: ctx.getCurrentTexture().createView(),
        clearValue: { r: 0.15, g: 0.15, b: 0.2, a: 1.0 },
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
    renderer.render(pass, camera.viewProjectionMatrix, camera.position);
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
