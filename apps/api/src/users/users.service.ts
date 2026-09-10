import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { throwConflictForUniqueConstraint } from "../common/prisma-errors";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    try {
      return await this.prisma.user.create({ data: dto });
    } catch (error) {
      throwConflictForUniqueConstraint(error, "User email already exists");
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    try {
      return await this.prisma.user.update({ where: { id }, data: dto });
    } catch (error) {
      throwConflictForUniqueConstraint(error, "User email already exists");
    }
  }
}
