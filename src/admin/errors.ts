export abstract class PageError extends Error {
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends PageError {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class PageAlreadyExistsError extends PageError {
  readonly statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'PageAlreadyExistsError';
  }
}

export class PageNotFoundError extends PageError {
  readonly statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'PageNotFoundError';
  }
}
