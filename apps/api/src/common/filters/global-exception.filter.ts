import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error?: string;
  code?: string;
  data?: Record<string, unknown>;
  errors?: unknown;
  details?: Record<string, string[]>;
  timestamp: string;
  path: string;
}

const statusMessages: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Please check your request and try again.',
  [HttpStatus.UNAUTHORIZED]: 'Please sign in to continue.',
  [HttpStatus.FORBIDDEN]: 'You do not have permission to perform this action.',
  [HttpStatus.NOT_FOUND]: 'The requested resource was not found.',
  [HttpStatus.CONFLICT]: 'This record already exists.',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Please check your request and try again.',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too many requests. Please try again later.',
  [HttpStatus.INTERNAL_SERVER_ERROR]:
    'Something went wrong on our server. Please try again.',
};

function toReadableMessage(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((item) => toReadableMessage(item, ''))
      .filter(Boolean);
    return messages.length ? messages.join('. ') : fallback;
  }

  if (value && typeof value === 'object') {
    const maybeMessage = (value as { message?: unknown }).message;
    if (maybeMessage !== undefined) {
      return toReadableMessage(maybeMessage, fallback);
    }
  }

  return fallback;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const method = request?.method ?? 'UNKNOWN';
    const path = request?.originalUrl ?? request?.url ?? 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = statusMessages[status];
    let error = 'Internal Server Error';
    let code: string | undefined;
    let data: Record<string, unknown> | undefined;
    let errors: unknown;
    let details: Record<string, string[]> | undefined;

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = toReadableMessage(
          responseObj.message,
          exception.message || statusMessages[status],
        );
        error =
          typeof responseObj.error === 'string'
            ? responseObj.error
            : statusMessages[status] || 'Error';
        code =
          typeof responseObj.code === 'string' ? responseObj.code : undefined;
        errors = responseObj.errors;
        if (responseObj.data && typeof responseObj.data === 'object') {
          data = responseObj.data as Record<string, unknown>;
        }
        if (responseObj.details) {
          details = responseObj.details as Record<string, string[]>;
        }

        const extraData = Object.fromEntries(
          Object.entries(responseObj).filter(
            ([key]) =>
              ![
                'statusCode',
                'message',
                'error',
                'code',
                'data',
                'details',
                'errors',
              ].includes(key),
          ),
        );
        if (Object.keys(extraData).length > 0) {
          data = { ...data, ...extraData };
        }
      }
    }

    // Handle Prisma errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Database Error';

      switch (exception.code) {
        case 'P2002': {
          const field = (exception.meta?.target as string[])?.[0] || 'field';
          message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
          break;
        }
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
        case 'P2003':
          message = 'Related record not found';
          break;
        case 'P2014':
          message = 'Invalid relation';
          break;
        case 'P2011':
          message = 'Null constraint violation';
          break;
        default:
          message = `Database error: ${exception.code}`;
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation error';
      error = 'Validation Error';
    }

    if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Unknown database request error';
    }

    // Handle validation errors from class-validator
    if (
      exception instanceof Error &&
      exception.message.includes('validation failed')
    ) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      error = 'Validation Error';
    }

    // Log the error
    this.logger.error(
      `Exception [${method} ${path}]: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path,
    };

    if (code) {
      errorResponse.code = code;
    }

    if (data) {
      errorResponse.data = data;
    }

    if (errors) {
      errorResponse.errors = errors;
    }

    if (details) {
      errorResponse.details = details;
    }

    // Add stack trace in development
    if (
      process.env.NODE_ENV === 'development' &&
      exception instanceof Error &&
      status === HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      (errorResponse as ErrorResponse & { stack?: string }).stack =
        exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}
