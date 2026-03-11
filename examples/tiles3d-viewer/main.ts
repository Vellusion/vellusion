import { GPUContext, FrameLoop } from '@vellusion/core';
import { PerspectiveCamera, ScreenSpaceEventHandler, ScreenSpaceCameraController } from '@vellusion/scene';
import { Vec3, Ellipsoid, Cartographic } from '@vellusion/math';
import { Globe, GlobeRenderer } from '@vellusion/globe';
import {
  Tileset3D, Tileset3DTraversal, RequestScheduler, TileCache,
  Tileset3DStyle, Tile3DFeatureTable,
} from '@vellusion/tiles3d';

// Sample tileset.json (inline for demo — no real tile server needed)
const sampleTilesetJson = {
  asset: { version: '1.0' },
  geometricError: 500,
  root: {
    boundingVolume: { sphere: [0, 0, 6378137, 100000] },
    geometricError: 200,
    refine: 'REPLACE',
    content: { uri: 'root.b3dm' },
    children: [
      {
        boundingVolume: { sphere: [50000, 0, 6378137, 50000] },
        geometricError: 50,
        content: { uri: 'child0.b3dm' },
      },
      {
        boundingVolume: { sphere: [-50000, 0, 6378137, 50000] },
        geometricError: 50,
        content: { uri: 'child1.b3dm' },
      },
    ],
  },
};

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  const ctx = await GPUContext.create({ canvas });

  const camera = new PerspectiveCamera(Math.PI / 4, canvas.width / canvas.height, 100, 1e9);
  const cameraCartographic = Cartographic.fromDegrees(0, 20, 20000000);
  const cameraPos = Vec3.zero();
  Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cameraCartographic, cameraPos);
  camera.setPosition(cameraPos[0], cameraPos[1], cameraPos[2]);
  camera.lookAtTarget(Vec3.zero());
  camera.update();

  const eventHandler = new ScreenSpaceEventHandler(canvas);
  const controller = new ScreenSpaceCameraController(camera, eventHandler, {
    rotateSpeed: 0.003,
    zoomSpeed: 0.3,
    minimumZoomDistance: 6400000,
    maximumZoomDistance: 100000000,
  });

  // Globe
  const globe = new Globe();
  const globeRenderer = new GlobeRenderer(ctx, globe);
  const globeShader = `
struct Uniforms { mvp: mat4x4f };
@group(0) @binding(0) var<uniform> u: Uniforms;

struct V {
  @builtin(position) p: vec4f,
  @location(0) n: vec3f,
  @location(1) uv: vec2f,
};

@vertex fn vs_main(
  @location(0) pos: vec3f,
  @location(1) n: vec3f,
  @location(2) uv: vec2f,
) -> V {
  var o: V;
  o.p = u.mvp * vec4f(pos, 1.0);
  o.n = n;
  o.uv = uv;
  return o;
}

@fragment fn fs_main(i: V) -> @location(0) vec4f {
  let l = normalize(vec3f(0.5, 1.0, 0.3));
  let d = max(dot(normalize(i.n), l), 0.15);
  return vec4f(vec3f(0.1, 0.3 + i.uv.y * 0.4, 0.2 + i.uv.x * 0.3) * d, 1.0);
}`;
  globeRenderer.initPipeline(globeShader);

  // 3D Tiles
  const tileset = Tileset3D.fromJson('http://example.com/tileset.json', sampleTilesetJson, {
    maximumScreenSpaceError: 16,
  });

  // Style
  const style = new Tileset3DStyle({
    color: "color('#3388ff')",
  });

  // Feature table demo
  const featureTable = new Tile3DFeatureTable(3, {
    height: [100, 200, 50],
    name: ['Building A', 'Building B', 'Building C'],
  });
  featureTable.applyStyle(style);

  // Scheduler and cache
  const scheduler = new RequestScheduler(6);
  const cache = new TileCache(256 * 1024 * 1024);

  console.log(`Tileset loaded: ${tileset.tileCount} tiles, version ${tileset.asset.version}`);
  console.log(`Root geometric error: ${tileset.root.geometricError}`);

  // Run initial traversal
  const result = Tileset3DTraversal.selectTiles(
    tileset.root, camera.position, ctx.height, camera.fov, tileset.maximumScreenSpaceError,
  );
  console.log(`Traversal: ${result.tilesVisited} visited, ${result.tilesToRender.length} to render, ${result.tilesToLoad.length} to load`);

  // Info display
  const info = document.getElementById('info');

  let depthTexture = ctx.device.createTexture({
    size: [ctx.width, ctx.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const loop = new FrameLoop((dt) => {
    controller.update(dt);
    camera.update();
    globeRenderer.update(camera.position, ctx.height, camera.fov);

    // Run 3D Tiles traversal each frame
    const traversal = Tileset3DTraversal.selectTiles(
      tileset.root, camera.position, ctx.height, camera.fov, tileset.maximumScreenSpaceError,
    );
    if (info) {
      info.textContent = `Tiles: ${traversal.tilesVisited} visited | ${traversal.tilesToRender.length} render | ${traversal.tilesToLoad.length} load | Cache: ${(cache.currentMemoryUsage / 1024 / 1024).toFixed(1)} MB`;
    }

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
