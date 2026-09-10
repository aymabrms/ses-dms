import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateInterviewDto } from "./dto/create-interview.dto";
import { CreateInterviewModuleDto } from "./dto/create-interview-module.dto";
import { ListInterviewsDto } from "./dto/list-interviews.dto";
import { UpdateInterviewDto } from "./dto/update-interview.dto";

@Injectable()
export class InterviewsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll(query: ListInterviewsDto) {
    return this.prisma.interview.findMany({
      include: { modules: true, respondentPerson: true, surveyArea: true },
      orderBy: { createdAt: "desc" },
      where: {
        enumeratorUserId: query.enumeratorUserId,
        projectId: query.projectId,
        status: query.status,
        surveyAreaId: query.surveyAreaId
      }
    });
  }

  async findOne(id: string) {
    const interview = await this.prisma.interview.findUnique({
      include: { modules: true, respondentPerson: true, surveyArea: true },
      where: { id }
    });

    if (!interview) {
      throw new NotFoundException("Interview not found");
    }

    return interview;
  }

  async create(dto: CreateInterviewDto) {
    await this.validateInterviewReferences(dto.projectId, dto.surveyAreaId, dto.enumeratorUserId, dto.respondentPersonId);

    return this.prisma.interview.create({
      data: {
        enumeratorUserId: dto.enumeratorUserId,
        projectId: dto.projectId,
        respondentPersonId: dto.respondentPersonId,
        startedAt: new Date(dto.startedAt),
        surveyAreaId: dto.surveyAreaId,
        surveyDate: new Date(dto.surveyDate)
      }
    });
  }

  async update(id: string, dto: UpdateInterviewDto) {
    const existing = await this.findOne(id);
    const projectId = dto.projectId ?? existing.projectId;
    const surveyAreaId = dto.surveyAreaId ?? existing.surveyAreaId;
    const enumeratorUserId = dto.enumeratorUserId ?? existing.enumeratorUserId;
    const respondentPersonId = dto.respondentPersonId ?? existing.respondentPersonId ?? undefined;

    await this.validateInterviewReferences(projectId, surveyAreaId, enumeratorUserId, respondentPersonId);

    return this.prisma.interview.update({
      data: {
        enumeratorUserId: dto.enumeratorUserId,
        finishedAt: dto.finishedAt ? new Date(dto.finishedAt) : undefined,
        projectId: dto.projectId,
        respondentPersonId: dto.respondentPersonId,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined,
        status: dto.status,
        surveyAreaId: dto.surveyAreaId,
        surveyDate: dto.surveyDate ? new Date(dto.surveyDate) : undefined
      },
      where: { id }
    });
  }

  async findModules(interviewId: string) {
    await this.ensureInterviewExists(interviewId);
    return this.prisma.interviewModule.findMany({
      orderBy: { createdAt: "asc" },
      where: { interviewId }
    });
  }

  async createModule(interviewId: string, dto: CreateInterviewModuleDto) {
    await this.ensureInterviewExists(interviewId);

    const questionnaireVersion = await this.prisma.questionnaireVersion.findUnique({
      where: { id: dto.questionnaireVersionId }
    });

    if (!questionnaireVersion) {
      throw new BadRequestException("Referenced questionnaire version does not exist");
    }

    if (questionnaireVersion.moduleType !== dto.moduleType) {
      throw new BadRequestException("Module type must match questionnaire version module type");
    }

    await this.validateOptionalModuleContexts(dto);

    return this.prisma.interviewModule.create({ data: { ...dto, interviewId } });
  }

  private async validateInterviewReferences(
    projectId: string,
    surveyAreaId: string,
    enumeratorUserId: string,
    respondentPersonId?: string
  ) {
    const [project, surveyArea, enumerator, respondent] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: projectId } }),
      this.prisma.surveyArea.findUnique({ where: { id: surveyAreaId } }),
      this.prisma.user.findUnique({ where: { id: enumeratorUserId } }),
      respondentPersonId ? this.prisma.person.findUnique({ where: { id: respondentPersonId } }) : Promise.resolve(null)
    ]);

    if (!project) {
      throw new BadRequestException("Referenced project does not exist");
    }

    if (!surveyArea) {
      throw new BadRequestException("Referenced survey area does not exist");
    }

    if (surveyArea.projectId !== projectId) {
      throw new BadRequestException("Survey area must belong to the selected project");
    }

    if (!enumerator) {
      throw new BadRequestException("Referenced enumerator user does not exist");
    }

    if (respondentPersonId && !respondent) {
      throw new BadRequestException("Referenced respondent person does not exist");
    }
  }

  private async ensureInterviewExists(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({ where: { id: interviewId } });

    if (!interview) {
      throw new NotFoundException("Interview not found");
    }
  }

  private async validateOptionalModuleContexts(dto: CreateInterviewModuleDto) {
    if (dto.moduleType === "HOUSEHOLD" && (dto.businessId || dto.landParcelId)) {
      throw new BadRequestException("Household modules may only use householdId and optional structureId context");
    }

    if (dto.moduleType === "BUSINESS" && (dto.householdId || dto.landParcelId)) {
      throw new BadRequestException("Business modules may only use businessId and optional structureId context");
    }

    if (dto.moduleType === "LANDOWNER" && (dto.householdId || dto.businessId)) {
      throw new BadRequestException("Landowner modules may only use landParcelId and optional structureId context");
    }

    const checks: Array<Promise<unknown>> = [];

    if (dto.householdId) {
      checks.push(this.ensureContextExists("household", dto.householdId, this.prisma.household.findUnique({ where: { id: dto.householdId } })));
    }

    if (dto.businessId) {
      checks.push(this.ensureContextExists("business", dto.businessId, this.prisma.business.findUnique({ where: { id: dto.businessId } })));
    }

    if (dto.landParcelId) {
      checks.push(this.ensureContextExists("land parcel", dto.landParcelId, this.prisma.landParcel.findUnique({ where: { id: dto.landParcelId } })));
    }

    if (dto.structureId) {
      checks.push(this.ensureContextExists("structure", dto.structureId, this.prisma.structure.findUnique({ where: { id: dto.structureId } })));
    }

    await Promise.all(checks);
  }

  private async ensureContextExists(label: string, id: string, lookup: Prisma.PrismaPromise<unknown>) {
    const record = await lookup;

    if (!record) {
      throw new BadRequestException(`Referenced ${label} does not exist: ${id}`);
    }
  }
}
