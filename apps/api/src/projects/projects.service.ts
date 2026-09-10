import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { throwConflictForUniqueConstraint } from "../common/prisma-errors";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

@Injectable()
export class ProjectsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return project;
  }

  async create(dto: CreateProjectDto) {
    try {
      return await this.prisma.project.create({ data: dto });
    } catch (error) {
      throwConflictForUniqueConstraint(error, "Project code already exists");
    }
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);

    try {
      return await this.prisma.project.update({ where: { id }, data: dto });
    } catch (error) {
      throwConflictForUniqueConstraint(error, "Project code already exists");
    }
  }
}
