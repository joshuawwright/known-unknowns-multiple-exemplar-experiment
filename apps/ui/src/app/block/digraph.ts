/**
 * Represents a node in a graph.
 */
import { StimuliComparisonTuple } from '../study-conditions/stimuli.interfaces';

export class Node {

  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Returns a printable representation of the given object. When the result
   * from repr() is passed to eval(), we will get a copy of the original object
   * @returns {string}
   */
  repr(): string {
    return `new DigraphNode('${this.name}')`;
  }

  toString(): string {
    return this.name;
  }

}

/***
 * Represents an edge in the dictionary. Includes a source and a destination.
 */
export class Edge {

  readonly dest: Node;
  readonly src: Node;

  constructor(src: Node, dest: Node) {
    this.dest = dest;
    this.src = src;
  }

  toString(): string {
    return `${this.src}->${this.dest}`;
  }

}

export enum RelationType {
  identity = 'identity',
  trained = 'trained',
  mutuallyEntailed = 'mutually entailed',
  combinatoriallyEntailed = 'combinatorially entailed'
}

/***
 * Represents an weighted edge in the dictionary. Includes a source and a destination.
 */
export class RelationalEdge<T extends RelationType> extends Edge {

  readonly relation: string;
  readonly relationType: T;

  constructor(src: Node, dest: Node, cue: string, relationType: T) {
    super(src, dest);
    this.relation = cue;
    this.relationType = relationType;
  }

  toString() {
    return `${this.src}->${this.dest} (${this.relation}, ${this.relationType})`;
  }

}

/***
 * Represents a directed graph of Node and Edge objects
 */
export class DiGraph<T extends Edge> {
  protected edges: Map<Node, T[]> = new Map<Node, T[]>();
  protected nodes: Set<Node> = new Set();

  addEdge(edge: T) {
    const src = edge.src;
    const dest = edge.dest;
    if (!this.hasNode(src)) throw Error(`addEdge failed source node "${src.toString()}" is not in graph.`);
    if (!this.hasNode(dest)) throw Error(`addEdge failed destination node "${dest.toString()}" is not in graph.`);
    this.edges.set(edge.src, (this.edges.get(edge.src) as T[]).concat(edge));
  }

  addNode(node: Node): void {
    if (this.nodes.has(node)) throw Error(`addNode failed node "${node.toString()}" already exists`);
    this.nodes.add(node);
    this.edges.set(node, []);
  }

  getEdgesForNode(node: Node): T[] {
    return this.edges.get(node) || [];
  }

  hasNode(node: Node): boolean {
    return this.nodes.has(node);
  }

  toString(): string {
    return Array.from(this.edges.values())
      .flat()
      .filter(Boolean)
      .map((edge) => edge.toString()).join('\n');
  }

}

export interface StimuliComparisonGeneric {
  relation: string;
  relationType: string;
  stimuli: StimuliComparisonTuple;
}

export class RelationalFrameGraph extends DiGraph<RelationalEdge<RelationType>> {

  reverseRelationDictionary: { [key: string]: string };
  selfRelation: string;
  unknownRelation: string;

  constructor(identityRelation: string, unknownRelation: string, reverseRelationDictionary: { [key: string]: string }) {
    super();
    this.selfRelation = identityRelation;
    this.unknownRelation = unknownRelation;
    this.reverseRelationDictionary = reverseRelationDictionary;
  }

  get identities(): StimuliComparisonGeneric[] {
    return [...this.nodes].map(node => ({
      relation: this.selfRelation,
      relationType: RelationType.identity,
      stimuli: [node.name, node.name]
    }));
  }

  get trained(): StimuliComparisonGeneric[] {
    return [...this.edges.values()].flat().filter(edge => edge.relationType === RelationType.trained).map(edge => ({
      relation: this.selfRelation,
      relationType: RelationType.trained,
      stimuli: [edge.src.name, edge.dest.name]
    }));
  }

