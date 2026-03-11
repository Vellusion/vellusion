import { Vec3, Cartographic } from '@vellusion/math';
import {
  DistanceMeasurement, AreaMeasurement, HeightMeasurement, AngleMeasurement,
  SlopeAnalysis, AspectAnalysis, ContourGenerator, FloodAnalysis,
  ProfileAnalysis, CutFillAnalysis,
  LineOfSight, Viewshed,
} from '@vellusion/analysis';
import type { TerrainSampler } from '@vellusion/analysis';

function main() {
  const output = document.getElementById('output')!;
  const log = (msg: string) => { output.textContent += msg + '\n'; };

  log('=== Vellusion Analysis Demo ===\n');

  // 1. Distance measurements
  log('--- Distance Measurements ---');
  const nyc = Cartographic.fromDegrees(-74.006, 40.7128, 0);
  const london = Cartographic.fromDegrees(-0.1278, 51.5074, 0);
  const dist = DistanceMeasurement.geodesicDistance(nyc, london);
  log(`NYC to London (geodesic): ${(dist / 1000).toFixed(0)} km`);

  const p1 = Vec3.create(0, 0, 0);
  const p2 = Vec3.create(3, 4, 0);
  log(`Straight line distance: ${DistanceMeasurement.straightLineDistance(p1, p2).toFixed(2)} m`);

  // 2. Area measurement
  log('\n--- Area Measurements ---');
  const square = [Vec3.create(0,0,0), Vec3.create(10,0,0), Vec3.create(10,10,0), Vec3.create(0,10,0)];
  log(`10x10 square area: ${AreaMeasurement.planarArea(square).toFixed(1)} m²`);

  // 3. Height measurement
  log('\n--- Height Measurements ---');
  const ground = Vec3.create(0, 0, 6371000);
  const top = Vec3.create(0, 0, 6371100);
  log(`Vertical distance: ${HeightMeasurement.verticalDistance(ground, top).toFixed(1)} m`);

  // 4. Angle measurement
  log('\n--- Angle Measurements ---');
  const a = Vec3.create(1, 0, 0);
  const vertex = Vec3.create(0, 0, 0);
  const b = Vec3.create(0, 1, 0);
  const angle = AngleMeasurement.angleBetween(a, vertex, b);
  log(`Right angle: ${AngleMeasurement.toDegrees(angle).toFixed(1)}°`);

  // 5. Terrain analysis (5x5 grid)
  log('\n--- Terrain Analysis ---');
  const grid = new Float32Array([
    10, 12, 15, 18, 20,
    11, 14, 17, 20, 22,
    13, 16, 20, 23, 25,
    15, 18, 22, 25, 28,
    17, 20, 24, 27, 30,
  ]);
  const slopes = SlopeAnalysis.analyze(grid, 5, 5, 10);
  log(`Center slope: ${(slopes[12] * 180 / Math.PI).toFixed(1)}°`);
  const aspects = AspectAnalysis.analyze(grid, 5, 5, 10);
  log(`Center aspect: ${(aspects[12] * 180 / Math.PI).toFixed(1)}°`);
  const contours = ContourGenerator.generate(grid, 5, 5, 10, 5);
  log(`Contour lines (interval 5m): ${contours.length} levels`);

  // 6. Flood analysis
  log('\n--- Flood Analysis ---');
  const flood = FloodAnalysis.analyze(grid, 5, 5, 18);
  const flooded = flood.reduce((s, v) => s + v, 0);
  log(`Water level 18m: ${flooded}/${flood.length} cells flooded`);

  // 7. Cut/Fill
  log('\n--- Cut/Fill Analysis ---');
  const design = new Float32Array(25).fill(20);
  const result = CutFillAnalysis.analyze(grid, design, 5, 5, 10);
  log(`Cut: ${result.cutVolume.toFixed(0)} m³, Fill: ${result.fillVolume.toFixed(0)} m³, Net: ${result.netVolume.toFixed(0)} m³`);

  // 8. Line of Sight
  log('\n--- Line of Sight ---');
  const flatTerrain: TerrainSampler = { getHeight: () => 0 };
  const los = LineOfSight.analyze(
    new Float64Array([0, 0, 100]),
    new Float64Array([0.01, 0.01, 100]),
    flatTerrain,
  );
  log(`LOS over flat terrain: ${los.isVisible ? 'Visible' : 'Obstructed'}`);

  // 9. Viewshed
  log('\n--- Viewshed Analysis ---');
  const viewshed = Viewshed.analyze(
    new Float64Array([0, 0, 50]),
    flatTerrain,
    { horizontalFov: Math.PI / 3, verticalFov: Math.PI / 4, direction: 0, distance: 1000, resolution: 8 },
  );
  const visibleCount = viewshed.visibility.reduce((s, v) => s + v, 0);
  log(`Viewshed (8x8 grid): ${visibleCount}/${viewshed.width * viewshed.height} cells visible`);

  // 10. Profile
  log('\n--- Elevation Profile ---');
  const hillTerrain: TerrainSampler = {
    getHeight: (lon: number, _lat: number) => Math.sin(lon * 1000) * 50 + 100,
  };
  const profile = ProfileAnalysis.generateProfile(
    [new Float64Array([0, 0]), new Float64Array([0.01, 0])],
    hillTerrain,
    10,
  );
  log(`Profile samples: ${profile.heights.length}, total distance: ${profile.totalDistance.toFixed(0)} m`);

  log('\n=== Demo Complete ===');
}

main();
