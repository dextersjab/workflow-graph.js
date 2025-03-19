/**
 * types.ts
 * Shared type definitions for the workflow graph components.
 */

import { NodeSpec } from './models.js';
import { Branch } from './models.js';

/**
 * Map of node names to their specs
 */
export interface Nodes {
  [nodeName: string]: NodeSpec<any, any>;
}

/**
 * Structure for branches in the workflow graph
 */
export interface Branches {
  [nodeName: string]: {
    [branchKey: string]: Branch<any>;
  };
}

/**
 * Represents a direct edge in the graph
 */
export type Edge = [string, string];

/**
 * Map of node names to their outgoing edges
 */
export interface AdjacencyList {
  [nodeName: string]: string[];
} 