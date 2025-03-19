# workflow-graph.js

A lightweight TypeScript library for defining, validating, and executing workflow graphs.

## Features

- **Graph-based workflows**: Define your business processes as directed acyclic graphs
- **Conditional branching**: Dynamic flow control based on node outputs
- **Error handling**: Robust retry mechanisms and error callbacks
- **Validation**: Ensure your workflow is properly constructed before execution
- **Visualization**: Generate Mermaid diagrams for your workflows
- **TypeScript support**: Full TypeScript type definitions included

## Installation

```bash
npm install workflow-graph
```

## Quick Start

### JavaScript

```javascript
import { WorkflowGraph } from 'workflow-graph';

// Create a new workflow
const workflow = new WorkflowGraph();

// Define nodes (tasks)
workflow.addNode('fetchData', async () => {
  return { user: 'john', status: 'active' };
});

workflow.addNode('processResult', (data) => {
  return { processed: true, ...data };
});

// Connect the nodes
workflow.setEntryPoint('fetchData')
  .addEdge('fetchData', 'processResult')
  .setFinishPoint('processResult');

// Run the workflow
const executable = workflow.compile();
executable.executeAsync()
  .then(result => console.log(result))
  .catch(err => console.error(err));
```

### TypeScript

```typescript
import { WorkflowGraph } from 'workflow-graph';

// Create a new workflow
const workflow = new WorkflowGraph();

interface UserData {
  user: string;
  status: string;
}

interface ProcessedData extends UserData {
  processed: boolean;
}

// Define nodes (tasks) with type information
workflow.addNode<void, UserData>('fetchData', async () => {
  return { user: 'john', status: 'active' };
});

workflow.addNode<UserData, ProcessedData>('processResult', (data) => {
  return { processed: true, ...data };
});

// Connect the nodes
workflow.setEntryPoint('fetchData')
  .addEdge('fetchData', 'processResult')
  .setFinishPoint('processResult');

// Run the workflow
async function main() {
  const executable = await workflow.compile();
  const result = await executable.executeAsync<void, ProcessedData>();
  console.log(result);
}

main().catch(err => console.error(err));
```

## Documentation

See the [src/workflow_graph/README.md](src/workflow_graph/README.md) for detailed documentation.

## Examples

Check out the [examples](examples) directory for more usage examples, or the [example_usage.ts](example_usage.ts) file in the root directory.

## Development

```bash
# Install dependencies
npm install

# Build the TypeScript files
npm run build

# Run the example
npm run start:ts

# Build and run the example with specific output directory
npm run build:example
```

## License

MIT
