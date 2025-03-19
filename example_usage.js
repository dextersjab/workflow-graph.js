/**
 * example_usage.js
 * Node.js port of the Python example_usage.py.
 */

import { WorkflowGraph } from './src/workflow_graph/index.js';  // Fixed import path
  
  // Define basic node functions
  function add(data, callback) {
    const result = data + 1;
    if (callback) {
      callback(`add: ${data} -> ${result}`);
    }
    return result;
  }
  
  function isEven(data, callback) {
    const result = (data % 2) === 0;
    if (callback) {
      callback(`is_even: ${data} -> ${result}`);
    }
    return result;
  }
  
  function handleEven(data, callback) {
    if (callback) {
      callback(`Handling even number: ${data}`);
    }
    return `Even: ${data}`;
  }
  
  function handleOdd(data, callback) {
    if (callback) {
      callback(`Handling odd number: ${data}`);
    }
    return `Odd: ${data}`;
  }
  
  // Create the WorkflowGraph
  const graph = new WorkflowGraph();
  
  // Add nodes to the graph
  graph.addNode('addition', (data, cb) => add(data, cb));
  graph.addNode('is_even_check', (data, cb) => isEven(data, cb));
  graph.addNode('even_handler', (data, cb) => handleEven(data, cb));
  graph.addNode('odd_handler', (data, cb) => handleOdd(data, cb));
  
  // Define edges for the main workflow
  graph.setEntryPoint('addition');
  graph.addEdge('addition', 'is_even_check');
  
  // Define conditional edges based on whether the number is even or odd
  graph.addConditionalEdges(
    'is_even_check',
    // We can reuse our isEven function, or define an inline function
    (d) => isEven(d),
    {
      true: 'even_handler',
      false: 'odd_handler'
    }
  );
  
  // Mark finish points
  graph.setFinishPoint('even_handler');
  graph.setFinishPoint('odd_handler');
  
  // Compile the graph (includes validation)
  const compiledGraph = graph.compile();
  
  // Generate and print Mermaid diagram
  console.log('\nMermaid Diagram Representation:');
  console.log(graph.toMermaid());
  
  // Asynchronously execute the workflow
  async function runWorkflow(inputData) {
    /**
     * compiledGraph.executeAsync(inputData, callback)
     * invokes each node's action as action(nodeInput, callback).
     *
     * The `callback` argument here can be used to log debug messages
     * or partial results each time a node executes.
     */
    const finalResult = await compiledGraph.executeAsync(inputData, (msg) => {
      console.log('[Node callback]:', msg);
    });
    
    console.log(`\nFinal Result: ${finalResult}`);
  }
  
  // Run with an example input
  runWorkflow(5)
    .then(() => console.log('Workflow complete.'))
    .catch((err) => console.error('Workflow error:', err));
  