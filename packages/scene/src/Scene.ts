import { SceneNode } from './SceneNode';
import { Camera } from './Camera';
import { Clock } from './Clock';

export interface SceneOptions {
  camera: Camera;
  clock?: Clock;
}

export class Scene {
  readonly root: SceneNode;
  readonly camera: Camera;
  readonly clock: Clock;

  backgroundColor: { r: number; g: number; b: number; a: number } = { r: 0, g: 0, b: 0, a: 1 };

  constructor(options: SceneOptions) {
    this.root = new SceneNode('root');
    this.camera = options.camera;
    this.clock = options.clock ?? new Clock();
  }

  add(node: SceneNode): void {
    this.root.addChild(node);
  }

  remove(node: SceneNode): void {
    this.root.removeChild(node);
  }

  update(deltaTime: number): void {
    // 1. Advance clock
    this.clock.tick(deltaTime);
    // 2. Update world matrices
    this.root.updateWorldMatrix();
    // 3. Update camera
    this.camera.update();
  }
}
