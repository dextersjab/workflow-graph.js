/**
 * Unit tests for workflow graph error handling and retry functionality.
 */

import { 
  WorkflowGraph, 
  ExecutionError 
} from '../../src/workflow_graph/index.js';

// Import Jest types
import { expect, jest, test, describe, beforeEach } from '@jest/globals';

describe('test_error_handling', () => {
  let graph: WorkflowGraph;

  beforeEach(() => {
    // Re-instantiate the graph for each test
    graph = new WorkflowGraph();
  });

  test('test_retry_policy', async () => {
    let attempts = 0;

    function failingNode(x: number): number {
      attempts += 1;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return x + 1;
    }

    // We assume addNode can accept options for retries & backoff
    graph.addNode<number, number>('retry_node', failingNode, { retries: 3, backoffFactor: 0.1 });
    graph.setEntryPoint('retry_node');
    const result = await graph.executeAsync(1);

    expect(attempts).toBe(3);
    expect(result).toBe(2);
  });

  test('test_error_handler', async () => {
    function failingNode(x: number): number {
      throw new Error('Permanent failure');
    }

    function errorHandler(error: Error): number {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Permanent failure');
      return -1; // Return a fallback value
    }

    graph.addNode<number, number>('fail_node', failingNode, { onError: errorHandler });
    graph.setEntryPoint('fail_node');
    const result = await graph.executeAsync(1);

    expect(result).toBe(-1);
  });

  test('test_retry_then_error_handler', async () => {
    let attempts = 0;

    function failingNode(x: number): number {
      attempts += 1;
      throw new Error(`Failure #${attempts}`);
    }

    function errorHandler(error: Error): number {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Failure #3');
      return -1;
    }

    graph.addNode<number, number>('retry_fail_node', failingNode, {
      retries: 2,
      backoffFactor: 0.1,
      onError: errorHandler
    });
    graph.setEntryPoint('retry_fail_node');
    const result = await graph.executeAsync(1);

    // 1 initial attempt + 2 retries = 3 attempts total
    expect(attempts).toBe(3);
    expect(result).toBe(-1);
  });

  test('test_async_retry', async () => {
    let attempts = 0;

    async function asyncFailingNode(x: number): Promise<number> {
      attempts += 1;
      // Simulate a small delay
      await new Promise(resolve => setTimeout(resolve, 100));
      if (attempts < 3) {
        throw new Error('Temporary async failure');
      }
      return x + 1;
    }

    graph.addNode<number, Promise<number>>('async_retry_node', asyncFailingNode, {
      retries: 3,
      backoffFactor: 0.1
    });
    graph.setEntryPoint('async_retry_node');
    const result = await graph.executeAsync(1);

    expect(attempts).toBe(3);
    expect(result).toBe(2);
  });
}); 