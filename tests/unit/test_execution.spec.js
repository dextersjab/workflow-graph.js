/**
 * Unit tests for workflow graph execution.
 */

const { WorkflowGraph } = require('../../src/workflow_graph');

describe('test_execution', () => {
  let graph;

  beforeEach(() => {
    graph = new WorkflowGraph();
  });

  test('test_simple_workflow_execution', () => {
    function addOne(x) {
      return x + 1;
    }

    function multiplyByTwo(x) {
      return x * 2;
    }

    graph.addNode('add', addOne);
    graph.addNode('multiply', multiplyByTwo);
    graph.addEdge('add', 'multiply');
    graph.setEntryPoint('add');
    graph.setFinishPoint('multiply');

    const result = graph.execute(1);
    // (1 + 1) * 2 = 4
    expect(result).toBe(4);
  });

  test('test_conditional_workflow_execution', () => {
    function isEven(x) {
      return x % 2 === 0;
    }

    function addOne(x) {
      return x + 1;
    }

    function multiplyByTwo(x) {
      return x * 2;
    }

    graph.addNode('check', isEven);
    graph.addNode('add', addOne);
    graph.addNode('multiply', multiplyByTwo);

    // Suppose addConditionalEdges maps a boolean to two different nodes
    graph.addConditionalEdges('check', isEven, {
      true: 'add',
      false: 'multiply'
    });

    graph.setEntryPoint('check');

    // Even input => proceed to 'add' node
    let result = graph.execute(2);
    expect(result).toBe(3);

    // Odd input => proceed to 'multiply' node
    result = graph.execute(3);
    expect(result).toBe(6);
  });

  test('test_async_node_execution', async () => {
    async function asyncAddOne(x) {
      // Simulate small delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return x + 1;
    }

    graph.addNode('async_add', asyncAddOne);
    graph.setEntryPoint('async_add');
    const result = await graph.executeAsync(1);

    expect(result).toBe(2);
  });

  test('test_callback_execution', () => {
    /**
     * Test execution with callbacks for streaming partial results.
     * This demonstrates how callbacks might stream intermediate results
     * in a real application.
     */

    const streamingResults = [];

    function processData(x) {
      const result = x * 10;
      processData.lastResult = result;
      return result;
    }

    function analyzeResult(x) {
      const result = x + 5;
      analyzeResult.lastResult = result;
      return result;
    }

    function formatOutput(x) {
      const result = x * 2;
      formatOutput.lastResult = result;
      return result;
    }

    function processCallback() {
      streamingResults.push({
        node: 'process',
        value: processData.lastResult,
        timestamp: '2024-01-01T00:00:00Z'
      });
    }

    function analyzeCallback() {
      streamingResults.push({
        node: 'analyze',
        value: analyzeResult.lastResult,
        timestamp: '2024-01-01T00:00:00Z'
      });
    }

    function formatCallback() {
      streamingResults.push({
        node: 'format',
        value: formatOutput.lastResult,
        timestamp: '2024-01-01T00:00:00Z'
      });
    }

    graph.addNode('process', processData, { callback: processCallback });
    graph.addNode('analyze', analyzeResult, { callback: analyzeCallback });
    graph.addNode('format', formatOutput, { callback: formatCallback });

    graph.addEdge('process', 'analyze');
    graph.addEdge('analyze', 'format');
    graph.setEntryPoint('process');
    graph.setFinishPoint('format');

    const finalResult = graph.execute(5);

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
