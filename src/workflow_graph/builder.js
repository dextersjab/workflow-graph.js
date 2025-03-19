/**
 * builder.js
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
import { NodeSpec, Branch } from './models.js';
import { CompiledGraph } from './executor.js';

class WorkflowGraph {
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
   * @param {string} nodeName 
   * @param {function} actionFn 
   * @param {object} [options] - Additional fields: callback, errorHandler, retryCount, retryDelay, etc.
   */
  addNode(nodeName, actionFn, options = {}) {
    // Check for reserved names
    if (nodeName === START || nodeName === END) {
      throw new InvalidNodeNameError(`"${nodeName}" is reserved.`);
    }
    if (this.nodes[nodeName]) {
      throw new DuplicateNodeError(`Node "${nodeName}" already exists.`);
    }

    const spec = new NodeSpec({
      action: actionFn,
      ...options
    });

    this.nodes[nodeName] = spec;
    return this;
  }

  /**
   * Add an edge between two existing nodes.
   * 
   * @param {string} fromNode 
   * @param {string} toNode 
   */
  addEdge(fromNode, toNode) {
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
   * @param {string} fromNode - The node from which branches originate
   * @param {function} pathFn - A function used to determine branch path from input
   * @param {Record<string | boolean, string>} pathMap - object mapping `true/false/...` to node names
   * @param {string} [branchKey] - optional identifier for the branch group
   */
  addConditionalEdges(fromNode, pathFn, pathMap, branchKey) {
    if (!this.branches[fromNode]) {
      this.branches[fromNode] = {};
    }
    const bKey = branchKey || pathFn.name || 'branch';
    const b = new Branch(pathFn, pathMap);
    this.branches[fromNode][bKey] = b;
    return this;
  }

  /**
   * Mark a node as an entry point. 
   * Typically you only need one, but you may have multiple entry points if desired.
   * 
   * @param {string} nodeName 
   */
  setEntryPoint(nodeName) {
    // If the node doesn't exist, create a START->nodeName edge
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
   * @param {string} nodeName 
   */
  setFinishPoint(nodeName) {
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
   * (You can expand or customize this as needed.)
   */
  validate() {
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
          throw new TypeMismatchError(`Type mismatch: ${start} outputs ${startSpec.outputType.name}, but ${end} expects ${endSpec.inputType.name}`);
        }
      }
    }
    // Additional validation can be added here
    return this;
  }

  /**
   * Compile the workflow graph into a CompiledGraph, which is actually runnable.
   * 
   * @returns {CompiledGraph} A compiled representation of the workflow graph
   */
  compile() {
    // Validate before compilation
    this.validate();

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
   * @param {any} inputData - The input to the graph
   * @returns {any} The result of execution
   */
  execute(inputData) {
    const compiled = this.compile();
    return compiled.execute(inputData);
  }

  /**
   * Convenience method to compile and execute the graph asynchronously with the given input
   * @param {any} inputData - The input to the graph
   * @returns {Promise<any>} A promise that resolves to the result of execution
   */
  async executeAsync(inputData) {
    const compiled = this.compile();
    return compiled.executeAsync(inputData);
  }

  /**
   * Convenience method to generate a Mermaid diagram
   * @returns {string} The Mermaid diagram
   */
  toMermaid() {
    const compiled = this.compile();
    return compiled.toMermaid();
  }
}

export {
  WorkflowGraph
};
