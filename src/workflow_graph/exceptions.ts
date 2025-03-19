/**
 * exceptions.ts
 * Custom exceptions for the workflow graph module.
 */

export class WorkflowGraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowGraphError';
    
    // This is necessary for proper instanceof checks with custom errors in TypeScript
    Object.setPrototypeOf(this, WorkflowGraphError.prototype);
  }
}

export class InvalidNodeNameError extends WorkflowGraphError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNodeNameError';
    
    Object.setPrototypeOf(this, InvalidNodeNameError.prototype);
  }
}

export class DuplicateNodeError extends WorkflowGraphError {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateNodeError';
    
    Object.setPrototypeOf(this, DuplicateNodeError.prototype);
  }
}

export class InvalidEdgeError extends WorkflowGraphError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEdgeError';
    
    Object.setPrototypeOf(this, InvalidEdgeError.prototype);
  }
}

export class TypeMismatchError extends WorkflowGraphError {
  constructor(message: string) {
    super(message);
    this.name = 'TypeMismatchError';
    
    Object.setPrototypeOf(this, TypeMismatchError.prototype);
  }
}

export class ExecutionError extends WorkflowGraphError {
  constructor(message: string) {
    super(message);
    this.name = 'ExecutionError';
    
    Object.setPrototypeOf(this, ExecutionError.prototype);
  }
} 