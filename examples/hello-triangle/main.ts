import { GPUContext } from '@vellusion/core';

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;

  const ctx = await GPUContext.create({ canvas });

  // Load shader
  const shaderCode = await fetch(new URL('./triangle.wgsl', import.meta.url)).then(r => r.text());
  const shaderModule = ctx.device.createShaderModule({ code: shaderCode });

  // Create pipeline
  const pipeline = ctx.device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: shaderModule, entryPoint: 'vs_main' },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs_main',
      targets: [{ format: ctx.format }],
    },
    primitive: { topology: 'triangle-list' },
  });

  // Render loop
  function frame() {
    const encoder = ctx.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: ctx.getCurrentTexture().createView(),
        clearValue: { r: 0.05, g: 0.05, b: 0.05, a: 1.0 },
        loadOp: 'clear' as GPULoadOp,
        storeOp: 'store' as GPUStoreOp,
      }],
    });
    pass.setPipeline(pipeline);
    pass.draw(3);
    pass.end();
    ctx.device.queue.submit([encoder.finish()]);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

main().catch(console.error);
