import { GPUContext, FrameLoop } from '@vellusion/core';
import { PerspectiveCamera, ScreenSpaceEventHandler, ScreenSpaceCameraController } from '@vellusion/scene';
import { Vec3, Mat4, Ellipsoid, Cartographic } from '@vellusion/math';
import { Globe, GlobeRenderer } from '@vellusion/globe';
import {
  GeoJsonDataSource,
  DataSourceCollection,
  DataSourceDisplay,
} from '@vellusion/datasources';

// Sample GeoJSON — world cities + a polygon + a linestring
const sampleGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-73.985, 40.748] },
      properties: { name: 'New York', population: 8336817 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.352, 48.856] },
      properties: { name: 'Paris', population: 2161000 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [139.691, 35.689] },
      properties: { name: 'Tokyo', population: 13960000 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [116.407, 39.904] },
      properties: { name: 'Beijing', population: 21540000 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-43.172, -22.906] },
      properties: { name: 'Rio de Janeiro', population: 6748000 },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[-73.985, 40.748], [-0.118, 51.509], [37.617, 55.755], [116.407, 39.904], [139.691, 35.689]],
      },
      properties: { name: 'Great Circle Route' },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[100, 0], [105, 0], [105, 5], [100, 5], [100, 0]]],
      },
      properties: { name: 'Southeast Asia Region' },
    },
  ],
};

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;

  const ctx = await GPUContext.create({ canvas });

  // Camera
  const camera = new PerspectiveCamera(Math.PI / 4, canvas.width / canvas.height, 100, 1e9);
  const cameraHeight = 25000000;
  const cameraCartographic = Cartographic.fromDegrees(20, 30, cameraHeight);
  const cameraPos = Vec3.zero();
  Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cameraCartographic, cameraPos);
  camera.setPosition(cameraPos[0], cameraPos[1], cameraPos[2]);
  camera.lookAtTarget(Vec3.zero());
  camera.update();

  // Globe
  const globe = new Globe();
  const globeRenderer = new GlobeRenderer(ctx, globe);

  const globeShaderCode = `
struct Uniforms { mvp: mat4x4f };
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
struct VS_IN { @location(0) position: vec3f, @location(1) normal: vec3f, @location(2) uv: vec2f };
struct VS_OUT { @builtin(position) position: vec4f, @location(0) normal: vec3f, @location(1) uv: vec2f };
@vertex fn vs_main(in: VS_IN) -> VS_OUT {
  var out: VS_OUT;
  out.position = uniforms.mvp * vec4f(in.position, 1.0);
  out.normal = in.normal; out.uv = in.uv;
  return out;
}
@fragment fn fs_main(in: VS_OUT) -> @location(0) vec4f {
  let light = normalize(vec3f(0.5, 1.0, 0.3));
  let nDotL = max(dot(normalize(in.normal), light), 0.15);
  let color = vec3f(0.1, 0.3 + in.uv.y * 0.4, 0.2 + in.uv.x * 0.3);
  return vec4f(color * nDotL, 1.0);
}`;
  globeRenderer.initPipeline(globeShaderCode);

  // Camera controller
  const eventHandler = new ScreenSpaceEventHandler(canvas);
  const controller = new ScreenSpaceCameraController(camera, eventHandler, {
    rotateSpeed: 0.003,
    zoomSpeed: 0.3,
    minimumZoomDistance: 6400000,
    maximumZoomDistance: 100000000,
  });

  // Load GeoJSON data
  const dsCollection = new DataSourceCollection();
  const geojsonDs = await GeoJsonDataSource.load(sampleGeoJson, {
    markerSize: 12,
  });
  await dsCollection.add(geojsonDs);

  const display = new DataSourceDisplay({ dataSourceCollection: dsCollection });
  display.update({} as any);

  // Update entity count in UI
  const countEl = document.getElementById('count');
  if (countEl) countEl.textContent = String(geojsonDs.entities.length);

  console.log(`Loaded ${geojsonDs.entities.length} entities from GeoJSON`);
  for (const entity of geojsonDs.entities.values) {
    console.log(`  - ${entity.name ?? entity.id}: point=${!!entity.point}, polyline=${!!entity.polyline}, polygon=${!!entity.polygon}`);
  }

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
    globeRenderer.update(camera.position, ctx.height, camera.fov);

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

  // Resize
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    ctx.resize(canvas.width, canvas.height);
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
