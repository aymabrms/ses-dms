import { ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

export function throwConflictForUniqueConstraint(error: unknown, message: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new ConflictException(message);
  }

  throw error;
}
