import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return health status', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('ok');
      expect(result.message).toBe('KWIKSELLER API is running');
      expect(result.timestamp).toBeDefined();
    });

    it('should return API info', () => {
      const result = appController.getInfo();
      expect(result.name).toBe('@kwikseller/api');
      expect(result.version).toBe('0.0.1');
    });
  });
});
