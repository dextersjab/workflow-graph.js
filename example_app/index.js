/**
 * Simple example using the workflow-graph package with plain JavaScript
 */

import { WorkflowGraph } from 'workflow-graph';

// Define task functions (no TypeScript types needed)
function add(data, callback) {
  const result = data + 1;
  if (callback) {
    callback(`Added 1: ${data} -> ${result}`);
  }
  return result;
}

function isEven(data) {
  return data % 2 === 0;
}

function handleEven(data) {
  return `Even: ${data}`;
}

function handleOdd(data) {
  return `Odd: ${data}`;
}

// Create and configure the workflow graph
const graph = new WorkflowGraph();

// Add nodes - notice no type parameters are needed in JavaScript
graph.addNode('addition', add);
graph.addNode('is_even_check', isEven);
graph.addNode('even_handler', handleEven);
graph.addNode('odd_handler', handleOdd);

// Define starting point
graph.setEntryPoint('addition');

// Define flow between nodes
graph.addEdge('addition', 'is_even_check');

// Add conditional branching based on is_even_check result
graph.addConditionalEdges(
  'is_even_check',
  isEven,  // path function
  { true: 'even_handler', false: 'odd_handler' }
);

// Set endpoints
graph.setFinishPoint('even_handler');
graph.setFinishPoint('odd_handler');

// Generate and print Mermaid diagram
console.log('\nMermaid Diagram:');
graph.toMermaid().then(diagram => console.log(diagram));

// Run with example input
console.log('\nExecuting workflow with input 5:');
graph.executeAsync(5, msg => {
  console.log(`[Callback] ${msg}`);
}).then(result => {
  console.log(`\nFinal result: ${result}`);
}); 