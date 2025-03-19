/**
 * executor.ts
 * Contains the CompiledGraph class for executing workflow graphs.
 */

import { START, END } from './constants.js';
import { ExecutionError } from './exceptions.js';
import { Nodes, Branches, Edge, AdjacencyList } from './types.js';

import PQueue from 'p-queue'; 
// or any queue library you prefer; or you can stick to manual approaches with arrays.
// For minimal dependencies, you can skip PQueue entirely, but it's often nice for concurrency control.

import { setTimeout as delay } from 'timers/promises'; // Node 16+ syntax

/**
 * CompiledGraph
 * Represents a validated and ready-to-run workflow graph.
 */
export class CompiledGraph {
  nodes: Nodes;
  edges: AdjacencyList;
  branches: Branches;
  compiled: boolean;

  /**
   * @param nodes - Dictionary of nodeName => NodeSpec
   * @param edges - Array of tuples representing direct edges
   * @param branches - Nested structure for conditional edges
   */
  constructor(nodes: Nodes, edges: Edge[], branches: Branches) {
    this.nodes = nodes;
    // Convert edges array to adjacency list
    this.edges = {};
    for (const [start, end] of edges) {
      if (!this.edges[start]) {
        this.edges[start] = [];
      }
      this.edges[start].push(end);
    }
    this.branches = branches;
    this.compiled = false;
  }

  /**
   * Returns a Mermaid diagram representation of the workflow graph.
   * 
   * @returns A Mermaid diagram code block
   */
  toMermaid(): string {
    const mermaidLines: string[] = ['```mermaid', 'flowchart TD'];

    // Add special START/END nodes
    mermaidLines.push(`    ${START}["START"]`);
    mermaidLines.push(`    ${END}["END"]`);

    // Add user-defined nodes
    for (const nodeName of Object.keys(this.nodes)) {
      mermaidLines.push(`    ${nodeName}["${nodeName}"]`);
    }

    // Add direct edges
    for (const [start, destList] of Object.entries(this.edges)) {
      for (const end of destList) {
        mermaidLines.push(`    ${start} --> ${end}`);
      }
    }

    // Add conditional edges (dashed lines, with labels if branches)
    for (const [source, branchDict] of Object.entries(this.branches)) {
      for (const [branchId, branch] of Object.entries(branchDict)) {
        // A "then" edge
        if (branch.then) {
          mermaidLines.push(`    ${source} -.-> ${branch.then}`);
        }
        // "ends" object mapping condition => next node
        if (branch.ends) {
          for (const [condition, target] of Object.entries(branch.ends)) {
            // Capitalize boolean conditions for consistent formatting (true→True, false→False)
            let displayCondition = condition;
            if (condition === 'true') displayCondition = 'True';
            if (condition === 'false') displayCondition = 'False';
            mermaidLines.push(`    ${source} -.|${displayCondition}|.-> ${target}`);
          }
        }
      }
    }

    mermaidLines.push('```');
    return mermaidLines.join('\n');
  }

  /**
   * Validate the compiled graph. (e.g. check for unreachable nodes)
   * @returns this
   * @throws Error if validation fails
   */
  validate(): CompiledGraph {
    this.compiled = true;

    // If no nodes, nothing to validate
    if (Object.keys(this.nodes).length === 0) {
      return this;
    }

    // BFS to see which nodes are reachable from START
    const visited = new Set<string>();
    const queue: string[] = [START];
    while (queue.length > 0) {
      const node = queue.shift()!;
      if (visited.has(node)) {
        continue;
      }
      visited.add(node);

      // follow direct edges
      if (this.edges[node]) {
        for (const nxt of this.edges[node]) {
          if (nxt !== END) {
            queue.push(nxt);
          }
        }
      }

      // follow branches
      if (this.branches[node]) {
        const branchMap = this.branches[node];
        for (const branchKey of Object.keys(branchMap)) {
          const b = branchMap[branchKey];
          if (b.then && b.then !== END) {
            queue.push(b.then);
          }
          if (b.ends) {
            for (const nxt of Object.values(b.ends)) {
              if (nxt !== END) {
                queue.push(nxt);
              }
            }
          }
        }
      }
    }

    // Compare visited with all node keys
    const allNodeKeys = Object.keys(this.nodes);
    const unreachable = allNodeKeys.filter(k => !visited.has(k));
    if (unreachable.length > 0) {
      throw new Error(`Unreachable nodes detected: ${unreachable.join(', ')}`);
    }

    return this;
  }

