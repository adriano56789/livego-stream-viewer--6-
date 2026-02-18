import { ValidationError } from 'express-validator';

// Interface para erros de validação
interface IValidationError {
  message: string;
  field?: string;
}

// Classe base para erros personalizados
export abstract class CustomError extends Error {
  abstract statusCode: number;
  
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
  }
  
  abstract serializeErrors(): IValidationError[];
}

// Erro de validação de requisição
export class RequestValidationError extends CustomError {
  statusCode = 400;
  
  constructor(public errors: ValidationError[]) {
    super('Invalid request parameters');
    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }
  
  serializeErrors(): IValidationError[] {
    return this.errors.map(error => {
      if ('param' in error) {
        return { 
          message: String(error.msg), 
          field: String(error.param) 
        };
      }
      return { message: String(error.msg) };
    });
  }
}

// Erro para recursos não encontrados
export class NotFoundError extends CustomError {
  statusCode = 404;
  
  constructor(message: string = 'Resource not found') {
    super(message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
  
  serializeErrors(): IValidationError[] {
    return [{ message: this.message }];
  }
}

// Erro para requisições inválidas
export class BadRequestError extends CustomError {
  statusCode = 400;
  
  constructor(message: string = 'Bad request') {
    super(message);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
  
  serializeErrors(): IValidationError[] {
    return [{ message: this.message }];
  }
}

// Erro de conexão com o banco de dados
export class DatabaseConnectionError extends CustomError {
  statusCode = 500;
  
  constructor() {
    super('Error connecting to database');
    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }
  
  serializeErrors(): IValidationError[] {
    return [{ message: 'Error connecting to database' }];
  }
}

// Erro para rotas não encontradas
export class RouteNotFoundError extends CustomError {
  statusCode = 404;
  
  constructor() {
    super('Route not found');
    Object.setPrototypeOf(this, RouteNotFoundError.prototype);
  }
  
  serializeErrors(): IValidationError[] {
    return [{ message: 'Route not found' }];
  }
}

// Erro para usuários não autorizados
export class NotAuthorizedError extends CustomError {
  statusCode = 401;
  
  constructor(message: string = 'Not authorized') {
    super(message);
    Object.setPrototypeOf(this, NotAuthorizedError.prototype);
  }
  
  serializeErrors(): IValidationError[] {
    return [{ message: this.message }];
  }
}

// Erro para requisições proibidas
export class ForbiddenError extends CustomError {
  statusCode = 403;
  
  constructor(message: string = 'Forbidden') {
    super(message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
  
  serializeErrors(): IValidationError[] {
    return [{ message: this.message }];
  }
}
