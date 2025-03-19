/**
 * Unit tests for workflow graph execution.
 */

import { WorkflowGraph } from '../../src/workflow_graph/index.js';

// Import Jest types
import { expect, jest, test, describe, beforeEach } from '@jest/globals';

describe('test_execution', () => {
  let graph: WorkflowGraph;

  beforeEach(() => {
    graph = new WorkflowGraph();
  });

  test('test_simple_workflow_execution', async () => {
    function addOne(x: number): number {
      return x + 1;
    }

    function multiplyByTwo(x: number): number {
      return x * 2;
    }

    graph.addNode<number, number>('add', addOne);
    graph.addNode<number, number>('multiply', multiplyByTwo);
    graph.addEdge('add', 'multiply');
    graph.setEntryPoint('add');
    graph.setFinishPoint('multiply');

    const result = await graph.executeAsync<number, number>(1);
    // (1 + 1) * 2 = 4
    expect(result).toBe(4);
  });

  test('test_conditional_workflow_execution', async () => {
    function isEven(x: number): boolean {
      return x % 2 === 0;
    }

    function addOne(x: number): number {
      return x + 1;
    }

    function multiplyByTwo(x: number): number {
      return x * 2;
    }

    graph.addNode<number, boolean>('check', isEven);
    graph.addNode<number, number>('add', addOne);
    graph.addNode<number, number>('multiply', multiplyByTwo);

    // Suppose addConditionalEdges maps a boolean to two different nodes
    graph.addConditionalEdges<number>(
      'check', 
      isEven, 
      {
        'true': 'add',
        'false': 'multiply'
      }
    );

    graph.setEntryPoint('check');

    // Even input => proceed to 'add' node
    let result = await graph.executeAsync<number, number>(2);
    expect(result).toBe(3);

    // Odd input => proceed to 'multiply' node
    result = await graph.executeAsync<number, number>(3);
    expect(result).toBe(6);
  });

  test('test_async_node_execution', async () => {
    async function asyncAddOne(x: number): Promise<number> {
      // Simulate small delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return x + 1;
    }

    graph.addNode<number, Promise<number>>('async_add', asyncAddOne);
    graph.setEntryPoint('async_add');
    const result = await graph.executeAsync<number, number>(1);

    expect(result).toBe(2);
  });

  test('test_callback_execution', async () => {
    /**
     * Test execution with callbacks for streaming partial results.
     * This demonstrates how callbacks might stream intermediate results
     * in a real application.
     */

    interface StreamingResult {
      node: string;
      value: number;
      timestamp: string;
    }

    const streamingResults: StreamingResult[] = [];

    function processData(x: number): number {
      const result = x * 10;
      (processData as any).lastResult = result;
      return result;
    }

    function analyzeResult(x: number): number {
      const result = x + 5;
      (analyzeResult as any).lastResult = result;
      return result;
    }

    function formatOutput(x: number): number {
      const result = x * 2;
      (formatOutput as any).lastResult = result;
      return result;
    }

    function processCallback(): void {
      streamingResults.push({
        node: 'process',
        value: (processData as any).lastResult,
        timestamp: '2024-01-01T00:00:00Z'
      });
    }

    function analyzeCallback(): void {
      streamingResults.push({
        node: 'analyze',
        value: (analyzeResult as any).lastResult,
        timestamp: '2024-01-01T00:00:00Z'
      });
    }

    function formatCallback(): void {
      streamingResults.push({
        node: 'format',
        value: (formatOutput as any).lastResult,
        timestamp: '2024-01-01T00:00:00Z'
      });
    }

    graph.addNode<number, number>('process', processData, { callback: processCallback });
    graph.addNode<number, number>('analyze', analyzeResult, { callback: analyzeCallback });
    graph.addNode<number, number>('format', formatOutput, { callback: formatCallback });

    graph.addEdge('process', 'analyze');
    graph.addEdge('analyze', 'format');
    graph.setEntryPoint('process');
    graph.setFinishPoint('format');

    const finalResult = await graph.executeAsync<number, number>(5);

    expect(finalResult).toBe(110); // ((5 * 10) + 5) * 2
    expect(streamingResults).toHaveLength(3);

    expect(streamingResults[0]).toEqual({
      node: 'process',
      value: 50,
      timestamp: '2024-01-01T00:00:00Z'
    });

    expect(streamingResults[1]).toEqual({
      node: 'analyze',
      value: 55,
      timestamp: '2024-01-01T00:00:00Z'
    });

    expect(streamingResults[2]).toEqual({
      node: 'format',
      value: 110,
      timestamp: '2024-01-01T00:00:00Z'
    });
  });
}); 