import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix for all routes
  const apiVersion = process.env.API_VERSION || 'v1';
  app.setGlobalPrefix(`api/${apiVersion}`);

  // Enable CORS for all kwikseller subdomains
  app.enableCors({
    origin: [
      /^https?:\/\/([a-z0-9-]+\.)?kwikseller\.com$/,
      /^https?:\/\/([a-z0-9-]+\.)?kwikseller\.local$/,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('KWIKSELLER API')
    .setDescription('KWIKSELLER NestJS API Backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🚀 KWIKSELLER API is running on: http://localhost:${port}`);
  console.log(`📡 API endpoint: http://localhost:${port}/api/${apiVersion}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
