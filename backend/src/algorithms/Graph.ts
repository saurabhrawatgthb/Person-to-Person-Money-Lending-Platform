export interface GraphEdge {
  to: string;       // User ID
  distance: number; // Distance in arbitrary units
}

export class Graph {
  private adjacencyList: Map<string, GraphEdge[]>;

  constructor() {
    this.adjacencyList = new Map();
  }

  addVertex(vertex: string) {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []);
    }
  }

  addEdge(vertex1: string, vertex2: string, distance: number) {
    if (!this.adjacencyList.has(vertex1)) this.addVertex(vertex1);
    if (!this.adjacencyList.has(vertex2)) this.addVertex(vertex2);

    // Assuming undirected graph for peer connections
    this.adjacencyList.get(vertex1)?.push({ to: vertex2, distance });
    this.adjacencyList.get(vertex2)?.push({ to: vertex1, distance });
  }

  getEdges(vertex: string): GraphEdge[] {
    return this.adjacencyList.get(vertex) || [];
  }

  getVertices(): string[] {
    return Array.from(this.adjacencyList.keys());
  }

  // Detect cyclic lending rings (fraud detection)
  detectCycles(startNode: string): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string, parent: string): boolean => {
      visited.add(node);
      recStack.add(node);

      const edges = this.getEdges(node);
      for (const edge of edges) {
        const neighbor = edge.to;
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, node)) return true;
        } else if (neighbor !== parent) {
          // If neighbor is visited and not the parent, a cycle exists
          return true;
        }
      }

      recStack.delete(node);
      return false;
    };

    return dfs(startNode, '');
  }
}
