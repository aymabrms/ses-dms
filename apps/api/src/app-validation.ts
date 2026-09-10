import { ValidationPipe } from "@nestjs/common";

export function createValidationPipe() {
  return new ValidationPipe({
    forbidNonWhitelisted: true,
    transform: true,
    whitelist: true
  });
}
