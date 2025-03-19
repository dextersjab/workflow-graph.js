/**
 * Unit tests for basic graph operations.
 */

import { 
  WorkflowGraph, 
  START, 
  END,
  InvalidNodeNameError,
  DuplicateNodeError,
  InvalidEdgeError,
  TypeMismatchError
} from '../../src/workflow_graph/index.js';

// Import Jest types
import { expect, jest, test, describe, beforeEach } from '@jest/globals';

describe('test_graph_operations', () => {
  let graph: WorkflowGraph;

  beforeEach(() => {
    graph = new WorkflowGraph();
  });

  test('test_basic_graph_creation', () => {
    expect(graph).toBeInstanceOf(WorkflowGraph);
    expect(Object.keys(graph.nodes).length).toBe(0);
    expect(graph.edges.length).toBe(0);
  });

  test('test_add_node', () => {
    graph.addNode<number, number>('node1', x => x + 1);
    expect(graph.nodes['node1']).toBeDefined();

    function testFunc(x: number): number {
      return x * 2;
    }
    graph.addNode<number, number>('node2', testFunc);
    expect(graph.nodes['node2']).toBeDefined();
    expect(graph.nodes['node2'].action).toBe(testFunc);
  });

  test('test_add_edge', () => {
    graph.addNode<number, number>('node1', x => x + 1);
    graph.addNode<number, number>('node2', x => x * 2);
    graph.addEdge('node1', 'node2');

    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0]).toEqual(['node1', 'node2']);
  });

  test('test_reserved_node_names', () => {
    expect(() => {
      graph.addNode(START, x => x);
    }).toThrow(InvalidNodeNameError);

    expect(() => {
      graph.addNode(END, x => x);
    }).toThrow(InvalidNodeNameError);
  });

  test('test_invalid_edge', () => {
    graph.addNode<number, number>('node1', x => x + 1);

    expect(() => {
      graph.addEdge('node1', 'nonexistent');
    }).toThrow(InvalidEdgeError);

    expect(() => {
      graph.addEdge('nonexistent', 'node1');
    }).toThrow(InvalidEdgeError);
  });

  test('test_conditional_branching', () => {
    function isPositive(x: number): boolean {
      return x > 0;
    }

    function isNegative(x: number): boolean {
      return x < 0;
    }

    graph.addNode<number, boolean>('check_positive', isPositive);
    graph.addNode<number, string>('handle_positive', x => `Positive: ${x}`);
    graph.addNode<number, string>('handle_negative', x => `Negative: ${x}`);
    graph.addNode<number, string>('handle_zero', x => `Zero: ${x}`);

    graph.addConditionalEdges(
      'check_positive',
      (result) => result ? 'true' : 'false',
      {
        'true': 'handle_positive',
        'false': 'handle_negative'
      }
    );

    expect(graph.branches['check_positive']).toBeDefined();
    expect(Object.keys(graph.branches['check_positive']).length).toBe(1);
    expect(graph.branches['check_positive']['branch'].ends?.['true']).toBe('handle_positive');
    expect(graph.branches['check_positive']['branch'].ends?.['false']).toBe('handle_negative');
  });

  test('test_basic_type_checking', () => {
    function strFunc(x: string): string {
      return x.toUpperCase();
    }

    function intFunc(x: number): number {
      return Math.floor(x);
    }

    // In a real application, you'd have custom type predicates
    // For this test, we're just using simple functions
    const isString = (x: any): x is string => typeof x === 'string';
    const isNumber = (x: any): x is number => typeof x === 'number';

    graph.addNode('str_node', strFunc, {
      inputType: isString,
      outputType: isString
    });

    graph.addNode('int_node', intFunc, {
      inputType: isNumber,
      outputType: isNumber
    });

    // This should work correctly in normal execution, but we're not testing execution here
  });

  test('test_compile_workflow', async () => {
    function add1(x: number): number {
      return x + 1;
    }

    function isEven(x: number): boolean {
      return x % 2 === 0;
    }

    function toStr(x: number): string {
      return `Value: ${x}`;
    }

    function toFloat(x: string): number {
      return parseFloat(x.replace('Value: ', '')) + 0.5;
    }

    graph.addNode<number, number>('add1', add1);
    graph.addNode<number, boolean>('isEven', isEven);
    graph.addNode<number, string>('toStr', toStr);
    graph.addNode<string, number>('toFloat', toFloat);

    graph.setEntryPoint('add1');
    graph.addEdge('add1', 'isEven');
    
    graph.addConditionalEdges(
      'isEven',
      result => result ? 'true' : 'false',
      {
        'true': 'toStr',
        'false': 'add1'  // Loop back to add1 if not even
      }
    );
    
    graph.addEdge('toStr', 'toFloat');
    graph.setFinishPoint('toFloat');

    const compiled = await graph.compile();
    expect(compiled).toBeDefined();
  });

  test('test_convenience_methods', async () => {
    function add(x: number): number {
      return x + 1;
    }

    function isEven(x: number): boolean {
      return x % 2 === 0;
    }

    function handleEven(x: number): string {
      return `Even: ${x}`;
    }

    function handleOdd(x: number): string {
      return `Odd: ${x}`;
    }

    const workflow = new WorkflowGraph();
    workflow.addNode<number, number>('add', add);
    workflow.addNode<number, boolean>('isEven', isEven);
    workflow.addNode<number, string>('handleEven', handleEven);
    workflow.addNode<number, string>('handleOdd', handleOdd);

    workflow.setEntryPoint('add');
    workflow.addEdge('add', 'isEven');
    
    workflow.addConditionalEdges(
      'isEven',
      result => result ? 'true' : 'false',
      {
        'true': 'handleEven',
        'false': 'handleOdd'
      }
    );
    
    workflow.setFinishPoint('handleEven');
    workflow.setFinishPoint('handleOdd');

    // Test executeAsync convenience method
    const mockCallback = jest.fn();
    const result = await workflow.executeAsync(1, mockCallback);
    
    expect(typeof result).toBe('string');
    expect(result.includes('Even') || result.includes('Odd')).toBeTruthy();
    
    // Test toMermaid convenience method
    const mermaid = await workflow.toMermaid();
    expect(typeof mermaid).toBe('string');
    expect(mermaid.includes('mermaid')).toBeTruthy();
    expect(mermaid.includes('flowchart')).toBeTruthy();
  });
}); 