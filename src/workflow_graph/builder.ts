/**
 * builder.ts
 * Contains the WorkflowGraph class for constructing and validating workflow graphs.
 */

import { START, END } from './constants.js';
import {
  WorkflowGraphError,
  InvalidNodeNameError,
  DuplicateNodeError,
  InvalidEdgeError,
  TypeMismatchError
} from './exceptions.js';
import { NodeSpec, NodeAction, NodeSpecOptions, Branch, BranchEnds, PathFunction } from './models.js';
import { Nodes, Branches, Edge } from './types.js';

/**
 * CompiledGraph interface to avoid circular dependency
 */
interface ICompiledGraph {
  validate(): ICompiledGraph;
  execute<InputType = any, OutputType = any>(
    inputData: InputType, 
    callback?: (message: string) => void
  ): Promise<OutputType>;
  executeAsync<InputType = any, OutputType = any>(
    inputData: InputType, 
    callback?: (message: string) => void
  ): Promise<OutputType>;
  toMermaid(): string;
}

export class WorkflowGraph {
  nodes: Nodes;
  edges: Edge[];
  branches: Branches;
  entryPoints: Set<string>;
  finishPoints: Set<string>;

  constructor() {
    this.nodes = {};           // nodeName => NodeSpec
    this.edges = [];           // array of [startNode, endNode]
    this.branches = {};        // nodeName => {someIdentifier: Branch}
    this.entryPoints = new Set(); // which node(s) are entry points
    this.finishPoints = new Set(); // which node(s) are exit points
  }

  /**
   * Add a node to the workflow.
   * 
   * @param nodeName - Name of the node to add
   * @param actionFn - The function to execute for this node
   * @param options - Additional configuration for the node
   */
  addNode<InputType = any, OutputType = any>(
    nodeName: string, 
    actionFn: NodeAction<InputType, OutputType>, 
    options: Omit<NodeSpecOptions<InputType, OutputType>, 'action'> = {}
  ): WorkflowGraph {
    // Check for reserved names
    if (nodeName === START || nodeName === END) {
      throw new InvalidNodeNameError(`"${nodeName}" is reserved.`);
    }
    if (this.nodes[nodeName]) {
      throw new DuplicateNodeError(`Node "${nodeName}" already exists.`);
    }

    const spec = new NodeSpec<InputType, OutputType>({
      action: actionFn,
      ...options
    });

    this.nodes[nodeName] = spec;
    return this;
  }

  /**
   * Add an edge between two existing nodes.
   * 
   * @param fromNode - Source node name
   * @param toNode - Target node name
   */
  addEdge(fromNode: string, toNode: string): WorkflowGraph {
    if (![START, END].includes(fromNode) && !this.nodes[fromNode]) {
      throw new InvalidEdgeError(`Node "${fromNode}" does not exist.`);
    }
    if (![START, END].includes(toNode) && !this.nodes[toNode]) {
      throw new InvalidEdgeError(`Node "${toNode}" does not exist.`);
    }
    this.edges.push([fromNode, toNode]);
    return this;
  }

  /**
   * Add conditional edges originating from a node.
   * This is how we handle branching logic.
   * 
   * @param fromNode - The node from which branches originate
   * @param pathFn - A function used to determine branch path from input
   * @param pathMap - Object mapping condition values to node names
   * @param branchKey - Optional identifier for the branch group
   */
  addConditionalEdges<T = any>(
    fromNode: string, 
    pathFn: PathFunction<T>, 
    pathMap: BranchEnds, 
    branchKey?: string
  ): WorkflowGraph {
    if (!this.branches[fromNode]) {
      this.branches[fromNode] = {};
    }
    const bKey = branchKey || pathFn.name || 'branch';
    const b = new Branch<T>(pathFn, pathMap);
    this.branches[fromNode][bKey] = b;
    return this;
  }

  /**
   * Mark a node as an entry point. 
   * Typically you only need one, but you may have multiple entry points if desired.
   * 
   * @param nodeName - The name of the node to mark as entry point
   */
  setEntryPoint(nodeName: string): WorkflowGraph {
    // If the node doesn't exist, throw error
    if (!this.nodes[nodeName]) {
      throw new InvalidNodeNameError(`Entry node "${nodeName}" does not exist.`);
    }
    this.entryPoints.add(nodeName);
    // Add an edge from START => nodeName
    this.edges.push([START, nodeName]);
    return this;
  }

  /**
   * Mark a node as a finish point. 
   * Typically you only need one, but you can have multiple finish points.
   * 
   * @param nodeName - The name of the node to mark as finish point
   */
  setFinishPoint(nodeName: string): WorkflowGraph {
    if (!this.nodes[nodeName]) {
      throw new InvalidNodeNameError(`Finish node "${nodeName}" does not exist.`);
    }
    this.finishPoints.add(nodeName);
    // Add an edge from nodeName => END
    this.edges.push([nodeName, END]);
    return this;
  }

  /**
   * Validate the graph for name collisions, type mismatches, etc.
   */
  validate(): WorkflowGraph {
    // Example: check for type mismatches
    // For each edge, if either node has type constraints, verify they match
    for (const [start, end] of this.edges) {
      if ([START, END].includes(start) || [START, END].includes(end)) {
        // skip
        continue;
      }
      const startSpec = this.nodes[start];
      const endSpec = this.nodes[end];
      if (startSpec.outputType && endSpec.inputType) {
        if (startSpec.outputType !== endSpec.inputType) {
          throw new TypeMismatchError(
            `Type mismatch: ${start} outputs ${startSpec.outputType.name}, but ${end} expects ${endSpec.inputType.name}`
          );
        }
      }
    }
    // Additional validation can be added here
    return this;
  }

  /**
   * Compile the workflow graph into a CompiledGraph, which is actually runnable.
   * 
   * @returns A compiled representation of the workflow graph
   */
  async compile(): Promise<ICompiledGraph> {
    // Validate before compilation
    this.validate();

    // Dynamically import CompiledGraph to avoid circular dependency
    const executorModule = await import('./executor.js');
    const CompiledGraph = executorModule.CompiledGraph;
    
    const compiled = new CompiledGraph(
      this.nodes,
      this.edges,
      this.branches
    );
    // Optionally call compiled.validate() to ensure it's fully valid (reachable, etc.)
    compiled.validate();
    return compiled;
  }

  /**
   * Convenience method to compile and execute the graph with the given input
   * @param inputData - The input to the graph
   * @param callback - Optional callback function for node execution messages
   * @returns The result of execution
   */
  async execute<InputType = any, OutputType = any>(
    inputData: InputType, 
    callback?: (message: string) => void
  ): Promise<OutputType> {
    const compiled = await this.compile();
    return compiled.execute(inputData, callback);
  }

  /**
   * Convenience method to compile and execute the graph asynchronously with the given input
   * @param inputData - The input to the graph
   * @param callback - Optional callback function for node execution messages
   * @returns A promise that resolves to the result of execution
   */
  async executeAsync<InputType = any, OutputType = any>(
    inputData: InputType, 
    callback?: (message: string) => void
  ): Promise<OutputType> {
    const compiled = await this.compile();
    return compiled.executeAsync(inputData, callback);
  }

  /**
   * Convenience method to generate a Mermaid diagram
   * @returns The Mermaid diagram
   */
  async toMermaid(): Promise<string> {
    const compiled = await this.compile();
    return compiled.toMermaid();
  }
} 