/**
 * models.ts
 * Data models for workflow graph components.
 *
 * NodeSpec: describes a node's action, retries, callbacks, etc.
 * Branch: describes a conditional branch with a path function and next-node mapping.
 */

export type NodeAction<T = any, U = any> = (data: T, callback?: (message: string) => void) => U;

export type PathFunction<T = any> = (data: T) => any;

export type ErrorHandler<T = any> = (error: Error, data: T) => any;

export type TypeCheck<T = any> = (data: any) => data is T;

export interface NodeSpecOptions<InputType = any, OutputType = any> {
  action: NodeAction<InputType, OutputType>;
  metadata?: Record<string, any>;
  errorHandler?: ErrorHandler<InputType>;
  onError?: ErrorHandler<InputType>;  // Alternative name for errorHandler
  callback?: (message: string) => void;
  retryCount?: number;
  retries?: number;  // Alternative name for retryCount
  retryDelay?: number;
  backoffFactor?: number;  // Alternative name for retryDelay
  inputType?: TypeCheck<InputType>;
  outputType?: TypeCheck<OutputType>;
}

/**
 * NodeSpec class that holds metadata for each node in the graph.
 */
export class NodeSpec<InputType = any, OutputType = any> {
  action: NodeAction<InputType, OutputType>;
  metadata: Record<string, any>;
  inputType: TypeCheck<InputType> | null;
  outputType: TypeCheck<OutputType> | null;
  retryCount: number;
  retryDelay: number;
  errorHandler: ErrorHandler<InputType> | null;
  callback: ((message: string) => void) | null;

  /**
   * @param options - Configuration options for the node
   */
  constructor(options: NodeSpecOptions<InputType, OutputType>) {
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

// Define a type that can handle string, number, and boolean keys
export type BranchConditionKey = string | number | 'true' | 'false';

export interface BranchEnds {
  [key: BranchConditionKey]: string;
}

export interface BranchOptions<T = any> {
  pathFn: PathFunction<T>;
  ends?: BranchEnds;
  thenNode?: string;
}

/**
 * Branch class that holds data for conditional branching.
 */
export class Branch<T = any> {
  path: PathFunction<T>;
  ends: BranchEnds | null;
  then: string | null;

  /**
   * @param pathFn - A function that returns a value used to choose the next node
   * @param ends - An object mapping condition => node name
   * @param thenNode - A node name to go to unconditionally
   */
  constructor(
    pathFn: PathFunction<T>,
    ends: BranchEnds | null = null,
    thenNode: string | null = null
  ) {
    this.path = pathFn;
    this.ends = ends;
    this.then = thenNode;
  }
} 