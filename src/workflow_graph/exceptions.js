/**
 * exceptions.js
 * Custom exceptions for the workflow graph module.
 */

class WorkflowGraphError extends Error {
    constructor(message) {
      super(message);
      this.name = 'WorkflowGraphError';
    }
  }
  
  class InvalidNodeNameError extends WorkflowGraphError {
    constructor(message) {
      super(message);
      this.name = 'InvalidNodeNameError';
    }
  }
  
  class DuplicateNodeError extends WorkflowGraphError {
    constructor(message) {
      super(message);
      this.name = 'DuplicateNodeError';
    }
  }
  
  class InvalidEdgeError extends WorkflowGraphError {
    constructor(message) {
      super(message);
      this.name = 'InvalidEdgeError';
    }
  }
  
  class TypeMismatchError extends WorkflowGraphError {
    constructor(message) {
      super(message);
      this.name = 'TypeMismatchError';
    }
  }
  
  class ExecutionError extends WorkflowGraphError {
    constructor(message) {
      super(message);
      this.name = 'ExecutionError';
    }
  }
  
  export {
    WorkflowGraphError,
    InvalidNodeNameError,
    DuplicateNodeError,
    InvalidEdgeError,
    TypeMismatchError,
    ExecutionError
  };
  