  /**
   * Run the workflow asynchronously with given input data.
   * 
   * @param inputData - Input to the START node
   * @param callback - Optional callback function for node execution messages
   * @returns Final result from the workflow
   */
  async executeAsync<InputType = any, OutputType = any>(
    inputData: InputType, 
    callback?: (message: string) => void
  ): Promise<OutputType> {
    // We'll do a queue-based BFS approach
    // Each item in the queue is [nodeName, dataForNode]
    const queue: [string, any][] = [];
    const visited = new Set<string>();

    queue.push([START, inputData]);
    let state: any = inputData; // track last computed value

    while (queue.length > 0) {
      const [nodeName, nodeInput] = queue.shift()!;

      if (nodeName === END) {
        return state as OutputType;
      }

      const visitKey = `${nodeName}:${JSON.stringify(nodeInput)}`;
      if (visited.has(visitKey)) {
        // Already processed this node+input combination
        continue;
      }
      visited.add(visitKey);

      // Execute the node
      const result = await this._executeNode(nodeName, nodeInput, callback);
      if (nodeName !== START && nodeName !== END) {
        state = result;
      }

      // Handle branches, if any
      if (this.branches[nodeName]) {
        for (const branch of Object.values(this.branches[nodeName])) {
          const pathVal = branch.path(nodeInput);
          // If there's a 'then' node, unconditionally queue it
          if (branch.then) {
            queue.push([branch.then, nodeInput]);
          }
          // If 'ends' is defined, see if pathVal is a key
          if (branch.ends && branch.ends.hasOwnProperty(pathVal)) {
            queue.push([branch.ends[pathVal], nodeInput]);
          }
        }
      } 
      // Otherwise, follow normal edges
      else if (this.edges[nodeName]) {
        for (const nxt of this.edges[nodeName]) {
          queue.push([nxt, result]);
        }
      }
    }

    // If we exit the loop, we never hit END
    return state as OutputType;
  }

  /**
   * Synchronous execution of the workflow
   * 
   * WARNING: This method doesn't actually work synchronously in JavaScript!
   * It's just a compatibility wrapper that logs a warning.
   * 
   * @param inputData - The input data to pass to the entry point
   * @param callback - Optional callback function for node execution messages
   * @returns The final result after running the workflow
   */
  execute<InputType = any, OutputType = any>(
    inputData: InputType,
    callback?: (message: string) => void
  ): Promise<OutputType> {
    console.warn(
      'WARNING: execute() is not truly synchronous in JavaScript.\n' +
      'Always use executeAsync() instead for proper async/await handling.\n' +
      'This method only exists for API compatibility.'
    );
    
    // Just delegate to executeAsync
    return this.executeAsync(inputData, callback);
  }

  /**
   * Core logic for executing a single node, including retry logic and optional error handlers.
   * 
   * @param nodeName - Name of the node to execute
   * @param nodeInput - Input data for the node
   * @param callback - Optional callback function for node execution messages
   * @returns Result of node execution
   * @private
   */
  private async _executeNode(
    nodeName: string, 
    nodeInput: any,
    callback?: (message: string) => void
  ): Promise<any> {
    if (nodeName === START || nodeName === END) {
      return nodeInput;
    }

    const spec = this.nodes[nodeName];
    let attempts = 0;

    while (true) {
      try {
        const maybeAsync = spec.action(nodeInput, callback);
        const result = maybeAsync instanceof Promise 
          ? await maybeAsync 
          : maybeAsync;

        // If the node has a callback, call it after successful execution
        if (spec.callback) {
          spec.callback(`Node ${nodeName} executed successfully`);
        }
        return result;
      } catch (err) {
        attempts++;
        if (attempts > spec.retryCount) {
          if (spec.errorHandler) {
            // Send the error to the user-provided error handler
            return spec.errorHandler(err as Error, nodeInput);
          }
          throw new ExecutionError(`Node "${nodeName}" failed after ${attempts} attempts: ${(err as Error).message}`);
        }
        // Wait a bit and retry
        await delay(spec.retryDelay * 1000);
      }
    }
  }
} 