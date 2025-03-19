# WorkflowGraph package

This package provides a lightweight framework for building and executing directed, computational workflow graphs in TypeScript. It allows you to define nodes as functions, connect them with edges, and execute the workflow with input data.

## Modules

- `builder.ts`: Contains the `WorkflowGraph` class for constructing and validating workflow graphs
- `executor.ts`: Contains the `CompiledGraph` class for executing workflow graphs
- `models.ts`: Defines data models for nodes and branches
- `constants.ts`: Defines constants like START and END nodes
- `exceptions.ts`: Custom exceptions for the workflow graph

## Core concepts

- **Nodes**: Functions that process data
- **Edges**: Connections between nodes that define the flow of data
- **Branches**: Conditional paths in the workflow
- **Callbacks**: Functions that can be called after node execution for streaming results

## Features

- Create directed graphs of computational tasks
- Add conditional branches based on function outputs
- Type validation between connected nodes
- Synchronous and asynchronous execution
- Error handling and retries
- Generate Mermaid diagrams of the workflow

## Basic usage

```ts
import { WorkflowGraph } from './workflow_graph';

// Create a workflow graph
const graph = new WorkflowGraph();

// Add nodes (functions)
graph.addNode("add_one", (x: number) => x + 1);
graph.addNode("multiply_by_two", (x: number) => x * 2);

// Add edges between nodes
graph.addEdge("add_one", "multiply_by_two");

// Set entry and exit points
graph.setEntryPoint("add_one");
graph.setFinishPoint("multiply_by_two");

// Execute the workflow
const result = graph.execute(5);  // Result: (5 + 1) * 2 = 12
console.log(result);
```

## Conditional branching

```ts
function isEven(x: number): boolean {
  return x % 2 === 0;
}

graph.addNode("check", isEven);
graph.addNode("handle_even", (x: number) => `Even: ${x}`);
graph.addNode("handle_odd", (x: number) => `Odd: ${x}`);

graph.addConditionalEdges(
  "check",
  isEven,    // path function
  { true: "handle_even", false: "handle_odd" }
);
```

See the project's root [README.md](../../README.md) for more detailed examples and usage instructions.