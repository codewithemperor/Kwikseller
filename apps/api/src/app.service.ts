import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      message: 'KWIKSELLER API is running',
      timestamp: new Date().toISOString(),
    };
  }

  getInfo() {
    return {
      name: '@kwikseller/api',
      version: '0.0.1',
      description: 'KWIKSELLER NestJS API Backend',
    };
  }
}
