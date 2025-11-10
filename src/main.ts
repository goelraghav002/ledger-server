import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS (required for your Expo / mobile app frontend)
  app.enableCors({
    origin: true, // reflect request origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
    credentials: true,
  });

  // ✅ Global validation (as you already had)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip extra props
      forbidNonWhitelisted: true, // throw if unexpected props
      transform: true, // auto-transform types
      transformOptions: { enableImplicitConversion: true },
      validationError: { target: false, value: false },
    }),
  );

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();