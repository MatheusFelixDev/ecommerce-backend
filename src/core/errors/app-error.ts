export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 400,
    code = "APP_ERROR",
    context?: Record<string, unknown>,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.context = context;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}
