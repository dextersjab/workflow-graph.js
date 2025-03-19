/**
 * Example using the workflow-graph package with TypeScript
 */

import { WorkflowGraph } from 'workflow-graph';

// Define task functions with TypeScript types
function add(data: number, callback?: (msg: string) => void): number {
  const result = data + 1;
  if (callback) {
    callback(`Added 1: ${data} -> ${result}`);
  }
  return result;
}

function isEven(data: number): boolean {
  return data % 2 === 0;
}

function handleEven(data: number): string {
  return `Even: ${data}`;
}

function handleOdd(data: number): string {
  return `Odd: ${data}`;
}

// Create and configure the workflow graph
const graph = new WorkflowGraph();

// Add nodes with explicit type parameters
graph.addNode<number, number>('addition', add);
graph.addNode<number, boolean>('is_even_check', isEven);
graph.addNode<number, string>('even_handler', handleEven);
graph.addNode<number, string>('odd_handler', handleOdd);

// Define starting point
graph.setEntryPoint('addition');

// Define flow between nodes
graph.addEdge('addition', 'is_even_check');

// Add conditional branching based on is_even_check result
graph.addConditionalEdges<number>(
  'is_even_check',
  isEven,  // path function
  { true: 'even_handler', false: 'odd_handler' }
);

// Set endpoints
graph.setFinishPoint('even_handler');
graph.setFinishPoint('odd_handler');

async function main() {
  // Generate and print Mermaid diagram
  console.log('\nMermaid Diagram:');
  const diagram = await graph.toMermaid();
  console.log(diagram);

  // Run with example input
  console.log('\nExecuting workflow with input 5:');
  const result = await graph.executeAsync<number, string>(5, msg => {
    console.log(`[Callback] ${msg}`);
  });
  
  console.log(`\nFinal result: ${result}`);
}

main().catch(err => console.error('Error:', err)); 