  /**
   * Adds trained and mutually entailed relational edges
   * @param {RelationalEdge<RelationType.trained>} edge
   */
  addTrainedAndMutualRelations(edge: RelationalEdge<RelationType.trained>) {
    const src = edge.src;
    const dest = edge.dest;
    if (!this.hasNode(src)) throw Error(`addEdge failed source node "${src.toString()}" is not in graph.`);
    if (!this.hasNode(dest)) throw Error(`addEdge failed destination node "${dest.toString()}" is not in graph.`);
    if (!this.reverseRelationDictionary?.[edge.relation]) throw Error(
      `Could not find inverse of relation ${edge.relation}`);
    this.edges.set(edge.src, (this.edges.get(edge.src) as RelationalEdge<RelationType>[]).concat(edge));
    this.edges.set(edge.dest, (this.edges.get(edge.dest) as RelationalEdge<RelationType>[]).concat(
      new RelationalEdge(
        edge.dest,
        edge.src,
        this.reverseRelationDictionary[edge.relation],
        RelationType.mutuallyEntailed)));
  }

  findPathway(
    startNode: Node,
    endNode: Node,
    path: Node[] = [],
    paths: Node[][] = []
  ): Node[][] {
    path = [...path].concat(startNode);
    if (startNode === endNode) {
      return paths.concat(path);
    } else {
      for (const edge of this.getEdgesForNode(startNode)) {
        // Avoid cycles
        if (!path.includes(edge.dest) || !path.includes(startNode)) {
          const newPath = this.findPathway(edge.dest, endNode, [...path], paths);
          if (newPath.length) {
            paths = paths.concat(newPath);
          }
        }
      }
      return [...paths];
    }
  }

  validate() {
    const nodes = [[...this.nodes][0]];
    for (const startNode of nodes) {
      for (const endNode of nodes) {
        if (startNode === endNode) continue;
        this.findPathway(startNode, endNode);
      }
    }
  }

}

// TESTS

// const graph = new DiGraph();
// const nodeA = new Node('a');
// const nodeB = new Node('b');
// const nodeC = new Node('c');
//
// graph.addNode(nodeA);
// graph.addNode(nodeB);
// graph.addNode(nodeC);
//
// const edge1 = new WeightedEdge(nodeA, nodeB, 'GREATER THAN');
// const edge2 = new WeightedEdge(nodeA, nodeC, 'LESS THAN');
// const edge3 = new WeightedEdge(nodeB, nodeC, 'EQUAL TO');
//
// graph.addEdge(edge1);
// graph.addEdge(edge2);
// graph.addEdge(edge3);

// console.log(`edge1.toString() === "a->b (15, 10)"`, edge1.toString() === 'a->b (15, 10)');
// console.log(`edge2.toString() === "a->c (14, 6)"`, edge2.toString() === 'a->c (14, 6)');
// console.log(`edge3.toString() === "b->c (3, 1)"`, edge3.toString() === 'b->c (3, 1)');
// console.log('');

// console.log(graph.toString());

// const nodeNotInGraph = new Node('q');
// const edgeNoSrc = new WeightedEdge(nodeNotInGraph, nodeB, 'SAME');
// const edgeNoDest = new WeightedEdge(nodeA, nodeNotInGraph, 'SAME');
//
// try {
//   graph.addEdge(edgeNoSrc);
// }
// catch (e) {
//   console.log('graph.addEdge(edgeNoSrc)',
//     e.message === `addEdge failed source node "${edgeNoSrc.src.name}" is not in graph.`);
// }
//
// try {
//   graph.addEdge(edgeNoDest);
// }
// catch (e) {
//   console.log('graph.addEdge(edgeNoDest)',
//     e.message === `addEdge failed destination node "${edgeNoDest.dest.name}" is not in graph.`);
// }
//
// console.log(`graph.toString()`, graph.toString() === `a->b (15, 10)\na->c (14, 6)\nb->c (3, 1)`, graph.toString());
