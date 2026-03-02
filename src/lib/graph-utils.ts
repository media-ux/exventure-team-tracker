// src/lib/graph-utils.ts

/**
 * Get color for a node based on its project ID.
 * Colors map to team assignments per user requirement:
 * - Seraph (Science) → green
 * - X150 (AI) → purple
 * - IntelliBot/OpenClaw (crossover) → cyan
 * - Unassigned/Company → gray
 */
export function getProjectColor(projectId: string | undefined): string {
  if (!projectId) return '#999999'; // gray for company/unassigned

  // Map known project IDs to colors
  // Note: In production, these would be populated from database
  // For now, we match by project ID patterns or use default
  const colorMap: Record<string, string> = {
    // Will be populated with actual UUIDs from database
    // Fallback: hash projectId to consistent color
  };

  return colorMap[projectId] || '#999999';
}

/**
 * Calculate visual radius based on hierarchy level.
 * Larger nodes for higher hierarchy levels creates visual prominence.
 */
export function getNodeRadius(level: 'company' | 'project' | 'sub-unit' | 'task'): number {
  const radiusMap = {
    'company': 40,    // largest
    'project': 30,
    'sub-unit': 20,
    'task': 12        // smallest
  };
  return radiusMap[level];
}

/**
 * Return size value for ForceGraph2D's nodeVal prop.
 * Affects collision detection and force simulation spacing.
 * Slightly larger than visual radius for better spacing.
 */
export function getNodeSize(level: 'company' | 'project' | 'sub-unit' | 'task'): number {
  const sizeMap = {
    'company': 50,
    'project': 35,
    'sub-unit': 22,
    'task': 14
  };
  return sizeMap[level];
}
