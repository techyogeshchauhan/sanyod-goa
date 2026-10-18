/** Error with an HTTP status and a stable machine-readable code, rendered by the error middleware. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, fields?: Record<string, string>) =>
  new AppError(400, 'VALIDATION_ERROR', message, fields);
export const unauthenticated = (message = 'Please login to continue', code = 'UNAUTHENTICATED') =>
  new AppError(401, code, message);
export const forbidden = (message = 'You do not have access to this resource', code = 'FORBIDDEN') =>
  new AppError(403, code, message);
export const notFound = (message = 'Not found') => new AppError(404, 'NOT_FOUND', message);
export const conflict = (code: string, message: string, fields?: Record<string, string>) =>
  new AppError(409, code, message, fields);
