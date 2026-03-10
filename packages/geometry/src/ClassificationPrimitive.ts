// ---------------------------------------------------------------------------
// ClassificationPrimitive – classifies intersecting terrain / 3D Tiles.
// ---------------------------------------------------------------------------

import { GeometryInstance } from './GeometryInstance';
import type { Appearance } from './Appearance';
import { Primitive } from './Primitive';

export type ClassificationType = 'terrain' | 'tiles3d' | 'both';

export class ClassificationPrimitive extends Primitive {
  classificationType: ClassificationType;

  constructor(options: {
    geometryInstances: GeometryInstance | GeometryInstance[];
    appearance: Appearance;
    classificationType?: ClassificationType;
    show?: boolean;
  }) {
    super(options);
    this.classificationType = options.classificationType ?? 'both';
  }
}
