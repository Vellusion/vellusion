import type { Vec3Type } from '@vellusion/math';
import { Vec3 } from '@vellusion/math';

export type BoundingVolume =
  | { type: 'box'; center: Vec3Type; halfAxes: Float64Array } // 9 floats: 3 column vectors of half-axes matrix
  | { type: 'sphere'; center: Vec3Type; radius: number }
  | { type: 'region'; west: number; south: number; east: number; north: number; minHeight: number; maxHeight: number };

export function parseBoundingVolume(bv: any): BoundingVolume {
  if (bv.box) {
    const b = bv.box;
    return {
      type: 'box',
      center: Vec3.create(b[0], b[1], b[2]),
      halfAxes: new Float64Array(b.slice(3, 12)),
    };
  } else if (bv.sphere) {
    const s = bv.sphere;
    return {
      type: 'sphere',
      center: Vec3.create(s[0], s[1], s[2]),
      radius: s[3],
    };
  } else if (bv.region) {
    const r = bv.region;
    return {
      type: 'region',
      west: r[0], south: r[1], east: r[2], north: r[3],
      minHeight: r[4], maxHeight: r[5],
    };
  }
  throw new Error('Unknown bounding volume type');
}

export function distanceToBoundingVolume(bv: BoundingVolume, cameraPosition: Vec3Type): number {
  if (bv.type === 'sphere') {
    const dx = cameraPosition[0] - bv.center[0];
    const dy = cameraPosition[1] - bv.center[1];
    const dz = cameraPosition[2] - bv.center[2];
    return Math.max(0, Math.sqrt(dx * dx + dy * dy + dz * dz) - bv.radius);
  } else if (bv.type === 'box') {
    // Approximate: distance to center - max half-axis length
    const dx = cameraPosition[0] - bv.center[0];
    const dy = cameraPosition[1] - bv.center[1];
    const dz = cameraPosition[2] - bv.center[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    // Max half-axis length
    const h = bv.halfAxes;
    const l0 = Math.sqrt(h[0]*h[0] + h[1]*h[1] + h[2]*h[2]);
    const l1 = Math.sqrt(h[3]*h[3] + h[4]*h[4] + h[5]*h[5]);
    const l2 = Math.sqrt(h[6]*h[6] + h[7]*h[7] + h[8]*h[8]);
    return Math.max(0, dist - Math.max(l0, l1, l2));
  } else {
    // Region: approximate distance using center of region on ellipsoid
    // Simplified: return 0 for now (always visible)
    return 0;
  }
}
