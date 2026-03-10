import { GPUContext, FrameLoop } from '@vellusion/core';
import { PerspectiveCamera, ScreenSpaceEventHandler, ScreenSpaceCameraController } from '@vellusion/scene';
import { Vec3, Ellipsoid, Cartographic } from '@vellusion/math';
import { Globe, GlobeRenderer, OpenStreetMapImageryProvider, ImageryLayer } from '@vellusion/globe';

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;

  const ctx = await GPUContext.create({ canvas });

  // Camera - position above Earth looking at center
  const camera = new PerspectiveCamera(
    Math.PI / 4,                  // 45 degree FOV
    canvas.width / canvas.height, // aspect
    100,                          // near (100m)
    1e9,                          // far (1 billion meters — beyond Earth diameter)
  );

  // Position camera above equator at ~20,000km altitude
  const cameraHeight = 20000000; // 20,000 km
  const cameraCartographic = Cartographic.fromDegrees(0, 20, cameraHeight);
  const cameraPos = Vec3.zero();
  Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cameraCartographic, cameraPos);
  camera.setPosition(cameraPos[0], cameraPos[1], cameraPos[2]);
  camera.lookAtTarget(Vec3.zero()); // look at Earth center
  camera.update();

  // Globe
  const globe = new Globe();
  const osmLayer = new ImageryLayer(new OpenStreetMapImageryProvider());
  globe.imageryLayers.add(osmLayer);

  // Globe renderer
  const globeRenderer = new GlobeRenderer(ctx, globe);

  // Globe shader — basic vertex/fragment for rendering ellipsoid tiles
  const globeShaderCode = `
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
  let lightDir = normalize(vec3f(0.5, 1.0, 0.3));
  let nDotL = max(dot(normalize(input.normal), lightDir), 0.15);
  let baseColor = vec3f(0.1, 0.3 + input.uv.y * 0.4, 0.2 + input.uv.x * 0.3);
  return vec4f(baseColor * nDotL, 1.0);
}
`;
  globeRenderer.initPipeline(globeShaderCode);

  // Camera controller
  const eventHandler = new ScreenSpaceEventHandler(canvas);
  const controller = new ScreenSpaceCameraController(camera, eventHandler, {
    rotateSpeed: 0.003,
    zoomSpeed: 0.3,
    minimumZoomDistance: 6400000,    // ~Earth radius (can't go inside)
    maximumZoomDistance: 100000000,  // 100,000 km
  });

  // Depth texture
  let depthTexture = ctx.device.createTexture({
    size: [ctx.width, ctx.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // Render loop
  const loop = new FrameLoop((dt) => {
    controller.update(dt);
    camera.update();

    // Update globe tile selection
    globeRenderer.update(camera.position, ctx.height, camera.fov);

    // Render
    const encoder = ctx.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: ctx.getCurrentTexture().createView(),
        clearValue: { r: 0.0, g: 0.0, b: 0.02, a: 1.0 },
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

    globeRenderer.render(pass, camera.viewProjectionMatrix);

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
