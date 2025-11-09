import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // strip properties not in DTO
    forbidNonWhitelisted: true,   // throw if unexpected props are present
    transform: true,              // auto-transform payloads to DTO classes
    transformOptions: { enableImplicitConversion: true }, // allow converting primitives
    validationError: { target: false, value: false },     // cleaner error bodies
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();