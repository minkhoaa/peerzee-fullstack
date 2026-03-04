import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { MikroORM } from '@mikro-orm/core';
import { seedIceBreakers } from './seeds/ice-breakers.seed';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Exiting.');
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global API prefix - MUST be set before Swagger
  app.setGlobalPrefix('api');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Peerzee API')
    .setDescription('The Peerzee API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const port = process.env.SERVER_PORT || process.env.PORT || 9898;

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'https://demo-peerzee.centralindia.cloudapp.azure.com',
      'https://peerzee.centralindia.cloudapp.azure.com',
    ],
    credentials: true,
  });
  await app.listen(port);

  // Run seeds
  const orm = app.get(MikroORM);
  await seedIceBreakers(orm.em);

  console.log(`Application running on port ${port}`);
}
bootstrap();
