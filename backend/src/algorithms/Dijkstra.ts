import { Graph } from './Graph';
import { MinHeap } from './MinHeap';

export interface MatchResult {
  lenderId: string;
  cost: number;
}

/**
 * Dijkstra's Algorithm to find the optimal lenders based on an aggregate custom cost.
 * Cost = w1 * Distance + w2 * (1 / TrustScore) + w3 * ResponseTime
 * Note: Edges in our graph MUST represent this composite cost for this to work natively.
 */
export function findBestLendersDijkstra(graph: Graph, borrowerId: string, limit: number = 5): MatchResult[] {
  const distances = new Map<string, number>();
  const priorityQueue = new MinHeap<string>();
  const visited = new Set<string>();

  // Initialize distances
  const vertices = graph.getVertices();
  for (const v of vertices) {
    distances.set(v, Infinity);
  }
  
  distances.set(borrowerId, 0);
  priorityQueue.push(borrowerId, 0);

  const matchedUsers: MatchResult[] = [];

  while (!priorityQueue.isEmpty()) {
    const current = priorityQueue.pop();
    if (!current) break;

    const currentNode = current.element;

    if (visited.has(currentNode)) continue;
    visited.add(currentNode);

    // If it's not the borrower, it's a candidate lender.
    if (currentNode !== borrowerId) {
      matchedUsers.push({ lenderId: currentNode, cost: current.priority });
      if (matchedUsers.length >= limit) {
        // Return top N users early
        break;
      }
    }

    const neighbors = graph.getEdges(currentNode);
    for (const edge of neighbors) {
      if (!visited.has(edge.to)) {
        const newCost = distances.get(currentNode)! + edge.distance;
        if (newCost < (distances.get(edge.to) || Infinity)) {
          distances.set(edge.to, newCost);
          priorityQueue.push(edge.to, newCost);
        }
      }
    }
  }

  return matchedUsers;
}
