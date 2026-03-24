import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
  message?: string;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        // If already formatted, return as-is
        if (response && typeof response === 'object' && 'success' in response) {
          return response as ApiResponse<T>;
        }

        // Handle paginated responses
        if (response && typeof response === 'object' && 'data' in response) {
          const { data, meta, message } = response as {
            data: T;
            meta?: ApiResponse<T>['meta'];
            message?: string;
          };

          return {
            success: true,
            data,
            meta,
            message,
            timestamp: new Date().toISOString(),
          };
        }

        // Default response
        return {
          success: true,
          data: response as T,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
