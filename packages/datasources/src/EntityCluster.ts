/**
 * Configuration for clustering entities that are close together on screen.
 */
export class EntityCluster {
  /** Whether clustering is enabled. */
  enabled: boolean;

  /** Screen-space pixel range within which entities are clustered. */
  pixelRange: number;

  /** Minimum number of entities before a cluster is formed. */
  minimumClusterSize: number;

  constructor(options?: {
    enabled?: boolean;
    pixelRange?: number;
    minimumClusterSize?: number;
  }) {
    this.enabled = options?.enabled ?? false;
    this.pixelRange = options?.pixelRange ?? 80;
    this.minimumClusterSize = options?.minimumClusterSize ?? 2;
  }
}
