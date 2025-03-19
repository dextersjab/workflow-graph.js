# Workflow Graph JS

A JavaScript library for building, validating, and executing workflow graphs.

## Overview

This library provides a simple yet powerful way to define and execute directed graphs of tasks, with support for:

- Sequential and parallel execution flows
- Conditional branching
- Error handling and retries
- Input/output type validation
- Execution visualization

## Core Components

- **WorkflowGraph**: Builder class for defining the graph structure
- **CompiledGraph**: Executor class for running the defined workflow
- **NodeSpec**: Configuration for individual workflow nodes/tasks
- **Branch**: Represents conditional paths in the workflow

## Example Usage

```javascript
const { WorkflowGraph, NodeSpec } = require('workflow-graph');

// Create a new workflow
const workflow = new WorkflowGraph();

// Add nodes (tasks)
workflow.addNode('fetchData', async () => {
  return await fetchDataFromAPI();
}, { 
  retryCount: 3, 
  retryDelay: 2 
});

workflow.addNode('processData', (data) => {
  return transformData(data);
});

workflow.addNode('storeResults', (results) => {
  return saveToDatabase(results);
});

// Define the flow
workflow.setEntryPoint('fetchData')
  .addEdge('fetchData', 'processData')
  .addEdge('processData', 'storeResults')
  .setFinishPoint('storeResults');

// Validate and compile
workflow.validate();
const executable = workflow.compile();

// Execute the workflow
executable.executeAsync({ initialData: 'starting point' })
  .then(result => console.log('Workflow completed:', result))
  .catch(err => console.error('Workflow failed:', err));
```

## Advanced Features

- **Conditional Branching**: Create dynamic paths based on the output of nodes
- **Visualization**: Generate Mermaid diagrams of your workflow
- **Type Checking**: Optional validation of inputs and outputs

## API Documentation

See individual modules for detailed API documentation:

- builder.js: WorkflowGraph class
- executor.js: CompiledGraph class
- models.js: NodeSpec and Branch classes
- exceptions.js: Custom error types
- constants.js: Special node identifiers

## ES Modules

This library uses ES modules throughout. Make sure to import it with the `.js` extension:

```javascript
import { WorkflowGraph } from './workflow_graph/index.js';
```

## Async Execution

Workflow execution is always asynchronous in JavaScript. When executing workflows:

```javascript
// Always use executeAsync with async/await
const result = await workflow.executeAsync(inputData);
```

The library does provide an `execute()` method for compatibility, but it returns a Promise and is just an alias for `executeAsync()`.

## Error Handling and Retries

The library supports robust error handling:

```javascript
// Add a node with retry options
workflow.addNode('fetch_data', fetchDataFunction, {
  retries: 3,                 // Number of retries
  backoffFactor: 0.5,         // Delay between retries (in seconds)
  onError: errorHandler       // Function to call if all retries fail
});
```

The `onError` handler will receive the error object and can return a fallback value:

```javascript
function errorHandler(error) {
  console.error('Failed after retries:', error);
  return { fallback: true, data: [] };
}
```
