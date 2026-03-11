import { describe, it, expect } from 'vitest';

describe('@vellusion/vellusion re-exports', () => {
  it('exports math types', async () => {
    const mod = await import('@vellusion/vellusion');
    expect(mod.Vec3).toBeDefined();
    expect(mod.Mat4).toBeDefined();
    expect(mod.Quaternion).toBeDefined();
    expect(mod.Ellipsoid).toBeDefined();
  });

  it('exports core types', async () => {
    const mod = await import('@vellusion/vellusion');
    expect(mod.GPUContext).toBeDefined();
    expect(mod.FrameLoop).toBeDefined();
  });

  it('exports scene types', async () => {
    const mod = await import('@vellusion/vellusion');
    expect(mod.PerspectiveCamera).toBeDefined();
    expect(mod.Clock).toBeDefined();
  });

  it('exports globe types', async () => {
    const mod = await import('@vellusion/vellusion');
    expect(mod.Globe).toBeDefined();
  });

  it('exports geometry types', async () => {
    const mod = await import('@vellusion/vellusion');
    expect(mod.BoxGeometry).toBeDefined();
  });

  it('exports datasources types', async () => {
    const mod = await import('@vellusion/vellusion');
    expect(mod.GeoJsonDataSource).toBeDefined();
    expect(mod.Entity).toBeDefined();
  });

  it('exports tiles3d types', async () => {
    const mod = await import('@vellusion/vellusion');
    expect(mod.Tileset3D).toBeDefined();
  });

  it('exports model types', async () => {
    const mod = await import('@vellusion/vellusion');
    expect(mod.GltfParser).toBeDefined();
    expect(mod.PbrMaterial).toBeDefined();
  });

  it('exports particles types', async () => {
    const mod = await import('@vellusion/vellusion');
    expect(mod.ParticleSystem).toBeDefined();
  });

  it('exports analysis types', async () => {
    const mod = await import('@vellusion/vellusion');
    expect(mod.DistanceMeasurement).toBeDefined();
    expect(mod.SlopeAnalysis).toBeDefined();
  });

  it('exports widgets types', async () => {
    const mod = await import('@vellusion/vellusion');
    expect(mod.Viewer).toBeDefined();
    expect(mod.Widget).toBeDefined();
  });
});
