import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const staticOrigins = [
  'http://localhost:3039',
  'http://localhost:5173',
  'https://voucher-ui-layout.onrender.com',
];

  const allowedOrigins = new Set([...staticOrigins, ...configuredOrigins]);
  const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  

  
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (localDevOriginPattern.test(origin) || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT || 3000);
}
bootstrap();