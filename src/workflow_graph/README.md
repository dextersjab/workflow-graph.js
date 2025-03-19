# Workflow Graph JS

A TypeScript library for building, validating, and executing workflow graphs.

## Overview

This library provides a simple yet powerful way to define and execute directed graphs of tasks, with support for:

- Sequential and parallel execution flows
- Conditional branching
- Error handling and retries
- Input/output type validation
- Execution visualization
- Full TypeScript type support

## Core Components

- **WorkflowGraph**: Builder class for defining the graph structure
- **CompiledGraph**: Executor class for running the defined workflow
- **NodeSpec**: Configuration for individual workflow nodes/tasks
- **Branch**: Represents conditional paths in the workflow

## Example Usage

### TypeScript Example

```typescript
import { WorkflowGraph } from 'workflow-graph';

// Define data types for better type safety
interface ApiData {
  status: string;
  results: any[];
}

interface ProcessedData {
  transformedResults: any[];
  timestamp: number;
}

interface DatabaseResult {
  success: boolean;
  id: string;
}

// Create a new workflow
const workflow = new WorkflowGraph();

// Add nodes (tasks) with proper type annotations
workflow.addNode<void, ApiData>('fetchData', async () => {
  // Simulating API fetch
  const data = await Promise.resolve({
    status: 'success',
    results: [1, 2, 3]
  });
  return data;
}, { 
  retryCount: 3, 
  retryDelay: 2 
});

workflow.addNode<ApiData, ProcessedData>('processData', (data) => {
  return {
    transformedResults: data.results.map(x => x * 2),
    timestamp: Date.now()
  };
});

workflow.addNode<ProcessedData, DatabaseResult>('storeResults', (results) => {
  // Simulating database save
  return {
    success: true,
    id: 'db-' + Math.random().toString(36).substring(2)
  };
});

// Define the flow
workflow.setEntryPoint('fetchData')
  .addEdge('fetchData', 'processData')
  .addEdge('processData', 'storeResults')
  .setFinishPoint('storeResults');

// Execute the workflow with async/await
async function runWorkflow() {
  // Validate and compile
  const executable = await workflow.compile();
  
  try {
    // Execute the workflow with explicit type parameters
    const result = await executable.executeAsync<void, DatabaseResult>();
    console.log('Workflow completed:', result);
  } catch (err) {
    console.error('Workflow failed:', err);
  }
}

runWorkflow();
```

### JavaScript Example

```javascript
import { WorkflowGraph } from 'workflow-graph';

// Create a new workflow
const workflow = new WorkflowGraph();

// Add nodes (tasks)
workflow.addNode('fetchData', async () => {
  // Simulating API fetch
  return {
    status: 'success',
    results: [1, 2, 3]
  };
}, { 
  retryCount: 3, 
  retryDelay: 2 
});

workflow.addNode('processData', (data) => {
  return {
    transformedResults: data.results.map(x => x * 2),
    timestamp: Date.now()
  };
});

workflow.addNode('storeResults', (results) => {
  // Simulating database save
  return {
    success: true,
    id: 'db-' + Math.random().toString(36).substring(2)
  };
});

// Define the flow
workflow.setEntryPoint('fetchData')
  .addEdge('fetchData', 'processData')
  .addEdge('processData', 'storeResults')
  .setFinishPoint('storeResults');

// Execute the workflow with async/await
async function runWorkflow() {
  // Validate and compile
  const executable = await workflow.compile();
  
  try {
    // Execute the workflow
    const result = await executable.executeAsync();
    console.log('Workflow completed:', result);
  } catch (err) {
    console.error('Workflow failed:', err);
  }
}

runWorkflow();
```

## Advanced Features

- **Conditional Branching**: Create dynamic paths based on the output of nodes
- **Visualization**: Generate Mermaid diagrams of your workflow
- **Type Checking**: Optional validation of inputs and outputs

## API Documentation

See individual modules for detailed API documentation:

- builder.ts: WorkflowGraph class
- executor.ts: CompiledGraph class
- models.ts: NodeSpec and Branch classes
- exceptions.ts: Custom error types
- constants.ts: Special node identifiers
- types.ts: Shared TypeScript interfaces

## ES Modules

This library uses ES modules throughout. Make sure to import it with the `.js` extension:

```typescript
import { WorkflowGraph } from 'workflow-graph';
```

## Async Execution

Workflow execution is always asynchronous. When executing workflows:

```typescript
// Always use executeAsync with async/await
const result = await workflow.executeAsync(inputData);
```

The library does provide an `execute()` method for compatibility, but it returns a Promise and is just an alias for `executeAsync()`.

## Error Handling and Retries

The library supports robust error handling:

```typescript
// Define an error handler type
type ErrorHandlerFn = (error: Error, data: any) => any;

// Error handler function
const errorHandler: ErrorHandlerFn = (error, inputData) => {
  console.error('Failed after retries:', error);
  return { fallback: true, data: [] };
};

// Add a node with retry options
workflow.addNode('fetch_data', fetchDataFunction, {
  retries: 3,                 // Number of retries
  backoffFactor: 0.5,         // Delay between retries (in seconds)
  onError: errorHandler       // Function to call if all retries fail
});
```

## Conditional Branches

Create paths that depend on node output values:

```typescript
// Define node functions
function processOrder(order: any): number {
  return order.amount;
}

function handleSmallOrder(order: any): string {
  return `Small order processed: ${order.id}`;
}

function handleLargeOrder(order: any): string {
  return `Large order processed: ${order.id}`;
}

// Add nodes to graph
workflow.addNode<any, number>('process_order', processOrder);
workflow.addNode<any, string>('small_order', handleSmallOrder);
workflow.addNode<any, string>('large_order', handleLargeOrder);

// Create a conditional branch based on the output of process_order
workflow.addConditionalEdges(
  'process_order',
  (orderAmount) => orderAmount > 1000 ? 'true' : 'false',
  {
    'true': 'large_order',
    'false': 'small_order'
  }
);

// Set finish points
workflow.setFinishPoint('small_order');
workflow.setFinishPoint('large_order');
```
