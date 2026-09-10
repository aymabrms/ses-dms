import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateSurveyAreaDto } from "./dto/create-survey-area.dto";
import { ListSurveyAreasDto } from "./dto/list-survey-areas.dto";
import { UpdateSurveyAreaDto } from "./dto/update-survey-area.dto";

@Injectable()
export class SurveyAreasService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll(query: ListSurveyAreasDto) {
    return this.prisma.surveyArea.findMany({
      orderBy: { createdAt: "desc" },
      where: { projectId: query.projectId }
    });
  }

  async findOne(id: string) {
    const surveyArea = await this.prisma.surveyArea.findUnique({ where: { id } });

    if (!surveyArea) {
      throw new NotFoundException("Survey area not found");
    }

    return surveyArea;
  }

  async create(dto: CreateSurveyAreaDto) {
    await this.ensureProjectExists(dto.projectId);
    return this.prisma.surveyArea.create({ data: dto });
  }

  async update(id: string, dto: UpdateSurveyAreaDto) {
    await this.findOne(id);

    if (dto.projectId) {
      await this.ensureProjectExists(dto.projectId);
    }

    return this.prisma.surveyArea.update({ where: { id }, data: dto });
  }

  private async ensureProjectExists(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new BadRequestException("Referenced project does not exist");
    }
  }
}
