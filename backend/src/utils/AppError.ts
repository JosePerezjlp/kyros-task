export class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    // Maintain proper prototype chain in TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
