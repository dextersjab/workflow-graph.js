# workflow-graph.js

A lightweight JavaScript library for defining, validating, and executing workflow graphs.

## Features

- **Graph-based workflows**: Define your business processes as directed acyclic graphs
- **Conditional branching**: Dynamic flow control based on node outputs
- **Error handling**: Robust retry mechanisms and error callbacks
- **Validation**: Ensure your workflow is properly constructed before execution
- **Visualization**: Generate Mermaid diagrams for your workflows
- **TypeScript support**: Type definitions included (coming soon)

## Installation

```bash
npm install workflow-graph
```

## Quick Start

```javascript
const { WorkflowGraph } = require('workflow-graph');

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

## Documentation

See the [src/workflow_graph/README.md](src/workflow_graph/README.md) for detailed documentation.

## Examples

Check out the [examples](examples) directory for more usage examples.

## License

MIT
