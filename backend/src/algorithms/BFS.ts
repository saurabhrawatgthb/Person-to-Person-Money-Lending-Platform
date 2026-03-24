import { Graph } from './Graph';

/**
 * BFS to find nearby users level-by-level
 * Level 1: Immediate connections (e.g., highly trusted or physically closest network)
 * Level 2: Connections of connections
 */
export function findUsersInRadiusBFS(
  graph: Graph,
  startNode: string,
  maxLevels: number = 3
): string[] {
  const result: string[] = [];
  const visited = new Set<string>();
  let queue: { node: string; level: number }[] = [];

  queue.push({ node: startNode, level: 0 });
  visited.add(startNode);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const { node, level } = current;

    if (level > 0 && level <= maxLevels) {
      result.push(node);
    }

    if (level < maxLevels) {
      const neighbors = graph.getEdges(node);
      for (const edge of neighbors) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push({ node: edge.to, level: level + 1 });
        }
      }
    }
  }

  return result;
}
