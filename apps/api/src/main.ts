import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { createValidationPipe } from "./app-validation";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(createValidationPipe());

  const config = new DocumentBuilder()
    .setTitle("SES/DMS API")
    .setDescription("SES/DMS core domain API")
    .setVersion("0.1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("api/docs", app, document);
  await app.listen(3001);

  Logger.log("API available at http://localhost:3001", "Bootstrap");
}

void bootstrap();
