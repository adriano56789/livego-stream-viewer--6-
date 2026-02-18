import { ValidationError } from 'express-validator';

export class RequestValidationError extends Error {
  statusCode = 400;
  
  constructor(public errors: ValidationError[]) {
    super('Invalid request parameters');
    
    // Only because we are extending a built-in class
    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }
  
  serializeErrors() {
    return this.errors.map(error => {
      if ('param' in error) {
        return { message: error.msg, field: error.param };
      }
      return { message: error.msg };
    });
  }
}

export class DatabaseConnectionError extends Error {
  statusCode = 500;
  reason = 'Error connecting to database';
  
  constructor() {
    super('Error connecting to database');
    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }
  
  serializeErrors() {
    return [{ message: this.reason }];
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  
  constructor() {
    super('Route not found');
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
  
  serializeErrors() {
    return [{ message: 'Not Found' }];
  }
}

export class NotAuthorizedError extends Error {
  statusCode = 401;
  
  constructor() {
    super('Not authorized');
    Object.setPrototypeOf(this, NotAuthorizedError.prototype);
  }
  
  serializeErrors() {
    return [{ message: 'Not authorized' }];
  }
}

export class BadRequestError extends Error {
  statusCode = 400;
  
  constructor(public message: string) {
    super(message);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
  
  serializeErrors() {
    return [{ message: this.message }];
  }
}
