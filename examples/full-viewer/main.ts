import { GPUContext, FrameLoop } from '@vellusion/core';
import { PerspectiveCamera, ScreenSpaceEventHandler, ScreenSpaceCameraController, Clock } from '@vellusion/scene';
import { Vec3, Ellipsoid, Cartographic } from '@vellusion/math';
import { Globe, GlobeRenderer } from '@vellusion/globe';
import { GeoJsonDataSource, DataSourceCollection, DataSourceDisplay } from '@vellusion/datasources';
import {
  Viewer, HomeButton, SceneModePicker, ZoomControls, NavigationHelp,
  BaseLayerPicker, Geocoder, Timeline, AnimationControls,
  FullscreenButton, PerformanceDisplay,
  ThemeManager,
} from '@vellusion/widgets';
import type { ProviderViewModel } from '@vellusion/widgets';

async function main() {
  // Create Viewer (sets up container + canvas + toolbar)
  const viewer = new Viewer({
    container: 'viewer-container',
    infoBox: true,
    selectionIndicator: true,
    creditDisplay: true,
  });

  const canvas = viewer.canvas;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;

  // Apply dark theme
  ThemeManager.applyTheme(viewer.container, 'dark');

  // GPU Context
  const ctx = await GPUContext.create({ canvas });

  // Camera
  const camera = new PerspectiveCamera(Math.PI / 4, canvas.width / canvas.height, 100, 1e9);
  const defaultPos = Cartographic.fromDegrees(0, 20, 25000000);
  const cameraPos = Vec3.zero();
  Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, defaultPos, cameraPos);
  camera.setPosition(cameraPos[0], cameraPos[1], cameraPos[2]);
  camera.lookAtTarget(Vec3.zero());
  camera.update();

  // Camera Controller
  const eventHandler = new ScreenSpaceEventHandler(canvas);
  const controller = new ScreenSpaceCameraController(camera, eventHandler, {
    rotateSpeed: 0.003, zoomSpeed: 0.3,
    minimumZoomDistance: 6400000, maximumZoomDistance: 100000000,
  });

  // Globe
  const globe = new Globe();
  const globeRenderer = new GlobeRenderer(ctx, globe);
  const globeShader = `
struct Uniforms { mvp: mat4x4f };
@group(0) @binding(0) var<uniform> u: Uniforms;
struct V { @builtin(position) p: vec4f, @location(0) n: vec3f, @location(1) uv: vec2f };
@vertex fn vs_main(@location(0) pos: vec3f, @location(1) n: vec3f, @location(2) uv: vec2f) -> V {
  var o: V; o.p = u.mvp * vec4f(pos, 1.0); o.n = n; o.uv = uv; return o;
}
@fragment fn fs_main(i: V) -> @location(0) vec4f {
  let l = normalize(vec3f(0.5, 1.0, 0.3));
  let d = max(dot(normalize(i.n), l), 0.15);
  return vec4f(vec3f(0.1, 0.3 + i.uv.y * 0.4, 0.2 + i.uv.x * 0.3) * d, 1.0);
}`;
  globeRenderer.initPipeline(globeShader);

  // Data Sources
  const dsCollection = new DataSourceCollection();
  const geojsonDs = await GeoJsonDataSource.load({
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [-73.985, 40.748] }, properties: { name: 'New York' } },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [2.352, 48.856] }, properties: { name: 'Paris' } },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [139.691, 35.689] }, properties: { name: 'Tokyo' } },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [116.407, 39.904] }, properties: { name: 'Beijing' } },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [151.209, -33.868] }, properties: { name: 'Sydney' } },
    ],
  });
  await dsCollection.add(geojsonDs);
  const display = new DataSourceDisplay({ dataSourceCollection: dsCollection });
  display.update({} as any);

  // --- UI Widgets ---
  const toolbar = viewer.toolbar;

  // Home button
  new HomeButton(toolbar, () => {
    Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, defaultPos, cameraPos);
    camera.setPosition(cameraPos[0], cameraPos[1], cameraPos[2]);
    camera.lookAtTarget(Vec3.zero());
  });

  // Scene mode picker
  new SceneModePicker(toolbar, (mode) => {
    console.log(`Scene mode: ${mode}`);
  });

  // Zoom controls
  new ZoomControls(toolbar, {
    onZoomIn: () => {
      const p = camera.position;
      const d = Math.sqrt(p[0]**2 + p[1]**2 + p[2]**2);
      const scale = 0.8;
      camera.setPosition(p[0] * scale, p[1] * scale, p[2] * scale);
    },
    onZoomOut: () => {
      const p = camera.position;
      const scale = 1.25;
      camera.setPosition(p[0] * scale, p[1] * scale, p[2] * scale);
    },
  });

  // Navigation help
  new NavigationHelp(toolbar);

  // Base layer picker
  const providers: ProviderViewModel[] = [
    { name: 'OpenStreetMap', category: 'imagery', tooltip: 'OSM tiles' },
    { name: 'Satellite', category: 'imagery', tooltip: 'Satellite imagery' },
    { name: 'WGS84 Ellipsoid', category: 'terrain', tooltip: 'Smooth ellipsoid' },
  ];
  new BaseLayerPicker(toolbar, {
    providers,
    onSelect: (p) => console.log(`Selected: ${p.name}`),
  });

  // Geocoder
  new Geocoder(toolbar, {
    placeholder: 'Search...',
    onSelect: (result) => {
      console.log(`Fly to: ${result.displayName}`);
    },
  });

  // Fullscreen
  new FullscreenButton(toolbar, viewer.container);

  // Performance display
  const perfDisplay = new PerformanceDisplay(viewer.container);

  // Credits
  viewer.creditDisplay?.addCredit({ text: 'Vellusion', link: 'https://github.com/vellusion' });
  viewer.creditDisplay?.addCredit({ text: 'OpenStreetMap', link: 'https://www.openstreetmap.org' });

  // Timeline
  const clock = new Clock();
  new Timeline(viewer.container, {
    startTime: 0,
    stopTime: 86400,
    currentTime: 43200,
    onSeek: (t) => console.log(`Seek: ${t.toFixed(0)}s`),
  });

  // Animation controls
  new AnimationControls(viewer.container, {
    onPlay: () => console.log('Play'),
    onPause: () => console.log('Pause'),
    onSpeedChange: (s) => console.log(`Speed: ${s}x`),
  });

  // Depth texture
  let depthTexture = ctx.device.createTexture({
    size: [ctx.width, ctx.height], format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  console.log(`Vellusion Full Viewer initialized`);
  console.log(`  Entities: ${geojsonDs.entities.length}`);
  console.log(`  UI Components: Viewer, Globe, Camera, Controls, Toolbar`);

  // Render loop
  const loop = new FrameLoop((dt) => {
    controller.update(dt);
    camera.update();
    globeRenderer.update(camera.position, ctx.height, camera.fov);
    perfDisplay.update(dt);

    const encoder = ctx.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: ctx.getCurrentTexture().createView(),
        clearValue: { r: 0.0, g: 0.0, b: 0.02, a: 1.0 },
        loadOp: 'clear' as GPULoadOp, storeOp: 'store' as GPUStoreOp,
      }],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear' as GPULoadOp, depthStoreOp: 'store' as GPUStoreOp,
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
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
    depthTexture.destroy();
    depthTexture = ctx.device.createTexture({
      size: [ctx.width, ctx.height], format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    viewer.resize();
  });
}

main().catch(console.error);
