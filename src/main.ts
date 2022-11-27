import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  app.useLogger(app.get(Logger));
}

bootstrap();
