// src/utils/app-error.js
// Custom error classes for consistent API error responses.
// Services throw these; the central error handler catches and formats them.

export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Machine-readable error code
   * @param {Array} [details] - Optional array of field-level error details
   */
  constructor(message, statusCode, code, details) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'The request contains invalid data.', details) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = 'Invalid email or password.') {
    super(message, 401, 'INVALID_CREDENTIALS');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found.') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class MethodNotAllowedError extends AppError {
  constructor(message = 'Method not allowed.', allowedMethods) {
    super(message, 405, 'METHOD_NOT_ALLOWED');
    this.allowedMethods = allowedMethods;
  }
}

export class ConflictError extends AppError {
  constructor(message = 'A conflict occurred with the current state of the resource.') {
    super(message, 409, 'CONFLICT');
  }
}

export class PreconditionFailedError extends AppError {
  constructor(message = 'The resource has been modified. Please reload and try again.', details) {
    super(message, 412, 'PRECONDITION_FAILED', details);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'The request body is too large.') {
    super(message, 413, 'PAYLOAD_TOO_LARGE');
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = 'Content-Type must be application/json.') {
    super(message, 415, 'UNSUPPORTED_MEDIA_TYPE');
  }
}

export class UnprocessableError extends AppError {
  constructor(message = 'The request is well-formed but violates a business rule.', details) {
    super(message, 422, 'BUSINESS_RULE_VIOLATION', details);
  }
}

export class PreconditionRequiredError extends AppError {
  constructor(message = 'The If-Match header is required for this request.') {
    super(message, 428, 'PRECONDITION_REQUIRED');
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 429, 'RATE_LIMITED');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'The service is temporarily unavailable.') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}
