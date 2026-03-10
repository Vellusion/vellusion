// ---------------------------------------------------------------------------
// GroundPrimitive – geometry clamped to ground / terrain surface.
// ---------------------------------------------------------------------------

import { Primitive } from './Primitive';

/**
 * A primitive that drapes its geometry onto the terrain surface.
 * In the full implementation this would modify the depth state and
 * project geometry onto the terrain. Currently it inherits all
 * behaviour from {@link Primitive}.
 */
export class GroundPrimitive extends Primitive {}
