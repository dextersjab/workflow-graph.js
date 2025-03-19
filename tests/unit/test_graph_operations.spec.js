/**
 * Unit tests for basic graph operations.
 */

const { WorkflowGraph, START, END } = require('../../src/workflow_graph');
// If you have custom exceptions, import them too:
// const {
//   InvalidNodeNameError,
//   DuplicateNodeError,
//   InvalidEdgeError,
//   TypeMismatchError
// } = require('../../src/workflow_graph/exceptions');

describe('test_graph_operations', () => {
  let graph;

  beforeEach(() => {
    graph = new WorkflowGraph();
  });

  test('test_basic_graph_creation', () => {
    expect(graph).toBeInstanceOf(WorkflowGraph);
    expect(Object.keys(graph.nodes).length).toBe(0);
    expect(graph.edges.length).toBe(0);
  });

  test('test_add_node', () => {
    graph.addNode('node1', x => x + 1);
    expect(graph.nodes['node1']).toBeDefined();

    function testFunc(x) {
      return x * 2;
    }
    graph.addNode(testFunc.name, testFunc);
    expect(graph.nodes['testFunc']).toBeDefined();

    graph.addNode('node3', x => x + 1, {
      metadata: { description: 'Adds one' }
    });
    expect(graph.nodes['node3'].metadata.description).toBe('Adds one');
  });

  test('test_add_node_validation', () => {
    // Example for reserved name
    expect(() => {
      graph.addNode(START, x => x);
    }).toThrow(); // e.g., throw InvalidNodeNameError

    graph.addNode('node1', x => x);
    expect(() => {
      graph.addNode('node1', x => x);
    }).toThrow(); // e.g., throw DuplicateNodeError
  });

  test('test_add_edge', () => {
    graph.addNode('node1', x => x + 1);
    graph.addNode('node2', x => x * 2);

    graph.addEdge('node1', 'node2');
    expect(graph.edges).toContainEqual(['node1', 'node2']);

    // Adding an edge with a non-existent node should throw
    expect(() => {
      graph.addEdge('non_existent', 'node2');
    }).toThrow(); // e.g., throw InvalidEdgeError
  });

  test('test_conditional_edges', () => {
    function isPositive(x) {
      return x > 0;
    }

    function isNegative(x) {
      return x <= 0;
    }

    graph.addNode('node1', x => x + 1);
    graph.addNode('node2', x => x * 2);
    graph.addNode('node3', x => x - 1);

    graph.addConditionalEdges('node1', isPositive, {
      true: 'node2',
      false: 'node3'
    });

    // For demonstration, suppose `graph.branches['node1']` tracks condition fns
    expect(Object.keys(graph.branches['node1'])).toContain('isPositive');
  });

  test('test_type_validation', () => {
    function strFunc(x) {
      // expecting x as a string
      return x + 'a';
    }

    function intFunc(x) {
      // expecting x as an integer
      return x + 1;
    }

    graph.addNode('str_node', strFunc);
    graph.addNode('int_node', intFunc);

    expect(() => {
      graph.addEdge('str_node', 'int_node');
      graph.validate();
    }).toThrow(); // e.g., throw TypeMismatchError
  });

  test('test_type_validation_with_branches', () => {
    // This test doesn't use the same graph instance as above
    const newGraph = new WorkflowGraph();

    function add1(x) {
      return x + 1;
    }

    function isEven(x) {
      return x % 2 === 0;
    }

    function toStr(x) {
      return String(x);
    }

    function toFloat(x) {
      return parseFloat(x);
    }

    newGraph.addNode('add1', add1);
    newGraph.addNode('is_even', isEven);
    newGraph.addNode('to_str', toStr);
    newGraph.addNode('to_float', toFloat);

    newGraph.setEntryPoint('add1');
    newGraph.addEdge('add1', 'is_even');
    newGraph.addConditionalEdges('is_even', isEven, {
      true: 'to_str',
      false: 'to_float'
    });

    // Should not throw
    expect(() => {
      newGraph.validate();
    }).not.toThrow();
  });

  test('test_mermaid_diagram_generation', () => {
    // Create a simple graph
    const newGraph = new WorkflowGraph();

    function add(x) {
      return x + 1;
    }

    function isEven(x) {
      return x % 2 === 0;
    }

    function handleEven(x) {
      return `Even: ${x}`;
    }

    function handleOdd(x) {
      return `Odd: ${x}`;
    }

    newGraph.addNode('add', add);
    newGraph.addNode('is_even', isEven);
    newGraph.addNode('handle_even', handleEven);
    newGraph.addNode('handle_odd', handleOdd);

    newGraph.setEntryPoint('add');
    newGraph.addEdge('add', 'is_even');

    newGraph.addConditionalEdges('is_even', isEven, {
      true: 'handle_even',
      false: 'handle_odd'
    });

    newGraph.setFinishPoint('handle_even');
    newGraph.setFinishPoint('handle_odd');

    // Suppose toMermaid returns the Mermaid diagram as a string
    const mermaid = newGraph.toMermaid();

    expect(mermaid).toContain('```mermaid');
    expect(mermaid).toContain('flowchart TD');
    expect(mermaid).toContain('__start__["START"]');
    expect(mermaid).toContain('__end__["END"]');
    expect(mermaid).toContain('add["add"]');
    expect(mermaid).toContain('is_even["is_even"]');
    expect(mermaid).toContain('handle_even["handle_even"]');
    expect(mermaid).toContain('handle_odd["handle_odd"]');
    expect(mermaid).toContain('__start__ --> add');
    expect(mermaid).toContain('add --> is_even');
    expect(mermaid).toContain('handle_even --> __end__');
    expect(mermaid).toContain('handle_odd --> __end__');
    expect(mermaid).toContain('is_even -.|True|.-> handle_even');
    expect(mermaid).toContain('is_even -.|False|.-> handle_odd');
  });
});
