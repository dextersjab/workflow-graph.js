/**
 * example_usage.ts
 * Node.js port of the Python example_usage.py.
 */

import { WorkflowGraph } from './src/workflow_graph/index.js';

// Define basic node functions with TypeScript types
function add(data: number, callback?: (message: string) => void): number {
  const result = data + 1;
  if (callback) {
    callback(`add: ${data} -> ${result}`);
  }
  return result;
}

function isEven(data: number, callback?: (message: string) => void): boolean {
  const result = (data % 2) === 0;
  if (callback) {
    callback(`is_even: ${data} -> ${result}`);
  }
  return result;
}

function handleEven(data: number, callback?: (message: string) => void): string {
  if (callback) {
    callback(`Handling even number: ${data}`);
  }
  return `Even: ${data}`;
}

function handleOdd(data: number, callback?: (message: string) => void): string {
  if (callback) {
    callback(`Handling odd number: ${data}`);
  }
  return `Odd: ${data}`;
}

// Create the WorkflowGraph
const graph = new WorkflowGraph();

// Add nodes to the graph
graph.addNode<number, number>('addition', (data, cb) => add(data, cb));
graph.addNode<number, boolean>('is_even_check', (data, cb) => isEven(data, cb));
graph.addNode<number, string>('even_handler', (data, cb) => handleEven(data, cb));
graph.addNode<number, string>('odd_handler', (data, cb) => handleOdd(data, cb));

// Define edges for the main workflow
graph.setEntryPoint('addition');
graph.addEdge('addition', 'is_even_check');

// Define conditional edges based on whether the number is even or odd
graph.addConditionalEdges(
  'is_even_check',
  // We can reuse our isEven function, or define an inline function
  (d) => isEven(d),
  {
    'true': 'even_handler',
    'false': 'odd_handler'
  }
);

// Mark finish points
graph.setFinishPoint('even_handler');
graph.setFinishPoint('odd_handler');

// Main async function to run everything
async function main() {
  // Compile the graph (includes validation)
  const compiledGraph = await graph.compile();

  // Generate and print Mermaid diagram
  console.log('\nMermaid Diagram Representation:');
  console.log(await graph.toMermaid());

  // Run with an example input
  await runWorkflow(5);
  console.log('Workflow complete.');
}

// Asynchronously execute the workflow
async function runWorkflow(inputData: number): Promise<void> {
  /**
   * graph.executeAsync(inputData, callback)
   * invokes each node's action as action(nodeInput, callback).
   *
   * The `callback` argument here can be used to log debug messages
   * or partial results each time a node executes.
   */
  const finalResult = await graph.executeAsync<number, string>(inputData, (msg) => {
    console.log('[Node callback]:', msg);
  });
  
  console.log(`\nFinal Result: ${finalResult}`);
}

// Run the main function and catch any errors
main().catch((err) => console.error('Workflow error:', err)); 