import { GPUContext } from '@vellusion/core';
import { TextureWrapper, TEXTURE_USAGE } from '@vellusion/core';
import { beginRenderPass } from '@vellusion/core';
import { Scene } from './Scene';

export class SceneRenderer {
  private _gpuContext: GPUContext;
  private _scene: Scene;
  private _depthTexture: TextureWrapper | null = null;

  constructor(gpuContext: GPUContext, scene: Scene) {
    this._gpuContext = gpuContext;
    this._scene = scene;
  }

  render(): void {
    const scene = this._scene;
    const ctx = this._gpuContext;

    // Ensure depth texture matches canvas size
    this._ensureDepthTexture();

    // Create command encoder
    const encoder = ctx.device.createCommandEncoder();

    // Begin render pass
    const pass = beginRenderPass(encoder, {
      colorAttachments: [{
        view: ctx.getCurrentTexture().createView(),
        clearColor: scene.backgroundColor,
      }],
      depthStencilAttachment: this._depthTexture ? {
        view: this._depthTexture.createView(),
      } : undefined,
    });

    // TODO: Iterate visible scene nodes and draw renderables
    // For now, this is a pass-through that clears to backgroundColor

    pass.end();
    ctx.device.queue.submit([encoder.finish()]);
  }

  private _ensureDepthTexture(): void {
    const ctx = this._gpuContext;
    if (
      !this._depthTexture ||
      this._depthTexture.width !== ctx.width ||
      this._depthTexture.height !== ctx.height
    ) {
      this._depthTexture?.destroy();
      this._depthTexture = new TextureWrapper(ctx.device, {
        width: ctx.width,
        height: ctx.height,
        format: 'depth24plus',
        usage: TEXTURE_USAGE.RENDER_ATTACHMENT,
      });
    }
  }

  destroy(): void {
    this._depthTexture?.destroy();
    this._depthTexture = null;
  }
}
