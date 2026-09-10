import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { ListQuestionnaireVersionsDto } from "./dto/list-questionnaire-versions.dto";

@Injectable()
export class QuestionnaireVersionsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll(query: ListQuestionnaireVersionsDto) {
    return this.prisma.questionnaireVersion.findMany({
      orderBy: [{ moduleType: "asc" }, { versionCode: "asc" }],
      where: {
        isActive: query.isActive,
        moduleType: query.moduleType,
        projectId: query.projectId
      }
    });
  }

  async findOne(id: string) {
    const version = await this.prisma.questionnaireVersion.findUnique({ where: { id } });

    if (!version) {
      throw new NotFoundException("Questionnaire version not found");
    }

    return version;
  }
}
