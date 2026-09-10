import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ResponseState } from "@prisma/client";

import { throwConflictForUniqueConstraint } from "../common/prisma-errors";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRepeatInstanceDto, UpdateRepeatInstanceDto } from "./dto/questionnaire-repeat-instance.dto";
import { BulkWriteResponsesDto, ResponseItemDto } from "./dto/questionnaire-response.dto";

type ModuleWithInterview = Prisma.InterviewModuleGetPayload<{ include: { interview: true } }>;
type Tx = Prisma.TransactionClient;

@Injectable()
export class QuestionnaireResponsesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listResponses(interviewId: string, moduleId: string) {
    await this.ensureModule(interviewId, moduleId);
    return this.prisma.questionnaireResponse.findMany({
      orderBy: [{ questionCode: "asc" }, { createdAt: "asc" }],
      where: { interviewModuleId: moduleId }
    });
  }

  async writeResponses(interviewId: string, moduleId: string, dto: BulkWriteResponsesDto) {
    await this.ensureModule(interviewId, moduleId);
    this.validateResponseItems(dto.responses);
    await this.validateRepeatReferences(moduleId, dto.responses);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.interviewModule.updateMany({
          data: { revision: { increment: 1 } },
          where: { id: moduleId, interviewId, revision: dto.expectedRevision }
        });

        if (updated.count !== 1) {
          const current = await tx.interviewModule.findFirst({ where: { id: moduleId, interviewId } });
          if (!current) throw new NotFoundException("Interview module not found");
          throw new ConflictException({ currentRevision: current.revision, message: "Interview module revision conflict" });
        }

        for (const response of dto.responses) {
          await this.writeResponse(tx, moduleId, response);
        }

        const [module, responses] = await Promise.all([
          tx.interviewModule.findUniqueOrThrow({ where: { id: moduleId } }),
          tx.questionnaireResponse.findMany({
            orderBy: [{ questionCode: "asc" }, { createdAt: "asc" }],
            where: { interviewModuleId: moduleId }
          })
        ]);

        return { moduleId, responses, revision: module.revision };
      });
    } catch (error) {
      throwConflictForUniqueConstraint(error, "Questionnaire response already exists for this module/question/repeat instance");
    }
  }

  async listRepeatInstances(interviewId: string, moduleId: string) {
    await this.ensureModule(interviewId, moduleId);
    return this.prisma.questionnaireRepeatInstance.findMany({
      orderBy: [{ groupCode: "asc" }, { sequenceNumber: "asc" }, { createdAt: "asc" }],
      where: { interviewModuleId: moduleId }
    });
  }

  async createRepeatInstance(interviewId: string, moduleId: string, dto: CreateRepeatInstanceDto) {
    const module = await this.ensureModule(interviewId, moduleId);
    await this.validateRepeatInstanceDto(module, dto);
    return this.prisma.questionnaireRepeatInstance.create({ data: { ...dto, interviewModuleId: moduleId } });
  }

  async updateRepeatInstance(interviewId: string, moduleId: string, repeatInstanceId: string, dto: UpdateRepeatInstanceDto) {
    const module = await this.ensureModule(interviewId, moduleId);
    const existing = await this.prisma.questionnaireRepeatInstance.findFirst({ where: { id: repeatInstanceId, interviewModuleId: moduleId } });
    if (!existing) throw new NotFoundException("Questionnaire repeat instance not found");
    await this.validateRepeatInstanceDto(module, dto, repeatInstanceId);
    return this.prisma.questionnaireRepeatInstance.update({ data: dto, where: { id: repeatInstanceId } });
  }

  async listValidationIssues(interviewId: string, moduleId: string) {
    await this.ensureModule(interviewId, moduleId);
    return this.prisma.validationIssue.findMany({
      orderBy: { createdAt: "asc" },
      where: { interviewModuleId: moduleId }
    });
  }

  private async writeResponse(tx: Tx, moduleId: string, response: ResponseItemDto) {
    const existing = await tx.questionnaireResponse.findFirst({
      where: {
        interviewModuleId: moduleId,
        questionCode: response.questionCode,
        repeatInstanceId: response.repeatInstanceId ?? null
      }
    });

    const data = this.toResponseData(moduleId, response);

    if (existing) {
      return tx.questionnaireResponse.update({ data, where: { id: existing.id } });
    }

    return tx.questionnaireResponse.create({ data });
  }

  private toResponseData(moduleId: string, response: ResponseItemDto): Prisma.QuestionnaireResponseUncheckedCreateInput {
    return {
      capturedAt: response.capturedAt ? new Date(response.capturedAt) : null,
      interviewModuleId: moduleId,
      questionCode: response.questionCode,
      rawValue: response.rawValue ?? null,
      repeatInstanceId: response.repeatInstanceId ?? null,
      responseState: response.responseState,
      valueBoolean: response.valueBoolean ?? null,
      valueDate: response.valueDate ? new Date(response.valueDate) : null,
      valueJson: response.valueJson ? (response.valueJson as Prisma.InputJsonValue) : Prisma.JsonNull,
      valueNumber: response.valueNumber ?? null,
      valueText: response.valueText ?? null
    };
  }

  private validateResponseItems(responses: ResponseItemDto[]) {
    for (const response of responses) {
      const typedValues = [response.valueText, response.valueNumber, response.valueBoolean, response.valueDate, response.valueJson].filter((value) => value !== undefined);
      if (typedValues.length > 1) {
        throw new BadRequestException("Only one typed value field may be supplied per questionnaire response");
      }

      if (response.responseState !== ResponseState.ANSWERED && typedValues.length > 1) {
        throw new BadRequestException("Non-answered response states cannot contain conflicting typed values");
      }
    }
  }

  private async validateRepeatReferences(moduleId: string, responses: ResponseItemDto[]) {
    const repeatIds = [...new Set(responses.map((response) => response.repeatInstanceId).filter((id): id is string => Boolean(id)))];
    if (repeatIds.length === 0) return;

    const repeats = await this.prisma.questionnaireRepeatInstance.findMany({ where: { id: { in: repeatIds } } });
    const repeatsById = new Map(repeats.map((repeat) => [repeat.id, repeat]));

    for (const repeatId of repeatIds) {
      const repeat = repeatsById.get(repeatId);
      if (!repeat) throw new BadRequestException(`Referenced repeat instance does not exist: ${repeatId}`);
      if (repeat.interviewModuleId !== moduleId) throw new BadRequestException("Repeat instance must belong to the selected interview module");
    }
  }

  private async validateRepeatInstanceDto(module: ModuleWithInterview, dto: CreateRepeatInstanceDto | UpdateRepeatInstanceDto, repeatInstanceId?: string) {
    if (dto.parentRepeatInstanceId) {
      if (dto.parentRepeatInstanceId === repeatInstanceId) throw new BadRequestException("Repeat instance cannot be its own parent");
      const parent = await this.prisma.questionnaireRepeatInstance.findUnique({ where: { id: dto.parentRepeatInstanceId } });
      if (!parent) throw new BadRequestException("Referenced parent repeat instance does not exist");
      if (parent.interviewModuleId !== module.id) throw new BadRequestException("Parent repeat instance must belong to the selected interview module");
    }

    if (dto.linkedPersonId && !(await this.prisma.person.findUnique({ where: { id: dto.linkedPersonId } }))) {
      throw new BadRequestException("Referenced linked person does not exist");
    }

    if (dto.linkedHouseholdMembershipId) {
      const membership = await this.prisma.householdMembership.findUnique({ include: { household: true }, where: { id: dto.linkedHouseholdMembershipId } });
      if (!membership) throw new BadRequestException("Referenced linked household membership does not exist");
      if (membership.household.projectId !== module.interview.projectId) throw new BadRequestException("Linked household membership must belong to the interview project");
    }

    if (dto.linkedBusinessEmployeeId) {
      const employee = await this.prisma.businessEmployee.findUnique({ include: { business: true }, where: { id: dto.linkedBusinessEmployeeId } });
      if (!employee) throw new BadRequestException("Referenced linked business employee does not exist");
      if (employee.business.projectId !== module.interview.projectId) throw new BadRequestException("Linked business employee must belong to the interview project");
    }

    if (dto.linkedStructureId) {
      const structure = await this.prisma.structure.findUnique({ where: { id: dto.linkedStructureId } });
      if (!structure) throw new BadRequestException("Referenced linked structure does not exist");
      if (structure.projectId !== module.interview.projectId) throw new BadRequestException("Linked structure must belong to the interview project");
    }
  }

  private async ensureModule(interviewId: string, moduleId: string) {
    const module = await this.prisma.interviewModule.findFirst({ include: { interview: true }, where: { id: moduleId, interviewId } });
    if (!module) throw new NotFoundException("Interview module not found");
    return module;
  }
}
