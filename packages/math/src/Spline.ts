import type { Vec3Type } from './Vec3';
import { Vec3 } from './Vec3';

export interface SplineType {
  times: number[];
  points: Vec3Type[];
  evaluate(time: number, result: Vec3Type): Vec3Type;
}

export interface HermiteSplineType extends SplineType {
  inTangents: Vec3Type[];
  outTangents: Vec3Type[];
}

/**
 * Binary search to find the index i such that times[i] <= time < times[i+1].
 * Returns the clamped segment index.
 */
function findSegmentIndex(times: number[], time: number): number {
  const n = times.length;
  if (time <= times[0]) return 0;
  if (time >= times[n - 1]) return n - 2;

  // Binary search
  let low = 0;
  let high = n - 1;
  while (high - low > 1) {
    const mid = (low + high) >>> 1;
    if (times[mid] <= time) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return low;
}

export const LinearSpline = {
  create(times: number[], points: Vec3Type[]): SplineType {
    return {
      times,
      points,
      evaluate(time: number, result: Vec3Type): Vec3Type {
        const n = times.length;

        // Clamp to boundaries
        if (time <= times[0]) {
          result[0] = points[0][0];
          result[1] = points[0][1];
          result[2] = points[0][2];
          return result;
        }
        if (time >= times[n - 1]) {
          result[0] = points[n - 1][0];
          result[1] = points[n - 1][1];
          result[2] = points[n - 1][2];
          return result;
        }

        const i = findSegmentIndex(times, time);
        const t = (time - times[i]) / (times[i + 1] - times[i]);

        Vec3.lerp(points[i], points[i + 1], t, result);
        return result;
      },
    };
  },
} as const;

export const HermiteSpline = {
  create(
    times: number[],
    points: Vec3Type[],
    inTangents: Vec3Type[],
    outTangents: Vec3Type[],
  ): HermiteSplineType {
    return {
      times,
      points,
      inTangents,
      outTangents,
      evaluate(time: number, result: Vec3Type): Vec3Type {
        const n = times.length;

        // Clamp to boundaries
        if (time <= times[0]) {
          result[0] = points[0][0];
          result[1] = points[0][1];
          result[2] = points[0][2];
          return result;
        }
        if (time >= times[n - 1]) {
          result[0] = points[n - 1][0];
          result[1] = points[n - 1][1];
          result[2] = points[n - 1][2];
          return result;
        }

        const i = findSegmentIndex(times, time);
        const t = (time - times[i]) / (times[i + 1] - times[i]);

        const t2 = t * t;
        const t3 = t2 * t;

        // Hermite basis functions
        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;

        const p0 = points[i];
        const p1 = points[i + 1];
        const m0 = outTangents[i];
        const m1 = inTangents[i + 1];

        result[0] = h00 * p0[0] + h10 * m0[0] + h01 * p1[0] + h11 * m1[0];
        result[1] = h00 * p0[1] + h10 * m0[1] + h01 * p1[1] + h11 * m1[1];
        result[2] = h00 * p0[2] + h10 * m0[2] + h01 * p1[2] + h11 * m1[2];

        return result;
      },
    };
  },
} as const;

export const CatmullRomSpline = {
  create(times: number[], points: Vec3Type[]): SplineType {
    // Compute tangents from neighboring points
    const n = points.length;
    const tangents: Vec3Type[] = new Array(n);

    // Endpoint tangent: m_0 = p_1 - p_0
    tangents[0] = Vec3.subtract(points[1], points[0], Vec3.zero());

    // Interior tangents: m_i = (p_{i+1} - p_{i-1}) / 2
    for (let i = 1; i < n - 1; i++) {
      const diff = Vec3.subtract(points[i + 1], points[i - 1], Vec3.zero());
      tangents[i] = Vec3.scale(diff, 0.5, diff);
    }

    // Endpoint tangent: m_n = p_n - p_{n-1}
    tangents[n - 1] = Vec3.subtract(points[n - 1], points[n - 2], Vec3.zero());

    // Use Hermite with computed tangents (inTangents = outTangents = tangents)
    return HermiteSpline.create(times, points, tangents, tangents);
  },
} as const;
