/**
 * index.ts
 * Barrel file that re-exports everything from the submodules.
 */

import { WorkflowGraph } from './builder.js';
import { CompiledGraph } from './executor.js';
import { START, END } from './constants.js';
import {
  WorkflowGraphError,
  InvalidNodeNameError,
  DuplicateNodeError,
  InvalidEdgeError,
  TypeMismatchError,
  ExecutionError
} from './exceptions.js';
import { 
  NodeSpec, 
  Branch, 
  NodeAction,
  PathFunction,
  ErrorHandler,
  TypeCheck,
  NodeSpecOptions,
  BranchEnds
} from './models.js';
import {
  Nodes,
  Branches,
  Edge,
  AdjacencyList
} from './types.js';

// Export all public API components
export {
  // Core classes
  WorkflowGraph,
  CompiledGraph,
  
  // Models
  NodeSpec,
  Branch,
  
  // Types
  NodeAction,
  PathFunction,
  ErrorHandler,
  TypeCheck,
  NodeSpecOptions,
  BranchEnds,
  Nodes,
  Branches,
  Edge,
  AdjacencyList,
  
  // Constants
  START,
  END,
  
  // Exceptions
  WorkflowGraphError,
  InvalidNodeNameError,
  DuplicateNodeError,
  InvalidEdgeError,
  TypeMismatchError,
  ExecutionError
}; 