/**
 * models.js
 * Data models for workflow graph components.
 *
 * NodeSpec: describes a node's action, retries, callbacks, etc.
 * Branch: describes a conditional branch with a path function and next-node mapping.
 */

/**
 * NodeSpec class that holds metadata for each node in the graph.
 * 
 * @typedef {Object} NodeSpecOptions
 * @property {function} action - The function to execute for this node
 * @property {Object} [metadata] - Arbitrary metadata
 * @property {function} [errorHandler] - Called if retries are exhausted
 * @property {function} [callback] - Called after node execution
 * @property {number} [retryCount] - Number of times to retry
 * @property {number} [retryDelay] - Delay (in seconds) between retries
 * @property {function} [inputType] - Optional type check for node input
 * @property {function} [outputType] - Optional type check for node output
 */
class NodeSpec {
    /**
     * @param {NodeSpecOptions} options 
     */
    constructor(options) {
      this.action = options.action;
      this.metadata = options.metadata || {};
      this.inputType = options.inputType || null;
      this.outputType = options.outputType || null;
      
      // Handle retry settings with different possible option names
      this.retryCount = options.retries || options.retryCount || 0;
      this.retryDelay = options.backoffFactor || options.retryDelay || 0.1;
      
      // Handle error callback with different possible option names
      this.errorHandler = options.onError || options.errorHandler || null;
      this.callback = options.callback || null;
    }
  }
  
  /**
   * Branch class that holds data for conditional branching.
   * @typedef {Object} BranchOptions
   * @property {function} path - The function used to determine which branch to follow
   * @property {Object} [ends] - Map of path-value => next node name
   * @property {string} [then] - Next node name if unconditional or post-check
   */
  class Branch {
    /**
     * @param {function} pathFn - A function that returns a value used to choose the next node
     * @param {Object<string, string>} [ends] - An object mapping condition => node name
     * @param {string} [thenNode] - A node name to go to unconditionally
     */
    constructor(pathFn, ends = null, thenNode = null) {
      this.path = pathFn;
      this.ends = ends;
      this.then = thenNode;
    }
  }
  
  export {
    NodeSpec,
    Branch
  };
  